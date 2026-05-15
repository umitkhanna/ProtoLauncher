-- ProtoLauncher authentication tables (MySQL 8+ / InnoDB).
-- Run once against your database, for example:
--   mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE < scripts/mysql-auth-schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  name VARCHAR(255) NULL,
  email_verified_at DATETIME NULL,
  google_sub VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  role ENUM('admin','manager','team_member','client','client_team_member') NOT NULL DEFAULT 'client',
  parent_client_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_sub (google_sub),
  KEY idx_users_parent_client (parent_client_id),
  CONSTRAINT fk_users_parent_client FOREIGN KEY (parent_client_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(280) NOT NULL,
  description TEXT NOT NULL,
  startup_idea TEXT NULL,
  target_audience TEXT NULL,
  business_goals TEXT NULL,
  intake_notes TEXT NULL,
  requirements_document LONGTEXT NULL,
  requirements_finalized_at DATETIME NULL,
  issue_key_prefix VARCHAR(12) NOT NULL DEFAULT 'PROJ',
  next_issue_number INT UNSIGNED NOT NULL DEFAULT 1,
  backlog_generated_at DATETIME NULL,
  home_preview_html LONGTEXT NULL,
  home_preview_generated_at DATETIME NULL,
  home_preview_note VARCHAR(500) NULL,
  git_repo_status ENUM('none','requested','ready','failed') NOT NULL DEFAULT 'none',
  git_repo_url VARCHAR(500) NULL,
  deploy_status ENUM('none','requested','live','failed') NOT NULL DEFAULT 'none',
  git_repo_requested_at DATETIME NULL,
  deploy_requested_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_user (user_id),
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prt_lookup (token_hash),
  KEY idx_prt_user (user_id),
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
