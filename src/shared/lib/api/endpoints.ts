import { FootprintQueryParams } from '@/src/shared/types/queryParams';
import { ImportsQueryParams } from '@/src/features/map/types/imports';

type AnyQueryParams = FootprintQueryParams | ImportsQueryParams;

const buildUrl = (
  path: string,
  params: AnyQueryParams,
  omitKeys: string[] = [],
) => {
  const url = new URL(`${process.env.API_URL}/${path}`);
  (Object.entries(params) as [string, unknown][]).forEach(([key, value]) => {
    if (omitKeys.includes(key)) return;
    if (value === undefined || value === null) return;
    url.searchParams.append(key, String(value));
  });
  return url.toString();
};

export const endpoints = {
  footprints: (params: FootprintQueryParams) => buildUrl('footprints', params),
  impacts: (params: FootprintQueryParams) => buildUrl('impacts', params),
  greenScore: (params: FootprintQueryParams) =>
    buildUrl('green-score', params, ['dimension']),
  imports: (params: ImportsQueryParams) => buildUrl('imports', params),
};
