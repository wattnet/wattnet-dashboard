"use client";

import { Box, Typography, Slider } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { normalizeToUTCDate } from "@/src/utils/dateManager";
import { ProcessedFootprint } from "@/src/types/footprints";

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedTimeIndex: number;
  setSelectedTimeIndex: (index: number) => void;
  data: ProcessedFootprint[];
}

const SECTION_LABEL_SX = {
  fontSize: 9.5,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.28)",
  mb: 0.75,
  display: "flex",
  alignItems: "center",
  gap: 0.5,
};

export default function DateSelector({
  selectedDate,
  setSelectedDate,
  selectedTimeIndex,
  setSelectedTimeIndex,
  data,
}: DateSelectorProps) {
  const { t } = useTranslation();

  const maxIndex = useMemo(() => (data?.[0]?.series?.length ?? 1) - 1, [data]);

  const marks = useMemo(() => {
    const series = data?.[0]?.series ?? [];
    const lastIndex = series.length - 1;
    return series
      .map((item, index) => {
        if (index % 24 !== 0 && index !== lastIndex) return null;
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
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " UTC"
    : "--:-- UTC";

  return (
    <Box>
      <Typography sx={SECTION_LABEL_SX}>Date</Typography>

      {/* Current timestamp display */}
      <Box
        sx={{
          px: 1.25,
          py: 0.75,
          mb: 1,
          borderRadius: 1.5,
          bgcolor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Typography
          sx={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
          }}
        >
          {formattedTime}
        </Typography>
      </Box>

      {/* Calendar — styled to fit dark sidebar */}
      <Box
        sx={{
          "& .MuiDateCalendar-root": {
            width: "100%",
            maxHeight: 260,
            bgcolor: "transparent",
            color: "rgba(255,255,255,0.7)",
          },
          "& .MuiPickersCalendarHeader-root": { px: 0.5, minHeight: 36 },
          "& .MuiPickersCalendarHeader-label": {
            fontSize: 11.5,
            color: "rgba(255,255,255,0.8)",
          },
          "& .MuiPickersArrowSwitcher-button": {
            color: "rgba(255,255,255,0.4)",
            padding: "4px",
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          },
          "& .MuiDayCalendar-weekDayLabel": {
            fontSize: 9,
            color: "rgba(255,255,255,0.25)",
            width: 28,
            height: 24,
          },
          "& .MuiPickersDay-root": {
            fontSize: 10,
            width: 28,
            height: 28,
            color: "rgba(255,255,255,0.45)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
          },
          "& .MuiPickersDay-today": {
            border: "1px solid rgba(163,230,53,0.4) !important",
            color: "#a3e635",
          },
          "& .Mui-selected": {
            bgcolor: "#a3e635 !important",
            color: "#0d1520 !important",
            fontWeight: 600,
            "&:hover": { bgcolor: "#b5f542 !important" },
          },
        }}
      >
        <DateCalendar
          value={selectedDate}
          onChange={(newDate) => {
            if (!newDate) return;
            setSelectedDate(normalizeToUTCDate(newDate));
            setSelectedTimeIndex(0);
          }}
        />
      </Box>

      {/* Time slider */}
      <Box sx={{ px: 0.5, pt: 0.5 }}>
        <Typography sx={{ ...SECTION_LABEL_SX, mb: 1.5 }}>
          {t("dateSelector.time", { defaultValue: "Time" })}
        </Typography>
        <Slider
          aria-label={t("dateSelector.time")}
          value={selectedTimeIndex}
          onChange={(_, value) => {
            if (typeof value === "number") setSelectedTimeIndex(value);
          }}
          step={1}
          min={0}
          max={maxIndex}
          marks={marks}
          sx={{
            color: "#a3e635",
            "& .MuiSlider-thumb": {
              width: 12,
              height: 12,
              "&:hover, &.Mui-focusVisible": { boxShadow: "0 0 0 6px rgba(163,230,53,0.15)" },
            },
            "& .MuiSlider-rail": { bgcolor: "rgba(255,255,255,0.1)" },
            "& .MuiSlider-mark": { bgcolor: "rgba(255,255,255,0.2)", width: 2, height: 2 },
            "& .MuiSlider-markLabel": { fontSize: 9, color: "rgba(255,255,255,0.3)", top: 22 },
          }}
        />
      </Box>
    </Box>
  );
}
