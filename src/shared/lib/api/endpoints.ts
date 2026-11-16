import { ApiQueryParams } from '@/src/shared/types/queryParams';
import { ImportsQueryParams } from '@/src/features/map/types/imports';

type AnyQueryParams = ApiQueryParams | ImportsQueryParams;

// The API answers 400 to a parameter that is empty, repeated or that it does not declare, so a missing
// value is left out of the URL (an empty zone would no longer mean "every zone").
const buildUrl = (path: string, params: AnyQueryParams) => {
  const url = new URL(`${process.env.API_URL}/${path}`);
  (Object.entries(params) as [string, unknown][]).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.append(key, String(value));
  });
  return url.toString();
};

export const endpoints = {
  footprints: (params: ApiQueryParams) => buildUrl('footprints', params),
  impacts: (params: ApiQueryParams) => buildUrl('impacts', params),
  environmentalScore: (params: ApiQueryParams) =>
    buildUrl('environmental-score', params),
  imports: (params: ImportsQueryParams) => buildUrl('imports', params),
};
