"use client";

import { ColorStop } from "@/src/utils/legendHelper";

import { Box, Typography } from "@mui/material";

const BORDER = "rgba(255,255,255,0.08)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "rgba(11,18,30,0.88)";

interface LegendProps {
  title: string;
  unitOfMeasure: string;
  stops: ColorStop[];
  colors: string[];
  min: number;
  max: number;
}

function formatLabel(v: number): string {
  if (v == 0) return "0";
  if (v >= 100) return Math.round(v).toString();
  if (v >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

export default function Legend({
  title,
  unitOfMeasure,
  stops,
  colors,
  min,
  max,
}: LegendProps) {
  const hasStops = stops.length > 1;

  const gradientColors = hasStops ? stops.map((s) => s.color) : colors;
  const gradient = `linear-gradient(to right, ${gradientColors.join(", ")})`;

  const N_LABELS = 6;
  const labels: { pct: number; value: number }[] = hasStops
    ? Array.from({ length: N_LABELS }, (_, i) => {
        const pct = (i / (N_LABELS - 1)) * 100;

        if (i === 0) return { pct, value: min };
        if (i === N_LABELS - 1 && max !== undefined) return { pct, value: max };

        let lo = stops[0],
          hi = stops[stops.length - 1];
        for (let j = 0; j < stops.length - 1; j++) {
          if (stops[j].percentile <= pct && stops[j + 1].percentile >= pct) {
            lo = stops[j];
            hi = stops[j + 1];
            break;
          }
        }

        const range = hi.percentile - lo.percentile;
        const t = range === 0 ? 0 : (pct - lo.percentile) / range;
        const value = lo.value + (hi.value - lo.value) * t;

        return { pct, value };
      })
    : [];

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
          background: gradient,
          mb: 0.6,
        }}
      />

      {/* Labels */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.8 }}>
        {labels.map(({ pct, value }) => (
          <Typography
            key={pct}
            sx={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-sans)",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {formatLabel(value)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
