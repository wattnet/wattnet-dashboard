type TokenResponse = {
  access_token: string;
  expires_at: string;
};

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

const TOKEN_ENDPOINT = process.env.API_TOKEN_ENDPOINT!;
if (!TOKEN_ENDPOINT)
  throw new Error('Missing TOKEN_ENDPOINT in environment variables');

const EMAIL = process.env.API_EMAIL!;
if (!EMAIL) throw new Error('Missing EMAIL in environment variables');

const PASSWORD = process.env.API_PASSWORD!;
if (!PASSWORD) throw new Error('Missing PASSWORD in environment variables');

async function requestNewToken(): Promise<string> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) throw new Error('Error requesting new token');

  const data: TokenResponse = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = new Date(data.expires_at).getTime();
  return cachedToken;
}

function isTokenExpired(): boolean {
  if (!cachedToken || !tokenExpiresAt) return true;
  return Date.now() > tokenExpiresAt - 30_000;
}

export async function getAccessToken(): Promise<string> {
  if (isTokenExpired()) return requestNewToken();
  return cachedToken!;
}
