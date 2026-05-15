import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assertProjectAccess,
  canManageGitDeploy,
  sessionAccessContext,
} from "@/lib/project-access";
import { markProjectProvisionRequested } from "@/lib/team-messages";

export async function POST(_request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const ctx = sessionAccessContext(session);
  if (!canManageGitDeploy(ctx)) {
    return NextResponse.json({ error: "Managers or admins only." }, { status: 403 });
  }

  const params = await props.params;
  const projectId = Number(params.projectId);
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  }

  const project = await assertProjectAccess(projectId, ctx);
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    await markProjectProvisionRequested(projectId, "repo");
    return NextResponse.json({
      ok: true,
      message:
        "Git repository provisioning has been queued (stub). Wire CI or a worker to create the repo and update git_repo_status.",
    });
  } catch (err) {
    console.error("repo request", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Request failed." },
      { status: 500 },
    );
  }
}
