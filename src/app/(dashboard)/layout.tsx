"use client";

import React from "react";
import Image from "next/image";
import {
  Box,
  Fade,
  IconButton,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import SidebarContent, {
  SidebarCopyright,
  MobileSidebarContent,
} from "@/src/features/sidebar/components/SidebarContent";
import {
  useDashboardStore,
  useBottomSheet,
  useCanvasRect,
  useFlowTracing,
  useFlowPanel,
  useMapControls,
  useSidebar,
  useZonePanel,
  useZoneChart,
} from "@/src/features/dashboard/store/useDashboardStore";
import { useAppTheme } from "@/src/core/theme/ThemeContext";
import { formatDatasource } from "@/src/shared/utils/datasource";

export const MOBILE_TOP_BAR_H = 48;
export const MOBILE_PEEK_H = 240;

// ── Palette ─────────────────────────────────────────────────────
const BORDER = "var(--color-border)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "color-mix(in srgb, var(--color-panel) 93%, transparent)";

const BTN_COLOR =
  "color-mix(in srgb, var(--color-foreground) 35%, transparent)";
const BTN_HOVER_COLOR = "var(--color-foreground)";
const BTN_HOVER_BG =
  "color-mix(in srgb, var(--color-foreground) 6%, transparent)";
const TEXT_DIM = "color-mix(in srgb, var(--color-foreground) 30%, transparent)";
const TEXT_MID = "color-mix(in srgb, var(--color-foreground) 40%, transparent)";
const DRAG_HANDLE =
  "color-mix(in srgb, var(--color-foreground) 15%, transparent)";

const COLLAPSED_W = 56;
const SIDEBAR_W = 445;
const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION = "0.4s";

const panelSx = {
  bgcolor: PANEL_BG,
  backdropFilter: BACKDROP,
  WebkitBackdropFilter: BACKDROP,
};

// ── Background blobs ───────────────────────────────────────────────────────
function Background() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1440"
      height="1024"
      fill="none"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        filter: "blur(100px)",
        pointerEvents: "none",
        userSelect: "none",
      }}
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        fill="url(#wn-bg-a)"
        fillRule="evenodd"
        clipRule="evenodd"
        style={{ opacity: 0.154 }}
        d="M-217.58 475.75c91.82-72.02 225.52-29.38 341.2-44.74C240 415.56 372.33 315.14 466.77 384.9c102.9 76.02 44.74 246.76 90.31 366.31 29.83 78.24 90.48 136.14 129.48 210.23 57.92 109.99 169.67 208.23 155.9 331.77-13.52 121.26-103.42 264.33-224.23 281.37-141.96 20.03-232.72-220.96-374.06-196.99-151.7 25.73-172.68 330.24-325.85 315.72-128.6-12.2-110.9-230.73-128.15-358.76-12.16-90.14 65.87-176.25 44.1-264.57-26.42-107.2-167.12-163.46-176.72-273.45-10.15-116.29 33.01-248.75 124.87-320.79Z"
      />
      <path
        fill="url(#wn-bg-b)"
        fillRule="evenodd"
        clipRule="evenodd"
        style={{ opacity: 0.154 }}
        d="M1103.43 115.43c146.42-19.45 275.33-155.84 413.5-103.59 188.09 71.13 409 212.64 407.06 413.88-1.94 201.25-259.28 278.6-414.96 405.96-130 106.35-240.24 294.39-405.6 265.3-163.7-28.8-161.93-274.12-284.34-386.66-134.95-124.06-436-101.46-445.82-284.6-9.68-180.38 247.41-246.3 413.54-316.9 101.01-42.93 207.83 21.06 316.62 6.61Z"
      />
      <defs>
        <linearGradient
          id="wn-bg-a"
          x1="107.37"
          x2="1130.66"
          y1="1993.35"
          y2="1026.31"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-primary)" />
          <stop offset="1" stopColor="var(--color-secondary)" />
        </linearGradient>
        <linearGradient
          id="wn-bg-b"
          x1="373"
          x2="1995.44"
          y1="1100"
          y2="118.03"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-secondary)" />
          <stop offset="1" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Shared chip config ─────────────────────────────────────────────────────
const getChipStyles = (colors: Record<string, string>) => ({
  final: {
    bg: `color-mix(in srgb, ${colors.final} 13%, transparent)`,
    color: colors.final,
    border: `color-mix(in srgb, ${colors.final} 35%, transparent)`,
  },
  notFinal: {
    bg: `color-mix(in srgb, ${colors.notFinal} 13%, transparent)`,
    color: colors.notFinal,
    border: `color-mix(in srgb, ${colors.notFinal} 35%, transparent)`,
  },
  complete: {
    bg: `color-mix(in srgb, ${colors.complete} 12%, transparent)`,
    color: colors.complete,
    border: `color-mix(in srgb, ${colors.complete} 30%, transparent)`,
  },
  preview: {
    bg: `color-mix(in srgb, ${colors.preview} 12%, transparent)`,
    color: colors.preview,
    border: `color-mix(in srgb, ${colors.preview} 30%, transparent)`,
  },
  forecasted: {
    bg: `color-mix(in srgb, ${colors.forecasted} 12%, transparent)`,
    color: colors.forecasted,
    border: `color-mix(in srgb, ${colors.forecasted} 40%, transparent)`,
    dashed: true,
  },
  missing: {
    bg: `color-mix(in srgb, ${colors.missing} 8%, transparent)`,
    color: `color-mix(in srgb, ${colors.missing} 70%, transparent)`,
    border: `color-mix(in srgb, ${colors.missing} 22%, transparent)`,
  },
  neutral: {
    bg: `color-mix(in srgb, ${colors.neutral} 5%, transparent)`,
    color: `color-mix(in srgb, ${colors.neutral} 38%, transparent)`,
    border: `color-mix(in srgb, ${colors.neutral} 10%, transparent)`,
  },
  lifecycle: {
    bg: `color-mix(in srgb, ${colors.lifecycle} 10%, transparent)`,
    color: colors.lifecycle,
    border: `color-mix(in srgb, ${colors.lifecycle} 25%, transparent)`,
  },
  operational: {
    bg: `color-mix(in srgb, ${colors.operational} 10%, transparent)`,
    color: colors.operational,
    border: `color-mix(in srgb, ${colors.operational} 25%, transparent)`,
  },
  global: {
    bg: `color-mix(in srgb, ${colors.global} 9%, transparent)`,
    color: `color-mix(in srgb, ${colors.global} 85%, transparent)`,
    border: `color-mix(in srgb, ${colors.global} 25%, transparent)`,
  },
  local: {
    bg: `color-mix(in srgb, ${colors.local} 5%, transparent)`,
    color: `color-mix(in srgb, ${colors.local} 40%, transparent)`,
    border: `color-mix(in srgb, ${colors.local} 10%, transparent)`,
  },
});

type ChipKey = keyof ReturnType<typeof getChipStyles>;

function getChipSx(key: ChipKey, colors: Record<string, string>) {
  const styles = getChipStyles(colors);
  const c = styles[key];
  return {
    fontSize: 12,
    fontWeight: 600,
    height: 24,
    bgcolor: c.bg,
    color: c.color,
    border: `1px ${"dashed" in c && c.dashed ? "dashed" : "solid"} ${c.border}`,
    borderRadius: "99px",
    "& .MuiChip-label": { px: 1.1 },
  };
}

// ── CollapseBtn / DragHandle ───────────────────────────────────────────────
function CollapseBtn({
  onClick,
  icon,
  ariaLabel = "Colapsar panel",
  ariaExpanded,
}: Readonly<{
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}>) {
  return (
    <IconButton
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      size="small"
      sx={{
        color: BTN_COLOR,
        "&:hover": { color: BTN_HOVER_COLOR, bgcolor: BTN_HOVER_BG },
      }}
    >
      {icon}
    </IconButton>
  );
}

function DragHandle() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        py: 1,
        flexShrink: 0,
        cursor: "grab",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 4,
          borderRadius: 2,
          bgcolor: DRAG_HANDLE,
        }}
      />
    </Box>
  );
}

// ── ZoneDataContent ────────────────────────────────────────────────────────
function ZoneDataContent() {
  const { zoneData } = useZonePanel();
  const { scope } = useMapControls();
  const { flowTracing } = useFlowTracing();

  const { currentPalette } = useAppTheme();
  const colors = currentPalette.chipColors;

  if (!zoneData)
    return (
      <Typography
        sx={{
          fontSize: 13,
          color: TEXT_DIM,
        }}
      >
        No data available.
      </Typography>
    );

  const valStr = zoneData.value != null ? zoneData.value.toFixed(2) : "—";

  // 1. Final / Not Final
  const finalKey: ChipKey = zoneData.valid ? "final" : "notFinal";
  const finalLabel = zoneData.valid ? "Final" : "Not Final";

  // 2. Zone status — "missing" → "Forecasted" when isForecast is set
  const raw = zoneData.zoneStatus ?? "";
  let statusKey: ChipKey = "neutral";
  let statusLabel = raw || "—";
  if (raw === "complete") {
    statusKey = "complete";
    statusLabel = "Complete";
  } else if (raw === "preview") {
    statusKey = "preview";
    statusLabel = "Preview";
  } else if (raw === "missing" && zoneData.isForecast) {
    statusKey = "forecasted";
    statusLabel = "Forecasted";
  } else if (raw === "missing") {
    statusKey = "missing";
    statusLabel = "Missing";
  }

  // 3. Scope
  const scopeKey: ChipKey =
    scope === "life-cycle" ? "lifecycle" : "operational";
  const scopeLabel = scope === "life-cycle" ? "Life-cycle" : "Operational";

  // 4. Coverage
  const coverageKey: ChipKey = flowTracing ? "global" : "local";
  const coverageLabel = flowTracing ? "Global" : "Local";

  return (
    <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
      {/* Left: data */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {zoneData.date && (
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: TEXT_DIM,
              letterSpacing: "0.03em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
              mb: 1.5,
            }}
          >
            {zoneData.date}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography
            sx={{
              fontSize: 36,
              fontWeight: 700,
              color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {valStr}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: TEXT_MID, lineHeight: 1 }}>
            {zoneData.unit}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 14,
            color: "color-mix(in srgb, var(--color-foreground) 50%, transparent)",
            lineHeight: 1,
            mt: 1.25,
          }}
        >
          {zoneData.label}
        </Typography>
      </Box>

      {/* Right: chips */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0, pt: 0.25 }}>
        <Chip size="small" label={finalLabel} sx={getChipSx(finalKey, colors)} />
        <Chip size="small" label={statusLabel} sx={getChipSx(statusKey, colors)} />
        <Chip size="small" label={scopeLabel} sx={getChipSx(scopeKey, colors)} />
        <Chip size="small" label={coverageLabel} sx={getChipSx(coverageKey, colors)} />
      </Box>
    </Box>
  );
}


const TEXT_LOW = "color-mix(in srgb, var(--color-foreground) 28%, transparent)";

// ── Flow data content ──────────────────────────────────────────────────────
function FlowDataContent() {
  const { flowPanelData } = useFlowPanel();
  const { scope } = useMapControls();
  const { flowTracing } = useFlowTracing();
  const { currentPalette } = useAppTheme();
  const colors = currentPalette.chipColors;

  if (!flowPanelData)
    return (
      <Typography sx={{ fontSize: 13, color: TEXT_DIM }}>
        No data available.
      </Typography>
    );

  if (flowPanelData.noData) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: TEXT_DIM, letterSpacing: "0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums", mb: 2 }}>
          {flowPanelData.datetime}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 10, pt: "6px", pb: "6px" }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
            <Box sx={{ flex: 1, minHeight: 14, width: 1.5, bgcolor: "color-mix(in srgb, var(--color-foreground) 18%, transparent)", my: "4px" }} />
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1.25, flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                {flowPanelData.srcName}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: TEXT_DIM, lineHeight: 1, flexShrink: 0 }}>
                ({flowPanelData.srcZone})
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                {flowPanelData.destName}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: TEXT_DIM, lineHeight: 1, flexShrink: 0 }}>
                ({flowPanelData.destZone})
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ height: "1px", bgcolor: BORDER, mb: 2 }} />

        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "color-mix(in srgb, var(--color-foreground) 55%, transparent)" }}>
          Power Exchange Data Not Yet Available
        </Typography>
      </Box>
    );
  }

  const finalKey: ChipKey = flowPanelData.valid ? "final" : "notFinal";
  const finalLabel = flowPanelData.valid ? "Final" : "Not Final";

  const raw = flowPanelData.zoneStatus;
  let statusKey: ChipKey = "neutral";
  let statusLabel = raw || "—";
  if (raw === "complete") { statusKey = "complete"; statusLabel = "Complete"; }
  else if (raw === "preview") { statusKey = "preview"; statusLabel = "Preview"; }
  else if (raw === "missing" && flowPanelData.isForecast) { statusKey = "forecasted"; statusLabel = "Forecasted"; }
  else if (raw === "missing") { statusKey = "missing"; statusLabel = "Missing"; }

  const dataStateKey: ChipKey =
    flowPanelData.dataState === "official" ? "complete" :
    flowPanelData.dataState === "estimated" ? "preview" : "neutral";
  const dataStateLabel =
    flowPanelData.dataState === "official" ? "Official" :
    flowPanelData.dataState === "estimated" ? "Estimated" : null;

  const scopeKey: ChipKey = scope === "life-cycle" ? "lifecycle" : "operational";
  const scopeLabel = scope === "life-cycle" ? "Life-cycle" : "Operational";
  const coverageKey: ChipKey = flowTracing ? "global" : "local";
  const coverageLabel = flowTracing ? "Global" : "Local";

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Datetime */}
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: TEXT_DIM, letterSpacing: "0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums", mb: 2 }}>
        {flowPanelData.datetime}
      </Typography>

      {/* Zones + animated connector — same structure as the desktop hover
          tooltip in FlowArrows.tsx (dot/line/chevron/line/dot in one flex
          column), so the line stays visibly continuous through the chevron
          instead of relying on a separately-positioned overlay. The adjacent
          name column uses justifyContent: space-between (which the tooltip
          doesn't need, since it isn't height-constrained by a parent sheet)
          so its two rows stay flush with the connector's top/bottom dots. */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 10, pt: "6px", pb: "6px" }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
          <Box sx={{ flex: 1, minHeight: 6, width: 1.5, bgcolor: "color-mix(in srgb, var(--color-foreground) 18%, transparent)", my: "4px" }} />
          <Box component="svg" viewBox="0 0 8 12" fill="none" sx={{ width: 8, height: 12, flexShrink: 0 }}>
            <path d="M1 1L4 4.5L7 1" stroke="color-mix(in srgb, var(--color-foreground) 32%, transparent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <animate attributeName="opacity" values="0.15;1;0.15" dur="1.2s" begin="0s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
            </path>
            <path d="M1 7L4 10.5L7 7" stroke="color-mix(in srgb, var(--color-foreground) 32%, transparent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <animate attributeName="opacity" values="0.15;1;0.15" dur="1.2s" begin="0.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1" />
            </path>
          </Box>
          <Box sx={{ flex: 1, minHeight: 6, width: 1.5, bgcolor: "color-mix(in srgb, var(--color-foreground) 18%, transparent)", my: "4px" }} />
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "color-mix(in srgb, var(--color-foreground) 35%, transparent)", flexShrink: 0 }} />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1.25, flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
              {flowPanelData.srcName}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: TEXT_DIM, lineHeight: 1, flexShrink: 0 }}>
              ({flowPanelData.srcZone})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, fontWeight: 600, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
              {flowPanelData.destName}
            </Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 500, color: TEXT_DIM, lineHeight: 1, flexShrink: 0 }}>
              ({flowPanelData.destZone})
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* MW value + label */}
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.75 }}>
        <Typography sx={{ fontSize: 36, fontWeight: 700, color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {flowPanelData.mw.toFixed(2)}
        </Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: TEXT_MID, lineHeight: 1 }}>MW</Typography>
      </Box>
      <Typography sx={{ fontSize: 14, color: "color-mix(in srgb, var(--color-foreground) 50%, transparent)", lineHeight: 1, mb: flowPanelData.metricValue !== null ? 1.75 : 2.5 }}>
        Power exchange
      </Typography>

      {/* Metric value */}
      {flowPanelData.metricValue !== null && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: flowPanelData.color, border: "1px solid rgba(0,0,0,0.2)", flexShrink: 0 }} />
          <Typography sx={{ fontSize: 13, color: TEXT_DIM, lineHeight: 1.3 }}>
            {"with a "}
            <Box component="strong" sx={{ color: "color-mix(in srgb, var(--color-foreground) 85%, transparent)", fontVariantNumeric: "tabular-nums", fontSize: 14 }}>
              {flowPanelData.metricValue.toFixed(2)} {flowPanelData.metricUnit}
            </Box>
            {" "}{flowPanelData.metricTitle.toLowerCase()}
          </Typography>
        </Box>
      )}

      {/* Divider */}
      <Box sx={{ height: "1px", bgcolor: BORDER, mb: 2 }} />

      {/* ENERGY chips */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_LOW, textTransform: "uppercase", mb: 1 }}>
          Energy
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <Chip size="small" label={finalLabel} sx={getChipSx(finalKey, colors)} />
          <Chip size="small" label={statusLabel} sx={getChipSx(statusKey, colors)} />
          {dataStateLabel && <Chip size="small" label={dataStateLabel} sx={getChipSx(dataStateKey, colors)} />}
          {flowPanelData.datasource && (
            <Chip size="small" label={formatDatasource(flowPanelData.datasource)} sx={getChipSx("neutral", colors)} />
          )}
        </Box>
      </Box>

      {/* ENVIRONMENTAL chips */}
      <Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: TEXT_LOW, textTransform: "uppercase", mb: 1 }}>
          Environmental
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <Chip size="small" label={coverageLabel} sx={getChipSx(coverageKey, colors)} />
          <Chip size="small" label={scopeLabel} sx={getChipSx(scopeKey, colors)} />
        </Box>
      </Box>
    </Box>
  );
}

// ── Desktop sidebar ────────────────────────────────────────────────────────
function Sidebar({ expandedWidth }: Readonly<{ expandedWidth: number }>) {
  const { sidebarCollapsed, toggleSidebar, expandSidebar } = useSidebar();
  const { zonePanelOpen, closeZonePanel } = useZonePanel();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("lg"));
  const outerW = sidebarCollapsed ? COLLAPSED_W : expandedWidth;

  return (
    <Box
      component="aside"
      sx={{
        width: outerW,
        flexShrink: 0,
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        transition: `width ${DURATION} ${EASING}`,
        zIndex: 10,
        ...panelSx,
        borderRight: `1px solid ${BORDER}`,
      }}
    >
      {/* Collapsed strip — in outer, never slides */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: COLLAPSED_W,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2,
          zIndex: 2,
          opacity: sidebarCollapsed ? 1 : 0,
          transition: "opacity 0.15s",
          pointerEvents: sidebarCollapsed ? "auto" : "none",
        }}
      >
        <Image
          src="/images/wattnet-logo-icon-color-transparent.svg"
          alt="wattnet"
          width={40}
          height={40}
        />
        <CollapseBtn
          onClick={() => {
            if (isNarrow && zonePanelOpen) closeZonePanel();
            expandSidebar();
          }}
          icon={<ChevronRightIcon fontSize="small" />}
          ariaLabel="Expandir barra lateral"
        />
      </Box>

      {/* Inner — fixed width, slides via translateX */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: expandedWidth,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          transform: sidebarCollapsed
            ? `translateX(${COLLAPSED_W - expandedWidth}px)`
            : "translateX(0)",
          transition: `transform ${DURATION} ${EASING}`,
          willChange: "transform",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            opacity: sidebarCollapsed ? 0 : 1,
            transition: "opacity 0.15s",
            pointerEvents: sidebarCollapsed ? "none" : "auto",
          }}
        >
          <SidebarContent />
        </Box>
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: 1,
            opacity: sidebarCollapsed ? 0 : 1,
            transition: "opacity 0.15s",
            pointerEvents: sidebarCollapsed ? "none" : "auto",
          }}
        >
          <SidebarCopyright />
          <CollapseBtn
            onClick={toggleSidebar}
            icon={<ChevronLeftIcon fontSize="small" />}
            ariaLabel="Colapsar barra lateral"
          />
        </Box>
      </Box>
    </Box>
  );
}

function niceYAxis(lo: number, hi: number, targetTicks = 4) {
  const rawRange = hi - lo || 1;
  const pad = rawRange * 0.12;
  const paddedLo = lo - pad;
  const paddedHi = hi + pad;
  const range = paddedHi - paddedLo;
  const roughStep = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const norm = roughStep / mag;
  const niceNorm = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  const step = niceNorm * mag;
  const yMin = Math.floor(paddedLo / step) * step;
  const yMax = Math.ceil(paddedHi / step) * step;
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + step * 0.001; t += step) {
    ticks.push(Math.round(t * 1e9) / 1e9);
  }
  return { yMin, yMax, ticks, step };
}

// ── Zone chart ────────────────────────────────────────────────────────────
function ZoneChart() {
  const { zoneSeries, zoneSeriesIndex } = useZoneChart();
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(300);

  const hasSeries = !!zoneSeries && zoneSeries.length >= 2;

  React.useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [hasSeries]);

  if (!hasSeries) return null;

  const H = 180;
  const PAD = { t: 16, r: 20, b: 30, l: 46 };
  const plotW = w - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const n = zoneSeries.length;

  const vals = zoneSeries
    .map((s) => s.value)
    .filter((v): v is number => v !== null);
  if (vals.length < 2) return null;

  const dataMin = Math.min(...vals);
  const dataMax = Math.max(...vals);

  const { yMin, yMax, ticks: yTicks, step: yStep } = niceYAxis(dataMin, dataMax);
  const rangeV = yMax - yMin;

  const xOf = (i: number) => PAD.l + (i / (n - 1)) * plotW;
  const yOf = (v: number) => PAD.t + (1 - (v - yMin) / rangeV) * plotH;

  const yDecimals = Math.max(0, -Math.floor(Math.log10(yStep)));
  const fmtVal = (v: number) => {
    if (Math.abs(v) >= 1000) {
      const k = v / 1000;
      return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
    }
    return yDecimals === 0 ? Math.round(v).toString() : v.toFixed(yDecimals);
  };

  // Build path segments (skip null gaps)
  const segments: { line: string; firstX: number; lastX: number }[] = [];
  let cmds: string[] = [];
  let firstX = 0;
  let lastX = 0;

  for (let i = 0; i < n; i++) {
    const v = zoneSeries[i].value;
    if (v === null) {
      if (cmds.length) { segments.push({ line: cmds.join(""), firstX, lastX }); cmds = []; }
    } else {
      const x = xOf(i); const y = yOf(v);
      if (!cmds.length) { firstX = x; cmds.push(`M${x.toFixed(1)},${y.toFixed(1)}`); }
      else cmds.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
      lastX = x;
    }
  }
  if (cmds.length) segments.push({ line: cmds.join(""), firstX, lastX });

  const linePath = segments.map((s) => s.line).join(" ");
  const areaPath = segments
    .map((s) =>
      `${s.line}L${s.lastX.toFixed(1)},${(H - PAD.b).toFixed(1)}L${s.firstX.toFixed(1)},${(H - PAD.b).toFixed(1)}Z`,
    )
    .join(" ");

  // Day separators (every 96 slots = 1 day)
  const daySeps: number[] = [];
  for (let i = 96; i < n; i += 96) daySeps.push(xOf(i));

  // X axis labels: dates for multi-day, hour marks for single day
  const fmtDate = (ts: string) => {
    const d = new Date(ts);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = String(d.getUTCFullYear()).slice(2);
    return `${day}/${month}/${year}`;
  };
  const xLabels: { x: number; label: string; anchor: "start" | "middle" | "end" }[] = [];
  if (n > 96) {
    for (let i = 96; i < n; i += 96) {
      const ts = zoneSeries[i]?.timestamp;
      if (ts) xLabels.push({ x: xOf(i), label: fmtDate(ts), anchor: "middle" });
    }
  } else {
    xLabels.push(
      { x: xOf(0), label: "0h", anchor: "start" },
      { x: xOf(Math.round((n - 1) / 2)), label: "12h", anchor: "middle" },
      { x: xOf(n - 1), label: "24h", anchor: "end" },
    );
  }

  // Current position
  const curX = xOf(Math.min(zoneSeriesIndex, n - 1));
  const curV = zoneSeries[Math.min(zoneSeriesIndex, n - 1)]?.value;
  const curY = curV != null ? yOf(curV) : null;

  const axisColor = "var(--color-foreground)";
  const axisOpacity = 0.3;
  const labelOpacity = 0.4;

  return (
    <Box
      ref={wrapRef}
      sx={{ width: "100%", mt: 2.5, pt: 2, borderTop: `1px solid ${BORDER}` }}
    >
      <Typography
        sx={{
          fontSize: 10.5,
          fontWeight: 600,
          color: TEXT_DIM,
          letterSpacing: "0.08em",
          mb: 1,
          px: 2.5,
        }}
      >
        TREND
      </Typography>
      <svg width={w} height={H} style={{ display: "block" }}>
        <defs>
          <linearGradient id="wn-zc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y gridlines + labels */}
        {yTicks.map((t) => {
          const y = yOf(t);
          if (y < PAD.t - 2 || y > H - PAD.b + 2) return null;
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y} x2={w - PAD.r} y2={y}
                stroke={axisColor} strokeWidth={0.5} strokeOpacity={0.1} />
              <text x={PAD.l - 5} y={y} textAnchor="end" dominantBaseline="middle"
                fontSize={12} fill={axisColor} fillOpacity={labelOpacity}>
                {fmtVal(t)}
              </text>
            </g>
          );
        })}

        {/* X axis baseline */}
        <line x1={PAD.l} y1={H - PAD.b} x2={w - PAD.r} y2={H - PAD.b}
          stroke={axisColor} strokeWidth={0.5} strokeOpacity={axisOpacity} />

        {/* Day separators */}
        {daySeps.map((x, i) => (
          <line key={i} x1={x} y1={PAD.t} x2={x} y2={H - PAD.b}
            stroke={axisColor} strokeWidth={0.5} strokeOpacity={0.12} />
        ))}

        {/* X axis labels */}
        {xLabels.map(({ x, label, anchor }, i) => (
          <text key={i} x={x} y={H - PAD.b + 5} textAnchor={anchor}
            dominantBaseline="hanging" fontSize={13} fill={axisColor} fillOpacity={labelOpacity}>
            {label}
          </text>
        ))}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#wn-zc-fill)" />}

        {/* Line */}
        {linePath && (
          <path d={linePath} fill="none"
            stroke="var(--color-primary)" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Current position marker */}
        <line x1={curX} y1={PAD.t} x2={curX} y2={H - PAD.b}
          stroke={axisColor} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="3,2" />
        {curY !== null && (
          <circle cx={curX} cy={curY} r={4}
            fill="var(--color-primary)" stroke={PANEL_BG} strokeWidth={2} />
        )}
      </svg>
    </Box>
  );
}

// ── Desktop zone panel ─────────────────────────────────────────────────────
function ZonePanel({ expandedWidth }: Readonly<{ expandedWidth: number }>) {
  const { zonePanelOpen, selectedZone, zoneData, closeZonePanel } = useZonePanel();
  const { collapseSidebar } = useSidebar();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("lg"));

  React.useEffect(() => {
    if (isNarrow && zonePanelOpen) collapseSidebar();
  }, [isNarrow, zonePanelOpen, collapseSidebar]);

  return (
    <Box
      sx={{
        width: zonePanelOpen ? expandedWidth : 0,
        flexShrink: 0,
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        transition: `width ${DURATION} ${EASING}`,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: expandedWidth,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          ...panelSx,
          borderLeft: `1px solid ${BORDER}`,
          transform: zonePanelOpen
            ? "translateX(0)"
            : `translateX(${expandedWidth}px)`,
          transition: `transform ${DURATION} ${EASING}`,
          willChange: "transform",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${BORDER}`,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0, overflow: "hidden" }}>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.2,
              }}
            >
              {selectedZone ?? ""}
            </Typography>
            {zoneData?.zoneCode && (
              <Typography
                component="span"
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "color-mix(in srgb, var(--color-foreground) 45%, transparent)",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                ({zoneData.zoneCode})
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={closeZonePanel}
            size="small"
            sx={{
              color:
                "color-mix(in srgb, var(--color-foreground) 40%, transparent)",
              "&:hover": { color: "var(--color-foreground)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <Box sx={{ p: 2.5 }}>
            <ZoneDataContent />
          </Box>
          <ZoneChart />
        </Box>
      </Box>
    </Box>
  );
}

// ── Canvas ─────────────────────────────────────────────────────────────────
function Canvas({ children }: Readonly<{ children: React.ReactNode }>) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const { setCanvasRect } = useCanvasRect();
  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const publish = () => {
      const r = el.getBoundingClientRect();
      setCanvasRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setCanvasRect]);
  return (
    <Box
      ref={canvasRef}
      component="main"
      sx={{
        flex: 1,
        minWidth: 0,
        position: "relative",
        bgcolor: "transparent",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {children}
    </Box>
  );
}

// ── Mobile top sheet ───────────────────────────────────────────────────────
function MobileTopSheet({
  expanded,
  onCollapse,
  onExpand,
}: Readonly<{
  expanded: boolean;
  onCollapse: () => void;
  onExpand: () => void;
}>) {
  const dragStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    if (delta < -40 && expanded) onCollapse();
    else if (delta > 40 && !expanded) onExpand();
    dragStartY.current = null;
  };

  const handleToggle = () => (expanded ? onCollapse() : onExpand());

  return (
    <Box
      role="region"
      aria-label="Menú de navegación"
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: expanded ? "100vh" : `${MOBILE_TOP_BAR_H}px`,
        ...panelSx,
        borderBottom: `1px solid ${BORDER}`,
        borderRadius: expanded ? "0 0 16px 16px" : 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: `height ${DURATION} ${EASING}`,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Bar — always visible */}
      <Box
        sx={{
          height: MOBILE_TOP_BAR_H,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pl: 0.5,
        pr: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "10px" }}>
          <Image
            src="/images/wattnet-logo-icon-color-transparent.svg"
            alt="wattnet"
            width={32}
            height={32}
            priority
            style={{ display: "block" }}
          />
          <Box
            component="span"
            sx={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.01em",
              color: "var(--color-foreground)",
              lineHeight: 1,
              mb: "2px",
            }}
          >
            wattnet
          </Box>
        </Box>

        <CollapseBtn
          onClick={handleToggle}
          icon={
            expanded ? (
              <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
            ) : (
              <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
            )
          }
          ariaLabel={expanded ? "Contraer menú" : "Expandir menú"}
          ariaExpanded={expanded}
        />
      </Box>

      {/* Content — always mounted so the Portal slot exists in DOM */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: expanded ? "block" : "none",
        }}
      >
        <MobileSidebarContent />
      </Box>
    </Box>
  );
}

// ── Mobile bottom sheet ────────────────────────────────────────────────────
function MobileBottomSheet() {
  const { bottomSheetState, setBottomSheetState } = useBottomSheet();
  const { selectedZone, zoneData, zonePanelOpen, openCount, closeZonePanel } = useZonePanel();
  const { flowPanelOpen, flowPanelData, closeFlowPanel } = useFlowPanel();
  const dragStartY = React.useRef<number | null>(null);
  const dragRaf = React.useRef<number | null>(null);
  const pendingDragY = React.useRef<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const isFlow = flowPanelOpen;
  const isZone = zonePanelOpen;
  const isVisible = bottomSheetState !== "hidden";

  React.useEffect(() => {
    if (openCount > 0) setBottomSheetState("peek");
  }, [openCount, setBottomSheetState]);

  React.useEffect(() => {
    if (!zonePanelOpen && !flowPanelOpen) setBottomSheetState("hidden");
  }, [zonePanelOpen, flowPanelOpen, setBottomSheetState]);

  const handleClose = React.useCallback(() => {
    setBottomSheetState("hidden");
    setTimeout(() => {
      closeZonePanel();
      closeFlowPanel();
    }, 400);
  }, [setBottomSheetState, closeZonePanel, closeFlowPanel]);

  // Close on Escape for keyboard users, matching the swipe-down/close-button paths.
  React.useEffect(() => {
    if (!isVisible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isVisible, handleClose]);

  const flushDrag = React.useCallback(() => {
    dragRaf.current = null;
    if (pendingDragY.current === null || dragStartY.current === null) return;
    const raw = pendingDragY.current - dragStartY.current;
    // Free-following drag downward (dismiss gesture); a light rubber-band cue upward,
    // since the sheet can't actually grow past its current target height mid-gesture.
    setDragOffset(raw > 0 ? Math.min(raw, 600) : Math.max(raw * 0.25, -20));
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    pendingDragY.current = e.touches[0].clientY;
    if (dragRaf.current === null) {
      dragRaf.current = requestAnimationFrame(flushDrag);
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    if (dragRaf.current !== null) {
      cancelAnimationFrame(dragRaf.current);
      dragRaf.current = null;
    }
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    if (delta < -40) {
      // The flow panel has no distinct "peek" height (it always opens full), so a
      // single swipe-down should close it directly instead of requiring two swipes.
      if (isFlow) handleClose();
      else if (bottomSheetState === "full") setBottomSheetState("peek");
      else if (bottomSheetState === "peek") handleClose();
    } else if (delta > 40 && bottomSheetState === "peek" && isZone) {
      setBottomSheetState("full");
    }
    dragStartY.current = null;
    pendingDragY.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleHandleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (isFlow) {
      handleClose();
      return;
    }
    setBottomSheetState(bottomSheetState === "full" ? "peek" : "full");
  };

  const sheetHeight = (() => {
    if (bottomSheetState === "hidden") return "0px";
    if (isFlow)
      return flowPanelData?.noData ? "min(280px, 60vh)" : "min(520px, 88vh)";
    if (bottomSheetState === "full") return "85vh";
    return `${MOBILE_PEEK_H}px`;
  })();

  const headerTitle = isFlow
    ? (flowPanelData ? `${flowPanelData.srcZone} → ${flowPanelData.destZone}` : "")
    : (selectedZone ?? "");
  const headerSubtitle = isFlow ? null : (zoneData?.zoneCode ?? null);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-hidden={!isVisible}
      aria-label={headerTitle || "Panel de datos"}
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: sheetHeight,
        ...panelSx,
        borderTop: isVisible ? `1px solid ${BORDER}` : "none",
        borderRadius: "16px 16px 0 0",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        paddingBottom: "env(safe-area-inset-bottom)",
        transform: `translateY(${dragOffset}px)`,
        transition: isDragging
          ? "none"
          : `height ${DURATION} ${EASING}, transform 0.3s ${EASING}`,
      }}
    >
      {isVisible && (
        <>
          {/* Drag region — handle + header. Kept separate from the scrollable
              content below it so swiping to scroll the trend chart doesn't get
              misread as a resize/dismiss gesture. */}
          <Box
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            sx={{ flexShrink: 0 }}
          >
            {/* Drag handle */}
            <Box
              role="button"
              tabIndex={0}
              aria-label={
                isFlow
                  ? "Cerrar panel"
                  : bottomSheetState === "full"
                    ? "Contraer panel"
                    : "Expandir panel"
              }
              onKeyDown={handleHandleKeyDown}
              sx={{
                display: "flex",
                justifyContent: "center",
                pt: 0.75,
                pb: 0.5,
                cursor: "grab",
              }}
            >
              <Box sx={{ width: 36, height: 3, borderRadius: 2, bgcolor: "rgba(255,255,255,0.18)" }} />
            </Box>

            {/* Header */}
            <Box
              role={bottomSheetState === "peek" && isZone ? "button" : undefined}
              tabIndex={bottomSheetState === "peek" && isZone ? 0 : undefined}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                pt: 0.75,
                pb: 1,
                borderBottom: `1px solid ${BORDER}`,
                cursor: bottomSheetState === "peek" && isZone ? "pointer" : "default",
              }}
              onClick={bottomSheetState === "peek" && isZone ? () => setBottomSheetState("full") : undefined}
              onKeyDown={
                bottomSheetState === "peek" && isZone
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setBottomSheetState("full");
                      }
                    }
                  : undefined
              }
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "color-mix(in srgb, var(--color-foreground) 92%, transparent)",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {headerTitle}
                </Typography>
                {headerSubtitle && (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "color-mix(in srgb, var(--color-foreground) 45%, transparent)",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ({headerSubtitle})
                  </Typography>
                )}
              </Box>
              <IconButton
                aria-label="Cerrar panel"
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                size="small"
                sx={{
                  color: "color-mix(in srgb, var(--color-foreground) 30%, transparent)",
                  "&:hover": { color: "var(--color-foreground)" },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Data content — always visible */}
          <Box sx={{ px: 2.5, pt: 2, pb: 2, flexShrink: 0 }}>
            {isFlow ? <FlowDataContent /> : <ZoneDataContent />}
          </Box>

          {/* Trend chart — zone full state only */}
          {bottomSheetState === "full" && isZone && (
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <ZoneChart />
              <Box sx={{ height: 24 }} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

// ── Mobile layout ──────────────────────────────────────────────────────────
function MobileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { setBottomSheetState } = useBottomSheet();
  const { zonePanelOpen } = useZonePanel();
  const [topExpanded, setTopExpanded] = React.useState(false);

  const handleTopExpand = React.useCallback(() => {
    setTopExpanded(true);
    setBottomSheetState("hidden"); // hide bottom when top opens
  }, [setBottomSheetState]);

  const handleTopCollapse = React.useCallback(() => {
    setTopExpanded(false);
    if (zonePanelOpen) setBottomSheetState("full"); // restore bottom if zone was open
  }, [zonePanelOpen, setBottomSheetState]);

  // When bottom sheet opens (zone tapped), collapse top sheet
  React.useEffect(() => {
    if (zonePanelOpen && topExpanded) {
      setTopExpanded(false);
    }
  }, [zonePanelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        bgcolor: "var(--color-background)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Background />
      <Box sx={{ position: "absolute", inset: 0 }}>{children}</Box>
      <MobileTopSheet
        expanded={topExpanded}
        onExpand={handleTopExpand}
        onCollapse={handleTopCollapse}
      />
      <MobileBottomSheet />
    </Box>
  );
}

// ── Initial loader — stable sibling, never recreated by layout changes ──────
function FullscreenLoader() {
  const initialDataReady = useDashboardStore((s) => s.initialDataReady);
  return (
    <Fade in={!initialDataReady} timeout={200} unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          backgroundColor: "color-mix(in srgb, var(--color-panel) 93%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <Box
          component="img"
          src="/images/wattnet-loader.svg"
          alt="Loading..."
          sx={{ width: 150, height: 150 }}
        />
      </Box>
    </Fade>
  );
}

// ── Root layout ────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <FullscreenLoader />
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </>
  );
}

function DashboardLayoutInner({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isNarrow = useMediaQuery(theme.breakpoints.down("lg"));
  const { sidebarCollapsed } = useSidebar();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isMobile) return <MobileLayout>{children}</MobileLayout>;

  const sidebarExpandedWidth = isNarrow
    ? Math.round(window.innerWidth * 0.5)
    : SIDEBAR_W;
  const sidebarCurrentWidth = sidebarCollapsed ? COLLAPSED_W : sidebarExpandedWidth;
  const zonePanelExpandedWidth = Math.round((window.innerWidth - sidebarCurrentWidth) / 2);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "var(--color-background)",
      }}
    >
      <Background />
      <Sidebar expandedWidth={sidebarExpandedWidth} />
      <Canvas>{children}</Canvas>
      <ZonePanel expandedWidth={zonePanelExpandedWidth} />
    </Box>
  );
}
