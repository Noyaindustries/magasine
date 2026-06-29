"use client";

import Image from "next/image";
import { useState } from "react";
import { IMG, resolveFeaturedImage } from "@/lib/images";

interface SectionImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export function SectionImage({
  src,
  alt,
  sizes = "(max-width: 768px) 100vw, 400px",
  priority = false,
  className = "",
}: SectionImageProps) {
  const resolvedSrc = resolveFeaturedImage(src);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const currentSrc = brokenSrc === src ? IMG.finance : resolvedSrc;

  return (
    <span className="section-image-wrap">
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`img-ph ${className}`.trim()}
        onError={() => {
          if (brokenSrc !== src) {
            setBrokenSrc(src);
          }
        }}
      />
    </span>
  );
}
