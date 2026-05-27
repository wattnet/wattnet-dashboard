"use client";

import { IconButton, Tooltip } from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAppTheme } from "@/src/core/theme/ThemeContext";
import { useTranslation } from "react-i18next";

const btnSx = {
  width: 32,
  height: 32,
  bgcolor: "var(--color-panel)",
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
    <Tooltip title={getTooltip()} placement="left" arrow>
      <IconButton onClick={handleToggle} size="small" sx={btnSx}>
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
}
