import { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

function collectCoords(coords: Position[][]): Position[] {
  return coords.flat();
}

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
    let allCoords: Position[] = [];
    if (geom.type === "MultiPolygon") {
      for (const polygon of geom.coordinates) {
        allCoords = allCoords.concat(collectCoords(polygon));
      }
    } else if (geom.type === "Polygon") {
      allCoords = collectCoords(geom.coordinates);
    }
    if (allCoords.length > 0) {
      result[zoneName] = centroidFromCoords(allCoords);
    }
  }
  return result;
}
