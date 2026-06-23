"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteBranding } from "@/components/SiteBranding";

interface BrandLogoProps {
  variant?: "header" | "footer" | "auth";
  className?: string;
  showTagline?: boolean;
  /** When false, renders markup only (use inside an existing link). */
  linked?: boolean;
}

export function BrandLogo({
  variant = "header",
  className,
  showTagline,
  linked = true,
}: BrandLogoProps) {
  const { siteLogo, siteName } = useSiteBranding();
  const height = variant === "header" ? 52 : 44;
  const width = variant === "header" ? 220 : 190;
  const displayTagline = showTagline ?? variant === "header";

  const logoClassName = className ?? (variant === "auth" ? "logo logo-auth" : "logo");

  const content = (
    <>
      <Image
        src={siteLogo}
        alt={siteName}
        width={width}
        height={height}
        priority={variant === "header"}
        style={{ height, width: "auto", maxWidth: width }}
      />
      {displayTagline && (
        <div className="logo-tagline">Décolonisation des médias</div>
      )}
    </>
  );

  if (!linked) {
    return <span className={logoClassName}>{content}</span>;
  }

  return (
    <Link
      href="/"
      className={logoClassName}
      aria-label={`${siteName} — Home`}
    >
      {content}
    </Link>
  );
}
