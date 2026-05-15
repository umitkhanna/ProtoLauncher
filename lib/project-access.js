import { getPool } from "./db";
import { normalizeRole, ROLES } from "./roles";

/**
 * @param {{ user?: { id?: string, role?: string, parentClientId?: string | null } }} session
 * @returns {AccessContext}
 */
export function sessionAccessContext(session) {
  return {
    userId: Number(session?.user?.id),
    role: session?.user?.role,
    parentClientId: session?.user?.parentClientId ?? null,
  };
}

const PROJECT_COLS = `id, user_id, name, requirements_document, requirements_finalized_at,
  issue_key_prefix, next_issue_number, backlog_generated_at,
  home_preview_html, home_preview_generated_at, home_preview_note,
  git_repo_status, git_repo_url, deploy_status,
  git_repo_requested_at, deploy_requested_at`;

/**
 * @typedef {{ userId: number, role?: string | null, parentClientId?: string | number | null }} AccessContext
 */

/**
 * @param {number} projectId
 * @param {AccessContext} ctx
 */
export async function assertProjectAccess(projectId, ctx) {
  const userId = Number(ctx.userId);
  if (!Number.isFinite(userId) || !Number.isFinite(projectId)) return null;
  const role = normalizeRole(ctx.role);
  const parentClientId =
    ctx.parentClientId != null && String(ctx.parentClientId).trim() !== ""
      ? Number(ctx.parentClientId)
      : null;

  const pool = getPool();

  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    const [rows] = await pool.query(
      `SELECT ${PROJECT_COLS} FROM projects WHERE id = ? LIMIT 1`,
      [projectId],
    );
    return rows[0] ?? null;
  }

  if (role === ROLES.CLIENT) {
    const [rows] = await pool.query(
      `SELECT ${PROJECT_COLS} FROM projects WHERE id = ? AND user_id = ? LIMIT 1`,
      [projectId, userId],
    );
    return rows[0] ?? null;
  }

  if (role === ROLES.TEAM_MEMBER) {
    const [rows] = await pool.query(
      `SELECT ${PROJECT_COLS}
       FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ?
       WHERE p.id = ?
       LIMIT 1`,
      [userId, projectId],
    );
    return rows[0] ?? null;
  }

  if (role === ROLES.CLIENT_TEAM_MEMBER) {
    if (!Number.isFinite(parentClientId)) return null;
    const [rows] = await pool.query(
      `SELECT ${PROJECT_COLS}
       FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ?
       WHERE p.id = ? AND p.user_id = ?
       LIMIT 1`,
      [userId, projectId, parentClientId],
    );
    return rows[0] ?? null;
  }

  return null;
}

/**
 * @param {AccessContext} ctx
 */
export async function listProjectsForDashboard(ctx) {
  const userId = Number(ctx.userId);
  if (!Number.isFinite(userId)) return [];
  const role = normalizeRole(ctx.role);
  const parentClientId =
    ctx.parentClientId != null && String(ctx.parentClientId).trim() !== ""
      ? Number(ctx.parentClientId)
      : null;
  const pool = getPool();

  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.backlog_generated_at, p.user_id AS owner_user_id,
              p.git_repo_status, p.deploy_status,
              (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id) AS issue_count
       FROM projects p
       ORDER BY p.id DESC`,
    );
    return rows;
  }

  if (role === ROLES.CLIENT) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.backlog_generated_at, p.user_id AS owner_user_id,
              p.git_repo_status, p.deploy_status,
              (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id) AS issue_count
       FROM projects p
       WHERE p.user_id = ?
       ORDER BY p.id DESC`,
      [userId],
    );
    return rows;
  }

  if (role === ROLES.TEAM_MEMBER) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.backlog_generated_at, p.user_id AS owner_user_id,
              p.git_repo_status, p.deploy_status,
              (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id) AS issue_count
       FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ?
       ORDER BY p.id DESC`,
      [userId],
    );
    return rows;
  }

  if (role === ROLES.CLIENT_TEAM_MEMBER && Number.isFinite(parentClientId)) {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.backlog_generated_at, p.user_id AS owner_user_id,
              p.git_repo_status, p.deploy_status,
              (SELECT COUNT(*) FROM issues i WHERE i.project_id = p.id) AS issue_count
       FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ?
       WHERE p.user_id = ?
       ORDER BY p.id DESC`,
      [userId, parentClientId],
    );
    return rows;
  }

  return [];
}

/**
 * Latest finalized project for home preview drawer (role-aware).
 * @param {AccessContext} ctx
 */
export async function getLatestFinalizedProjectPreviewRow(ctx) {
  const userId = Number(ctx.userId);
  if (!Number.isFinite(userId)) return null;
  const role = normalizeRole(ctx.role);
  const parentClientId =
    ctx.parentClientId != null && String(ctx.parentClientId).trim() !== ""
      ? Number(ctx.parentClientId)
      : null;
  const pool = getPool();

  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    const [rows] = await pool.query(
      `SELECT p.id AS project_id, p.name,
              p.requirements_finalized_at,
              p.home_preview_html,
              p.home_preview_generated_at,
              p.home_preview_note
       FROM projects p
       WHERE p.requirements_finalized_at IS NOT NULL
       ORDER BY p.requirements_finalized_at DESC
       LIMIT 1`,
    );
    return rows[0] ?? null;
  }

  if (role === ROLES.CLIENT) {
    const [rows] = await pool.query(
      `SELECT p.id AS project_id, p.name,
              p.requirements_finalized_at,
              p.home_preview_html,
              p.home_preview_generated_at,
              p.home_preview_note
       FROM projects p
       WHERE p.user_id = ? AND p.requirements_finalized_at IS NOT NULL
       ORDER BY p.requirements_finalized_at DESC
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  if (role === ROLES.TEAM_MEMBER) {
    const [rows] = await pool.query(
      `SELECT p.id AS project_id, p.name,
              p.requirements_finalized_at,
              p.home_preview_html,
              p.home_preview_generated_at,
              p.home_preview_note
       FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ?
       WHERE p.requirements_finalized_at IS NOT NULL
       ORDER BY p.requirements_finalized_at DESC
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  if (role === ROLES.CLIENT_TEAM_MEMBER && Number.isFinite(parentClientId)) {
    const [rows] = await pool.query(
      `SELECT p.id AS project_id, p.name,
              p.requirements_finalized_at,
              p.home_preview_html,
              p.home_preview_generated_at,
              p.home_preview_note
       FROM projects p
       INNER JOIN project_assignments pa ON pa.project_id = p.id AND pa.user_id = ?
       WHERE p.user_id = ? AND p.requirements_finalized_at IS NOT NULL
       ORDER BY p.requirements_finalized_at DESC
       LIMIT 1`,
      [userId, parentClientId],
    );
    return rows[0] ?? null;
  }

  return null;
}

/**
 * @param {AccessContext} ctx
 * @param {number} ownerUserId projects.user_id
 */
export function canAssignProjectMembers(ctx, ownerUserId) {
  const role = normalizeRole(ctx.role);
  const uid = Number(ctx.userId);
  if (role === ROLES.ADMIN) return true;
  if (role === ROLES.MANAGER) return true;
  if (role === ROLES.CLIENT && ownerUserId === uid) return true;
  return false;
}

/**
 * @param {AccessContext} ctx
 */
export function canManageGitDeploy(ctx) {
  const role = normalizeRole(ctx.role);
  return role === ROLES.ADMIN || role === ROLES.MANAGER;
}
