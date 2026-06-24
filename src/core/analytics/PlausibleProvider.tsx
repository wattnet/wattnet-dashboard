"use client";

import { useEffect } from "react";

export function PlausibleProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  useEffect(() => {
    import("@plausible-analytics/tracker").then(({ init }) => {
      init({
        domain: "dashboard.wattnet.eu",
        endpoint: "https://analytics.wattnet.eu/api/event",
      });
    });
  }, []);

  return <>{children}</>;
}
