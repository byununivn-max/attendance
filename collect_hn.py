"""
하노이 오피스 출결 수집 스크립트
- 하노이 사무소 PC에서 실행
- 로컬 Hikvision 장치(192.168.0.54) → 중앙 DB 저장

사용법:
  python collect_hn.py                    # 어제 데이터 수집
  python collect_hn.py --date 2026-03-13  # 특정 날짜 수집

cron 예시 (매일 새벽 1시):
  0 1 * * * cd /path/to/attendance && python collect_hn.py >> /tmp/collect_hn.log 2>&1

필요 환경변수 (.env):
  DB_HOST=<중앙 DB 호스트>
  DB_PORT=5432
  DB_NAME=attendance
  DB_USER=postgres
  DB_PASSWORD=<DB 비밀번호>
  DEVICE_USERNAME=admin
  DEVICE_PASSWORD=Uni1209$
"""
import sys
import datetime

from config import DEVICE_USERNAME, DEVICE_PASSWORD
from collector.hikvision_client import HikvisionClient
from collector.log_saver import save_logs
from collector.db_conn import get_conn

DEVICE_IP = "192.168.0.54"
DEVICE_LOCATION = "HN office"
TZ_OFFSET = "+07:00"


def get_hn_device() -> dict:
    """중앙 DB에서 HN office 장치 정보를 조회."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT device_id, device_name, device_ip, port "
            "FROM atd_device WHERE location = %s AND status = 'ACTIVE' LIMIT 1",
            (DEVICE_LOCATION,),
        )
        row = cur.fetchone()
        if not row:
            raise RuntimeError(
                f"DB에 '{DEVICE_LOCATION}' 장치가 없습니다. "
                "db/09_add_hanoi_device.sql 을 먼저 실행하세요."
            )
        return {
            "id":       row[0],
            "name":     row[1],
            "ip":       row[2] or DEVICE_IP,
            "port":     row[3] or 80,
            "username": DEVICE_USERNAME,
            "password": DEVICE_PASSWORD,
        }


def collect_date(target_date: datetime.date):
    start = f"{target_date}T00:00:00{TZ_OFFSET}"
    end   = f"{target_date}T23:59:59{TZ_OFFSET}"
    print(f"\n[HN Collect] {target_date} | {start} ~ {end}")

    device = get_hn_device()
    client = HikvisionClient(device)
    logs   = client.get_attendance_logs(start, end)
    result = save_logs(device["id"], logs)
    print(f"  [{device['name']}] inserted={result['inserted']} skipped={result['skipped']} unmapped={result['unmapped']}")


if __name__ == "__main__":
    if "--date" in sys.argv:
        idx = sys.argv.index("--date")
        target = datetime.date.fromisoformat(sys.argv[idx + 1])
    else:
        target = datetime.date.today() - datetime.timedelta(days=1)

    collect_date(target)
