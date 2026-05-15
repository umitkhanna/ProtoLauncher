import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRequirementsGenerationQueue } from "@/lib/redis-bullmq";
import { parseProjectIdFromRequirementsJobId } from "@/lib/requirements-job-id";
import { getProjectByIdAndUser } from "@/lib/projects";

export async function GET(_request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const params = await props.params;
  const jobId = decodeURIComponent(params.jobId || "");
  const projectId = parseProjectIdFromRequirementsJobId(jobId);
  if (projectId == null) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const project = await getProjectByIdAndUser(
    projectId,
    Number(session.user.id),
  );
  if (!project) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const queue = getRequirementsGenerationQueue();
    const job = await queue.getJob(jobId);
    if (!job) {
      return NextResponse.json({ state: "absent" });
    }
    const state = await job.getState();
    return NextResponse.json({
      state,
      failedReason: job.failedReason ?? null,
    });
  } catch (err) {
    console.error("requirements job GET", err);
    return NextResponse.json(
      { error: "Could not read job status." },
      { status: 503 },
    );
  }
}
