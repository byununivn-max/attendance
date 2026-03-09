import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateScimAuth, SCIM_HEADERS } from '@/lib/scim/auth';
import { employeeToScimUser, scimUserToEmployeeFields } from '@/lib/scim/mappers';
import type { EmployeeRow } from '@/lib/scim/mappers';
import { scimNotFound, scimBadRequest } from '@/lib/scim/errors';
import type { ScimUser, ScimPatchOp } from '@/lib/scim/types';

const SELECT_COLS = `
  emp_id, emp_code, emp_name, email, is_active, full_name, department,
  scim_external_id, scim_display_name, given_name, family_name,
  created_at, updated_at
`;

type Ctx = { params: Promise<{ id: string }> };

// GET /api/scim/v2/Users/:id
export async function GET(req: NextRequest, { params }: Ctx) {
  const authErr = validateScimAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const rows = await query<EmployeeRow>(
    `SELECT ${SELECT_COLS} FROM com_employee WHERE emp_id = $1`,
    [id],
  );
  if (!rows.length) return scimNotFound(id);

  return NextResponse.json(employeeToScimUser(rows[0], baseUrl), { headers: SCIM_HEADERS });
}

// PUT /api/scim/v2/Users/:id — full replace
export async function PUT(req: NextRequest, { params }: Ctx) {
  const authErr = validateScimAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  let body: Partial<ScimUser>;
  try {
    body = await req.json();
  } catch {
    return scimBadRequest('Invalid JSON body');
  }

  const existing = await query<EmployeeRow>(
    `SELECT ${SELECT_COLS} FROM com_employee WHERE emp_id = $1`,
    [id],
  );
  if (!existing.length) return scimNotFound(id);

  const f = scimUserToEmployeeFields(body);

  const [updated] = await query<EmployeeRow>(
    `UPDATE com_employee SET
       emp_code = COALESCE($1, emp_code),
       emp_name = COALESCE($2, emp_name),
       email = COALESCE($3, email),
       is_active = $4,
       full_name = COALESCE($5, full_name),
       department = $6,
       scim_external_id = COALESCE($7, scim_external_id),
       scim_display_name = $8,
       given_name = $9,
       family_name = $10
     WHERE emp_id = $11
     RETURNING ${SELECT_COLS}`,
    [f.emp_code, f.emp_name, f.email, f.is_active, f.full_name, f.department,
     f.scim_external_id, f.scim_display_name, f.given_name, f.family_name, id],
  );

  return NextResponse.json(employeeToScimUser(updated, baseUrl), { headers: SCIM_HEADERS });
}

// PATCH /api/scim/v2/Users/:id — partial update (Entra ID deactivation uses this)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const authErr = validateScimAuth(req);
  if (authErr) return authErr;

  const { id } = await params;
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  let patchBody: ScimPatchOp;
  try {
    patchBody = await req.json();
  } catch {
    return scimBadRequest('Invalid JSON body');
  }

  const existing = await query<EmployeeRow>(
    `SELECT ${SELECT_COLS} FROM com_employee WHERE emp_id = $1`,
    [id],
  );
  if (!existing.length) return scimNotFound(id);

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const op of patchBody.Operations) {
    if (op.op !== 'replace' && op.op !== 'add') continue;

    switch (op.path) {
      case 'active':
        setClauses.push(`is_active = $${idx++}`);
        values.push(Boolean(op.value));
        break;
      case 'userName':
        setClauses.push(`email = $${idx++}`);
        values.push(op.value);
        break;
      case 'displayName':
        setClauses.push(`full_name = $${idx++}`);
        values.push(op.value);
        setClauses.push(`scim_display_name = $${idx++}`);
        values.push(op.value);
        break;
      case 'name.givenName':
        setClauses.push(`given_name = $${idx++}`);
        values.push(op.value);
        break;
      case 'name.familyName':
        setClauses.push(`family_name = $${idx++}`);
        values.push(op.value);
        break;
      case 'externalId':
        setClauses.push(`scim_external_id = $${idx++}`);
        values.push(op.value);
        break;
      default:
        // Entra ID sometimes sends no path, with value as object
        if (!op.path && typeof op.value === 'object' && op.value !== null) {
          const v = op.value as Record<string, unknown>;
          if ('active' in v) {
            setClauses.push(`is_active = $${idx++}`);
            values.push(Boolean(v.active));
          }
          if ('displayName' in v) {
            setClauses.push(`full_name = $${idx++}`);
            values.push(v.displayName);
            setClauses.push(`scim_display_name = $${idx++}`);
            values.push(v.displayName);
          }
        }
        break;
    }
  }

  if (!setClauses.length) {
    return NextResponse.json(employeeToScimUser(existing[0], baseUrl), { headers: SCIM_HEADERS });
  }

  values.push(id);
  const [updated] = await query<EmployeeRow>(
    `UPDATE com_employee SET ${setClauses.join(', ')}
     WHERE emp_id = $${idx}
     RETURNING ${SELECT_COLS}`,
    values,
  );

  return NextResponse.json(employeeToScimUser(updated, baseUrl), { headers: SCIM_HEADERS });
}

// DELETE /api/scim/v2/Users/:id — soft delete (is_active = false)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const authErr = validateScimAuth(req);
  if (authErr) return authErr;

  const { id } = await params;

  const existing = await query<EmployeeRow>(
    `SELECT emp_id FROM com_employee WHERE emp_id = $1`,
    [id],
  );
  if (!existing.length) return scimNotFound(id);

  await query('UPDATE com_employee SET is_active = false WHERE emp_id = $1', [id]);

  return new NextResponse(null, { status: 204 });
}
