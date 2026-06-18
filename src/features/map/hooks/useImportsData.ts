import useSWR from "swr";
import { ZoneImports } from "@/src/features/map/types/imports";

export function useImportsData(
  params: { start: string; end: string },
  dateKey: string,
  ephemeralToken: string | null,
) {
  // Include the token value in the key so that when useMetricData refreshes
  // the token (after a 401), this hook automatically re-fetches with the new one.
  const swrKey = ephemeralToken
    ? `${dateKey}.imports.${ephemeralToken}`
    : null;

  const { data, error, isLoading } = useSWR<ZoneImports[]>(
    swrKey,
    async () => {
      if (!ephemeralToken) return [];

      const query = new URLSearchParams({
        start: params.start,
        end: params.end,
      });

      const res = await fetch(`/api/imports?${query.toString()}`, {
        headers: { "x-dashboard-token": ephemeralToken },
      });

      // Do NOT retry on 401 — regenerating a token here would race with the
      // metrics hook and invalidate its in-flight request.
      if (!res.ok) return [];

      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
    { keepPreviousData: true },
  );

  return {
    data: data ?? [],
    loading: isLoading,
    error,
  };
}
