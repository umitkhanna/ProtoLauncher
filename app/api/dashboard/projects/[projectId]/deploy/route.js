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
    await markProjectProvisionRequested(projectId, "deploy");
    return NextResponse.json({
      ok: true,
      message:
        "Deploy to VPS has been queued (stub). Connect your provisioning pipeline and update deploy_status when complete.",
    });
  } catch (err) {
    console.error("deploy request", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Request failed." },
      { status: 500 },
    );
  }
}
