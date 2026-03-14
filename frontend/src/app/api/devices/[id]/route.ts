import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, location, ip_address, port, serial_number } = body;
    await query(
      `UPDATE atd_device SET device_name=$1, location=$2, device_ip=$3, port=$4, serial_number=$5, updated_at=NOW()
       WHERE device_id=$6`,
      [name, location, ip_address, port || 80, serial_number, id]
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await query(`UPDATE atd_device SET status='INACTIVE', updated_at=NOW() WHERE device_id=$1`, [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
  }
}
