"use client";

import { Box, Typography } from "@mui/material";

const BORDER = "rgba(255,255,255,0.08)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "rgba(11,18,30,0.88)";

interface LegendProps {
  title: string;
  unitOfMeasure: string;
  labels: number[]; // 6 fixed breakpoint values to display
  legendColors: string[]; // 6 colors matching those label positions
}

export default function Legend({
  title,
  unitOfMeasure,
  labels,
  legendColors,
}: LegendProps) {
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
        width: 240,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-sans)",
          mb: 0.75,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {title}{" "}
        <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
          ({unitOfMeasure})
        </span>
      </Typography>

      {/* Gradient bar */}
      <Box
        sx={{
          height: 8,
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
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-sans)",
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
