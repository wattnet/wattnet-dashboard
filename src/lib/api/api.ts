import { FootprintQueryParams } from '@/src/types/queryParams';
import { Footprint } from '@/src/types/footprints';
import { endpoints } from '@/src/lib/api/endpoints';
import { getAccessToken } from '@/src/lib/auth/token';

async function fetchFromApi(url: string, label: string): Promise<Footprint[]> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

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
