// Minimal SCIM filter parser for Entra ID provisioning.
// Supports: <attr> eq "<value>"

interface ParsedFilter {
  column: string;
  value: string;
}

const ATTR_MAP: Record<string, string> = {
  userName: 'email',
  externalId: 'scim_external_id',
  displayName: 'full_name',
  'name.givenName': 'given_name',
  'name.familyName': 'family_name',
  'emails.value': 'email',
  'emails[type eq "work"].value': 'email',
};

export function parseScimFilter(filterStr: string): ParsedFilter | null {
  const match = filterStr.match(/^(.+?)\s+eq\s+"(.+)"$/i);
  if (!match) return null;

  const column = ATTR_MAP[match[1].trim()];
  if (!column) return null;

  return { column, value: match[2] };
}
