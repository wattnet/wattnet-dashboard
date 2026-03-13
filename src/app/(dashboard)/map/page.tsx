"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useCarbonFootprints } from "@/src/hooks/useCarbonFootprints";
import { COLORS } from "@/src/lib/theme/colors";
import DateSelector from "@/src/components/features/sidebar/DateSelector";
import Legend from "@/src/components/features/map/Legend";
import { getInitialTimeIndex, getTodayUTC } from "@/src/utils/dateManager";
import { processFootprints } from "@/src/utils/footprintAdapter";
import GlobalTag from "@/src/components/features/map/GlobalTag";
import MapContainer from "@/src/components/features/map/MapContainer";
import {
  ZoneData,
  useSidebarControls,
  useMapControls,
  useZonePanel,
  useCanvasRect,
  useBottomSheet,
} from "@/src/components/features/sidebar/context/DashboardContext";
import { useInteractionMode } from "@/src/hooks/useInteractionMode";
import { MOBILE_TOP_BAR_H, MOBILE_PEEK_H } from "@/src/app/(dashboard)/layout";

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

function mobileLegendBottom(sheetState: string): number {
  if (sheetState === "peek") {
    return MOBILE_PEEK_H + LEGEND_MARGIN;
  }
  return LEGEND_MARGIN;
}

import type { Map } from "maplibre-gl";

type ZoomButtonsProps = {
  mapRef: React.RefObject<Map | null>;
};

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
  const { footprintType, scope } = useMapControls();
  const { openZonePanel, closeZonePanel } = useZonePanel();
  const { canvasRect } = useCanvasRect();
  const { bottomSheetState } = useBottomSheet();
  const { isTouch } = useInteractionMode();

  const mapRef = useRef<Map | null>(null);

  const [selectedDate, setSelectedDate] = useState(getTodayUTC);
  const [selectedTimeIndex, setSelectedTimeIndex] =
    useState(getInitialTimeIndex);

  const isCarbon = footprintType === "carbon";

  const legendConfig = useMemo(
    () => ({
      title: isCarbon ? "Carbon Footprint" : "Water Footprint",
      unit: isCarbon ? "gCO₂eq/kWh" : "l/kWh",
      colors: Object.values(isCarbon ? COLORS.carbon : COLORS.water),
      range: isCarbon
        ? { min: 0, max: 1000, step: 200 }
        : { min: 0, max: 250, step: 50 },
    }),
    [isCarbon],
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

  const { data, loading, error } = useCarbonFootprints(
    {
      footprint_type: footprintType,
      scope,
      start: `${dateKey}T00:00:00Z`,
      end: `${dateKey}T23:45:00Z`,
      aggregate: false,
      use_global: true,
    },
    dateKey,
  );

  const processedData = useMemo(
    () => (data ? processFootprints(data) : []),
    [data],
  );

  useEffect(() => {
    setSidebarControls(
      <DateSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTimeIndex={selectedTimeIndex}
        setSelectedTimeIndex={setSelectedTimeIndex}
        data={processedData}
      />,
    );
  }, [selectedDate, selectedTimeIndex, processedData, setSidebarControls]);

  useEffect(() => () => setSidebarControls(null), [setSidebarControls]);

  const handleZoneClick = (zoneName: string, zoneData: ZoneData) => {
    openZonePanel(zoneName, zoneData);
  };

  const mobileTopOffset = MOBILE_TOP_BAR_H + 8;
  const mobileLegendBot = mobileLegendBottom(bottomSheetState);
  const showDesktopOverlay = !isTouch && canvasRect.width > 0;

  return (
    <>
      <Box sx={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <MapContainer
          data={processedData}
          loading={loading}
          selectedDate={selectedDate}
          selectedTimeIndex={selectedTimeIndex}
          selectedFootprintType={footprintType}
          onZoneClick={handleZoneClick}
          onEmptyClick={closeZonePanel}
          onMapReady={(m) => {
            mapRef.current = m;
          }}
        />
      </Box>

      {/* Touch overlays — fixed, offset below top bar */}
      {isTouch && (
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
            <GlobalTag title="Real time" />
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
            <Legend
              title={legendConfig.title}
              unitOfMeasure={legendConfig.unit}
              colors={legendConfig.colors}
              {...legendConfig.range}
            />
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

      {/* Pointer/desktop overlays — anchored to canvas rect */}
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
            <GlobalTag title="Real time" />
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
            <Legend
              title={legendConfig.title}
              unitOfMeasure={legendConfig.unit}
              colors={legendConfig.colors}
              {...legendConfig.range}
            />
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
