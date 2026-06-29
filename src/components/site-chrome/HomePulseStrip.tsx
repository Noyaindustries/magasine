import type { PulseStat } from "@/lib/site-settings";

interface HomePulseStripProps {
  stats?: PulseStat[];
}

export function HomePulseStrip({ stats }: HomePulseStripProps) {
  const items = stats ?? [
    { value: "54", label: "countries" },
    { value: "127", label: "stories / week" },
    { value: "2M+", label: "readers" },
  ];

  return (
    <div
      className="home-pulse-strip notranslate"
      aria-label="Editorial statistics"
      translate="no"
      lang="en"
    >
      <div className="container home-pulse-strip-inner">
        {items.map((item) => (
          <div key={`${item.value}-${item.label}`} className="home-pulse-item home-pulse-stat">
            <strong>{item.value}</strong>
            <span className="home-pulse-stat-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
