"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useMetricData } from "@/src/hooks/useMetricData";
import { useDataRefresh } from "@/src/hooks/useDataRefresh";
import DateSelector from "@/src/components/features/sidebar/DateSelector";
import Legend from "@/src/components/features/map/Legend";
import { getInitialTimeIndex, getTodayUTC } from "@/src/utils/dateManager";
import { processFootprints } from "@/src/utils/footprintAdapter";
import GlobalTag from "@/src/components/features/map/GlobalTag";
import MapContainer from "@/src/components/features/map/MapContainer";
import { getScaleConfig, MetricKey } from "@/src/lib/theme/mapScales";
import {
  ZoneData,
  useSidebarControls,
  useMapControls,
  useZonePanel,
  useCanvasRect,
  useBottomSheet,
  useFlowTracing,
} from "@/src/components/features/sidebar/context/DashboardContext";
import { useTheme, useMediaQuery } from "@mui/material";
import { MOBILE_TOP_BAR_H } from "@/src/app/(dashboard)/layout";
import type { Map } from "maplibre-gl";

const BORDER = "rgba(255,255,255,0.08)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "rgba(11,18,30,0.88)";
const LEGEND_MARGIN = 16;

const zoomBtnSx = {
  width: 32,
  height: 32,
  bgcolor: PANEL_BG,
  backdropFilter: BACKDROP,
  WebkitBackdropFilter: BACKDROP,
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  color: "rgba(255,255,255,0.6)",
  "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" },
};

function mobileLegendBottom(_sheetState: string): number {
  return LEGEND_MARGIN;
}

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

export default function MapPage() {
  const setSidebarControls = useSidebarControls();
  const { metric, dimension, scope } = useMapControls();
  const { flowTracing } = useFlowTracing();
  const { openZonePanel, closeZonePanel } = useZonePanel();
  const { canvasRect } = useCanvasRect();
  const { bottomSheetState } = useBottomSheet();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const mapRef = useRef<Map | null>(null);

  const [selectedDate, setSelectedDate] = useState(getTodayUTC);
  const [selectedTimeIndex, setSelectedTimeIndex] =
    useState(getInitialTimeIndex);

  const legendConfig = useMemo(
    () => getScaleConfig(metric, dimension),
    [metric, dimension],
  );

  const dateKey = useMemo(
    () =>
      [
        selectedDate.getUTCFullYear(),
        String(selectedDate.getUTCMonth() + 1).padStart(2, "0"),
        String(selectedDate.getUTCDate()).padStart(2, "0"),
      ].join("-"),
    [selectedDate],
  );

  const { data, loading, error, ephemeralToken, fetchToken } = useMetricData(
    {
      metric,
      dimension,
      scope,
      start: `${dateKey}T00:00:00Z`,
      end: `${dateKey}T23:59:59Z`,
      aggregate: false,
      use_global: flowTracing,
    },
    dateKey,
  );

  const isToday = useMemo(() => {
    const today = getTodayUTC();
    return (
      selectedDate.getUTCFullYear() === today.getUTCFullYear() &&
      selectedDate.getUTCMonth() === today.getUTCMonth() &&
      selectedDate.getUTCDate() === today.getUTCDate()
    );
  }, [selectedDate]);

  useDataRefresh({
    params: {
      metric,
      dimension,
      scope,
      start: `${dateKey}T00:00:00Z`,
      end: `${dateKey}T23:59:59Z`,
      aggregate: false,
      use_global: flowTracing,
    },
    dateKey,
    ephemeralToken,
    fetchToken,
    enabled: isToday,
    selectedTimeIndex,
    setSelectedTimeIndex,
  });

  const processedData = useMemo(
    () => (data ? processFootprints(data) : []),
    [data],
  );

  const globalDataStatusTag = useMemo(() => {
    if (processedData.length === 0 || !selectedDate) return "no-data";

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

    const selectedHours = Math.floor(selectedTimeIndex / 4);
    const selectedMinutes = (selectedTimeIndex % 4) * 15;

    const selectedTimestamp = Date.UTC(
      selectedDate.getUTCFullYear(),
      selectedDate.getUTCMonth(),
      selectedDate.getUTCDate(),
      selectedHours,
      selectedMinutes,
    );

    if (selectedTimestamp > currentTimestamp) return "forecast";
    if (selectedTimestamp < currentTimestamp) return "historical";

    return "live";
  }, [processedData, selectedDate, selectedTimeIndex]);

  const lastSetRef = useRef<string>("");

  useEffect(() => {
    const key = `${dateKey}|${selectedTimeIndex}|${processedData.length}`;
    if (key === lastSetRef.current) return;
    lastSetRef.current = key;
    setSidebarControls(
      <DateSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTimeIndex={selectedTimeIndex}
        setSelectedTimeIndex={setSelectedTimeIndex}
        data={processedData}
      />,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, selectedTimeIndex, processedData.length]);

  useEffect(() => () => setSidebarControls(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleZoneClick = (zoneName: string, zoneData: ZoneData) => {
    openZonePanel(zoneName, zoneData);
  };

  const mobileTopOffset = MOBILE_TOP_BAR_H + 8;
  const mobileLegendBot = mobileLegendBottom(bottomSheetState);
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
      <Box sx={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <MapContainer
          data={processedData}
          metric={metric as MetricKey}
          loading={loading}
          selectedDate={selectedDate}
          selectedTimeIndex={selectedTimeIndex}
          selectedDimension={dimension}
          onZoneClick={handleZoneClick}
          onEmptyClick={closeZonePanel}
          onMapReady={(m) => {
            mapRef.current = m;
          }}
        />
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
          </Box>
          <Box
            sx={{
              position: "absolute",
              bottom: mobileLegendBot,
              right: 16,
              pointerEvents: "auto",
              transition: "bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
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
                bgcolor: "rgba(239,68,68,0.9)",
                color: "#fff",
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
                bgcolor: "rgba(239,68,68,0.9)",
                color: "#fff",
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
