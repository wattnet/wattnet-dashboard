"use client";

import { Box, Typography, Slider, Popover } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { normalizeToUTCDate } from "@/src/utils/dateManager";
import { ProcessedFootprint } from "@/src/types/footprints";

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedTimeIndex: number;
  setSelectedTimeIndex: (index: number) => void;
  data: ProcessedFootprint[];
}

// ── Palette (mirrors SidebarContent) ──────────────────────────────────────
const BORDER = "rgba(255,255,255,0.1)";
const TEXT_DIM = "rgba(255,255,255,0.7)";
const TEXT_MID = "rgba(255,255,255,0.5)";
const TEXT_ON = "rgba(255,255,255,0.9)";
const ACCENT = "#94ce24";

// ── Shared label style (mirrors sectionLabelSx) ────────────────────────────
const sectionLabelSx = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.09em",
  textTransform: "uppercase" as const,
  color: TEXT_DIM,
  fontFamily: "var(--font-display)",
  mb: 1.25,
};

// ── Sub-label (mirrors "Footprint Metric" label style) ─────────────────────
const subLabelSx = {
  fontSize: 12.5,
  fontWeight: 600,
  color: TEXT_DIM,
  fontFamily: "var(--font-sans)",
  mb: 1,
};

export default function DateSelector({
  selectedDate,
  setSelectedDate,
  selectedTimeIndex,
  setSelectedTimeIndex,
  data,
}: DateSelectorProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const maxIndex = useMemo(() => (data?.[0]?.series?.length ?? 1) - 1, [data]);

  const marks = useMemo(() => {
    const series = data?.[0]?.series ?? [];
    return series
      .map((item, index) => {
        if (index % 24 !== 0 && index !== series.length - 1) return null;
        return {
          value: index,
          label: item.timestamp.split("T")[1].slice(0, 5),
        };
      })
      .filter(Boolean) as { value: number; label: string }[];
  }, [data]);

  const currentTimestamp = data?.[0]?.series?.[selectedTimeIndex]?.timestamp;
  const formattedTime = currentTimestamp
    ? new Date(currentTimestamp).toLocaleString("en-GB", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
      }) + " UTC"
    : "--:-- UTC";

  const dateParts = selectedDate
    ? {
        weekday: selectedDate.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          weekday: "long",
        }),
        day: selectedDate.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          day: "numeric",
        }),
        month: selectedDate.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          month: "long",
        }),
        year: selectedDate.toLocaleDateString("en-GB", {
          timeZone: "UTC",
          year: "numeric",
        }),
      }
    : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.75 }}>
      {/* ── DATE ── */}
      <Box>
        <Typography sx={subLabelSx}>Date</Typography>

        <Box
          onClick={handleOpen}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 1.5,
            py: 1,
            borderRadius: "5px",
            border: `1px solid ${open ? "rgba(148,206,36,0.4)" : BORDER}`,
            bgcolor: open ? "rgba(148,206,36,0.08)" : "transparent",
            cursor: "pointer",
            transition: "background-color 0.15s, border-color 0.15s",
            "&:hover": {
              bgcolor: "rgba(148,206,36,0.06)",
              borderColor: "rgba(148,206,36,0.3)",
            },
          }}
        >
          <Box>
            {dateParts ? (
              <>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: ACCENT,
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1,
                    mb: 0.5,
                    letterSpacing: "0.04em",
                  }}
                >
                  {dateParts.weekday}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: TEXT_ON,
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1,
                  }}
                >
                  {dateParts.day} {dateParts.month}{" "}
                  <Box
                    component="span"
                    sx={{ color: TEXT_MID, fontWeight: 400 }}
                  >
                    {dateParts.year}
                  </Box>
                </Typography>
              </>
            ) : (
              <Typography
                sx={{
                  fontSize: 13,
                  color: TEXT_MID,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Select date
              </Typography>
            )}
          </Box>

          <CalendarMonthIcon
            sx={{
              fontSize: 15,
              color: open ? ACCENT : TEXT_MID,
              transition: "color 0.15s",
            }}
          />
        </Box>
      </Box>

      {/* ── TIME ── */}
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography sx={subLabelSx}>
            {t("dateSelector.time", { defaultValue: "Time" })}
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              color: TEXT_MID,
              fontWeight: 500,
            }}
          >
            {formattedTime}
          </Typography>
        </Box>

        <Box sx={{ px: 0.5, pt: 0.5 }}>
          <Slider
            aria-label={t("dateSelector.time")}
            value={selectedTimeIndex}
            onChange={(_, v) => {
              if (typeof v === "number") setSelectedTimeIndex(v);
            }}
            step={1}
            min={0}
            max={maxIndex}
            marks={marks}
            sx={{
              color: ACCENT,
              height: 2,
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: "0 0 0 6px rgba(163,230,53,0.15)",
                },
              },
              "& .MuiSlider-track": { border: "none" },
              "& .MuiSlider-rail": {
                bgcolor: "rgba(255,255,255,0.1)",
                opacity: 1,
              },
              "& .MuiSlider-mark": {
                bgcolor: "rgba(255,255,255,0.2)",
                width: 2,
                height: 2,
              },
              "& .MuiSlider-markLabel": {
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                top: 22,
              },
            }}
          />
        </Box>
      </Box>

      {/* ── CALENDAR POPOVER ── */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              bgcolor: "#0b1825",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
              p: "8px 6px 8px",
              width: 264,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            "& .MuiDateCalendar-root": {
              width: "100%",
              maxHeight: 265,
              bgcolor: "transparent",
            },
            "& .MuiPickersCalendarHeader-root": {
              px: 0.75,
              minHeight: 36,
              mb: 0,
            },
            "& .MuiPickersCalendarHeader-label": {
              fontSize: 12.5,
              fontWeight: 600,
              color: TEXT_DIM,
              fontFamily: "var(--font-sans)",
            },
            "& .MuiPickersArrowSwitcher-button": {
              color: TEXT_MID,
              padding: "4px",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.06)",
                color: TEXT_DIM,
              },
            },
            "& .MuiDayCalendar-weekDayLabel": {
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.2)",
              width: 32,
              height: 22,
              fontFamily: "var(--font-sans)",
            },
            "& .MuiPickersDay-root": {
              fontSize: 12,
              fontWeight: 500,
              width: 32,
              height: 32,
              borderRadius: "5px",
              color: TEXT_MID,
              fontFamily: "var(--font-sans)",
              transition: "background-color 0.12s, color 0.12s",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.06)",
                color: TEXT_DIM,
              },
            },
            "& .MuiPickersDay-today": {
              border: `1px solid rgba(148,206,36,0.45) !important`,
              color: `${ACCENT} !important`,
            },
            "& .Mui-selected": {
              bgcolor: `rgba(148,206,36,0.13) !important`,
              color: `${ACCENT} !important`,
              border: `1px solid rgba(148,206,36,0.4) !important`,
              fontWeight: 600,
              "&:hover": { bgcolor: "rgba(148,206,36,0.2) !important" },
            },
            "& .MuiPickersDay-dayOutsideMonth": {
              color: "rgba(255,255,255,0.12)",
            },
            "& .MuiDayCalendar-slideTransition": { minHeight: 196 },
          }}
        >
          <DateCalendar
            value={selectedDate}
            onChange={(newDate) => {
              if (!newDate) return;
              setSelectedDate(normalizeToUTCDate(newDate));
              setSelectedTimeIndex(0);
              handleClose();
            }}
          />
        </Box>
      </Popover>
    </Box>
  );
}
