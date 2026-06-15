import { FeatureCollection } from 'geojson';
import {
  Footprint,
  ProcessedFootprint,
  FootprintItem,
} from '../types/footprints';
import { dayCountInRange } from '@/src/shared/utils/dateManager';

const generateRangeIntervals = (startDate: Date, endDate: Date): string[] => {
  const N = dayCountInRange(startDate, endDate);
  const origin = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  return Array.from({ length: N * 96 }, (_, i) =>
    new Date(origin + i * 15 * 60 * 1000).toISOString()
  );
};

export const processFootprints = (
  data: Footprint[],
  startDate: Date,
  endDate: Date,
): ProcessedFootprint[] => {
  return data.map((fp) => {
    const flattened = fp.series
      .flatMap((s) =>
        s.values.map<FootprintItem>(([timestamp, value]) => ({
          timestamp,
          value,
          valid: s.valid,
          zoneStatus: s.zone_status,
        })),
      )
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    if (!flattened.length) {
      return { ...fp, series: [] };
    }

    const byTimestamp = new Map(
      flattened.map((item) => [new Date(item.timestamp).getTime(), item]),
    );

    const fullIntervals = generateRangeIntervals(startDate, endDate);

    const completedSeries: FootprintItem[] = fullIntervals.map((ts) => {
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
 * Merge the values of the active metric into the GeoJSON features based on the processed footprint data and selected time index.
 */
export const mergeActiveMetricValues = (
  geojson: FeatureCollection,
  processedData: ProcessedFootprint[],
  timeIndex: number,
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
        value: zoneData?.value ?? null,
        valid: zoneData?.valid ?? false,
        zone_status: zoneData?.zoneStatus ?? 'Unknown',
      },
    };
  });

  return geojson;
};
