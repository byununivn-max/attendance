import { NextResponse } from 'next/server';
import { ERROR_SCHEMA } from './types';

const SCIM_CONTENT_TYPE = { 'Content-Type': 'application/scim+json' };

export function scimError(status: number, detail: string) {
  return NextResponse.json(
    { schemas: [ERROR_SCHEMA], status: String(status), detail },
    { status, headers: SCIM_CONTENT_TYPE },
  );
}

export function scimNotFound(id: string) {
  return scimError(404, `User ${id} not found`);
}

export function scimConflict(detail: string) {
  return scimError(409, detail);
}

export function scimBadRequest(detail: string) {
  return scimError(400, detail);
}
