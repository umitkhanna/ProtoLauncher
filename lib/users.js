import { getPool } from "./db";

export async function getUserByEmail(email) {
  const normalized = email.toLowerCase().trim();
  const [rows] = await getPool().query(
    `SELECT id, email, password_hash, name, email_verified_at,
            role, parent_client_id
     FROM users WHERE email = ? LIMIT 1`,
    [normalized],
  );
  return rows[0] ?? null;
}

export async function getUserById(id) {
  const [rows] = await getPool().query(
    `SELECT id, email, password_hash, name, email_verified_at,
            role, parent_client_id
     FROM users WHERE id = ? LIMIT 1`,
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

export async function createUser({ email, passwordHash, name, role, parentClientId }) {
  const normalized = email.toLowerCase().trim();
  const r = role?.trim() || "client";
  const pid =
    parentClientId != null && String(parentClientId).trim() !== ""
      ? Number(parentClientId)
      : null;
  const [result] = await getPool().query(
    `INSERT INTO users (email, password_hash, name, role, parent_client_id)
     VALUES (?, ?, ?, ?, ?)`,
    [normalized, passwordHash, name?.trim() || null, r, Number.isFinite(pid) ? pid : null],
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
