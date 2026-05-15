import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sanitizeRequirementsHtml } from "@/lib/sanitize-requirements-html";
import {
  finalizeRequirementsDocument,
  getProjectForRequirementsSession,
  updateRequirementsDocument,
} from "@/lib/projects";
import { normalizeRole, ROLES } from "@/lib/roles";

const MAX_HTML = 600_000;

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const htmlRaw = typeof body?.html === "string" ? body.html : "";
  const finalize = Boolean(body?.finalize);

  if (!htmlRaw || htmlRaw.length > MAX_HTML) {
    return NextResponse.json(
      { error: "Document body is missing or too large." },
      { status: 400 },
    );
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  }

  if (normalizeRole(session.user.role) !== ROLES.CLIENT) {
    return NextResponse.json(
      { error: "Only the project customer account can edit the requirements document here." },
      { status: 403 },
    );
  }

  try {
    const project = await getProjectForRequirementsSession(userId);
    if (!project) {
      return NextResponse.json(
        { error: "Complete onboarding before saving this document." },
        { status: 403 },
      );
    }

    if (project.requirements_finalized_at && finalize) {
      return NextResponse.json(
        { error: "This document is already finalized." },
        { status: 409 },
      );
    }

    if (project.requirements_finalized_at && !finalize) {
      return NextResponse.json(
        { error: "This document is finalized and cannot be edited here." },
        { status: 409 },
      );
    }

    const html = sanitizeRequirementsHtml(htmlRaw);
    const projectId = Number(project.id);

    if (finalize) {
      await finalizeRequirementsDocument(projectId, userId, html);
    } else {
      await updateRequirementsDocument(projectId, userId, html);
    }

    return NextResponse.json({ ok: true, finalized: finalize, projectId });
  } catch (err) {
    console.error("requirements save", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Database is missing the projects table. Run: npm run db:projects" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Could not save document." },
      { status: 500 },
    );
  }
}
