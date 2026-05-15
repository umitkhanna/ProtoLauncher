/**
 * Ensure `projects` exists and migrate legacy onboarding columns from `users` into
 * `projects`, then drop those columns from `users`.
 *
 * Safe to run multiple times. Uses DATABASE_* from .env.local.
 * Usage: node scripts/run-projects-migration.mjs
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

const CREATE_PROJECTS = `
CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(280) NOT NULL,
  description TEXT NOT NULL,
  requirements_document LONGTEXT NULL,
  requirements_finalized_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_user (user_id),
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

async function columnExists(conn, database, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, table, column],
  );
  return Number(rows[0]?.n) > 0;
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
    await conn.query(CREATE_PROJECTS.trim());
    console.log("Ensured projects table exists:", database);

    const hasLegacy =
      (await columnExists(conn, database, "users", "requirements_document")) ||
      (await columnExists(conn, database, "users", "initial_project_name")) ||
      (await columnExists(conn, database, "users", "onboarding_completed_at"));

    if (!hasLegacy) {
      console.log("No legacy user project columns; migration complete.");
      return;
    }

    const canCopyRows =
      (await columnExists(conn, database, "users", "initial_project_name")) &&
      (await columnExists(conn, database, "users", "initial_project_description")) &&
      (await columnExists(conn, database, "users", "requirements_document")) &&
      (await columnExists(conn, database, "users", "requirements_finalized_at")) &&
      (await columnExists(conn, database, "users", "onboarding_completed_at"));

    if (canCopyRows) {
      await conn.query(
        `
      INSERT INTO projects (user_id, name, description, requirements_document, requirements_finalized_at, created_at, updated_at)
      SELECT u.id,
        COALESCE(NULLIF(TRIM(u.initial_project_name), ''), 'Project'),
        COALESCE(NULLIF(TRIM(u.initial_project_description), ''), ''),
        u.requirements_document,
        u.requirements_finalized_at,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE (
          u.initial_project_name IS NOT NULL
          OR NULLIF(TRIM(u.initial_project_description), '') IS NOT NULL
          OR u.requirements_document IS NOT NULL
          OR u.onboarding_completed_at IS NOT NULL
        )
        AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.user_id = u.id)
      `.trim(),
      );
      console.log("Copied legacy user project data into projects (where missing).");
    } else {
      console.log(
        "Skipping row copy: expected legacy onboarding columns are not all present on users.",
      );
    }

    const drops = [
      "onboarding_completed_at",
      "initial_project_name",
      "initial_project_description",
      "requirements_document",
      "requirements_finalized_at",
    ];
    for (const col of drops) {
      if (await columnExists(conn, database, "users", col)) {
        await conn.query(`ALTER TABLE users DROP COLUMN \`${col}\``);
        console.log("Dropped column users." + col);
      }
    }
    console.log("Projects migration finished.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
