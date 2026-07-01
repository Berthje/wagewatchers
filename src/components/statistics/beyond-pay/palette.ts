// Orange/amber palette matching the existing statistics charts.
export const PALETTE = [
  "#ea580c", // orange-600
  "#fb923c", // orange-400
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#d97706", // amber-600
  "#92400e", // amber-800
];

export const ACCENT = "#ea580c";
export const ACCENT_MUTED = "#fdba74";

// Shared Recharts axis styling. Inherits `currentColor` from a `text-muted-foreground`
// container, matching the other statistics charts.
export const AXIS_TICK = { fontSize: 12, fill: "currentColor" } as const;
