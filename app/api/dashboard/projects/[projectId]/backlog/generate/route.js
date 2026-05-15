import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  generateJiraBacklogJsonRaw,
  parseBacklogModelOutputToItems,
} from "@/lib/ai-generate-backlog";
import {
  assertProjectAccess,
  sessionAccessContext,
} from "@/lib/project-access";
import {
  countIssues,
  insertParsedBacklogItems,
} from "@/lib/board";
import { stripHtmlToPlainText } from "@/lib/strip-html-to-text";

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

  try {
    const project = await assertProjectAccess(projectId, sessionAccessContext(session));
    if (!project) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const html = project.requirements_document;
    if (!html || !String(html).trim()) {
      return NextResponse.json(
        { error: "Add a requirements document before generating a backlog." },
        { status: 400 },
      );
    }

    const issueCount = await countIssues(projectId);
    const alreadyGenerated =
      project.backlog_generated_at != null &&
      String(project.backlog_generated_at).trim() !== "";

    if (issueCount > 0 || alreadyGenerated) {
      return NextResponse.json(
        {
          error:
            "A backlog has already been generated for this project. Regeneration is not available.",
          code: "BACKLOG_ALREADY_GENERATED",
        },
        { status: 409 },
      );
    }

    const plain = stripHtmlToPlainText(String(html));
    const raw = await generateJiraBacklogJsonRaw({
      projectName: project.name,
      requirementsPlainText: plain,
    });
    const items = parseBacklogModelOutputToItems(raw);
    await insertParsedBacklogItems(projectId, items);

    return NextResponse.json({ ok: true, count: items.length });
  } catch (err) {
    console.error("backlog generate", err);
    const msg = String(err?.message || err);
    if (msg.includes("No AI provider")) {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:board" },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: msg || "Generation failed." },
      { status: 500 },
    );
  }
}
