-- Migration 09: Register Hanoi office device
-- Hikvision terminal at 192.168.0.54 (Hanoi office internal network)
-- Collection is handled by collect_hn.py running on the Hanoi office PC

INSERT INTO atd_device (device_name, device_ip, location, status, port)
VALUES ('HN Entrance', '192.168.0.54', 'HN office', 'ACTIVE', 80)
ON CONFLICT DO NOTHING;
