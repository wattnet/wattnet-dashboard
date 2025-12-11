import { FootprintQueryParams } from '@/types/queryParams';
import { endpoints } from './endpoints';
import { Footprint } from '@/types/footprints';

export async function fetchCarbonFootprints(
  params: FootprintQueryParams
): Promise<Footprint[]> {
  const TOKEN = process.env.API_TOKEN;
  if (!TOKEN) throw new Error('Falta API_TOKEN en las variables de entorno');

  const url = endpoints.footprints(params);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error fetching carbon footprints: ${res.status}`);
    }

    const data: Footprint[] = await res.json();
    return data;
  } catch (error) {
    console.error('fetchCarbonFootprints error:', error);
    return [];
  }
}
