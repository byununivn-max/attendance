# 하노이 오피스 PC 설정 가이드

하노이 사무소 Hikvision 단말기(`192.168.0.54`)에서 출결 데이터를 수집해 중앙 DB에 저장하는 설정 절차입니다.

---

## 0. 전제 조건

하노이 PC에서 아래 두 가지가 가능해야 합니다.
- **Hikvision 장치** (`192.168.0.54`) 접근 → 같은 내부망이므로 OK
- **중앙 DB 서버** 접근 → 인터넷 연결 필요 (Step 5에서 방화벽 허용)

---

## 1. Python 설치 확인

```bash
python --version
```
`Python 3.11` 이상이면 OK. 없으면 https://www.python.org/downloads/ 에서 설치.

---

## 2. 코드 복사

**방법 A — Git clone (권장)**
```bash
git clone <저장소 URL> attendance
cd attendance
```

**방법 B — 직접 복사**
Google Drive / USB 등으로 `attendance` 폴더를 통째로 복사한 뒤 해당 폴더로 이동.

---

## 3. Python 패키지 설치

```bash
pip install -r requirements.txt
```
`requirements.txt`가 없다면:
```bash
pip install requests psycopg2-binary python-dotenv schedule
```

---

## 4. `.env` 파일 생성

`attendance` 폴더 안에 `.env` 파일을 새로 만듭니다.

```env
DB_HOST=<중앙 DB 서버 공인 IP 또는 도메인>
DB_PORT=5432
DB_NAME=attendance
DB_USER=postgres
DB_PASSWORD=<DB 비밀번호>

DEVICE_USERNAME=admin
DEVICE_PASSWORD=Uni1209$
```

> `DB_HOST`는 HCMC 메인 서버의 공인 IP 또는 도메인입니다.

---

## 5. DB 서버 방화벽 허용 (메인 서버에서 작업)

**하노이 PC의 공인 IP 확인** (하노이 PC에서):
```bash
curl ifconfig.me
```

**메인 서버(Ubuntu/Debian)에서 허용**:
```bash
sudo ufw allow from <하노이_공인_IP> to any port 5432
```

또는 PostgreSQL `pg_hba.conf`에 추가:
```
host  attendance  postgres  <하노이_공인_IP>/32  md5
```
추가 후 적용:
```bash
sudo systemctl reload postgresql
```

---

## 6. DB 마이그레이션 실행 (메인 서버에서, 최초 1회)

```bash
psql -d attendance -f db/09_add_hanoi_device.sql
```

등록 확인:
```sql
SELECT device_id, device_name, location, status FROM atd_device;
-- HN Entrance | HN office | ACTIVE 가 보이면 OK
```

---

## 7. 수동 테스트

하노이 PC에서:
```bash
python collect_hn.py --date 2026-03-14
```

정상 출력 예시:
```
[HN Collect] 2026-03-14 | 2026-03-14T00:00:00+07:00 ~ ...
  [HN Entrance] 45 records (total: 45/45)
  [HN Entrance] inserted=45 skipped=0 unmapped=0
```

> `unmapped`가 많다면 하노이 직원의 Hikvision person ID 매핑이 필요합니다.
> DB의 `atd_device_employee_map` 테이블에 HN 직원을 등록하세요.

---

## 8. 자동 실행 (cron) 등록 — 매일 새벽 1시

**Mac / Linux**:
```bash
crontab -e
```
아래 줄 추가:
```
0 1 * * * cd /경로/attendance && python collect_hn.py >> /tmp/collect_hn.log 2>&1
```

**Windows (작업 스케줄러)**:
1. `작업 스케줄러` 열기
2. `기본 작업 만들기` → 매일 01:00
3. 프로그램: `python`, 인수: `collect_hn.py`, 시작 위치: `C:\...\attendance`

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `DB에 'HN office' 장치가 없습니다` | 마이그레이션 미실행 | Step 6 다시 실행 |
| `could not connect to server` (DB) | 방화벽 차단 | Step 5 확인 |
| `Connection refused` (장치) | 장치 IP 또는 전원 확인 | `ping 192.168.0.54` 테스트 |
| `unmapped` 건수가 많음 | 직원 매핑 누락 | `atd_device_employee_map`에 HN 직원 등록 필요 |
