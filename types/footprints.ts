export interface FootprintSeries {
  valid: boolean;
  zone_status: string;
  values: [string, number][]; // [timestamp, value]
}

export interface Footprint {
  footprint_type: string;
  scope: string;
  zone: string;
  unit: string;
  coverage: string;
  series: FootprintSeries[];
}
