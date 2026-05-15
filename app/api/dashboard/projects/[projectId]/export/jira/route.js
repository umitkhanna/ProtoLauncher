import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSprintById, listIssuesForExport } from "@/lib/board";
import { assertProjectAccess, sessionAccessContext } from "@/lib/project-access";
import { buildJiraImportCsv } from "@/lib/jira-csv";

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

  const scope = request.nextUrl.searchParams.get("scope") || "backlog";
  const sprintIdRaw = request.nextUrl.searchParams.get("sprintId");

    const project = await assertProjectAccess(projectId, sessionAccessContext(session));
  if (!project) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let rows;
  let sprintName = "";
  if (scope === "sprint") {
    const sprintId = Number(sprintIdRaw);
    if (!Number.isFinite(sprintId)) {
      return NextResponse.json(
        { error: "sprintId query param is required when scope=sprint." },
        { status: 400 },
      );
    }
    const sprint = await getSprintById(sprintId, projectId);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found." }, { status: 404 });
    }
    sprintName = sprint.name;
    rows = await listIssuesForExport(projectId, { sprintId });
  } else {
    rows = await listIssuesForExport(projectId, { backlogOnly: true });
  }

  const csv = buildJiraImportCsv(
    rows.map((r) => ({
      summary: r.summary,
      issue_type: r.issue_type,
      description: r.description,
      acceptance_criteria: r.acceptance_criteria,
      status: r.status,
      priority: r.priority,
      story_points: r.story_points,
      labels: r.labels,
      epic_summary: r.epic_summary,
      sprint_name: r.sprint_name || sprintName,
      issue_key: r.issue_key,
    })),
    { sprintName },
  );

  const filename =
    scope === "sprint" && sprintIdRaw
      ? `jira-import-sprint-${projectId}-${sprintIdRaw}.csv`
      : `jira-import-backlog-${projectId}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
