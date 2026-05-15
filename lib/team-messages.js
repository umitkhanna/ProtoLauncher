import { getPool } from "./db";

/**
 * @param {number} managerUserId
 */
export async function listTeamMembersForManager(managerUserId) {
  const [rows] = await getPool().query(
    `SELECT u.id, u.email, u.name, u.role
     FROM team_memberships tm
     INNER JOIN users u ON u.id = tm.member_user_id
     WHERE tm.manager_user_id = ?
     ORDER BY u.email ASC`,
    [managerUserId],
  );
  return rows;
}

/**
 * @param {number} managerUserId
 * @param {number} memberUserId
 */
export async function addTeamMemberUnderManager(managerUserId, memberUserId) {
  if (managerUserId === memberUserId) return;
  await getPool().query(
    `INSERT IGNORE INTO team_memberships (manager_user_id, member_user_id) VALUES (?, ?)`,
    [managerUserId, memberUserId],
  );
}

/**
 * @param {number} projectId
 */
export async function listAssignmentsForProject(projectId) {
  const [rows] = await getPool().query(
    `SELECT pa.user_id, u.email, u.name, u.role
     FROM project_assignments pa
     INNER JOIN users u ON u.id = pa.user_id
     WHERE pa.project_id = ?
     ORDER BY u.email ASC`,
    [projectId],
  );
  return rows;
}

/**
 * @param {number} projectId
 * @param {number} assigneeUserId
 * @param {number} assignedByUserId
 */
export async function upsertProjectAssignment(projectId, assigneeUserId, assignedByUserId) {
  await getPool().query(
    `INSERT INTO project_assignments (project_id, user_id, assigned_by_user_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE assigned_by_user_id = VALUES(assigned_by_user_id)`,
    [projectId, assigneeUserId, assignedByUserId],
  );
}

/**
 * @param {number} projectId
 * @param {number} assigneeUserId
 */
export async function removeProjectAssignment(projectId, assigneeUserId) {
  await getPool().query(
    `DELETE FROM project_assignments WHERE project_id = ? AND user_id = ?`,
    [projectId, assigneeUserId],
  );
}

/**
 * @param {number} projectId
 * @param {{ limit?: number }} opts
 */
export async function listProjectMessages(projectId, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 80, 1), 200);
  const [rows] = await getPool().query(
    `SELECT m.id, m.body, m.created_at, m.user_id, u.name AS author_name, u.email AS author_email
     FROM project_messages m
     INNER JOIN users u ON u.id = m.user_id
     WHERE m.project_id = ?
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [projectId, limit],
  );
  return rows.reverse();
}

/**
 * @param {number} projectId
 * @param {number} userId
 * @param {string} body
 */
export async function insertProjectMessage(projectId, userId, body) {
  const text = String(body || "").trim().slice(0, 16_000);
  if (!text) throw new Error("Message body is required.");
  const [r] = await getPool().query(
    `INSERT INTO project_messages (project_id, user_id, body) VALUES (?, ?, ?)`,
    [projectId, userId, text],
  );
  return r.insertId;
}

/**
 * @param {number} projectId
 * @param {'repo'|'deploy'} kind
 */
export async function markProjectProvisionRequested(projectId, kind) {
  if (kind === "repo") {
    await getPool().query(
      `UPDATE projects SET
         git_repo_status = 'requested',
         git_repo_requested_at = UTC_TIMESTAMP(),
         updated_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [projectId],
    );
    return;
  }
  await getPool().query(
    `UPDATE projects SET
       deploy_status = 'requested',
       deploy_requested_at = UTC_TIMESTAMP(),
       updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [projectId],
  );
}
