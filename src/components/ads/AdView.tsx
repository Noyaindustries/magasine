"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AD_SLOT_DIMENSIONS, type AdSlotId, type PublicAd } from "@/lib/ad-slots";

interface AdViewProps {
  ad: PublicAd;
  slot: AdSlotId;
  className?: string;
}

/** Envoie un signal d'impression une seule fois au montage (best-effort). */
function useImpression(adKey: string) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const payload = JSON.stringify({ key: adKey, type: "impression" });
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/ads/track",
          new Blob([payload], { type: "application/json" })
        );
        return;
      }
    } catch {
      // ignore, on retombe sur fetch
    }
    void fetch("/api/ads/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }, [adKey]);
}

export function AdView({ ad, slot, className }: AdViewProps) {
  useImpression(ad.key);
  const dims = AD_SLOT_DIMENSIONS[slot];

  const media = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.imageUrl}
      alt={ad.name || "Advertisement"}
      width={dims.width}
      height={dims.height}
      loading="lazy"
      decoding="async"
      className="ad-slot-img"
    />
  );

  return (
    <div className={cn("ad-slot", `ad-slot--${slot}`, className)} data-ad-slot={slot}>
      <span className="ad-slot-tag">Sponsored</span>
      {ad.linkUrl ? (
        <a
          href={`/api/ads/go/${encodeURIComponent(ad.key)}`}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="ad-slot-link"
        >
          {media}
        </a>
      ) : (
        media
      )}
    </div>
  );
}
