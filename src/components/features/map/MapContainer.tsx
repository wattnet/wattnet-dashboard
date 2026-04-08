"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { FeatureCollection } from "geojson";
import { Box, CircularProgress } from "@mui/material";
import { useMapLayers } from "@/src/hooks/useMapLayers";
import { COLORS } from "@/src/lib/theme/colors";
import { ProcessedFootprint } from "@/src/types/footprints";
import { MetricKey } from "@/src/lib/theme/mapScales";
import { mergeActiveMetricValues } from "@/src/utils/footprintAdapter";

// Static neutral dark background — matches dashboard bg (#0c1219)
const MAP_BG = "rgb(29, 42, 54)";

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

interface MapContainerProps {
  data: ProcessedFootprint[];
  metric: MetricKey;
  loading: boolean;
  selectedDate: Date;
  selectedTimeIndex: number;
  selectedDimension: string;
  onZoneClick?: (zoneName: string) => void;
  onEmptyClick?: () => void;
  onMapReady?: (map: maplibregl.Map) => void;
}

export default function MapContainer({
  data,
  metric,
  loading,
  selectedDate,
  selectedTimeIndex,
  selectedDimension,
  onZoneClick,
  onEmptyClick,
  onMapReady,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const worldGeoJSONRef = useRef<FeatureCollection | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  const onEmptyClickRef = useRef(onEmptyClick);
  useEffect(() => {
    onEmptyClickRef.current = onEmptyClick;
  }, [onEmptyClick]);

  const { updateMapData } = useMapLayers(
    mapInstance.current,
    selectedDate,
    metric,
    onZoneClick,
    selectedTimeIndex,
  );

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;
    injectMapStyles();

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "/maps/map-style.json",
      center: [12, 58],
      zoom: 3,
      minZoom: 3,
      maxZoom: 7,
      attributionControl: false,
      renderWorldCopies: false,
      maxBounds: [
        [-60, 0],
        [82, 80],
      ],
    });

    map.on("load", () => {
      mapInstance.current = map;

      // Set static background once — no dynamic updates needed
      map.setPaintProperty("background", "background-color", MAP_BG);

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
      const merged: FeatureCollection = mergeActiveMetricValues(
        base,
        data,
        selectedTimeIndex,
      );

      const map = mapInstance.current!;
      if (!map.getSource("world"))
        map.addSource("world", { type: "geojson", data: merged });

      updateMapData(merged, selectedDimension);
    };
    syncMap();
  }, [
    data,
    metric,
    selectedTimeIndex,
    selectedDimension,
    isStyleLoaded,
    updateMapData,
  ]);

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
