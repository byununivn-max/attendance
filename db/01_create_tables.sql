-- Attendance Management System - DDL
-- DB: PostgreSQL 16+  |  Prefix: atd_

-- ============================================================
-- Section 1. Device & Raw Logs
-- ============================================================

CREATE TABLE IF NOT EXISTS atd_device (
    device_id   SERIAL       PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    device_ip   VARCHAR(50),
    mac_address VARCHAR(100),
    location    VARCHAR(200),
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                             CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE atd_device IS '근태 측정 장치 관리';

CREATE TABLE IF NOT EXISTS atd_device_employee_map (
    map_id        SERIAL      PRIMARY KEY,
    device_id     INT         NOT NULL REFERENCES atd_device(device_id),
    hikvision_pid VARCHAR(50) NOT NULL,
    emp_id        BIGINT      NOT NULL,
    is_active     BOOLEAN     NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_device_person UNIQUE (device_id, hikvision_pid)
);
COMMENT ON TABLE atd_device_employee_map IS 'Hikvision person ID <-> emp_id 매핑';
CREATE INDEX IF NOT EXISTS idx_map_emp ON atd_device_employee_map(emp_id);

CREATE TABLE IF NOT EXISTS atd_raw_log (
    log_id        BIGSERIAL   PRIMARY KEY,
    emp_id        BIGINT      NOT NULL,
    device_id     INT         REFERENCES atd_device(device_id),
    event_time    TIMESTAMPTZ NOT NULL,
    event_type    VARCHAR(50) NOT NULL
                  CHECK (event_type IN ('CHECK_IN', 'CHECK_OUT', 'FACE_MATCH')),
    access_method VARCHAR(50)
                  CHECK (access_method IN ('FACE', 'CARD', 'FINGERPRINT', 'PASSWORD')),
    raw_data      JSONB,
    source_api    VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE atd_raw_log IS '장치 원천 근태 로그 (Hikvision ISAPI)';
CREATE INDEX IF NOT EXISTS idx_atd_raw_emp      ON atd_raw_log(emp_id);
CREATE INDEX IF NOT EXISTS idx_atd_raw_time     ON atd_raw_log(event_time);
CREATE INDEX IF NOT EXISTS idx_atd_raw_emp_time ON atd_raw_log(emp_id, event_time);

-- ============================================================
-- Section 2. Shift & Schedule
-- ============================================================

CREATE TABLE IF NOT EXISTS atd_shift (
    shift_id         SERIAL       PRIMARY KEY,
    shift_code       VARCHAR(20)  NOT NULL UNIQUE,
    shift_name       VARCHAR(100) NOT NULL,
    start_time       TIME         NOT NULL,
    end_time         TIME         NOT NULL,
    lunch_start      TIME,
    lunch_end        TIME,
    grace_period_in  INT          NOT NULL DEFAULT 0,
    grace_period_out INT          NOT NULL DEFAULT 0,
    min_work_hours   DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    is_active        BOOLEAN      NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE atd_shift IS '근무 교대(Shift) 정의 마스터';

CREATE TABLE IF NOT EXISTS atd_employee_schedule (
    schedule_id    BIGSERIAL   PRIMARY KEY,
    emp_id         BIGINT      NOT NULL,
    shift_id       INT         NOT NULL REFERENCES atd_shift(shift_id),
    start_date     DATE        NOT NULL,
    end_date       DATE,
    work_days_mask SMALLINT    NOT NULL DEFAULT 62,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE atd_employee_schedule IS '직원별 근무 스케줄 (비트마스크: 월~금=62)';
CREATE INDEX IF NOT EXISTS idx_atd_sched_emp_date ON atd_employee_schedule(emp_id, start_date);

-- ============================================================
-- Section 3. Daily Summary & Corrections
-- ============================================================

CREATE TABLE IF NOT EXISTS atd_daily_summary (
    summary_id          BIGSERIAL   PRIMARY KEY,
    emp_id              BIGINT      NOT NULL,
    work_date           DATE        NOT NULL,
    shift_id            INT         REFERENCES atd_shift(shift_id),
    actual_check_in     TIMESTAMPTZ,
    actual_check_out    TIMESTAMPTZ,
    working_minutes     INT         NOT NULL DEFAULT 0,
    overtime_minutes    INT         NOT NULL DEFAULT 0,
    late_minutes        INT         NOT NULL DEFAULT 0,
    early_leave_minutes INT         NOT NULL DEFAULT 0,
    attendance_status   VARCHAR(20) NOT NULL
        CHECK (attendance_status IN (
            'NORMAL','LATE','EARLY_LEAVE','ABSENT',
            'HOLIDAY','PAID_LEAVE','UNPAID_LEAVE','MISSED_PUNCH'
        )),
    is_missed_punch     BOOLEAN     NOT NULL DEFAULT false,
    leave_request_id    BIGINT,
    is_modified         BOOLEAN     NOT NULL DEFAULT false,
    modified_by         BIGINT,
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_atd_summary_emp_date UNIQUE (emp_id, work_date)
);
COMMENT ON TABLE atd_daily_summary IS '일별 근태 정산 결과';
CREATE INDEX IF NOT EXISTS idx_atd_summary_date   ON atd_daily_summary(work_date);
CREATE INDEX IF NOT EXISTS idx_atd_summary_status ON atd_daily_summary(attendance_status);
CREATE INDEX IF NOT EXISTS idx_atd_summary_leave  ON atd_daily_summary(leave_request_id)
    WHERE leave_request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS atd_punch_correction (
    correction_id  BIGSERIAL   PRIMARY KEY,
    emp_id         BIGINT      NOT NULL,
    work_date      DATE        NOT NULL,
    punch_type     VARCHAR(10) NOT NULL CHECK (punch_type IN ('IN', 'OUT', 'BOTH')),
    requested_time TIMESTAMPTZ NOT NULL,
    reason         TEXT,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by    BIGINT,
    approved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE atd_punch_correction IS '출퇴근 누락 보정 신청';
CREATE INDEX IF NOT EXISTS idx_punch_corr_emp    ON atd_punch_correction(emp_id);
CREATE INDEX IF NOT EXISTS idx_punch_corr_date   ON atd_punch_correction(work_date);
CREATE INDEX IF NOT EXISTS idx_punch_corr_status ON atd_punch_correction(status);

CREATE TABLE IF NOT EXISTS atd_holiday (
    holiday_id      SERIAL       PRIMARY KEY,
    holiday_date    DATE         NOT NULL UNIQUE,
    holiday_name    VARCHAR(100) NOT NULL,
    holiday_name_vi VARCHAR(100),
    is_paid         BOOLEAN      NOT NULL DEFAULT true,
    region          VARCHAR(10)  NOT NULL DEFAULT 'VN'
        CHECK (region IN ('VN', 'KR', 'BOTH')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE atd_holiday IS '공휴일 및 회사 휴무일';

-- ============================================================
-- updated_at auto-trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS
$$BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['atd_device','atd_shift','atd_employee_schedule','atd_daily_summary','atd_punch_correction'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I;
       CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at();', t, t);
  END LOOP;
END;
$$;
