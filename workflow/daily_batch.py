import os
import sys
import argparse
from datetime import datetime, timedelta

# Append project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from importer.leave_importer import import_leaves
from calculator.attendance_calculator import calculate_daily_attendance

def run_daily_batch(target_date_str=None):
    """
    Run the daily batch jobs:
    1. Import leaves/holidays
    2. Calculate attendance for the specific date
    """
    if not target_date_str:
        # Default to yesterday if not specified
        target_date_str = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    print(f"=== Starting Daily Batch for {target_date_str} ===")
    
    # Optional: Run the collector script here if it was a standalone task
    # print("1. Running Data Collector...")
    # os.system("python collector/collector.py")

    print("2. Running Leave Data Importer...")
    try:
        import_leaves()
    except Exception as e:
        print(f"Error during leave import: {e}", file=sys.stderr)
    
    print(f"3. Running Attendance Calculator for {target_date_str}...")
    try:
        calculate_daily_attendance(target_date_str)
    except Exception as e:
        print(f"Error during attendance calculation: {e}", file=sys.stderr)
        
    print("=== Daily Batch Completed ===")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the daily attendance batch process.")
    parser.add_argument("--date", type=str, help="Target date in YYYY-MM-DD format. Default is yesterday.")
    
    args = parser.parse_args()
    run_daily_batch(args.date)
