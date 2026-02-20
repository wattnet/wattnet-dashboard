import { NextResponse } from 'next/server';
import { generateNewToken } from '@/src/lib/auth/ephemeralTokens';

export async function GET() {
  const token = generateNewToken();
  return NextResponse.json({ token });
}
