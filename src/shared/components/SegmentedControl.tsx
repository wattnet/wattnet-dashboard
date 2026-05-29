import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from "@mui/material";

// ── Palette ───────────────────────────────────────────
const BORDER = "var(--color-border)";
const TEXT_DIM = "color-mix(in srgb, var(--color-foreground) 70%, transparent)";
const TEXT_MID = "color-mix(in srgb, var(--color-foreground) 50%, transparent)";
const ACCENT = "var(--color-primary)";

const HOVER_BG = "color-mix(in srgb, var(--color-foreground) 5%, transparent)";
const DISABLED_TEXT =
  "color-mix(in srgb, var(--color-foreground) 25%, transparent)";
const DISABLED_BG =
  "color-mix(in srgb, var(--color-foreground) 5%, transparent)";
const DISABLED_BORDER =
  "color-mix(in srgb, var(--color-foreground) 10%, transparent)";

const TOOLTIP_BG = "var(--color-panel)";
const TOOLTIP_SHADOW = "var(--color-background) 40% 0px 4px 24px";
const TOOLTIP_TEXT =
  "color-mix(in srgb, var(--color-foreground) 95%, transparent)";

const segmentedSx = {
  width: "100%",
  "& .MuiToggleButtonGroup-grouped": {
    flex: 1,
    py: 0.75,
    fontSize: 13,
    fontWeight: 600,
    color: TEXT_MID,
    textTransform: "none",
    borderColor: `${BORDER} !important`,
    transition: "all 0.15s",
    "&.Mui-selected": {
      bgcolor: "color-mix(in srgb, var(--color-primary) 13%, transparent)",
      color: ACCENT,
      borderColor:
        "color-mix(in srgb, var(--color-primary) 40%, transparent) !important", // Corregido el typo de las comillas extra
      "&:hover": {
        bgcolor: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
      },
    },
    "&:hover:not(.Mui-selected)": { bgcolor: HOVER_BG },
    "&.Mui-disabled": {
      color: `${DISABLED_TEXT} !important`,
      bgcolor: DISABLED_BG,
      borderColor: `${DISABLED_BORDER} !important`,
    },
  },
};

const tooltipSx = {
  background: TOOLTIP_BG,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  p: 2,
  boxShadow: TOOLTIP_SHADOW,
  overflow: "hidden",
  fontSize: "14px",
  fontWeight: 500,
  color: TOOLTIP_TEXT,
  lineHeight: 1.2,
};

// ── Types ────────────────────────────────────────────────────────
export interface Option<T extends string> {
  value: T;
  label: string;
  tooltip?: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T | null;
  onChange: (value: T) => void;
  options: Option<T>[];
  disabled?: boolean;
}

// ── Component ───────────────────────────────────────────────────
export function SegmentedControl<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: Readonly<SegmentedControlProps<T>>) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 600,
          color: TEXT_DIM,
          mb: 1,
        }}
      >
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        value={value}
        onChange={(_, v) => v && onChange(v)}
        sx={segmentedSx}
        fullWidth
        disabled={disabled}
      >
        {options.map((opt) => {
          const button = (
            <ToggleButton
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </ToggleButton>
          );

          if (opt.tooltip) {
            return (
              <Tooltip
                key={opt.value}
                title={opt.tooltip}
                placement="top"
                slotProps={{ tooltip: { sx: tooltipSx } }}
              >
                {button}
              </Tooltip>
            );
          }

          return button;
        })}
      </ToggleButtonGroup>
    </Box>
  );
}
