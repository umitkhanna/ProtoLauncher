import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  classifyHomePreviewSurface,
  extractHtmlDocument,
  generateHomePreviewHtmlRaw,
} from "@/lib/ai-home-preview";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";
import { setProjectHomePreview } from "@/lib/projects";
import { sanitizePreviewHtml } from "@/lib/sanitize-preview-html";
import { stripHtmlToPlainText } from "@/lib/strip-html-to-text";

export const maxDuration = 120;
function jsonProjectPreview(project) {
  const html = project.home_preview_html;
  const hasHtml = html != null && String(html).trim().length > 0;
  return {
    projectId: project.id,
    projectName: project.name,
    finalized: Boolean(project.requirements_finalized_at),
    html: hasHtml ? String(html) : null,
    generatedAt: project.home_preview_generated_at || null,
    note: project.home_preview_note || null,
  };
}

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

  return NextResponse.json(jsonProjectPreview(project));
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

  let force = false;
  try {
    const body = await request.json().catch(() => ({}));
    force = Boolean(body?.force);
  } catch {
    force = false;
  }

  try {
    const project = await assertProjectAccess(projectId, sessionAccessContext(session));
    if (!project) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (!project.requirements_finalized_at) {
      return NextResponse.json(
        { error: "Finalize the requirements document before generating a preview." },
        { status: 400 },
      );
    }

    const existingHtml = project.home_preview_html;
    const hasHtml = existingHtml != null && String(existingHtml).trim().length > 0;
    if (hasHtml && !force) {
      return NextResponse.json({ ok: true, cached: true });
    }

    const existingNote = project.home_preview_note;
    const wasSkipped =
      !hasHtml &&
      existingNote != null &&
      String(existingNote).trim().length > 0 &&
      !force;
    if (wasSkipped) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        note: String(existingNote),
      });
    }

    const doc = project.requirements_document;
    if (!doc || !String(doc).trim()) {
      return NextResponse.json(
        { error: "Requirements document is empty." },
        { status: 400 },
      );
    }

    const plain = stripHtmlToPlainText(String(doc));
    const classification = await classifyHomePreviewSurface({
      projectName: project.name,
      requirementsPlainText: plain,
    });

    if (!classification.eligible || classification.surface === "none") {
      const note = `Not applicable: ${classification.reason || "product has no meaningful UI home screen"}`;
      await setProjectHomePreview(projectId, { html: null, note });
      return NextResponse.json({ ok: true, skipped: true, note });
    }

    const raw = await generateHomePreviewHtmlRaw({
      projectName: project.name,
      requirementsPlainText: plain,
      surface: classification.surface,
    });
    const docHtml = extractHtmlDocument(raw);
    const safe = sanitizePreviewHtml(docHtml);
    if (!safe || !String(safe).toLowerCase().includes("<html")) {
      await setProjectHomePreview(projectId, {
        html: null,
        note: "Generation produced invalid HTML; try again with force.",
      });
      return NextResponse.json(
        { error: "Model output could not be used as HTML." },
        { status: 422 },
      );
    }

    await setProjectHomePreview(projectId, { html: safe, note: null });
    return NextResponse.json({ ok: true, generated: true });
  } catch (err) {
    console.error("home-preview generate", err);
    const msg = String(err?.message || err);
    if (msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:home-preview" },
        { status: 500 },
      );
    }
    try {
      await setProjectHomePreview(projectId, {
        html: null,
        note: `Error: ${msg.slice(0, 450)}`,
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      { error: msg || "Generation failed." },
      { status: 500 },
    );
  }
}
