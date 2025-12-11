'use client';

import { Footprint } from '@/types/footprints';
import { FootprintQueryParams } from '@/types/queryParams';
import { useState, useEffect } from 'react';

export function useCarbonFootprints(params: FootprintQueryParams) {
  const [data, setData] = useState<Footprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loadData() {
      try {
        setLoading(true);

        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) query.append(key, String(value));
        });

        const res = await fetch(`/api/footprints?${query.toString()}`, {
          signal,
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const json = await res.json();

        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    return () => controller.abort();
  }, [params.start, params.end, JSON.stringify(params)]);

  return { data, loading, error };
}
