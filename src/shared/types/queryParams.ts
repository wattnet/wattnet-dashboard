// What the interface asks of its own routes (/api/metrics): metric and dimension choose the endpoint and the
// type of the API, and never reach the API as they are.
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

// What goes to the API of Wattnet: exactly the parameters that its endpoints declare, because it answers 400 to
// one that it does not know, that is repeated or that is empty.
export interface ApiQueryParams {
  start: string; // ISO datetime
  end: string; // ISO datetime
  zone?: string; // wattnet zone code; omit it to ask for every zone
  lat?: number;
  lon?: number;
  footprint_type?: string; // 'carbon' | 'water' (footprints)
  impact_type?: string; // 'water' (impacts)
  scope?: string; // 'operational' | 'life-cycle'
  aggregate?: boolean;
  use_global?: boolean;
}
