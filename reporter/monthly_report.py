"""
월별 근태 리포트 생성 (Excel)
calculator/monthly_aggregator.py 결과를 엑셀 파일로 저장.

결과: data/attendance_result_YYYYMM.xlsx
시트:
  - Summary: 직원별 월간 요약 (근무일, 지각, 조퇴, 결근, 연차, 초과근무)
  - Detail:  일별 상세 내역 (전 직원)

사용법:
  py -m reporter.monthly_report --year 2026 --month 3
"""
import sys
import os
import argparse
from datetime import date

import pandas as pd
import psycopg2
import psycopg2.extras

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG
from calculator.monthly_aggregator import aggregate_monthly

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def fetch_daily_detail(year: int, month: int) -> list[dict]:
    """일별 상세 데이터 조회."""
    first_day = date(year, month, 1)
    last_day  = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    query = """
        SELECT
            e.emp_code, e.emp_name,
            d.work_date,
            d.actual_check_in,
            d.actual_check_out,
            d.working_minutes,
            d.overtime_minutes,
            d.late_minutes,
            d.early_leave_minutes,
            d.attendance_status,
            d.is_missed_punch,
            d.note
        FROM atd_daily_summary d
        JOIN com_employee e ON d.emp_id = e.emp_id
        WHERE d.work_date >= %s AND d.work_date < %s
        ORDER BY e.emp_code, d.work_date
    """
    with psycopg2.connect(**DB_CONFIG) as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(query, (first_day, last_day))
        return [dict(r) for r in cur.fetchall()]


def generate_report(year: int, month: int) -> str:
    """
    월별 리포트 엑셀 파일 생성.
    Returns: 생성된 파일 경로
    """
    print(f"[report] Generating {year}-{month:02d} report...")

    # 1. Summary sheet
    summary_data = aggregate_monthly(year, month)
    df_summary = pd.DataFrame(summary_data, columns=[
        "emp_code", "emp_name",
        "normal_days", "late_days", "early_leave_days", "absent_days",
        "paid_leave_days", "unpaid_leave_days", "missed_punch_days", "holiday_days",
        "total_working_hours", "total_overtime_hours",
        "total_late_minutes", "total_early_leave_minutes",
    ])
    df_summary.columns = [
        "사번", "이름",
        "정상", "지각", "조퇴", "결근",
        "연차", "무급휴가", "누락", "공휴일",
        "총근무(h)", "초과근무(h)",
        "지각(분)", "조퇴(분)",
    ]

    # 2. Detail sheet
    detail_data = fetch_daily_detail(year, month)
    df_detail = pd.DataFrame(detail_data)
    if not df_detail.empty:
        df_detail.rename(columns={
            "emp_code":           "사번",
            "emp_name":           "이름",
            "work_date":          "날짜",
            "actual_check_in":    "출근",
            "actual_check_out":   "퇴근",
            "working_minutes":    "근무(분)",
            "overtime_minutes":   "초과(분)",
            "late_minutes":       "지각(분)",
            "early_leave_minutes":"조퇴(분)",
            "attendance_status":  "상태",
            "is_missed_punch":    "누락",
            "note":               "비고",
        }, inplace=True)

    # 3. Write Excel
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, f"attendance_result_{year}{month:02d}.xlsx")

    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        df_summary.to_excel(writer, sheet_name="Summary", index=False)
        if not df_detail.empty:
            df_detail.to_excel(writer, sheet_name="Detail", index=False)

        # Auto-width columns for Summary sheet
        ws = writer.sheets["Summary"]
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 30)

    print(f"[report] Saved: {out_path}")
    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate monthly attendance Excel report")
    parser.add_argument("--year",  type=int, default=date.today().year)
    parser.add_argument("--month", type=int, default=date.today().month - 1 or 12)
    args = parser.parse_args()
    generate_report(args.year, args.month)
