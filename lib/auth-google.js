import { getPool } from "./db";
import { createUser, getUserByEmail, getUserById } from "./users";

/**
 * @param {string} googleSub
 */
export async function getUserByGoogleSub(googleSub) {
  const sub = String(googleSub || "").trim();
  if (!sub) return null;
  const [rows] = await getPool().query(
    `SELECT id, email, password_hash, name, email_verified_at,
            role, parent_client_id, google_sub, avatar_url
     FROM users WHERE google_sub = ? LIMIT 1`,
    [sub],
  );
  return rows[0] ?? null;
}

/**
 * @param {number} userId
 * @param {{ name?: string|null, image?: string|null }} profile
 */
async function touchGoogleProfile(userId, profile) {
  const name = profile.name?.trim() || null;
  const avatar = profile.image?.trim().slice(0, 500) || null;
  await getPool().query(
    `UPDATE users SET
       name = COALESCE(?, name),
       avatar_url = COALESCE(?, avatar_url),
       email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()),
       updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [name, avatar, userId],
  );
}

/**
 * @param {number} userId
 * @param {{ googleSub: string, name?: string|null, image?: string|null }} data
 */
async function linkGoogleAccount(userId, data) {
  await getPool().query(
    `UPDATE users SET
       google_sub = ?,
       name = COALESCE(?, name),
       avatar_url = COALESCE(?, avatar_url),
       email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()),
       updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [data.googleSub, data.name?.trim() || null, data.image?.trim().slice(0, 500) || null, userId],
  );
}

/**
 * Resolve sign-in for Google OAuth (find, link by email, or register).
 * @param {{ email: string, name?: string|null, image?: string|null, googleSub: string }}
 */
export async function resolveGoogleSignIn({ email, name, image, googleSub }) {
  const normalizedEmail = String(email || "")
    .toLowerCase()
    .trim();
  const sub = String(googleSub || "").trim();
  if (!normalizedEmail || !sub) {
    throw new Error("GOOGLE_PROFILE_INCOMPLETE");
  }

  const bySub = await getUserByGoogleSub(sub);
  if (bySub) {
    await touchGoogleProfile(bySub.id, { name, image });
    return getUserById(bySub.id);
  }

  const byEmail = await getUserByEmail(normalizedEmail);
  if (byEmail) {
    if (byEmail.google_sub && byEmail.google_sub !== sub) {
      throw new Error("OAUTH_ACCOUNT_CONFLICT");
    }
    await linkGoogleAccount(byEmail.id, { googleSub: sub, name, image });
    return getUserById(byEmail.id);
  }

  const id = await createUser({
    email: normalizedEmail,
    passwordHash: null,
    name: name?.trim() || null,
    role: "client",
    parentClientId: null,
    googleSub: sub,
    avatarUrl: image?.trim().slice(0, 500) || null,
    emailVerified: true,
  });
  return getUserById(id);
}

