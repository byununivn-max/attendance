# 출결 관리 시스템 - FE 개발 스펙

> 관세법인 UNI (베트남) | Hikvision 얼굴인식 기반 출결 관리 웹 대시보드
> 작성일: 2026-03-06 | 대상: 프론트엔드 개발자

---

## 1. 시스템 개요

Hikvision 얼굴인식 장치로 수집된 직원 출결 데이터를 관리하는 **관리자 웹 대시보드**.
백엔드는 PostgreSQL 16 + Python FastAPI (API 별도 구축 예정). FE는 REST API를 통해 데이터를 조회/조작한다.

### 1-1. 주요 사용자

| 역할 | 설명 |
|------|------|
| 관리자 (Admin) | 전 직원 출결 조회, 보정 신청 승인/반려, 리포트 다운로드, 공휴일 관리 |
| 직원 (Employee) | 본인 출결 조회, 누락 보정 신청 (선택 기능) |

---

## 2. 화면 목록 (Page Map)

```
/                    대시보드 (오늘의 출결 현황 요약)
/attendance          일별 출결 현황 (날짜/부서/직원 필터)
/attendance/:empId   직원별 월간 출결 캘린더
/report              월별 리포트 (Excel 다운로드)
/corrections         보정 신청 목록 (PENDING 관리)
/corrections/new     보정 신청 등록
/holidays            공휴일 관리
/devices             장치 관리 (CRUD)
/settings            시스템 설정 (Shift 관리)
```

---

## 3. 화면별 상세 스펙

---

### 3-1. 대시보드 /

**목적:** 오늘의 출결 현황을 한 눈에 파악

**표시 데이터:**
- 요약 카드 4개: 정상출근 / 지각 / 결근 / 누락펀치 (오늘 기준)
- 미처리 보정신청 건수 (PENDING count)
- 주간 출결 트렌드 차트 (지난 7일, 상태별 직원수 스택 바차트)

**API 호출:**
```
GET /api/dashboard/today
GET /api/corrections?status=PENDING&limit=1
GET /api/dashboard/weekly-trend
```

---

### 3-2. 일별 출결 현황 /attendance

**목적:** 특정 날짜의 전 직원 출결 상태 테이블

**필터:**
- 날짜 선택 (기본: 오늘)
- 부서 선택 (com_employee.department 기반)
- 상태 필터: NORMAL / LATE / EARLY_LEAVE / ABSENT / MISSED_PUNCH / HOLIDAY / PAID_LEAVE / UNPAID_LEAVE

**테이블 컬럼:** 사번 | 이름 | 부서 | 출근 | 퇴근 | 근무(h) | 초과(h) | 지각(분) | 조퇴(분) | 상태 | 비고

**상태 배지 색상:**
```
NORMAL       green
LATE         yellow/amber
EARLY_LEAVE  orange
ABSENT       red
MISSED_PUNCH red (dashed border)
HOLIDAY      blue
PAID_LEAVE   teal
UNPAID_LEAVE gray
```

**API 호출:**
```
GET /api/attendance/daily?date=2026-03-06&department=&status=
```

**응답 예시:**
```json
[
  {
    "emp_id": 1,
    "emp_code": "UNI001",
    "emp_name": "Nguyen Van A",
    "department": "관세팀",
    "actual_check_in": "2026-03-06T08:35:00+07:00",
    "actual_check_out": "2026-03-06T17:30:00+07:00",
    "working_minutes": 475,
    "overtime_minutes": 0,
    "late_minutes": 5,
    "early_leave_minutes": 0,
    "attendance_status": "LATE",
    "is_missed_punch": false,
    "is_modified": false,
    "note": null
  }
]
```

---

### 3-3. 직원별 월간 캘린더 /attendance/:empId

**목적:** 특정 직원의 월간 출결 상황을 캘린더 형식으로 표시

**표시 내용:**
- 월 이동 (이전달 / 다음달)
- 각 날짜 셀: 출근시각, 퇴근시각, 상태 배지
- 월간 요약 (하단): 정상/지각/조퇴/결근/연차/초과근무 합계

**API 호출:**
```
GET /api/attendance/monthly?emp_id=1&year=2026&month=3
```

**응답 예시:**
```json
{
  "emp_id": 1,
  "emp_name": "Nguyen Van A",
  "year": 2026,
  "month": 3,
  "days": [
    {
      "work_date": "2026-03-06",
      "actual_check_in": "08:35",
      "actual_check_out": "17:30",
      "working_minutes": 475,
      "overtime_minutes": 0,
      "late_minutes": 5,
      "attendance_status": "LATE"
    }
  ],
  "summary": {
    "normal_days": 18,
    "late_days": 2,
    "early_leave_days": 1,
    "absent_days": 0,
    "paid_leave_days": 1,
    "unpaid_leave_days": 0,
    "holiday_days": 3,
    "total_working_hours": 158.5,
    "total_overtime_hours": 4.0,
    "total_late_minutes": 25,
    "total_early_leave_minutes": 15
  }
}
```

---

### 3-4. 월별 리포트 /report

**목적:** 월별 정산 결과 확인 및 Excel 다운로드

**필터:** 연도, 월

**테이블 (Summary):** 사번 | 이름 | 정상 | 지각 | 조퇴 | 결근 | 연차 | 무급 | 누락 | 공휴일 | 총근무(h) | 초과(h) | 지각(분) | 조퇴(분)

**API 호출:**
```
GET /api/report/summary?year=2026&month=3
GET /api/report/download?year=2026&month=3   (파일 다운로드 → .xlsx)
```

파일명 형식: attendance_result_202603.xlsx

---

### 3-5. 보정 신청 목록 /corrections

**목적:** 출퇴근 누락 보정 신청 관리 (관리자 승인/반려)

**탭:** PENDING (미처리) / APPROVED (승인) / REJECTED (반려)

**테이블 컬럼:** ID | 직원명 | 날짜 | 유형 | 신청시각 | 사유 | 신청일 | 처리자 | 상태 | 액션

**유형 (punch_type):**
- IN   출근 누락
- OUT  퇴근 누락
- BOTH 출퇴근 모두 누락

**액션 (PENDING일 때만):**
- [승인] 버튼: PUT /api/corrections/:id/approve
- [반려] 버튼: PUT /api/corrections/:id/reject (사유 입력 모달)

**API 호출:**
```
GET /api/corrections?status=PENDING&page=1&limit=20
PUT /api/corrections/:id/approve   body: { "approver_id": 1 }
PUT /api/corrections/:id/reject    body: { "approver_id": 1, "reason": "..." }
```

---

### 3-6. 보정 신청 등록 /corrections/new

**목적:** 직원 출퇴근 누락 보정 신청

**폼 필드:**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| 직원 | Select (검색) | Y | emp_name 검색, emp_id 저장 |
| 날짜 | Date picker | Y | 보정할 근무일, 미래 날짜 불가 |
| 유형 | Radio | Y | IN / OUT / BOTH |
| 신청시각 | DateTime picker | Y | 실제 출/퇴근 시각 |
| 사유 | Textarea | N | 최대 500자 |

**API 호출:**
```
POST /api/corrections
body: {
  "emp_id": 3,
  "work_date": "2026-03-05",
  "punch_type": "IN",
  "requested_time": "2026-03-05T08:35:00",
  "reason": "카드리더기 오류"
}
```

응답: { "correction_id": 42, "status": "PENDING" }

---

### 3-7. 공휴일 관리 /holidays

**목적:** 베트남/한국 공휴일 조회 및 등록/삭제

**필터:** 연도, 지역 (VN / KR / BOTH)

**테이블:** 날짜 | 공휴일명 (한국어) | 공휴일명 (베트남어) | 지역 | 유급여부 | 액션

**추가 폼 필드:**

| 필드 | 타입 | 설명 |
|------|------|------|
| 날짜 | Date picker | 중복 불가 |
| 공휴일명 (KR) | Text | |
| 공휴일명 (VI) | Text | 선택 |
| 지역 | Select | VN / KR / BOTH |
| 유급 | Toggle | 기본 ON |

**API 호출:**
```
GET    /api/holidays?year=2026&region=VN
POST   /api/holidays
DELETE /api/holidays/:id
```

---

### 3-8. 장치 관리 /devices

**목적:** Hikvision 장치 목록 조회 및 상태 관리

**테이블:** 장치명 | IP | MAC | 위치 | 상태 | 등록일 | 액션

**상태:** ACTIVE (green) / INACTIVE (gray) / MAINTENANCE (yellow)

**API 호출:**
```
GET  /api/devices
POST /api/devices
PUT  /api/devices/:id
```

---

## 4. 데이터 모델 (핵심)

### 4-1. 출결 상태 (attendance_status)

| 값 | 의미 | 조건 |
|----|------|------|
| NORMAL | 정상 출근 | 지각/조퇴 없음 |
| LATE | 지각 | 출근시각 > start_time + grace_period_in분 |
| EARLY_LEAVE | 조퇴 | 퇴근시각 < end_time - grace_period_out분 |
| ABSENT | 결근 | 로그 없음 + 공휴일/연차 아님 |
| HOLIDAY | 공휴일 | atd_holiday 테이블 등록일 |
| PAID_LEAVE | 연차 (유급) | hr_leave_request APPROVED |
| UNPAID_LEAVE | 무급 휴가 | hr_leave_request APPROVED |
| MISSED_PUNCH | 누락 펀치 | 출근 또는 퇴근 기록 하나만 있음 |

### 4-2. 근무 시간 계산 기준

- 기준 Shift (STD): 08:30 ~ 17:30 (점심 12:00~13:00)
- 초과근무: 실근무시간 - min_work_hours (기본 8h)
- 점심 차감: 출퇴근 시간 내 점심 겹치는 구간 자동 차감
- 타임존: Asia/Ho_Chi_Minh (UTC+7)

### 4-3. 보정 신청 상태 흐름

```
PENDING → APPROVED  (관리자 승인 → atd_daily_summary 즉시 업데이트)
PENDING → REJECTED  (관리자 반려)
```

승인 즉시 해당 날의 actual_check_in / actual_check_out이 DB에서 업데이트됨.
FE는 승인 후 해당 날짜의 출결 데이터를 refetch하거나 낙관적 업데이트 처리 권장.

---

## 5. API 공통 사항

### Base URL
```
https://attendance-api.unicustoms.vn/api   (개발: http://localhost:8000/api)
```

### 인증
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 페이지네이션
```
GET /api/corrections?page=1&limit=20
응답: { "data": [...], "total": 150, "page": 1, "limit": 20 }
```

### 에러 응답
```json
{
  "error": "CORRECTION_NOT_FOUND",
  "message": "해당 보정 신청을 찾을 수 없습니다.",
  "status": 404
}
```

### 날짜/시간 형식
- 날짜: YYYY-MM-DD
- 시각: ISO 8601 (2026-03-06T08:35:00+07:00) — 타임존 Asia/Ho_Chi_Minh (UTC+7)

---

## 6. 기술 스택 권고

| 항목 | 권고 | 비고 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | React 19 |
| UI 컴포넌트 | shadcn/ui + Tailwind CSS | |
| 차트 | Recharts 또는 Chart.js | 대시보드 트렌드 |
| 캘린더 | react-big-calendar 또는 커스텀 | 직원별 월간 뷰 |
| 날짜 처리 | date-fns | dayjs도 가능 |
| API 통신 | TanStack Query v5 | 캐싱/로딩 처리 |
| 상태 관리 | Zustand (전역 최소화) | |
| 폼 | React Hook Form + Zod | 유효성 검사 |
| 테이블 | TanStack Table v8 | 정렬/필터 |

---

## 7. 주요 UX 고려사항

1. 타임존: 모든 시각은 UTC+7 (Asia/Ho_Chi_Minh) 기준으로 표시
2. 날짜 선택: 미래 날짜 선택 불가 (출결 조회/보정 신청 시)
3. Excel 다운로드: 파일명 형식 attendance_result_202603.xlsx
4. 보정 승인: 승인 즉시 해당 직원의 일별 요약 자동 갱신됨 (낙관적 UI 업데이트 권장)
5. 반응형: 관리자는 주로 PC 사용 (1280px 이상 최적화, 모바일 기본 지원)
6. 다국어: 상태 배지는 한국어/베트남어 표시 준비 (i18n 고려)

---

## 8. 개발 우선순위

| 순서 | 화면 | 이유 |
|------|------|------|
| 1 | 일별 출결 현황 (/attendance) | 핵심 기능, 매일 사용 |
| 2 | 대시보드 (/) | 접근성 |
| 3 | 보정 신청 목록/등록 (/corrections) | 업무 프로세스 |
| 4 | 월별 리포트 (/report) | 급여 연동 |
| 5 | 직원별 캘린더 (/attendance/:empId) | 보조 기능 |
| 6 | 공휴일/장치 관리 | 관리자 설정 |

---

## 9. 참고 파일

| 파일 | 내용 |
|------|------|
| db/01_create_tables.sql | 전체 DB 스키마 (8 테이블) |
| calculator/attendance_calculator.py | 출결 상태 판정 로직 상세 |
| workflow/punch_correction.py | 보정 신청/승인/반려 로직 |
| reporter/monthly_report.py | Excel 리포트 컬럼 정의 |
| db/02_seed_data.sql | Shift 마스터 데이터 |
