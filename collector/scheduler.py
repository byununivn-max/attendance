"""
자동 수집 스케줄러
- 매일 새벽 1시: 전날 데이터 수집 + 정산
- 수동 실행: python -m collector.scheduler --date 2026-03-05
"""
import sys
import datetime
import schedule
import time

from config import DEVICES, TIMEZONE
from collector.hikvision_client import HikvisionClient
from collector.log_saver import save_logs
from collector.db_conn import get_conn


def get_device_id(device_ip: str) -> int | None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT device_id FROM atd_device WHERE device_ip = %s AND status = 'ACTIVE'", (device_ip,))
        row = cur.fetchone()
        return row[0] if row else None


def collect_date(target_date: datetime.date):
    """특정 날짜의 출결 데이터를 모든 장치에서 수집."""
    tz_offset = "+07:00"  # Vietnam UTC+7
    start = f"{target_date}T00:00:00{tz_offset}"
    end   = f"{target_date}T23:59:59{tz_offset}"

    print(f"\n[Collect] {target_date} | {start} ~ {end}")

    for device_cfg in DEVICES:
        device_id = get_device_id(device_cfg["ip"])
        if device_id is None:
            print(f"  [SKIP] Device {device_cfg['ip']} not registered in DB")
            continue

        client = HikvisionClient(device_cfg)
        logs   = client.get_attendance_logs(start, end)
        result = save_logs(device_id, logs)
        print(f"  [{device_cfg['name']}] inserted={result['inserted']} skipped={result['skipped']} unmapped={result['unmapped']}")


def daily_job():
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    collect_date(yesterday)
    # 정산 엔진 호출 (Phase 3 구현 후 연결)
    # from calculator.daily_calculator import calculate_date
    # calculate_date(yesterday)


def run_scheduler():
    schedule.every().day.at("01:00").do(daily_job)
    print("[Scheduler] Running. Collects yesterday data at 01:00 daily.")
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    if "--date" in sys.argv:
        idx = sys.argv.index("--date")
        date_str = sys.argv[idx + 1]
        collect_date(datetime.date.fromisoformat(date_str))
    else:
        run_scheduler()
