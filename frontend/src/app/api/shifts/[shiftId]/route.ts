import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ shiftId: string }> }) {
  const { shiftId } = await params;
  try {
    const body = await request.json();
    const { shift_name, start_time, end_time, lunch_start, lunch_end, grace_period_in, grace_period_out, min_work_hours } = body;
    await query(
      `UPDATE atd_shift SET shift_name=$1, start_time=$2, end_time=$3, lunch_start=$4, lunch_end=$5,
        grace_period_in=$6, grace_period_out=$7, min_work_hours=$8, updated_at=NOW()
       WHERE shift_id=$9`,
      [shift_name, start_time, end_time, lunch_start || null, lunch_end || null,
       grace_period_in || 10, grace_period_out || 10, min_work_hours || 8.0, shiftId]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ shiftId: string }> }) {
  const { shiftId } = await params;
  try {
    await query(`UPDATE atd_shift SET is_active=false, updated_at=NOW() WHERE shift_id=$1`, [shiftId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
