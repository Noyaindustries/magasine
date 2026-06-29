"use client";

import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { SITE_TAGLINE } from "@/data/site-home";
import { BrandLogo } from "@/components/site-chrome/BrandLogo";
import { HeaderAuth } from "@/components/site-chrome/HeaderAuth";
import { HeaderDonateLink } from "@/components/site-chrome/HeaderDonateLink";
import { HeaderUtilityBar } from "@/components/site-chrome/HeaderUtilityBar";
import { GswNavSearchLink } from "@/components/site-chrome/GswNavSearchLink";
import { MobileMenuButton, MobileNavDrawer } from "@/components/site-chrome/MobileNavDrawer";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pathKey, setPathKey] = useState(pathname);

  if (pathKey !== pathname) {
    setPathKey(pathname);
    setMobileMenuOpen(false);
  }

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <header className="header header--gsw" translate="no">
      <HeaderUtilityBar />
      <div className="header-inner header-inner--gsw">
        <div className="header-brand-row">
          <MobileMenuButton
            open={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          />
          <BrandLogo variant="header" showTagline={false} />
          <p className="header-logo-tagline">{SITE_TAGLINE}</p>
        </div>

        <div className="header-actions header-actions--gsw">
          <HeaderDonateLink />
          <GswNavSearchLink className="gsw-nav-search-icon--header" />
          <HeaderAuth />
        </div>
      </div>

      <MobileNavDrawer open={mobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
}
