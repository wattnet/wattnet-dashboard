import {
  Footprint,
  ProcessedFootprint,
  FootprintItem,
} from '@/types/footprints';

/*
 *  Generates an array of ISO timestamps for every 15-minute interval in the day of the given date.
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

/*
 * Transforms raw footprint data into a structured format with complete 15-minute intervals for the day.
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
      flattened.map((item) => [item.timestamp, item])
    );

    // Generate full day intervals based on the first timestamp's date
    const baseDate = new Date(flattened[0].timestamp);
    const fullDayIntervals = generateDayIntervals(baseDate);

    // For each interval, use the existing data or fill in a placeholder if missing
    const completedSeries: FootprintItem[] = fullDayIntervals.map(
      (timestamp) =>
        byTimestamp.get(timestamp) ?? {
          timestamp,
          value: null,
          valid: false,
          zoneStatus: 'missing',
        }
    );

    return {
      footprint_type: fp.footprint_type,
      scope: fp.scope,
      zone: fp.zone,
      unit: fp.unit,
      coverage: fp.coverage,
      series: completedSeries,
    };
  });
};
