"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ClientOnly } from "@/components/admin/dashboard/ClientOnly";
import { ChartSkeleton } from "@/components/admin/dashboard/ChartSkeleton";
import { CHART_ANIMATION } from "@/lib/chart-theme";

interface DashboardKpiCardProps {
  label: string;
  value: number;
  trend?: number;
  sparkline: number[];
  format?: "number" | "compact";
  accent?: string;
  /** Overrides trend % display (e.g. "+12 this month") */
  trendOverride?: { text: string; direction: "up" | "down" | "flat" };
}

function formatValue(value: number, format: "number" | "compact") {
  if (format === "compact") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString("en-US");
}

function useAnimatedNumber(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }

    const start = performance.now();
    const from = display;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate toward new target only
  }, [target, duration]);

  return display;
}

export function DashboardKpiCard({
  label,
  value,
  trend = 0,
  sparkline,
  format = "number",
  accent = "#c9a227",
  trendOverride,
}: DashboardKpiCardProps) {
  const animatedValue = useAnimatedNumber(value);
  const chartData = sparkline.map((v, i) => ({ i, v }));
  const gradientId = `spark-${label.replace(/\s/g, "")}`;

  const trendDirection = trendOverride?.direction ?? (trend > 0 ? "up" : trend < 0 ? "down" : "flat");
  const TrendIcon =
    trendDirection === "up" ? TrendingUp : trendDirection === "down" ? TrendingDown : Minus;
  const trendClass =
    trendDirection === "up"
      ? "dash-kpi-trend--up"
      : trendDirection === "down"
        ? "dash-kpi-trend--down"
        : "dash-kpi-trend--flat";

  const trendText =
    trendOverride?.text ??
    `${trend > 0 ? "+" : ""}${trend}%`;

  return (
    <article className="dash-kpi-card dash-kpi-card--animate">
      <div className="dash-kpi-card-glow" style={{ background: accent }} aria-hidden />
      <div className="dash-kpi-card-shine" aria-hidden />
      <div className="dash-kpi-card-top">
        <p className="dash-kpi-label">{label}</p>
        <span className={`dash-kpi-trend ${trendClass}`}>
          <TrendIcon className="w-3.5 h-3.5" aria-hidden />
          {trendText}
        </span>
      </div>
      <p className="dash-kpi-value">{formatValue(animatedValue, format)}</p>
      <div className="dash-kpi-spark" aria-hidden>
        <ClientOnly fallback={<ChartSkeleton />}>
          <ResponsiveContainer width="100%" height={52}>
            <AreaChart data={chartData} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accent}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive
                animationDuration={CHART_ANIMATION.duration}
                animationEasing={CHART_ANIMATION.easing}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
    </article>
  );
}
