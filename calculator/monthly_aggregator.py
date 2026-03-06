"""
월별 근태 집계 모듈
atd_daily_summary → 직원별 월간 요약 (급여 연동용)
"""
import sys
import os
from datetime import date

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG
import psycopg2
import psycopg2.extras


def aggregate_monthly(year: int, month: int) -> list[dict]:
    """
    특정 연월의 전 직원 근태를 집계하여 반환.
    Returns: list of dicts per employee
    """
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1)
    else:
        last_day = date(year, month + 1, 1)

    query = """
        SELECT
            d.emp_id,
            e.emp_code,
            e.emp_name,
            COUNT(*) FILTER (WHERE d.attendance_status = 'NORMAL')        AS normal_days,
            COUNT(*) FILTER (WHERE d.attendance_status = 'LATE')          AS late_days,
            COUNT(*) FILTER (WHERE d.attendance_status = 'EARLY_LEAVE')   AS early_leave_days,
            COUNT(*) FILTER (WHERE d.attendance_status = 'ABSENT')        AS absent_days,
            COUNT(*) FILTER (WHERE d.attendance_status = 'PAID_LEAVE')    AS paid_leave_days,
            COUNT(*) FILTER (WHERE d.attendance_status = 'UNPAID_LEAVE')  AS unpaid_leave_days,
            COUNT(*) FILTER (WHERE d.attendance_status = 'MISSED_PUNCH')  AS missed_punch_days,
            COUNT(*) FILTER (WHERE d.attendance_status = 'HOLIDAY')       AS holiday_days,
            COALESCE(SUM(d.working_minutes), 0)                           AS total_working_minutes,
            COALESCE(SUM(d.overtime_minutes), 0)                          AS total_overtime_minutes,
            COALESCE(SUM(d.late_minutes), 0)                              AS total_late_minutes,
            COALESCE(SUM(d.early_leave_minutes), 0)                       AS total_early_leave_minutes
        FROM atd_daily_summary d
        JOIN com_employee e ON d.emp_id = e.emp_id
        WHERE d.work_date >= %s AND d.work_date < %s
        GROUP BY d.emp_id, e.emp_code, e.emp_name
        ORDER BY e.emp_code
    """

    with psycopg2.connect(**DB_CONFIG) as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, (first_day, last_day))
        rows = cur.fetchall()

    results = []
    for row in rows:
        results.append({
            "emp_id":                 row["emp_id"],
            "emp_code":               row["emp_code"],
            "emp_name":               row["emp_name"],
            "normal_days":            row["normal_days"],
            "late_days":              row["late_days"],
            "early_leave_days":       row["early_leave_days"],
            "absent_days":            row["absent_days"],
            "paid_leave_days":        row["paid_leave_days"],
            "unpaid_leave_days":      row["unpaid_leave_days"],
            "missed_punch_days":      row["missed_punch_days"],
            "holiday_days":           row["holiday_days"],
            "total_working_hours":    round(row["total_working_minutes"] / 60, 2),
            "total_overtime_hours":   round(row["total_overtime_minutes"] / 60, 2),
            "total_late_minutes":     row["total_late_minutes"],
            "total_early_leave_minutes": row["total_early_leave_minutes"],
        })

    print(f"[monthly_aggregator] {year}-{month:02d}: {len(results)} employees aggregated")
    return results


if __name__ == "__main__":
    import json
    if len(sys.argv) >= 3:
        y, m = int(sys.argv[1]), int(sys.argv[2])
    else:
        today = date.today()
        y, m = today.year, today.month - 1 if today.month > 1 else (today.year - 1, 12)
    data = aggregate_monthly(y, m)
    print(json.dumps(data, ensure_ascii=False, indent=2))
