-- Migration 08: Add employment_status to com_employee
-- Add status: ACTIVE(근무중), RESIGNED(퇴사), SHARED(공용계정)

ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS employment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
  CHECK (employment_status IN ('ACTIVE', 'RESIGNED', 'SHARED'));

-- Backfill: is_active=false → RESIGNED
UPDATE com_employee SET employment_status = 'RESIGNED' WHERE is_active = false;

CREATE INDEX IF NOT EXISTS idx_com_employee_status ON com_employee(employment_status);

-- ============================================================
-- Device cleanup: remove duplicates, rename location
-- ============================================================

-- Delete duplicate devices (keep lowest device_id per IP)
DELETE FROM atd_device WHERE device_id NOT IN (
  SELECT MIN(device_id) FROM atd_device GROUP BY COALESCE(device_ip, device_name)
);

-- Set all existing devices' location to 'HCMC office'
UPDATE atd_device SET location = 'HCMC office' WHERE location IS NULL OR location != 'HCMC office';
