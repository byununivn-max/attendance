import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT l.license_id, e.emp_code, COALESCE(e.display_name, e.full_name, e.emp_name) AS name,
              l.sku_id, l.sku_name, l.service_plans, l.synced_at
       FROM graph_user_license l
       JOIN com_employee e ON e.emp_id = l.emp_id
       ORDER BY e.emp_code, l.sku_name`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
