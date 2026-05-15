import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assertProjectAccess,
  canAssignProjectMembers,
  sessionAccessContext,
} from "@/lib/project-access";
import {
  listAssignmentsForProject,
  removeProjectAssignment,
  upsertProjectAssignment,
} from "@/lib/team-messages";

export async function GET(_request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const params = await props.params;
  const projectId = Number(params.projectId);
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  }

  const ctx = sessionAccessContext(session);
  const project = await assertProjectAccess(projectId, ctx);
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!canAssignProjectMembers(ctx, Number(project.user_id))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const assignments = await listAssignmentsForProject(projectId);
    return NextResponse.json({ assignments });
  } catch (err) {
    console.error("assignments list", err);
    return NextResponse.json({ error: "Could not load assignments." }, { status: 500 });
  }
}

export async function POST(request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
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

  const assigneeUserId = Number(body?.userId);
  if (!Number.isFinite(assigneeUserId)) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const ctx = sessionAccessContext(session);
  const project = await assertProjectAccess(projectId, ctx);
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!canAssignProjectMembers(ctx, Number(project.user_id))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    await upsertProjectAssignment(projectId, assigneeUserId, Number(session.user.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("assignments add", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:rbac" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: msg || "Could not assign." }, { status: 500 });
  }
}

export async function DELETE(request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const params = await props.params;
  const projectId = Number(params.projectId);
  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "Invalid project." }, { status: 400 });
  }

  const assigneeUserId = Number(request.nextUrl.searchParams.get("userId"));
  if (!Number.isFinite(assigneeUserId)) {
    return NextResponse.json({ error: "userId query param is required." }, { status: 400 });
  }

  const ctx = sessionAccessContext(session);
  const project = await assertProjectAccess(projectId, ctx);
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (!canAssignProjectMembers(ctx, Number(project.user_id))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    await removeProjectAssignment(projectId, assigneeUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("assignments remove", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Could not remove." },
      { status: 500 },
    );
  }
}
