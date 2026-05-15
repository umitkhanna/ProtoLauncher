import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";
import { insertProjectMessage, listProjectMessages } from "@/lib/team-messages";

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

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const messages = await listProjectMessages(projectId);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("project messages list", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:rbac" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
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

  const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body?.body === "string" ? body.body : "";
  try {
    const id = await insertProjectMessage(projectId, Number(session.user.id), text);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const msg = String(err?.message || err);
    return NextResponse.json({ error: msg || "Could not post message." }, { status: 400 });
  }
}
