import { NextResponse } from 'next/server';
import { ApiQueryParams } from '@/src/shared/types/queryParams';
import {
  fetchFootprints,
  fetchImpacts,
  fetchEnvironmentalScore,
} from '@/src/shared/lib/api/api';
import { isValidToken } from '@/src/shared/lib/auth/ephemeralTokens';

const FETCHER_BY_METRIC: Record<
  string,
  (params: ApiQueryParams) => Promise<unknown>
> = {
  footprint: fetchFootprints,
  impact: fetchImpacts,
  'environmental-score': fetchEnvironmentalScore,
};

export async function GET(request: Request) {
  if (!isValidToken(request.headers.get('x-dashboard-token'))) {
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

  // Only what the API declares goes in here: the metric picks the endpoint and the dimension is sent as
  // footprint_type or impact_type. The environmental score has no carbon/water split.
  const params: ApiQueryParams = {
    scope: url.searchParams.get('scope') as 'life-cycle' | 'operational',
    start: url.searchParams.get('start') ?? new Date().toISOString(),
    end: url.searchParams.get('end') ?? new Date().toISOString(),
    // No zone means every zone, which the map needs: an empty string is left out when the URL is built.
    zone: url.searchParams.get('zone') ?? undefined,
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
    ...(metric === 'environmental-score' && {
      aggregate: url.searchParams.get('aggregate') === 'true',
      use_global: url.searchParams.get('use_global') === 'true',
    }),
  };

  try {
    const data = await fetcher(params);
    return NextResponse.json(data);
  } catch (err) {
    // The API of Wattnet refused or failed: say so (502), do not show it as an empty map.
    console.error(`/api/metrics ${metric}:`, err);
    return NextResponse.json(
      { error: `Error fetching ${metric} data` },
      { status: 502 },
    );
  }
}
