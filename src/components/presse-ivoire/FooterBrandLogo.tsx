"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteBranding } from "@/components/SiteBranding";

export function FooterBrandLogo() {
  const { siteLogo, siteName } = useSiteBranding();

  return (
    <Link href="/" className="footer-logo-link">
      <Image
        src={siteLogo}
        alt={siteName}
        width={190}
        height={44}
        unoptimized
        style={{ height: 44, width: "auto" }}
      />
    </Link>
  );
}
