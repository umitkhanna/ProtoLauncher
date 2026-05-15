import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  assignIssuesToSprint,
  getSprintById,
} from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";

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

  const sprintId = Number(body?.sprintId);
  const issueIds = Array.isArray(body?.issueIds)
    ? body.issueIds.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    : [];

  if (!Number.isFinite(sprintId)) {
    return NextResponse.json({ error: "sprintId is required." }, { status: 400 });
  }
  if (!issueIds.length) {
    return NextResponse.json(
      { error: "Select at least one backlog issue." },
      { status: 400 },
    );
  }

  try {
    const project = await assertProjectAccess(projectId, sessionAccessContext(session));
    if (!project) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const sprint = await getSprintById(sprintId, projectId);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
    }

    await assignIssuesToSprint(projectId, sprintId, issueIds);
    return NextResponse.json({ ok: true, moved: issueIds.length });
  } catch (err) {
    console.error("plan sprint", err);
    return NextResponse.json(
      { error: String(err?.message || err) || "Could not plan sprint." },
      { status: 400 },
    );
  }
}
