import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  deleteBacklogIssue,
  getIssueSprintIdForProject,
  updateIssue,
} from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";
import {
  INTAKE_POLICY_CODE,
  INTAKE_POLICY_ERROR,
  validateIssueContentPolicy,
} from "@/lib/project-intake-policy";

const STATUSES = new Set(["todo", "in_progress", "done", "blocked"]);
const PRIORITIES = new Set(["lowest", "low", "medium", "high", "highest"]);
const ISSUE_TYPES = new Set(["epic", "story", "task", "bug", "subtask"]);

export async function PATCH(request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const params = await props.params;
  const projectId = Number(params.projectId);
  const issueId = Number(params.issueId);
  if (!Number.isFinite(projectId) || !Number.isFinite(issueId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch = {};
  if (body.summary !== undefined) {
    if (!String(body.summary).trim()) {
      return NextResponse.json(
        { error: "summary cannot be empty." },
        { status: 400 },
      );
    }
    patch.summary = body.summary;
  }
  if (body.description !== undefined) patch.description = body.description;
  if (body.acceptance_criteria !== undefined) {
    patch.acceptance_criteria = body.acceptance_criteria;
  }
  if (body.status !== undefined) {
    if (!STATUSES.has(String(body.status))) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.has(String(body.priority))) {
      return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
    }
    patch.priority = body.priority;
  }
  if (body.story_points !== undefined) patch.story_points = body.story_points;
  if (body.labels !== undefined) patch.labels = body.labels;
  if (body.rank !== undefined) patch.rank = body.rank;
  if (body.issue_type !== undefined) {
    const t = String(body.issue_type).toLowerCase();
    if (!ISSUE_TYPES.has(t)) {
      return NextResponse.json({ error: "Invalid issue_type." }, { status: 400 });
    }
    patch.issue_type = t;
  }

  const policyParts = {};
  if (body.summary !== undefined) policyParts.summary = body.summary;
  if (body.description !== undefined) policyParts.description = body.description;
  if (body.acceptance_criteria !== undefined) {
    policyParts.acceptance_criteria = body.acceptance_criteria;
  }
  if (body.labels !== undefined) policyParts.labels = body.labels;
  if (Object.keys(policyParts).length > 0) {
    const pol = validateIssueContentPolicy(policyParts);
    if (!pol.ok) {
      return NextResponse.json(
        { error: INTAKE_POLICY_ERROR, code: INTAKE_POLICY_CODE },
        { status: 422 },
      );
    }
  }

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const issueLoc = await getIssueSprintIdForProject(issueId, projectId);
  if (!issueLoc) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }
  if (issueLoc.sprint_id != null) {
    return NextResponse.json(
      {
        error:
          "This issue is in a sprint and cannot be changed from the backlog API. Use the sprint board to update status only, or move it back to the product backlog first.",
        code: "SPRINT_ISSUE_LOCKED",
      },
      { status: 403 },
    );
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update." },
      { status: 400 },
    );
  }

  const n = await updateIssue(issueId, projectId, patch);
  if (!n) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const params = await props.params;
  const projectId = Number(params.projectId);
  const issueId = Number(params.issueId);
  if (!Number.isFinite(projectId) || !Number.isFinite(issueId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const n = await deleteBacklogIssue(issueId, projectId);
  if (!n) {
    return NextResponse.json(
      {
        error:
          "Issue not found or not in the product backlog (only backlog issues can be deleted here).",
      },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
