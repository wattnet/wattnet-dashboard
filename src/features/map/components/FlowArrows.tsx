"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, Feature } from "geojson";
import { ZoneImports, ImportSeries } from "@/src/features/map/types/imports";
import { computeZoneCentroids } from "@/src/features/map/utils/zoneCentroids";
import { decomposeTimeIndex } from "@/src/shared/utils/dateManager";
import { ProcessedFootprint } from "@/src/features/map/types/footprints";
import { ScaleConfig } from "@/src/features/map/hooks/useMapScales";
import { useAppTheme } from "@/src/core/theme/ThemeContext";
import { useMapControls, useFlowTracing } from "@/src/features/dashboard/store/useDashboardStore";
import zoneCrossingsJson from "@/src/features/map/data/zoneCrossings.json";

const ARROW_LEN_BASE = 30;
const SHAFT_W_BASE = 5;
const HEAD_LEN_BASE = 13;
const HEAD_W_BASE = 15;

function arrowScale(zoom: number): number {
  return Math.max(0.5, (zoom - 2) * 0.35);
}

// ── Color interpolation ────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, "").slice(0, 6);
  const n = parseInt(clean, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function interpolateZoneColor(
  value: number,
  mapValues: number[],
  colors: string[],
): string {
  if (value <= mapValues[0]) return colors[0];
  if (value >= mapValues[mapValues.length - 1]) return colors[colors.length - 1];
  for (let i = 0; i < mapValues.length - 1; i++) {
    if (value >= mapValues[i] && value <= mapValues[i + 1]) {
      const t = (value - mapValues[i]) / (mapValues[i + 1] - mapValues[i]);
      return lerpColor(colors[i], colors[i + 1], t);
    }
  }
  return colors[0];
}

function lightenArrowColor(color: string): string {
  if (color.startsWith("#")) return lerpColor(color, "#ffffff", 0.55);
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) {
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    return `rgb(${Math.round(r + (255 - r) * 0.55)},${Math.round(g + (255 - g) * 0.55)},${Math.round(b + (255 - b) * 0.55)})`;
  }
  return "rgba(255,255,255,0.85)";
}

// ── Border crossing (point-in-polygon + binary search) ────────────────────
function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function pointInFeature(feature: Feature, point: [number, number]): boolean {
  const g = feature.geometry;
  if (g.type === "Polygon") {
    const rings = g.coordinates as number[][][];
    if (!pointInRing(point, rings[0])) return false;
    for (let i = 1; i < rings.length; i++) if (pointInRing(point, rings[i])) return false;
    return true;
  }
  if (g.type === "MultiPolygon") {
    return (g.coordinates as number[][][][]).some((poly) => {
      if (!pointInRing(point, poly[0])) return false;
      for (let i = 1; i < poly.length; i++) if (pointInRing(point, poly[i])) return false;
      return true;
    });
  }
  return false;
}

function findBorderCrossing(
  c1: [number, number],
  c2: [number, number],
  srcFeature: Feature,
  iters = 18,
): [number, number] {
  if (!pointInFeature(srcFeature, c1)) {
    return [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2];
  }
  let lo = 0, hi = 1;
  for (let k = 0; k < iters; k++) {
    const mid = (lo + hi) / 2;
    const pt: [number, number] = [c1[0] + (c2[0] - c1[0]) * mid, c1[1] + (c2[1] - c1[1]) * mid];
    if (pointInFeature(srcFeature, pt)) lo = mid; else hi = mid;
  }
  const t = (lo + hi) / 2;
  return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t];
}

// ── Arrow geometry ─────────────────────────────────────────────────────────
interface ArrowGeometry {
  d: string;
  chevronPaths: string[];
  chevronStrokeW: number;
}

function makeChevronPath(
  cx: number, cy: number,
  angle: number,
  depth: number,
  span: number,
): string {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const pt = (lx: number, ly: number) =>
    `${(lx * cos - ly * sin + cx).toFixed(1)},${(lx * sin + ly * cos + cy).toFixed(1)}`;
  return `M ${pt(-depth / 2, -span / 2)} L ${pt(depth / 2, 0)} L ${pt(-depth / 2, span / 2)}`;
}

function makeArrowGeometry(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  scale: number,
  cx?: number,
  cy?: number,
): ArrowGeometry {
  const arrowLen = ARROW_LEN_BASE * scale;
  const shaftW = SHAFT_W_BASE * scale;
  const headLen = HEAD_LEN_BASE * scale;
  const headW = HEAD_W_BASE * scale;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = -sin;
  const py = cos;

  const mx = cx ?? (x1 + x2) / 2;
  const my = cy ?? (y1 + y2) / 2;

  const tailX = mx - cos * (arrowLen / 2);
  const tailY = my - sin * (arrowLen / 2);
  const tipX = mx + cos * (arrowLen / 2);
  const tipY = my + sin * (arrowLen / 2);
  const neckX = tipX - cos * headLen;
  const neckY = tipY - sin * headLen;

  const hw = shaftW / 2;
  const hbw = headW / 2;

  const pts: [number, number][] = [
    [tailX + px * hw, tailY + py * hw],
    [neckX + px * hw, neckY + py * hw],
    [neckX + px * hbw, neckY + py * hbw],
    [tipX, tipY],
    [neckX - px * hbw, neckY - py * hbw],
    [neckX - px * hw, neckY - py * hw],
    [tailX - px * hw, tailY - py * hw],
  ];

  const d = `M ${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")} Z`;

  // N chevrons evenly spaced across the full arrow length (tail → tip)
  // chSpan deliberately overshoots — the clipPath clips them to the arrow silhouette
  const N_CHEVRONS = 4;
  const shaftLen = arrowLen - headLen;
  const chDepth = Math.max(3, 5 * scale);
  const chSpan = Math.max(6, HEAD_W_BASE * scale);
  const chevronPaths: string[] = [];
  for (let k = 1; k <= N_CHEVRONS; k++) {
    const t = k / (N_CHEVRONS + 1);
    chevronPaths.push(
      makeChevronPath(
        tailX + cos * arrowLen * t,
        tailY + sin * arrowLen * t,
        angle, chDepth, chSpan,
      ),
    );
  }

  return {
    d,
    chevronPaths,
    chevronStrokeW: Math.max(2, 3 * scale),
  };
}

// ── Data helpers ───────────────────────────────────────────────────────────

// Mirrors processFootprints: flatMap all series, resolve conflicts by priority
// (best quality overwrites worst for the same timestamp).
function buildMergedImports(
  zoneImport: ZoneImports,
): Map<string, Map<number, number>> {
  const priority = (s: ImportSeries): number => {
    if (s.valid && s.zone_status === "complete") return 3;
    if (s.valid) return 2;
    if (s.zone_status === "preview") return 1;
    return 0;
  };
  // Worst first → best last → best overwrites in the Map
  const sorted = [...zoneImport.series].sort(
    (a, b) => priority(a) - priority(b),
  );

  const result = new Map<string, Map<number, number>>();
  for (const series of sorted) {
    for (const block of series.imports) {
      if (!result.has(block.source)) result.set(block.source, new Map());
      const tsMap = result.get(block.source)!;
      for (const [ts, val] of block.values) {
        tsMap.set(new Date(ts).getTime(), val);
      }
    }
  }
  return result;
}

function lookupValue(
  tsMap: Map<number, number>,
  targetMs: number,
): number | null {
  const tolerance = 15 * 60 * 1000;
  let best: number | null = null;
  let bestDelta = Infinity;
  for (const [tsMs, val] of tsMap.entries()) {
    const delta = Math.abs(tsMs - targetMs);
    if (delta <= tolerance && delta < bestDelta) {
      bestDelta = delta;
      best = val;
    }
  }
  return best;
}

function slotToTimestampMs(startDate: Date, timeIndex: number): number {
  const { date, slotWithinDay } = decomposeTimeIndex(startDate, timeIndex);
  const hours = Math.floor(slotWithinDay / 4);
  const minutes = (slotWithinDay % 4) * 15;
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hours,
    minutes,
  );
}

function formatDatetime(startDate: Date, timeIndex: number): string {
  const { date, slotWithinDay } = decomposeTimeIndex(startDate, timeIndex);
  const hours = Math.floor(slotWithinDay / 4);
  const minutes = (slotWithinDay % 4) * 15;
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes),
  );
  const datePart = d.toLocaleDateString("en-GB", {
    timeZone: "UTC", day: "numeric", month: "short", year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-GB", {
    timeZone: "UTC", hour: "2-digit", minute: "2-digit",
  });
  return `${datePart} · ${timePart} UTC`;
}

interface ImportStatus {
  valid: boolean;
  zoneStatus: string;
  dataState: "official" | "estimated" | "missing";
  datasource: string;
  isForecast: boolean;
}

function getImportStatus(
  importsData: ZoneImports[],
  srcZone: string,
  destZone: string,
  targetMs: number,
): ImportStatus | null {
  const zoneImport = importsData.find((zi) => zi.zone === destZone);
  if (!zoneImport) return null;

  const priority = (s: ImportSeries): number => {
    if (s.valid && s.zone_status === "complete") return 3;
    if (s.valid) return 2;
    if (s.zone_status === "preview") return 1;
    return 0;
  };
  const sorted = [...zoneImport.series].sort((a, b) => priority(b) - priority(a));
  const tolerance = 15 * 60 * 1000;

  for (const series of sorted) {
    const block = series.imports.find((b) => b.source === srcZone);
    if (!block) continue;
    const hasValue = block.values.some(
      ([ts]) => Math.abs(new Date(ts).getTime() - targetMs) <= tolerance,
    );
    if (!hasValue) continue;
    return {
      valid: series.valid,
      zoneStatus: series.zone_status,
      dataState: block.data_state,
      datasource: block.datasource,
      isForecast: targetMs > Date.now(),
    };
  }
  return null;
}

function formatDatasource(raw: string): string {
  const colonIdx = raw.indexOf(":");
  const s = colonIdx === -1 ? raw : raw.slice(colonIdx + 1);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Chip({ label, color, dashed = false }: { label: string; color: string; dashed?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 9px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap" as const,
        fontFamily: '"Red Hat Text", system-ui, sans-serif',
        background: `color-mix(in srgb, ${color} 13%, transparent)`,
        border: `1px ${dashed ? "dashed" : "solid"} color-mix(in srgb, ${color} 35%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
interface ArrowItem {
  key: string;
  srcZone: string;
  destZone: string;
  srcName: string;
  destName: string;
  mw: number;
  d: string;
  chevronPaths: string[];
  chevronStrokeW: number;
  color: string;
  metricValue: number | null;
  // geographic coords for frame-by-frame DOM re-projection
  srcCentroid: [number, number];
  destCentroid: [number, number];
  crossing: [number, number];
}

// Minimal data stored in a ref for direct DOM updates (avoids React re-renders on pan/zoom)
interface ArrowDOMItem {
  idx: number;
  srcCentroid: [number, number];
  destCentroid: [number, number];
  crossing: [number, number];
  numChevrons: number;
}

interface TooltipState {
  x: number;
  y: number;
  srcZone: string;
  destZone: string;
}

export interface FlowArrowsProps {
  mapRef: React.RefObject<MapLibreMap | null>;
  importsData: ZoneImports[];
  selectedTimeIndex: number;
  startDate: Date;
  processedData: ProcessedFootprint[];
  legendConfig: ScaleConfig;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function FlowArrows({
  mapRef,
  importsData,
  selectedTimeIndex,
  startDate,
  processedData,
  legendConfig,
}: FlowArrowsProps) {
  const { currentPalette } = useAppTheme();
  const { scope } = useMapControls();
  const { flowTracing } = useFlowTracing();
  const geoJSONRef = useRef<FeatureCollection | null>(null);
  const [geoJSONLoaded, setGeoJSONLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const arrowDOMRef = useRef<ArrowDOMItem[]>([]);

  useEffect(() => {
    const container = mapRef.current?.getContainer();
    if (container) setMapContainer(container);

    const styleId = "wn-flow-popup-z";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = ".maplibregl-popup { z-index: 10 !important; }";
      document.head.appendChild(s);
    }
    return () => {
      document.getElementById(styleId)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/maps/wattnet.geojson")
      .then((r) => r.json())
      .then((d) => {
        geoJSONRef.current = d;
        setGeoJSONLoaded(true);
      });
  }, []);

  // Sync DOM arrow positions directly on every map render frame — no React re-render
  useEffect((): (() => void) | void => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const svg = svgRef.current;
      if (!svg || arrowDOMRef.current.length === 0) return;
      const scale = arrowScale(map.getZoom());
      for (const { idx, srcCentroid, destCentroid, crossing, numChevrons } of arrowDOMRef.current) {
        const p1 = map.project(srcCentroid);
        const p2 = map.project(destCentroid);
        const pX = map.project(crossing);
        const { d, chevronPaths, chevronStrokeW } = makeArrowGeometry(
          p1.x, p1.y, p2.x, p2.y, scale, pX.x, pX.y,
        );
        (svg.getElementById(`wn-clip-${idx}`) as SVGPathElement | null)?.setAttribute("d", d);
        (svg.getElementById(`wn-body-${idx}`) as SVGPathElement | null)?.setAttribute("d", d);
        (svg.getElementById(`wn-iglow-${idx}`) as SVGPathElement | null)?.setAttribute("d", d);
        for (let ci = 0; ci < numChevrons; ci++) {
          const cp = chevronPaths[ci] ?? "";
          const g = svg.getElementById(`wn-chev-g-${idx}-${ci}`) as SVGPathElement | null;
          const s = svg.getElementById(`wn-chev-s-${idx}-${ci}`) as SVGPathElement | null;
          if (g) { g.setAttribute("d", cp); g.setAttribute("stroke-width", String(chevronStrokeW * 2.5)); }
          if (s) { s.setAttribute("d", cp); s.setAttribute("stroke-width", String(chevronStrokeW)); }
        }
      }
    };
    map.on("render", update);
    return () => map.off("render", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const borderCrossingsRef = useRef<Map<string, [number, number]>>(new Map());

  const { centroids, zoneNames, zoneFeatures } = useMemo(() => {
    if (!geoJSONRef.current) return { centroids: {}, zoneNames: {}, zoneFeatures: {} };
    borderCrossingsRef.current.clear();
    const c = computeZoneCentroids(geoJSONRef.current);
    const names: Record<string, string> = {};
    const features: Record<string, Feature> = {};
    for (const f of geoJSONRef.current.features) {
      const { zoneName, countryName } = (f.properties ?? {}) as {
        zoneName?: string;
        countryName?: string;
      };
      if (zoneName) {
        names[zoneName] = countryName ?? zoneName;
        features[zoneName] = f;
      }
    }
    return { centroids: c, zoneNames: names, zoneFeatures: features };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoJSONLoaded]);

  const arrows = useMemo((): ArrowItem[] => {
    const map = mapRef.current;
    if (!map || importsData.length === 0 || Object.keys(centroids).length === 0)
      return [];

    const targetMs = slotToTimestampMs(startDate, selectedTimeIndex);
    const scale = arrowScale(map.getZoom());
    const result: ArrowItem[] = [];
    const seen = new Set<string>();

    for (const zoneImport of importsData) {
      const destZone = zoneImport.zone;
      const mergedImports = buildMergedImports(zoneImport);

      for (const [srcZone, tsMap] of mergedImports.entries()) {
        const pairKey = [destZone, srcZone].sort().join(":");
        if (seen.has(pairKey)) continue;

        const value = lookupValue(tsMap, targetMs);
        if (value === null || value <= 0) continue;

        seen.add(pairKey);

        const srcCentroid = centroids[srcZone];
        const destCentroid = centroids[destZone];
        if (!srcCentroid || !destCentroid) continue;

        const p1 = map.project(srcCentroid as [number, number]);
        const p2 = map.project(destCentroid as [number, number]);

        const srcFp = processedData.find((d) => d.zone === srcZone);
        const metricValue = srcFp?.series?.[selectedTimeIndex]?.value ?? null;

        const color =
          metricValue !== null
            ? interpolateZoneColor(
                metricValue,
                legendConfig.stops.mapValues,
                legendConfig.stops.colors,
              )
            : "rgba(255,255,255,0.75)";

        // Crossing lookup: static JSON first (run scripts/compute-zone-crossings.mjs),
        // then runtime binary-search fallback cached in borderCrossingsRef.
        const [zA, zB] = [srcZone, destZone].sort();
        const crossKey = `${zA}:${zB}`;
        const staticPt = (zoneCrossingsJson as unknown as Record<string, [number, number]>)[crossKey];
        let crossingGeo: [number, number];
        if (staticPt) {
          crossingGeo = staticPt;
        } else {
          let cached = borderCrossingsRef.current.get(crossKey);
          if (!cached) {
            const cA = centroids[zA] as [number, number];
            const cB = centroids[zB] as [number, number];
            const fA = zoneFeatures[zA];
            const fB = zoneFeatures[zB];
            const cAB = fA ? findBorderCrossing(cA, cB, fA) : null;
            const cBA = fB ? findBorderCrossing(cB, cA, fB) : null;
            if (cAB && cBA) {
              cached = [(cAB[0] + cBA[0]) / 2, (cAB[1] + cBA[1]) / 2];
            } else {
              cached = cAB ?? cBA ?? [(cA[0] + cB[0]) / 2, (cA[1] + cB[1]) / 2];
            }
            borderCrossingsRef.current.set(crossKey, cached);
          }
          crossingGeo = cached;
        }
        const pCross = map.project(crossingGeo);

        const { d, chevronPaths, chevronStrokeW } = makeArrowGeometry(
          p1.x, p1.y, p2.x, p2.y, scale, pCross.x, pCross.y,
        );

        result.push({
          key: `${srcZone}->${destZone}`,
          srcZone,
          destZone,
          srcName: zoneNames[srcZone] ?? srcZone,
          destName: zoneNames[destZone] ?? destZone,
          mw: value,
          d,
          chevronPaths,
          chevronStrokeW,
          color,
          metricValue,
          srcCentroid: srcCentroid as [number, number],
          destCentroid: destCentroid as [number, number],
          crossing: crossingGeo,
        });
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importsData, selectedTimeIndex, startDate, centroids, zoneNames, zoneFeatures, processedData, legendConfig]);

  if (!mapContainer) return null;

  // Keep arrowDOMRef in sync with arrows for the map.on('render') handler
  arrowDOMRef.current = arrows.map((a, i) => ({
    idx: i,
    srcCentroid: a.srcCentroid,
    destCentroid: a.destCentroid,
    crossing: a.crossing,
    numChevrons: a.chevronPaths.length,
  }));

  const svgEl = (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 2,
      }}
    >
      <defs>
        {/* Inner glow: blur then composite "in" to keep effect inside shape */}
        <filter id="wn-inner-glow" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="in" />
        </filter>
        {/* Chevron glow: soft halo behind each chevron stroke */}
        <filter id="wn-chev-glow" x="-80%" y="-80%" width="260%" height="260%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {arrows.map((arrow, i) => (
          <clipPath key={`clip-${arrow.key}`} id={`wn-arrow-clip-${i}`}>
            <path id={`wn-clip-${i}`} d={arrow.d} />
          </clipPath>
        ))}
      </defs>

      {arrows.map((arrow, i) => {
        const phaseOffset = ((i * 0.45) % 2.5).toFixed(2);
        return (
          <g
            key={arrow.key}
            style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))" }}
          >
            {/* Arrow body */}
            <path
              id={`wn-body-${i}`}
              d={arrow.d}
              fill={arrow.color}
              stroke="rgba(0,0,0,0.55)"
              strokeWidth={1.2}
              strokeLinejoin="round"
              style={{ pointerEvents: "auto", cursor: "default" }}
              onMouseEnter={(e) =>
                setTooltip({ x: e.clientX, y: e.clientY, srcZone: arrow.srcZone, destZone: arrow.destZone })
              }
              onMouseMove={(e) =>
                setTooltip((prev) =>
                  prev ? { ...prev, x: e.clientX, y: e.clientY } : prev,
                )
              }
              onMouseLeave={() => setTooltip(null)}
            >
              <animate
                attributeName="opacity"
                values="0.85;1;0.85"
                dur="2.5s"
                repeatCount="indefinite"
                begin={`${phaseOffset}s`}
              />
            </path>

            {/* Inner glow */}
            <path
              id={`wn-iglow-${i}`}
              d={arrow.d}
              fill="rgba(255,255,255,0.22)"
              stroke="none"
              filter="url(#wn-inner-glow)"
              style={{ pointerEvents: "none" }}
            />

            {/* Chevron ripple — glow halo + sharp stroke, clipped to arrow */}
            {arrow.chevronPaths.map((chevPath, ci) => {
              const chColor = lightenArrowColor(arrow.color);
              return (
                <g
                  key={ci}
                  clipPath={`url(#wn-arrow-clip-${i})`}
                  style={{ pointerEvents: "none", filter: "drop-shadow(0px 1px 3px rgba(0,0,0,0.5))" }}
                >
                  <animate
                    attributeName="opacity"
                    values="0.08;0.88;0.08"
                    dur="1.4s"
                    begin={`${(parseFloat(phaseOffset) + ci * 0.28).toFixed(2)}s`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyTimes="0;0.5;1"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                  />
                  {/* glow halo */}
                  <path
                    id={`wn-chev-g-${i}-${ci}`}
                    d={chevPath}
                    fill="none"
                    stroke={chColor}
                    strokeWidth={arrow.chevronStrokeW * 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#wn-chev-glow)"
                    opacity={0.2}
                  />
                  {/* sharp stroke — lightened arrow color */}
                  <path
                    id={`wn-chev-s-${i}-${ci}`}
                    d={chevPath}
                    fill="none"
                    stroke={chColor}
                    strokeWidth={arrow.chevronStrokeW}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );

  // Look up arrow in both directions so the tooltip survives a direction flip
  const tooltipArrow = tooltip
    ? (arrows.find((a) => a.srcZone === tooltip.srcZone && a.destZone === tooltip.destZone)
        ?? arrows.find((a) => a.srcZone === tooltip.destZone && a.destZone === tooltip.srcZone)
        ?? null)
    : null;
  const tooltipStatus = tooltipArrow
    ? getImportStatus(
        importsData,
        tooltipArrow.srcZone,
        tooltipArrow.destZone,
        slotToTimestampMs(startDate, selectedTimeIndex),
      )
    : null;
  const tooltipDatetime = formatDatetime(startDate, selectedTimeIndex);
  const cc = currentPalette.chipColors;

  return (
    <>
      {createPortal(svgEl, mapContainer)}
      {tooltip && tooltipArrow && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 16,
            top: tooltip.y - 14,
            zIndex: 9999,
            pointerEvents: "none",
            fontFamily: '"Red Hat Text", system-ui, sans-serif',
            background: "color-mix(in srgb, var(--color-panel) 93%, transparent)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid color-mix(in srgb, var(--color-foreground) 10%, transparent)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            overflow: "hidden",
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {/* Left: main content */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "color-mix(in srgb, var(--color-foreground) 30%, transparent)", letterSpacing: "0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {tooltipDatetime}
            </div>

            {/* Zone names + animated connector
                ROW_H=22px, padding = ROW_H/2 - dot_r = 11-3 = 8px → exact center alignment */}
            <div style={{ display: "flex", gap: 10, margin: "2px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 10, paddingTop: 8, paddingBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
                <div style={{ flex: 1, width: 1.5, background: "color-mix(in srgb, var(--color-foreground) 18%, transparent)", margin: "3px 0" }} />
                {/* Two-chevron ripple: opacity wave flows top→bottom suggesting downward transfer */}
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1L4 4.5L7 1" stroke="color-mix(in srgb, var(--color-foreground) 32%, transparent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <animate attributeName="opacity" values="0.15;1;0.15" dur="1.2s" begin="0s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
                  </path>
                  <path d="M1 7L4 10.5L7 7" stroke="color-mix(in srgb, var(--color-foreground) 32%, transparent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <animate attributeName="opacity" values="0.15;1;0.15" dur="1.2s" begin="0.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
                  </path>
                </svg>
                <div style={{ flex: 1, width: 1.5, background: "color-mix(in srgb, var(--color-foreground) 18%, transparent)", margin: "3px 0" }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                <div style={{ height: 22, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", whiteSpace: "nowrap", lineHeight: 1 }}>{tooltipArrow.srcName}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "color-mix(in srgb, var(--color-foreground) 42%, transparent)", lineHeight: 1 }}>({tooltipArrow.srcZone})</span>
                </div>
                <div style={{ height: 22, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", whiteSpace: "nowrap", lineHeight: 1 }}>{tooltipArrow.destName}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "color-mix(in srgb, var(--color-foreground) 42%, transparent)", lineHeight: 1 }}>({tooltipArrow.destZone})</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {Math.round(tooltipArrow.mw).toLocaleString()}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500, color: "color-mix(in srgb, var(--color-foreground) 40%, transparent)", lineHeight: 1 }}>MW</span>
            </div>
            <div style={{ fontSize: 15, color: "color-mix(in srgb, var(--color-foreground) 50%, transparent)", lineHeight: 1 }}>Power exchange</div>

            {tooltipArrow.metricValue !== null && (
              <div style={{ fontSize: 14, color: "color-mix(in srgb, var(--color-foreground) 50%, transparent)", display: "flex", alignItems: "center", gap: 6, lineHeight: 1, marginTop: 12 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: tooltipArrow.color, border: "1px solid rgba(0,0,0,0.2)", flexShrink: 0 }} />
                with a{" "}
                <strong style={{ color: "color-mix(in srgb, var(--color-foreground) 85%, transparent)", fontVariantNumeric: "tabular-nums", fontSize: 15 }}>
                  {tooltipArrow.metricValue.toFixed(1)} {legendConfig.unit ?? ""}
                </strong>
                {" "}{legendConfig.title.toLowerCase()}
              </div>
            )}
          </div>

          {/* Right: pills column — top Energy 2×2, full-width divider, bottom Environmental 2-col */}
          <div style={{ borderLeft: "1px solid var(--color-border)", display: "flex", flexDirection: "column", minWidth: 156 }}>
            {tooltipStatus ? (
              <>
                {/* ENERGY — 2×2 grid, flex:1 pushes Environmental to bottom */}
                <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "color-mix(in srgb, var(--color-foreground) 28%, transparent)", textTransform: "uppercase" as const }}>Energy</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <Chip label={tooltipStatus.valid ? "Final" : "Not Final"} color={tooltipStatus.valid ? cc.final : cc.notFinal} />
                    {tooltipStatus.zoneStatus === "complete" && <Chip label="Complete" color={cc.complete} />}
                    {tooltipStatus.zoneStatus === "preview" && <Chip label="Preview" color={cc.preview} />}
                    {tooltipStatus.zoneStatus === "missing" && tooltipStatus.isForecast && <Chip label="Forecasted" color={cc.forecasted} dashed />}
                    {tooltipStatus.zoneStatus === "missing" && !tooltipStatus.isForecast && <Chip label="Missing" color={cc.missing} />}
                    {tooltipStatus.dataState === "official" && <Chip label="Official" color={cc.complete} />}
                    {tooltipStatus.dataState === "estimated" && <Chip label="Estimated" color={cc.preview} />}
                    {tooltipStatus.datasource && <Chip label={formatDatasource(tooltipStatus.datasource)} color={cc.neutral} />}
                  </div>
                </div>

                {/* Full-width divider */}
                <div style={{ height: 1, background: "var(--color-border)" }} />

                {/* ENVIRONMENTAL — same 2-col grid for aligned columns */}
                <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "color-mix(in srgb, var(--color-foreground) 28%, transparent)", textTransform: "uppercase" as const }}>Environmental</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <Chip label={flowTracing ? "Global" : "Local"} color={flowTracing ? cc.global : cc.local} />
                    <Chip label={scope === "life-cycle" ? "Life-cycle" : "Operational"} color={scope === "life-cycle" ? cc.lifecycle : cc.operational} />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: "14px 12px" }}>
                <Chip label="No data" color={cc.missing} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
