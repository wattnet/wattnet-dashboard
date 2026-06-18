import { FootprintQueryParams } from '@/src/shared/types/queryParams';
import { ImportsQueryParams } from '@/src/features/map/types/imports';

const buildUrl = (
  path: string,
  params: FootprintQueryParams,
  omitKeys: (keyof FootprintQueryParams)[] = [],
) => {
  const url = new URL(`${process.env.API_URL}/${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (omitKeys.includes(key as keyof FootprintQueryParams)) return;
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
  imports: (params: ImportsQueryParams) => {
    const url = new URL(`${process.env.API_URL}/imports`);
    url.searchParams.append('start', params.start);
    url.searchParams.append('end', params.end);
    if (params.zone) url.searchParams.append('zone', params.zone);
    return url.toString();
  },
};
