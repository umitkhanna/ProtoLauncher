import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueBelongsToSprint, updateIssue } from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";

const STATUSES = new Set(["todo", "in_progress", "done", "blocked"]);

/**
 * Sprint-scoped status updates only (board column changes). Backlog issue
 * updates use /issues/[issueId] instead.
 */
export async function PATCH(request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const params = await props.params;
  const projectId = Number(params.projectId);
  const sprintId = Number(params.sprintId);
  const issueId = Number(params.issueId);
  if (
    !Number.isFinite(projectId) ||
    !Number.isFinite(sprintId) ||
    !Number.isFinite(issueId)
  ) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const status = body?.status;
  if (status === undefined || Object.keys(body).length !== 1) {
    return NextResponse.json(
      { error: "Body must be exactly { \"status\": \"...\" }." },
      { status: 400 },
    );
  }
  if (!STATUSES.has(String(status))) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const ok = await issueBelongsToSprint(issueId, projectId, sprintId);
  if (!ok) {
    return NextResponse.json(
      { error: "Issue not found in this sprint." },
      { status: 404 },
    );
  }

  const n = await updateIssue(issueId, projectId, { status: String(status) });
  if (!n) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
