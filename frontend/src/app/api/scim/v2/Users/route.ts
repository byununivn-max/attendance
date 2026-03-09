import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateScimAuth, SCIM_HEADERS } from '@/lib/scim/auth';
import { employeeToScimUser, scimUserToEmployeeFields } from '@/lib/scim/mappers';
import type { EmployeeRow } from '@/lib/scim/mappers';
import { parseScimFilter } from '@/lib/scim/filters';
import { scimConflict, scimBadRequest } from '@/lib/scim/errors';
import { LIST_SCHEMA } from '@/lib/scim/types';
import type { ScimUser, ScimListResponse } from '@/lib/scim/types';

const SELECT_COLS = `
  emp_id, emp_code, emp_name, email, is_active, full_name, department,
  scim_external_id, scim_display_name, given_name, family_name,
  created_at, updated_at
`;

// GET /api/scim/v2/Users — list with optional filter & pagination
export async function GET(req: NextRequest) {
  const authErr = validateScimAuth(req);
  if (authErr) return authErr;

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const filter = req.nextUrl.searchParams.get('filter');
  const startIndex = Math.max(1, Number(req.nextUrl.searchParams.get('startIndex')) || 1);
  const count = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('count')) || 100));

  let whereSql = '';
  const params: unknown[] = [];

  if (filter) {
    const parsed = parseScimFilter(filter);
    if (!parsed) return scimBadRequest(`Unsupported filter: ${filter}`);
    whereSql = `WHERE ${parsed.column} = $1`;
    params.push(parsed.value);
  }

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM com_employee ${whereSql}`,
    params,
  );

  const offset = startIndex - 1;
  const rows = await query<EmployeeRow>(
    `SELECT ${SELECT_COLS} FROM com_employee ${whereSql}
     ORDER BY emp_id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, count, offset],
  );

  const body: ScimListResponse = {
    schemas: [LIST_SCHEMA],
    totalResults: total,
    startIndex,
    itemsPerPage: rows.length,
    Resources: rows.map((r) => employeeToScimUser(r, baseUrl)),
  };

  return NextResponse.json(body, { headers: SCIM_HEADERS });
}

// POST /api/scim/v2/Users — create employee + auto-assign default schedule
export async function POST(req: NextRequest) {
  const authErr = validateScimAuth(req);
  if (authErr) return authErr;

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  let body: Partial<ScimUser>;
  try {
    body = await req.json();
  } catch {
    return scimBadRequest('Invalid JSON body');
  }

  const f = scimUserToEmployeeFields(body);
  if (!f.email) return scimBadRequest('userName (email) is required');

  // Duplicate check
  const dup = await query<{ emp_id: number }>(
    'SELECT emp_id FROM com_employee WHERE email = $1',
    [f.email],
  );
  if (dup.length > 0) return scimConflict(`User with email ${f.email} already exists`);

  // Insert employee
  const [row] = await query<EmployeeRow>(
    `INSERT INTO com_employee
       (emp_code, emp_name, email, is_active, full_name, department,
        scim_external_id, scim_display_name, given_name, family_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING ${SELECT_COLS}`,
    [f.emp_code, f.emp_name, f.email, f.is_active, f.full_name, f.department,
     f.scim_external_id, f.scim_display_name, f.given_name, f.family_name],
  );

  // Auto-assign standard shift (shift_id=1, Mon-Fri mask=62)
  await query(
    `INSERT INTO atd_employee_schedule (emp_id, shift_id, start_date, work_days_mask)
     VALUES ($1, 1, CURRENT_DATE, 62) ON CONFLICT DO NOTHING`,
    [row.emp_id],
  );

  const user = employeeToScimUser(row, baseUrl);

  return NextResponse.json(user, {
    status: 201,
    headers: { ...SCIM_HEADERS, Location: user.meta!.location },
  });
}
