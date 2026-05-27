"use client";

import { Box, Typography, Slider, Collapse } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { normalizeToUTCDate } from "@/src/shared/utils/dateManager";
import { ProcessedFootprint } from "@/src/features/map/types/footprints";

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedTimeIndex: number;
  setSelectedTimeIndex: (index: number) => void;
  data: ProcessedFootprint[];
}

// ── Palette ────────────────────────────────────────────────────────────────
const BORDER = "var(--color-border)";
const BORDER_OPEN = "color-mix(in srgb, var(--color-primary) 35%, transparent)";
const TEXT_HI = "color-mix(in srgb, var(--color-foreground) 90%, transparent)";
const TEXT_DIM = "color-mix(in srgb, var(--color-foreground) 60%, transparent)";
const TEXT_LOW = "color-mix(in srgb, var(--color-foreground) 28%, transparent)";
const ACCENT = "var(--color-primary)";
const ACCENT_BG = "color-mix(in srgb, var(--color-primary) 6%, transparent)";
const ACCENT_HOVER =
  "color-mix(in srgb, var(--color-primary) 18%, transparent)";

const HOVER_BG = "color-mix(in srgb, var(--color-foreground) 7%, transparent)";
const HOVER_BORDER =
  "color-mix(in srgb, var(--color-foreground) 18%, transparent)";
const MARK_BG = "color-mix(in srgb, var(--color-foreground) 18%, transparent)";
const RAIL_BG = "color-mix(in srgb, var(--color-foreground) 10%, transparent)";
const THUMB_SHADOW =
  "color-mix(in srgb, var(--color-primary) 12%, transparent)";

const subLabelSx = {
  fontSize: 12.5,
  fontWeight: 600,
  color: TEXT_DIM,
  mb: 1,
};

export default function DateSelector({
  selectedDate,
  setSelectedDate,
  selectedTimeIndex,
  setSelectedTimeIndex,
  data,
}: Readonly<DateSelectorProps>) {
  const { t } = useTranslation();
  const [calOpen, setCalOpen] = useState(false);

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

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", {
        timeZone: "UTC",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Select date";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Date */}
      <Box>
        <Typography sx={subLabelSx}>Date</Typography>

        <Box
          sx={{
            borderRadius: "6px",
            border: `1px solid ${calOpen ? BORDER_OPEN : BORDER}`,
            bgcolor: calOpen ? ACCENT_BG : "transparent",
            transition: "background-color 0.18s, border-color 0.18s",
            overflow: "hidden",
            "&:hover": !calOpen ? { borderColor: HOVER_BORDER } : {},
          }}
        >
          {/* Trigger row */}
          <Box
            onClick={() => setCalOpen((v) => !v)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.5,
              py: 1.1,
              cursor: "pointer",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarMonthIcon
                sx={{
                  fontSize: 13,
                  color: calOpen ? ACCENT : TEXT_DIM,
                  transition: "color 0.18s",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: selectedDate ? TEXT_HI : TEXT_DIM,
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                  transition: "font-weight 0.15s, color 0.15s",
                }}
              >
                {formattedDate}
              </Typography>
            </Box>
            <KeyboardArrowDownIcon
              sx={{
                fontSize: 15,
                color: calOpen ? ACCENT : TEXT_DIM,
                transition: "transform 0.25s, color 0.18s",
                transform: calOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </Box>

          {/* Inline calendar */}
          <Collapse in={calOpen} timeout={260}>
            <Box
              sx={{
                borderTop: `1px solid ${BORDER}`,
                pb: 1.5,

                "& .MuiDateCalendar-root": {
                  width: "100%",
                  maxHeight: "none !important",
                  height: "auto !important",
                  bgcolor: "transparent",
                },

                "& .MuiDayCalendar-slideTransition": {
                  minHeight: "unset !important",
                  height: "auto !important",
                  overflow: "visible !important",
                  "& .MuiDayCalendar-monthContainer": {
                    position: "relative !important",
                    top: "unset !important",
                    left: "unset !important",
                    right: "unset !important",
                  },
                  "& [class*='slideEnter'], & [class*='slideExit']": {
                    animation: "none !important",
                    transition: "none !important",
                    transform: "none !important",
                    opacity: "1 !important",
                    position: "relative !important",
                  },
                },

                // Header alignment
                "& .MuiPickersCalendarHeader-root": {
                  px: "12px",
                  mb: 0,
                },
                "& .MuiDayCalendar-header": {
                  px: "12px",
                  justifyContent: "space-between",
                },
                "& .MuiDayCalendar-weekContainer": {
                  px: "12px",
                  justifyContent: "space-between",
                  margin: "2px 0",
                },

                // Month + year label
                "& .MuiPickersCalendarHeader-label": {
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: TEXT_HI,
                  letterSpacing: "0.01em",
                },

                // Nav arrows
                "& .MuiPickersArrowSwitcher-button": {
                  color: TEXT_DIM,
                  padding: "4px",
                  borderRadius: "4px",
                  "&:hover": {
                    bgcolor: HOVER_BG,
                    color: TEXT_HI,
                  },
                },

                // Weekday labels (Mo Tu We…)
                "& .MuiDayCalendar-weekDayLabel": {
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: TEXT_LOW,
                  width: 32,
                  height: 28,
                },

                // Day cells
                "& .MuiPickersDay-root": {
                  fontSize: 13,
                  fontWeight: 500,
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  color: TEXT_DIM,
                  transition: "background-color 0.1s, color 0.1s",
                  "&:hover": {
                    bgcolor: HOVER_BG,
                    color: TEXT_HI,
                  },
                },

                // Today
                "& .MuiPickersDay-today": {
                  border: `1px solid var(--color-secondary) !important`,
                  color: `var(--color-secondary) !important`,
                  fontWeight: 600,
                },

                // Selected
                "& .Mui-selected": {
                  bgcolor: `${ACCENT_BG} !important`,
                  color: `${ACCENT} !important`,
                  border: `1px solid ${BORDER_OPEN} !important`,
                  fontWeight: 600,
                  "&:hover": { bgcolor: `${ACCENT_HOVER} !important` },
                },

                // Outside month
                "& .MuiPickersDay-dayOutsideMonth": {
                  color: TEXT_LOW,
                },
              }}
            >
              <DateCalendar
                value={selectedDate}
                reduceAnimations
                onChange={(newDate) => {
                  if (!newDate) return;
                  setSelectedDate(normalizeToUTCDate(newDate));
                  setSelectedTimeIndex(0);
                  setCalOpen(false);
                }}
              />
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* Time */}
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography sx={{ ...subLabelSx, mb: 0 }}>
            {t("dateSelector.time", { defaultValue: "Time" })}
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: TEXT_HI,
              letterSpacing: "0.03em",
            }}
          >
            {formattedTime}
          </Typography>
        </Box>

        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
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
              height: 3,
              px: 0,
              "& .MuiSlider-thumb": {
                width: 11,
                height: 11,
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: `0 0 0 6px ${THUMB_SHADOW}`,
                },
              },
              "& .MuiSlider-track": { border: "none" },
              "& .MuiSlider-rail": {
                bgcolor: RAIL_BG,
                opacity: 1,
              },
              "& .MuiSlider-mark": {
                bgcolor: MARK_BG,
                width: 1.5,
                height: 3,
              },
              "& .MuiSlider-markLabel": {
                fontSize: 12.5,
                mt: 0.5,
                color: TEXT_DIM,
                top: 20,

                "&:first-of-type": {
                  transform: "translateX(0%)",
                  textAlign: "left",
                },

                "&:last-of-type": {
                  transform: "translateX(-100%)",
                  textAlign: "right",
                },

                "&:not(:first-of-type):not(:last-of-type)": {
                  transform: "translateX(-50%)",
                  textAlign: "center",
                },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
