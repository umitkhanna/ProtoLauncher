/**
 * Add Jira-style backlog/sprint columns and tables (sprints, issues).
 * Idempotent. Uses DATABASE_* from .env.local.
 * Usage: node scripts/run-board-schema.mjs
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

async function columnExists(conn, database, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, table, column],
  );
  return Number(rows[0]?.n) > 0;
}

async function tableExists(conn, database, table) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [database, table],
  );
  return Number(rows[0]?.n) > 0;
}

async function addColumn(conn, sql) {
  try {
    await conn.query(sql);
  } catch (e) {
    if (String(e?.message || e).includes("Duplicate column name")) return;
    throw e;
  }
}

const CREATE_SPRINTS = `
CREATE TABLE IF NOT EXISTS sprints (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  goal TEXT NULL,
  state ENUM('future', 'active', 'closed') NOT NULL DEFAULT 'future',
  start_date DATE NULL,
  end_date DATE NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sprints_project (project_id),
  CONSTRAINT fk_sprints_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const CREATE_ISSUES = `
CREATE TABLE IF NOT EXISTS issues (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id INT UNSIGNED NOT NULL,
  sprint_id INT UNSIGNED NULL,
  epic_id INT UNSIGNED NULL,
  parent_id INT UNSIGNED NULL,
  issue_type ENUM('epic', 'story', 'task', 'bug', 'subtask') NOT NULL DEFAULT 'story',
  issue_key VARCHAR(32) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  description TEXT NULL,
  acceptance_criteria TEXT NULL,
  status ENUM('todo', 'in_progress', 'done', 'blocked') NOT NULL DEFAULT 'todo',
  priority ENUM('lowest', 'low', 'medium', 'high', 'highest') NOT NULL DEFAULT 'medium',
  story_points DECIMAL(6, 2) NULL,
  labels VARCHAR(500) NULL,
  rank INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_issues_project_key (project_id, issue_key),
  KEY idx_issues_project_sprint_status (project_id, sprint_id, status),
  KEY idx_issues_epic (epic_id),
  KEY idx_issues_parent (parent_id),
  CONSTRAINT fk_issues_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_issues_sprint FOREIGN KEY (sprint_id) REFERENCES sprints (id) ON DELETE SET NULL,
  CONSTRAINT fk_issues_epic FOREIGN KEY (epic_id) REFERENCES issues (id) ON DELETE SET NULL,
  CONSTRAINT fk_issues_parent FOREIGN KEY (parent_id) REFERENCES issues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

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
    await addColumn(
      conn,
      `ALTER TABLE projects ADD COLUMN issue_key_prefix VARCHAR(12) NOT NULL DEFAULT 'PROJ'`,
    );
    await addColumn(
      conn,
      `ALTER TABLE projects ADD COLUMN next_issue_number INT UNSIGNED NOT NULL DEFAULT 1`,
    );
    await addColumn(
      conn,
      `ALTER TABLE projects ADD COLUMN backlog_generated_at DATETIME NULL`,
    );
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN startup_idea TEXT NULL");
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN target_audience TEXT NULL");
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN business_goals TEXT NULL");
    await addColumn(conn, "ALTER TABLE projects ADD COLUMN intake_notes TEXT NULL");

    await conn.query(CREATE_SPRINTS.trim());
    await conn.query(CREATE_ISSUES.trim());

    if (await tableExists(conn, database, "projects")) {
      const [rows] = await conn.query(
        `SELECT id, name FROM projects WHERE COALESCE(TRIM(issue_key_prefix), '') IN ('', 'PROJ')`,
      );
      for (const row of rows) {
        const slug = String(row.name || "PROJ")
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "")
          .slice(0, 10);
        const prefix = slug || "PROJ";
        await conn.query(
          `UPDATE projects SET issue_key_prefix = ? WHERE id = ? AND issue_key_prefix = 'PROJ'`,
          [prefix, row.id],
        );
      }
    }

    console.log("Board, backlog, and product intake columns applied on", database);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
