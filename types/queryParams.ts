export interface FootprintQueryParams {
  start: string; // ISO datetime
  end: string; // ISO datetime
  zone?: string; // wattnet zone code
  lat?: number;
  lon?: number;
  footprint_type?: 'carbon' | 'water';
  scope?: 'operational' | 'life-cycle';
  aggregate?: boolean;
  use_global?: boolean;
}
