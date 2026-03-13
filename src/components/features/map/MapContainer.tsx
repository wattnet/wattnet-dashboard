"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FeatureCollection } from "geojson";
import { Box, CircularProgress } from "@mui/material";
import { useMapLayers } from "@/src/hooks/useMapLayers";
import { COLORS } from "@/src/lib/theme/colors";
import { ProcessedFootprint } from "@/src/types/footprints";
import {
  mergeCarbonValues,
  mergeWaterValues,
} from "@/src/utils/footprintAdapter";
import { buildQuantileScale, ColorStop } from "@/src/utils/legendHelper";

const SKY_COLORS: { hour: number; color: [number, number, number] }[] = [
  { hour: 0, color: [20, 50, 98] },
  { hour: 4, color: [20, 50, 98] },
  { hour: 6, color: [30, 65, 115] },
  { hour: 10, color: [62, 96, 150] },
  { hour: 14, color: [62, 96, 150] },
  { hour: 18, color: [40, 75, 125] },
  { hour: 21, color: [25, 58, 108] },
  { hour: 24, color: [20, 50, 98] },
];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function getBaseColor(
  timeIndex: number,
  totalSteps: number,
): [number, number, number] {
  const hour = (timeIndex / Math.max(totalSteps - 1, 1)) * 24;
  for (let i = 0; i < SKY_COLORS.length - 1; i++) {
    const from = SKY_COLORS[i],
      to = SKY_COLORS[i + 1];
    if (hour >= from.hour && hour <= to.hour) {
      const t = (hour - from.hour) / (to.hour - from.hour);
      return [
        lerp(from.color[0], to.color[0], t),
        lerp(from.color[1], to.color[1], t),
        lerp(from.color[2], to.color[2], t),
      ];
    }
  }
  return [20, 50, 98];
}

function injectMapStyles() {
  if (document.getElementById("wn-map-style")) return;
  const style = document.createElement("style");
  style.id = "wn-map-style";
  style.textContent = `
    .maplibregl-ctrl-logo,
    .maplibregl-ctrl-attrib,
    .maplibregl-ctrl-group { display: none !important; }
  `;
  document.head.appendChild(style);
}

export type ScaleStats = ReturnType<typeof buildQuantileScale>["stats"];

interface MapContainerProps {
  data: ProcessedFootprint[];
  loading: boolean;
  selectedDate: Date;
  selectedTimeIndex: number;
  selectedFootprintType: string;
  onZoneClick?: (zoneName: string) => void;
  onEmptyClick?: () => void;
  onMapReady?: (map: maplibregl.Map) => void;
  /** Called whenever the quantile scale is (re)computed from fresh data */
  onScaleReady?: (stops: ColorStop[]) => void;
}

export default function MapContainer({
  data,
  loading,
  selectedDate,
  selectedTimeIndex,
  selectedFootprintType,
  onZoneClick,
  onEmptyClick,
  onMapReady,
  onScaleReady,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const worldGeoJSONRef = useRef<FeatureCollection | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  const onEmptyClickRef = useRef(onEmptyClick);
  useEffect(() => {
    onEmptyClickRef.current = onEmptyClick;
  }, [onEmptyClick]);

  const onScaleReadyRef = useRef(onScaleReady);
  useEffect(() => {
    onScaleReadyRef.current = onScaleReady;
  }, [onScaleReady]);

  const totalSteps = data?.[0]?.series?.length ?? 96;

  const { updateMapData } = useMapLayers(
    mapInstance.current,
    selectedDate,
    onZoneClick,
  );

  // Stable callback wrapper so the sync effect doesn't re-run on every render
  const handleScaleReady = useCallback((stops: ColorStop[]) => {
    onScaleReadyRef.current?.(stops);
  }, []);

  // Init map — no native controls
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;
    injectMapStyles();

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "/maps/map-style.json",
      center: [10, 50],
      zoom: 3,
      minZoom: 2,
      maxZoom: 4,
      attributionControl: false,
    });

    map.on("load", () => {
      mapInstance.current = map;
      setIsStyleLoaded(true);
      onMapReady?.(map);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Click: zone vs empty
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isStyleLoaded) return;
    const handler = (e: maplibregl.MapMouseEvent) => {
      const existing = ["carbon-fill", "water-fill"].filter(
        (id) => !!map.getLayer(id),
      );
      if (!existing.length) {
        onEmptyClickRef.current?.();
        return;
      }
      const hits = map.queryRenderedFeatures(e.point, { layers: existing });
      if (!hits.length) onEmptyClickRef.current?.();
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [isStyleLoaded]);

  // Sync data
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;

    const syncMap = async () => {
      if (!worldGeoJSONRef.current) {
        const res = await fetch("/maps/wattnet.geojson");
        worldGeoJSONRef.current = await res.json();
      }

      const base = structuredClone(worldGeoJSONRef.current!);
      const merged: FeatureCollection =
        selectedFootprintType === "carbon"
          ? mergeCarbonValues(base, data, selectedTimeIndex)
          : mergeWaterValues(base, data, selectedTimeIndex);

      const map = mapInstance.current!;
      if (!map.getSource("world"))
        map.addSource("world", { type: "geojson", data: merged });

      updateMapData(merged, selectedFootprintType, handleScaleReady);
    };

    syncMap();
  }, [
    data,
    selectedTimeIndex,
    selectedFootprintType,
    isStyleLoaded,
    updateMapData,
    handleScaleReady,
  ]);

  // Background colour (time-of-day)
  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;
    const [r, g, b] = getBaseColor(selectedTimeIndex, totalSteps);
    mapInstance.current.setPaintProperty(
      "background",
      "background-color",
      `rgb(${r},${g},${b})`,
    );
  }, [selectedTimeIndex, isStyleLoaded, totalSteps]);

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.whiteTransparent,
          }}
        >
          <CircularProgress size={80} />
        </Box>
      )}
    </Box>
  );
}
