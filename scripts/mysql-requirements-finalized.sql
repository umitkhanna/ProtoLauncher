ALTER TABLE users
  ADD COLUMN requirements_finalized_at DATETIME NULL DEFAULT NULL
  AFTER requirements_document;
