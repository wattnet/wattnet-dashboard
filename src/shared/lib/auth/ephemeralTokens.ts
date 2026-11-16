import { createHmac, timingSafeEqual } from 'crypto';

// The token that the browser asks of /api/core and sends back to /api/metrics and /api/imports. It is
// "<expiry in ms>.<HMAC of the expiry>": it carries its own proof, so any replica of the dashboard can check
// it and several valid tokens can exist at the same time (a token held in memory lives in one process, and
// the next one replaced it). It only tells the routes of the dashboard that the request comes from a page
// of the dashboard; the real protection of the data is the API of Wattnet.
//
// It lives five seconds, as it always did: a token that is copied from a request is of no use a moment later.
// The page asks for a new one when a route answers 401 and tries again, so a token that has grown old costs
// one more request and nothing else. It is not a barrier against a script, which can ask /api/core as often
// as it wants: it only makes sure that a token is not kept and used again.
const TOKEN_TTL_MS = 5_000;

function secret(): string {
  const value = process.env.DASHBOARD_TOKEN_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing DASHBOARD_TOKEN_SECRET in environment variables');
  }
  // Development only. It is a fixed value and not a random one because `next dev` compiles each route on its
  // own and reloads modules, so every copy of this module would draw a different secret and the tokens of one
  // route would be refused by the next. In production the variable is required.
  return 'development-only-secret';
}

const sign = (expiry: string): string =>
  createHmac('sha256', secret()).update(expiry).digest('hex');

export function generateNewToken(): string {
  const expiry = String(Date.now() + TOKEN_TTL_MS);
  return `${expiry}.${sign(expiry)}`;
}

export function isValidToken(token: string | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiry, given] = parts;
  const expected = sign(expiry);
  return (
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected)) &&
    Number(expiry) > Date.now()
  );
}
