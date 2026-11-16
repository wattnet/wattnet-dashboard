import useSWR from 'swr';
import { Footprint } from '@/src/features/map/types/footprints';
import { FootprintQueryParams } from '@/src/shared/types/queryParams';
import { useEffect, useState, useCallback } from 'react';
import { buildSwrKey } from '@/src/shared/hooks/useDataRefresh';

export function useMetricData(params: FootprintQueryParams, dateKey: string) {
  const [ephemeralToken, setEphemeralToken] = useState<string | null>(null);

  const fetchToken = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/core');
    const data = await res.json();
    setEphemeralToken(data.token);
    return data.token;
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const swrKey = buildSwrKey(params, dateKey, ephemeralToken);

  const { data, error, isLoading } = useSWR<Footprint[]>(
    swrKey,
    async () => {
      if (!ephemeralToken) return [];

      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'dimension' && params.metric === 'environmental-score') return;
        if (value !== undefined) query.append(key, String(value));
      });

      const fetchWithToken = (token: string) =>
        fetch(`/api/metrics?${query.toString()}`, {
          headers: { 'x-dashboard-token': token },
        });

      let res = await fetchWithToken(ephemeralToken);

      if (res.status === 401) {
        const newToken = await fetchToken();
        res = await fetchWithToken(newToken);
      }

      // An error is shown by the page (and the previous data is kept), not taken for the data.
      if (!res.ok) throw new Error(`Error ${res.status} fetching ${params.metric}`);
      return res.json();
    },
    { keepPreviousData: true },
  );

  return {
    data: data ?? [],
    loading: isLoading,
    error,
    // Exposed for useDataRefresh
    ephemeralToken,
    fetchToken,
  };
}
