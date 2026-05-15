/**
 * RBAC: user roles, team memberships, project assignments, messages, deploy stub columns.
 * Idempotent. Usage: node scripts/run-rbac-schema.mjs
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
    await addColumn(
      conn,
      `ALTER TABLE users ADD COLUMN role ENUM(
        'admin','manager','team_member','client','client_team_member'
      ) NOT NULL DEFAULT 'client'`,
    );
    await addColumn(
      conn,
      "ALTER TABLE users ADD COLUMN parent_client_id INT UNSIGNED NULL",
    );
    await addColumn(
      conn,
      "ALTER TABLE users ADD KEY idx_users_parent_client (parent_client_id)",
    );

    await addColumn(
      conn,
      `ALTER TABLE projects ADD COLUMN git_repo_status ENUM(
        'none','requested','ready','failed'
      ) NOT NULL DEFAULT 'none'`,
    );
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN git_repo_url VARCHAR(500) NULL");
    await addColumn(
      conn,
      `ALTER TABLE projects ADD COLUMN deploy_status ENUM(
        'none','requested','live','failed'
      ) NOT NULL DEFAULT 'none'`,
    );
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN git_repo_requested_at DATETIME NULL");
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN deploy_requested_at DATETIME NULL");

    await conn.query(`
CREATE TABLE IF NOT EXISTS team_memberships (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  manager_user_id INT UNSIGNED NOT NULL,
  member_user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_membership (manager_user_id, member_user_id),
  KEY idx_team_member (member_user_id),
  CONSTRAINT fk_tm_manager FOREIGN KEY (manager_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_member FOREIGN KEY (member_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

    await conn.query(`
CREATE TABLE IF NOT EXISTS project_assignments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  assigned_by_user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_assignee (project_id, user_id),
  KEY idx_pa_user (user_id),
  CONSTRAINT fk_pa_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_by FOREIGN KEY (assigned_by_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

    await conn.query(`
CREATE TABLE IF NOT EXISTS project_messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pm_project_created (project_id, created_at),
  CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

    const [[fk]] = await conn.query(
      `SELECT CONSTRAINT_NAME AS n FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_parent_client'`,
      [database],
    );
    if (!fk?.n) {
      try {
        await conn.query(`
ALTER TABLE users
  ADD CONSTRAINT fk_users_parent_client
  FOREIGN KEY (parent_client_id) REFERENCES users (id) ON DELETE CASCADE
`);
      } catch (e) {
        if (!String(e?.message || e).includes("Duplicate")) throw e;
      }
    }

    console.log("RBAC schema applied on", database);
    console.log("Tip: grant admin with: UPDATE users SET role='admin' WHERE id=YOUR_ID;");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
