import requests
import datetime
import time
# Device info
device_ip = "192.168.0.54"
username = "admin"
password = "Uni1209$"
auth = requests.auth.HTTPDigestAuth(username, password)
def get_all_attendance_logs(start_time, end_time, max_results=100):
    """
    Lấy tất cả attendance logs thông qua phân trang
    """
    url = f"http://{device_ip}/ISAPI/AccessControl/AcsEvent?format=json"
    all_logs = []
    search_position = 0
    search_id = "1"
    while True:
        payload = {
            "AcsEventCond": {
                "searchID": search_id,
                "searchResultPosition": search_position,
                "maxResults": max_results,
                "major": 5,          # attendance event
                "minor": 0,
                "startTime": start_time,
                "endTime": end_time
            }
        }
        try:
            response = requests.post(url, auth=auth, json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                acs_event = data.get('AcsEvent', {})
                # Lấy logs từ response hiện tại
                info_list = acs_event.get('InfoList', [])
                all_logs.extend(info_list) 
                print(f"📊 Đã lấy {len(info_list)} records (tổng: {len(all_logs)})")
                # Kiểm tra xem còn dữ liệu không
                response_status = acs_event.get('responseStatusStrg', '')
                total_matches = acs_event.get('totalMatches', 0)
                if response_status != 'MORE' or len(all_logs) >= total_matches:
                    print(f"✅ Hoàn thành! Tổng cộng {len(all_logs)} records")
                    break
                # Cập nhật vị trí cho lần tiếp theo
                search_position += len(info_list)
                # Nghỉ ngắn để tránh quá tải server
                time.sleep(0.5)
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                break
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error: {e}")
            break
    print(all_logs)
    return all_logs
 
 
# Today range (you can change for daily batch jobs)
today = datetime.date.today()
start_time = f"{today}T00:00:00+08:00"
end_time = f"{today}T23:59:59+08:00"
 
print(f"🔍 Lấy attendance logs từ {start_time} đến {end_time}")
all_attendance_logs = get_all_attendance_logs(start_time, end_time)
 
if all_attendance_logs:
    print(f"\n📋 Tổng kết:")
    print(f"   - Tổng số records: {len(all_attendance_logs)}")
    print(f"   - Records đầu tiên: {all_attendance_logs[0] if all_attendance_logs else 'None'}")
print(f"   - Records cuối cùng: {all_attendance_logs[-1] if all_attendance_logs else 'None'}")
    print(all_attendance_logs)
else:
    print("❌ Không có dữ liệu nào được lấy về")