"use client";

import { Box, Typography } from "@mui/material";

// ── Shared segmented control ───────────────────────────────────────────────
interface SegmentedControlProps {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}

function SegmentedControl({ options, selected, onChange }: SegmentedControlProps) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        p: 0.375,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {options.map((opt) => {
        const isActive = selected === opt.value;
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              flex: 1,
              textAlign: "center",
              px: 1,
              py: 0.625,
              borderRadius: 1.5,
              cursor: "pointer",
              bgcolor: isActive ? "rgba(163,230,53,0.13)" : "transparent",
              border: isActive
                ? "1px solid rgba(163,230,53,0.25)"
                : "1px solid transparent",
              color: isActive ? "#a3e635" : "rgba(255,255,255,0.38)",
              transition: "all 0.15s",
              "&:hover": {
                color: isActive ? "#a3e635" : "rgba(255,255,255,0.65)",
              },
            }}
          >
            <Typography sx={{ fontSize: 11, fontWeight: isActive ? 500 : 400, lineHeight: 1 }}>
              {opt.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Section label ──────────────────────────────────────────────────────────
const SECTION_LABEL_SX = {
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.28)",
  mb: 0.75,
};

// ── FootprintTypeSelector ──────────────────────────────────────────────────
interface FootprintTypeSelectorProps {
  selectedFootprintType: string;
  setSelectedFootprintType: (type: string) => void;
}

export function FootprintTypeSelector({
  selectedFootprintType,
  setSelectedFootprintType,
}: FootprintTypeSelectorProps) {
  return (
    <Box sx={{ mb: 1.75 }}>
      <Typography sx={SECTION_LABEL_SX}>Metric</Typography>
      <SegmentedControl
        options={[
          { value: "carbon", label: "Carbon" },
          { value: "water", label: "Water" },
        ]}
        selected={selectedFootprintType}
        onChange={setSelectedFootprintType}
      />
    </Box>
  );
}

// ── ScopeSelector ──────────────────────────────────────────────────────────
interface ScopeSelectorProps {
  selectedScope: string;
  setSelectedScope: (scope: string) => void;
}

export function ScopeSelector({ selectedScope, setSelectedScope }: ScopeSelectorProps) {
  return (
    <Box sx={{ mb: 1.75 }}>
      <Typography sx={SECTION_LABEL_SX}>Scope</Typography>
      <SegmentedControl
        options={[
          { value: "operational", label: "Operation" },
          { value: "life-cycle", label: "Life-cycle" },
        ]}
        selected={selectedScope}
        onChange={setSelectedScope}
      />
    </Box>
  );
}
