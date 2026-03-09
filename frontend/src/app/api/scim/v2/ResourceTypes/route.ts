import { NextRequest, NextResponse } from 'next/server';
import { validateScimAuth, SCIM_HEADERS } from '@/lib/scim/auth';
import { CORE_SCHEMA, ENTERPRISE_URN } from '@/lib/scim/types';

export async function GET(req: NextRequest) {
  const err = validateScimAuth(req);
  if (err) return err;

  return NextResponse.json(
    [
      {
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
        id: 'User',
        name: 'User',
        endpoint: '/Users',
        schema: CORE_SCHEMA,
        schemaExtensions: [{ schema: ENTERPRISE_URN, required: false }],
      },
    ],
    { headers: SCIM_HEADERS },
  );
}
