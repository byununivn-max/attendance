-- SCIM 2.0 Provisioning Support for com_employee
-- Run AFTER 04_alter_schema.sql

-- ============================================================
-- 1. Add SCIM columns to com_employee
-- ============================================================
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS scim_external_id  VARCHAR(255) UNIQUE;
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS scim_display_name VARCHAR(200);
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS given_name        VARCHAR(100);
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS family_name       VARCHAR(100);
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============================================================
-- 2. Auto-update trigger for com_employee
-- ============================================================
DROP TRIGGER IF EXISTS trg_updated_at ON com_employee;
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON com_employee
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. Indexes for SCIM filter queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_com_employee_email  ON com_employee(email);
CREATE INDEX IF NOT EXISTS idx_com_employee_active ON com_employee(is_active);
