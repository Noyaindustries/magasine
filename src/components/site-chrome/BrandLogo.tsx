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
  href?: string;
  onNavigate?: () => void;
}

export function BrandLogo({
  variant = "header",
  className,
  showTagline,
  linked = true,
  href = "/",
  onNavigate,
}: BrandLogoProps) {
  const { siteLogo, siteName } = useSiteBranding();
  const height = variant === "header" ? 68 : 44;
  const width = variant === "header" ? 300 : 190;
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
        unoptimized
        style={{ height, width: "auto", maxWidth: width }}
      />
      {displayTagline && (
        <div className="logo-tagline">Decolonizing media</div>
      )}
    </>
  );

  if (!linked) {
    return <span className={logoClassName}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={logoClassName}
      aria-label={`${siteName} — ${href === "/" ? "Home" : "Tableau de bord"}`}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}
