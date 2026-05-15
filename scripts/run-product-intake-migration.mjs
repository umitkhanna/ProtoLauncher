/**
 * Add structured product-discovery columns on projects.
 * Idempotent. Uses DATABASE_* from .env.local.
 * Usage: node scripts/run-product-intake-migration.mjs
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

  if (!host || !user || !database) {
    throw new Error("DATABASE_HOST, DATABASE_USER, and DATABASE_NAME are required in .env.local");
  }

  const options = { host, user, password, database, multipleStatements: true };
  if (sslFlag === "true") options.ssl = { rejectUnauthorized: true };

  const conn = await mysql.createConnection(options);
  try {
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN startup_idea TEXT NULL");
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN target_audience TEXT NULL");
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN business_goals TEXT NULL");
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN intake_notes TEXT NULL");
    console.log("Product intake columns ensured on", database);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
