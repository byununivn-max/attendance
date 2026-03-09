import { NextRequest, NextResponse } from 'next/server';
import { validateScimAuth, SCIM_HEADERS } from '@/lib/scim/auth';

export async function GET(req: NextRequest) {
  const err = validateScimAuth(req);
  if (err) return err;

  return NextResponse.json(
    {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      patch: { supported: true },
      bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false },
      sort: { supported: false },
      etag: { supported: false },
      authenticationSchemes: [
        {
          type: 'oauthbearertoken',
          name: 'OAuth Bearer Token',
          description: 'Authentication using the OAuth Bearer Token Standard',
        },
      ],
    },
    { headers: SCIM_HEADERS },
  );
}
