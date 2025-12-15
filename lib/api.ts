import { FootprintQueryParams } from '@/types/queryParams';
import { Footprint } from '@/types/footprints';
import { endpoints } from '@/lib/endpoints';
import { getAccessToken } from '@/lib/token';

export async function fetchCarbonFootprints(
  params: FootprintQueryParams
): Promise<Footprint[]> {
  try {
    const token = await getAccessToken();

    const url = endpoints.footprints(params);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error fetching carbon footprints: ${res.status}`);
    }

    const data: Footprint[] = await res.json();
    return data;
  } catch (err) {
    console.error('fetchCarbonFootprints error:', err);
    return [];
  }
}
