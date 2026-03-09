-- Seed Data: Initial master data for attendance system

-- ============================================================
-- 1. Hikvision Device Registration
-- ============================================================
INSERT INTO atd_device (device_name, device_ip, location, status) VALUES
  ('Main Entrance', '192.168.0.54', 'Ground Floor - Main Gate', 'ACTIVE');

-- ============================================================
-- 2. Shift Master Data
-- ============================================================
-- Standard shift: 08:30 ~ 17:30 (lunch 12:00~13:00), 10min grace
INSERT INTO atd_shift (shift_code, shift_name, start_time, end_time, lunch_start, lunch_end, grace_period_in, grace_period_out, min_work_hours) VALUES
  ('STD', 'Standard (08:30~17:30)', '08:30', '17:30', '12:00', '13:00', 10, 10, 8.0),
  ('MORNING_HALF', 'Morning Half-day (08:30~12:30)', '08:30', '12:30', NULL, NULL, 10, 10, 4.0),
  ('AFTERNOON_HALF', 'Afternoon Half-day (13:30~17:30)', '13:30', '17:30', NULL, NULL, 10, 10, 4.0);

-- ============================================================
-- 3. Vietnam Public Holidays 2026
-- ============================================================
INSERT INTO atd_holiday (holiday_date, holiday_name, holiday_name_vi, is_paid, region) VALUES
  ('2026-01-01', 'New Year',        'Ngay Dau Nam',            true, 'BOTH'),
  ('2026-01-28', 'Tet Holiday (D-1)', 'Nghi tet Nguyen Dan',  true, 'VN'),
  ('2026-01-29', 'Tet Holiday',      'Nghi tet Nguyen Dan',   true, 'VN'),
  ('2026-01-30', 'Tet Holiday',      'Nghi tet Nguyen Dan',   true, 'VN'),
  ('2026-01-31', 'Tet Holiday',      'Nghi tet Nguyen Dan',   true, 'VN'),
  ('2026-02-01', 'Tet Holiday',      'Nghi tet Nguyen Dan',   true, 'VN'),
  ('2026-04-30', 'Reunification Day','Ngay Thong nhat',        true, 'VN'),
  ('2026-05-01', 'Labour Day',       'Ngay Quoc te Lao dong', true, 'BOTH'),
  ('2026-09-02', 'National Day',     'Ngay Quoc khanh',       true, 'VN');
