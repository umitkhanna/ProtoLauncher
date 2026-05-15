import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listProjectsForDashboard, sessionAccessContext } from "@/lib/project-access";
import { canCreateProjects } from "@/lib/roles";
import { createProject } from "@/lib/projects";
import {
  INTAKE_POLICY_CODE,
  INTAKE_POLICY_ERROR,
  validateProjectIntakePolicy,
} from "@/lib/project-intake-policy";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }
  try {
    const projects = await listProjectsForDashboard(sessionAccessContext(session));
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("projects list", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migrations: npm run db:board && npm run db:rbac" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Could not load projects." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  if (!canCreateProjects(session.user)) {
    return NextResponse.json(
      { error: "Only customers and admins can create projects here." },
      { status: 403 },
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const name = String(body?.name ?? "").trim().slice(0, 280);
  if (!name) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const filler = (v, fallback) => {
    const s = String(v ?? "").trim();
    return s || fallback;
  };

  const intakeForPolicy = {
    name,
    startupIdea: filler(body.startupIdea, "To be captured in requirements."),
    targetAudience: filler(body.targetAudience, "To be defined."),
    businessGoals: filler(body.businessGoals, "To be defined."),
    intakeNotes: body.intakeNotes ? String(body.intakeNotes).trim().slice(0, 12_000) : "",
  };

  const policy = validateProjectIntakePolicy(intakeForPolicy);
  if (!policy.ok) {
    return NextResponse.json(
      { error: INTAKE_POLICY_ERROR, code: INTAKE_POLICY_CODE },
      { status: 422 },
    );
  }

  try {
    const projectId = await createProject(userId, {
      name: intakeForPolicy.name,
      startupIdea: intakeForPolicy.startupIdea,
      targetAudience: intakeForPolicy.targetAudience,
      businessGoals: intakeForPolicy.businessGoals,
      intakeNotes: body.intakeNotes ? String(body.intakeNotes).trim().slice(0, 12_000) : null,
    });
    return NextResponse.json({ ok: true, projectId });
  } catch (err) {
    console.error("projects POST", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Could not create project." },
      { status: 500 },
    );
  }
}
