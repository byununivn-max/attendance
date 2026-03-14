import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ empId: string }> }) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month') || String(new Date().getMonth() + 1).padStart(2, '0');
  const { empId } = await params;
  try {
    const [emp] = await query<{ emp_code: string; name: string; dept: string }>(
      `SELECT e.emp_code,
        COALESCE(e.display_name, e.full_name, e.emp_name) AS name,
        COALESCE(e.department, '') AS dept
       FROM com_employee e
       WHERE e.emp_code = $1 OR SPLIT_PART(e.email, '@', 1) = $1`,
      [empId]
    );
    if (!emp) return NextResponse.json({ empCode: empId, name: empId, dept: '', normalDays: 0, lateDays: 0, absentDays: 0, records: [] });

    const records = await query<{ date: string; checkIn: string; checkOut: string; workHours: number; overtime: number; lateMins: number; status: string }>(
      `SELECT TO_CHAR(ds.work_date, 'YYYY-MM-DD') AS date,
        TO_CHAR(ds.actual_check_in, 'HH24:MI') AS "checkIn",
        TO_CHAR(ds.actual_check_out, 'HH24:MI') AS "checkOut",
        ROUND(ds.working_minutes / 60.0, 1)::float AS "workHours",
        ROUND(ds.overtime_minutes / 60.0, 1)::float AS overtime,
        ds.late_minutes AS "lateMins",
        ds.attendance_status AS status
       FROM atd_daily_summary ds
       JOIN com_employee e ON e.emp_id = ds.emp_id
       WHERE (e.emp_code = $1 OR SPLIT_PART(e.email, '@', 1) = $1)
         AND EXTRACT(YEAR FROM ds.work_date) = $2
         AND EXTRACT(MONTH FROM ds.work_date) = $3
       ORDER BY ds.work_date`,
      [empId, year, month]
    );

    const normalDays = records.filter(r => r.status === 'NORMAL').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;

    return NextResponse.json({
      empCode: emp.emp_code,
      name: emp.name,
      dept: emp.dept,
      normalDays,
      lateDays,
      absentDays,
      records,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
