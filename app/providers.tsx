"use client";

import { SWRConfig } from "swr";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { es, enGB } from "date-fns/locale";
import { ThemeProvider } from "@mui/material/styles";
import { muiTheme } from "@/lib/muiTheme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={muiTheme}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          adapterLocale={i18n.language === "es" ? es : enGB}
        >
          <SWRConfig
            value={{
              fetcher: (url: string) => fetch(url).then((res) => res.json()),
              revalidateOnFocus: false,
              dedupingInterval: 60 * 60_000, // keep data for 1 hour before revalidating
            }}
          >
            {children}
          </SWRConfig>
        </LocalizationProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
