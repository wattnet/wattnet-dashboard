"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCarbonFootprints } from "@/hooks/useCarbonFootprints";
import { FeatureCollection } from "geojson";
import { COLORS } from "@/lib/colors";
import DateSelector from "@/components/map/dateSelector";
import Legend from "@/components/map/legend";
import { Box, CircularProgress } from "@mui/material";
import FootprintTypeSelector from "@/components/map/footprintTypeSelector";
import ScopeSelector from "@/components/map/scopeSelector";
import { getTodayUTC, normalizeToUTCDate } from "@/utils/dateManager";

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const worldGeoJSONRef = useRef<FeatureCollection | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  /* Date selector */
  const [selectedDate, setSelectedDate] = useState(getTodayUTC);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);

  /* Footprint type selector */
  const [selectedFootprintType, setSelectedFootprintType] = useState("carbon");

  /* Scope selector */
  const [selectedScope, setSelectedScope] = useState("life-cycle");

  /* Legend */
  const [legendName, setLegendName] = useState("Carbon Footprint");
  const [legendUnit, setLegendUnit] = useState("gCO₂eq/kWh");
  const [legendColors, setlegendColors] = useState(
    Object.values(COLORS.carbon)
  );

  /* Data */
  const dateKey = [
    selectedDate.getUTCFullYear(),
    String(selectedDate.getUTCMonth() + 1).padStart(2, "0"),
    String(selectedDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
  const { data, loading, error } = useCarbonFootprints(
    {
      footprint_type: selectedFootprintType,
      scope: selectedScope,
      start: `${dateKey}T00:00:00Z`,
      end: `${dateKey}T23:45:00Z`,
      aggregate: false,
      use_global: true,
    },
    dateKey
  );

  const removeCarbonLayers = (map: maplibregl.Map) => {
    if (map.getLayer("carbon-fill")) map.removeLayer("carbon-fill");
    if (map.getLayer("carbon-borders")) map.removeLayer("carbon-borders");
  };

  const removeWaterLayers = (map: maplibregl.Map) => {
    if (map.getLayer("water-fill")) map.removeLayer("water-fill");
    if (map.getLayer("water-borders")) map.removeLayer("water-borders");
  };

  const fetchWorldGeoJSON = async (): Promise<FeatureCollection> => {
    if (worldGeoJSONRef.current) return worldGeoJSONRef.current;

    const res = await fetch("/maps/wattnet.geojson");
    const geojson = await res.json();
    worldGeoJSONRef.current = geojson;
    return geojson;
  };

  const mergeCarbonValues = (geojson: FeatureCollection) => {
    const carbonByZone: Record<string, number> = {};
    // TODO: currently only shows first array of values (valid: true)
    data.forEach((d) => {
      const valueAtIndex = d.series?.[0]?.values?.[selectedTimeIndex]?.[1];
      if (!valueAtIndex) return;
      carbonByZone[d.zone] = valueAtIndex;
    });

    geojson.features = geojson.features.map((f: any) => ({
      ...f,
      properties: {
        ...f.properties,
        carbon_value: carbonByZone[f.properties.zoneName] ?? null,
      },
    }));

    return geojson;
  };

  const mergeWaterValues = (geojson: FeatureCollection) => {
    const waterByZone: Record<string, number> = {};
    // TODO: currently only shows first array of values (valid: true)
    data.forEach((d) => {
      const valueAtIndex = d.series?.[0]?.values?.[selectedTimeIndex]?.[1];
      if (!valueAtIndex) return;
      waterByZone[d.zone] = valueAtIndex;
    });

    geojson.features = geojson.features.map((f: any) => ({
      ...f,
      properties: {
        ...f.properties,
        water_value: waterByZone[f.properties.zoneName] ?? null,
      },
    }));

    return geojson;
  };

  const addCarbonLayer = (map: maplibregl.Map) => {
    if (!map.getLayer("carbon-fill")) {
      // Color fill layer
      map.addLayer({
        id: "carbon-fill",
        type: "fill",
        source: "world",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "carbon_value"], null],
            COLORS.map["noData"],
            [
              "interpolate",
              ["linear"],
              ["get", "carbon_value"],
              0,
              COLORS.carbon[0],
              50,
              COLORS.carbon[50],
              100,
              COLORS.carbon[100],
              200,
              COLORS.carbon[200],
              500,
              COLORS.carbon[500],
              1000,
              COLORS.carbon[1000],
            ],
          ],
          "fill-opacity": 0.8,
        },
      });

      // Border layer
      map.addLayer({
        id: "carbon-borders",
        type: "line",
        source: "world",
        paint: {
          "line-color": COLORS.map["border"],
          "line-width": 0.2,
          "line-opacity": 0.9,
        },
      });
    }
  };

  const addWaterLayer = (map: maplibregl.Map) => {
    if (!map.getLayer("water-fill")) {
      // Color fill layer
      map.addLayer({
        id: "water-fill",
        type: "fill",
        source: "world",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "water_value"], null],
            COLORS.map["noData"],
            [
              "interpolate",
              ["linear"],
              ["get", "water_value"],
              0,
              COLORS.water[0],
              5,
              COLORS.water[5],
              10,
              COLORS.water[10],
              15,
              COLORS.water[15],
              20,
              COLORS.water[20],
              25,
              COLORS.water[25],
            ],
          ],
          "fill-opacity": 0.8,
        },
      });

      // Border layer
      map.addLayer({
        id: "water-borders",
        type: "line",
        source: "world",
        paint: {
          "line-color": COLORS.map["border"],
          "line-width": 0.2,
          "line-opacity": 0.9,
        },
      });
    }
  };

  const addHoverPopup = (
    map: maplibregl.Map,
    layerId: string,
    footprintType: "carbon" | "water"
  ) => {
    map.on("mousemove", layerId, (e) => {
      if (!e.features?.length || !popupRef.current) return;

      const feature = e.features[0];
      const props = feature.properties ?? {};
      const zoneFullName = props.countryName ?? "Unknown";

      const value =
        footprintType === "carbon" ? props.carbon_value : props.water_value;

      const unit = footprintType === "carbon" ? "gCO₂eq/kWh" : "l/kWh";
      const label =
        footprintType === "carbon" ? "Carbon Intensity" : "Water Footprint";

      popupRef.current
        .setLngLat(e.lngLat)
        .setHTML(
          `
          <div style="min-width:160px">
            <div style="font-size:12px;color:#666">${
              normalizeToUTCDate(selectedDate) ?? "--:--"
            }</div>
            <strong>${zoneFullName}</strong><br/>
            <span style="font-size:20px;font-weight:600">
              ${value ?? "—"}
            </span> ${unit}
            <div style="font-size:12px;color:#666">${label}</div>
          </div>
        `
        )
        .addTo(map);

      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
      popupRef.current?.remove();
      map.getCanvas().style.cursor = "";
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "maps/map-style.json",
      center: [10, 50],
      zoom: 3,
      minZoom: 2,
      maxZoom: 4,
    });

    map.addControl(new maplibregl.NavigationControl());
    mapInstance.current = map;

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

    return () => map.remove(); // Cleanup on unmount
  }, []);

  // Update map colours with new data
  useEffect(() => {
    if (!mapInstance.current || loading || error) return;

    const map = mapInstance.current;

    fetchWorldGeoJSON().then((geojson) => {
      // Add source if doesn't exist
      if (!map.getSource("world")) {
        map.addSource("world", {
          type: "geojson",
          data: geojson,
        });
      }

      const source = map.getSource("world") as maplibregl.GeoJSONSource;

      // Merge footprint values
      if (selectedFootprintType === "carbon") {
        removeWaterLayers(map);

        const merged = mergeCarbonValues(structuredClone(geojson));
        source.setData(merged);
        addCarbonLayer(map);
        addHoverPopup(map, "carbon-fill", "carbon");

        setLegendName("Carbon Footprint");
        setLegendUnit("gCO₂eq/kWh");
        setlegendColors(Object.values(COLORS.carbon));
      } else {
        removeCarbonLayers(map);

        const merged = mergeWaterValues(structuredClone(geojson));
        source.setData(merged);
        addWaterLayer(map);
        addHoverPopup(map, "water-fill", "water");

        setLegendName("Water Footprint");
        setLegendUnit("l/kWh");
        setlegendColors(Object.values(COLORS.water));
      }
    });
  }, [
    data,
    selectedTimeIndex,
    selectedFootprintType,
    selectedScope,
    loading,
    error,
  ]);

  return (
    <div className="w-full h-screen relative">
      <div ref={mapContainer} className="w-full h-full" />

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
          <CircularProgress size={100} />
        </Box>
      )}

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
        data={data}
      />

      <ScopeSelector
        selectedScope={selectedScope}
        setSelectedScope={setSelectedScope}
      ></ScopeSelector>

      <FootprintTypeSelector
        selectedFootprintType={selectedFootprintType}
        setSelectedFootprintType={setSelectedFootprintType}
      ></FootprintTypeSelector>

      <Legend
        title={legendName}
        unitOfMeasure={legendUnit}
        min={0}
        max={1000}
        step={200}
        colors={legendColors}
      />
    </div>
  );
}
