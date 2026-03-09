"use client";

import { useState, useMemo, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCarbonFootprints } from "@/src/hooks/useCarbonFootprints";
import { COLORS } from "@/src/lib/theme/colors";
import DateSelector from "@/src/components/features/sidenav/DateSelector";
import Legend from "@/src/components/features/map/Legend";
import FootprintTypeSelector from "@/src/components/features/sidenav/FootprintTypeSelector";
import ScopeSelector from "@/src/components/features/sidenav/ScopeSelector";
import { getInitialTimeIndex, getTodayUTC } from "@/src/utils/dateManager";
import { processFootprints } from "@/src/utils/footprintAdapter";
import GlobalTag from "@/src/components/features/map/GlobalTag";
import MapContainer from "@/src/components/features/map/MapContainer";
import ZoneDrawer from "@/src/components/features/drawer/ZoneDrawer";

export default function MapPage() {
  /* Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | undefined>(
    undefined,
  );

  /* Date selector */
  const [selectedDate, setSelectedDate] = useState(getTodayUTC);
  const [selectedTimeIndex, setSelectedTimeIndex] =
    useState(getInitialTimeIndex);

  /* Global data status tag */
  const [dataStatusTag, setDataStatusTag] = useState("Real time");

  /* Footprint type selector */
  const [selectedFootprintType, setSelectedFootprintType] = useState("carbon");

  /* Scope selector */
  const [selectedScope, setSelectedScope] = useState("life-cycle");

  /* Legend */
  const footprintType = selectedFootprintType === "carbon";

  const legendConfig = useMemo(
    () => ({
      title: footprintType ? "Carbon Footprint" : "Water Footprint",
      unit: footprintType ? "gCO₂eq/kWh" : "l/kWh",
      colors: Object.values(footprintType ? COLORS.carbon : COLORS.water),
      range: footprintType
        ? { min: 0, max: 1000, step: 200 }
        : { min: 0, max: 250, step: 50 },
    }),
    [footprintType],
  );

  const dateKey = useMemo(() => {
    return [
      selectedDate.getUTCFullYear(),
      String(selectedDate.getUTCMonth() + 1).padStart(2, "0"),
      String(selectedDate.getUTCDate()).padStart(2, "0"),
    ].join("-");
  }, [selectedDate]);

  const { data, loading, error } = useCarbonFootprints(
    {
      footprint_type: selectedFootprintType,
      scope: selectedScope,
      start: `${dateKey}T00:00:00Z`,
      end: `${dateKey}T23:45:00Z`,
      aggregate: false,
      use_global: true,
    },
    dateKey,
  );

  const processedData = useMemo(() => {
    if (!data) return [];
    return processFootprints(data);
  }, [data]);

  return (
    <div className="w-full h-screen relative">
      <MapContainer
        data={processedData}
        loading={loading}
        selectedDate={selectedDate}
        selectedTimeIndex={selectedTimeIndex}
        selectedFootprintType={selectedFootprintType}
        onZoneClick={(zoneName: string) => {
          setSelectedZone(zoneName);
          setDrawerOpen(true);
        }}
      />

      <ZoneDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        zoneName={selectedZone}
      />

      {error && (
        <p className="absolute top-2 left-2 bg-red-500 text-white p-2 z-20">
          Error: {error}
        </p>
      )}

      <DateSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTimeIndex={selectedTimeIndex}
        setSelectedTimeIndex={setSelectedTimeIndex}
        data={processedData}
      />

      <GlobalTag title={dataStatusTag} />

      <ScopeSelector
        selectedScope={selectedScope}
        setSelectedScope={setSelectedScope}
      ></ScopeSelector>

      <FootprintTypeSelector
        selectedFootprintType={selectedFootprintType}
        setSelectedFootprintType={setSelectedFootprintType}
      ></FootprintTypeSelector>

      <Legend
        title={legendConfig.title}
        unitOfMeasure={legendConfig.unit}
        colors={legendConfig.colors}
        {...legendConfig.range}
      />
    </div>
  );
}
