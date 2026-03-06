"""
출퇴근 누락 보정 워크플로우
- submit_correction(): 직원이 누락 보정 신청
- approve_correction(): 관리자가 승인 → atd_daily_summary 즉시 업데이트
- reject_correction(): 관리자가 반려
- list_pending():      PENDING 목록 조회

사용법:
  py -m workflow.punch_correction list
  py -m workflow.punch_correction submit --emp 3 --date 2026-03-05 --type IN --time "2026-03-05 08:35" --reason "forgot"
  py -m workflow.punch_correction approve --id 1 --approver 1
  py -m workflow.punch_correction reject  --id 1 --approver 1
"""
import sys
import os
import argparse
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG
import psycopg2
import psycopg2.extras


def get_conn():
    return psycopg2.connect(**DB_CONFIG)


def submit_correction(emp_id: int, work_date: str, punch_type: str,
                      requested_time: str, reason: str = "") -> int:
    """
    보정 신청 생성.
    punch_type: 'IN' | 'OUT' | 'BOTH'
    Returns: correction_id
    """
    if punch_type not in ("IN", "OUT", "BOTH"):
        raise ValueError(f"Invalid punch_type: {punch_type}")

    req_time = datetime.fromisoformat(requested_time)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO atd_punch_correction
                (emp_id, work_date, punch_type, requested_time, reason, status)
            VALUES (%s, %s, %s, %s, %s, 'PENDING')
            RETURNING correction_id
            """,
            (emp_id, work_date, punch_type, req_time, reason),
        )
        correction_id = cur.fetchone()[0]
        conn.commit()

    print(f"[submit] correction_id={correction_id} created (PENDING)")
    return correction_id


def approve_correction(correction_id: int, approver_id: int) -> bool:
    """
    보정 승인 → atd_daily_summary 실제 시각 업데이트.
    Returns: True if approved
    """
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        # 1. Fetch correction record
        cur.execute(
            "SELECT * FROM atd_punch_correction WHERE correction_id = %s AND status = 'PENDING'",
            (correction_id,),
        )
        corr = cur.fetchone()
        if not corr:
            print(f"[approve] correction_id={correction_id} not found or not PENDING")
            return False

        emp_id     = corr["emp_id"]
        work_date  = corr["work_date"]
        punch_type = corr["punch_type"]
        req_time   = corr["requested_time"]

        # 2. Update atd_daily_summary
        if punch_type == "IN":
            cur.execute(
                """
                UPDATE atd_daily_summary
                SET actual_check_in = %s, is_missed_punch = false, is_modified = true,
                    modified_by = %s, updated_at = now()
                WHERE emp_id = %s AND work_date = %s
                """,
                (req_time, approver_id, emp_id, work_date),
            )
        elif punch_type == "OUT":
            cur.execute(
                """
                UPDATE atd_daily_summary
                SET actual_check_out = %s, is_missed_punch = false, is_modified = true,
                    modified_by = %s, updated_at = now()
                WHERE emp_id = %s AND work_date = %s
                """,
                (req_time, approver_id, emp_id, work_date),
            )
        else:  # BOTH
            cur.execute(
                """
                UPDATE atd_daily_summary
                SET actual_check_in = %s, actual_check_out = %s,
                    is_missed_punch = false, is_modified = true,
                    modified_by = %s, updated_at = now()
                WHERE emp_id = %s AND work_date = %s
                """,
                (req_time, req_time, approver_id, emp_id, work_date),
            )

        # 3. Mark correction as APPROVED
        cur.execute(
            """
            UPDATE atd_punch_correction
            SET status = 'APPROVED', approved_by = %s, approved_at = now(), updated_at = now()
            WHERE correction_id = %s
            """,
            (approver_id, correction_id),
        )
        conn.commit()

    print(f"[approve] correction_id={correction_id} APPROVED by emp_id={approver_id}")
    return True


def reject_correction(correction_id: int, approver_id: int) -> bool:
    """보정 반려."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE atd_punch_correction
            SET status = 'REJECTED', approved_by = %s, approved_at = now(), updated_at = now()
            WHERE correction_id = %s AND status = 'PENDING'
            RETURNING correction_id
            """,
            (approver_id, correction_id),
        )
        updated = cur.rowcount
        conn.commit()

    if updated:
        print(f"[reject] correction_id={correction_id} REJECTED")
        return True
    else:
        print(f"[reject] correction_id={correction_id} not found or not PENDING")
        return False


def list_pending() -> list[dict]:
    """PENDING 보정 신청 목록."""
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            """
            SELECT c.correction_id, c.emp_id, e.emp_name, c.work_date,
                   c.punch_type, c.requested_time, c.reason, c.created_at
            FROM atd_punch_correction c
            JOIN com_employee e ON c.emp_id = e.emp_id
            WHERE c.status = 'PENDING'
            ORDER BY c.created_at
            """
        )
        rows = [dict(r) for r in cur.fetchall()]

    print(f"[list_pending] {len(rows)} pending corrections")
    for r in rows:
        print(f"  [{r['correction_id']}] emp={r['emp_name']} date={r['work_date']} type={r['punch_type']} time={r['requested_time']} | {r['reason']}")
    return rows


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    sub.add_parser("list")

    p_submit = sub.add_parser("submit")
    p_submit.add_argument("--emp",    type=int, required=True)
    p_submit.add_argument("--date",   required=True)
    p_submit.add_argument("--type",   required=True, choices=["IN","OUT","BOTH"])
    p_submit.add_argument("--time",   required=True)
    p_submit.add_argument("--reason", default="")

    p_approve = sub.add_parser("approve")
    p_approve.add_argument("--id",       type=int, required=True)
    p_approve.add_argument("--approver", type=int, required=True)

    p_reject = sub.add_parser("reject")
    p_reject.add_argument("--id",       type=int, required=True)
    p_reject.add_argument("--approver", type=int, required=True)

    args = parser.parse_args()

    if args.cmd == "list":
        list_pending()
    elif args.cmd == "submit":
        submit_correction(args.emp, args.date, args.type, args.time, args.reason)
    elif args.cmd == "approve":
        approve_correction(args.id, args.approver)
    elif args.cmd == "reject":
        reject_correction(args.id, args.approver)
    else:
        parser.print_help()
