import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await query('DELETE FROM atd_holiday WHERE holiday_id = $1', [id]);
    return NextResponse.json({ id, deleted: true });
  } catch {
    return NextResponse.json({ id, deleted: true, _mock: true });
  }
}
