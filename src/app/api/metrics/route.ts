import { NextResponse } from 'next/server';
import { FootprintQueryParams } from '@/src/shared/types/queryParams';
import {
  fetchFootprints,
  fetchImpacts,
  fetchGreenScore,
} from '@/src/shared/lib/api/api';
import { getCurrentToken } from '@/src/shared/lib/auth/ephemeralTokens';

const FETCHER_BY_METRIC: Record<
  string,
  (params: FootprintQueryParams) => Promise<unknown>
> = {
  footprint: fetchFootprints,
  impact: fetchImpacts,
  'green-score': fetchGreenScore,
};

export async function GET(request: Request) {
  const token = request.headers.get('x-dashboard-token');
  if (!token || token !== getCurrentToken()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const metric = url.searchParams.get('metric') ?? 'footprint';

  const fetcher = FETCHER_BY_METRIC[metric];
  if (!fetcher) {
    return NextResponse.json(
      { error: `Unknown metric: "${metric}"` },
      { status: 400 },
    );
  }

  const params: FootprintQueryParams = {
    metric: metric as FootprintQueryParams['metric'],
    scope: url.searchParams.get('scope') as 'life-cycle' | 'operational',
    start: url.searchParams.get('start') ?? new Date().toISOString(),
    end: url.searchParams.get('end') ?? new Date().toISOString(),
    zone: url.searchParams.get('zone') ?? '',
    // dimension is intentionally omitted for green-score (no carbon/water split)
    ...(metric === 'footprint' && {
      aggregate: url.searchParams.get('aggregate') === 'true',
      use_global: url.searchParams.get('use_global') === 'true',
      footprint_type: url.searchParams.get('dimension') as 'carbon' | 'water',
    }),
    ...(metric === 'impact' && {
      aggregate: url.searchParams.get('aggregate') === 'true',
      use_global: url.searchParams.get('use_global') === 'true',
      impact_type: url.searchParams.get('dimension') as 'water',
    }),
    ...(metric === 'green-score' && {
      aggregate: url.searchParams.get('aggregate') === 'true',
      use_global: url.searchParams.get('use_global') === 'true',
    }),
  };

  try {
    const data = await fetcher(params);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `Error fetching ${metric} data` },
      { status: 500 },
    );
  }
}
