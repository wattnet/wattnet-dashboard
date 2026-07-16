import { init } from "@plausible-analytics/tracker";

if (typeof window !== "undefined") {
  init({
    domain: "dashboard.wattnet.eu",
    endpoint: "https://analytics.wattnet.eu/api/event",
  });
}
