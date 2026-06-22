"use client";

import {
  Box,
  Typography,
  Slider,
  Collapse,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers";
import { PickersDay, PickersDayProps } from "@mui/x-date-pickers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

import { useTranslation } from "react-i18next";
import { useMemo, useState, useEffect, useRef, type ReactNode } from "react";
import {
  normalizeToUTCDate,
  dayCountInRange,
  dateAtDayOffset,
  isSameUTCDay,
} from "@/src/shared/utils/dateManager";
import { ProcessedFootprint } from "@/src/features/map/types/footprints";

interface DateSelectorProps {
  startDate: Date;
  endDate: Date;
  setDateRange: (start: Date, end: Date) => void;
  selectedTimeIndex: number;
  setSelectedTimeIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
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

const BASE_INTERVAL_MS = 100;
const SPEEDS = [1, 2, 5] as const;
type Speed = (typeof SPEEDS)[number];

const TOOLTIP_PROPS = {
  slotProps: {
    tooltip: {
      sx: {
        bgcolor: "color-mix(in srgb, var(--color-background) 55%, #000)",
        border:
          "1px solid color-mix(in srgb, var(--color-border) 70%, transparent)",
        borderRadius: "6px",
        px: 1,
        py: 0.6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      },
    },
    arrow: {
      sx: { color: "color-mix(in srgb, var(--color-background) 55%, #000)" },
    },
  },
} as const;

function Kbd({ children }: { children: ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: "5px",
        py: "1px",
        ml: 0.75,
        borderRadius: "4px",
        border: "1px solid rgba(255,255,255,0.22)",
        bgcolor: "rgba(255,255,255,0.10)",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.5,
        letterSpacing: 0,
      }}
    >
      {children}
    </Box>
  );
}

export default function DateSelector({
  startDate,
  endDate,
  setDateRange,
  selectedTimeIndex,
  setSelectedTimeIndex,
  isPlaying,
  setIsPlaying,
  data,
}: Readonly<DateSelectorProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [calOpen, setCalOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [speed, setSpeed] = useState<Speed>(1);
  const speedRef = useRef<Speed>(1);
  speedRef.current = speed;

  const cycleSpeed = () =>
    setSpeed((prev) => SPEEDS[(SPEEDS.indexOf(prev) + 1) % SPEEDS.length]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeIndexRef = useRef(selectedTimeIndex);
  timeIndexRef.current = selectedTimeIndex;

  const maxIndex = useMemo(() => Math.max(1, (data?.[0]?.series?.length ?? 1) - 1), [data]);
  const maxIndexRef = useRef(maxIndex);
  maxIndexRef.current = maxIndex;

  const N = useMemo(
    () => dayCountInRange(startDate, endDate),
    [startDate, endDate],
  );

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(
        () => {
          const next =
            timeIndexRef.current >= maxIndexRef.current
              ? 0
              : timeIndexRef.current + 1;
          setSelectedTimeIndex(next);
        },
        Math.round(BASE_INTERVAL_MS / speedRef.current),
      );
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, setSelectedTimeIndex]);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const stepBackRef = useRef<() => void>(() => {});
  const stepForwardRef = useRef<() => void>(() => {});

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.code !== "Space" &&
        e.code !== "ArrowLeft" &&
        e.code !== "ArrowRight"
      )
        return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (e.code === "Space") setIsPlaying(!isPlayingRef.current);
      if (e.code === "ArrowLeft") stepBackRef.current();
      if (e.code === "ArrowRight") stepForwardRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setIsPlaying]);

  const stepBack = () => {
    if (selectedTimeIndex > 0) setSelectedTimeIndex(selectedTimeIndex - 1);
  };
  const stepForward = () => {
    if (selectedTimeIndex < maxIndex) setSelectedTimeIndex(selectedTimeIndex + 1);
  };
  stepBackRef.current = stepBack;
  stepForwardRef.current = stepForward;

  const handleDayClick = (clicked: Date) => {
    const normalized = normalizeToUTCDate(clicked);
    if (!pendingStart) {
      setPendingStart(normalized);
      return;
    }
    const a = normalized < pendingStart ? normalized : pendingStart;
    const b = normalized < pendingStart ? pendingStart : normalized;
    const clamped = dayCountInRange(a, b) > 7 ? dateAtDayOffset(a, 6) : b;
    setDateRange(a, clamped);
    setPendingStart(null);
    setCalOpen(false);
  };

  const shouldDisableDate = (day: Date): boolean => {
    if (!pendingStart) return false;
    const normalized = normalizeToUTCDate(day);
    const a = normalized < pendingStart ? normalized : pendingStart;
    const b = normalized < pendingStart ? pendingStart : normalized;
    return dayCountInRange(a, b) > 7;
  };

  // Day labels rendered above the slider track
  const dayMarks = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        value: i * 96,
        label: dateAtDayOffset(startDate, i).toLocaleDateString("en-GB", {
          timeZone: "UTC",
          day: "numeric",
          month: "short",
        }),
      })),
    [N, startDate],
  );

  // Time labels rendered below the slider track
  const timeMarks = useMemo(() => {
    if (N === 1) {
      return [
        { value: 0, label: "00:00" },
        { value: 24, label: "06:00" },
        { value: 48, label: "12:00" },
        { value: 72, label: "18:00" },
        { value: 95, label: "23:45" },
      ];
    }
    const lastSlot = N * 96 - 1;

    if (N <= 3) {
      // 2 labels per day: midnight and noon, plus final 23:45
      const result: Array<{ value: number; label: string }> = [];
      for (let i = 0; i < N; i++) {
        result.push({ value: i * 96, label: "00:00" });
        result.push({ value: i * 96 + 48, label: "12:00" });
      }
      result.push({ value: lastSlot, label: "23:45" });
      return result;
    }
    // 4-7 days: noon only; 23:45 only up to N=4 (gets too crowded beyond that)
    const result = Array.from({ length: N }, (_, i) => ({
      value: i * 96 + 48,
      label: "12:00",
    }));
    if (N <= 4) result.push({ value: lastSlot, label: "23:45" });
    return result;
  }, [N]);

  // Tick mark positions on the track (union of both sets + always first/last)
  const allTicks = useMemo(() => {
    const vals = new Set([
      0,
      maxIndex,
      ...dayMarks.map((m) => m.value),
      ...timeMarks.map((m) => m.value),
    ]);
    return Array.from(vals).map((v) => ({ value: v }));
  }, [maxIndex, dayMarks, timeMarks]);

  const currentTimestamp = data?.[0]?.series?.[selectedTimeIndex]?.timestamp;
  const formattedTime = currentTimestamp
    ? new Date(currentTimestamp).toLocaleString("en-GB", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " UTC"
    : "--:-- UTC";

  const fmtShort = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formattedRange = isSameUTCDay(startDate, endDate)
    ? startDate.toLocaleDateString("en-GB", {
        timeZone: "UTC",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : `${fmtShort(startDate)} – ${fmtShort(endDate)}`;

  // Custom day component: full range strip including start and end
  const RangeDay = useMemo(
    () =>
      function RangeDayComponent(props: PickersDayProps) {
        const { day, outsideCurrentMonth, ...other } = props;
        // Convert local calendar date → UTC midnight for timezone-safe comparison
        const dayUTC = Date.UTC(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
        );
        const multiDay = !isSameUTCDay(startDate, endDate);
        const isStart = dayUTC === startDate.getTime();
        const isEnd = dayUTC === endDate.getTime() && multiDay;
        const inRange =
          dayUTC > startDate.getTime() && dayUTC < endDate.getTime();
        const isPending =
          pendingStart !== null && dayUTC === pendingStart.getTime();

        return (
          <Box>
            <PickersDay
              {...other}
              day={day}
              outsideCurrentMonth={outsideCurrentMonth}
              selected={isStart || isEnd || inRange || isPending}
            />
          </Box>
        );
      },
    [startDate, endDate, pendingStart],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Unified header: "Date & Time" | controls | current datetime */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {!isMobile && (
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 600,
              color: TEXT_DIM,
              whiteSpace: "nowrap",
            }}
          >
            {t("dateSelector.dateTime", { defaultValue: "Date & Time" })}
          </Typography>
        )}

        {/* nav + play/pause + speed — tightly grouped */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            ml: isMobile ? 0 : 1,
            flexShrink: 0,
          }}
        >
          <Tooltip
            title={
              <Box
                sx={{ display: "flex", alignItems: "center", fontSize: 13.5 }}
              >
                Previous step<Kbd>←</Kbd>
              </Box>
            }
            placement="bottom"
            arrow
            {...TOOLTIP_PROPS}
          >
            <IconButton
              size="small"
              onClick={stepBack}
              aria-label="previous step"
              sx={{
                color: TEXT_DIM,
                p: "5px",
                borderRadius: "6px",
                "&:hover": { color: TEXT_HI, bgcolor: HOVER_BG },
              }}
            >
              <NavigateBeforeIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              <Box
                sx={{ display: "flex", alignItems: "center", fontSize: 13.5 }}
              >
                {isPlaying ? "Pause" : "Play"}
                <Kbd>Space</Kbd>
              </Box>
            }
            placement="bottom"
            arrow
            {...TOOLTIP_PROPS}
          >
            <IconButton
              size="small"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "pause" : "play"}
              sx={{
                color: isPlaying ? ACCENT : TEXT_DIM,
                p: "5px",
                borderRadius: "6px",
                transition: "color 0.18s, filter 0.18s",
                filter: isPlaying
                  ? "drop-shadow(0 0 4px color-mix(in srgb, var(--color-primary) 65%, transparent))"
                  : "none",
                "&:hover": {
                  color: isPlaying ? ACCENT : TEXT_HI,
                  bgcolor: HOVER_BG,
                },
              }}
            >
              {isPlaying ? (
                <PauseIcon sx={{ fontSize: 22 }} />
              ) : (
                <PlayArrowIcon sx={{ fontSize: 22 }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              <Box
                sx={{ display: "flex", alignItems: "center", fontSize: 13.5 }}
              >
                Next step<Kbd>→</Kbd>
              </Box>
            }
            placement="bottom"
            arrow
            {...TOOLTIP_PROPS}
          >
            <IconButton
              size="small"
              onClick={stepForward}
              aria-label="next step"
              sx={{
                color: TEXT_DIM,
                p: "5px",
                borderRadius: "6px",
                "&:hover": { color: TEXT_HI, bgcolor: HOVER_BG },
              }}
            >
              <NavigateNextIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={<Box sx={{ fontSize: 13.5 }}>Cycle speed</Box>}
            placement="bottom"
            arrow
            {...TOOLTIP_PROPS}
          >
            <Box
              onClick={cycleSpeed}
              role="button"
              aria-label={`speed ${speed}x`}
              sx={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                border: `1px solid ${speed > 1 ? BORDER_OPEN : BORDER}`,
                bgcolor: speed > 1 ? ACCENT_BG : "transparent",
                color: speed > 1 ? ACCENT : TEXT_DIM,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                userSelect: "none",
                transition:
                  "color 0.18s, border-color 0.18s, background-color 0.18s",
                ml: isMobile ? 0.5 : 1,
                "&:hover": { borderColor: HOVER_BORDER, color: TEXT_HI },
              }}
            >
              {speed}×
            </Box>
          </Tooltip>
        </Box>

        <Typography
          sx={{
            ml: "auto",
            fontSize: 13,
            fontWeight: 600,
            color: TEXT_HI,
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
            whiteSpace: "nowrap",
          }}
        >
          {formattedTime}
        </Typography>
      </Box>

      {/* Date picker */}
      <Box>
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
            onClick={() => {
              if (calOpen) setPendingStart(null);
              setCalOpen((v) => !v);
            }}
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
                  color: TEXT_HI,
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                }}
              >
                {pendingStart
                  ? `${fmtShort(pendingStart)} – ?`
                  : formattedRange}
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
                pt: 1,
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

                "& .MuiYearCalendar-root": { width: "100%" },

                "& .MuiPickersCalendarHeader-root": { px: "12px", mt: 0, mb: 0 },
                "& .MuiDayCalendar-header": {
                  px: "12px",
                  justifyContent: "space-between",
                },
                "& .MuiDayCalendar-weekContainer": {
                  px: "12px",
                  justifyContent: "space-between",
                  margin: "2px 0",
                },

                "& .MuiPickersCalendarHeader-label": {
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: TEXT_HI,
                  letterSpacing: "0.01em",
                },

                "& .MuiPickersArrowSwitcher-button": {
                  color: TEXT_DIM,
                  padding: "4px",
                  borderRadius: "4px",
                  "&:hover": { bgcolor: HOVER_BG, color: TEXT_HI },
                },

                "& .MuiDayCalendar-weekDayLabel": {
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  color: TEXT_LOW,
                  width: 32,
                  height: 28,
                },

                "& .MuiPickersDay-root": {
                  fontSize: 13,
                  fontWeight: 500,
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  color: TEXT_DIM,
                  transition: "background-color 0.1s, color 0.1s",
                  "&:hover": { bgcolor: HOVER_BG, color: TEXT_HI },
                },

                "& .MuiPickersDay-today": {
                  border: `2px solid var(--color-secondary) !important`,
                  color: `var(--color-secondary) !important`,
                  fontWeight: 600,
                },

                "& .MuiPickersDay-today.Mui-selected": {
                  border: `2px solid var(--color-secondary) !important`,
                },

                "& .Mui-selected": {
                  bgcolor: `var(--color-primary) !important`,
                  color: `var(--color-background) !important`,
                  border: "none !important",
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: `color-mix(in srgb, var(--color-primary) 82%, var(--color-background)) !important`,
                  },
                },

                "& .MuiPickersDay-dayOutsideMonth": { color: TEXT_LOW },

                "& .Mui-disabled": { opacity: 0.3 },
              }}
            >
              {pendingStart && (
                <Typography
                  sx={{
                    fontSize: 13,
                    color: ACCENT,
                    px: "12px",
                    pt: 0,
                    pb: 0,
                    fontWeight: 500,
                  }}
                >
                  Click the same day to confirm, or pick an end date (max 7 days)
                </Typography>
              )}
              <DateCalendar
                value={pendingStart ?? startDate}
                reduceAnimations
                shouldDisableDate={shouldDisableDate}
                slots={{ day: RangeDay }}
                onChange={(v) => {
                  if (v) handleDayClick(v);
                }}
              />
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* Slider */}
      <Box sx={{ px: 2, pt: 0, pb: 0.5 }}>
        {/* Day labels above track */}
        <Box sx={{ position: "relative", height: 16, mb: 0 }}>
          {dayMarks.map((m) => (
            <Typography
              key={m.value}
              sx={{
                position: "absolute",
                left: `${(m.value / maxIndex) * 100}%`,
                transform: "translateX(-50%)",
                fontSize: 12.5,
                fontWeight: 600,
                color: TEXT_DIM,
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {m.label}
            </Typography>
          ))}
        </Box>

        <Box sx={{ position: "relative" }}>
          {/* Custom ticks — flex-centered vertically, before Slider in DOM */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box sx={{ position: "relative", width: "100%", height: 11 }}>
              {allTicks.map((tick) => (
                <Box
                  key={tick.value}
                  sx={{
                    position: "absolute",
                    left: `${(tick.value / maxIndex) * 100}%`,
                    top: -3.5,
                    transform: "translateX(-50%)",
                    width: "1.5px",
                    height: 15,
                    bgcolor:
                      "color-mix(in srgb, var(--color-foreground) 35%, transparent)",
                  }}
                />
              ))}
            </Box>
          </Box>

          <Slider
            aria-label={t("dateSelector.time", { defaultValue: "Time" })}
            value={selectedTimeIndex}
            onChange={(_, v) => {
              if (typeof v === "number") setSelectedTimeIndex(v);
            }}
            step={1}
            min={0}
            max={maxIndex}
            marks={false}
            sx={{
              color: ACCENT,
              height: 4,
              px: 0,
              py: "6px",
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
                boxShadow: "none",
                // disable position transition so thumb stays in sync with track at high speeds
                transition: "left 0ms, bottom 0ms, box-shadow 0.15s",
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: `0 0 0 6px ${THUMB_SHADOW}`,
                },
              },
              "& .MuiSlider-track": {
                border: "none",
                borderRadius: "2px 0 0 2px",
                // disable position/size transitions so track stays in sync at high speeds
                transition: "left 0ms, width 0ms, box-shadow 0.3s",
                boxShadow: isPlaying
                  ? "0 0 8px 2px color-mix(in srgb, var(--color-primary) 45%, transparent)"
                  : "none",
              },
              "& .MuiSlider-rail": {
                backgroundColor: RAIL_BG,
                opacity: 1,
                borderRadius: "2px",
              },
            }}
          />
        </Box>

        {/* Time labels below track */}
        <Box sx={{ position: "relative", height: 16, mt: 0 }}>
          {timeMarks.map((m) => (
            <Typography
              key={`t-${m.value}`}
              sx={{
                position: "absolute",
                left: `${(m.value / maxIndex) * 100}%`,
                transform: "translateX(-50%)",
                fontSize: 12.5,
                color: TEXT_DIM,
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              {m.label}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
