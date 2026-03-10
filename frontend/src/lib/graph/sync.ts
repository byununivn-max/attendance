import { graphFetchAll, graphFetch } from './client';
import { query } from '../db';
import type { GraphUser, GraphLicenseDetail, GraphGroup, SyncResult } from './types';

// ── User sync ──────────────────────────────────────────────

export async function syncUsers(): Promise<SyncResult> {
  const startTime = Date.now();

  const [log] = await query<{ sync_id: number }>(
    `INSERT INTO graph_sync_log (sync_type, status) VALUES ('users', 'running') RETURNING sync_id`
  );
  const syncId = log.sync_id;

  try {
    const users = await graphFetchAll<GraphUser>(
      "/users?$select=id,displayName,givenName,surname,mail,userPrincipalName,department,jobTitle,accountEnabled&$expand=manager($select=id)&$filter=userType eq 'Member'"
    );

    let created = 0, updated = 0, deactivated = 0;

    for (const u of users) {
      const email = u.mail || u.userPrincipalName;
      const displayName = u.displayName || `${u.givenName ?? ''} ${u.surname ?? ''}`.trim() || null;
      const managerGraphId = u.manager?.id ?? null;

      const [existing] = await query<{ emp_id: number }>(
        `SELECT emp_id FROM com_employee WHERE graph_id = $1 OR email = $2 LIMIT 1`,
        [u.id, email]
      );

      if (existing) {
        await query(
          `UPDATE com_employee SET
            graph_id = $1, display_name = $2, given_name = $3, family_name = $4,
            email = $5, department = $6, job_title = $7, account_enabled = $8,
            is_active = $8, manager_graph_id = $9, last_graph_sync = now()
           WHERE emp_id = $10`,
          [u.id, displayName, u.givenName, u.surname, email, u.department,
           u.jobTitle, u.accountEnabled, managerGraphId, existing.emp_id]
        );
        if (!u.accountEnabled) deactivated++;
        else updated++;
      } else {
        const [row] = await query<{ emp_id: number }>(
          `INSERT INTO com_employee
            (graph_id, display_name, given_name, family_name, email, department,
             job_title, account_enabled, is_active, manager_graph_id, emp_name, full_name, last_graph_sync)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $2, $2, now())
           RETURNING emp_id`,
          [u.id, displayName, u.givenName, u.surname, email, u.department,
           u.jobTitle, u.accountEnabled, managerGraphId]
        );
        await query(
          `INSERT INTO atd_employee_schedule (emp_id, shift_id, start_date, work_days_mask)
           VALUES ($1, 1, CURRENT_DATE, 62) ON CONFLICT DO NOTHING`,
          [row.emp_id]
        );
        created++;
      }
    }

    // Resolve manager_id from manager_graph_id (second pass)
    await query(
      `UPDATE com_employee e SET manager_id = mgr.emp_id
       FROM com_employee mgr
       WHERE e.manager_graph_id IS NOT NULL
         AND e.manager_graph_id = mgr.graph_id
         AND (e.manager_id IS NULL OR e.manager_id != mgr.emp_id)`
    );

    const duration = Date.now() - startTime;
    await query(
      `UPDATE graph_sync_log SET
        status = 'completed', users_synced = $1, users_created = $2,
        users_updated = $3, users_deactivated = $4, completed_at = now()
       WHERE sync_id = $5`,
      [users.length, created, updated, deactivated, syncId]
    );

    return { syncId, syncType: 'users', usersTotal: users.length, usersCreated: created, usersUpdated: updated, usersDeactivated: deactivated, duration };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await query(
      `UPDATE graph_sync_log SET status = 'failed', error_message = $1, completed_at = now() WHERE sync_id = $2`,
      [msg, syncId]
    );
    throw err;
  }
}

// ── License sync ──────────────────────────────────────────

export async function syncLicenses(): Promise<{ synced: number }> {
  const employees = await query<{ emp_id: number; graph_id: string }>(
    `SELECT emp_id, graph_id FROM com_employee WHERE graph_id IS NOT NULL AND is_active = true`
  );

  let synced = 0;
  for (const emp of employees) {
    try {
      const licenses = await graphFetch<{ value: GraphLicenseDetail[] }>(
        `/users/${emp.graph_id}/licenseDetails`
      );

      await query(`DELETE FROM graph_user_license WHERE emp_id = $1`, [emp.emp_id]);

      for (const lic of licenses.value) {
        await query(
          `INSERT INTO graph_user_license (emp_id, sku_id, sku_name, service_plans)
           VALUES ($1, $2, $3, $4)`,
          [emp.emp_id, lic.skuId, lic.skuPartNumber, JSON.stringify(lic.servicePlans)]
        );
      }
      synced++;
    } catch {
      // Individual user license fetch can fail; continue
    }
  }

  return { synced };
}

// ── Group sync ────────────────────────────────────────────

export async function syncGroups(): Promise<{ groupsSynced: number; membersSynced: number }> {
  const groups = await graphFetchAll<GraphGroup>(
    '/groups?$select=id,displayName,description,mail'
  );

  let groupsSynced = 0, membersSynced = 0;

  for (const g of groups) {
    const [row] = await query<{ group_id: number }>(
      `INSERT INTO graph_group (graph_group_id, display_name, description, mail)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (graph_group_id) DO UPDATE SET display_name = $2, description = $3, mail = $4, synced_at = now()
       RETURNING group_id`,
      [g.id, g.displayName, g.description, g.mail]
    );

    try {
      const members = await graphFetchAll<{ id: string }>(
        `/groups/${g.id}/members?$select=id`
      );

      await query(`DELETE FROM graph_group_member WHERE group_id = $1`, [row.group_id]);

      for (const m of members) {
        await query(
          `INSERT INTO graph_group_member (group_id, emp_id)
           SELECT $1, emp_id FROM com_employee WHERE graph_id = $2
           ON CONFLICT DO NOTHING`,
          [row.group_id, m.id]
        );
      }
      membersSynced += members.length;
    } catch {
      // Some groups may restrict member listing
    }

    groupsSynced++;
  }

  return { groupsSynced, membersSynced };
}
