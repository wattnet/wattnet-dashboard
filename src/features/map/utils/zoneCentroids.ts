import { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

function centroidFromCoords(coords: Position[]): [number, number] {
  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of coords) {
    sumLon += lon;
    sumLat += lat;
  }
  return [sumLon / coords.length, sumLat / coords.length];
}

export function computeZoneCentroids(
  geoJSON: FeatureCollection,
): Record<string, [number, number]> {
  const result: Record<string, [number, number]> = {};
  for (const feature of geoJSON.features) {
    const zoneName = feature.properties?.zoneName as string | undefined;
    if (!zoneName) continue;
    const geom = feature.geometry as MultiPolygon | Polygon;
    const allCoords: Position[] =
      geom.type === "MultiPolygon"
        ? geom.coordinates.flatMap((p) => p.flat())
        : geom.type === "Polygon"
          ? geom.coordinates.flat()
          : [];
    if (allCoords.length > 0) {
      result[zoneName] = centroidFromCoords(allCoords);
    }
  }
  return result;
}
