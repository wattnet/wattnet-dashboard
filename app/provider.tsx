"use client";

import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
        revalidateOnFocus: false,
        dedupingInterval: 60 * 60_000, // keep data for 1 hour before revalidating
      }}
    >
      {children}
    </SWRConfig>
  );
}
