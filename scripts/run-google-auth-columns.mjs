/**
 * Google OAuth columns on users (idempotent).
 * Usage: node scripts/run-google-auth-columns.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}. Copy .env.example and set DATABASE_* variables.`);
  }
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function addColumn(conn, sql) {
  try {
    await conn.query(sql);
  } catch (e) {
    if (String(e?.message || e).includes("Duplicate column name")) return;
    throw e;
  }
}

async function main() {
  const f = loadEnvLocal();
  const host = process.env.DATABASE_HOST || f.DATABASE_HOST;
  const user = process.env.DATABASE_USER || f.DATABASE_USER;
  const password =
    process.env.DATABASE_PASSWORD !== undefined
      ? process.env.DATABASE_PASSWORD
      : (f.DATABASE_PASSWORD ?? "");
  const database = process.env.DATABASE_NAME || f.DATABASE_NAME;
  const sslFlag = process.env.DATABASE_SSL || f.DATABASE_SSL;

  const options = { host, user, password, database };
  if (sslFlag === "true") options.ssl = { rejectUnauthorized: true };

  const conn = await mysql.createConnection(options);
  try {
    await addColumn(conn, "ALTER TABLE users ADD COLUMN google_sub VARCHAR(255) NULL");
    await addColumn(conn, "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL");
    try {
      await conn.query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL");
    } catch (e) {
      if (!String(e?.message || e).includes("Duplicate")) throw e;
    }
    try {
      await conn.query(
        "ALTER TABLE users ADD UNIQUE KEY uq_users_google_sub (google_sub)",
      );
    } catch (e) {
      if (!String(e?.message || e).includes("Duplicate key name")) throw e;
    }
    console.log("Google auth columns applied on", database);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
