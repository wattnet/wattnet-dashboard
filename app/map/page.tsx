"use client";

import { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCarbonFootprints } from "@/hooks/useCarbonFootprints";
import { FeatureCollection } from "geojson";
import { COLORS } from "@/lib/colors";

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const worldGeoJSONRef = useRef<FeatureCollection | null>(null);

  const { data, loading, error } = useCarbonFootprints({
    footprint_type: "carbon",
    scope: "life-cycle",
    start: "2025-12-09T00:00:00",
    end: "2025-12-09T23:00:00",
    aggregate: false,
    use_global: true,
  });

  const fetchWorldGeoJSON = async (): Promise<FeatureCollection> => {
    if (worldGeoJSONRef.current) return worldGeoJSONRef.current;

    const res = await fetch("/maps/wattnet.geojson");
    const geojson = await res.json();
    worldGeoJSONRef.current = geojson;
    return geojson;
  };

  const mergeCarbonValues = (geojson: FeatureCollection) => {
    // Map zone -> carbon value
    // TODO: currently it uses the first value of the series
    const carbonByZone: Record<string, number> = {};
    data.forEach((d) => {
      const first = d.series?.[0]?.values?.[0];
      if (!first) return;
      carbonByZone[d.zone] = first[1];
    });

    geojson.features = geojson.features.map((f: any) => {
      const iso = f.properties.zoneName;
      return {
        ...f,
        properties: {
          ...f.properties,
          carbon_value: carbonByZone[iso] ?? null,
        },
      };
    });

    return geojson;
  };

  const addCarbonLayer = (map: maplibregl.Map) => {
    if (!map.getLayer("carbon-fill")) {
      map.addLayer({
        id: "carbon-fill",
        type: "fill",
        source: "world",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "carbon_value"], null],
            COLORS.carbon["noData"], // no data
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
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "maps/map-style.json",
      center: [10, 50],
      zoom: 2,
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
  }, [data, loading, error]);

  return (
    <div className="w-full h-screen relative">
      {loading && (
        <p className="absolute top-2 left-2 bg-white p-2 z-10">
          Cargando datos...
        </p>
      )}
      {error && (
        <p className="absolute top-2 left-2 bg-red-500 text-white p-2 z-10">
          Error: {error}
        </p>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
