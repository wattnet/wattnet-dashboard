'use client';

import useSWR from 'swr';
import { Footprint } from '@/types/footprints';
import { FootprintQueryParams } from '@/types/queryParams';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCarbonFootprints(params: FootprintQueryParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.append(key, String(value));
  });

  const { data, error, isLoading } = useSWR<Footprint[]>(
    `/api/carbon?${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return { data: data ?? [], loading: isLoading, error };
}
