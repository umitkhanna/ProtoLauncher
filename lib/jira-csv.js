function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function statusJiraDisplay(status) {
  const map = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
    blocked: "Blocked",
  };
  return map[status] || status;
}

function priorityJiraDisplay(priority) {
  const map = {
    lowest: "Lowest",
    low: "Low",
    medium: "Medium",
    high: "High",
    highest: "Highest",
  };
  return map[priority] || priority;
}

function typeJiraDisplay(issueType) {
  const map = {
    epic: "Epic",
    story: "Story",
    task: "Task",
    bug: "Bug",
    subtask: "Sub-task",
  };
  return map[issueType] || issueType;
}

/**
 * Jira Cloud CSV import friendly columns (see Atlassian CSV import docs).
 * @param {Array<Record<string, unknown>>} issues rows with epic_summary optional
 * @param {{ sprintName?: string }} opts
 */
export function buildJiraImportCsv(issues, opts = {}) {
  const sprintName = opts.sprintName || "";
  const headers = [
    "Summary",
    "Issue Type",
    "Description",
    "Status",
    "Priority",
    "Epic Name",
    "Story Points",
    "Labels",
    "Sprint",
    "Acceptance Criteria",
    "Issue Key (reference)",
  ];
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of issues) {
    const epicName = row.epic_summary ? String(row.epic_summary) : "";
    const sprintCell =
      row.sprint_name != null ? String(row.sprint_name) : sprintName;
    lines.push(
      [
        row.summary,
        typeJiraDisplay(String(row.issue_type)),
        row.description,
        statusJiraDisplay(String(row.status)),
        priorityJiraDisplay(String(row.priority)),
        epicName,
        row.story_points != null ? String(row.story_points) : "",
        row.labels || "",
        sprintCell,
        row.acceptance_criteria || "",
        row.issue_key || "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\r\n");
}
