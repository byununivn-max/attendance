# 직원근태 관리 시스템 ERD (Entity Relationship Diagram)

> 전사 통합 DB 설계 기반 | PostgreSQL 16+ | 버전 1.0.0 | 2026-03-06

---

## 1. 전체 시스템 구조도 (High-Level)

```mermaid
graph TB
    subgraph COMMON["Common 모듈 (com_)"]
        COM_EMP[com_employee<br/>직원 마스터]
        COM_ORG[com_organization<br/>조직 마스터]
    end

    subgraph ATD["Attendance 모듈 (atd_) - 근태 정산"]
        ATD_DEV[atd_device<br/>장치 관리]
        ATD_RAW[atd_raw_log<br/>원천 로그]
        ATD_SHIFT[atd_shift<br/>교대 정의]
        ATD_SCHED[atd_employee_schedule<br/>직원별 스케줄]
        ATD_DAILY[atd_daily_summary<br/>일별 정산 결과]
        ATD_HOL[atd_holiday<br/>공휴일 관리]
    end

    subgraph HR["HR 모듈 (hr_) - 인사 연동"]
        HR_ATT[hr_attendance<br/>일별 근태 기록]
        HR_LEAVE[hr_leave_request<br/>휴가 신청]
        HR_PAYROLL[hr_payroll<br/>월별 급여]
    end

    COM_EMP --> ATD_RAW
    COM_EMP --> ATD_SCHED
    COM_EMP --> ATD_DAILY

    ATD_DEV --> ATD_RAW
    ATD_SHIFT --> ATD_SCHED
    ATD_SHIFT --> ATD_DAILY

    ATD_DAILY -.->|정산 결과 연동| HR_ATT
    HR_ATT -.->|근무일수 집계| HR_PAYROLL
    HR_LEAVE -.->|휴가 상태 반영| ATD_DAILY

    style COMMON fill:#2c3e50,color:#fff
    style ATD fill:#e67e22,color:#fff
    style HR fill:#27ae60,color:#fff
```

---

## 2. 상세 ERD (테이블 관계도)

```mermaid
erDiagram
    %% =========================================
    %% Common 모듈 (참조)
    %% =========================================
    com_employee {
        BIGSERIAL emp_id PK
        BIGINT org_id FK
        VARCHAR emp_code UK
        VARCHAR emp_name
        VARCHAR email UK
        VARCHAR position
        DATE hire_date
        VARCHAR employment_status
        BOOLEAN is_active
    }

    com_organization {
        BIGSERIAL org_id PK
        VARCHAR org_code UK
        VARCHAR org_name
        VARCHAR org_type
    }

    %% =========================================
    %% 섹션 1. 장치 및 원천 로그
    %% =========================================
    atd_device {
        SERIAL device_id PK
        VARCHAR device_name
        VARCHAR device_ip
        VARCHAR mac_address
        VARCHAR location
        VARCHAR status "ACTIVE / INACTIVE / MAINTENANCE"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    atd_raw_log {
        BIGSERIAL log_id PK
        BIGINT emp_id FK
        INT device_id FK
        TIMESTAMPTZ event_time
        VARCHAR event_type "CHECK_IN / CHECK_OUT / FACE_MATCH"
        VARCHAR access_method "FACE / CARD / FINGERPRINT / PASSWORD"
        JSONB raw_data
        VARCHAR source_api
        TIMESTAMPTZ created_at
    }

    %% =========================================
    %% 섹션 2. 근무 스케줄 설정
    %% =========================================
    atd_shift {
        SERIAL shift_id PK
        VARCHAR shift_code UK
        VARCHAR shift_name
        TIME start_time
        TIME end_time
        TIME lunch_start
        TIME lunch_end
        INT grace_period_in "지각 허용(분)"
        INT grace_period_out "조퇴 허용(분)"
        DECIMAL min_work_hours "기본 8.0"
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    atd_employee_schedule {
        BIGSERIAL schedule_id PK
        BIGINT emp_id FK
        INT shift_id FK
        DATE start_date
        DATE end_date
        SMALLINT work_days_mask "비트마스크 월~금=62"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% =========================================
    %% 섹션 3. 근태 정산 결과
    %% =========================================
    atd_daily_summary {
        BIGSERIAL summary_id PK
        BIGINT emp_id FK
        DATE work_date
        INT shift_id FK
        TIMESTAMPTZ actual_check_in
        TIMESTAMPTZ actual_check_out
        INT working_minutes
        INT overtime_minutes
        INT late_minutes
        INT early_leave_minutes
        VARCHAR attendance_status "NORMAL / LATE / EARLY_LEAVE / ABSENT / HOLIDAY / LEAVE"
        BOOLEAN is_modified
        BIGINT modified_by FK
        TEXT note
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    atd_holiday {
        SERIAL holiday_id PK
        DATE holiday_date UK
        VARCHAR holiday_name
        VARCHAR holiday_name_vi
        BOOLEAN is_paid
        VARCHAR region "VN / KR"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% =========================================
    %% HR 모듈 (연동 테이블)
    %% =========================================
    hr_attendance {
        BIGSERIAL attendance_id PK
        BIGINT emp_id FK
        DATE work_date
        TIMESTAMPTZ check_in
        TIMESTAMPTZ check_out
        DECIMAL working_hours
        DECIMAL overtime_hours
        VARCHAR attendance_status
        TEXT note
    }

    hr_leave_request {
        BIGSERIAL request_id PK
        BIGINT emp_id FK
        INT leave_type_id FK
        DATE start_date
        DATE end_date
        DECIMAL total_days
        VARCHAR status "PENDING / APPROVED / REJECTED / CANCELLED"
        BIGINT approved_by FK
    }

    %% =========================================
    %% 관계 정의 (Relationships)
    %% =========================================

    com_employee ||--o{ atd_raw_log : "출퇴근 로그 생성"
    atd_device ||--o{ atd_raw_log : "장치에서 로그 수집"

    com_employee ||--o{ atd_employee_schedule : "근무 스케줄 할당"
    atd_shift ||--o{ atd_employee_schedule : "교대 유형 적용"

    com_employee ||--o{ atd_daily_summary : "일별 정산 결과"
    atd_shift ||--o| atd_daily_summary : "적용된 교대"
    com_employee ||--o| atd_daily_summary : "수정한 관리자"

    com_employee ||--o{ hr_attendance : "HR 근태 기록"
    com_employee ||--o{ hr_leave_request : "휴가 신청"

    com_organization ||--o{ com_employee : "소속 조직"
```

---

## 3. 테이블 상세 명세

### 3.1 장치 및 원천 로그 (Device & Raw Logs)

| 테이블 | 설명 | 예상 규모 |
|--------|------|-----------|
| **atd_device** | Hikvision 얼굴인식 등 출퇴근 장치 관리 | ~10건 (장치 수) |
| **atd_raw_log** | 장치 API에서 수집된 모든 체크인/체크아웃 원천 데이터 | 일 100~500건 |

### 3.2 근무 스케줄 설정 (Shift & Schedule)

| 테이블 | 설명 | 예상 규모 |
|--------|------|-----------|
| **atd_shift** | 표준근무, 반차, 야간 등 교대 유형 정의 | ~5-10건 |
| **atd_employee_schedule** | 직원별 기간별 적용 교대 매핑 | 직원수 x 변경 횟수 |

### 3.3 근태 정산 결과 (Calculated Summary)

| 테이블 | 설명 | 예상 규모 |
|--------|------|-----------|
| **atd_daily_summary** | 로우 로그를 분석하여 산출된 일별 근태 결과 | 일 50~100건 |
| **atd_holiday** | 공휴일/회사 휴무일 (정산 시 제외 기준) | 연 15~20건 |

---

## 4. 데이터 흐름도 (Data Flow)

```mermaid
flowchart LR
    A["Hikvision 장치<br/>(Face Recognition)"] -->|ISAPI 이벤트| B["atd_raw_log<br/>(원천 로그 저장)"]
    B -->|배치 정산<br/>(일 1회 또는 실시간)| C["atd_daily_summary<br/>(일별 근태 결과)"]

    D["atd_shift<br/>(교대 정의)"] --> C
    E["atd_employee_schedule<br/>(직원별 스케줄)"] --> C
    F["atd_holiday<br/>(공휴일)"] --> C
    G["hr_leave_request<br/>(승인된 휴가)"] -.-> C

    C -->|연동/대체| H["hr_attendance<br/>(HR 근태 기록)"]
    H -->|월 집계| I["hr_payroll<br/>(급여 계산)"]

    style A fill:#34495e,color:#fff
    style B fill:#34495e,color:#fff
    style C fill:#e67e22,color:#fff
    style D fill:#1abc9c,color:#fff
    style E fill:#1abc9c,color:#fff
    style F fill:#e67e22,color:#fff
    style G fill:#27ae60,color:#fff
    style H fill:#27ae60,color:#fff
    style I fill:#e74c3c,color:#fff
```

---

## 5. 핵심 인덱스 및 제약 조건

### Unique 제약
| 테이블 | 컬럼 | 목적 |
|--------|------|------|
| atd_daily_summary | (emp_id, work_date) | 직원별 날짜당 1건만 허용 |
| atd_holiday | holiday_date | 날짜 중복 방지 |
| atd_shift | shift_code | 교대 코드 유일성 |

### 주요 인덱스
| 테이블 | 인덱스 | 용도 |
|--------|--------|------|
| atd_raw_log | idx_atd_raw_emp | 직원별 로그 조회 |
| atd_raw_log | idx_atd_raw_time | 시간순 조회 |
| atd_raw_log | idx_atd_raw_emp_time | 직원+시간 복합 조회 (정산용) |
| atd_employee_schedule | idx_atd_sched_emp_date | 직원의 특정 날짜 스케줄 조회 |
| atd_daily_summary | idx_atd_summary_date | 날짜별 전체 근태 조회 |
| atd_daily_summary | idx_atd_summary_status | 상태별 필터링 (지각자 목록 등) |

---

## 6. 외래키 관계 요약

```
atd_raw_log.emp_id           --> com_employee.emp_id        (직원)
atd_raw_log.device_id        --> atd_device.device_id       (장치)

atd_employee_schedule.emp_id --> com_employee.emp_id        (직원)
atd_employee_schedule.shift_id --> atd_shift.shift_id       (교대)

atd_daily_summary.emp_id     --> com_employee.emp_id        (직원)
atd_daily_summary.shift_id   --> atd_shift.shift_id         (교대)
atd_daily_summary.modified_by --> com_employee.emp_id       (수정 관리자)
```

---

## 7. HR 모듈과의 연동 관계

| ATD 모듈 | 방향 | HR 모듈 | 연동 방식 |
|----------|------|---------|-----------|
| atd_daily_summary | --> | hr_attendance | 정산 결과를 HR 근태로 동기화 (또는 대체) |
| atd_daily_summary | <-- | hr_leave_request | 승인된 휴가를 LEAVE 상태로 반영 |
| atd_daily_summary | --> | hr_payroll | 월 근무일수/초과근무 집계하여 급여 산정 |
| atd_holiday | --> | hr_payroll | 유급 휴무일 급여 산정에 반영 |

---

## 8. attendance_status 코드 정의

| 코드 | 의미 | 판정 기준 |
|------|------|-----------|
| NORMAL | 정상 출근 | check_in <= shift.start_time + grace_period_in |
| LATE | 지각 | check_in > shift.start_time + grace_period_in |
| EARLY_LEAVE | 조퇴 | check_out < shift.end_time - grace_period_out |
| ABSENT | 결근 | 로그 없음 & 휴가/공휴일 아님 |
| HOLIDAY | 공휴일 | atd_holiday에 해당 날짜 존재 |
| LEAVE | 휴가 | hr_leave_request 승인 건 존재 |

---

## 9. work_days_mask 비트마스크 설명

```
비트 위치:  일  월  화  수  목  금  토
비트 값:     1   2   4   8  16  32  64

예시:
  월~금 근무 = 2+4+8+16+32 = 62
  월~토 근무 = 2+4+8+16+32+64 = 126
  화~토 근무 = 4+8+16+32+64 = 124
```

---

*본 ERD는 전사 통합 DB 설계(00_common.dbml, 03_hr.dbml, 04_attendance.dbml)를 기반으로 작성되었습니다.*
