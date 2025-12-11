import { NextResponse } from 'next/server';
import { fetchCarbonFootprints } from '@/lib/api';
import { FootprintQueryParams } from '@/types/queryParams';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    let params: FootprintQueryParams = {
      footprint_type: searchParams.get('footprint_type') as 'carbon' | 'water',
      scope: searchParams.get('scope') as 'life-cycle' | 'operational',
      start: searchParams.get('start') ?? new Date().toISOString(),
      end: searchParams.get('end') ?? new Date().toISOString(),
      aggregate: searchParams.get('aggregate') === 'true',
      use_global: searchParams.get('use_global') === 'true',
    };

    const data = await fetchCarbonFootprints(params);

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
