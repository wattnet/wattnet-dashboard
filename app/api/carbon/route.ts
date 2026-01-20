import { NextResponse } from 'next/server';
import { FootprintQueryParams } from '@/types/queryParams';
import { fetchCarbonFootprints } from '@/lib/api';
import { getCurrentToken } from '@/lib/ephemeralTokens';

export async function GET(request: Request) {
  const token = request.headers.get('x-dashboard-token');
  const currentToken = getCurrentToken();

  if (!token || token !== currentToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);

  const params: FootprintQueryParams = {
    footprint_type: url.searchParams.get('footprint_type') as
      | 'carbon'
      | 'water',
    scope: url.searchParams.get('scope') as 'life-cycle' | 'operational',
    start: url.searchParams.get('start') ?? new Date().toISOString(),
    end: url.searchParams.get('end') ?? new Date().toISOString(),
    aggregate: url.searchParams.get('aggregate') === 'true',
    use_global: url.searchParams.get('use_global') === 'true',
  };

  try {
    const data = await fetchCarbonFootprints(params);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Error fetching carbon footprints' },
      { status: 500 }
    );
  }
}
