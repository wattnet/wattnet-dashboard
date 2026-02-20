import { FeatureCollection } from 'geojson';
import {
  Footprint,
  ProcessedFootprint,
  FootprintItem,
} from '../types/footprints';

/**
 * Generates an array of ISO timestamps for every 15-minute interval in the day of the given date.
 */
const generateDayIntervals = (date: Date) => {
  const intervals: string[] = [];

  const start = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  for (let i = 0; i < 96; i++) {
    const d = new Date(start.getTime() + i * 15 * 60 * 1000);
    intervals.push(d.toISOString());
  }

  return intervals;
};

/**
 * Transforms raw footprint data into a structured format with complete 15-minute intervals.
 */
export const processFootprints = (data: Footprint[]): ProcessedFootprint[] => {
  return data.map((fp) => {
    // Merge all series into one sorted array of items with timestamp, value, valid, and zoneStatus
    const flattened = fp.series
      .flatMap((s) =>
        s.values.map<FootprintItem>(([timestamp, value]) => ({
          timestamp,
          value,
          valid: s.valid,
          zoneStatus: s.zone_status,
        }))
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

    if (!flattened.length) {
      return { ...fp, series: [] };
    }

    // Create a map by timestamp to check if all intervals have data
    const byTimestamp = new Map(
      flattened.map((item) => [new Date(item.timestamp).getTime(), item])
    );

    // Generate full day intervals based on the first timestamp's date
    const baseDate = new Date(flattened[0].timestamp);
    const fullDayIntervals = generateDayIntervals(baseDate);

    // For each interval, use the existing data or fill in a placeholder if missing
    const completedSeries: FootprintItem[] = fullDayIntervals.map((ts) => {
      const tMs = new Date(ts).getTime();
      return (
        byTimestamp.get(tMs) ?? {
          timestamp: ts,
          value: null,
          valid: false,
          zoneStatus: 'missing',
        }
      );
    });

    return {
      ...fp,
      series: completedSeries,
    };
  });
};

/**
 * Merge carbon or water values into the GeoJSON features based on the processed footprint data and selected time index.
 */
const mergeValues = (
  geojson: FeatureCollection,
  processedData: ProcessedFootprint[],
  timeIndex: number,
  valueKey: 'carbon_value' | 'water_value'
) => {
  const mergedByZone: Record<
    string,
    { value: number | null; valid: boolean; zoneStatus: string }
  > = {};

  processedData.forEach((d) => {
    const item = d.series[timeIndex];
    if (!item) return;

    mergedByZone[d.zone] = {
      value: item.value,
      valid: item.valid,
      zoneStatus: item.zoneStatus,
    };
  });

  geojson.features = geojson.features.map((f: any) => {
    const zoneData = mergedByZone[f.properties.zoneName];
    return {
      ...f,
      properties: {
        ...f.properties,
        [valueKey]: zoneData?.value ?? null,
        valid: zoneData?.valid ?? false,
        zone_status: zoneData?.zoneStatus ?? 'Unknown',
      },
    };
  });

  return geojson;
};

export const mergeCarbonValues = (
  geojson: FeatureCollection,
  data: ProcessedFootprint[],
  timeIndex: number
) => mergeValues(geojson, data, timeIndex, 'carbon_value');

export const mergeWaterValues = (
  geojson: FeatureCollection,
  data: ProcessedFootprint[],
  timeIndex: number
) => mergeValues(geojson, data, timeIndex, 'water_value');
