"use client";

import { Box, Typography } from "@mui/material";

// ── Types ──────────────────────────────────────────────────────────────────
export type TagStatus = "no-data" | "historical" | "live" | "forecast";

interface GlobalTagProps {
  readonly title: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────
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
      stroke="#888780"
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
      stroke="#94ce24"
      strokeWidth="1.2"
      fill="none"
    />
    <polyline
      points="6.5,3.5 6.5,6.8 8.8,8.2"
      stroke="#94ce24"
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
    <circle cx="4.5" cy="4.5" r="4.5" fill="#E24B4A" />
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
      stroke="#378ADD"
      strokeWidth="1.3"
      fill="none"
      strokeDasharray="2.5 2"
    />
  </Box>
);

// ── Shared base (dark translucent, like original) ──────────────────────────
const BASE = {
  bg: "rgba(13,21,32,0.75)",
  shadow: "0 2px 8px rgba(0,0,0,0.3)",
};

// ── Per-status accent only ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; border: string; icon: React.ReactNode }
> = {
  "no-data": {
    label: "No data",
    color: "#888780",
    border: "rgba(180,180,180,0.5)",
    icon: <NoDataIcon />,
  },
  historical: {
    label: "Historical",
    color: "#94ce24",
    border: "rgba(148,206,36,0.5)",
    icon: <HistoricalIcon />,
  },
  live: {
    label: "Live",
    color: "#E24B4A",
    border: "rgba(226,75,74,0.5)",
    icon: <LiveIcon />,
  },
  forecast: {
    label: "Forecast",
    color: "#378ADD",
    border: "rgba(36, 137, 238, 0.5)",
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
        bgcolor: BASE.bg,
        backdropFilter: "blur(8px)",
        border: `2px solid ${cfg.border}`,
        boxShadow: BASE.shadow,
      }}
    >
      {cfg.icon}
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          color: cfg.color,
          fontFamily: "var(--font-sans)",
          lineHeight: 1,
        }}
      >
        {cfg.label}
      </Typography>
    </Box>
  );
}
