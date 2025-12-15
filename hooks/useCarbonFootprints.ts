import useSWR from 'swr';
import { Footprint } from '@/types/footprints';
import { FootprintQueryParams } from '@/types/queryParams';

export function useCarbonFootprints(
  params: FootprintQueryParams,
  dateKey: string
) {
  // Key formed by date + footprint_type + scope
  const swrKey = `carbon-footprints-${dateKey}-${params.footprint_type}-${params.scope}`;

  const { data, error, isLoading } = useSWR<Footprint[]>(
    swrKey,
    () => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
      return fetch(`/api/carbon?${query.toString()}`).then((res) => res.json());
    },
    {
      keepPreviousData: true, // keep previous data while loading new
    }
  );

  return { data: data ?? [], loading: isLoading, error };
}
