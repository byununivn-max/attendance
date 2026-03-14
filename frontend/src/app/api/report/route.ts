import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const mockReport = [
  { emp_code: "EXI004", name: "Pham Thi Hien", dept: "", work_days: 22, normal_days: 15, late_days: 0, absent_days: 1, leave_days: 0, overtime_hours: 26.5 },
  { emp_code: "EXI007", name: "Tran Minh Trang", dept: "", work_days: 22, normal_days: 15, late_days: 1, absent_days: 0, leave_days: 0, overtime_hours: 20.3 },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || new Date().getFullYear().toString();
  const month = searchParams.get("month") || (new Date().getMonth() + 1).toString();
  try {
    const rows = await query(
      `SELECT
        e.emp_code,
        COALESCE(e.display_name, e.full_name, e.emp_name) AS name,
        COALESCE(e.department, '') AS dept,
        COUNT(*)::int AS work_days,
        COUNT(*) FILTER (WHERE ds.attendance_status = 'NORMAL')::int AS normal_days,
        COUNT(*) FILTER (WHERE ds.attendance_status = 'LATE')::int AS late_days,
        COUNT(*) FILTER (WHERE ds.attendance_status = 'ABSENT')::int AS absent_days,
        COUNT(*) FILTER (WHERE ds.attendance_status IN ('PAID_LEAVE','UNPAID_LEAVE'))::int AS leave_days,
        ROUND(COALESCE(SUM(ds.overtime_minutes), 0) / 60.0, 1)::float AS overtime_hours
      FROM atd_daily_summary ds
      JOIN com_employee e ON e.emp_id = ds.emp_id
      WHERE EXTRACT(YEAR FROM ds.work_date) = $1
        AND EXTRACT(MONTH FROM ds.work_date) = $2
        AND COALESCE(e.employment_status, 'ACTIVE') = 'ACTIVE'
      GROUP BY e.emp_id, e.emp_code, e.display_name, e.emp_name, e.full_name, e.department
      ORDER BY e.emp_code`,
      [year, month]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(mockReport, { headers: { "X-Mock": "true" } });
  }
}
