import { CORE_SCHEMA, ENTERPRISE_URN } from './types';
import type { ScimUser, ScimMeta } from './types';

// Shape returned by SELECT * FROM com_employee (with SCIM columns)
export interface EmployeeRow {
  emp_id: number;
  emp_code: string | null;
  emp_name: string | null;
  email: string | null;
  is_active: boolean;
  full_name: string | null;
  department: string | null;
  scim_external_id: string | null;
  scim_display_name: string | null;
  given_name: string | null;
  family_name: string | null;
  created_at: string;
  updated_at: string;
}

/** Convert a DB row to a SCIM User resource. */
export function employeeToScimUser(row: EmployeeRow, baseUrl: string): ScimUser {
  const schemas = [CORE_SCHEMA];

  const enterprise: Record<string, string> = {};
  if (row.emp_code) enterprise.employeeNumber = row.emp_code;
  if (row.department) enterprise.department = row.department;
  if (Object.keys(enterprise).length > 0) schemas.push(ENTERPRISE_URN);

  const meta: ScimMeta = {
    resourceType: 'User',
    created: new Date(row.created_at).toISOString(),
    lastModified: new Date(row.updated_at).toISOString(),
    location: `${baseUrl}/api/scim/v2/Users/${row.emp_id}`,
  };

  return {
    schemas,
    id: String(row.emp_id),
    externalId: row.scim_external_id ?? undefined,
    userName: row.email ?? '',
    name: {
      formatted: row.full_name ?? row.emp_name ?? undefined,
      givenName: row.given_name ?? undefined,
      familyName: row.family_name ?? undefined,
    },
    displayName: row.scim_display_name ?? row.full_name ?? row.emp_name ?? undefined,
    emails: row.email ? [{ value: row.email, type: 'work', primary: true }] : [],
    active: row.is_active,
    ...(Object.keys(enterprise).length > 0
      ? { [ENTERPRISE_URN]: enterprise }
      : {}),
    meta,
  };
}

/** Extract DB-ready fields from an incoming SCIM User payload. */
export function scimUserToEmployeeFields(scimUser: Partial<ScimUser>) {
  const enterprise = scimUser[ENTERPRISE_URN];

  const fullName =
    scimUser.displayName ??
    scimUser.name?.formatted ??
    (scimUser.name?.givenName && scimUser.name?.familyName
      ? `${scimUser.name.givenName} ${scimUser.name.familyName}`
      : null);

  return {
    email: scimUser.userName ?? scimUser.emails?.[0]?.value ?? null,
    emp_name: fullName,
    full_name: fullName,
    scim_display_name: scimUser.displayName ?? null,
    given_name: scimUser.name?.givenName ?? null,
    family_name: scimUser.name?.familyName ?? null,
    emp_code: enterprise?.employeeNumber ?? null,
    department: enterprise?.department ?? null,
    is_active: scimUser.active ?? true,
    scim_external_id: scimUser.externalId ?? null,
  };
}
