"use client";

import { Footprint } from "@/types/footprints";
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
        <input
          type="date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => {
            setSelectedDate(new Date(e.target.value));
            setSelectedTimeIndex(0);
          }}
          className="ml-2 border rounded px-1"
        />
      </label>

      <label className="ml-4">
        {t("dateSelector.time")}

        <input
          type="range"
          min={0}
          max={maxIndex}
          value={selectedTimeIndex}
          onChange={(e) => setSelectedTimeIndex(Number(e.target.value))}
          className="ml-2"
        />
        <span className="ml-2">
          {data?.[0]?.series?.[0]?.values?.[selectedTimeIndex]?.[0] ?? "--:--"}
        </span>
      </label>
    </div>
  );
}
