"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCarbonFootprints } from "@/hooks/useCarbonFootprints";
import { FeatureCollection } from "geojson";
import { COLORS } from "@/lib/colors";
import DateSelector from "@/components/map/dateSelector";
import { useTranslation } from "react-i18next";
import Legend from "@/components/map/legend";

export default function MapPage() {
  const { t } = useTranslation();

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const worldGeoJSONRef = useRef<FeatureCollection | null>(null);

  /* Date selector */
  const [selectedDate, setSelectedDate] = useState(new Date("2025-12-01")); // TODO: change to current date
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);

  /* Legend */
  const [legendName, setLegendName] = useState("Carbon Footprint");
  const [legendUnit, setLegendUnit] = useState("gCO₂eq/kWh");
  const [legendColors, setlegendColors] = useState(
    Object.values(COLORS.carbon)
  );

  /* Data */
  const dateKey = selectedDate.toISOString().split("T")[0];
  const { data, loading, error } = useCarbonFootprints(
    {
      footprint_type: "carbon",
      scope: "life-cycle",
      start: `${dateKey}T00:00:00`,
      end: `${dateKey}T23:45:00`,
      aggregate: false,
      use_global: true,
    },
    dateKey
  );

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "maps/map-style.json",
      center: [10, 50],
      zoom: 3,
    });

    map.addControl(new maplibregl.NavigationControl());
    mapInstance.current = map;

    return () => map.remove(); // Cleanup on unmount
  }, []);

  // Update map colours with carbon data
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

      // Merge carbon values
      const merged = mergeCarbonValues(geojson);

      // Update source
      const source = map.getSource("world") as maplibregl.GeoJSONSource;
      source.setData(merged);

      // Add layer
      addCarbonLayer(map);
    });
  }, [data, selectedTimeIndex, loading, error]);

  return (
    <div className="w-full h-screen relative">
      {loading && (
        <p className="absolute top-2 left-2 bg-white p-2 z-10">
          {t("general.loading")}
        </p>
      )}
      {error && (
        <p className="absolute top-2 left-2 bg-red-500 text-white p-2 z-10">
          Error: {error}
        </p>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      <DateSelector
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTimeIndex={selectedTimeIndex}
        setSelectedTimeIndex={setSelectedTimeIndex}
        data={data}
      />
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
