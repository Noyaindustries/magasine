import type { ClosingStat } from "@/lib/site-settings";
import { STATS } from "@/data/site-home";

const ICONS = ["◈", "✦", "◇", "◎"];

interface StatsStripProps {
  stats?: ClosingStat[];
}

export function StatsStrip({ stats }: StatsStripProps) {
  const items = stats ?? STATS;

  return (
    <div className="stats-strip stats-strip-premium">
      <div className="stats-inner container">
        {items.map((stat, i) => (
          <div key={stat.label} className="stat-item reveal" data-reveal-delay={i * 80}>
            <span className="stat-icon" aria-hidden>
              {ICONS[i % ICONS.length]}
            </span>
            <div className="stat-num">
              {stat.num}
              <span>{stat.suffix}</span>
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
