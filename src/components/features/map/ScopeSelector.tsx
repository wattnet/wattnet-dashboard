"use client";

import { Typography } from "@mui/material";
import clsx from "clsx";

interface ScopeSelectorProps {
  selectedScope: string;
  setSelectedScope: (scope: string) => void;
}

export default function ScopeSelector({
  selectedScope,
  setSelectedScope,
}: ScopeSelectorProps) {
  return (
    <div className="absolute bottom-0 right-0 mb-40 mr-3 z-20 bg-white p-2 rounded-full shadow flex items-center gap-2">
      {/* Life-cycle Button */}
      <div
        onClick={() => setSelectedScope("life-cycle")}
        className={clsx(
          "cursor-pointer flex items-center justify-center px-4 py-2 rounded-full transition-all duration-300",
          selectedScope === "life-cycle"
            ? "bg-gradient-to-r from-lime-400 to-lime-700 text-white"
            : "bg-gray-200 text-gray-600"
        )}
      >
        <Typography variant="body2" className="font-semibold">
          Life-cycle
        </Typography>
      </div>

      {/* Operational Button */}
      <div
        onClick={() => setSelectedScope("operational")}
        className={clsx(
          "cursor-pointer flex items-center justify-center px-4 py-2 rounded-full transition-all duration-300",
          selectedScope === "operational"
            ? "bg-gradient-to-r from-lime-400 to-lime-700 text-white"
            : "bg-gray-200 text-gray-600"
        )}
      >
        <Typography variant="body2" className="font-semibold">
          Operational
        </Typography>
      </div>
    </div>
  );
}
