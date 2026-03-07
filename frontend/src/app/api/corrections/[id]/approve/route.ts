import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await query('UPDATE atd_punch_correction SET status = $1, approved_at = NOW() WHERE correction_id = $2', ['APPROVED', id]);
    return NextResponse.json({ id, status: 'APPROVED' });
  } catch {
    return NextResponse.json({ id, status: 'APPROVED', _mock: true });
  }
}
