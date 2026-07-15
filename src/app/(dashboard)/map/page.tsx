"use client";

import { useState, useMemo, useRef, useCallback, useEffect, Suspense } from "react";
import type { FeatureCollection } from "geojson";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useMetricData } from "@/src/features/metrics/hooks/useMetricData";
import { useDataRefresh } from "@/src/shared/hooks/useDataRefresh";
import DateSelector from "@/src/features/sidebar/components/DateSelector";
import Legend from "@/src/features/map/components/Legend";
import {
  getInitialTimeIndex,
  getTodayUTC,
  decomposeTimeIndex,
  dayCountInRange,
  slotToTimestampMs,
  isSameUTCDay,
} from "@/src/shared/utils/dateManager";
import { processFootprints } from "@/src/features/map/utils/footprintAdapter";
import GlobalTag from "@/src/features/map/components/GlobalTag";
import MapContainer from "@/src/features/map/components/MapContainer";

import { useTheme, useMediaQuery } from "@mui/material";
import { MOBILE_TOP_BAR_H } from "@/src/app/(dashboard)/layout";
import type { Map } from "maplibre-gl";
import {
  useMapControls,
  useFlowTracing,
  useZonePanel,
  useCanvasRect,
  useBottomSheet,
  useDashboardStore,
  ZoneData,
} from "@/src/features/dashboard/store/useDashboardStore";
import { useShallow } from "zustand/react/shallow";
import { Portal } from "@/src/shared/components/Portal";
import { MetricKey, useMapScales } from "@/src/features/map/hooks/useMapScales";
import ThemeSwitcher from "@/src/features/map/components/ThemeSwitcher";
import { parseMapParams, parsePlayParam, parseControlParams } from "@/src/shared/utils/urlParams";
import FlowArrows from "@/src/features/map/components/FlowArrows";
import { useImportsData } from "@/src/features/map/hooks/useImportsData";

// ── Palette ─────────────────────────────────────────────────────
const BORDER = "var(--color-border)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "var(--color-panel)";
const LEGEND_MARGIN = 16;

const BTN_COLOR =
  "color-mix(in srgb, var(--color-foreground) 60%, transparent)";
const BTN_HOVER_COLOR = "var(--color-foreground)";
const BTN_HOVER_BG =
  "color-mix(in srgb, var(--color-foreground) 15%, var(--color-panel))";

const zoomBtnSx = {
  width: { xs: 40, md: 32 },
  height: { xs: 40, md: 32 },
  bgcolor: `color-mix(in srgb, ${PANEL_BG} 93%, transparent)`,
  backdropFilter: BACKDROP,
  WebkitBackdropFilter: BACKDROP,
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  color: BTN_COLOR,
  "&:hover": { color: BTN_HOVER_COLOR, bgcolor: BTN_HOVER_BG },
};


type ZoomButtonsProps = { mapRef: React.RefObject<Map | null> };

const ZoomButtons = ({ mapRef }: ZoomButtonsProps) => (
  <>
    <IconButton
      onClick={() => mapRef.current?.zoomIn()}
      size="small"
      sx={zoomBtnSx}
    >
      <AddIcon sx={{ fontSize: 16 }} />
    </IconButton>
    <IconButton
      onClick={() => mapRef.current?.zoomOut()}
      size="small"
      sx={zoomBtnSx}
    >
      <RemoveIcon sx={{ fontSize: 16 }} />
    </IconButton>
  </>
);

const fmtDate = (d: Date) =>
  [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { initialCenter, initialZoom } = parseMapParams({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    zoom: searchParams.get("zoom"),
  });

  const { metric, dimension, scope, setMetric, setDimension, setScope } = useMapControls();
  const { flowTracing, setFlowTracing } = useFlowTracing();
  const { openZonePanel, closeZonePanel } = useZonePanel();
  const { canvasRect } = useCanvasRect();
  const { bottomSheetState } = useBottomSheet();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const mapRef = useRef<Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapGeoJSON, setMapGeoJSON] = useState<FeatureCollection | null>(null);

  // Apply control params from URL on first mount
  useEffect(() => {
    const p = parseControlParams({
      metric: searchParams.get("metric"),
      dimension: searchParams.get("dimension"),
      scope: searchParams.get("scope"),
      flowTracing: searchParams.get("flowTracing"),
    });
    if (p.metric !== undefined) setMetric(p.metric);
    if (p.dimension !== undefined) setDimension(p.dimension);
    if (p.scope !== undefined) setScope(p.scope);
    if (p.flowTracing !== undefined) setFlowTracing(p.flowTracing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync whenever controls change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("metric", metric);
    params.set("dimension", dimension);
    params.set("scope", scope);
    if (flowTracing) params.delete("flowTracing");
    else params.set("flowTracing", "false");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric, dimension, scope, flowTracing]);

  const [startDate, setStartDate] = useState(getTodayUTC);
  const [endDate, setEndDate] = useState(getTodayUTC);
  const [selectedTimeIndex, setSelectedTimeIndex] =
    useState(getInitialTimeIndex);
  const [isPlaying, setIsPlayingState] = useState(() =>
    parsePlayParam(searchParams.get("play")),
  );

  const setIsPlaying = useCallback(
    (playing: boolean) => {
      setIsPlayingState(playing);
      const params = new URLSearchParams(searchParams.toString());
      if (playing) {
        params.set("play", "true");
      } else {
        params.delete("play");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const setDateRange = useCallback((start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    if (isSameUTCDay(end, getTodayUTC())) {
      const N = dayCountInRange(start, end);
      setSelectedTimeIndex((N - 1) * 96 + getInitialTimeIndex());
    } else {
      setSelectedTimeIndex(0);
    }
    setIsPlayingState(false);
  }, []);

  const legendConfig = useMapScales(metric as MetricKey, dimension);

  const startKey = useMemo(() => fmtDate(startDate), [startDate]);
  const endKey = useMemo(() => fmtDate(endDate), [endDate]);
  const rangeKey = `${startKey}__${endKey}`;

  const { data, loading, error, ephemeralToken, fetchToken } = useMetricData(
    {
      metric,
      dimension,
      scope,
      start: `${startKey}T00:00:00Z`,
      end: `${endKey}T23:59:59Z`,
      aggregate: false,
      use_global: flowTracing,
    },
    rangeKey,
  );

  const setInitialDataReady = useDashboardStore((s) => s.setInitialDataReady);
  const hasStartedLoading = useRef(false);
  const initialDataReadyFired = useRef(false);
  useEffect(() => {
    if (loading) {
      hasStartedLoading.current = true;
    }
    if (!loading && hasStartedLoading.current && !initialDataReadyFired.current) {
      initialDataReadyFired.current = true;
      setInitialDataReady();
    }
  }, [loading, setInitialDataReady]);

  const isToday = useMemo(() => isSameUTCDay(endDate, getTodayUTC()), [endDate]);

  useDataRefresh({
    params: {
      metric,
      dimension,
      scope,
      start: `${startKey}T00:00:00Z`,
      end: `${endKey}T23:59:59Z`,
      aggregate: false,
      use_global: flowTracing,
    },
    dateKey: rangeKey,
    ephemeralToken,
    fetchToken,
    enabled: isToday,
    selectedTimeIndex,
    setSelectedTimeIndex,
    startDate,
  });

  const { data: importsData } = useImportsData(
    {
      start: `${startKey}T00:00:00Z`,
      end: `${endKey}T23:59:59Z`,
    },
    rangeKey,
    ephemeralToken,
  );

  const processedData = useMemo(
    () => (Array.isArray(data) ? processFootprints(data, startDate, endDate) : []),
    [data, startDate, endDate],
  );

  const displayDate = useMemo(
    () => decomposeTimeIndex(startDate, selectedTimeIndex).date,
    [startDate, selectedTimeIndex],
  );

  const globalDataStatusTag = useMemo(() => {
    if (processedData.length === 0) return "no-data";

    const selectedItem = processedData[0].series?.[selectedTimeIndex];
    if (selectedItem?.value === null || selectedItem?.value === undefined) {
      return "no-data";
    }

    const now = getTodayUTC();
    const currentTimestamp = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      Math.floor(now.getUTCMinutes() / 15) * 15,
    );

    const selectedTimestamp = slotToTimestampMs(startDate, selectedTimeIndex);

    if (selectedTimestamp > currentTimestamp) return "forecast";
    if (selectedTimestamp < currentTimestamp) return "historical";

    return "live";
  }, [processedData, startDate, selectedTimeIndex]);

  // ── Zone chart data ────────────────────────────────────────────
  const { zonePanelOpen, zoneCode, setZoneSeries, setZoneSeriesIndex } =
    useDashboardStore(
      useShallow((s) => ({
        zonePanelOpen: s.zonePanelOpen,
        zoneCode: s.zoneData?.zoneCode ?? null,
        setZoneSeries: s.setZoneSeries,
        setZoneSeriesIndex: s.setZoneSeriesIndex,
      })),
    );

  useEffect(() => {
    if (!zonePanelOpen || !zoneCode) { setZoneSeries(null); return; }
    if (processedData.length === 0 || loading) return; // keep old series while stale data is present
    const fp = processedData.find((d) => d.zone === zoneCode);
    setZoneSeries(
      fp ? fp.series.map((s) => ({ value: s.value, timestamp: s.timestamp })) : null,
    );
  }, [zonePanelOpen, zoneCode, processedData, loading, setZoneSeries]);

  useEffect(() => {
    if (zonePanelOpen) setZoneSeriesIndex(selectedTimeIndex);
  }, [zonePanelOpen, selectedTimeIndex, setZoneSeriesIndex]);

  const handleZoneClick = (zoneName: string, zoneData: ZoneData) => {
    openZonePanel(zoneName, zoneData);
  };

  const mobileTopOffset = MOBILE_TOP_BAR_H + 8;
  // Fixed position — the bottom sheet (zIndex 20, above this layer's zIndex 5)
  // naturally covers the legend when it opens instead of the legend dodging it.
  const mobileLegendBot = `calc(${LEGEND_MARGIN}px + env(safe-area-inset-bottom))`;
  const showDesktopOverlay = !isMobile && canvasRect.width > 0;

  const legendEl = (
    <Legend
      title={legendConfig.title}
      unitOfMeasure={legendConfig.unit}
      labels={legendConfig.stops.labels}
      legendColors={legendConfig.legendColors}
    />
  );

  return (
    <>
      <Portal targetId="desktop-sidebar-controls-slot">
        <DateSelector
          startDate={startDate}
          endDate={endDate}
          setDateRange={setDateRange}
          selectedTimeIndex={selectedTimeIndex}
          setSelectedTimeIndex={setSelectedTimeIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          data={processedData}
        />
      </Portal>

      <Box sx={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <MapContainer
          data={processedData}
          metric={metric as MetricKey}
          loading={loading}
          selectedDate={displayDate}
          selectedTimeIndex={selectedTimeIndex}
          selectedDimension={dimension}
          onZoneClick={handleZoneClick}
          onEmptyClick={closeZonePanel}
          onMapReady={(m) => {
            mapRef.current = m;
            setIsMapReady(true);
          }}
          onGeoJSONLoad={setMapGeoJSON}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
        />
        {flowTracing && isMapReady && importsData.length > 0 && mapGeoJSON && (
          <FlowArrows
            mapRef={mapRef}
            importsData={importsData}
            selectedTimeIndex={selectedTimeIndex}
            startDate={startDate}
            processedData={processedData}
            legendConfig={legendConfig}
            geoJSON={mapGeoJSON}
          />
        )}
      </Box>

      {isMobile && (
        <Box
          sx={{ position: "fixed", inset: 0, zIndex: 5, pointerEvents: "none" }}
        >
          <Box
            sx={{
              position: "absolute",
              top: mobileTopOffset,
              left: 12,
              pointerEvents: "auto",
            }}
          >
            <GlobalTag title={globalDataStatusTag} />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: mobileTopOffset,
              right: 16,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              pointerEvents: "auto",
            }}
          >
            <ZoomButtons mapRef={mapRef} />
            <Box sx={{ mt: 0.5 }}>
              <ThemeSwitcher />
            </Box>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: mobileLegendBot,
              right: 16,
              // Explicitly hidden (not just covered by the sheet's z-index) so it
              // can't be focused/tapped through any gap while the sheet is open.
              opacity: bottomSheetState === "hidden" ? 1 : 0,
              pointerEvents: bottomSheetState === "hidden" ? "auto" : "none",
              transition: "opacity 0.25s ease",
            }}
            aria-hidden={bottomSheetState !== "hidden"}
          >
            {legendEl}
          </Box>
          {error && (
            <Box
              sx={{
                position: "absolute",
                top: mobileTopOffset + 80,
                right: 16,
                pointerEvents: "auto",
                bgcolor: "var(--color-secondary)",
                color: "var(--color-background)",
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                fontSize: 12,
              }}
            >
              Error: {error}
            </Box>
          )}
        </Box>
      )}

      {showDesktopOverlay && (
        <Box
          sx={{
            position: "fixed",
            top: canvasRect.top,
            left: canvasRect.left,
            width: canvasRect.width,
            height: canvasRect.height,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              pointerEvents: "auto",
            }}
          >
            <GlobalTag title={globalDataStatusTag} />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: 12,
              right: 16,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              pointerEvents: "auto",
            }}
          >
            <ZoomButtons mapRef={mapRef} />
            <Box sx={{ mt: 0.5 }}>
              <ThemeSwitcher />
            </Box>
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: 24,
              right: 16,
              pointerEvents: "auto",
            }}
          >
            {legendEl}
          </Box>
          {error && (
            <Box
              sx={{
                position: "absolute",
                top: 80,
                right: 16,
                pointerEvents: "auto",
                bgcolor: "var(--color-secondary)",
                color: "var(--color-background)",
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                fontSize: 12,
              }}
            >
              Error: {error}
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapContent />
    </Suspense>
  );
}
