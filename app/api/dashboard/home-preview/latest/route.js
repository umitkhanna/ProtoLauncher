import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getLatestFinalizedProjectPreviewRow,
  sessionAccessContext,
} from "@/lib/project-access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const row = await getLatestFinalizedProjectPreviewRow(sessionAccessContext(session));
    if (!row) {
      return NextResponse.json({
        projectId: null,
        projectName: null,
        finalized: false,
        html: null,
        generatedAt: null,
        note: null,
      });
    }

    const html = row.home_preview_html;
    const hasHtml = html != null && String(html).trim().length > 0;

    return NextResponse.json({
      projectId: row.project_id,
      projectName: row.name,
      finalized: true,
      html: hasHtml ? String(html) : null,
      generatedAt: row.home_preview_generated_at || null,
      note: row.home_preview_note || null,
    });
  } catch (err) {
    console.error("home-preview latest", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:home-preview" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Could not load preview." }, { status: 500 });
  }
}
