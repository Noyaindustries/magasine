"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { ClientOnly } from "@/components/admin/dashboard/ClientOnly";
import { ChartSkeleton } from "@/components/admin/dashboard/ChartSkeleton";

const DEFAULT_HEIGHT = 220;
const TALL_HEIGHT = 280;

interface MeasuredChartProps {
  children: ReactNode;
  tall?: boolean;
  height?: number;
}

/**
 * Conteneur Recharts avec hauteur explicite — évite width/height -1 en prod.
 */
export function MeasuredChart({ children, tall = false, height }: MeasuredChartProps) {
  const h = height ?? (tall ? TALL_HEIGHT : DEFAULT_HEIGHT);

  return (
    <ClientOnly fallback={<ChartSkeleton tall={tall || h > DEFAULT_HEIGHT} />}>
      <div
        className="dash-chart-measured"
        style={{ width: "100%", minWidth: 0, height: h }}
      >
        <ResponsiveContainer width="100%" height={h}>
          {children}
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}

export { DEFAULT_HEIGHT as CHART_HEIGHT, TALL_HEIGHT as CHART_TALL_HEIGHT };
