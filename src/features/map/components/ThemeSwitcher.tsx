"use client";

import { IconButton, Tooltip } from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAppTheme } from "@/src/core/theme/ThemeContext";
import { useTranslation } from "react-i18next";

const TOOLTIP_BG = "var(--color-panel)";
const TOOLTIP_SHADOW = "var(--color-background) 40% 0px 4px 24px";
const TOOLTIP_TEXT =
  "color-mix(in srgb, var(--color-foreground) 95%, transparent)";
const BORDER = "var(--color-border)";

const btnSx = {
  width: { xs: 40, md: 32 },
  height: { xs: 40, md: 32 },
  bgcolor: "color-mix(in srgb, var(--color-panel) 93%, transparent)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  color: "color-mix(in srgb, var(--color-foreground) 60%, transparent)",
  "&:hover": {
    color: "var(--color-foreground)",
    bgcolor:
      "color-mix(in srgb, var(--color-foreground) 15%, var(--color-panel))",
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

export default function ThemeSwitcher() {
  const { t } = useTranslation("common");

  const { theme, setTheme } = useAppTheme();

  const handleToggle = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("colorblind");
    else setTheme("dark");
  };

  const getIcon = () => {
    if (theme === "dark") return <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />;
    if (theme === "light")
      return <LightModeOutlinedIcon sx={{ fontSize: 18 }} />;
    return <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />;
  };

  const getTooltip = () => {
    if (theme === "dark") return t("map.themeSwitch.light");
    if (theme === "light") return t("map.themeSwitch.contrast");
    return t("map.themeSwitch.dark");
  };

  return (
    <Tooltip
      title={getTooltip()}
      placement="left"
      arrow
      slotProps={{ tooltip: { sx: tooltipSx } }}
    >
      <IconButton onClick={handleToggle} size="small" sx={btnSx}>
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
}
