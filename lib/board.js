import { getPool } from "./db";

/**
 * @deprecated use listProjectsForDashboard from @/lib/project-access
 */
export async function listProjectsForUser(userId) {
  const [rows] = await getPool().query(
    `SELECT id, name, backlog_generated_at,
            (SELECT COUNT(*) FROM issues i WHERE i.project_id = projects.id) AS issue_count
     FROM projects
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId],
  );
  return rows;
}

/**
 * @param {number} userId
 */
export async function getLatestProjectIdForUser(userId) {
  const [rows] = await getPool().query(
    "SELECT id FROM projects WHERE user_id = ? ORDER BY id DESC LIMIT 1",
    [userId],
  );
  return rows[0]?.id ?? null;
}

/**
 * @param {number} projectId
 */
export async function countIssues(projectId) {
  const [rows] = await getPool().query(
    "SELECT COUNT(*) AS c FROM issues WHERE project_id = ?",
    [projectId],
  );
  return Number(rows[0]?.c) || 0;
}

/**
 * @param {number} projectId
 */
export async function deleteAllIssuesForProject(projectId) {
  await getPool().query("DELETE FROM issues WHERE project_id = ?", [projectId]);
}

async function allocateIssueKeyInConn(conn, projectId) {
  const [rows] = await conn.query(
    "SELECT issue_key_prefix AS p, next_issue_number AS n FROM projects WHERE id = ? FOR UPDATE",
    [projectId],
  );
  const prefix = String(rows[0]?.p || "PROJ")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12) || "PROJ";
  const num = Number(rows[0]?.n) || 1;
  const issueKey = `${prefix}-${num}`;
  await conn.query(
    "UPDATE projects SET next_issue_number = next_issue_number + 1 WHERE id = ?",
    [projectId],
  );
  return issueKey;
}

async function nextBacklogRank(conn, projectId) {
  const [rows] = await conn.query(
    `SELECT COALESCE(MAX(rank), 0) + 1 AS r FROM issues WHERE project_id = ? AND sprint_id IS NULL`,
    [projectId],
  );
  return Number(rows[0]?.r) || 1;
}

async function nextSprintRank(conn, projectId, sprintId) {
  const [rows] = await conn.query(
    `SELECT COALESCE(MAX(rank), 0) + 1 AS r FROM issues WHERE project_id = ? AND sprint_id = ?`,
    [projectId, sprintId],
  );
  return Number(rows[0]?.r) || 1;
}

/**
 * Insert ordered backlog items (Epic groups: Stories follow their Epic in the array).
 * @param {number} projectId
 * @param {Array<{ issueType: string, summary: string, description?: string|null, acceptanceCriteria?: string|null, storyPoints?: number|null, priority: string }>} parsedItems
 */
export async function insertParsedBacklogItems(projectId, parsedItems) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let currentEpicId = null;
    let rank = await nextBacklogRank(conn, projectId);
    for (const item of parsedItems) {
      const issueKey = await allocateIssueKeyInConn(conn, projectId);
      const issueType = item.issueType;
      const epicId = issueType === "epic" ? null : currentEpicId;

      const [ins] = await conn.query(
        `INSERT INTO issues (
          project_id, sprint_id, epic_id, parent_id, issue_type, issue_key, summary,
          description, acceptance_criteria, status, priority, story_points, labels, rank
        ) VALUES (?, NULL, ?, NULL, ?, ?, ?, ?, ?, 'todo', ?, ?, NULL, ?)`,
        [
          projectId,
          epicId,
          issueType,
          issueKey,
          item.summary.slice(0, 500),
          item.description,
          item.acceptanceCriteria,
          item.priority,
          item.storyPoints,
          rank++,
        ],
      );
      const newId = ins.insertId;
      if (issueType === "epic") {
        currentEpicId = newId;
      }
    }
    await conn.query(
      "UPDATE projects SET backlog_generated_at = UTC_TIMESTAMP() WHERE id = ?",
      [projectId],
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/** @param {number} projectId */
export async function listSprints(projectId) {
  const [rows] = await getPool().query(
    `SELECT id, project_id, name, goal, state, start_date, end_date, sort_order
     FROM sprints WHERE project_id = ? ORDER BY sort_order ASC, id ASC`,
    [projectId],
  );
  return rows;
}

/** @param {number} sprintId @param {number} projectId */
export async function getSprintById(sprintId, projectId) {
  const [rows] = await getPool().query(
    "SELECT * FROM sprints WHERE id = ? AND project_id = ? LIMIT 1",
    [sprintId, projectId],
  );
  return rows[0] ?? null;
}

/**
 * @param {number} projectId
 * @param {{ name: string, goal?: string }} input
 */
export async function createSprint(projectId, { name, goal }) {
  const [rows] = await getPool().query(
    `SELECT COALESCE(MAX(sort_order), 0) + 1 AS s FROM sprints WHERE project_id = ?`,
    [projectId],
  );
  const sortOrder = Number(rows[0]?.s) || 0;
  const [r] = await getPool().query(
    `INSERT INTO sprints (project_id, name, goal, state, sort_order) VALUES (?, ?, ?, 'future', ?)`,
    [projectId, name.trim().slice(0, 200), goal?.trim() || null, sortOrder],
  );
  return r.insertId;
}

/**
 * @param {number} sprintId
 * @param {number} projectId
 * @param {{ name?: string, goal?: string, state?: string, start_date?: string|null, end_date?: string|null }} patch
 */
export async function updateSprint(sprintId, projectId, patch) {
  const pool = getPool();
  if (patch.state === "active") {
    await pool.query(
      `UPDATE sprints SET state = 'future', updated_at = UTC_TIMESTAMP()
       WHERE project_id = ? AND id != ? AND state = 'active'`,
      [projectId, sprintId],
    );
  }
  const fields = [];
  const vals = [];
  if (patch.name != null) {
    fields.push("name = ?");
    vals.push(String(patch.name).trim().slice(0, 200));
  }
  if (patch.goal !== undefined) {
    fields.push("goal = ?");
    vals.push(patch.goal ? String(patch.goal).trim() : null);
  }
  if (patch.state != null) {
    fields.push("state = ?");
    vals.push(patch.state);
  }
  if (patch.start_date !== undefined) {
    fields.push("start_date = ?");
    vals.push(patch.start_date || null);
  }
  if (patch.end_date !== undefined) {
    fields.push("end_date = ?");
    vals.push(patch.end_date || null);
  }
  if (!fields.length) return 0;
  fields.push("updated_at = UTC_TIMESTAMP()");
  vals.push(sprintId, projectId);
  const [r] = await pool.query(
    `UPDATE sprints SET ${fields.join(", ")} WHERE id = ? AND project_id = ?`,
    vals,
  );
  return r.affectedRows;
}

/** @param {number} projectId */
export async function listBacklogIssues(projectId) {
  const [rows] = await getPool().query(
    `SELECT i.*, e.summary AS epic_summary
     FROM issues i
     LEFT JOIN issues e ON e.id = i.epic_id
     WHERE i.project_id = ? AND i.sprint_id IS NULL
     ORDER BY i.rank ASC, i.id ASC`,
    [projectId],
  );
  return rows;
}

/**
 * @param {number} projectId
 * @param {number} sprintId
 */
export async function listIssuesForSprintBoard(projectId, sprintId) {
  const [rows] = await getPool().query(
    `SELECT i.*, e.summary AS epic_summary, s.name AS sprint_name
     FROM issues i
     LEFT JOIN issues e ON e.id = i.epic_id
     LEFT JOIN sprints s ON s.id = i.sprint_id
     WHERE i.project_id = ? AND i.sprint_id = ?
     ORDER BY FIELD(i.status, 'todo','in_progress','blocked','done'), i.rank ASC, i.id ASC`,
    [projectId, sprintId],
  );
  return rows;
}

/**
 * @param {number} issueId
 * @param {number} projectId
 * @param {Record<string, unknown>} patch
 */
export async function updateIssue(issueId, projectId, patch) {
  const fields = [];
  const vals = [];
  if (patch.summary !== undefined) {
    fields.push("summary = ?");
    vals.push(String(patch.summary).trim().slice(0, 500));
  }
  if (patch.description !== undefined) {
    fields.push("description = ?");
    vals.push(patch.description ? String(patch.description) : null);
  }
  if (patch.acceptance_criteria !== undefined) {
    fields.push("acceptance_criteria = ?");
    vals.push(
      patch.acceptance_criteria ? String(patch.acceptance_criteria) : null,
    );
  }
  if (patch.status !== undefined) {
    fields.push("status = ?");
    vals.push(patch.status);
  }
  if (patch.priority !== undefined) {
    fields.push("priority = ?");
    vals.push(patch.priority);
  }
  if (patch.story_points !== undefined) {
    fields.push("story_points = ?");
    vals.push(
      patch.story_points == null || patch.story_points === ""
        ? null
        : Number(patch.story_points),
    );
  }
  if (patch.labels !== undefined) {
    fields.push("labels = ?");
    vals.push(patch.labels ? String(patch.labels).slice(0, 500) : null);
  }
  if (patch.rank !== undefined) {
    fields.push("rank = ?");
    vals.push(Number(patch.rank));
  }
  if (patch.issue_type !== undefined) {
    const type = String(patch.issue_type).toLowerCase();
    const safeType = ["epic", "story", "task", "bug", "subtask"].includes(type)
      ? type
      : null;
    if (safeType) {
      fields.push("issue_type = ?");
      vals.push(safeType);
    }
  }
  if (!fields.length) return 0;
  fields.push("updated_at = UTC_TIMESTAMP()");
  vals.push(issueId, projectId);
  const [r] = await getPool().query(
    `UPDATE issues SET ${fields.join(", ")} WHERE id = ? AND project_id = ?`,
    vals,
  );
  return r.affectedRows;
}

/**
 * Move backlog issues into a sprint (Jira “plan sprint”).
 * @param {number} projectId
 * @param {number} sprintId
 * @param {number[]} issueIds
 */
export async function assignIssuesToSprint(projectId, sprintId, issueIds) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let rank = await nextSprintRank(conn, projectId, sprintId);
    for (const issueId of issueIds) {
      const [r] = await conn.query(
        `UPDATE issues SET sprint_id = ?, rank = ?, updated_at = UTC_TIMESTAMP()
         WHERE id = ? AND project_id = ? AND sprint_id IS NULL`,
        [sprintId, rank++, issueId, projectId],
      );
      if (!r.affectedRows) {
        throw new Error(
          `Issue ${issueId} is not in the product backlog or does not exist.`,
        );
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * @param {number} projectId
 * @param {{ issue_type: string, summary: string, description?: string|null, acceptance_criteria?: string|null, priority?: string, story_points?: number|null, labels?: string|null }} body
 */
export async function createManualIssue(projectId, body) {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const issueKey = await allocateIssueKeyInConn(conn, projectId);
    const rank = await nextBacklogRank(conn, projectId);
    const type = String(body.issue_type || "task").toLowerCase();
    const safeType = ["epic", "story", "task", "bug", "subtask"].includes(type)
      ? type
      : "task";
    const acceptance =
      body.acceptance_criteria != null && String(body.acceptance_criteria).trim()
        ? String(body.acceptance_criteria).slice(0, 12_000)
        : null;
    const labels =
      body.labels != null && String(body.labels).trim()
        ? String(body.labels).trim().slice(0, 500)
        : null;
    const [ins] = await conn.query(
      `INSERT INTO issues (
        project_id, sprint_id, epic_id, parent_id, issue_type, issue_key, summary,
        description, acceptance_criteria, status, priority, story_points, labels, rank
      ) VALUES (?, NULL, NULL, NULL, ?, ?, ?, ?, ?, 'todo', ?, ?, ?, ?)`,
      [
        projectId,
        safeType,
        issueKey,
        String(body.summary).trim().slice(0, 500),
        body.description ? String(body.description) : null,
        acceptance,
        body.priority || "medium",
        body.story_points != null ? Number(body.story_points) : null,
        labels,
        rank,
      ],
    );
    await conn.commit();
    return ins.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Permanently remove one issue from the product backlog only (not sprint issues).
 * @param {number} issueId
 * @param {number} projectId
 * @returns {Promise<number>} affected rows
 */
export async function deleteBacklogIssue(issueId, projectId) {
  const [r] = await getPool().query(
    `DELETE FROM issues WHERE id = ? AND project_id = ? AND sprint_id IS NULL`,
    [issueId, projectId],
  );
  return r.affectedRows;
}

/**
 * @param {number} issueId
 * @param {number} projectId
 * @returns {Promise<{ sprint_id: number | null } | null>} row or null if issue missing
 */
export async function getIssueSprintIdForProject(issueId, projectId) {
  const [rows] = await getPool().query(
    `SELECT sprint_id FROM issues WHERE id = ? AND project_id = ? LIMIT 1`,
    [issueId, projectId],
  );
  if (!rows[0]) return null;
  return { sprint_id: rows[0].sprint_id };
}

/**
 * @param {number} issueId
 * @param {number} projectId
 * @param {number} sprintId
 * @returns {Promise<boolean>}
 */
export async function issueBelongsToSprint(
  issueId,
  projectId,
  sprintId,
) {
  const [rows] = await getPool().query(
    `SELECT 1 AS ok FROM issues WHERE id = ? AND project_id = ? AND sprint_id = ? LIMIT 1`,
    [issueId, projectId, sprintId],
  );
  return Boolean(rows[0]);
}

/**
 * @param {number} projectId
 * @param {{ sprintId?: number|null, backlogOnly?: boolean }} filters
 */
export async function listIssuesForExport(projectId, filters) {
  let sql = `SELECT i.issue_key, i.issue_type, i.summary, i.description, i.acceptance_criteria,
                    i.status, i.priority, i.story_points, i.labels, i.sprint_id,
                    e.summary AS epic_summary, s.name AS sprint_name
             FROM issues i
             LEFT JOIN issues e ON e.id = i.epic_id
             LEFT JOIN sprints s ON s.id = i.sprint_id
             WHERE i.project_id = ?`;
  const vals = [projectId];
  if (filters.backlogOnly) {
    sql += " AND i.sprint_id IS NULL";
  } else if (filters.sprintId != null) {
    sql += " AND i.sprint_id = ?";
    vals.push(filters.sprintId);
  }
  sql += " ORDER BY FIELD(i.issue_type, 'epic') DESC, i.rank ASC, i.id ASC";
  const [rows] = await getPool().query(sql, vals);
  return rows;
}
