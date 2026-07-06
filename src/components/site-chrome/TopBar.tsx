import { TICKER_ITEMS } from "@/data/site-home";
import { getEditorialDateString } from "@/lib/editorial-date";
import { SITE_SOCIAL_NETWORKS } from "@/lib/social";
import { SocialLinks } from "@/components/ui/SocialIcons";

interface TopBarProps {
  alerts?: { text: string; link?: string }[];
  formattedDate?: string;
}

export function TopBar({ alerts, formattedDate }: TopBarProps) {
  const items = alerts?.length
    ? alerts.map((a) => a.text)
    : TICKER_ITEMS;

  const doubled = [...items, ...items];
  const dateLabel = formattedDate ?? getEditorialDateString();

  return (
    <div className="top-bar" translate="no">
      <div className="top-bar-inner container">
        <div className="top-bar-label" suppressHydrationWarning>
          <span className="breaking-dot" />
          Live
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {doubled.map((text, i) => (
              <span key={`${text}-${i}`} className="ticker-item">
                <span className="ticker-dot" />
                {text}
              </span>
            ))}
          </div>
        </div>
        <SocialLinks
          variant="topbar"
          networks={[...SITE_SOCIAL_NETWORKS]}
          iconClassName="w-3.5 h-3.5"
        />
        <div className="top-bar-date" suppressHydrationWarning>
          {dateLabel}
        </div>
      </div>
    </div>
  );
}
