"use client";

import { SWRConfig } from "swr";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { es, enGB } from "date-fns/locale";
import { ThemeProvider } from "@mui/material/styles";
import { muiTheme } from "@/src/lib/theme/muiTheme";
import { AppProvider } from "@toolpad/core/AppProvider";
import { NAVIGATION } from "./(dashboard)/layout";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = i18n.language === "es" ? es : enGB;

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={locale}
        >
          <SWRConfig
            value={{
              fetcher: (url: string) => fetch(url).then((res) => res.json()),
              revalidateOnFocus: false,
              dedupingInterval: 60 * 60_000, // keep data for 1 hour before revalidating
            }}
          >
            <AppProvider
              branding={{
                logo: (
                  <img src="/images/wattnet-logo-icon.png" alt="wattnet logo" />
                ),
                title: "wattnet",
                homeUrl: "/map",
              }}
              theme={muiTheme}
              navigation={NAVIGATION}
            >
              {children}
            </AppProvider>
          </SWRConfig>
        </LocalizationProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
