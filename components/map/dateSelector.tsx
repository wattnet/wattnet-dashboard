"use client";

import { Footprint } from "@/types/footprints";
import { IconButton, Slider, Popover, Box, Typography } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useTranslation } from "react-i18next";
import { useMemo, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";

interface DateSelectorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedTimeIndex: number;
  setSelectedTimeIndex: (index: number) => void;
  data: Footprint[];
}

export default function DateSelector({
  selectedDate,
  setSelectedDate,
  selectedTimeIndex,
  setSelectedTimeIndex,
  data,
}: DateSelectorProps) {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  const maxIndex = useMemo(
    () => (data?.[0]?.series?.[0]?.values?.length ?? 1) - 1,
    [data]
  );

  const marks = useMemo(() => {
    const values = data?.[0]?.series?.[0]?.values ?? [];
    const lastIndex = values.length - 1;

    return values
      .map((item, index) => {
        // Show mark every 24 entries (6 hours, 15-min intervals)
        const isIntervalMark = index % 24 === 0;
        // Add mark for last entry (23:45)
        const isLastMark = index === lastIndex;

        if (!isIntervalMark && !isLastMark) return null;

        return {
          value: index,
          label: item[0].split("T")[1].slice(0, 5), // HH:mm
        };
      })
      .filter(Boolean) as { value: number; label: string }[];
  }, [data]);

  const formatUTC = (isoString?: string) => {
    let formattedDate = "--:--";
    if (isoString) {
      const date = parseISO(isoString);
      formattedDate = format(date, "MMM d, yyyy, HH:mm 'UTC'");
    }
    return formattedDate;
  };

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return (
    <Box className="absolute top-2 left-2 z-10">
      <IconButton
        color="primary"
        onClick={handleOpen}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CalendarTodayIcon />
      </IconButton>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box p={3} display="flex" flexDirection={"column"}>
          <Box>
            <Typography variant="h6" mt={1} mb={1} textAlign="center">
              {formatUTC(
                data?.[0]?.series?.[0]?.values?.[selectedTimeIndex]?.[0]
              ) ?? "--:--"}
            </Typography>

            <DateCalendar
              value={selectedDate}
              onChange={(newDate) => {
                if (!newDate) return;
                setSelectedDate(newDate);
                setSelectedTimeIndex(0);
              }}
            />
          </Box>

          <Box p={2}>
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
            />
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}
