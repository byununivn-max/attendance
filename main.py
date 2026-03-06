"""
출결 관리 시스템 CLI 진입점
=================================
사용법:
  py main.py collect  --date 2026-03-05        # 수동 데이터 수집
  py main.py calc     --date 2026-03-05        # 특정 날 정산
  py main.py report   --year 2026 --month 3   # 월간 리포트 생성
  py main.py leave    import                   # 연차 CSV 임포트
  py main.py holiday  --year 2026              # 공휴일 등록
  py main.py correct  list                     # 누락 보정 목록
  py main.py correct  submit ...               # 보정 신청
  py main.py correct  approve --id 1 --approver 1
  py main.py schedule                          # 자동 수집 스케줄러 시작
"""
import sys
import argparse
from datetime import date, datetime, timedelta


def cmd_collect(args):
    from collector.scheduler import collect_date
    target = date.fromisoformat(args.date) if args.date else date.today() - timedelta(days=1)
    collect_date(target)


def cmd_calc(args):
    from calculator.attendance_calculator import calculate_daily_attendance
    target = args.date or (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
    calculate_daily_attendance(target)


def cmd_report(args):
    from reporter.monthly_report import generate_report
    y = args.year  or date.today().year
    m = args.month or (date.today().month - 1 or 12)
    generate_report(y, m)


def cmd_leave(args):
    if args.action == "import":
        from importer.leave_importer import import_leaves
        import_leaves()
    else:
        print(f"Unknown leave action: {args.action}")


def cmd_holiday(args):
    from importer.holiday_importer import import_holidays
    import_holidays(
        year=args.year or date.today().year,
        region=args.region,
        dry_run=args.dry_run,
    )


def cmd_correct(args):
    from workflow.punch_correction import (
        list_pending, submit_correction, approve_correction, reject_correction
    )
    if args.action == "list":
        list_pending()
    elif args.action == "submit":
        submit_correction(args.emp, args.date, args.type, args.time, args.reason or "")
    elif args.action == "approve":
        approve_correction(args.id, args.approver)
    elif args.action == "reject":
        reject_correction(args.id, args.approver)
    else:
        print(f"Unknown correct action: {args.action}")


def cmd_schedule(args):
    from collector.scheduler import run_scheduler
    run_scheduler()


def main():
    parser = argparse.ArgumentParser(
        prog="main.py",
        description="출결 관리 시스템 CLI",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command")

    # collect
    p = sub.add_parser("collect", help="Hikvision 장치에서 출결 로그 수집")
    p.add_argument("--date", help="YYYY-MM-DD (default: yesterday)")

    # calc
    p = sub.add_parser("calc", help="일별 근태 정산")
    p.add_argument("--date", help="YYYY-MM-DD (default: yesterday)")

    # report
    p = sub.add_parser("report", help="월간 Excel 리포트 생성")
    p.add_argument("--year",  type=int)
    p.add_argument("--month", type=int)

    # leave
    p = sub.add_parser("leave", help="연차/휴가 관리")
    p.add_argument("action", choices=["import"])

    # holiday
    p = sub.add_parser("holiday", help="공휴일 등록")
    p.add_argument("--year",    type=int)
    p.add_argument("--region",  choices=["VN","KR","ALL"], default="ALL")
    p.add_argument("--dry-run", dest="dry_run", action="store_true")

    # correct
    p = sub.add_parser("correct", help="출퇴근 누락 보정")
    p.add_argument("action", choices=["list","submit","approve","reject"])
    p.add_argument("--emp",      type=int)
    p.add_argument("--date")
    p.add_argument("--type",     choices=["IN","OUT","BOTH"])
    p.add_argument("--time")
    p.add_argument("--reason")
    p.add_argument("--id",       type=int)
    p.add_argument("--approver", type=int)

    # schedule
    sub.add_parser("schedule", help="자동 수집 스케줄러 시작 (daemon)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    dispatch = {
        "collect":  cmd_collect,
        "calc":     cmd_calc,
        "report":   cmd_report,
        "leave":    cmd_leave,
        "holiday":  cmd_holiday,
        "correct":  cmd_correct,
        "schedule": cmd_schedule,
    }
    dispatch[args.command](args)


if __name__ == "__main__":
    main()
