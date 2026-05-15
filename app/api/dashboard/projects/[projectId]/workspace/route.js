import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listBacklogIssues,
  listIssuesForSprintBoard,
  listSprints,
} from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";

export async function GET(request, props) {
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

    const sprintIdRaw = request.nextUrl.searchParams.get("sprintId");
    const sprintId =
      sprintIdRaw != null && sprintIdRaw !== ""
        ? Number(sprintIdRaw)
        : null;

    const [sprints, backlog] = await Promise.all([
      listSprints(projectId),
      listBacklogIssues(projectId),
    ]);

    let sprintIssues = [];
    if (sprintId != null && Number.isFinite(sprintId)) {
      sprintIssues = await listIssuesForSprintBoard(projectId, sprintId);
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        backlog_generated_at: project.backlog_generated_at,
        has_requirements: Boolean(
          project.requirements_document &&
            String(project.requirements_document).trim(),
        ),
      },
      sprints,
      backlog,
      sprintIssues,
    });
  } catch (err) {
    console.error("workspace GET", err);
    const msg = String(err?.message || err);
    if (msg.includes("Unknown column") || msg.includes("doesn't exist")) {
      return NextResponse.json(
        { error: "Run database migration: npm run db:board" },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Could not load workspace." }, { status: 500 });
  }
}
