"use client";

import { SWRConfig } from "swr";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es, enGB } from "date-fns/locale";

import { AppThemeProvider } from "../theme/ThemeContext";
import { PlausibleProvider } from "../analytics/PlausibleProvider";

export function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const locale = i18n.language === "es" ? es : enGB;

  return (
    <PlausibleProvider>
      <AppThemeProvider>
        <I18nextProvider i18n={i18n}>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={locale}
          >
            <SWRConfig
              value={{
                fetcher: (url: string) => fetch(url).then((res) => res.json()),
                revalidateOnFocus: false,
                dedupingInterval: 60 * 60_000,
              }}
            >
              {children}
            </SWRConfig>
          </LocalizationProvider>
        </I18nextProvider>
      </AppThemeProvider>
    </PlausibleProvider>
  );
}
