-- Add onboarding / requirements columns to existing `users` tables.
-- Run once if you already applied scripts/mysql-auth-schema.sql before these columns existed:
--   node scripts/run-onboarding-columns.mjs
-- (Uses DATABASE_* from .env.local, same as db:schema.)

ALTER TABLE users
  ADD COLUMN onboarding_completed_at DATETIME NULL DEFAULT NULL AFTER email_verified_at,
  ADD COLUMN initial_project_name VARCHAR(280) NULL DEFAULT NULL AFTER onboarding_completed_at,
  ADD COLUMN initial_project_description TEXT NULL AFTER initial_project_name,
  ADD COLUMN requirements_document LONGTEXT NULL AFTER initial_project_description;
