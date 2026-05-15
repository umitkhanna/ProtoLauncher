import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createManualIssue } from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";
import {
  INTAKE_POLICY_CODE,
  INTAKE_POLICY_ERROR,
  validateIssueContentPolicy,
} from "@/lib/project-intake-policy";

export async function POST(request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const params = await props.params;
  const projectId = Number(params.projectId);
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const summary = typeof body?.summary === "string" ? body.summary.trim() : "";
  if (!summary) {
    return NextResponse.json({ error: "summary is required." }, { status: 400 });
  }

  const description =
    body.description != null ? String(body.description) : null;
  const acceptance_criteria =
    body.acceptance_criteria != null ? String(body.acceptance_criteria) : null;

  const policy = validateIssueContentPolicy({
    summary,
    description,
    acceptance_criteria,
    labels: body.labels != null ? String(body.labels) : null,
  });
  if (!policy.ok) {
    return NextResponse.json(
      { error: INTAKE_POLICY_ERROR, code: INTAKE_POLICY_CODE },
      { status: 422 },
    );
  }

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const id = await createManualIssue(projectId, {
      issue_type: body.issue_type,
      summary,
      description,
      acceptance_criteria,
      priority: body.priority,
      story_points: body.story_points,
      labels: body.labels,
    });
    return NextResponse.json({ ok: true, issueId: id });
  } catch (err) {
    console.error("create issue", err);
    return NextResponse.json({ error: "Could not create issue." }, { status: 500 });
  }
}
