export interface ImportBlock {
  source: string;
  data_state: "official" | "estimated" | "missing";
  datasource: string;
  values: [string, number][];
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
