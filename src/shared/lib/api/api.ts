import { FootprintQueryParams } from '@/src/shared/types/queryParams';
import { Footprint } from '@/src/features/map/types/footprints';
import { ZoneImports, ImportsQueryParams } from '@/src/features/map/types/imports';
import { endpoints } from '@/src/shared/lib/api/endpoints';
import {
  getAccessToken,
  invalidateAccessToken,
} from '@/src/shared/lib/auth/token';

// A 401 means the cached token was rejected: get a new one and retry once.
async function authorizedFetch(url: string): Promise<Response> {
  const send = async () =>
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    });

  const res = await send();
  if (res.status !== 401) return res;
  invalidateAccessToken();
  return send();
}

async function fetchFromApi(url: string, label: string): Promise<Footprint[]> {
  const res = await authorizedFetch(url);

  if (!res.ok) throw new Error(`Error fetching ${label}: ${res.status}`);
  return res.json();
}

export async function fetchFootprints(
  params: FootprintQueryParams,
): Promise<Footprint[]> {
  try {
    return await fetchFromApi(endpoints.footprints(params), 'footprints');
  } catch (err) {
    console.error('fetchFootprints error:', err);
    return [];
  }
}

export async function fetchImpacts(
  params: FootprintQueryParams,
): Promise<Footprint[]> {
  try {
    return await fetchFromApi(endpoints.impacts(params), 'impacts');
  } catch (err) {
    console.error('fetchImpacts error:', err);
    return [];
  }
}

export async function fetchGreenScore(
  params: FootprintQueryParams,
): Promise<Footprint[]> {
  try {
    return await fetchFromApi(endpoints.greenScore(params), 'green-score');
  } catch (err) {
    console.error('fetchGreenScore error:', err);
    return [];
  }
}

export async function fetchImports(
  params: ImportsQueryParams,
): Promise<ZoneImports[]> {
  try {
    const res = await authorizedFetch(endpoints.imports(params));
    if (!res.ok) throw new Error(`Error fetching imports: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('fetchImports error:', err);
    return [];
  }
}
