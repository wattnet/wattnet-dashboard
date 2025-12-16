"use client";

import { Footprint } from "@/types/footprints";
import { Slider } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";

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

  const maxIndex = (data?.[0]?.series?.[0]?.values?.length ?? 1) - 1;

  return (
    <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded shadow">
      <label>
        {t("dateSelector.date")}

        <DateCalendar
          value={selectedDate}
          onChange={(newDate) => {
            if (!newDate) return;
            setSelectedDate(newDate);
            setSelectedTimeIndex(0);
          }}
        />
      </label>

      <label className="ml-4">
        {t("dateSelector.time")}

        <Slider
          aria-label="Time"
          value={selectedTimeIndex}
          onChange={(_, value) => {
            if (typeof value === "number") setSelectedTimeIndex(value);
          }}
          valueLabelDisplay="off"
          step={1}
          min={0}
          max={maxIndex}
        />

        <span className="ml-2">
          {data?.[0]?.series?.[0]?.values?.[selectedTimeIndex]?.[0] ?? "--:--"}
        </span>
      </label>
    </div>
  );
}
