import { NextResponse } from 'next/server';
import { generateNewToken } from '@/lib/ephemeralTokens';

export async function GET() {
  const token = generateNewToken();
  return NextResponse.json({ token });
}
