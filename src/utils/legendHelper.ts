import { useMemo } from 'react';
import { ProcessedFootprint } from '@/src/types/footprints';
import { COLORS } from '../lib/theme/colors';

// ---------- types ----------

export interface ColorStop {
  value: number; // raw data value at this breakpoint
  color: string; // hex color
  percentile: number; // 0–100 — where this stop sits in the distribution
}

export interface ScaleResult {
  /** Sorted breakpoints derived from actual data quantiles */
  stops: ColorStop[];
  /** Assign a color to any raw value using the computed scale */
  getColor: (value: number | null | undefined) => string;
}

// ---------- helpers ----------

function extractValues(
  data: ProcessedFootprint[],
  timeIndex: number,
): number[] {
  const values: number[] = [];
  for (const fp of data) {
    const raw = fp.series?.[timeIndex]?.value;
    if (raw !== null && raw !== undefined && isFinite(raw)) {
      values.push(raw);
    }
  }
  return values;
}

function percentileOf(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (p <= 0) return sorted[0];
  if (p >= 1) return sorted[sorted.length - 1];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl_ = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl_.toString(16).padStart(2, '0')}`;
}

// ---------- core ----------

/**
 * Build a quantile-based color scale from a palette and dataset.
 *
 * Strategy:
 *   1. Sort all values and compute N quantile breakpoints (default 9, matching
 *      the 0–9 palette buckets).
 *   2. Each palette color is anchored to one quantile value, not to a fixed
 *      number. So if 90 % of values sit between 10–50, the first ~9 palette
 *      buckets all land within that range.
 *   3. getColor() does a binary-search over the breakpoints and lerps between
 *      adjacent colors, giving smooth transitions.
 */
export function buildQuantileScale(
  values: number[],
  palette: string[],
): ScaleResult {
  const n = palette.length;

  if (values.length === 0) {
    return {
      stops: [],
      getColor: () => COLORS.map.noData,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);

  const stops: ColorStop[] = palette.map((color, i) => {
    const p = i / (n - 1);
    return {
      value: percentileOf(sorted, p),
      color,
      percentile: Math.round(p * 100),
    };
  });

  function getColor(value: number | null | undefined): string {
    if (value === null || value === undefined || !isFinite(value)) {
      return COLORS.map.noData;
    }
    if (stops.length === 0) return COLORS.map.noData;

    // Below minimum → first color
    if (value <= stops[0].value) return stops[0].color;
    // Above maximum → last color
    if (value >= stops[stops.length - 1].value)
      return stops[stops.length - 1].color;

    let lo = 0;
    let hi = stops.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (stops[mid].value <= value) lo = mid;
      else hi = mid;
    }

    const from = stops[lo];
    const to = stops[hi];
    const range = to.value - from.value;
    const t = range === 0 ? 0 : clamp((value - from.value) / range, 0, 1);
    return lerpColor(from.color, to.color, t);
  }

  return { stops, getColor };
}

// ---------- hook ----------

interface UseColorScaleOptions {
  data: ProcessedFootprint[];
  timeIndex: number;
  palette: string[];
}

/**
 * React hook that recomputes the quantile scale whenever data, type, or
 * timeIndex changes. Memoized to avoid redundant sorts on unchanged inputs.
 */
export function useColorScale({
  data,
  timeIndex,
  palette,
}: UseColorScaleOptions): ScaleResult {
  return useMemo(() => {
    const values = extractValues(data, timeIndex);
    return buildQuantileScale(values, palette);
  }, [data, timeIndex, palette]);
}

// ---------- MapLibre expression builder ----------

export function buildMapExpression(
  stops: ColorStop[],
  property: string,
): unknown[] {
  if (stops.length === 0) return ['literal', COLORS.map.noData];

  const expr: unknown[] = [
    'step',
    ['coalesce', ['get', property], -1],
    COLORS.map.noData,
  ];

  for (const stop of stops) {
    expr.push(stop.value, stop.color);
  }

  return expr;
}
