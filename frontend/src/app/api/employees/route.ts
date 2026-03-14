import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT e.emp_id,
        COALESCE(SPLIT_PART(e.email, '@', 1), e.emp_code) AS emp_code,
        COALESCE(e.display_name, e.full_name, e.emp_name) AS name,
        COALESCE(e.department, '') AS department,
        COALESCE(e.employment_status, 'ACTIVE') AS employment_status,
        dem.map_id AS "mapId",
        dem.hikvision_pid AS "hikPersonId",
        d.device_name AS "deviceName",
        d.device_name AS "workplace",
        dem.device_id AS "deviceId"
       FROM com_employee e
       LEFT JOIN atd_device_employee_map dem ON dem.emp_id = e.emp_id AND dem.is_active = true
       LEFT JOIN atd_device d ON d.device_id = dem.device_id
       ORDER BY e.emp_code`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { headers: { 'X-Mock': 'true' } });
  }
}
