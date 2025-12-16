"use client";

import { Typography } from "@mui/material";

interface LegendProps {
  title: string;
  unitOfMeasure: string;
  min: number;
  max: number;
  step: number;
  colors: string[];
}

export default function Legend({
  title,
  unitOfMeasure,
  min,
  max,
  step,
  colors,
}: LegendProps) {
  const labels: number[] = [];
  for (let i = min; i <= max; i += step) {
    labels.push(i);
  }

  return (
    <div className="absolute bottom-0 right-0 mb-3 mr-3 z-20 bg-white p-2 rounded shadow">
      {/* Title */}
      <Typography variant="body2" gutterBottom>
        {title} ({unitOfMeasure})
      </Typography>

      {/* Gradient bar */}
      <div
        className="h-4 rounded"
        style={{
          background: `linear-gradient(to right, ${colors.join(", ")})`,
          height: "16px",
        }}
      />

      {/* Labels */}
      <div className="flex justify-between space-between text-xs mt-1">
        {labels.map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
    </div>
  );
}
