import type { TrustPartner } from "@/lib/site-settings";

interface TrustStripProps {
  label?: string;
  partners?: TrustPartner[];
}

export function TrustStrip({
  label = "As seen in",
  partners = [],
}: TrustStripProps) {
  const active = partners.filter((p) => p.isActive !== false);
  if (active.length === 0) return null;

  const track = [...active, ...active];

  return (
    <div className="trust-strip notranslate" role="region" aria-label="Partner media" translate="no" lang="en">
      <div className="container trust-strip-inner">
        <div className="trust-strip-label-wrap">
          <span className="trust-strip-label">{label}</span>
        </div>
        <div className="trust-strip-viewport">
          <div className="trust-strip-track">
            {track.map((partner, i) => {
              const img = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={partner.logo}
                  alt={partner.name}
                  width={partner.width}
                  height={partner.height}
                  className="trust-strip-logo-img"
                  loading="lazy"
                  decoding="async"
                />
              );

              return (
                <span key={`${partner.name}-${i}`} className="trust-strip-logo" title={partner.name}>
                  {partner.url ? (
                    <a href={partner.url} target="_blank" rel="noopener noreferrer">
                      {img}
                    </a>
                  ) : (
                    img
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
