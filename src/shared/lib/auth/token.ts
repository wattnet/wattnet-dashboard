type TokenResponse = {
  access_token: string;
  expires_in: number;
};

const RENEW_FRACTION = 0.8;
const MIN_MARGIN_MS = 60_000;

let cachedToken: string | null = null;
// performance.now() value: monotonic, so a clock change cannot extend a token.
let renewAt = 0;
let inFlight: Promise<string> | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in environment variables`);
  return value;
}

async function requestNewToken(): Promise<string> {
  const started = performance.now();
  const res = await fetch(requiredEnv('API_TOKEN_ENDPOINT'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: requiredEnv('API_CLIENT_ID'),
      client_secret: requiredEnv('API_CLIENT_SECRET'),
    }),
  });

  if (!res.ok) throw new Error(`Error requesting new token: ${res.status}`);

  const data: TokenResponse = await res.json();
  const lifetimeMs = data.expires_in * 1000;
  cachedToken = data.access_token;
  renewAt =
    started +
    Math.max(
      Math.min(lifetimeMs * RENEW_FRACTION, lifetimeMs - MIN_MARGIN_MS),
      0,
    );
  return cachedToken;
}

export async function getAccessToken(): Promise<string> {
  if (cachedToken && performance.now() < renewAt) return cachedToken;
  // One request at a time: concurrent callers share the same token request.
  inFlight ??= requestNewToken().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function invalidateAccessToken(): void {
  cachedToken = null;
}
