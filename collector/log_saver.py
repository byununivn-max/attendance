"""
Hikvision 로그 -> atd_raw_log DB 저장 모듈
- 중복 방지: (emp_id, event_time) 기준
- hikvision_pid -> emp_id 매핑 사용
"""
from datetime import datetime
import psycopg2.extras
from collector.db_conn import get_conn


def resolve_emp_id(cur, device_id: int, hikvision_pid: str) -> int | None:
    """Hikvision person ID를 내부 emp_id로 변환."""
    cur.execute(
        "SELECT emp_id FROM atd_device_employee_map "
        "WHERE device_id = %s AND hikvision_pid = %s AND is_active = true",
        (device_id, hikvision_pid),
    )
    row = cur.fetchone()
    return row[0] if row else None


def infer_event_type(event_minor: int) -> str:
    """Hikvision minor 코드로 이벤트 유형 판정."""
    # Hikvision: minor=75 = check-in, 76 = check-out (기종별 상이, 필요시 수정)
    mapping = {75: "CHECK_IN", 76: "CHECK_OUT"}
    return mapping.get(event_minor, "FACE_MATCH")


def save_logs(device_id: int, raw_logs: list[dict]) -> dict:
    """
    장치 원천 로그를 atd_raw_log에 저장.
    Returns: {'inserted': int, 'skipped': int, 'unmapped': int}
    """
    inserted = skipped = unmapped = 0

    with get_conn() as conn, conn.cursor() as cur:
        for log in raw_logs:
            hikvision_pid = str(log.get("employeeNoString", log.get("cardNo", "")))
            emp_id = resolve_emp_id(cur, device_id, hikvision_pid)

            if emp_id is None:
                unmapped += 1
                continue

            event_time_str = log.get("time", "")
            try:
                event_time = datetime.fromisoformat(event_time_str)
            except ValueError:
                skipped += 1
                continue

            event_minor = log.get("minor", 0)
            event_type  = infer_event_type(event_minor)
            access_method = "FACE"  # 기본값; card 사용 시 로그에서 추출 필요

            try:
                cur.execute(
                    """
                    INSERT INTO atd_raw_log
                        (emp_id, device_id, event_time, event_type, access_method, raw_data, source_api)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (
                        emp_id, device_id, event_time, event_type,
                        access_method,
                        psycopg2.extras.Json(log),
                        "ISAPI_AcsEvent",
                    ),
                )
                inserted += cur.rowcount
            except Exception as e:
                print(f"  [WARN] insert failed: {e}")
                skipped += 1

        conn.commit()

    return {"inserted": inserted, "skipped": skipped, "unmapped": unmapped}

