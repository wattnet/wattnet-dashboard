import useSWR from 'swr';
import { Footprint } from '@/src/types/footprints';
import { FootprintQueryParams } from '@/src/types/queryParams';
import { useEffect, useState } from 'react';

export function useMetricData(params: FootprintQueryParams, dateKey: string) {
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

  const dimensionPart =
    params.metric === 'green-score' ? '' : `-${params.dimension}`;

  const swrKey = ephemeralToken
    ? `${dateKey}.${params.metric}${dimensionPart}-${params.scope}-${params.use_global}`
    : null;

  const { data, error, isLoading } = useSWR<Footprint[]>(
    swrKey,
    async () => {
      if (!ephemeralToken) return [];

      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (key === 'dimension' && params.metric === 'green-score') return;
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

      return res.json();
    },
    { keepPreviousData: true },
  );

  return { data: data ?? [], loading: isLoading, error };
}
