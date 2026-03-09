"use client";

import { useRef, useEffect, useState } from "react";
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

interface MapContainerProps {
  data: ProcessedFootprint[];
  loading: boolean;
  selectedDate: Date;
  selectedTimeIndex: number;
  selectedFootprintType: string;
  onZoneClick?: (zoneName: string) => void;
}

export default function MapContainer({
  data,
  loading,
  selectedDate,
  selectedTimeIndex,
  selectedFootprintType,
  onZoneClick,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const worldGeoJSONRef = useRef<FeatureCollection | null>(null);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  const { updateMapData } = useMapLayers(
    mapInstance.current,
    selectedDate,
    onZoneClick,
  );

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "/maps/map-style.json",
      center: [10, 50],
      zoom: 3,
      minZoom: 2,
      maxZoom: 4,
    });

    map.addControl(new maplibregl.NavigationControl());

    map.on("load", () => {
      mapInstance.current = map;
      setIsStyleLoaded(true);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !isStyleLoaded) return;

    const syncMap = async () => {
      if (!worldGeoJSONRef.current) {
        const res = await fetch("/maps/wattnet.geojson");
        worldGeoJSONRef.current = await res.json();
      }

      const geojsonBase = structuredClone(worldGeoJSONRef.current!);
      let mergedGeojson: FeatureCollection;

      if (selectedFootprintType === "carbon") {
        mergedGeojson = mergeCarbonValues(geojsonBase, data, selectedTimeIndex);
      } else {
        mergedGeojson = mergeWaterValues(geojsonBase, data, selectedTimeIndex);
      }

      const map = mapInstance.current!;

      if (!map.getSource("world")) {
        map.addSource("world", {
          type: "geojson",
          data: mergedGeojson,
        });
      }

      updateMapData(mergedGeojson, selectedFootprintType);
    };

    syncMap();
  }, [
    data,
    selectedTimeIndex,
    selectedFootprintType,
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
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.whiteTransparent,
            zIndex: 10,
          }}
        >
          <CircularProgress size={80} />
        </Box>
      )}
    </Box>
  );
}
