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
import {
  DashboardProvider,
  useSidebar,
  useZonePanel,
  useBottomSheet,
  useCanvasRect,
} from "@/src/components/features/sidebar/context/DashboardContext";
import { useInteractionMode } from "@/src/hooks/useInteractionMode";

export const MOBILE_TOP_BAR_H = 48;
export const MOBILE_PEEK_H = 64;

const BORDER = "rgba(255,255,255,0.08)";
const BACKDROP = "blur(20px)";
const PANEL_BG = "rgba(11,18,30,0.88)";
const COLLAPSED_W = 56;
const SIDEBAR_W = 320;

const panelSx = {
  bgcolor: PANEL_BG,
  backdropFilter: BACKDROP,
  WebkitBackdropFilter: BACKDROP,
};

function SidebarContent() {
  return <Box sx={{ flex: 1 }} />;
}

function CollapseBtn({
  onClick,
  icon,
}: Readonly<{ onClick: () => void; icon: React.ReactNode }>) {
  return (
    <IconButton
      onClick={onClick}
      size="small"
      sx={{
        color: "rgba(255,255,255,0.35)",
        "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
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
          bgcolor: "rgba(255,255,255,0.15)",
        }}
      />
    </Box>
  );
}

// ── Shared zone data display ───────────────────────────────────────────────
function ZoneDataContent() {
  const { zoneData } = useZonePanel();
  if (!zoneData)
    return (
      <Typography
        sx={{
          fontSize: 12,
          color: "rgba(255,255,255,0.2)",
          fontFamily: "var(--font-sans)",
        }}
      >
        No data available.
      </Typography>
    );

  const valStr = zoneData.value != null ? zoneData.value.toFixed(1) : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {zoneData.date && (
        <Typography
          sx={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {zoneData.date}
        </Typography>
      )}
      <Box>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography
            sx={{
              fontSize: 36,
              fontWeight: 700,
              color: "#94ce24",
              lineHeight: 1,
              fontFamily: "var(--font-sans)",
            }}
          >
            {valStr}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {zoneData.unit}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            mt: 0.5,
            fontFamily: "var(--font-sans)",
          }}
        >
          {zoneData.label}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {zoneData.zoneStatus && (
          <Chip
            label={zoneData.zoneStatus}
            size="small"
            sx={{
              fontSize: 10,
              height: 22,
              bgcolor: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.5)",
              border: `1px solid ${BORDER}`,
            }}
          />
        )}
        {zoneData.valid !== undefined && (
          <Chip
            label={zoneData.valid ? "Valid" : "Invalid"}
            size="small"
            sx={{
              fontSize: 10,
              height: 22,
              bgcolor: zoneData.valid
                ? "rgba(148,206,36,0.12)"
                : "rgba(239,68,68,0.12)",
              color: zoneData.valid ? "#94ce24" : "#f87171",
              border: `1px solid ${zoneData.valid ? "rgba(148,206,36,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}
          />
        )}
      </Box>
    </Box>
  );
}

// ── Desktop sidebar ────────────────────────────────────────────────────────
function Sidebar({
  expandedWidth,
}: Readonly<{ expandedWidth: string | number }>) {
  const { sidebarCollapsed, toggleSidebar, expandSidebar } = useSidebar();
  const { zonePanelOpen, closeZonePanel } = useZonePanel();
  const theme = useTheme();
  // Tablet breakpoint still uses screen size for sidebar width — that's fine
  const isNarrow = useMediaQuery(theme.breakpoints.down("lg"));

  return (
    <Box
      component="aside"
      sx={{
        width: sidebarCollapsed ? `${COLLAPSED_W}px` : expandedWidth,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        ...panelSx,
        borderRight: `1px solid ${BORDER}`,
        height: "100vh",
        overflow: "hidden",
        transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 10,
      }}
    >
      {sidebarCollapsed ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2,
          }}
        >
          <Image
            src="/images/wattnet-logo-icon.png"
            alt="wattnet"
            width={28}
            height={28}
          />
          <CollapseBtn
            onClick={() => {
              if (isNarrow && zonePanelOpen) closeZonePanel();
              expandSidebar();
            }}
            icon={<ChevronRightIcon fontSize="small" />}
          />
        </Box>
      ) : (
        <>
          <SidebarContent />
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: `1px solid ${BORDER}`,
              display: "flex",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            <CollapseBtn
              onClick={toggleSidebar}
              icon={<ChevronLeftIcon fontSize="small" />}
            />
          </Box>
        </>
      )}
    </Box>
  );
}

// ── Desktop zone panel ─────────────────────────────────────────────────────
function ZonePanel({
  expandedWidth,
}: Readonly<{ expandedWidth: string | number }>) {
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
        display: "flex",
        flexDirection: "column",
        ...panelSx,
        borderLeft: `1px solid ${BORDER}`,
        height: "100vh",
        overflow: "hidden",
        transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex: 10,
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
            color: "rgba(255,255,255,0.85)",
            fontFamily: "var(--font-sans)",
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
          sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fff" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        <ZoneDataContent />
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

// ── Mobile: top sheet ──────────────────────────────────────────────────────
type TopSheetState = "collapsed" | "mid" | "full";
const TOP_SHEET_H: Record<TopSheetState, string> = {
  collapsed: `${MOBILE_TOP_BAR_H}px`,
  mid: "50vh",
  full: "90vh",
};
const TOP_STATES: TopSheetState[] = ["collapsed", "mid", "full"];

function MobileTopSheet({
  onCollapse,
  onExpand,
}: Readonly<{ onCollapse: () => void; onExpand: () => void }>) {
  const [state, setState] = React.useState<TopSheetState>("collapsed");
  const dragStartY = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    const idx = TOP_STATES.indexOf(state);
    if (delta < -40 && idx < TOP_STATES.length - 1) {
      setState(TOP_STATES[idx + 1]);
      onExpand();
    } else if (delta > 40 && idx > 0) {
      const next = TOP_STATES[idx - 1];
      setState(next);
      if (next === "collapsed") onCollapse();
    }
    dragStartY.current = null;
  };

  const isExpanded = state !== "collapsed";
  const handleToggle = () => {
    if (isExpanded) {
      setState("collapsed");
      onCollapse();
    } else {
      setState("mid");
      onExpand();
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: TOP_SHEET_H[state],
        ...panelSx,
        borderBottom: `1px solid ${BORDER}`,
        borderRadius: isExpanded ? "0 0 16px 16px" : 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
        <Image
          src="/images/wattnet-logo-full-dark-transparent.svg"
          alt="wattnet"
          width={100}
          height={30}
          priority
        />
        <CollapseBtn
          onClick={handleToggle}
          icon={
            isExpanded ? (
              <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
            ) : (
              <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
            )
          }
        />
      </Box>
      {isExpanded && (
        <>
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              px: 2,
              pt: 1,
              pb: 0,
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.1) transparent",
            }}
          >
            <SidebarContent />
          </Box>
          <DragHandle />
        </>
      )}
    </Box>
  );
}

// ── Mobile: bottom sheet ───────────────────────────────────────────────────
type BottomSheetState = "hidden" | "peek" | "mid" | "full";
const BOTTOM_SHEET_H: Record<BottomSheetState, string> = {
  hidden: "0px",
  peek: `${MOBILE_PEEK_H}px`,
  mid: "50vh",
  full: "90vh",
};
const BOTTOM_STATES: BottomSheetState[] = ["hidden", "peek", "mid", "full"];

function MobileBottomSheet({ onExpand }: Readonly<{ onExpand: () => void }>) {
  const { bottomSheetState, setBottomSheetState } = useBottomSheet();
  const { selectedZone, zonePanelOpen, openCount, closeZonePanel } =
    useZonePanel();
  const dragStartY = React.useRef<number | null>(null);

  // Open to mid directly so the value is immediately visible
  React.useEffect(() => {
    if (openCount > 0) setBottomSheetState("mid");
  }, [openCount, setBottomSheetState]);

  React.useEffect(() => {
    if (!zonePanelOpen) setBottomSheetState("hidden");
  }, [zonePanelOpen, setBottomSheetState]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.changedTouches[0].clientY;
    const idx = BOTTOM_STATES.indexOf(bottomSheetState as BottomSheetState);
    if (delta > 40 && idx < BOTTOM_STATES.length - 1) {
      setBottomSheetState(BOTTOM_STATES[idx + 1]);
      onExpand();
    } else if (delta < -40 && idx > 0)
      setBottomSheetState(BOTTOM_STATES[idx - 1]);
    dragStartY.current = null;
  };

  const isVisible = bottomSheetState !== "hidden";
  const isExpanded = bottomSheetState === "mid" || bottomSheetState === "full";

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_SHEET_H[bottomSheetState as BottomSheetState],
        ...panelSx,
        borderTop: isVisible ? `1px solid ${BORDER}` : "none",
        borderRadius: "16px 16px 0 0",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "height 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isVisible && <DragHandle />}
      {isVisible && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {selectedZone ?? ""}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isExpanded && (
              <IconButton
                onClick={closeZonePanel}
                size="small"
                sx={{
                  color: "rgba(255,255,255,0.3)",
                  "&:hover": { color: "#fff" },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <IconButton
              onClick={() => setBottomSheetState(isExpanded ? "peek" : "mid")}
              size="small"
              sx={{
                color: "rgba(255,255,255,0.3)",
                "&:hover": { color: "#fff" },
              }}
            >
              {isExpanded ? (
                <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
              ) : (
                <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Box>
        </Box>
      )}
      {isExpanded && (
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2,
            pt: 1.5,
            pb: 2,
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          <ZoneDataContent />
        </Box>
      )}
    </Box>
  );
}

// ── Mobile layout ──────────────────────────────────────────────────────────
function MobileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { setBottomSheetState } = useBottomSheet();
  const { zonePanelOpen } = useZonePanel();
  const [topSheetKey, setTopSheetKey] = React.useState(0);

  const handleTopSheetCollapse = React.useCallback(() => {
    if (zonePanelOpen) setBottomSheetState("mid");
  }, [zonePanelOpen, setBottomSheetState]);

  const handleTopSheetExpand = React.useCallback(() => {
    setBottomSheetState("hidden");
  }, [setBottomSheetState]);

  const handleBottomSheetExpand = React.useCallback(() => {
    setTopSheetKey((k) => k + 1);
  }, []);

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        bgcolor: "#0c1219",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box sx={{ position: "absolute", inset: 0 }}>{children}</Box>
      <MobileTopSheet
        key={topSheetKey}
        onCollapse={handleTopSheetCollapse}
        onExpand={handleTopSheetExpand}
      />
      <MobileBottomSheet onExpand={handleBottomSheetExpand} />
    </Box>
  );
}

// ── Root layout ────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
}

function DashboardLayoutInner({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isTouch } = useInteractionMode();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("lg"));

  // Touch device → mobile sheet layout regardless of screen size
  if (isTouch) return <MobileLayout>{children}</MobileLayout>;

  // Pointer device → desktop layout, sidebar width adapts to screen size
  const sidebarExpandedWidth = isNarrow ? "50vw" : `${SIDEBAR_W}px`;
  const zonePanelExpandedWidth = isNarrow ? "50vw" : "40vw";

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: "#0c1219",
      }}
    >
      <Sidebar expandedWidth={sidebarExpandedWidth} />
      <Canvas>{children}</Canvas>
      <ZonePanel expandedWidth={zonePanelExpandedWidth} />
    </Box>
  );
}
