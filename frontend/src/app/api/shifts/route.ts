import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT shift_id, shift_code, shift_name,
        TO_CHAR(start_time, 'HH24:MI') AS start_time,
        TO_CHAR(end_time, 'HH24:MI') AS end_time,
        TO_CHAR(lunch_start, 'HH24:MI') AS lunch_start,
        TO_CHAR(lunch_end, 'HH24:MI') AS lunch_end,
        grace_period_in, grace_period_out,
        CAST(min_work_hours AS float) AS min_work_hours,
        is_active
       FROM atd_shift WHERE is_active = true ORDER BY shift_id`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { headers: { 'X-Mock': 'true' } });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shift_code, shift_name, start_time, end_time, lunch_start, lunch_end, grace_period_in, grace_period_out, min_work_hours } = body;
    const rows = await query(
      `INSERT INTO atd_shift (shift_code, shift_name, start_time, end_time, lunch_start, lunch_end, grace_period_in, grace_period_out, min_work_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING shift_id, shift_code, shift_name,
         TO_CHAR(start_time,'HH24:MI') AS start_time, TO_CHAR(end_time,'HH24:MI') AS end_time,
         CAST(min_work_hours AS float) AS min_work_hours`,
      [shift_code, shift_name, start_time, end_time, lunch_start || null, lunch_end || null,
       grace_period_in || 10, grace_period_out || 10, min_work_hours || 8.0]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
