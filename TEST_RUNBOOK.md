# 출결 관리 시스템 - 테스트 운용 가이드

작성일: 2026-03-09

---

## 전제 조건

| 항목 | 내용 |
|------|------|
| Python | `py` 명령어 사용 (python3 아님) |
| PostgreSQL | 16+ |
| 포트 | 5432 (기본값) |
| DB명 | attendance |

---

## Step 0. 파일 구성 확인

서버로 복사해야 할 것:
```
attendance/
  .env                     # DB 접속 정보 (Step 0-1에서 수정)
  requirements.txt
  main.py
  config.py
  collector/
  calculator/
  reporter/
  importer/
  workflow/
  db/
    01_create_tables.sql
    02_seed_data.sql
    03_mock_hr_tables.sql
    04_alter_schema.sql
    05_load_xlsx_data.py
  data/
    attendance_result.xlsx
    Annual Leave.csv
  frontend/                # 웹 UI (별도 실행)
```

---

## Step 0-1. .env 설정 (서버 환경에 맞게 수정)

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance
DB_USER=postgres
DB_PASSWORD=서버비밀번호

DEVICE_IP=192.168.0.54
DEVICE_USERNAME=admin
DEVICE_PASSWORD=장치비밀번호

TZ=Asia/Ho_Chi_Minh
```

---

## Step 1. Python 패키지 설치

```bash
pip install -r requirements.txt
# 또는
py -m pip install -r requirements.txt
```

---

## Step 2. DB 연결 테스트

```bash
py -c "from collector.db_conn import get_conn; c=get_conn(); print('DB OK'); c.close()"
```

- `DB OK` 출력 -> Step 3으로
- 오류 -> `.env` 비밀번호/호스트 확인

---

## Step 3. PostgreSQL DB 생성 (없으면)

```bash
psql -U postgres -c "CREATE DATABASE attendance;"
```

---

## Step 4. DDL + Seed 적용

```bash
# 테이블 생성
psql -U postgres -d attendance -f db/01_create_tables.sql

# 시프트/공휴일 기본 데이터
psql -U postgres -d attendance -f db/02_seed_data.sql

# Mock 직원 테이블 (테스트용)
psql -U postgres -d attendance -f db/03_mock_hr_tables.sql

# 스키마 추가 변경사항
psql -U postgres -d attendance -f db/04_alter_schema.sql
```

---

## Step 5. xlsx 데이터 로딩

`data/attendance_result.xlsx` 와 `data/Annual Leave.csv` 를 DB에 적재합니다.

```bash
# 먼저 dry-run으로 내용 확인
py db/05_load_xlsx_data.py --dry-run

# 확인 후 실제 로딩
py db/05_load_xlsx_data.py
```

로딩 내용:
1. [User 시트] -> com_employee 직원 등록 (EXI001~)
2. Hikvision person ID -> atd_device_employee_map 매핑
3. [Attendance-record (raw) 시트] -> atd_raw_log
4. Annual Leave.csv -> hr_leave_request
5. 모든 직원 근무 스케줄 배정 (Standard 08:30~17:30)

---

## Step 6. 출결 계산

xlsx 데이터의 날짜 범위에 맞춰 실행합니다.

```bash
py main.py calc --date 2026-02-01
py main.py calc --date 2026-02-28
```

---

## Step 7. 월별 리포트 생성

```bash
py main.py report --year 2026 --month 2
```

---

## Step 8. 공휴일 로딩 (선택)

```bash
py main.py holiday --year 2026 --region VN --dry-run
py main.py holiday --year 2026 --region VN
```

---

## Step 9. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저: http://서버IP:3000

---

## CLI 전체 명령어 참조

```bash
py main.py collect   --date 2026-03-05      # 장치에서 로그 수집
py main.py calc      --date 2026-03-05      # 출결 계산
py main.py report    --year 2026 --month 3  # 월 리포트
py main.py leave     import                 # 연차 CSV 임포트
py main.py holiday   --year 2026 --region VN [--dry-run]
py main.py correct   [list|submit|approve|reject]
py main.py schedule                         # 스케줄러 데몬 시작
```

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| DB connection failed | .env 비밀번호 오류 | .env 수정 후 재시도 |
| relation does not exist | DDL 미적용 | Step 4 재실행 |
| ModuleNotFoundError | 패키지 미설치 | Step 1 재실행 |
| xlsx 로딩 오류 | 파일 경로 불일치 | data/ 폴더에 파일 있는지 확인 |
| 프론트 API 오류 | DB 데이터 없음 | Step 5~6 완료 후 재시도 |
