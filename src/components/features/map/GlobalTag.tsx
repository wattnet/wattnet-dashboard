"use client";

import { Typography } from "@mui/material";

interface GlobalTagProps {
  title: string;
}

export default function GlobalTag({ title }: GlobalTagProps) {
  return (
    <div className="absolute top-2 right-10 mb-3 mr-3 z-20 bg-white p-2 w-30 h-10 rounded shadow">
      {/* Title */}
      <Typography variant="body1" className="text-center" gutterBottom>
        {title}
      </Typography>
    </div>
  );
}
