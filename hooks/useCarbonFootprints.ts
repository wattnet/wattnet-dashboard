import useSWR from 'swr';
import { Footprint } from '@/types/footprints';
import { FootprintQueryParams } from '@/types/queryParams';
import { useEffect, useState } from 'react';

export function useCarbonFootprints(
  params: FootprintQueryParams,
  dateKey: string
) {
  const [ephemeralToken, setEphemeralToken] = useState<string | null>(null);

  const fetchToken = async () => {
    const res = await fetch('/api/core');
    const data = await res.json();
    setEphemeralToken(data.token);
    return data.token;
  };

  useEffect(() => {
    fetchToken();
  }, []);

  const swrKey = ephemeralToken
    ? `carbon-footprints-${dateKey}-${params.footprint_type}-${params.scope}`
    : null;

  const { data, error, isLoading } = useSWR<Footprint[]>(
    swrKey,
    async () => {
      if (!ephemeralToken) return [];

      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });

      const res = await fetch(`/api/carbon?${query.toString()}`, {
        headers: { 'x-dashboard-token': ephemeralToken },
      });

      // Refresh token and retry if unauthorized
      if (res.status === 401) {
        const newToken = await fetchToken();

        const retry = await fetch(`/api/carbon?${query.toString()}`, {
          headers: { 'x-dashboard-token': newToken },
        });

        return retry.json();
      }

      return res.json();
    },
    {
      keepPreviousData: true, // keep previous data while loading new
    }
  );

  return { data: data ?? [], loading: isLoading, error };
}
