import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSprint, listSprints } from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";

export async function GET(_request, props) {
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

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const sprints = await listSprints(projectId);
  return NextResponse.json({ sprints });
}

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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 200) {
    return NextResponse.json({ error: "Sprint name is required." }, { status: 400 });
  }
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const id = await createSprint(projectId, { name, goal });
    return NextResponse.json({ ok: true, sprintId: id });
  } catch (err) {
    console.error("create sprint", err);
    return NextResponse.json({ error: "Could not create sprint." }, { status: 500 });
  }
}
