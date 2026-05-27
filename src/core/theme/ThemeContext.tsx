"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { THEMES, ThemePalette } from "./themes";

export type ThemeMode = "dark" | "light" | "colorblind";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  currentPalette: ThemePalette;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function AppThemeProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as ThemeMode;
    if (
      savedTheme &&
      (savedTheme === "dark" ||
        savedTheme === "light" ||
        savedTheme === "colorblind")
    ) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  const currentPalette = useMemo(() => THEMES[theme], [theme]);

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: currentPalette.mode,
        primary: {
          main: currentPalette.colors.primary,
        },
        secondary: {
          main: currentPalette.colors.secondary,
        },
        background: {
          default: currentPalette.colors.background,
          paper: currentPalette.colors.background,
        },
        text: {
          primary: currentPalette.colors.text,
        },
      },
      typography: {
        fontFamily: "var(--font-sans)",
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: "none",
            },
          },
        },
      },
    });
  }, [currentPalette]);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      currentPalette,
    }),
    [theme, currentPalette]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme debe usarse dentro de AppThemeProvider");
  }
  return context;
}
