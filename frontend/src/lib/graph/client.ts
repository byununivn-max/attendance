interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GraphPagedResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

export async function getGraphToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token;
  }

  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing Azure AD env vars (AZURE_AD_TENANT_ID, AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET)');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token request failed (${res.status}): ${errText}`);
  }

  const data: TokenResponse = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export async function graphFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getGraphToken();
  const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Graph API error (${res.status}) ${path}: ${errText}`);
  }

  return res.json();
}

export async function graphFetchAll<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = path;

  while (url) {
    const page: GraphPagedResponse<T> = await graphFetch<GraphPagedResponse<T>>(url);
    results.push(...page.value);
    url = page['@odata.nextLink'];
  }

  return results;
}
