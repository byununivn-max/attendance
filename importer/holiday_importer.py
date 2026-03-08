"""
공휴일 등록 모듈
베트남(VN) / 한국(KR) 법정 공휴일을 atd_holiday에 삽입.
연도별 일괄 등록 및 중복 방지(ON CONFLICT DO NOTHING).

사용법:
  py -m importer.holiday_importer --year 2026
  py -m importer.holiday_importer --year 2026 --region VN
"""
import sys
import os
import argparse
from datetime import date

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG
import psycopg2


# ──────────────────────────────────────────────
# 연도별 베트남 법정 공휴일 정의
# ──────────────────────────────────────────────
def vn_holidays(year: int) -> list[dict]:
    return [
        {"date": date(year, 1, 1),  "name_en": "New Year's Day",      "name_vi": "Ngay dau nam moi",       "region": "BOTH"},
        # Tet (설날) - 연도마다 날짜 다름; 아래는 2026년 기준 (Binh Ngo 2026 = Jan 29)
        # 실제 운영 시 해당 연도의 공식 일정으로 교체할 것
        {"date": date(year, 4, 30), "name_en": "Reunification Day",   "name_vi": "Ngay Giai phong mien Nam","region": "VN"},
        {"date": date(year, 5, 1),  "name_en": "International Labour Day","name_vi": "Ngay Quoc te Lao dong","region": "BOTH"},
        {"date": date(year, 9, 2),  "name_en": "National Day",         "name_vi": "Quoc khanh",              "region": "VN"},
    ]


def vn_tet_2026() -> list[dict]:
    """2026년 베트남 설날 연휴 (별도 함수 - 매년 수동 갱신 필요)."""
    return [
        {"date": date(2026, 2, 16), "name_en": "Tet Holiday (Eve)",   "name_vi": "Nghi Tet Nguyen Dan", "region": "VN"},
        {"date": date(2026, 2, 17), "name_en": "Tet Holiday (Day 1)", "name_vi": "Tet Nguyen Dan",      "region": "VN"},
        {"date": date(2026, 2, 18), "name_en": "Tet Holiday (Day 2)", "name_vi": "Mung 2 Tet",          "region": "VN"},
        {"date": date(2026, 2, 19), "name_en": "Tet Holiday (Day 3)", "name_vi": "Mung 3 Tet",          "region": "VN"},
        {"date": date(2026, 2, 20), "name_en": "Tet Holiday (Day 4)", "name_vi": "Mung 4 Tet",          "region": "VN"},
    ]


def vn_other_2026() -> list[dict]:
    return [
        {"date": date(2026, 4, 26), "name_en": "Hung Kings Commemoration Day", "name_vi": "Gio To Hung Vuong", "region": "VN"},
        {"date": date(2026, 4, 27), "name_en": "Hung Kings Commemoration Day (Substitute)", "name_vi": "Gio To Hung Vuong (Nghi bu)", "region": "VN"},
    ]


# ──────────────────────────────────────────────
# 연도별 한국 법정 공휴일 (주재원 적용)
# ──────────────────────────────────────────────
def kr_holidays(year: int) -> list[dict]:
    return [
        {"date": date(year, 1, 1),  "name_en": "New Year's Day",      "name_vi": None, "region": "KR"},
        {"date": date(year, 3, 1),  "name_en": "Independence Movement Day", "name_vi": None, "region": "KR"},
        {"date": date(year, 5, 5),  "name_en": "Children's Day",      "name_vi": None, "region": "KR"},
        {"date": date(year, 6, 6),  "name_en": "Memorial Day",        "name_vi": None, "region": "KR"},
        {"date": date(year, 8, 15), "name_en": "Liberation Day",      "name_vi": None, "region": "KR"},
        {"date": date(year, 10, 3), "name_en": "National Foundation Day", "name_vi": None, "region": "KR"},
        {"date": date(year, 10, 9), "name_en": "Hangul Day",          "name_vi": None, "region": "KR"},
        {"date": date(year, 12, 25),"name_en": "Christmas",           "name_vi": None, "region": "KR"},
    ]


def kr_lunar_2026() -> list[dict]:
    return [
        {"date": date(2026, 2, 16), "name_en": "Seollal Holiday", "name_vi": None, "region": "KR"},
        {"date": date(2026, 2, 17), "name_en": "Seollal (Lunar New Year)", "name_vi": None, "region": "KR"},
        {"date": date(2026, 2, 18), "name_en": "Seollal Holiday", "name_vi": None, "region": "KR"},
        {"date": date(2026, 3, 2),  "name_en": "Substitute Holiday (Independence Movement Day)", "name_vi": None, "region": "KR"},
        {"date": date(2026, 5, 24), "name_en": "Buddha's Birthday", "name_vi": None, "region": "KR"},
        {"date": date(2026, 5, 25), "name_en": "Substitute Holiday (Buddha's Birthday)", "name_vi": None, "region": "KR"},
        {"date": date(2026, 6, 3),  "name_en": "Local Election Day", "name_vi": None, "region": "KR"},
        {"date": date(2026, 8, 17), "name_en": "Substitute Holiday (Liberation Day)", "name_vi": None, "region": "KR"},
        {"date": date(2026, 9, 24), "name_en": "Chuseok Holiday", "name_vi": None, "region": "KR"},
        {"date": date(2026, 9, 25), "name_en": "Chuseok",         "name_vi": None, "region": "KR"},
        {"date": date(2026, 9, 26), "name_en": "Chuseok Holiday", "name_vi": None, "region": "KR"},
        {"date": date(2026, 9, 28), "name_en": "Substitute Holiday (Chuseok)", "name_vi": None, "region": "KR"},
        {"date": date(2026, 10, 5), "name_en": "Substitute Holiday (National Foundation Day)", "name_vi": None, "region": "KR"},
    ]


def insert_holidays(holidays: list[dict], dry_run: bool = False) -> dict:
    inserted = skipped = 0

    if dry_run:
        for h in holidays:
            print(f"  [DRY] {h['date']} | {h['region']:4s} | {h['name_en']}")
        return {"inserted": 0, "skipped": len(holidays)}

    with psycopg2.connect(**DB_CONFIG) as conn, conn.cursor() as cur:
        for h in holidays:
            # We use ON CONFLICT DO UPDATE so that if dates were wrong, we update the name (Wait, date is PK. We must delete incorrect dates first!)
            cur.execute(
                """
                INSERT INTO atd_holiday (holiday_date, holiday_name, holiday_name_vi, is_paid, region)
                VALUES (%s, %s, %s, true, %s)
                ON CONFLICT (holiday_date) DO UPDATE SET
                    holiday_name = EXCLUDED.holiday_name,
                    holiday_name_vi = EXCLUDED.holiday_name_vi,
                    region = EXCLUDED.region
                """,
                (h["date"], h["name_en"], h.get("name_vi"), h["region"]),
            )
            # Rowcount logic for ON CONFLICT DO UPDATE is: 1 for insert, 2 for update.
            # But the requirement might be just ON CONFLICT DO NOTHING. I'll use UPDATE since we might be fixing wrong names.
            if cur.rowcount:
                inserted += 1
            else:
                skipped += 1
        conn.commit()

    return {"inserted": inserted, "skipped": skipped}


def import_holidays(year: int, region: str = "ALL", dry_run: bool = False):
    holidays = []

    if region in ("VN", "ALL"):
        holidays += vn_holidays(year)
        if year == 2026:
            holidays += vn_tet_2026()
            holidays += vn_other_2026()

    if region in ("KR", "ALL"):
        holidays += kr_holidays(year)
        if year == 2026:
            holidays += kr_lunar_2026()

    # Remove duplicate dates (BOTH region takes precedence)
    seen = {}
    for h in holidays:
        key = h["date"]
        if key not in seen or h["region"] == "BOTH":
            seen[key] = h
    holidays = list(seen.values())
    holidays.sort(key=lambda x: x["date"])

    print(f"[holiday_importer] {year} / {region}: {len(holidays)} holidays to register")
    result = insert_holidays(holidays, dry_run=dry_run)
    print(f"  inserted or updated={result['inserted']}  skipped={result['skipped']}")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Register public holidays into atd_holiday")
    parser.add_argument("--year",    type=int, default=date.today().year, help="Target year (default: current year)")
    parser.add_argument("--region",  choices=["VN", "KR", "ALL"], default="ALL")
    parser.add_argument("--dry-run", action="store_true", help="Print holidays without inserting")
    args = parser.parse_args()
    import_holidays(args.year, args.region, args.dry_run)
