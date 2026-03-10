-- ============================================================
-- 07_graph_migration.sql
-- Migrate from SCIM provisioning to Microsoft Graph API sync
-- ============================================================

-- 1. Rename SCIM columns to generic names
ALTER TABLE com_employee RENAME COLUMN scim_external_id TO graph_id;
ALTER TABLE com_employee RENAME COLUMN scim_display_name TO display_name;

-- 2. Add Graph API columns
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS job_title        VARCHAR(200);
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS manager_id       BIGINT REFERENCES com_employee(emp_id);
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS manager_graph_id VARCHAR(255);
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS account_enabled  BOOLEAN DEFAULT true;
ALTER TABLE com_employee ADD COLUMN IF NOT EXISTS last_graph_sync  TIMESTAMPTZ;

-- 3. Ensure unique index on graph_id
DROP INDEX IF EXISTS idx_com_employee_graph_id;
CREATE UNIQUE INDEX idx_com_employee_graph_id ON com_employee(graph_id);

-- 4. Sync log table
CREATE TABLE IF NOT EXISTS graph_sync_log (
    sync_id           BIGSERIAL   PRIMARY KEY,
    sync_type         VARCHAR(30) NOT NULL CHECK (sync_type IN ('users','licenses','groups','full')),
    status            VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
    users_synced      INT DEFAULT 0,
    users_created     INT DEFAULT 0,
    users_updated     INT DEFAULT 0,
    users_deactivated INT DEFAULT 0,
    error_message     TEXT,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ
);

-- 5. License table
CREATE TABLE IF NOT EXISTS graph_user_license (
    license_id    BIGSERIAL    PRIMARY KEY,
    emp_id        BIGINT       NOT NULL REFERENCES com_employee(emp_id) ON DELETE CASCADE,
    sku_id        VARCHAR(100) NOT NULL,
    sku_name      VARCHAR(200),
    service_plans JSONB,
    synced_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_emp_sku UNIQUE (emp_id, sku_id)
);
CREATE INDEX IF NOT EXISTS idx_graph_license_emp ON graph_user_license(emp_id);

-- 6. Group table
CREATE TABLE IF NOT EXISTS graph_group (
    group_id       BIGSERIAL    PRIMARY KEY,
    graph_group_id VARCHAR(255) NOT NULL UNIQUE,
    display_name   VARCHAR(300) NOT NULL,
    description    TEXT,
    mail           VARCHAR(255),
    synced_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 7. Group members
CREATE TABLE IF NOT EXISTS graph_group_member (
    id        BIGSERIAL PRIMARY KEY,
    group_id  BIGINT    NOT NULL REFERENCES graph_group(group_id) ON DELETE CASCADE,
    emp_id    BIGINT    NOT NULL REFERENCES com_employee(emp_id) ON DELETE CASCADE,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_group_member UNIQUE (group_id, emp_id)
);
CREATE INDEX IF NOT EXISTS idx_group_member_emp   ON graph_group_member(emp_id);
CREATE INDEX IF NOT EXISTS idx_group_member_group ON graph_group_member(group_id);
