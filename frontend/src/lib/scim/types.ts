// SCIM 2.0 Core Types (RFC 7643 / 7644)

export const CORE_SCHEMA = 'urn:ietf:params:scim:schemas:core:2.0:User';
export const ENTERPRISE_URN =
  'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
export const LIST_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:ListResponse';
export const ERROR_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:Error';
export const PATCH_SCHEMA = 'urn:ietf:params:scim:api:messages:2.0:PatchOp';

export interface ScimMeta {
  resourceType: string;
  created: string;
  lastModified: string;
  location: string;
}

export interface ScimName {
  formatted?: string;
  familyName?: string;
  givenName?: string;
}

export interface ScimEmail {
  value: string;
  type?: string;
  primary?: boolean;
}

export interface ScimUser {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name?: ScimName;
  displayName?: string;
  emails?: ScimEmail[];
  active?: boolean;
  [ENTERPRISE_URN]?: {
    employeeNumber?: string;
    department?: string;
  };
  meta?: ScimMeta;
}

export interface ScimListResponse {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: ScimUser[];
}

export interface ScimError {
  schemas: string[];
  status: string;
  detail: string;
}

export interface ScimPatchOp {
  schemas: string[];
  Operations: Array<{
    op: 'add' | 'replace' | 'remove';
    path?: string;
    value?: unknown;
  }>;
}
