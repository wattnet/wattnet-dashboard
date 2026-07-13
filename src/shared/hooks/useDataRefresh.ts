import { useEffect, useRef, useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { FootprintQueryParams } from '@/src/shared/types/queryParams';

const PROBE_RETRY_MS = 60_000; // 1 minute between retries when zone_status is "missing"
const QUARTER_INTERVAL_MS = 15 * 60_000; // 15 minutes
const PROBE_ZONE = 'AT';

/**
 * Returns the milliseconds until the next quarter-hour mark (:00, :15, :30, :45).
 */
function msUntilNextQuarter(): number {
  const now = new Date();
  const ms =
    now.getUTCMinutes() * 60_000 +
    now.getUTCSeconds() * 1_000 +
    now.getUTCMilliseconds();
  const nextQuarterMs =
    Math.ceil(ms / QUARTER_INTERVAL_MS) * QUARTER_INTERVAL_MS;
  return nextQuarterMs === ms ? QUARTER_INTERVAL_MS : nextQuarterMs - ms;
}

/**
 * Builds the SWR cache key.
 */
export function buildSwrKey(
  params: FootprintQueryParams,
  dateKey: string,
  ephemeralToken: string | null,
): string | null {
  if (!ephemeralToken) return null;
  const dimensionPart =
    params.metric === 'green-score' ? '' : `-${params.dimension}`;
  return `${dateKey}.${params.metric}${dimensionPart}-${params.scope}-${params.use_global}`;
}

interface UseDataRefreshOptions {
  /** Full query params used by useMetricData. */
  params: FootprintQueryParams;
  /** YYYY-MM-DD string matching the dateKey used in useMetricData. */
  dateKey: string;
  /** The ephemeral token currently held by useMetricData (pass the same ref/value). */
  ephemeralToken: string | null;
  /** Called when a fresh token is needed (re-use the same fetchToken from useMetricData). */
  fetchToken: () => Promise<string>;
  /**
   * Only run while the user is viewing today's data.
   * Pass false when the user has navigated to a past/future date.
   */
  enabled: boolean;
  /** Current slider index — used to detect whether the user is on the previous slot. */
  selectedTimeIndex: number;
  /** Advance the slider to the new slot, only if the user hasn't moved it away manually. */
  setSelectedTimeIndex: (index: number) => void;
  /** Start date of the selected range — needed to compute the flat slot index for multi-day ranges. */
  startDate: Date;
}

/**
 * Fires a lightweight single-zone probe (zone=AT) every quarter-hour.
 *
 * - zone_status "missing" on all series  → retry after 1 minute.
 * - zone_status "preview" or "complete"  → full SWR revalidation + slider advance
 *   (slider only advances if the user is currently on the immediately preceding slot).
 *
 * All timers are cleaned up on unmount or when `enabled` turns false.
 */
export function useDataRefresh({
  params,
  dateKey,
  ephemeralToken,
  fetchToken,
  enabled,
  selectedTimeIndex,
  setSelectedTimeIndex,
  startDate,
}: UseDataRefreshOptions) {
  const { mutate } = useSWRConfig();

  // Stable ref so timer callbacks always read the latest values without restarting timers
  const stateRef = useRef({
    params,
    dateKey,
    ephemeralToken,
    fetchToken,
    enabled,
    selectedTimeIndex,
    setSelectedTimeIndex,
    startDate,
  });
  useEffect(() => {
    stateRef.current = {
      params,
      dateKey,
      ephemeralToken,
      fetchToken,
      enabled,
      selectedTimeIndex,
      setSelectedTimeIndex,
      startDate,
    };
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProbingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Probes zone AT for the current 15-min slot only.
   * Returns "available" if any series is preview/complete, "missing" otherwise, null on fetch error.
   * Also returns the flat slot index that was actually probed, so the caller never advances
   * the slider to a slot whose readiness wasn't verified by this probe (e.g. if the probe
   * and subsequent revalidation take long enough to cross into the next quarter-hour).
   */
  const probe = useCallback(async (): Promise<{
    status: 'available' | 'missing' | null;
    slotIndex: number;
  }> => {
    const { params, ephemeralToken, fetchToken, startDate } = stateRef.current;

    let token = ephemeralToken;
    if (!token) token = await fetchToken();

    const probeParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      // Skip dimension for green-score (matches useMetricData behaviour)
      if (key === 'dimension' && params.metric === 'green-score') return;
      // Skip start/end — we'll set a tighter window below
      if (key === 'start' || key === 'end') return;
      if (value !== undefined) probeParams.append(key, String(value));
    });

    // Fix the zone to the canary zone AT so only one zone is returned
    probeParams.set('zone', PROBE_ZONE);

    // Narrow the time window to the current 15-min slot to minimise payload
    const now = new Date();
    const slotMinutes = Math.floor(now.getUTCMinutes() / 15) * 15;
    const slotStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        slotMinutes,
      ),
    );
    const slotEnd = new Date(slotStart.getTime() + QUARTER_INTERVAL_MS - 1);
    probeParams.set('start', slotStart.toISOString());
    probeParams.set('end', slotEnd.toISOString());

    // Flat slot index for the slot being probed — derived from slotStart (not a
    // fresh `new Date()`), so it always matches the window that was queried above.
    // `startDate` may carry a non-midnight time-of-day (e.g. it's `new Date()` at
    // mount, not normalized), so compare calendar days only — never raw epoch ms.
    const dayOffset = Math.floor(
      (Date.UTC(
        slotStart.getUTCFullYear(),
        slotStart.getUTCMonth(),
        slotStart.getUTCDate(),
      ) -
        Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth(),
          startDate.getUTCDate(),
        )) /
        86_400_000,
    );
    const slotIndex =
      dayOffset * 96 + slotStart.getUTCHours() * 4 + slotMinutes / 15;

    const doFetch = (t: string) =>
      fetch(`/api/metrics?${probeParams.toString()}`, {
        headers: { 'x-dashboard-token': t },
      });

    let res = await doFetch(token);
    if (res.status === 401) {
      token = await fetchToken();
      res = await doFetch(token);
    }

    if (!res.ok) return { status: null, slotIndex };

    const json = await res.json();
    const firstZone = Array.isArray(json) ? json[0] : null;
    if (!firstZone?.series?.length) return { status: 'missing', slotIndex };

    const hasData = firstZone.series.some(
      (s: { zone_status: string }) =>
        s.zone_status === 'complete' || s.zone_status === 'preview',
    );

    return { status: hasData ? 'available' : 'missing', slotIndex };
  }, []);

  /**
   * Core loop: probe → on missing retry in 1 min, on available mutate + advance slider + reschedule.
   */
  const runProbeAndSchedule = useCallback(async () => {
    if (!stateRef.current.enabled) return;
    if (isProbingRef.current) return;

    isProbingRef.current = true;
    const { status, slotIndex: newSlotIndex } = await probe();
    isProbingRef.current = false;

    // Bail if disabled while probe was in flight
    if (!stateRef.current.enabled) return;

    if (status === 'missing') {
      timerRef.current = setTimeout(runProbeAndSchedule, PROBE_RETRY_MS);
      return;
    }

    if (status === 'available') {
      const {
        params,
        dateKey,
        ephemeralToken,
        selectedTimeIndex,
        setSelectedTimeIndex,
      } = stateRef.current;

      // Revalidate footprints
      const swrKey = buildSwrKey(params, dateKey, ephemeralToken);
      if (swrKey) await mutate(swrKey);

      // ── Advance the slider only if the user is on the slot immediately preceding
      // the one that was just verified as available (never a slot re-derived from
      // wall-clock time after the awaits above, which could have drifted ahead) ──
      if (selectedTimeIndex === newSlotIndex - 1) {
        setSelectedTimeIndex(newSlotIndex);
      }
    }

    // Schedule the next probe at the following quarter-hour (whether available or error)
    timerRef.current = setTimeout(runProbeAndSchedule, msUntilNextQuarter());
  }, [probe, mutate]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      isProbingRef.current = false;
      return;
    }

    timerRef.current = setTimeout(runProbeAndSchedule, msUntilNextQuarter());

    return clearTimer;
  }, [enabled, runProbeAndSchedule, clearTimer]);
}
