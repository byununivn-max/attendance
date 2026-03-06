"""
Hikvision ISAPI 클라이언트
atd_raw_log 수집을 위한 장치 API 연동 모듈
"""
import time
import requests
from requests.auth import HTTPDigestAuth

from config import MAX_RESULTS_PER_PAGE, REQUEST_TIMEOUT, SLEEP_BETWEEN_PAGES


class HikvisionClient:
    def __init__(self, device: dict):
        self.device_name = device["name"]
        self.device_ip   = device["ip"]
        self.auth = HTTPDigestAuth(device["username"], device["password"])
        self.base_url = f"http://{device['ip']}"

    def get_attendance_logs(self, start_time: str, end_time: str) -> list[dict]:
        """
        지정 기간의 출결 로그 전체를 페이지네이션으로 수집.
        Args:
            start_time: ISO8601 (예: '2026-03-01T00:00:00+07:00')
            end_time:   ISO8601 (예: '2026-03-01T23:59:59+07:00')
        Returns:
            AcsEvent InfoList 항목 리스트
        """
        url = f"{self.base_url}/ISAPI/AccessControl/AcsEvent?format=json"
        all_logs = []
        search_position = 0
        search_id = "1"

        while True:
            payload = {
                "AcsEventCond": {
                    "searchID": search_id,
                    "searchResultPosition": search_position,
                    "maxResults": MAX_RESULTS_PER_PAGE,
                    "major": 5,       # attendance event
                    "minor": 0,
                    "startTime": start_time,
                    "endTime": end_time,
                }
            }
            try:
                resp = requests.post(url, auth=self.auth, json=payload, timeout=REQUEST_TIMEOUT)
                resp.raise_for_status()

                acs = resp.json().get("AcsEvent", {})
                info_list = acs.get("InfoList", [])
                all_logs.extend(info_list)

                total = acs.get("totalMatches", 0)
                status_str = acs.get("responseStatusStrg", "")
                print(f"  [{self.device_name}] {len(info_list)} records (total: {len(all_logs)}/{total})")

                if status_str != "MORE" or len(all_logs) >= total:
                    break

                search_position += len(info_list)
                time.sleep(SLEEP_BETWEEN_PAGES)

            except requests.exceptions.RequestException as e:
                print(f"  [ERROR] {self.device_name}: {e}")
                break

        return all_logs
