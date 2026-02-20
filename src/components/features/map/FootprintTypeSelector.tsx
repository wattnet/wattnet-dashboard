"use client";

import { Typography } from "@mui/material";
import clsx from "clsx";

interface FootprintTypeSelectorProps {
  selectedFootprintType: string;
  setSelectedFootprintType: (type: string) => void;
}

export default function FootprintTypeSelector({
  selectedFootprintType,
  setSelectedFootprintType,
}: FootprintTypeSelectorProps) {
  return (
    <div className="absolute bottom-0 right-0 mb-25 mr-3 z-20 bg-white p-2 rounded-full shadow flex items-center gap-2">
      {/* Water Button */}
      <div
        onClick={() => setSelectedFootprintType("water")}
        className={clsx(
          "cursor-pointer flex items-center justify-center px-4 py-2 rounded-full transition-all duration-300",
          selectedFootprintType === "water"
            ? "bg-gradient-to-r from-blue-400 to-cyan-500 text-white"
            : "bg-gray-200 text-gray-600"
        )}
      >
        <Typography variant="body2" className="font-semibold">
          Water
        </Typography>
      </div>

      {/* Carbon Button */}
      <div
        onClick={() => setSelectedFootprintType("carbon")}
        className={clsx(
          "cursor-pointer flex items-center justify-center px-4 py-2 rounded-full transition-all duration-300",
          selectedFootprintType === "carbon"
            ? "bg-gradient-to-r from-gray-700 to-black text-white"
            : "bg-gray-200 text-gray-600"
        )}
      >
        <Typography variant="body2" className="font-semibold">
          Carbon
        </Typography>
      </div>
    </div>
  );
}
