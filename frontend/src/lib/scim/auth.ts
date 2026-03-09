import { NextRequest } from 'next/server';
import { scimError } from './errors';

export const SCIM_HEADERS = { 'Content-Type': 'application/scim+json' };

/**
 * Validate Bearer token on SCIM requests.
 * Returns null if auth passes, or an error NextResponse to return immediately.
 */
export function validateScimAuth(req: NextRequest) {
  const expected = process.env.SCIM_BEARER_TOKEN;
  if (!expected) {
    return scimError(500, 'SCIM token not configured');
  }

  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ') || auth.slice(7) !== expected) {
    return scimError(401, 'Unauthorized');
  }

  return null;
}
