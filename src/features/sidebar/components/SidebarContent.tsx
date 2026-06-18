"use client";
import LanguageIcon from "@mui/icons-material/Language";
import GitHubIcon from "@mui/icons-material/GitHub";
import Image from "next/image";
import { Box, Typography } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";

import packageInfo from "@/package.json";
import { SegmentedControl } from "../../../shared/components/SegmentedControl";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import {
  useMapControls,
  useFlowTracing,
} from "../../dashboard/store/useDashboardStore";

// ── Palette ─────────────────────────────────────────────────────
const BORDER = "var(--color-border)";
const TEXT_DIM = "color-mix(in srgb, var(--color-foreground) 70%, transparent)";
const TEXT_ON = "color-mix(in srgb, var(--color-foreground) 90%, transparent)";
const ACCENT = "var(--color-primary)";

const TOGGLE_BG =
  "color-mix(in srgb, var(--color-foreground) 15%, transparent)";
const TOGGLE_DOT = "var(--color-background)";
const LINK_BG = "color-mix(in srgb, var(--color-foreground) 4%, transparent)";
const LINK_BORDER =
  "color-mix(in srgb, var(--color-foreground) 7%, transparent)";
const LINK_TEXT =
  "color-mix(in srgb, var(--color-foreground) 55%, transparent)";
const LINK_HOVER_BG =
  "color-mix(in srgb, var(--color-secondary) 13%, transparent)";
const ACCENT_TEXT = "var(--color-background)";
const VIEW_BG = "color-mix(in srgb, var(--color-primary) 8%, transparent)";
const VIEW_BORDER = "color-mix(in srgb, var(--color-primary) 25%, transparent)";
const COPYRIGHT_TEXT =
  "color-mix(in srgb, var(--color-foreground) 75%, transparent)";

// ── Section label ──────────────────────────────────────────────────────────
const sectionLabelSx = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  color: TEXT_DIM,
  mb: 1.25,
};

// ── Apple-style toggle ─────────────────────────────────────────────────────
function AppleToggle({
  checked,
  onChange,
}: Readonly<{
  checked: boolean;
  onChange: (v: boolean) => void;
}>) {
  return (
    <Box
      onClick={() => onChange(!checked)}
      sx={{
        width: 44,
        height: 26,
        borderRadius: 13,
        bgcolor: checked ? ACCENT : TOGGLE_BG,
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
          bgcolor: TOGGLE_DOT,
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
        border: `1px solid ${LINK_BORDER}`,
        bgcolor: LINK_BG,
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
            color: LINK_TEXT,
            textDecoration: "none",
            transition: "all 0.2s ease",
            borderLeft: idx === 0 ? "none" : `1px solid ${LINK_BORDER}`,
            "&:hover": {
              color: "var(--color-secondary)",
              bgcolor: LINK_HOVER_BG,
            },
          }}
        >
          {link.icon}
          <Typography
            sx={{
              paddingLeft: 0.25,
              fontSize: 12,
              lineHeight: 1,
              fontWeight: 500,
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
  const { t } = useTranslation("common");
  const { metric, setMetric, dimension, setDimension, scope, setScope } =
    useMapControls();
  const { flowTracing, setFlowTracing } = useFlowTracing();

  useEffect(() => {
    if (metric === "impact") {
      setDimension("water");
      setScope("operational");
    } else if (metric == "green-score") {
      setScope("operational");
    }
  }, [metric, dimension, scope, flowTracing]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.75 }}>
      <Typography sx={{ ...sectionLabelSx, mb: 0 }}>
        {t("sidebar.options.title")}
      </Typography>

      <Box id="desktop-sidebar-controls-slot" />

      <SegmentedControl
        label={t("sidebar.options.metric.label")}
        value={metric}
        onChange={setMetric}
        options={[
          {
            value: "footprint",
            label: t("sidebar.options.metric.footprint.label"),
            tooltip: t("sidebar.options.metric.footprint.tooltip"),
          },
          {
            value: "impact",
            label: t("sidebar.options.metric.impact.label"),
            tooltip: t("sidebar.options.metric.impact.tooltip"),
          },
          {
            value: "green-score",
            label: t("sidebar.options.metric.greenScore.label"),
            tooltip: t("sidebar.options.metric.greenScore.tooltip"),
          },
        ]}
      />

      <SegmentedControl
        label={t("sidebar.options.dimension.title")}
        value={dimension}
        onChange={setDimension}
        disabled={metric === "green-score"}
        options={[
          {
            value: "carbon",
            label: t("sidebar.options.dimension.carbon.label"),
            tooltip: t("sidebar.options.dimension.carbon.tooltip"),
            disabled: metric === "impact",
          },
          {
            value: "water",
            label: t("sidebar.options.dimension.water.label"),
            tooltip: t("sidebar.options.dimension.water.tooltip"),
          },
        ]}
      />

      <SegmentedControl
        label={t("sidebar.options.scope.title")}
        value={scope}
        onChange={setScope}
        disabled={metric === "green-score"}
        options={[
          {
            value: "life-cycle",
            label: t("sidebar.options.scope.lifeCycle.label"),
            tooltip: t("sidebar.options.scope.lifeCycle.tooltip"),
            disabled: metric === "impact",
          },
          {
            value: "operational",
            label: t("sidebar.options.scope.operational.label"),
            tooltip: t("sidebar.options.scope.operational.tooltip"),
          },
        ]}
      />
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
            }}
          >
            {t("sidebar.options.flowTracing.title")}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: TEXT_DIM,
              mt: 0.3,
            }}
          >
            {t("sidebar.options.flowTracing.subtitle")}
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
          lineHeight: 1.25,
          textAlign: "justify",
          fontWeight: 400,
        }}
      >
        This dashboard is provided by CSIC. The work is funded from the
        European Union's Horizon Europe research and innovation programme through
        the{" "}
        <Box
          component="a"
          href="https://greendigit-project.eu/"
          target="_blank"
          rel="noopener"
          sx={{
            color: "var(--color-secondary)",
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
            color: "var(--color-secondary)",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          101131207
        </Box>
        , as well as the Swiss State Secretariat for Education, Research and
        Innovation (SERI).
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 1.5,
        }}
      >
        {/* EU logo + Swiss flag grouped on the left */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Image
            src="/images/EN_FundedbytheEU_RGB_POS.png"
            alt="Funded by the European Union"
            width={150}
            height={50}
            style={{ objectFit: "contain" }}
          />
          <Image
            src="/images/Flag_of_Switzerland.svg"
            alt="Swiss State Secretariat for Education, Research and Innovation (SERI)"
            width={27}
            height={27}
            style={{ objectFit: "contain" }}
          />
        </Box>
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
      <Box
        sx={{
          display: "none",
          '[data-theme="dark"] &': { display: "block" },
        }}
      >
        <Image
          src="/images/wattnet-logo-full-dark-transparent.svg"
          alt="wattnet"
          width={160}
          height={50}
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
          width={160}
          height={50}
          priority
        />
      </Box>

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
          color: ACCENT_TEXT,
          px: 1.25,
          py: 0.25,
          borderRadius: "99px",
          fontSize: 10.5,
          fontWeight: 600,
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
          lineHeight: 1.5,
          mt: 0.75,
          fontWeight: 500,
        }}
      >
        Interactive dashboard to explore electricity-related CO₂ emissions,
        water footprint, and sustainability metrics across Europe.
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
          bgcolor: VIEW_BG,
          border: `1px solid ${VIEW_BORDER}`,
          cursor: "default",
        }}
      >
        <MapIcon sx={{ fontSize: 16, color: ACCENT }} />
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: ACCENT,
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
          color: COPYRIGHT_TEXT,
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
            color: "var(--color-secondary)",
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
              lineHeight: 1.5,
              fontWeight: 500,
              flex: 1,
            }}
          >
            Interactive dashboard to explore electricity-related CO₂ emissions,
            water footprint, and sustainability metrics across Europe.
          </Typography>
          <Box
            component="a"
            href="https://github.com/wattnet/wattnet-dashboard/releases"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              flexShrink: 0,
              bgcolor: ACCENT,
              color: ACCENT_TEXT,
              px: 1.25,
              py: 0.25,
              borderRadius: "99px",
              fontSize: 10.5,
              fontWeight: 600,
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
            bgcolor: VIEW_BG,
            border: `1px solid ${VIEW_BORDER}`,
            cursor: "default",
          }}
        >
          <MapIcon sx={{ fontSize: 16, color: ACCENT }} />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: ACCENT,
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
            color: COPYRIGHT_TEXT,
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
              color: "var(--color-secondary)",
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
