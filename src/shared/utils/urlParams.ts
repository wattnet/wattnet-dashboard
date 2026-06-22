import type { ThemeMode } from "@/src/core/theme/ThemeContext";
import type { MetricKey, DimensionKey } from "@/src/features/map/hooks/useMapScales";

const MAP_BOUNDS = {
  lng: { min: -60, max: 82 },
  lat: { min: 0, max: 80 },
  zoom: { min: 3, max: 7 },
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function parseThemeParam(raw: string | null): ThemeMode | undefined {
  if (raw === "dark" || raw === "light" || raw === "colorblind") return raw;
  return undefined;
}

export function parsePlayParam(raw: string | null): boolean {
  return raw !== null;
}

const VALID_METRICS: MetricKey[] = ["footprint", "impact", "green-score"];
const VALID_DIMENSIONS: DimensionKey[] = ["carbon", "water"];
const VALID_SCOPES = ["life-cycle", "operational"] as const;

export interface ControlParams {
  metric?: MetricKey;
  dimension?: DimensionKey;
  scope?: string;
  flowTracing?: boolean;
}

export function parseControlParams(params: {
  metric: string | null;
  dimension: string | null;
  scope: string | null;
  flowTracing: string | null;
}): ControlParams {
  const result: ControlParams = {};
  if (VALID_METRICS.includes(params.metric as MetricKey))
    result.metric = params.metric as MetricKey;
  if (VALID_DIMENSIONS.includes(params.dimension as DimensionKey))
    result.dimension = params.dimension as DimensionKey;
  if (VALID_SCOPES.includes(params.scope as (typeof VALID_SCOPES)[number]))
    result.scope = params.scope!;
  if (params.flowTracing !== null)
    result.flowTracing = params.flowTracing !== "false";
  return result;
}

export function parseMapParams(params: {
  lat: string | null;
  lng: string | null;
  zoom: string | null;
}): { initialCenter?: [number, number]; initialZoom?: number } {
  const result: { initialCenter?: [number, number]; initialZoom?: number } = {};

  const lat = parseFloat(params.lat ?? "");
  const lng = parseFloat(params.lng ?? "");
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    result.initialCenter = [
      clamp(lng, MAP_BOUNDS.lng.min, MAP_BOUNDS.lng.max),
      clamp(lat, MAP_BOUNDS.lat.min, MAP_BOUNDS.lat.max),
    ];
  }

  const zoom = parseFloat(params.zoom ?? "");
  if (Number.isFinite(zoom)) {
    result.initialZoom = clamp(zoom, MAP_BOUNDS.zoom.min, MAP_BOUNDS.zoom.max);
  }

  return result;
}
