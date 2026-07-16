"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import { ZoneImports, ImportSeries } from "@/src/features/map/types/imports";
import { computeZoneCentroids } from "@/src/features/map/utils/zoneCentroids";
import { slotToTimestampMs } from "@/src/shared/utils/dateManager";
import { ProcessedFootprint } from "@/src/features/map/types/footprints";
import { ScaleConfig } from "@/src/features/map/hooks/useMapScales";
import { useAppTheme } from "@/src/core/theme/ThemeContext";
import {
  useMapControls,
  useFlowTracing,
  useFlowPanel,
  FlowPanelData,
} from "@/src/features/dashboard/store/useDashboardStore";
import { formatDatasource } from "@/src/shared/utils/datasource";
import zoneCrossingsJson from "@/src/features/map/data/zoneCrossings.json";

const ARROW_LEN_BASE = 30;
const SHAFT_W_BASE = 5;
const HEAD_LEN_BASE = 13;
const HEAD_W_BASE = 15;
const N_CHEVRONS = 4;

function arrowScale(zoom: number): number {
  return Math.max(0.5, (zoom - 2) * 0.35);
}

// ── Color interpolation ────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  if (hex.startsWith("rgb")) {
    const m = hex.match(/\d+/g)!;
    return [+m[0], +m[1], +m[2]];
  }
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
  if (value >= mapValues[mapValues.length - 1])
    return colors[colors.length - 1];
  for (let i = 0; i < mapValues.length - 1; i++) {
    if (value >= mapValues[i] && value <= mapValues[i + 1]) {
      const t = (value - mapValues[i]) / (mapValues[i + 1] - mapValues[i]);
      return lerpColor(colors[i], colors[i + 1], t);
    }
  }
  return colors[0];
}

function lightenArrowColor(color: string): string {
  return lerpColor(color, "#ffffff", 0.55);
}

// ── Arrow geometry ─────────────────────────────────────────────────────────
interface ArrowGeometry {
  d: string;
  chevronPaths: string[];
  chevronStrokeW: number;
}

function makeChevronPath(
  cx: number,
  cy: number,
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

  const chDepth = Math.max(3, shaftW * 1.2);
  const chSpan = Math.max(6, headW);
  const tStart = 0.1;
  const tEnd = 0.75;
  const chevronPaths: string[] = [];
  for (let k = 1; k <= N_CHEVRONS; k++) {
    const t = tStart + ((k - 1) * (tEnd - tStart)) / (N_CHEVRONS - 1);
    chevronPaths.push(
      makeChevronPath(
        tailX + cos * arrowLen * t,
        tailY + sin * arrowLen * t,
        angle,
        chDepth,
        chSpan,
      ),
    );
  }

  return {
    d,
    chevronPaths,
    chevronStrokeW: Math.max(2, 3 * scale),
  };
}

function makeGhostArrowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  scale: number,
  cx: number,
  cy: number,
): string {
  const arrowLen = ARROW_LEN_BASE * scale * 1.05;
  const headLen = HEAD_LEN_BASE * scale * 0.85;
  const headW = HEAD_W_BASE * scale * 0.85;
  const shaftW = SHAFT_W_BASE * scale;

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const px = -sin,
    py = cos;
  const hw = shaftW / 2,
    hbw = headW / 2;

  const tip1X = cx + cos * (arrowLen / 2),
    tip1Y = cy + sin * (arrowLen / 2);
  const neck1X = tip1X - cos * headLen,
    neck1Y = tip1Y - sin * headLen;
  const tip2X = cx - cos * (arrowLen / 2),
    tip2Y = cy - sin * (arrowLen / 2);
  const neck2X = tip2X + cos * headLen,
    neck2Y = tip2Y + sin * headLen;

  const pts: [number, number][] = [
    [tip1X, tip1Y],
    [neck1X + px * hbw, neck1Y + py * hbw],
    [neck1X + px * hw, neck1Y + py * hw],
    [neck2X + px * hw, neck2Y + py * hw],
    [neck2X + px * hbw, neck2Y + py * hbw],
    [tip2X, tip2Y],
    [neck2X - px * hbw, neck2Y - py * hbw],
    [neck2X - px * hw, neck2Y - py * hw],
    [neck1X - px * hw, neck1Y - py * hw],
    [neck1X - px * hbw, neck1Y - py * hbw],
  ];
  return `M ${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")} Z`;
}

// ── Data helpers ───────────────────────────────────────────────────────────

function importSeriesPriority(s: ImportSeries): number {
  if (s.valid && s.zone_status === "complete") return 3;
  if (s.valid) return 2;
  if (s.zone_status === "preview") return 1;
  return 0;
}

// Mirrors processFootprints: flatMap all series, resolve conflicts by priority
// (best quality overwrites worst for the same timestamp).
function buildMergedImports(
  zoneImport: ZoneImports,
): Map<string, Map<number, number>> {
  // Worst first → best last → best overwrites in the Map
  const sorted = [...zoneImport.series].sort(
    (a, b) => importSeriesPriority(a) - importSeriesPriority(b),
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
  const direct = tsMap.get(targetMs);
  if (direct !== undefined) return direct;
  // Fallback: tolerance window for slight timestamp misalignments
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

function formatDatetime(startDate: Date, timeIndex: number): string {
  const d = new Date(slotToTimestampMs(startDate, timeIndex));
  const datePart = d.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
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

  const sorted = [...zoneImport.series].sort(
    (a, b) => importSeriesPriority(b) - importSeriesPriority(a),
  );
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

function Chip({
  label,
  color,
  dashed = false,
}: {
  label: string;
  color: string;
  dashed?: boolean;
}) {
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
  color: string;
  metricValue: number | null;
  srcCentroid: [number, number];
  destCentroid: [number, number];
  crossing: [number, number];
}

// Cached element refs for direct DOM updates — avoids getElementById on every render frame
interface ArrowDOMItem {
  srcCentroid: [number, number];
  destCentroid: [number, number];
  crossing: [number, number];
  clipEl: SVGPathElement | null;
  bodyEl: SVGPathElement | null;
  iglowEl: SVGPathElement | null;
  hitEl: SVGPathElement | null;
  chevGEls: (SVGPathElement | null)[];
  chevSEls: (SVGPathElement | null)[];
}

interface GhostArrowItem {
  key: string;
  zoneA: string;
  zoneB: string;
  nameA: string;
  nameB: string;
  srcCentroid: [number, number];
  destCentroid: [number, number];
  crossing: [number, number];
}

interface GhostDOMItem {
  srcCentroid: [number, number];
  destCentroid: [number, number];
  crossing: [number, number];
  pathEl: SVGPathElement | null;
  hitEl: SVGPathElement | null;
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
  geoJSON?: FeatureCollection | null;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function FlowArrows({
  mapRef,
  importsData,
  selectedTimeIndex,
  startDate,
  processedData,
  legendConfig,
  geoJSON: geoJSONProp,
}: FlowArrowsProps) {
  const { currentPalette } = useAppTheme();
  const { scope } = useMapControls();
  const { flowTracing } = useFlowTracing();
  const { flowPanelOpen, openFlowPanel, updateFlowPanelData } = useFlowPanel();
  const lastFlowClickRef = useRef<{
    srcZone: string;
    destZone: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const geoJSONRef = useRef<FeatureCollection | null>(null);
  const [geoJSONLoaded, setGeoJSONLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const arrowDOMRef = useRef<ArrowDOMItem[]>([]);
  const ghostDOMRef = useRef<GhostDOMItem[]>([]);
  const [ghostTooltip, setGhostTooltip] = useState<{
    x: number;
    y: number;
    zoneA: string;
    zoneB: string;
    nameA: string;
    nameB: string;
  } | null>(null);
  const tooltipElRef = useRef<HTMLDivElement>(null);
  const tooltipSizeRef = useRef<{ w: number; h: number } | null>(null);
  // Stable animation delays keyed by `${arrow.key}:body` / `${arrow.key}:${ci}`.
  // Computed once on first appearance and never updated, so re-renders (slider
  // ticks, color changes) don't touch animation-delay in the DOM and the
  // browser never restarts the animation mid-playback.
  const animDelayRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Hover tooltips are mouse-only. Blocking the handlers above (rather than just
  // ignoring their output) already stops them from ever loading on mobile — this
  // only clears anything left over from crossing the breakpoint while one was open.
  useEffect(() => {
    if (!isMobile) return;
    setTooltip(null);
    setGhostTooltip(null);
  }, [isMobile]);

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
    if (geoJSONProp) {
      geoJSONRef.current = geoJSONProp;
      setGeoJSONLoaded(true);
      return;
    }
    const controller = new AbortController();
    fetch("/maps/wattnet.geojson", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        geoJSONRef.current = d;
        setGeoJSONLoaded(true);
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          console.error("Failed to load zone GeoJSON:", err);
      });
    return () => controller.abort();
  }, [geoJSONProp]);

  // Sync DOM arrow positions directly on every map render frame — no React re-render, no getElementById
  useEffect((): (() => void) | void => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      const items = arrowDOMRef.current;
      const ghosts = ghostDOMRef.current;
      if (items.length === 0 && ghosts.length === 0) return;
      const scale = arrowScale(map.getZoom());
      const shaftW = SHAFT_W_BASE * scale;
      const sStr = String(Math.max(1, shaftW * 0.55));
      const swStr = String(Math.max(2, shaftW * 0.55 + 1.8));
      for (const {
        srcCentroid,
        destCentroid,
        crossing,
        clipEl,
        bodyEl,
        iglowEl,
        hitEl,
        chevGEls,
        chevSEls,
      } of items) {
        const p1 = map.project(srcCentroid);
        const p2 = map.project(destCentroid);
        const pX = map.project(crossing);
        const { d, chevronPaths } = makeArrowGeometry(
          p1.x,
          p1.y,
          p2.x,
          p2.y,
          scale,
          pX.x,
          pX.y,
        );
        clipEl?.setAttribute("d", d);
        bodyEl?.setAttribute("d", d);
        iglowEl?.setAttribute("d", d);
        hitEl?.setAttribute("d", d);
        for (let ci = 0; ci < chevGEls.length; ci++) {
          const cp = chevronPaths[ci] ?? "";
          const g = chevGEls[ci];
          const s = chevSEls[ci];
          if (g) {
            g.setAttribute("d", cp);
            g.setAttribute("stroke-width", swStr);
          }
          if (s) {
            s.setAttribute("d", cp);
            s.setAttribute("stroke-width", sStr);
          }
        }
      }
      if (ghosts.length > 0) {
        for (const {
          srcCentroid,
          destCentroid,
          crossing,
          pathEl,
          hitEl,
        } of ghosts) {
          const p1 = map.project(srcCentroid);
          const p2 = map.project(destCentroid);
          const pX = map.project(crossing);
          const d = makeGhostArrowPath(
            p1.x,
            p1.y,
            p2.x,
            p2.y,
            scale,
            pX.x,
            pX.y,
          );
          pathEl?.setAttribute("d", d);
          hitEl?.setAttribute("d", d);
        }
      }
    };
    map.on("render", update);
    return () => map.off("render", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wheel events from hit paths bubble through the SVG but not into MapLibre's
  // canvas container (they are siblings in the DOM). Re-dispatch to the canvas
  // so scroll-zoom keeps working while hovering over an arrow.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e: WheelEvent) => {
      const canvas = mapRef.current?.getCanvas();
      if (!canvas) return;
      canvas.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: e.cancelable,
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          deltaZ: e.deltaZ,
          deltaMode: e.deltaMode,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          clientX: e.clientX,
          clientY: e.clientY,
        }),
      );
    };
    svg.addEventListener("wheel", handler, { passive: true });
    return () => svg.removeEventListener("wheel", handler);
    // mapContainer gates when the SVG is actually in the DOM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContainer]);

  const { centroids, zoneNames } = useMemo(() => {
    const geojson = geoJSONProp ?? geoJSONRef.current;
    if (!geojson) return { centroids: {}, zoneNames: {} };
    const c = computeZoneCentroids(geojson);
    const names: Record<string, string> = {};
    for (const f of geojson.features) {
      const { zoneName, countryName } = (f.properties ?? {}) as {
        zoneName?: string;
        countryName?: string;
      };
      if (zoneName) names[zoneName] = countryName ?? zoneName;
    }
    return { centroids: c, zoneNames: names };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoJSONProp, geoJSONLoaded]);

  // Pre-merge series per zone — recomputed only when importsData changes, not on every tick
  const mergedImportsMap = useMemo(() => {
    const result = new Map<string, Map<string, Map<number, number>>>();
    for (const zoneImport of importsData) {
      result.set(zoneImport.zone, buildMergedImports(zoneImport));
    }
    return result;
  }, [importsData]);

  const arrows = useMemo((): ArrowItem[] => {
    if (importsData.length === 0 || Object.keys(centroids).length === 0)
      return [];

    const targetMs = slotToTimestampMs(startDate, selectedTimeIndex);
    const isForecastSlot = targetMs > Date.now();
    const result: ArrowItem[] = [];
    const seen = new Set<string>();
    const fpByZone = new Map(processedData.map((d) => [d.zone, d]));

    for (const zoneImport of importsData) {
      const destZone = zoneImport.zone;
      const mergedImports = mergedImportsMap.get(destZone);
      if (!mergedImports) continue;

      for (const [srcZone, tsMap] of mergedImports.entries()) {
        const pairKey = [destZone, srcZone].sort().join(":");
        if (seen.has(pairKey)) continue;

        // For forecast timestamps: no tolerance — exchange data doesn't exist yet
        const value = isForecastSlot
          ? (tsMap.get(targetMs) ?? null)
          : lookupValue(tsMap, targetMs);
        if (value === null || value <= 0) continue;

        seen.add(pairKey);

        const srcCentroid = centroids[srcZone];
        const destCentroid = centroids[destZone];
        if (!srcCentroid || !destCentroid) continue;

        const srcFp = fpByZone.get(srcZone);
        const metricValue = srcFp?.series?.[selectedTimeIndex]?.value ?? null;

        const color =
          metricValue !== null
            ? interpolateZoneColor(
                metricValue,
                legendConfig.stops.mapValues,
                legendConfig.stops.colors,
              )
            : "rgba(255,255,255,0.75)";

        const [zA, zB] = [srcZone, destZone].sort();
        const crossKey = `${zA}:${zB}`;
        const crossingGeo = (
          zoneCrossingsJson as unknown as Record<string, [number, number]>
        )[crossKey];
        if (!crossingGeo) {
          if (process.env.NODE_ENV === "development")
            console.warn(
              `[FlowArrows] No crossing for ${crossKey} — run: yarn crossings`,
            );
          continue;
        }

        result.push({
          key: `${srcZone}->${destZone}`,
          srcZone,
          destZone,
          srcName: zoneNames[srcZone] ?? srcZone,
          destName: zoneNames[destZone] ?? destZone,
          mw: value,
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
  }, [
    mergedImportsMap,
    importsData,
    selectedTimeIndex,
    startDate,
    centroids,
    zoneNames,
    processedData,
    legendConfig,
  ]);

  // Ghost pairs — all interconnectors known from importsData structure, regardless of current value
  const ghostPairs = useMemo((): GhostArrowItem[] => {
    if (importsData.length === 0 || Object.keys(centroids).length === 0)
      return [];
    const crossingsMap = zoneCrossingsJson as unknown as Record<
      string,
      [number, number]
    >;
    const seen = new Set<string>();
    const pairs: GhostArrowItem[] = [];
    for (const zoneImport of importsData) {
      const destZone = zoneImport.zone;
      const destCentroid = centroids[destZone];
      if (!destCentroid) continue;
      for (const series of zoneImport.series) {
        for (const block of series.imports) {
          const srcZone = block.source;
          const [zA, zB] = [srcZone, destZone].sort();
          const pairKey = `${zA}:${zB}`;
          if (seen.has(pairKey)) continue;
          const crossing = crossingsMap[pairKey];
          if (!crossing) continue;
          const srcCentroid = centroids[srcZone];
          if (!srcCentroid) continue;
          seen.add(pairKey);
          pairs.push({
            key: pairKey,
            zoneA: zA,
            zoneB: zB,
            nameA: zoneNames[zA] ?? zA,
            nameB: zoneNames[zB] ?? zB,
            srcCentroid: srcCentroid as [number, number],
            destCentroid: destCentroid as [number, number],
            crossing,
          });
        }
      }
    }
    return pairs;
  }, [importsData, centroids, zoneNames]);

  const showGhosts = arrows.length === 0 && ghostPairs.length > 0;

  const ghostDOMItems = useMemo(
    () =>
      ghostPairs.map((g) => ({
        ...g,
        pathEl: null as SVGPathElement | null,
        hitEl: null as SVGPathElement | null,
      })),
    [ghostPairs],
  );

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !showGhosts) {
      ghostDOMRef.current = [];
      setGhostTooltip(null);
      return;
    }
    ghostDOMRef.current = ghostDOMItems.map((item, i) => ({
      ...item,
      pathEl: svg.getElementById(`wn-ghost-${i}`) as SVGPathElement | null,
      hitEl: svg.getElementById(`wn-ghost-hit-${i}`) as SVGPathElement | null,
    }));
    mapRef.current?.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghostDOMItems, mapContainer, showGhosts]);

  // Look up arrow in both directions so the tooltip survives a direction flip
  const tooltipArrow = tooltip
    ? (arrows.find(
        (a) => a.srcZone === tooltip.srcZone && a.destZone === tooltip.destZone,
      ) ??
      arrows.find(
        (a) => a.srcZone === tooltip.destZone && a.destZone === tooltip.srcZone,
      ) ??
      null)
    : null;

  useLayoutEffect(() => {
    if (tooltipElRef.current) {
      const { width, height } = tooltipElRef.current.getBoundingClientRect();
      tooltipSizeRef.current = { w: width, h: height };
    }
  }, [tooltipArrow?.srcZone, tooltipArrow?.destZone]);

  // Build skeleton DOM items when arrows change; element refs are populated in useLayoutEffect below
  const arrowDOMItems = useMemo(
    () =>
      arrows.map((a) => ({
        srcCentroid: a.srcCentroid,
        destCentroid: a.destCentroid,
        crossing: a.crossing,
        clipEl: null as SVGPathElement | null,
        bodyEl: null as SVGPathElement | null,
        iglowEl: null as SVGPathElement | null,
        hitEl: null as SVGPathElement | null,
        chevGEls: Array<SVGPathElement | null>(N_CHEVRONS).fill(null),
        chevSEls: Array<SVGPathElement | null>(N_CHEVRONS).fill(null),
      })),
    [arrows],
  );

  // Collect element refs into arrowDOMRef after React paints so the render loop can use them directly.
  // mapContainer is included so this re-runs once the portal SVG is actually in the DOM — without it,
  // the first run (while mapContainer is still null and the SVG hasn't rendered yet) finds svgRef.current
  // null and exits early; if arrowDOMItems hasn't changed by the time the portal renders, the arrows stay
  // with d="" forever (the "cache makes arrows disappear" bug).
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const items = arrowDOMItems.map((item, i) => ({
      ...item,
      clipEl: svg.getElementById(`wn-clip-${i}`) as SVGPathElement | null,
      bodyEl: svg.getElementById(`wn-body-${i}`) as SVGPathElement | null,
      iglowEl: svg.getElementById(`wn-iglow-${i}`) as SVGPathElement | null,
      hitEl: svg.getElementById(`wn-hit-${i}`) as SVGPathElement | null,
      chevGEls: Array.from(
        { length: N_CHEVRONS },
        (_, ci) =>
          svg.getElementById(`wn-chev-g-${i}-${ci}`) as SVGPathElement | null,
      ),
      chevSEls: Array.from(
        { length: N_CHEVRONS },
        (_, ci) =>
          svg.getElementById(`wn-chev-s-${i}-${ci}`) as SVGPathElement | null,
      ),
    }));
    arrowDOMRef.current = items;
    mapRef.current?.triggerRepaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrowDOMItems, mapContainer]);

  // Memoized so mousemove re-renders don't re-sort/re-scan series data
  const tooltipStatus = useMemo(
    () =>
      tooltipArrow
        ? getImportStatus(
            importsData,
            tooltipArrow.srcZone,
            tooltipArrow.destZone,
            slotToTimestampMs(startDate, selectedTimeIndex),
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      tooltipArrow?.srcZone,
      tooltipArrow?.destZone,
      importsData,
      startDate,
      selectedTimeIndex,
    ],
  );

  // Rebuilds the mobile flow-panel payload for a given zone pair from the current
  // arrows/importsData snapshot — shared by the initial tap and the refresh effect
  // below, and is the single place that decides "has a value" vs "no data yet" so
  // the panel can flip between the two as time advances (e.g. in play mode) instead
  // of being two disconnected UIs that only differ in how they were opened.
  const buildFlowPanelData = useCallback(
    (srcZone: string, destZone: string): FlowPanelData | null => {
      const datetime = formatDatetime(startDate, selectedTimeIndex);

      const arrow =
        arrows.find(
          (a) => a.srcZone === srcZone && a.destZone === destZone,
        ) ??
        arrows.find(
          (a) => a.srcZone === destZone && a.destZone === srcZone,
        );

      if (arrow) {
        const targetMs = slotToTimestampMs(startDate, selectedTimeIndex);
        const status = getImportStatus(
          importsData,
          arrow.srcZone,
          arrow.destZone,
          targetMs,
        );

        return {
          srcZone: arrow.srcZone,
          destZone: arrow.destZone,
          srcName: arrow.srcName,
          destName: arrow.destName,
          mw: arrow.mw,
          color: arrow.color,
          metricValue: arrow.metricValue,
          metricUnit: legendConfig.unit ?? "",
          metricTitle: legendConfig.title,
          datetime,
          valid: status?.valid ?? false,
          zoneStatus: status?.zoneStatus ?? "",
          dataState: status?.dataState ?? "missing",
          datasource: status?.datasource ?? "",
          isForecast: status?.isForecast ?? false,
        };
      }

      // No value for this pair at the current slot. `ghostPairs` lists every known
      // interconnector (built from importsData's structure, not its values) regardless
      // of whether ghost arrows are currently rendered on the map, so it's a reliable
      // source of the zone names even when other pairs elsewhere still have data.
      const ghost = ghostPairs.find(
        (g) =>
          (g.zoneA === srcZone && g.zoneB === destZone) ||
          (g.zoneA === destZone && g.zoneB === srcZone),
      );
      if (ghost) {
        return {
          srcZone,
          destZone,
          srcName: zoneNames[srcZone] ?? srcZone,
          destName: zoneNames[destZone] ?? destZone,
          datetime,
          noData: true,
        };
      }

      return null;
    },
    [
      arrows,
      ghostPairs,
      zoneNames,
      importsData,
      startDate,
      selectedTimeIndex,
      legendConfig,
    ],
  );

  // Opens the mobile flow panel for a tapped pair and starts tracking it for the
  // refresh effect below. Shared by the real-arrow and ghost-arrow tap handlers.
  const openFlowPanelFor = useCallback(
    (srcZone: string, destZone: string) => {
      const data = buildFlowPanelData(srcZone, destZone);
      if (!data) return;
      lastFlowClickRef.current = { srcZone, destZone };
      openFlowPanel(data);
    },
    [buildFlowPanelData, openFlowPanel],
  );

  // Keep the open mobile flow panel in sync with fresh data — mirrors the zone
  // panel's refresh effect in useMapLayers.ts. Also handles the pair flipping
  // between "has a value" and "no data yet" (and back) as time advances, since
  // buildFlowPanelData is the single source of truth for that decision.
  useEffect(() => {
    if (!flowPanelOpen || !lastFlowClickRef.current) return;
    const { srcZone, destZone } = lastFlowClickRef.current;
    const data = buildFlowPanelData(srcZone, destZone);
    if (data) updateFlowPanelData(data);
  }, [flowPanelOpen, buildFlowPanelData, updateFlowPanelData]);

  if (!mapContainer) return null;

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
        filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.3))",
      }}
    >
      <defs>
        <style>{`
          @keyframes wn-body-pulse  { 0%,100% { opacity:.85 } 50% { opacity:1 } }
          @keyframes wn-chev-pulse  { 0%,100% { opacity:.08 } 50% { opacity:.88 } }
          @keyframes wn-ghost-pulse     { 0%,100% { opacity:.45 } 50% { opacity:1 } }
          .wn-body-pulse       { animation: wn-body-pulse     2.5s ease-in-out infinite; }
          .wn-chev-pulse       { animation: wn-chev-pulse     1.4s cubic-bezier(.4,0,.6,1) infinite; }
          .wn-ghost-pulse      { animation: wn-ghost-pulse    1.8s cubic-bezier(.4,0,.6,1) infinite; }
        `}</style>
        {/* Inner glow: blur then composite "in" to keep effect inside shape */}
        <filter
          id="wn-inner-glow"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="in" />
        </filter>
        <filter
          id="wn-chev-shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.7" />
        </filter>
        {arrows.map((arrow, i) => (
          <clipPath key={`clip-${arrow.key}`} id={`wn-arrow-clip-${i}`}>
            <path id={`wn-clip-${i}`} d="" />
          </clipPath>
        ))}
      </defs>

      {(() => {
        // Snapshot time once — shared by ghost and real arrow delay seeds.
        const nowSec = performance.now() / 1000;

        // Prune cache: remove keys for arrows/ghosts no longer rendered.
        const liveKeys = new Set([
          ...arrows.flatMap((a) => [
            `${a.key}:body`,
            ...Array.from({ length: N_CHEVRONS }, (_, ci) => `${a.key}:${ci}`),
          ]),
          ...(showGhosts ? ghostPairs.map((g) => `ghost:${g.key}:body`) : []),
        ]);
        for (const k of animDelayRef.current.keys()) {
          if (!liveKeys.has(k)) animDelayRef.current.delete(k);
        }

        // Helper: return cached delay, or compute+cache on first appearance.
        // Using performance.now() as seed means each key gets a unique phase
        // relative to real time — once cached it never changes, so React won't
        // touch animationDelay in the DOM and the browser won't restart the animation.
        const stableDelay = (key: string, cycle: number, offset: number) => {
          if (!animDelayRef.current.has(key)) {
            animDelayRef.current.set(
              key,
              `-${((nowSec - offset) % cycle).toFixed(3)}s`,
            );
          }
          return animDelayRef.current.get(key)!;
        };

        return (
          <>
            {/* Ghost arrows — shown only when no real exchange data for this timestamp */}
            {showGhosts &&
              ghostPairs.map((ghost, i) => {
                const phaseBase = (i * 0.45) % 2.5;
                const bodyDelay = stableDelay(
                  `ghost:${ghost.key}:body`,
                  3,
                  phaseBase,
                );
                return (
                  <g key={ghost.key} style={{ pointerEvents: "none" }}>
                    <path
                      id={`wn-ghost-${i}`}
                      d=""
                      stroke="none"
                      className="wn-ghost-pulse"
                      style={{
                        fill: "color-mix(in srgb, #334155 70%, transparent)",
                        animationDelay: bodyDelay,
                      }}
                    />
                    <path
                      id={`wn-ghost-hit-${i}`}
                      d=""
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth={28}
                      strokeLinejoin="round"
                      style={{ pointerEvents: "auto", cursor: "default" }}
                      onMouseEnter={
                        isMobile
                          ? undefined
                          : (e) =>
                              setGhostTooltip({
                                x: e.clientX,
                                y: e.clientY,
                                zoneA: ghost.zoneA,
                                zoneB: ghost.zoneB,
                                nameA: ghost.nameA,
                                nameB: ghost.nameB,
                              })
                      }
                      onMouseMove={
                        isMobile
                          ? undefined
                          : (e) =>
                              setGhostTooltip((prev) =>
                                prev
                                  ? { ...prev, x: e.clientX, y: e.clientY }
                                  : prev,
                              )
                      }
                      onMouseLeave={
                        isMobile ? undefined : () => setGhostTooltip(null)
                      }
                      onTouchStart={(e) => {
                        // Hover never fires on touch, so without this a tap on a
                        // no-data interconnector on mobile silently did nothing.
                        e.stopPropagation();
                        if (isMobile) {
                          // A floating tooltip needs hover to dismiss, which mobile
                          // doesn't have — show the message in the bottom sheet instead.
                          // Routed the same way as real arrows so the refresh effect
                          // keeps tracking this pair and can flip it to a real value
                          // automatically once one appears.
                          openFlowPanelFor(ghost.zoneA, ghost.zoneB);
                        } else {
                          const touch = e.touches[0];
                          setGhostTooltip((prev) =>
                            prev?.zoneA === ghost.zoneA &&
                            prev?.zoneB === ghost.zoneB
                              ? null
                              : {
                                  x: touch.clientX,
                                  y: touch.clientY,
                                  zoneA: ghost.zoneA,
                                  zoneB: ghost.zoneB,
                                  nameA: ghost.nameA,
                                  nameB: ghost.nameB,
                                },
                          );
                        }
                      }}
                    />
                  </g>
                );
              })}

            {/* Real arrows */}
            {arrows.map((arrow, i) => {
              const phaseBase = (i * 0.45) % 2.5;

              // Return cached delay, or compute+cache on first appearance.
              // The value never changes after that, so React won't update the DOM
              // style and the browser won't restart the animation.
              const bodyDelayKey = `${arrow.key}:body`;
              if (!animDelayRef.current.has(bodyDelayKey)) {
                animDelayRef.current.set(
                  bodyDelayKey,
                  `-${((nowSec - phaseBase) % 2.5).toFixed(3)}s`,
                );
              }
              const bodyDelay = animDelayRef.current.get(bodyDelayKey)!;

              const chevDelay = (ci: number) => {
                const k = `${arrow.key}:${ci}`;
                if (!animDelayRef.current.has(k)) {
                  animDelayRef.current.set(
                    k,
                    `-${((nowSec - phaseBase - ci * 0.28) % 1.4).toFixed(3)}s`,
                  );
                }
                return animDelayRef.current.get(k)!;
              };
              const chColor = lightenArrowColor(arrow.color);
              return (
                <g key={arrow.key}>
                  {/* Arrow body */}
                  <path
                    id={`wn-body-${i}`}
                    d=""
                    fill={arrow.color}
                    stroke="rgba(100,100,100,0.45)"
                    strokeWidth={1.2}
                    strokeLinejoin="round"
                    className="wn-body-pulse"
                    style={{ pointerEvents: "none", animationDelay: bodyDelay }}
                  />

                  {/* Inner glow */}
                  <path
                    id={`wn-iglow-${i}`}
                    d=""
                    fill="rgba(255,255,255,0.22)"
                    stroke="none"
                    filter="url(#wn-inner-glow)"
                    style={{ pointerEvents: "none" }}
                  />

                  {/* Chevron ripple — clipped to arrow shape */}
                  {Array.from({ length: N_CHEVRONS }, (_, ci) => (
                    <g
                      key={ci}
                      clipPath={`url(#wn-arrow-clip-${i})`}
                      className="wn-chev-pulse"
                      style={{
                        pointerEvents: "none",
                        animationDelay: chevDelay(ci),
                      }}
                    >
                      <path
                        id={`wn-chev-g-${i}-${ci}`}
                        d=""
                        fill="none"
                        stroke="rgba(0,0,0,0.14)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#wn-chev-shadow)"
                      />
                      <path
                        id={`wn-chev-s-${i}-${ci}`}
                        d=""
                        fill="none"
                        stroke={chColor}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  ))}

                  {/* Transparent hit area — wider than the visible arrow for easier hover/tap */}
                  <path
                    id={`wn-hit-${i}`}
                    d=""
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={28}
                    strokeLinejoin="round"
                    style={{ pointerEvents: "auto", cursor: "default" }}
                    onMouseEnter={
                      isMobile
                        ? undefined
                        : (e) =>
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              srcZone: arrow.srcZone,
                              destZone: arrow.destZone,
                            })
                    }
                    onMouseMove={
                      isMobile
                        ? undefined
                        : (e) =>
                            setTooltip((prev) =>
                              prev
                                ? { ...prev, x: e.clientX, y: e.clientY }
                                : prev,
                            )
                    }
                    onMouseLeave={isMobile ? undefined : () => setTooltip(null)}
                    onTouchStart={(e) => {
                      if (isMobile) {
                        e.stopPropagation();
                        openFlowPanelFor(arrow.srcZone, arrow.destZone);
                      } else {
                        const touch = e.touches[0];
                        setTooltip((prev) =>
                          prev?.srcZone === arrow.srcZone &&
                          prev?.destZone === arrow.destZone
                            ? null
                            : {
                                x: touch.clientX,
                                y: touch.clientY,
                                srcZone: arrow.srcZone,
                                destZone: arrow.destZone,
                              },
                        );
                      }
                    }}
                  />
                </g>
              );
            })}
          </>
        );
      })()}
    </svg>
  );

  const tooltipDatetime = formatDatetime(startDate, selectedTimeIndex);
  const cc = currentPalette.chipColors;

  const TOOLTIP_MARGIN = 8;
  const tw = tooltipSizeRef.current?.w ?? 0;
  const th = tooltipSizeRef.current?.h ?? 0;
  const rawLeft = (tooltip?.x ?? 0) + 16;
  const rawTop = (tooltip?.y ?? 0) - 14;
  const clampedLeft = Math.max(
    TOOLTIP_MARGIN,
    Math.min(rawLeft, window.innerWidth - tw - TOOLTIP_MARGIN),
  );
  const clampedTop = Math.max(
    TOOLTIP_MARGIN,
    Math.min(rawTop, window.innerHeight - th - TOOLTIP_MARGIN),
  );

  return (
    <>
      {createPortal(svgEl, mapContainer)}
      {ghostTooltip && (
        <div
          style={{
            position: "fixed",
            left: ghostTooltip.x + 12,
            top: ghostTooltip.y - 80,
            zIndex: 9999,
            pointerEvents: "none",
            fontFamily: '"Red Hat Text", system-ui, sans-serif',
            background: "color-mix(in srgb, var(--color-panel) 93%, transparent)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid color-mix(in srgb, var(--color-foreground) 10%, transparent)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            whiteSpace: "nowrap",
          }}
        >
          {/* Datetime */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "color-mix(in srgb, var(--color-foreground) 30%, transparent)",
              letterSpacing: "0.03em",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {tooltipDatetime}
          </div>

          {/* Zone pair */}
          <div style={{ display: "flex", gap: 10, margin: "2px 0" }}>
            {/* Static bidirectional connector */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 10,
                paddingTop: 8,
                paddingBottom: 8,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
              <div style={{ flex: 1, width: 1.5, background: "color-mix(in srgb, var(--color-foreground) 18%, transparent)", margin: "3px 0" }} />
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
            </div>

            {/* Zone names */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
              <div style={{ height: 22, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", whiteSpace: "nowrap", lineHeight: 1 }}>
                  {ghostTooltip.nameA}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "color-mix(in srgb, var(--color-foreground) 42%, transparent)", lineHeight: 1 }}>
                  ({ghostTooltip.zoneA})
                </span>
              </div>
              <div style={{ height: 22, display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", whiteSpace: "nowrap", lineHeight: 1 }}>
                  {ghostTooltip.nameB}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "color-mix(in srgb, var(--color-foreground) 42%, transparent)", lineHeight: 1 }}>
                  ({ghostTooltip.zoneB})
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "color-mix(in srgb, var(--color-foreground) 8%, transparent)", margin: "4px -2px 4px" }} />

          {/* Explanatory text */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "color-mix(in srgb, var(--color-foreground) 55%, transparent)",
            }}
          >
            Power Exchange Data Not Yet Available
          </div>
        </div>
      )}
      {tooltip && tooltipArrow && (
        <div
          ref={tooltipElRef}
          style={{
            position: "fixed",
            left: clampedLeft,
            top: clampedTop,
            visibility: tooltipSizeRef.current ? "visible" : "hidden",
            zIndex: 9999,
            pointerEvents: "none",
            fontFamily: '"Red Hat Text", system-ui, sans-serif',
            background:
              "color-mix(in srgb, var(--color-panel) 93%, transparent)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border:
              "1px solid color-mix(in srgb, var(--color-foreground) 10%, transparent)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            overflow: "hidden",
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {/* Left: main content */}
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color:
                  "color-mix(in srgb, var(--color-foreground) 30%, transparent)",
                letterSpacing: "0.03em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {tooltipDatetime}
            </div>

            {/* Zone names + animated connector
                ROW_H=22px, padding = ROW_H/2 - dot_r = 11-3 = 8px → exact center alignment */}
            <div style={{ display: "flex", gap: 10, margin: "2px 0" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 10,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      "color-mix(in srgb, var(--color-foreground) 35%, transparent)",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    width: 1.5,
                    background:
                      "color-mix(in srgb, var(--color-foreground) 18%, transparent)",
                    margin: "3px 0",
                  }}
                />
                {/* Two-chevron ripple: opacity wave flows top→bottom suggesting downward transfer */}
                <svg
                  width="8"
                  height="12"
                  viewBox="0 0 8 12"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M1 1L4 4.5L7 1"
                    stroke="color-mix(in srgb, var(--color-foreground) 32%, transparent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.15;1;0.15"
                      dur="1.2s"
                      begin="0s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keyTimes="0;0.5;1"
                      keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                    />
                  </path>
                  <path
                    d="M1 7L4 10.5L7 7"
                    stroke="color-mix(in srgb, var(--color-foreground) 32%, transparent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.15;1;0.15"
                      dur="1.2s"
                      begin="0.4s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keyTimes="0;0.5;1"
                      keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                    />
                  </path>
                </svg>
                <div
                  style={{
                    flex: 1,
                    width: 1.5,
                    background:
                      "color-mix(in srgb, var(--color-foreground) 18%, transparent)",
                    margin: "3px 0",
                  }}
                />
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      "color-mix(in srgb, var(--color-foreground) 35%, transparent)",
                    flexShrink: 0,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color:
                        "color-mix(in srgb, var(--color-foreground) 92%, transparent)",
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {tooltipArrow.srcName}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color:
                        "color-mix(in srgb, var(--color-foreground) 42%, transparent)",
                      lineHeight: 1,
                    }}
                  >
                    ({tooltipArrow.srcZone})
                  </span>
                </div>
                <div
                  style={{
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color:
                        "color-mix(in srgb, var(--color-foreground) 92%, transparent)",
                      whiteSpace: "nowrap",
                      lineHeight: 1,
                    }}
                  >
                    {tooltipArrow.destName}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color:
                        "color-mix(in srgb, var(--color-foreground) 42%, transparent)",
                      lineHeight: 1,
                    }}
                  >
                    ({tooltipArrow.destZone})
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginTop: 6,
              }}
            >
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color:
                    "color-mix(in srgb, var(--color-foreground) 92%, transparent)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tooltipArrow.mw.toFixed(2)}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color:
                    "color-mix(in srgb, var(--color-foreground) 40%, transparent)",
                  lineHeight: 1,
                }}
              >
                MW
              </span>
            </div>
            <div
              style={{
                fontSize: 15,
                color:
                  "color-mix(in srgb, var(--color-foreground) 50%, transparent)",
                lineHeight: 1,
              }}
            >
              Power exchange
            </div>

            {tooltipArrow.metricValue !== null && (
              <div
                style={{
                  fontSize: 14,
                  color:
                    "color-mix(in srgb, var(--color-foreground) 50%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  lineHeight: 1,
                  marginTop: 12,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: tooltipArrow.color,
                    border: "1px solid rgba(0,0,0,0.2)",
                    flexShrink: 0,
                  }}
                />
                with a{" "}
                <strong
                  style={{
                    color:
                      "color-mix(in srgb, var(--color-foreground) 85%, transparent)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 15,
                  }}
                >
                  {tooltipArrow.metricValue.toFixed(2)}{" "}
                  {legendConfig.unit ?? ""}
                </strong>{" "}
                {legendConfig.title.toLowerCase()}
              </div>
            )}
          </div>

          {/* Right: pills column — top Energy 2×2, full-width divider, bottom Environmental 2-col */}
          <div
            style={{
              borderLeft: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              minWidth: 156,
            }}
          >
            {tooltipStatus ? (
              <>
                {/* ENERGY — 2×2 grid, flex:1 pushes Environmental to bottom */}
                <div
                  style={{
                    padding: "14px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color:
                        "color-mix(in srgb, var(--color-foreground) 28%, transparent)",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Energy
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 4,
                    }}
                  >
                    <Chip
                      label={tooltipStatus.valid ? "Final" : "Not Final"}
                      color={tooltipStatus.valid ? cc.final : cc.notFinal}
                    />
                    {tooltipStatus.zoneStatus === "complete" && (
                      <Chip label="Complete" color={cc.complete} />
                    )}
                    {tooltipStatus.zoneStatus === "preview" && (
                      <Chip label="Preview" color={cc.preview} />
                    )}
                    {tooltipStatus.zoneStatus === "missing" &&
                      tooltipStatus.isForecast && (
                        <Chip label="Forecasted" color={cc.forecasted} dashed />
                      )}
                    {tooltipStatus.zoneStatus === "missing" &&
                      !tooltipStatus.isForecast && (
                        <Chip label="Missing" color={cc.missing} />
                      )}
                    {tooltipStatus.dataState === "official" && (
                      <Chip label="Official" color={cc.complete} />
                    )}
                    {tooltipStatus.dataState === "estimated" && (
                      <Chip label="Estimated" color={cc.preview} />
                    )}
                    {tooltipStatus.datasource && (
                      <Chip
                        label={formatDatasource(tooltipStatus.datasource)}
                        color={cc.neutral}
                      />
                    )}
                  </div>
                </div>

                {/* Full-width divider */}
                <div style={{ height: 1, background: "var(--color-border)" }} />

                {/* ENVIRONMENTAL — same 2-col grid for aligned columns */}
                <div
                  style={{
                    padding: "10px 12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color:
                        "color-mix(in srgb, var(--color-foreground) 28%, transparent)",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Environmental
                  </span>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 4,
                    }}
                  >
                    <Chip
                      label={flowTracing ? "Global" : "Local"}
                      color={flowTracing ? cc.global : cc.local}
                    />
                    <Chip
                      label={
                        scope === "life-cycle" ? "Life-cycle" : "Operational"
                      }
                      color={
                        scope === "life-cycle" ? cc.lifecycle : cc.operational
                      }
                    />
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
