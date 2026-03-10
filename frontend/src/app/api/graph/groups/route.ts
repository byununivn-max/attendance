import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(
      `SELECT g.group_id, g.graph_group_id, g.display_name, g.description, g.mail,
              COUNT(gm.emp_id)::int AS member_count, g.synced_at
       FROM graph_group g
       LEFT JOIN graph_group_member gm ON gm.group_id = g.group_id
       GROUP BY g.group_id
       ORDER BY g.display_name`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
