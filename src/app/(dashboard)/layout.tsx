"use client";

import { Box, Typography } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { Navigation } from "@toolpad/core";
import React from "react";

export const NAVIGATION: Navigation = [
  {
    kind: "header",
    title:
      "Explore the environmental footprint of electricity, powered by open data. Access real‑time, historical, and forecasted indicators on the carbon and water impact of electricity consumption across Europe. Wattnet is designed for researchers, developers, and decision‑makers who rely on accurate, transparent, and reproducible environmental metrics.",
  },
  {
    segment: "map",
    title: "Map",
    icon: React.createElement(MapIcon),
  },
  {
    kind: "divider",
  },
];

function SidebarDescription() {
  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="body2" color="text.secondary">
        This dashboard shows carbon footprints and geospatial layers for your
        project. Use the map navigation to zoom into data interactively.
      </Typography>
    </Box>
  );
}

export default function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      slots={{
        sidebarFooter: SidebarDescription,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
