import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/mappings/:id — update mapping
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (body.empId != null) { sets.push(`emp_id = $${idx++}`); vals.push(body.empId); }
    if (body.hikPersonId != null) { sets.push(`hikvision_pid = $${idx++}`); vals.push(body.hikPersonId); }
    if (body.deviceId != null) { sets.push(`device_id = $${idx++}`); vals.push(body.deviceId); }

    if (!sets.length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    vals.push(id);
    const rows = await query(
      `UPDATE atd_device_employee_map SET ${sets.join(', ')} WHERE map_id = $${idx} RETURNING map_id`,
      vals
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/mappings/:id — soft delete (is_active = false)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const rows = await query(
      `UPDATE atd_device_employee_map SET is_active = false WHERE map_id = $1 RETURNING map_id`,
      [id]
    );
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
