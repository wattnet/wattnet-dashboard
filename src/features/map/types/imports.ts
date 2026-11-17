import { Point } from "./footprints";

export interface ImportBlock {
  source: string;
  data_state: "official" | "estimated" | "missing";
  datasource: string;
  points: Point[];
}

export interface ImportSeries {
  valid: boolean;
  zone_status: "complete" | "preview" | "missing";
  imports: ImportBlock[];
}

export interface ZoneImports {
  zone: string;
  unit: "MW";
  series: ImportSeries[];
}

export interface ImportsQueryParams {
  start: string;
  end: string;
  zone?: string;
}
