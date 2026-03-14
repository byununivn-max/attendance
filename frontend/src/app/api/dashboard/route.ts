import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const MOCK = {
  present: 12, late: 3, absent: 5, missed: 2, total: 27,
  weeklyTrend: [
    { day: "mon", normal: 15, late: 3, absent: 9 },
    { day: "tue", normal: 18, late: 2, absent: 7 },
    { day: "wed", normal: 16, late: 4, absent: 7 },
    { day: "thu", normal: 17, late: 3, absent: 7 },
    { day: "fri", normal: 15, late: 2, absent: 10 },
    { day: "sat", normal: 5, late: 1, absent: 21 },
    { day: "today", normal: 12, late: 3, absent: 12 },
  ],
  pending: [],
};

export async function GET() {
  try {
    // Use today, but fall back to the most recent date with data
    const today = new Date().toISOString().slice(0, 10);
    const [dateRow] = await query<{ target_date: string }>(
      `SELECT COALESCE(
        (SELECT work_date FROM atd_daily_summary WHERE work_date = $1 LIMIT 1),
        (SELECT MAX(work_date) FROM atd_daily_summary)
       )::text AS target_date`,
      [today]
    );
    const targetDate = dateRow?.target_date ?? today;

    const [summary] = await query<{ present: number; late: number; absent: number; missed: number; total: number }>(
      `SELECT
        COUNT(*) FILTER (WHERE ds.attendance_status = 'NORMAL')::int AS present,
        COUNT(*) FILTER (WHERE ds.attendance_status = 'LATE')::int AS late,
        COUNT(*) FILTER (WHERE ds.attendance_status = 'ABSENT')::int AS absent,
        COUNT(*) FILTER (WHERE ds.attendance_status = 'MISSED_PUNCH')::int AS missed,
        COUNT(*)::int AS total
      FROM atd_daily_summary ds
      JOIN atd_device_employee_map dem ON dem.emp_id = ds.emp_id
      WHERE ds.work_date = $1`,
      [targetDate]
    );
    const pending = await query(
      `SELECT pc.correction_id AS id, e.emp_code AS "empCode",
        COALESCE(e.display_name, e.full_name, e.emp_name) AS name,
        pc.work_date AS date, pc.punch_type AS "punchType", pc.status
       FROM atd_punch_correction pc
       JOIN com_employee e ON e.emp_id = pc.emp_id
       WHERE pc.status = 'PENDING'
       ORDER BY pc.created_at DESC LIMIT 5`
    );

    // Last 7 days trend (ending on targetDate)
    const trendRows = await query<{ work_date: string; normal: number; late: number; absent: number }>(
      `SELECT TO_CHAR(work_date, 'YYYY-MM-DD') AS work_date,
        COUNT(*) FILTER (WHERE attendance_status = 'NORMAL')::int AS normal,
        COUNT(*) FILTER (WHERE attendance_status = 'LATE')::int AS late,
        COUNT(*) FILTER (WHERE attendance_status = 'ABSENT')::int AS absent
       FROM atd_daily_summary
       WHERE work_date BETWEEN ($1::date - interval '6 days') AND $1::date
       GROUP BY work_date ORDER BY work_date`,
      [targetDate]
    );
    const dayLabels = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'today'];
    // Map last 7 calendar days to fixed slots (older → mon..sat, newest → today)
    const weeklyTrend = trendRows.slice(-7).map((r, i, arr) => ({
      day: i === arr.length - 1 ? 'today' : dayLabels[i],
      normal: r.normal,
      late: r.late,
      absent: r.absent,
    }));

    return NextResponse.json({ ...summary, weeklyTrend: weeklyTrend.length ? weeklyTrend : MOCK.weeklyTrend, pending, date: targetDate });
  } catch {
    return NextResponse.json({ ...MOCK, date: new Date().toISOString().slice(0, 10), _mock: true });
  }
}
