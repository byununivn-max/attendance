import { NextRequest, NextResponse } from 'next/server';
import { validateScimAuth, SCIM_HEADERS } from '@/lib/scim/auth';
import { CORE_SCHEMA, ENTERPRISE_URN } from '@/lib/scim/types';

export async function GET(req: NextRequest) {
  const err = validateScimAuth(req);
  if (err) return err;

  return NextResponse.json(
    [
      {
        id: CORE_SCHEMA,
        name: 'User',
        description: 'User Account',
        attributes: [
          { name: 'userName', type: 'string', multiValued: false, required: true, mutability: 'readWrite', returned: 'default', uniqueness: 'server' },
          {
            name: 'name', type: 'complex', multiValued: false, required: false,
            subAttributes: [
              { name: 'formatted', type: 'string', mutability: 'readWrite', returned: 'default' },
              { name: 'familyName', type: 'string', mutability: 'readWrite', returned: 'default' },
              { name: 'givenName', type: 'string', mutability: 'readWrite', returned: 'default' },
            ],
          },
          { name: 'displayName', type: 'string', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
          {
            name: 'emails', type: 'complex', multiValued: true, required: false,
            subAttributes: [
              { name: 'value', type: 'string', mutability: 'readWrite', returned: 'default' },
              { name: 'type', type: 'string', mutability: 'readWrite', returned: 'default' },
              { name: 'primary', type: 'boolean', mutability: 'readWrite', returned: 'default' },
            ],
          },
          { name: 'active', type: 'boolean', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
          { name: 'externalId', type: 'string', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
        ],
      },
      {
        id: ENTERPRISE_URN,
        name: 'EnterpriseUser',
        description: 'Enterprise User Extension',
        attributes: [
          { name: 'employeeNumber', type: 'string', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
          { name: 'department', type: 'string', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
        ],
      },
    ],
    { headers: SCIM_HEADERS },
  );
}
