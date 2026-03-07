import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const mockDevices = [
  { id: 1, name: 'Main Entrance', serial_number: 'HIK-001', ip_address: '192.168.1.100', port: 80, location: 'Gate A', status: 'online', last_sync_at: '2026-03-07T08:00:00Z' },
  { id: 2, name: 'Factory Floor', serial_number: 'HIK-002', ip_address: '192.168.1.101', port: 80, location: 'Building B', status: 'online', last_sync_at: '2026-03-07T07:55:00Z' },
  { id: 3, name: 'Warehouse Entry', serial_number: 'HIK-003', ip_address: '192.168.1.102', port: 80, location: 'Warehouse A1', status: 'offline', last_sync_at: '2026-03-06T23:10:00Z' },
];

export async function GET() {
  try {
    const rows = await query(
      `SELECT device_id AS id, device_name AS name, serial_number, device_ip AS ip_address, port, location,
        CASE WHEN status = 'ACTIVE' THEN 'online' ELSE 'offline' END AS status,
        last_sync_at
       FROM atd_device ORDER BY device_id`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json(mockDevices, { headers: { 'X-Mock': 'true' } });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, serial_number, ip_address, port, location } = body;
    const rows = await query(
      'INSERT INTO atd_device (device_name, serial_number, device_ip, port, location, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING device_id AS id, device_name AS name, serial_number, device_ip AS ip_address, port, location, status, last_sync_at',
      [name, serial_number, ip_address, port || 80, location, 'INACTIVE']
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add device' }, { status: 500 });
  }
}
