import { randomBytes } from 'crypto';

let cachedToken: string | null = null;
let tokenExpiresAt: number | null = null;

const TOKEN_TTL = 5_000;

function isTokenExpired(): boolean {
  if (!cachedToken || !tokenExpiresAt) return true;
  return Date.now() > tokenExpiresAt;
}

export function generateNewToken(): string {
  cachedToken = randomBytes(16).toString('hex');
  tokenExpiresAt = Date.now() + TOKEN_TTL;
  return cachedToken;
}

export function getCurrentToken(): string | null {
  if (!cachedToken || isTokenExpired()) return null;
  return cachedToken;
}
