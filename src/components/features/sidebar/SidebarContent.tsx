"use client";

import React from "react";
import Image from "next/image";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import {
  useMapControls,
  useFlowTracing,
  useSidebarSlot,
} from "@/src/components/features/sidebar/context/DashboardContext";

// ── Palette ────────────────────────────────────────────────────────────────
const BORDER = "rgba(255,255,255,0.08)";
const TEXT_DIM = "rgba(255,255,255,0.38)";
const TEXT_MID = "rgba(255,255,255,0.60)";
const TEXT_ON = "rgba(255,255,255,0.88)";
const ACCENT = "#94ce24";

// ── Section label ──────────────────────────────────────────────────────────
const sectionLabelSx = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  color: TEXT_DIM,
  fontFamily: "var(--font-sans)",
  mb: 1.5,
};

// ── MUI ToggleButtonGroup style ────────────────────────────────────────────
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
  },
};

// ── Apple-style toggle ─────────────────────────────────────────────────────
function AppleToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box
      onClick={() => onChange(!checked)}
      sx={{
        width: 44,
        height: 26,
        borderRadius: 13,
        bgcolor: checked ? ACCENT : "rgba(255,255,255,0.15)",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background-color 0.25s ease",
        "&:hover": { opacity: 0.9 },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          bgcolor: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          transition: "left 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </Box>
  );
}

// ── §1 Header ──────────────────────────────────────────────────────────────
function SidebarHeader() {
  return (
    <Box
      sx={{
        px: 2.5,
        pt: 2.5,
        pb: 2,
        borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}
    >
      <Image
        src="/images/wattnet-logo-full-dark-transparent.svg"
        alt="wattnet"
        width={150}
        height={50}
        priority
      />
      <Typography
        sx={{
          fontSize: 13,
          color: TEXT_MID,
          fontFamily: "var(--font-sans)",
          lineHeight: 1.6,
          mt: 1.25,
        }}
      >
        Interactive web dashboard for visualizing energy generation, CO₂
        emissions, and environmental footprint metrics.
      </Typography>
    </Box>
  );
}

// ── §2 Views ───────────────────────────────────────────────────────────────
function SidebarViews() {
  return (
    <Box
      sx={{
        px: 2.5,
        py: 2,
        borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}
    >
      <Typography sx={sectionLabelSx}>Views</Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.5,
          py: 1,
          borderRadius: "10px",
          bgcolor: "rgba(148,206,36,0.08)",
          border: `1px solid rgba(148,206,36,0.25)`,
          cursor: "default",
        }}
      >
        <MapIcon sx={{ fontSize: 16, color: ACCENT }} />
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: ACCENT,
            fontFamily: "var(--font-sans)",
          }}
        >
          Map
        </Typography>
      </Box>
    </Box>
  );
}

// ── §3 Options (scrollable) ────────────────────────────────────────────────
function SidebarOptions() {
  const { footprintType, setFootprintType, scope, setScope } = useMapControls();
  const { flowTracing, setFlowTracing } = useFlowTracing();
  const sidebarControls = useSidebarSlot();

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        px: 2.5,
        py: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2.75,
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}
    >
      <Typography sx={{ ...sectionLabelSx, mb: 0 }}>Options</Typography>

      {/* Date — injected by page.tsx */}
      {sidebarControls && <Box>{sidebarControls}</Box>}

      {/* Footprint Metric */}
      <Box>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: TEXT_DIM,
            fontFamily: "var(--font-sans)",
            mb: 1,
          }}
        >
          Footprint Metric
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={footprintType}
          onChange={(_, v) => v && setFootprintType(v)}
          sx={segmentedSx}
          fullWidth
        >
          <ToggleButton value="carbon">Carbon</ToggleButton>
          <ToggleButton value="water">Water</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Footprint Scope */}
      <Box>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: TEXT_DIM,
            fontFamily: "var(--font-sans)",
            mb: 1,
          }}
        >
          Footprint Scope
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={scope}
          onChange={(_, v) => v && setScope(v)}
          sx={segmentedSx}
          fullWidth
        >
          <ToggleButton value="life-cycle">Life-cycle</ToggleButton>
          <ToggleButton value="operational">Operational</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Flow Tracing */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_ON,
              fontFamily: "var(--font-sans)",
            }}
          >
            Flow Tracing
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: TEXT_DIM,
              fontFamily: "var(--font-sans)",
              mt: 0.3,
            }}
          >
            Track cross-border energy flows
          </Typography>
        </Box>
        <AppleToggle checked={flowTracing} onChange={setFlowTracing} />
      </Box>
    </Box>
  );
}

// ── §4 Funding ─────────────────────────────────────────────────────────────
function SidebarFunding() {
  return (
    <Box
      sx={{ px: 2.5, py: 2, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}
    >
      <Typography sx={sectionLabelSx}>Funding & Acknowledgments</Typography>
      <Typography
        sx={{
          fontSize: 12.5,
          color: TEXT_DIM,
          fontFamily: "var(--font-sans)",
          lineHeight: 1.25,
          mb: 1.75,
          textAlign: "justify",
        }}
      >
        This work is funded from the European Union's Horizon Europe research
        and innovation programme through the{" "}
        <Box
          component="a"
          href="https://greendigit.eu"
          target="_blank"
          rel="noopener"
          sx={{
            color: "#3a78e0",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          GreenDIGIT project
        </Box>
        , under the grant agreement No.{""}
        <Box
          component="a"
          href="https://cordis.europa.eu/project/id/101131207"
          target="_blank"
          rel="noopener"
          sx={{
            color: "#3a78e0",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          101131207
        </Box>
        .
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Image
          src="/images/EN_FundedbytheEU_RGB_POS.png"
          alt="Funded by the European Union"
          width={160}
          height={50}
          style={{ objectFit: "contain" }}
        />
        <Image
          src="/images/GreenDIGIT logo color horizontal2.png"
          alt="GreenDIGIT"
          width={130}
          height={50}
          style={{ objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}

// ── §5 Copyright — exported, rendered in layout bottom bar ────────────────
export function SidebarCopyright() {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography
        sx={{
          fontSize: 12.5,
          color: "rgb(201, 201, 201)",
          fontFamily: "var(--font-sans)",
          lineHeight: 2,
          paddingTop: 0.5,
          fontWeight: 600,
        }}
      >
        © 2026 Spanish National Research Council (CSIC)
      </Typography>
      <Typography
        sx={{
          fontSize: 12,
          color: "rgb(201, 201, 201)",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
          paddingBottom: 0.5,
        }}
      >
        All rights reserved.
      </Typography>
    </Box>
  );
}

// ── Full sidebar ───────────────────────────────────────────────────────────
export default function SidebarContent() {
  return (
    <>
      <SidebarHeader />
      <SidebarViews />
      <SidebarOptions />
      <SidebarFunding />
    </>
  );
}
