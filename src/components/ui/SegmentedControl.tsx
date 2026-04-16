import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
} from "@mui/material";

const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255, 255, 255, 0.7)";
const TEXT_MID = "rgba(255, 255, 255, 0.5)";
const ACCENT = "#94ce24";

const segmentedSx = {
  width: "100%",
  "& .MuiToggleButtonGroup-grouped": {
    flex: 1,
    py: 0.75,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
    color: TEXT_MID,
    textTransform: "none",
    borderColor: `${BORDER} !important`,
    transition: "all 0.15s",
    "&.Mui-selected": {
      bgcolor: "rgba(148,206,36,0.13)",
      color: ACCENT,
      borderColor: `rgba(148,206,36,0.4) !important`,
      "&:hover": { bgcolor: "rgba(148,206,36,0.2)" },
    },
    "&:hover:not(.Mui-selected)": { bgcolor: "rgba(255,255,255,0.05)" },
    "&.Mui-disabled": {
      color: "rgba(255,255,255,0.2) !important",
      bgcolor: "rgba(0,0,0,0.1)",
      borderColor: "rgba(255,255,255,0.05) !important",
    },
  },
};

const tooltipSx = {
  background: "rgba(10,16,28,0.85)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: "12px",
  p: 2,
  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  fontFamily: '"Red Hat Text", system-ui, sans-serif',
  overflow: "hidden",
  fontSize: "14px",
  fontWeight: 500,
  color: "rgba(255, 255, 255, 0.92)",
  lineHeight: 1.2,
};

// ── Types ────────────────────────────────────────────────────────
export interface Option<T extends string> {
  value: T;
  label: string;
  tooltip?: string;
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
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12.5,
          fontWeight: 600,
          color: TEXT_DIM,
          fontFamily: "var(--font-sans)",
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
            <ToggleButton key={opt.value} value={opt.value}>
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
