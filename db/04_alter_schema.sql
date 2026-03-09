-- Schema Patch: Align API column names with DB schema
-- Run AFTER 01_create_tables.sql + 02_seed_data.sql + 03_mock_hr_tables.sql

-- ============================================================
-- 1. com_employee: add full_name, department
-- ============================================================
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS full_name  VARCHAR(100);
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Backfill full_name from emp_name
UPDATE com_employee SET full_name = emp_name WHERE full_name IS NULL;

-- ============================================================
-- 2. atd_device: add serial_number, port, last_sync_at
-- ============================================================
ALTER TABLE atd_device ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE atd_device ADD COLUMN IF NOT EXISTS port          INT NOT NULL DEFAULT 80;
ALTER TABLE atd_device ADD COLUMN IF NOT EXISTS last_sync_at  TIMESTAMPTZ;

-- ============================================================
-- 3. atd_punch_correction: add reject_reason, rejected_at
-- ============================================================
ALTER TABLE atd_punch_correction ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE atd_punch_correction ADD COLUMN IF NOT EXISTS rejected_at   TIMESTAMPTZ;
