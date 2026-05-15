import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRequirementsGenerationQueue } from "@/lib/redis-bullmq";
import { requirementsJobIdForProject } from "@/lib/requirements-job-id";
import {
  createProject,
  findReusableDraftProjectId,
  updateProjectMeta,
  userHasGeneratedRequirements,
} from "@/lib/projects";
import {
  INTAKE_POLICY_CODE,
  INTAKE_POLICY_ERROR,
  validateProjectIntakePolicy,
} from "@/lib/project-intake-policy";
import { normalizeRole, ROLES } from "@/lib/roles";
import { getUserById } from "@/lib/users";

const MAX_NAME = 200;
const MAX_TEXT = 12_000;

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const projectName =
    typeof body?.projectName === "string" ? body.projectName.trim() : "";

  const startupIdea =
    (typeof body?.startupIdea === "string" ? body.startupIdea.trim() : "") ||
    (typeof body?.projectDescription === "string"
      ? body.projectDescription.trim()
      : "");

  const targetAudience =
    typeof body?.targetAudience === "string" ? body.targetAudience.trim() : "";

  const businessGoals =
    typeof body?.businessGoals === "string" ? body.businessGoals.trim() : "";

  const intakeNotes =
    typeof body?.intakeNotes === "string" ? body.intakeNotes.trim() : "";

  const additionalProject = Boolean(body?.additionalProject);

  if (!projectName || projectName.length > MAX_NAME) {
    return NextResponse.json(
      { error: `Product or project name is required (max ${MAX_NAME} characters).` },
      { status: 400 },
    );
  }

  if (!startupIdea || startupIdea.length > MAX_TEXT) {
    return NextResponse.json(
      {
        error: `Startup idea is required (or legacy projectDescription; max ${MAX_TEXT} characters).`,
      },
      { status: 400 },
    );
  }

  if (!targetAudience || targetAudience.length > MAX_TEXT) {
    return NextResponse.json(
      {
        error: `Target audience is required (max ${MAX_TEXT} characters).`,
      },
      { status: 400 },
    );
  }

  if (!businessGoals || businessGoals.length > MAX_TEXT) {
    return NextResponse.json(
      {
        error: `Business goals are required (max ${MAX_TEXT} characters).`,
      },
      { status: 400 },
    );
  }

  if (intakeNotes.length > MAX_TEXT) {
    return NextResponse.json(
      { error: `Optional notes are too long (max ${MAX_TEXT} characters).` },
      { status: 400 },
    );
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  if (normalizeRole(session.user.role) !== ROLES.CLIENT) {
    return NextResponse.json(
      { error: "Only customer accounts can run product discovery onboarding." },
      { status: 403 },
    );
  }

  const intake = {
    name: projectName,
    startupIdea,
    targetAudience,
    businessGoals,
    intakeNotes: intakeNotes || null,
  };

  const policy = validateProjectIntakePolicy({
    name: intake.name,
    startupIdea: intake.startupIdea,
    targetAudience: intake.targetAudience,
    businessGoals: intake.businessGoals,
    intakeNotes: intake.intakeNotes ?? "",
  });
  if (!policy.ok) {
    return NextResponse.json(
      { error: INTAKE_POLICY_ERROR, code: INTAKE_POLICY_CODE },
      { status: 422 },
    );
  }

  try {
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!additionalProject && (await userHasGeneratedRequirements(userId))) {
      return NextResponse.json(
        { error: "Onboarding already completed." },
        { status: 409 },
      );
    }

    let projectId;
    if (additionalProject) {
      projectId = await createProject(userId, intake);
    } else {
      projectId = await findReusableDraftProjectId(userId);
      if (projectId) {
        await updateProjectMeta(projectId, userId, intake);
      } else {
        projectId = await createProject(userId, intake);
      }
    }

    const queue = getRequirementsGenerationQueue();
    const jobId = requirementsJobIdForProject(projectId);

    const existing = await queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state === "waiting" || state === "delayed" || state === "active") {
        const redirect = `/dashboard/onboarding/generating?jobId=${encodeURIComponent(jobId)}&projectId=${encodeURIComponent(String(projectId))}`;
        return NextResponse.json({
          ok: true,
          queued: true,
          jobId,
          projectId,
          redirect,
        });
      }
      await existing.remove().catch(() => {});
    }

    await queue.add(
      "generate",
      { userId, projectId },
      {
        jobId,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 3600, count: 500 },
        removeOnFail: { age: 86400 },
      },
    );

    const redirect = `/dashboard/onboarding/generating?jobId=${encodeURIComponent(jobId)}&projectId=${encodeURIComponent(String(projectId))}`;
    return NextResponse.json({
      ok: true,
      queued: true,
      jobId,
      projectId,
      redirect,
    });
  } catch (err) {
    console.error("requirements enqueue", err);
    const msg = String(err?.message || err);
    if (msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND")) {
      return NextResponse.json(
        { error: "Could not reach Redis. Is it running on localhost?" },
        { status: 503 },
      );
    }
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        {
          error:
            "Database is missing intake columns. Run: npm run db:intake (and npm run db:board if needed).",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Could not queue generation. Try again later." },
      { status: 500 },
    );
  }
}
