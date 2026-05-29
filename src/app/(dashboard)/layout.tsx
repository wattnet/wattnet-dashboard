"use client";

import React from "react";
import Image from "next/image";
import {
  Box,
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
  useBottomSheet,
  useCanvasRect,
  useFlowTracing,
  useMapControls,
  useSidebar,
  useZonePanel,
} from "@/src/features/dashboard/store/useDashboardStore";
import { useAppTheme } from "@/src/core/theme/ThemeContext";

export const MOBILE_TOP_BAR_H = 48;
export const MOBILE_PEEK_H = 64;

// ── Palette ─────────────────────────────────────────────────────
const BORDER = "var(--color-border)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "var(--color-panel)";

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
const SIDEBAR_W = 400;
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
}: Readonly<{ onClick: () => void; icon: React.ReactNode }>) {
  return (
    <IconButton
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

  const valStr = zoneData.value != null ? zoneData.value.toFixed(1) : "—";

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
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
      {/* Left: value */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {zoneData.date && (
          <Typography
            sx={{
              fontSize: 14,
              color: TEXT_DIM,
            }}
          >
            {zoneData.date}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: 34,
              fontWeight: 700,
              color: "var(--color-primary)",
              lineHeight: 1,
            }}
          >
            {valStr}
          </Typography>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 500,
              color: TEXT_MID,
            }}
          >
            {zoneData.unit}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 14,
            color:
              "color-mix(in srgb, var(--color-foreground) 35%, transparent)",
          }}
        >
          {zoneData.label}
        </Typography>
      </Box>

      {/* Right: chips */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          flexShrink: 0,
          pt: 0.25,
        }}
      >
        <Chip
          size="small"
          label={finalLabel}
          sx={getChipSx(finalKey, colors)}
        />
        <Chip
          size="small"
          label={statusLabel}
          sx={getChipSx(statusKey, colors)}
        />
        <Chip
          size="small"
          label={scopeLabel}
          sx={getChipSx(scopeKey, colors)}
        />
        <Chip
          size="small"
          label={coverageLabel}
          sx={getChipSx(coverageKey, colors)}
        />
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
          />
        </Box>
      </Box>
    </Box>
  );
}

// ── Desktop zone panel ─────────────────────────────────────────────────────
function ZonePanel({ expandedWidth }: Readonly<{ expandedWidth: number }>) {
  const { zonePanelOpen, selectedZone, closeZonePanel } = useZonePanel();
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
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color:
                "color-mix(in srgb, var(--color-foreground) 85%, transparent)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedZone ?? ""}
          </Typography>
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
        <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
          <ZoneDataContent />
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
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: expanded ? "90vh" : `${MOBILE_TOP_BAR_H}px`,
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
          px: 2,
        }}
      >
        <Box
          sx={{
            display: "none",
            '[data-theme="dark"] &': { display: "block" },
          }}
        >
          <Image
            src="/images/wattnet-logo-full-dark-transparent.svg"
            alt="wattnet"
            width={100}
            height={30}
            priority
          />
        </Box>

        <Box
          sx={{
            display: "none",
            '[data-theme="light"] &': { display: "block" },
            '[data-theme="colorblind"] &': { display: "block" },
          }}
        >
          <Image
            src="/images/wattnet-logo-full-light-transparent.svg"
            alt="wattnet"
            width={100}
            height={30}
            priority
          />
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
        />
      </Box>

      {/* Content — full sheet scrollable */}
      {expanded && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <MobileSidebarContent />
        </Box>
      )}
    </Box>
  );
}

// ── Mobile bottom sheet ────────────────────────────────────────────────────
function MobileBottomSheet() {
  const { bottomSheetState, setBottomSheetState } = useBottomSheet();
  const { selectedZone, zonePanelOpen, openCount, closeZonePanel } =
    useZonePanel();
  const dragStartY = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (openCount > 0) setBottomSheetState("full");
  }, [openCount, setBottomSheetState]);

  React.useEffect(() => {
    if (!zonePanelOpen) setBottomSheetState("hidden");
  }, [zonePanelOpen, setBottomSheetState]);

  // Animate sheet closed first, then clean up panel state after transition
  const handleClose = React.useCallback(() => {
    setBottomSheetState("hidden");
    setTimeout(() => closeZonePanel(), 400);
  }, [setBottomSheetState, closeZonePanel]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    if (delta < -40 && bottomSheetState === "full") {
      handleClose();
    }
    dragStartY.current = null;
  };

  const isVisible = bottomSheetState !== "hidden";

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: isVisible ? "90vh" : "0px",
        ...panelSx,
        borderTop: isVisible ? `1px solid ${BORDER}` : "none",
        borderRadius: "16px 16px 0 0",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: `height ${DURATION} ${EASING}`,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isVisible && (
        <>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              pt: 1.5,
              pb: 1,
              flexShrink: 0,
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color:
                  "color-mix(in srgb, var(--color-foreground) 85%, transparent)",
              }}
            >
              {selectedZone ?? ""}
            </Typography>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color:
                  "color-mix(in srgb, var(--color-foreground) 30%, transparent)",
                "&:hover": { color: "var(--color-foreground)" },
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {/* Scrollable content */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2,
              pt: 2,
              pb: 3,
            }}
          >
            <ZoneDataContent />
          </Box>
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

// ── Root layout ────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>;
}

function DashboardLayoutInner({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isNarrow = useMediaQuery(theme.breakpoints.down("lg"));

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          bgcolor: "var(--color-background)",
          position: "relative",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        <Background />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--color-panel)",
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
      </Box>
    );
  }

  if (isMobile) return <MobileLayout>{children}</MobileLayout>;

  const sidebarExpandedWidth = isNarrow
    ? Math.round(window.innerWidth * 0.5)
    : SIDEBAR_W;
  const zonePanelExpandedWidth = isNarrow
    ? Math.round(window.innerWidth * 0.5)
    : 380;

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
