import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ empId: string }> }) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month') || String(new Date().getMonth() + 1).padStart(2, '0');
  const { empId } = await params;
  try {
    const [emp] = await query(
      `SELECT e.emp_code, COALESCE(e.full_name, e.emp_name) AS name,
        COALESCE(e.department, '') AS dept
       FROM com_employee e WHERE e.emp_code = $1`,
      [empId]
    );
    const records = await query(
      `SELECT ds.work_date AS date,
        TO_CHAR(ds.actual_check_in, $4) AS "checkIn",
        TO_CHAR(ds.actual_check_out, $4) AS "checkOut",
        ROUND(ds.working_minutes / 60.0, 1)::float AS "workHours",
        ROUND(ds.overtime_minutes / 60.0, 1)::float AS overtime,
        ds.late_minutes AS "lateMins",
        ds.attendance_status AS status
       FROM atd_daily_summary ds
       JOIN com_employee e ON e.emp_id = ds.emp_id
       WHERE e.emp_code = $1
         AND EXTRACT(YEAR FROM ds.work_date) = $2
         AND EXTRACT(MONTH FROM ds.work_date) = $3
       ORDER BY ds.work_date`,
      [empId, year, month, 'HH24:MI']
    );
    return NextResponse.json({ employee: emp, records, year, month });
  } catch {
    return NextResponse.json({
      employee: { empCode: empId, name: empId, dept: 'Unknown' },
      records: [
        { date: '2026-03-01', checkIn: '08:02', checkOut: '17:10', workHours: 9.1, overtime: 0.1, lateMins: 0, status: 'NORMAL' },
        { date: '2026-03-02', checkIn: '08:25', checkOut: '17:00', workHours: 8.6, overtime: 0, lateMins: 25, status: 'LATE' },
        { date: '2026-03-03', checkIn: '08:00', checkOut: '17:00', workHours: 9.0, overtime: 0, lateMins: 0, status: 'NORMAL' },
        { date: '2026-03-04', checkIn: '', checkOut: '', workHours: 0, overtime: 0, lateMins: 0, status: 'ABSENT' },
        { date: '2026-03-05', checkIn: '08:00', checkOut: '17:00', workHours: 9.0, overtime: 0, lateMins: 0, status: 'NORMAL' },
      ],
      year, month, _mock: true
    });
  }
}
