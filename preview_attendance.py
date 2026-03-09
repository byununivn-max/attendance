import pandas as pd
import sys

file_path = r'c:\Users\unicu\Downloads\작업장\@@@ 현재 작업\attendance\attendance_result.xlsx'
try:
    df = pd.read_excel(file_path)
    print("Columns:", df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head())
except Exception as e:
    print(f"Error reading excel: {e}")
