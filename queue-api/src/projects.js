import { getPool } from "./db.js";

export async function getProjectByIdAndUser(projectId, userId) {
  const [rows] = await getPool().query(
    `SELECT id, user_id, name, description, startup_idea, target_audience, business_goals, intake_notes, requirements_document, requirements_finalized_at
     FROM projects
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [projectId, userId],
  );
  return rows[0] ?? null;
}

export async function saveGeneratedRequirements(projectId, html) {
  await getPool().query(
    `UPDATE projects SET requirements_document = ?, updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [html, projectId],
  );
}
