"use client";

import { Box, Typography } from "@mui/material";

const BORDER = "var(--color-border)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "var(--color-panel)";
const SHADOW = "var(--color-background) 40% 0px 4px 24px";

const TEXT_TITLE =
  "color-mix(in srgb, var(--color-foreground) 55%, transparent)";
const TEXT_LABELS =
  "color-mix(in srgb, var(--color-foreground) 40%, transparent)";

interface LegendProps {
  title: string;
  labels: number[]; // 6 fixed breakpoint values to display
  legendColors: string[]; // 6 colors matching those label positions
  unitOfMeasure?: string;
}

export default function Legend({
  title,
  unitOfMeasure,
  labels,
  legendColors,
}: Readonly<LegendProps>) {
  return (
    <Box
      sx={{
        bgcolor: PANEL_BG,
        backdropFilter: BACKDROP,
        WebkitBackdropFilter: BACKDROP,
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        px: 1.5,
        py: 1.25,
        width: 280,
        boxShadow: SHADOW,
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: TEXT_TITLE,
          mb: 0.75,
          letterSpacing: "0.04em",
        }}
      >
        {title}{" "}
        {unitOfMeasure && (
          <span style={{ color: TEXT_TITLE, fontWeight: 500 }}>
            ({unitOfMeasure})
          </span>
        )}
      </Typography>

      {/* Gradient bar */}
      <Box
        sx={{
          height: 10,
          borderRadius: 4,
          mb: 0.6,
          background: `linear-gradient(to right, ${legendColors.join(", ")})`,
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {labels.map((v) => (
          <Typography
            key={v}
            sx={{
              fontSize: 12,
              color: TEXT_LABELS,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {v}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
