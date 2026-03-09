import psycopg2
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DB_CONFIG

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def time_to_timedelta(t):
    return timedelta(hours=t.hour, minutes=t.minute, seconds=t.second)

def calculate_daily_attendance(target_date_str):
    """
    Calculate attendance for target_date.
    target_date_str format: YYYY-MM-DD
    """
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    # bitmask base calculation: 
    # Python isoweekday: 1 (Mon) to 7 (Sun)
    # Our bitmask: 1 (Sun), 2 (Mon), 4 (Tue), 8 (Wed), 16 (Thu), 32 (Fri), 64 (Sat)
    iso_wd = target_date.isoweekday()
    day_bit = 1 << (iso_wd % 7)

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # 1. Is this day a holiday?
        cur.execute("SELECT holiday_name FROM atd_holiday WHERE holiday_date = %s", (target_date,))
        holiday_record = cur.fetchone()
        is_holiday = holiday_record is not None

        # 2. Find employees scheduled for this day
        # Ensure active com_employee and within schedule dates and matching work_days_mask
        schedule_query = """
            SELECT s.emp_id, s.shift_id, sh.start_time, sh.end_time, sh.lunch_start, sh.lunch_end, 
                   sh.grace_period_in, sh.grace_period_out, sh.min_work_hours
            FROM atd_employee_schedule s
            JOIN atd_shift sh ON s.shift_id = sh.shift_id
            JOIN com_employee e ON s.emp_id = e.emp_id
            WHERE e.is_active = true
              AND s.start_date <= %s AND (s.end_date IS NULL OR s.end_date >= %s)
              AND (s.work_days_mask & %s) > 0
        """
        cur.execute(schedule_query, (target_date, target_date, day_bit))
        scheduled_employees = cur.fetchall()

        if not scheduled_employees:
            print(f"No employees scheduled for {target_date_str}.")
            return

        print(f"[{target_date_str}] Processing {len(scheduled_employees)} scheduled employees.")

        for emp in scheduled_employees:
            (emp_id, shift_id, start_time, end_time, lunch_start, lunch_end, 
             grace_in, grace_out, min_work_hours) = emp

            # Defaults
            acc_status = "ABSENT" if not is_holiday else "HOLIDAY"
            leave_id = None
            working_mins = 0
            overtime_mins = 0
            late_mins = 0
            early_mins = 0
            is_missed = False

            # Check for leaves
            cur.execute("""
                SELECT request_id, leave_type 
                FROM hr_leave_request 
                WHERE emp_id = %s AND start_date <= %s AND end_date >= %s AND status = 'APPROVED'
                LIMIT 1
            """, (emp_id, target_date, target_date))
            leave_record = cur.fetchone()

            if leave_record:
                leave_id, leave_type = leave_record
                acc_status = leave_type

            # Check raw logs
            cur.execute("""
                SELECT MIN(event_time), MAX(event_time)
                FROM atd_raw_log
                WHERE emp_id = %s AND event_time >= %s::date AND event_time < (%s::date + interval '1 day')
            """, (emp_id, target_date, target_date))
            log_record = cur.fetchone()
            actual_in, actual_out = log_record[0], log_record[1]

            # If there are punches, calculate times (even if holiday/leave, we log their punches)
            if actual_in and actual_out:
                if actual_in == actual_out:
                    is_missed = True
                    if not leave_record and not is_holiday:
                        acc_status = "MISSED_PUNCH"
                else:
                    # Convert to datetime for math
                    # expected times are target_date + start_time/end_time
                    exp_start = datetime.combine(target_date, start_time)
                    exp_end = datetime.combine(target_date, end_time)
                    
                    # Late calculation
                    actual_in_local = actual_in.replace(tzinfo=None)
                    actual_out_local = actual_out.replace(tzinfo=None)

                    # Only calculate LATE if they arrive after (start + grace)
                    grace_start = exp_start + timedelta(minutes=grace_in)
                    if actual_in_local > grace_start:
                        late_mins = int((actual_in_local - exp_start).total_seconds() / 60)
                    
                    # Early calculation
                    grace_end = exp_end - timedelta(minutes=grace_out)
                    if actual_out_local < grace_end:
                        early_mins = int((exp_end - actual_out_local).total_seconds() / 60)

                    # Total working minutes
                    work_delta = actual_out_local - actual_in_local

                    # Subtract lunch if they worked through it
                    if lunch_start and lunch_end:
                        l_start = datetime.combine(target_date, lunch_start)
                        l_end = datetime.combine(target_date, lunch_end)
                        # Find overlap between (actual_in, actual_out) and (l_start, l_end)
                        overlap_start = max(actual_in_local, l_start)
                        overlap_end = min(actual_out_local, l_end)
                        if overlap_start < overlap_end:
                            work_delta -= (overlap_end - overlap_start)

                    working_mins = int(work_delta.total_seconds() / 60)
                    if working_mins < 0:
                        working_mins = 0

                    # Overtime: minutes worked beyond min_work_hours
                    min_mins = int(float(min_work_hours) * 60)
                    overtime_mins = max(0, working_mins - min_mins)

                    # Determine status ONLY IF NOT HOLIDAY/LEAVE
                    # Priority: LATE > EARLY_LEAVE > NORMAL (both can occur; LATE takes precedence)
                    if not leave_record and not is_holiday:
                        if late_mins > 0:
                            acc_status = "LATE"
                        elif early_mins > 0:
                            acc_status = "EARLY_LEAVE"
                        else:
                            acc_status = "NORMAL"

            # 3. Upsert into atd_daily_summary
            upsert_query = """
                INSERT INTO atd_daily_summary (
                    emp_id, work_date, shift_id, actual_check_in, actual_check_out,
                    working_minutes, overtime_minutes, late_minutes, early_leave_minutes,
                    attendance_status, is_missed_punch, leave_request_id
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (emp_id, work_date) DO UPDATE SET
                    shift_id = EXCLUDED.shift_id,
                    actual_check_in = EXCLUDED.actual_check_in,
                    actual_check_out = EXCLUDED.actual_check_out,
                    working_minutes = EXCLUDED.working_minutes,
                    overtime_minutes = EXCLUDED.overtime_minutes,
                    late_minutes = EXCLUDED.late_minutes,
                    early_leave_minutes = EXCLUDED.early_leave_minutes,
                    attendance_status = EXCLUDED.attendance_status,
                    is_missed_punch = EXCLUDED.is_missed_punch,
                    leave_request_id = EXCLUDED.leave_request_id,
                    updated_at = now()
            """
            cur.execute(upsert_query, (
                emp_id, target_date, shift_id, actual_in, actual_out,
                working_mins, overtime_mins, late_mins, early_mins, acc_status, is_missed, leave_id
            ))

        conn.commit()
        print(f"[{target_date_str}] Attendance calculated and saved.")

    except Exception as e:
        print(f"Error during calculation: {e}", file=sys.stderr)
        if conn:
            conn.rollback()
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_dt = sys.argv[1]
    else:
        # Default to yesterday if running as a daily batch today
        target_dt = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    calculate_daily_attendance(target_dt)
