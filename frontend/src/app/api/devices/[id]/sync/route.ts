import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await query('UPDATE atd_device SET last_sync_at = NOW(), status = $1 WHERE device_id = $2', ['ACTIVE', id]);
    return NextResponse.json({ success: true, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ success: true, syncedAt: new Date().toISOString(), mock: true });
  }
}
