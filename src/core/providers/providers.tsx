"use client";

import { SWRConfig } from "swr";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es, enGB } from "date-fns/locale";
import { ThemeProvider } from "@mui/material/styles";
import { muiTheme } from "@/src/core/theme/muiTheme";

export function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
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
              dedupingInterval: 60 * 60_000,
            }}
          >
            {children}
          </SWRConfig>
        </LocalizationProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
