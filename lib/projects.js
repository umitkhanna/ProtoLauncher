import { getPool } from "./db";

const PROJECT_ROW_FOR_GENERATION = `id, user_id, name, description, startup_idea, target_audience, business_goals, intake_notes, requirements_document, requirements_finalized_at`;

/**
 * @param {{ startupIdea: string, targetAudience: string, businessGoals: string }} intake
 */
function buildDescriptionFromIntake(intake) {
  return [intake.startupIdea, intake.targetAudience, intake.businessGoals]
    .filter(Boolean)
    .join("\n\n")
    .trim()
    .slice(0, 12_000);
}

/**
 * @param {number} userId
 * @param {{ name: string, startupIdea: string, targetAudience: string, businessGoals: string, intakeNotes?: string|null }} intake
 * @returns {Promise<number>} insert id
 */
export async function createProject(userId, intake) {
  const description = buildDescriptionFromIntake(intake);
  const notes = intake.intakeNotes?.trim()
    ? intake.intakeNotes.trim().slice(0, 12_000)
    : null;
  const [result] = await getPool().query(
    `INSERT INTO projects (
       user_id, name, description, startup_idea, target_audience, business_goals, intake_notes,
       requirements_document, requirements_finalized_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
    [
      userId,
      intake.name.trim().slice(0, 280),
      description,
      intake.startupIdea.trim().slice(0, 12_000),
      intake.targetAudience.trim().slice(0, 12_000),
      intake.businessGoals.trim().slice(0, 12_000),
      notes,
    ],
  );
  return result.insertId;
}

/**
 * Latest draft project (no generated HTML yet) for reuse after a failed job.
 * @param {number} userId
 * @returns {Promise<number | null>}
 */
export async function findReusableDraftProjectId(userId) {
  const [rows] = await getPool().query(
    `SELECT id FROM projects
     WHERE user_id = ?
       AND (requirements_document IS NULL OR TRIM(requirements_document) = '')
     ORDER BY id DESC
     LIMIT 1`,
    [userId],
  );
  return rows[0]?.id ?? null;
}

/**
 * @param {number} projectId
 * @param {number} userId
 * @param {{ name: string, startupIdea: string, targetAudience: string, businessGoals: string, intakeNotes?: string|null }} intake
 */
export async function updateProjectMeta(projectId, userId, intake) {
  const description = buildDescriptionFromIntake(intake);
  const notes = intake.intakeNotes?.trim()
    ? intake.intakeNotes.trim().slice(0, 12_000)
    : null;
  await getPool().query(
    `UPDATE projects SET
       name = ?,
       description = ?,
       startup_idea = ?,
       target_audience = ?,
       business_goals = ?,
       intake_notes = ?,
       updated_at = UTC_TIMESTAMP()
     WHERE id = ? AND user_id = ?`,
    [
      intake.name.trim().slice(0, 280),
      description,
      intake.startupIdea.trim().slice(0, 12_000),
      intake.targetAudience.trim().slice(0, 12_000),
      intake.businessGoals.trim().slice(0, 12_000),
      notes,
      projectId,
      userId,
    ],
  );
}

/**
 * User already has at least one generated requirements document.
 * @param {number} userId
 */
export async function userHasGeneratedRequirements(userId) {
  const [rows] = await getPool().query(
    `SELECT 1 AS ok FROM projects
     WHERE user_id = ?
       AND requirements_document IS NOT NULL
       AND LENGTH(TRIM(requirements_document)) > 0
     LIMIT 1`,
    [userId],
  );
  return Boolean(rows[0]);
}

/**
 * @param {number} projectId
 * @param {number} userId
 */
export async function getProjectByIdAndUser(projectId, userId) {
  const [rows] = await getPool().query(
    `SELECT ${PROJECT_ROW_FOR_GENERATION}
     FROM projects
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [projectId, userId],
  );
  return rows[0] ?? null;
}

/**
 * @param {number} projectId
 * @param {string} html
 */
export async function saveGeneratedRequirements(projectId, html) {
  await getPool().query(
    `UPDATE projects SET requirements_document = ?, updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [html, projectId],
  );
}

/**
 * Project row for requirements editor + save API (unfinalized with doc first, else latest with doc).
 * @param {number} userId
 */
export async function getProjectForRequirementsSession(userId) {
  const pool = getPool();
  const [unf] = await pool.query(
    `SELECT ${PROJECT_ROW_FOR_GENERATION}
     FROM projects
     WHERE user_id = ?
       AND requirements_document IS NOT NULL
       AND LENGTH(TRIM(requirements_document)) > 0
       AND requirements_finalized_at IS NULL
     ORDER BY id DESC
     LIMIT 1`,
    [userId],
  );
  if (unf[0]) return unf[0];
  const [any] = await pool.query(
    `SELECT ${PROJECT_ROW_FOR_GENERATION}
     FROM projects
     WHERE user_id = ?
       AND requirements_document IS NOT NULL
       AND LENGTH(TRIM(requirements_document)) > 0
     ORDER BY id DESC
     LIMIT 1`,
    [userId],
  );
  return any[0] ?? null;
}

/**
 * @param {number} userId
 */
export async function getLatestProjectForOverview(userId) {
  const [rows] = await getPool().query(
    `SELECT id, name, requirements_document
     FROM projects
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

/**
 * @param {number} projectId
 * @param {number} userId
 * @param {string} html
 */
export async function updateRequirementsDocument(projectId, userId, html) {
  const [r] = await getPool().query(
    `UPDATE projects SET requirements_document = ?, updated_at = UTC_TIMESTAMP()
     WHERE id = ? AND user_id = ?`,
    [html, projectId, userId],
  );
  if (!r.affectedRows) {
    throw new Error("Project not found or access denied");
  }
}

/**
 * @param {number} projectId
 * @param {number} userId
 * @param {string} html
 */
export async function finalizeRequirementsDocument(projectId, userId, html) {
  const [r] = await getPool().query(
    `UPDATE projects SET
       requirements_document = ?,
       requirements_finalized_at = UTC_TIMESTAMP(),
       updated_at = UTC_TIMESTAMP()
     WHERE id = ? AND user_id = ?`,
    [html, projectId, userId],
  );
  if (!r.affectedRows) {
    throw new Error("Project not found or access denied");
  }
}

/**
 * @param {number} projectId
 * @param {number} userId
 * @param {{ html: string | null, note: string | null }} payload
 */
export async function setProjectHomePreview(projectId, payload) {
  const html = payload.html != null ? String(payload.html) : null;
  const note = payload.note != null ? String(payload.note).trim().slice(0, 500) : null;
  const [r] = await getPool().query(
    `UPDATE projects SET
       home_preview_html = ?,
       home_preview_generated_at = UTC_TIMESTAMP(),
       home_preview_note = ?,
       updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [html, note, projectId],
  );
  if (!r.affectedRows) {
    throw new Error("Project not found or access denied");
  }
}
