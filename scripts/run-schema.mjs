/**
 * Apply scripts/mysql-auth-schema.sql using DATABASE_* from .env.local.
 * Usage: node scripts/run-schema.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}. Copy .env.example and set DATABASE_* variables.`);
  }
  const out = {};
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
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

function stripSqlComments(sql) {
  return sql
    .split("\n")
    .map((line) => {
      const t = line.trim();
      return t.startsWith("--") ? "" : line;
    })
    .join("\n");
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

  const sqlPath = path.join(__dirname, "mysql-auth-schema.sql");
  let sql = stripSqlComments(fs.readFileSync(sqlPath, "utf8")).trim();

  const options = {
    host,
    user,
    password,
    database,
    multipleStatements: true,
  };
  if (sslFlag === "true") {
    options.ssl = { rejectUnauthorized: true };
  }

  const conn = await mysql.createConnection(options);
  try {
    await conn.query(sql);
    console.log("Schema applied successfully:", database, "@", host);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
