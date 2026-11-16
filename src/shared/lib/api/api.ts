import { ApiQueryParams } from '@/src/shared/types/queryParams';
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

// The functions below throw when the API does not answer 200, and the routes turn that into a 502: an error
// is not shown as a map with no data.
async function fetchFromApi<T>(url: string, label: string): Promise<T> {
  const res = await authorizedFetch(url);

  if (!res.ok) throw new Error(`Error fetching ${label}: ${res.status}`);
  return res.json();
}

export const fetchFootprints = (params: ApiQueryParams) =>
  fetchFromApi<Footprint[]>(endpoints.footprints(params), 'footprints');

export const fetchImpacts = (params: ApiQueryParams) =>
  fetchFromApi<Footprint[]>(endpoints.impacts(params), 'impacts');

export const fetchEnvironmentalScore = (params: ApiQueryParams) =>
  fetchFromApi<Footprint[]>(
    endpoints.environmentalScore(params),
    'environmental-score',
  );

export const fetchImports = (params: ImportsQueryParams) =>
  fetchFromApi<ZoneImports[]>(endpoints.imports(params), 'imports');
