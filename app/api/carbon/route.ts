import { NextResponse } from 'next/server';
import { FootprintQueryParams } from '@/types/queryParams';
import { fetchCarbonFootprints } from '@/lib/api';

export async function GET(request: Request) {
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
