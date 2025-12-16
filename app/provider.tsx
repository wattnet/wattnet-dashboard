"use client";

import { SWRConfig } from "swr";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <SWRConfig
        value={{
          fetcher: (url: string) => fetch(url).then((res) => res.json()),
          revalidateOnFocus: false,
          dedupingInterval: 60 * 60_000, // keep data for 1 hour before revalidating
        }}
      >
        {children}
      </SWRConfig>
    </I18nextProvider>
  );
}
