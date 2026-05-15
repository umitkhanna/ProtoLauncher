import { getPool } from "./db";

const USER_SELECT = `id, email, password_hash, name, email_verified_at,
  role, parent_client_id, google_sub, avatar_url`;

export async function getUserByEmail(email) {
  const normalized = email.toLowerCase().trim();
  const [rows] = await getPool().query(
    `SELECT ${USER_SELECT} FROM users WHERE email = ? LIMIT 1`,
    [normalized],
  );
  return rows[0] ?? null;
}

export async function getUserById(id) {
  const [rows] = await getPool().query(
    `SELECT ${USER_SELECT} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

/**
 * @param {string} role
 */
export async function listUsersByRole(role) {
  const [rows] = await getPool().query(
    `SELECT id, email, name, role FROM users WHERE role = ? ORDER BY email ASC`,
    [role],
  );
  return rows;
}

/**
 * @param {{
 *   email: string,
 *   passwordHash?: string|null,
 *   name?: string|null,
 *   role?: string,
 *   parentClientId?: number|null,
 *   googleSub?: string|null,
 *   avatarUrl?: string|null,
 *   emailVerified?: boolean,
 * }} input
 */
export async function createUser(input) {
  const normalized = input.email.toLowerCase().trim();
  const r = input.role?.trim() || "client";
  const pid =
    input.parentClientId != null && String(input.parentClientId).trim() !== ""
      ? Number(input.parentClientId)
      : null;
  const verified = input.emailVerified ? new Date() : null;
  const [result] = await getPool().query(
    `INSERT INTO users (
       email, password_hash, name, role, parent_client_id,
       google_sub, avatar_url, email_verified_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalized,
      input.passwordHash ?? null,
      input.name?.trim() || null,
      r,
      Number.isFinite(pid) ? pid : null,
      input.googleSub?.trim() || null,
      input.avatarUrl?.trim().slice(0, 500) || null,
      verified,
    ],
  );
  return result.insertId;
}

export async function updateUserPassword(userId, passwordHash) {
  await getPool().query(
    "UPDATE users SET password_hash = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?",
    [passwordHash, userId],
  );
}

/**
 * @returns {Promise<Array<{ id: number, email: string, name: string|null, role: string, parent_client_id: number|null }>>}
 */
export async function listUsersForAdmin() {
  const [rows] = await getPool().query(
    `SELECT id, email, name, role, parent_client_id
     FROM users
     ORDER BY id DESC`,
  );
  return rows;
}

/**
 * @param {number} userId
 * @param {{ role: string, parentClientId?: number|null }} patch
 */
export async function adminUpdateUserRole(userId, patch) {
  const role = String(patch.role || "client").trim();
  if (patch.parentClientId === undefined) {
    await getPool().query(
      `UPDATE users SET role = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?`,
      [role, userId],
    );
    return;
  }
  const pid = patch.parentClientId != null ? Number(patch.parentClientId) : null;
  await getPool().query(
    `UPDATE users SET
       role = ?,
       parent_client_id = ?,
       updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [role, Number.isFinite(pid) ? pid : null, userId],
  );
}
