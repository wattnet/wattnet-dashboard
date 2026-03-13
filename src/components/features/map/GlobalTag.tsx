"use client";

import { Box, Typography } from "@mui/material";

interface GlobalTagProps {
  readonly title: string;
}

export default function GlobalTag({ title }: GlobalTagProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.6,
        borderRadius: 10,
        bgcolor: "rgba(13,21,32,0.75)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(148,206,36,0.3)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: "#94ce24",
          flexShrink: 0,
          "@keyframes wn-pulse": {
            "0%,100%": { opacity: 1 },
            "50%": { opacity: 0.3 },
          },
          animation: "wn-pulse 2s infinite",
        }}
      />
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: "#94ce24",
          fontFamily: "var(--font-sans)",
          lineHeight: 1,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
