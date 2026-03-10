import { NextRequest, NextResponse } from 'next/server';
import { syncUsers, syncLicenses, syncGroups } from '@/lib/graph/sync';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const syncType = req.nextUrl.searchParams.get('type') || 'full';
    const results: Record<string, unknown> = {};

    if (syncType === 'users' || syncType === 'full') {
      results.users = await syncUsers();
    }
    if (syncType === 'licenses' || syncType === 'full') {
      results.licenses = await syncLicenses();
    }
    if (syncType === 'groups' || syncType === 'full') {
      results.groups = await syncGroups();
    }

    return NextResponse.json({ ok: true, syncType, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await query(
      `SELECT sync_id, sync_type, status, users_synced, users_created,
              users_updated, users_deactivated, error_message,
              started_at, completed_at
       FROM graph_sync_log ORDER BY started_at DESC LIMIT 20`
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
