import { getPool } from "./db";
import { hashOpaqueToken } from "./token";

export async function deleteResetTokensForUser(userId) {
  await getPool().query("DELETE FROM password_reset_tokens WHERE user_id = ?", [
    userId,
  ]);
}

export async function insertResetToken(userId, tokenHash) {
  await getPool().query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR))",
    [userId, tokenHash],
  );
}

/**
 * @param {string} plainToken
 * @returns {Promise<{ userId: number, email: string } | null>}
 */
export async function findValidResetContext(plainToken) {
  const tokenHash = hashOpaqueToken(plainToken);
  const [rows] = await getPool().query(
    `SELECT prt.user_id AS userId, u.email
     FROM password_reset_tokens prt
     INNER JOIN users u ON u.id = prt.user_id
     WHERE prt.token_hash = ? AND prt.expires_at > UTC_TIMESTAMP()
     LIMIT 1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;
  return { userId: row.userId, email: row.email };
}

export async function deleteResetTokenByPlain(plainToken) {
  const tokenHash = hashOpaqueToken(plainToken);
  await getPool().query("DELETE FROM password_reset_tokens WHERE token_hash = ?", [
    tokenHash,
  ]);
}
