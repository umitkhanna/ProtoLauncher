import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateSprint } from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";

const STATES = new Set(["future", "active", "closed"]);

export async function PATCH(request, props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const params = await props.params;
  const projectId = Number(params.projectId);
  const sprintId = Number(params.sprintId);
  if (!Number.isFinite(projectId) || !Number.isFinite(sprintId)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patch = {};
  if (body.name != null) patch.name = String(body.name);
  if (body.goal !== undefined) patch.goal = body.goal;
  if (body.state != null) {
    const s = String(body.state);
    if (!STATES.has(s)) {
      return NextResponse.json({ error: "Invalid state." }, { status: 400 });
    }
    patch.state = s;
  }
  if (body.start_date !== undefined) patch.start_date = body.start_date;
  if (body.end_date !== undefined) patch.end_date = body.end_date;

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const n = await updateSprint(sprintId, projectId, patch);
  if (!n) {
    return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
