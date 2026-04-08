"use client";
import LanguageIcon from "@mui/icons-material/Language";
import GitHubIcon from "@mui/icons-material/GitHub";
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
import packageInfo from "@/package.json";

// ── Palette ────────────────────────────────────────────────────────────────
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255, 255, 255, 0.7)";
const TEXT_MID = "rgba(255, 255, 255, 0.5)";
const TEXT_ON = "rgba(255,255,255,0.9)";
const ACCENT = "#94ce24";

// ── Section label ──────────────────────────────────────────────────────────
const sectionLabelSx = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  color: TEXT_DIM,
  fontFamily: "var(--font-display)",
  mb: 1.25,
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
    "&.Mui-disabled": {
      color: "rgba(255,255,255,0.2) !important",
      bgcolor: "rgba(0,0,0,0.1)",
      borderColor: "rgba(255,255,255,0.05) !important",
    },
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

// ── Shared links bar ───────────────────────────────────────────────────────
function LinksBar() {
  const links = [
    {
      label: "wattnet.eu",
      icon: <LanguageIcon sx={{ fontSize: 16 }} />,
      href: "https://wattnet.eu",
    },
    {
      label: "github.com/wattnet",
      icon: <GitHubIcon sx={{ fontSize: 16 }} />,
      href: "https://github.com/wattnet",
    },
  ];
  return (
    <Box
      sx={{
        display: "flex",
        borderRadius: 1.5,
        border: `1px solid rgba(255,255,255,0.07)`,
        bgcolor: "rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      {links.map((link, idx) => (
        <Box
          key={link.label}
          component="a"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            px: 1,
            py: 0.625,
            cursor: "pointer",
            color: "rgba(255,255,255,0.55)",
            textDecoration: "none",
            transition: "all 0.2s ease",
            borderLeft: idx === 0 ? "none" : `1px solid rgba(255,255,255,0.07)`,
            "&:hover": { color: ACCENT, bgcolor: "rgba(163,230,53,0.13)" },
          }}
        >
          {link.icon}
          <Typography
            sx={{
              paddingLeft: 0.25,
              fontSize: 12,
              lineHeight: 1,
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {link.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── Shared options body (no scroll wrapper) ────────────────────────────────
function OptionsBody() {
  const { metric, setMetric, dimension, setDimension, scope, setScope } =
    useMapControls();
  const { flowTracing, setFlowTracing } = useFlowTracing();
  const sidebarControls = useSidebarSlot();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.75 }}>
      <Typography sx={{ ...sectionLabelSx, mb: 0 }}>Options</Typography>

      {sidebarControls && <Box>{sidebarControls}</Box>}

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
          Environmental Metric
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={metric}
          onChange={(_, v) => v && setMetric(v)}
          sx={segmentedSx}
          fullWidth
        >
          <ToggleButton value="footprint">Footprint</ToggleButton>
          <ToggleButton value="impact">Impact</ToggleButton>
          <ToggleButton value="green-score">Green Score</ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
          Environmental Dimension
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={dimension}
          onChange={(_, v) => v && setDimension(v)}
          sx={segmentedSx}
          fullWidth
          disabled={metric === "green-score"}
        >
          <ToggleButton value="carbon">Carbon</ToggleButton>
          <ToggleButton value="water">Water</ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
          Assessment Scope
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
              fontSize: 12.5,
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

// ── Shared funding body ────────────────────────────────────────────────────
function FundingBody() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Typography sx={sectionLabelSx}>Funding & Acknowledgments</Typography>
      <Typography
        sx={{
          fontSize: 12.15,
          color: TEXT_DIM,
          fontFamily: "var(--font-sans)",
          lineHeight: 1.25,
          textAlign: "justify",
          fontWeight: 400,
        }}
      >
        This dashboard is provided by CSIC. The work is funded from the European
        Union's Horizon Europe research and innovation programme through the{" "}
        <Box
          component="a"
          href="https://greendigit-project.eu/"
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
        , under the grant agreement No.{" "}
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
          mt: 1.25,
        }}
      >
        <Image
          src="/images/EN_FundedbytheEU_RGB_POS.png"
          alt="Funded by the European Union"
          width={150}
          height={50}
          style={{ objectFit: "contain" }}
        />
        <Image
          src="/images/GreenDIGIT logo color horizontal2.png"
          alt="GreenDIGIT"
          width={125}
          height={50}
          style={{ objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}

// ── §1 Header (desktop only) ───────────────────────────────────────────────
export function SidebarHeader() {
  return (
    <Box
      sx={{
        px: 2.5,
        pt: 1.75,
        pb: 2,
        borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0,
        position: "relative",
      }}
    >
      <Image
        src="/images/wattnet-logo-full-dark-transparent.svg"
        alt="wattnet"
        width={160}
        height={50}
        priority
      />

      <Box
        component="a"
        href="https://github.com/wattnet/wattnet-dashboard/releases"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          bgcolor: ACCENT,
          color: "#0B1C38",
          px: 1.25,
          py: 0.25,
          borderRadius: "99px",
          fontSize: 10.5,
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          textDecoration: "none",
          cursor: "pointer",
          "&:hover": {
            opacity: 0.85,
          },
        }}
      >
        v{packageInfo.version}
      </Box>

      <Typography
        sx={{
          fontSize: 12.75,
          color: TEXT_DIM,
          fontFamily: "var(--font-sans)",
          lineHeight: 1.5,
          mt: 0.75,
          fontWeight: 500,
        }}
      >
        Interactive web dashboard for visualizing energy generation, CO₂
        emissions, and environmental footprint metrics.
      </Typography>

      <Box sx={{ mt: 1.75 }}>
        <LinksBar />
      </Box>
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
          borderRadius: "5px",
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

// ── §3 Options (desktop — scrollable with mask) ────────────────────────────
function SidebarOptions() {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        px: 2.5,
        py: 2,
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 24px, black calc(100% - 24px), transparent 100%)",
        // ── Custom Scrollbar Style ──
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          borderRadius: "10px",
          border: "2px solid transparent",
          backgroundClip: "padding-box",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.3)",
        },
      }}
    >
      <OptionsBody />
    </Box>
  );
}

// ── §4 Funding (desktop) ───────────────────────────────────────────────────
function SidebarFunding() {
  return (
    <Box
      sx={{ px: 2.5, py: 2, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}
    >
      <FundingBody />
    </Box>
  );
}

// ── §5 Copyright ───────────────────────────────────────────────────────────
export function SidebarCopyright() {
  return (
    <Box
      sx={{ flex: 1, pl: 0.5, pb: 0.75 }}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="flex-start"
    >
      <Typography
        sx={{
          fontSize: 11,
          color: "rgb(201,201,201)",
          fontFamily: "var(--font-sans)",
          lineHeight: 1.35,
          pt: 0.75,
          fontWeight: 500,
        }}
      >
        <Box
          component="a"
          href="https://advancedcomputing.ifca.es/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "#3a78e0",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
            fontWeight: 600,
          }}
        >
          IFCA Advanced Computing and e-Science Group
        </Box>
        <br />
        © 2026 Spanish National Research Council (CSIC)
        <br />
        All rights reserved.
      </Typography>
    </Box>
  );
}

// ── Mobile sidebar content (no logo, flat scroll) ─────────────────────────
export function MobileSidebarContent() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Description + badge */}
      <Box sx={{ px: 2.5, pt: 2, pb: 2, borderBottom: `1px solid ${BORDER}` }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 12.75,
              color: TEXT_DIM,
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
              fontWeight: 500,
              flex: 1,
            }}
          >
            Interactive web dashboard for visualizing energy generation, CO₂
            emissions, and environmental footprint metrics.
          </Typography>
          <Box
            component="a"
            href="https://github.com/wattnet/wattnet-dashboard/releases"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              flexShrink: 0,
              bgcolor: ACCENT,
              color: "#0B1C38",
              px: 1.25,
              py: 0.25,
              borderRadius: "99px",
              fontSize: 10.5,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              mt: 0.25,
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": {
                opacity: 0.85,
              },
            }}
          >
            v{packageInfo.version}
          </Box>
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <LinksBar />
        </Box>
      </Box>

      {/* Views */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
        <Typography sx={sectionLabelSx}>Views</Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 1.5,
            py: 1,
            borderRadius: "5px",
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

      {/* Options — flat, no scroll wrapper */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
        <OptionsBody />
      </Box>

      {/* Funding */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${BORDER}` }}>
        <FundingBody />
      </Box>

      {/* Copyright */}
      <Box sx={{ px: 2.5, py: 2 }}>
        <Typography
          sx={{
            fontSize: 12,
            color: "rgb(201,201,201)",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          <Box
            component="a"
            href="https://advancedcomputing.ifca.es/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "#3a78e0",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
              fontWeight: 600,
            }}
          >
            IFCA Advanced Computing and e-Science Group
          </Box>
          <br />
          © 2026 Spanish National Research Council (CSIC)
          <br />
          All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

// ── Desktop full sidebar ───────────────────────────────────────────────────
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
