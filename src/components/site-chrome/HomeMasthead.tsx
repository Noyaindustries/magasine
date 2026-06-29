import { getEditorialDateParts } from "@/lib/editorial-date";

interface HomeMastheadProps {
  dateParts?: ReturnType<typeof getEditorialDateParts>;
  tagline?: string;
  volume?: string;
  cities?: string;
  badge?: string;
}

export function HomeMasthead({ dateParts, tagline, volume, cities, badge }: HomeMastheadProps) {
  const { weekday: weekdayCap, dayMonth } = dateParts ?? getEditorialDateParts();
  const citiesParts = (cities ?? "Abidjan · Dakar · Nairobi").split("·").map((c) => c.trim());

  return (
    <div className="home-masthead home-masthead--revolution notranslate" translate="no" lang="en">
      <div className="home-masthead-ornament" aria-hidden />
      <div className="container">
        <div className="home-masthead-card">
          <div className="home-masthead-bar">
            <div className="home-masthead-left">
              <span className="home-masthead-badge">{badge ?? "Today's Edition"}</span>
              <span className="home-masthead-volume">{volume ?? "Vol. XII · N° 1847"}</span>
            </div>

            <p className="home-masthead-date" aria-label={`${weekdayCap} ${dayMonth}`} suppressHydrationWarning>
              <span className="home-masthead-date-week">{weekdayCap}</span>
              <span className="home-masthead-date-sep" aria-hidden>
                ·
              </span>
              <span className="home-masthead-date-rest">{dayMonth}</span>
            </p>

            <div className="home-masthead-right">
              <span className="home-masthead-live" suppressHydrationWarning>
                <span className="home-masthead-live-dot" />
                Live
              </span>
              <span className="home-masthead-divider" aria-hidden />
              <span className="home-masthead-stat">
                {citiesParts.map((city, i) => (
                  <span key={city}>
                    {i > 0 && " · "}
                    {i === 0 ? <strong>{city}</strong> : city}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <p className="home-masthead-tagline">
            <span className="home-masthead-diamond" aria-hidden>
              ◆
            </span>
            {tagline ?? "Decolonizing media"}
            <span className="home-masthead-diamond" aria-hidden>
              ◆
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
