
"""
db/05_load_xlsx_data.py - data/ 폴더 xlsx/csv -> PostgreSQL 로딩
Usage: py db/05_load_xlsx_data.py [--dry-run]
"""
import sys, csv, argparse, openpyxl
from datetime import datetime
sys.path.insert(0, ".")
from collector.db_conn import get_conn

DATA_DIR = "data"
DEVICE_ID = 1

def build_email_map():
    """Annual Leave CSV에서 이름->이메일 매핑 구축"""
    mapping = {}
    with open(DATA_DIR+"/Annual Leave.csv", encoding="utf-8-sig") as f:
        all_rows = list(csv.reader(f))
    hi = next(i for i, r in enumerate(all_rows) if r and r[0]=="ID")
    for row in all_rows[hi+1:]:
        if len(row) < 3 or not row[1] or not row[2]: continue
        name = row[2].strip()
        email = row[1].strip().lower()
        # normalize: remove accents roughly by last word
        words = name.split()
        if words:
            last = words[-1].lower()
            mapping[last] = email
            mapping[name.lower()] = email
    return mapping

def load_employees(cur, dry):
    wb = openpyxl.load_workbook(DATA_DIR+"/attendance_result.xlsx", read_only=True)
    ws = wb["User"]
    rows = list(ws.iter_rows(values_only=True))[1:]
    email_map = build_email_map()
    n = 0
    for full_name, user_code in rows:
        if not user_code: continue
        emp_code = "EXI"+str(int(user_code)).zfill(3)
        name = (full_name or "").strip()
        emp_name = name.split()[-1] if name else emp_code
        # try to find real email from leave data, fallback to emp_code email
        email = email_map.get(name.lower()) or email_map.get(emp_name.lower()) or (emp_code.lower()+"@eximuni.com")
        if dry: print("  [DRY] emp:", emp_code, name, "->", email)
        else:
            # step1: update if email already exists in mock data
            cur.execute(
                "UPDATE com_employee SET emp_code=%s, emp_name=%s, full_name=%s WHERE LOWER(email)=%s",
                (emp_code, emp_name, name, email.lower()))
            # step2: insert if not exists
            cur.execute(
                "INSERT INTO com_employee (emp_code, emp_name, full_name, email, is_active) "
                "VALUES (%s,%s,%s,%s,true) ON CONFLICT (emp_code) DO NOTHING",
                (emp_code, emp_name, name, email))
        n += 1
    return n

def load_device_map(cur, dry):
    wb = openpyxl.load_workbook(DATA_DIR+"/attendance_result.xlsx", read_only=True)
    ws = wb["User"]
    rows = list(ws.iter_rows(values_only=True))[1:]
    n = 0
    for _, user_code in rows:
        if not user_code: continue
        emp_code = "EXI"+str(int(user_code)).zfill(3)
        pid = str(int(user_code))
        if dry: print("  [DRY] map pid="+pid+" -> "+emp_code)
        else:
            cur.execute(
                "INSERT INTO atd_device_employee_map (device_id, hikvision_pid, emp_id) "
                "SELECT %s, %s, e.emp_id FROM com_employee e WHERE e.emp_code = %s "
                "ON CONFLICT (device_id, hikvision_pid) DO NOTHING",
                (DEVICE_ID, pid, emp_code))
        n += 1
    return n

def load_raw_logs(cur, dry):
    wb = openpyxl.load_workbook(DATA_DIR+"/attendance_result.xlsx", read_only=True)
    ws = wb["Attendance-record (raw)"]
    n = 0
    for row in ws.iter_rows(min_row=2, values_only=True):
        user_code, event_dt = row[0], row[1]
        if not user_code or not event_dt: continue
        emp_code = "EXI"+str(int(user_code)).zfill(3)
        if dry:
            if n < 3: print("  [DRY] log:", emp_code, event_dt)
            n += 1; continue
        cur.execute(
            "INSERT INTO atd_raw_log (emp_id, device_id, event_time, event_type, access_method, source_api) "
            "SELECT e.emp_id, %s, %s, %s, %s, %s FROM com_employee e WHERE e.emp_code = %s "
            "ON CONFLICT DO NOTHING",
            (DEVICE_ID, event_dt, "FACE_MATCH", "FACE", "xlsx_import", emp_code))
        n += 1
    return n

def load_leave(cur, dry):
    with open(DATA_DIR+"/Annual Leave.csv", encoding="utf-8-sig") as f:
        all_rows = list(csv.reader(f))
    hi = next(i for i, r in enumerate(all_rows) if r and r[0]=="ID")
    n = skip = 0
    for row in all_rows[hi+1:]:
        if len(row) < 9 or not row[1]: continue
        email = row[1].strip().lower()
        app_type, days_str = row[4].strip(), row[6].strip()
        from_str, to_str = row[7].strip(), row[8].strip()
        try:
            total = float(days_str) if days_str else 0
            fd = datetime.strptime(from_str, "%m/%d/%Y").date() if from_str else None
            td = datetime.strptime(to_str, "%m/%d/%Y").date() if to_str else None
        except Exception: skip += 1; continue
        if not fd: skip += 1; continue
        ltype = "PAID_LEAVE" if "Annual" in app_type or "Paid" in app_type else "UNPAID_LEAVE"
        if dry:
            if n < 3: print("  [DRY] leave:", email, fd, ltype)
            n += 1; continue
        cur.execute(
            "INSERT INTO hr_leave_request (emp_id, leave_type, start_date, end_date, total_days, status) "
            "SELECT e.emp_id, %s, %s, %s, %s, %s FROM com_employee e WHERE LOWER(e.email)=%s "
            "ON CONFLICT DO NOTHING",
            (ltype, fd, td, total, "APPROVED", email))
        n += 1
    return n, skip

def ensure_schedule(cur, dry):
    if not dry:
        cur.execute(
            "INSERT INTO atd_employee_schedule (emp_id, shift_id, start_date, work_days_mask) "
            "SELECT e.emp_id, 1, '2023-01-01', 62 FROM com_employee e WHERE e.emp_code LIKE 'EXI%' "
            "ON CONFLICT DO NOTHING")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    dry = ap.parse_args().dry_run
    print("=== Data Load", "(DRY RUN)" if dry else "", "===")
    conn = get_conn()
    cur = conn.cursor()
    try:
        print("[1] employees..."); print("   ->", load_employees(cur, dry))
        print("[2] device map..."); print("   ->", load_device_map(cur, dry))
        print("[3] raw logs..."); print("   ->", load_raw_logs(cur, dry))
        print("[4] leave...")
        n, sk = load_leave(cur, dry); print(f"   -> {n} records ({sk} skipped)")
        print("[5] schedules..."); ensure_schedule(cur, dry); print("   -> done")
        if not dry: conn.commit(); print("COMMIT OK")
        else: print("DRY RUN - no changes")
    except Exception as e:
        conn.rollback(); print("ERROR:", e); raise
    finally: cur.close(); conn.close()

if __name__ == "__main__": main()
