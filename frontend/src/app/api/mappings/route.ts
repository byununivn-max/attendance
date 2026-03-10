import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/mappings — list all active mappings
export async function GET() {
  try {
    const rows = await query(
      `SELECT dem.map_id AS "mapId", dem.device_id AS "deviceId",
        d.device_name AS "deviceName", dem.hikvision_pid AS "hikPersonId",
        dem.emp_id AS "empId", e.emp_code AS "empCode",
        COALESCE(e.display_name, e.full_name, e.emp_name) AS "empName",
        COALESCE(e.email, '') AS email, dem.is_active AS "isActive"
       FROM atd_device_employee_map dem
       JOIN com_employee e ON e.emp_id = dem.emp_id
       JOIN atd_device d ON d.device_id = dem.device_id
       WHERE dem.is_active = true
       ORDER BY dem.device_id, dem.hikvision_pid::int`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/mappings — create a new mapping
export async function POST(req: NextRequest) {
  try {
    const { deviceId, hikPersonId, empId } = await req.json();
    if (!deviceId || !hikPersonId || !empId) {
      return NextResponse.json({ error: 'deviceId, hikPersonId, empId required' }, { status: 400 });
    }

    const [row] = await query<{ map_id: number }>(
      `INSERT INTO atd_device_employee_map (device_id, hikvision_pid, emp_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (device_id, hikvision_pid) DO UPDATE SET emp_id = $3, is_active = true
       RETURNING map_id`,
      [deviceId, hikPersonId, empId]
    );
    return NextResponse.json({ mapId: row.map_id }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
