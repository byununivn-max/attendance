"""
자동 수집 스케줄러
- 매일 새벽 1시: 전날 데이터 수집 + 정산
- 수동 실행: python -m collector.scheduler --date 2026-03-05
"""
import sys
import datetime
import schedule
import time

from config import DEVICE_USERNAME, DEVICE_PASSWORD, TIMEZONE
from collector.hikvision_client import HikvisionClient
from collector.log_saver import save_logs
from collector.db_conn import get_conn


def get_active_devices() -> list[dict]:
    """DB에서 ACTIVE 상태의 HCMC 장치 목록을 로드.
    HN office 장치는 collect_hn.py (하노이 PC)에서 별도 수집."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT device_id, device_name, device_ip, port FROM atd_device "
            "WHERE status = 'ACTIVE' AND (location IS NULL OR location != 'HN office')"
        )
        rows = cur.fetchall()
        return [
            {
                "id": r[0],
                "name": r[1],
                "ip": r[2],
                "port": r[3] or 80,
                "username": DEVICE_USERNAME,
                "password": DEVICE_PASSWORD,
            }
            for r in rows
        ]


def collect_date(target_date: datetime.date):
    """특정 날짜의 출결 데이터를 모든 장치에서 수집."""
    tz_offset = "+07:00"  # Vietnam UTC+7
    start = f"{target_date}T00:00:00{tz_offset}"
    end   = f"{target_date}T23:59:59{tz_offset}"

    print(f"\n[Collect] {target_date} | {start} ~ {end}")

    devices = get_active_devices()
    if not devices:
        print("  [WARN] No active devices found in DB")
        return

    for device_cfg in devices:
        client = HikvisionClient(device_cfg)
        logs   = client.get_attendance_logs(start, end)
        result = save_logs(device_cfg["id"], logs)
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
