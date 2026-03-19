-- Microsoft Graph API Sync Support
-- Run AFTER 06_scim_schema.sql

ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);
