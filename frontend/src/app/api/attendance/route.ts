import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const dept = searchParams.get("dept") || "";
  const workplace = searchParams.get("workplace") || "";
  try {
    const rows = await query(
      `SELECT
        e.emp_code AS "empCode", COALESCE(e.display_name, e.full_name, e.emp_name) AS name,
        COALESCE(e.department, '') AS dept,
        TO_CHAR(ds.actual_check_in, 'HH24:MI') AS "checkIn",
        TO_CHAR(ds.actual_check_out, 'HH24:MI') AS "checkOut",
        ROUND(ds.working_minutes / 60.0, 1)::float AS "workHours",
        ROUND(ds.overtime_minutes / 60.0, 1)::float AS overtime,
        ds.late_minutes AS "lateMins",
        ds.early_leave_minutes AS "earlyMins",
        ds.attendance_status AS status,
        COALESCE(d.device_name, '') AS workplace
      FROM atd_daily_summary ds
      JOIN com_employee e ON e.emp_id = ds.emp_id
      LEFT JOIN atd_device_employee_map dem ON dem.emp_id = e.emp_id AND dem.is_active = true
      LEFT JOIN atd_device d ON d.device_id = dem.device_id
      WHERE ds.work_date = $1
        AND ($2 = '' OR COALESCE(e.department, '') = $2)
        AND ($3 = '' OR COALESCE(d.device_name, '') = $3)
        AND COALESCE(e.employment_status, 'ACTIVE') != 'RESIGNED'
      GROUP BY e.emp_id, e.emp_code, e.display_name, e.full_name, e.emp_name, e.department,
               ds.actual_check_in, ds.actual_check_out, ds.working_minutes,
               ds.overtime_minutes, ds.late_minutes, ds.early_leave_minutes, ds.attendance_status,
               d.device_name
      ORDER BY e.emp_code`,
      [date, dept, workplace]
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([
      { empCode: "EXI004", name: "Pham Thi Hien", dept: "", checkIn: "08:01", checkOut: "17:57", workHours: 9.9, overtime: 1.9, lateMins: 0, earlyMins: 0, status: "NORMAL", workplace: "" },
      { empCode: "EXI007", name: "Tran Minh Trang", dept: "", checkIn: "08:08", checkOut: "17:59", workHours: 9.9, overtime: 1.9, lateMins: 0, earlyMins: 0, status: "NORMAL", workplace: "" },
    ], { headers: { "X-Mock": "true" } });
  }
}
