import { FootprintQueryParams } from '@/src/types/queryParams';

export const endpoints = {
  footprints: (params: FootprintQueryParams) => {
    const url = new URL(`${process.env.API_URL}/footprints`);

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.append(key, String(value));
    });

    return url.toString();
  },
};
