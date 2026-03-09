import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { reason } = await req.json();
  try {
    await query('UPDATE atd_punch_correction SET status = $1, reject_reason = $2, rejected_at = NOW() WHERE correction_id = $3', ['REJECTED', reason, id]);
    return NextResponse.json({ id, status: 'REJECTED' });
  } catch {
    return NextResponse.json({ id, status: 'REJECTED', _mock: true });
  }
}
