import type { CSSProperties } from "react";

/** Shared palette & motion tokens for admin dashboard charts. */
export const CHART_COLORS = {
  primary: "#1a3896",
  gold: "#c9a227",
  green: "#2D6A4F",
  red: "#9B2226",
  purple: "#6D28D9",
  blue: "#2563EB",
  muted: "#6b6b6b",
  grid: "rgba(26, 56, 150, 0.06)",
} as const;

export const CHART_ANIMATION = {
  duration: 1400,
  easing: "ease-out" as const,
  barDuration: 1200,
  pieDuration: 1600,
} as const;

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  background: "linear-gradient(145deg, rgba(20, 24, 41, 0.96), rgba(26, 56, 150, 0.92))",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
  padding: "12px 16px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04) inset",
  backdropFilter: "blur(12px)",
};

export const PIPELINE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.gold,
  CHART_COLORS.muted,
  CHART_COLORS.green,
  CHART_COLORS.red,
];
