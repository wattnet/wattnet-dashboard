export interface FootprintQueryParams {
  start: string; // ISO datetime
  end: string; // ISO datetime
  zone?: string; // wattnet zone code
  lat?: number;
  lon?: number;
  metric?: string; // 'footprint' | 'impact' | 'environmental-score';
  dimension?: string; // 'carbon' | 'water';
  scope?: string; // 'operational' | 'life-cycle';
  aggregate?: boolean;
  use_global?: boolean;
}
