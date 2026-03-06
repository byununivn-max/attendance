import csv
import psycopg2
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG

load_dotenv()

CSV_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "Annual Leave.csv")


def parse_date(date_str):
    try:
        return datetime.strptime(date_str, "%m/%d/%Y").date()
    except ValueError:
        try:
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except ValueError:
            return None

def import_leaves():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"Failed to connect to DB: {e}")
        return

    # First, load employees into a dict {email: emp_id}
    cur.execute("SELECT LOWER(email), emp_id FROM com_employee;")
    employees = dict(cur.fetchall())
    print(f"Loaded {len(employees)} employees from database.")

    processed = 0
    skipped = 0

    with open(CSV_FILE_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        try:
            next(reader)  # schema
            next(reader)  # header
        except StopIteration:
            pass

        for row in reader:
            if len(row) < 11:
                continue

            # Row format: "ID","Responder's email","Name","Who is your leader?","Application","Reason","How long (days)","From date","To date",...
            email = row[1].strip().lower()
            if not email or email not in employees:
                skipped += 1
                continue
                
            emp_id = employees[email]
            
            application = row[4].strip()
            leave_type = "PAID_LEAVE" if "Paid Leave" in application else "UNPAID_LEAVE"
            
            days_str = row[6].replace(',', '.')
            try:
                # Sometimes it has text like "0.25 (sáng)"
                days_float_str = ''.join(c for c in days_str if c.isdigit() or c == '.')
                # if there are multiple dots, take the first part
                if days_float_str.count('.') > 1:
                     parts = days_float_str.split('.')
                     days_float_str = parts[0] + '.' + parts[1]
                total_days = float(days_float_str) if days_float_str else 0.0
            except ValueError:
                total_days = 0.0
                
            if total_days == 0.0:
                skipped += 1
                continue

            start_date = parse_date(row[7])
            end_date = parse_date(row[8])
            
            if not start_date or not end_date:
                skipped += 1
                continue

            status = row[10].strip().upper() if len(row) > 10 and row[10].strip() else "APPROVED"
            if status == "REJECT": status = "REJECTED"
            
            # Upsert logic - we use start/end date & emp_id uniqueness
            # But currently there's no unique constraint on hr_leave_request for this.
            # For simplicity & idempotency, we just TRUNCATE the mock table before import
            # Or avoid duplicates using NOT EXISTS
            
            query = """
            INSERT INTO hr_leave_request (emp_id, leave_type, start_date, end_date, total_days, status)
            SELECT %s, %s, %s, %s, %s, %s
            WHERE NOT EXISTS (
                SELECT 1 FROM hr_leave_request 
                WHERE emp_id = %s AND start_date = %s AND end_date = %s
            )
            """
            cur.execute(query, (emp_id, leave_type, start_date, end_date, total_days, status, emp_id, start_date, end_date))
            processed += 1

    conn.commit()
    cur.close()
    conn.close()
    
    print(f"Import complete! Processed: {processed}, Skipped: {skipped}")

if __name__ == "__main__":
    import_leaves()
