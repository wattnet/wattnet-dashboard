"use client";

import { Box, Typography } from "@mui/material";

// ── Types ──────────────────────────────────────────────────────────────────
export type TagStatus = "no-data" | "historical" | "live" | "forecast";

interface GlobalTagProps {
  readonly title: string;
}

// ── Palette  ─────────────────────────────────────────────────────
const PANEL_BG = "var(--color-panel)";
const SHADOW = "0 2px 8px rgba(0,0,0,0.3)";

// No Data
const NO_DATA_COLOR =
  "color-mix(in srgb, var(--color-foreground) 45%, transparent)";
const NO_DATA_BORDER =
  "color-mix(in srgb, var(--color-foreground) 20%, transparent)";

// Historical
const HISTORICAL_COLOR = "var(--color-primary)";
const HISTORICAL_BORDER =
  "color-mix(in srgb, var(--color-primary) 50%, transparent)";

// Live
const LIVE_COLOR = "#ef4444";
const LIVE_BORDER = "rgba(239, 68, 68, 0.4)";

// Forecast
const FORECAST_COLOR = "var(--color-secondary)";
const FORECAST_BORDER =
  "color-mix(in srgb, var(--color-secondary) 50%, transparent)";

// ── Icons ────────
const NoDataIcon = () => (
  <Box
    component="svg"
    width={9}
    height={9}
    viewBox="0 0 9 9"
    sx={{ flexShrink: 0 }}
  >
    <circle
      cx="4.5"
      cy="4.5"
      r="3.5"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
  </Box>
);

const HistoricalIcon = () => (
  <Box
    component="svg"
    width={13}
    height={13}
    viewBox="0 0 13 13"
    sx={{ flexShrink: 0 }}
  >
    <circle
      cx="6.5"
      cy="6.5"
      r="5.5"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="none"
    />
    <polyline
      points="6.5,3.5 6.5,6.8 8.8,8.2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Box>
);

const LiveIcon = () => (
  <Box
    component="svg"
    width={9}
    height={9}
    viewBox="0 0 9 9"
    sx={{
      flexShrink: 0,
      "@keyframes wn-blink": {
        "0%,100%": { opacity: 1 },
        "50%": { opacity: 0.2 },
      },
      animation: "wn-blink 1.8s ease-in-out infinite",
    }}
  >
    <circle cx="4.5" cy="4.5" r="4.5" fill="currentColor" />
  </Box>
);

const ForecastIcon = () => (
  <Box
    component="svg"
    width={13}
    height={13}
    viewBox="0 0 13 13"
    sx={{ flexShrink: 0 }}
  >
    <circle
      cx="6.5"
      cy="6.5"
      r="5"
      stroke="currentColor"
      strokeWidth="1.3"
      fill="none"
      strokeDasharray="2.5 2"
    />
  </Box>
);

// ── Per-status config ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; border: string; icon: React.ReactNode }
> = {
  "no-data": {
    label: "No data",
    color: NO_DATA_COLOR,
    border: NO_DATA_BORDER,
    icon: <NoDataIcon />,
  },
  historical: {
    label: "Historical",
    color: HISTORICAL_COLOR,
    border: HISTORICAL_BORDER,
    icon: <HistoricalIcon />,
  },
  live: {
    label: "Live",
    color: LIVE_COLOR,
    border: LIVE_BORDER,
    icon: <LiveIcon />,
  },
  forecast: {
    label: "Forecast",
    color: FORECAST_COLOR,
    border: FORECAST_BORDER,
    icon: <ForecastIcon />,
  },
};

const FALLBACK = STATUS_CONFIG["no-data"];

// ── Component ──────────────────────────────────────────────────────────────
export default function GlobalTag({ title }: GlobalTagProps) {
  const cfg = STATUS_CONFIG[title] ?? FALLBACK;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.75,
        py: 1,
        borderRadius: 10,
        bgcolor: PANEL_BG,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: `2px solid ${cfg.border}`,
        boxShadow: SHADOW,
        color: cfg.color,
      }}
    >
      {cfg.icon}
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          color: "inherit",
          lineHeight: 1,
        }}
      >
        {cfg.label}
      </Typography>
    </Box>
  );
}
