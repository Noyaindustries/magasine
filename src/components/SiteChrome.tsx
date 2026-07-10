"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-chrome/SiteHeader";
import { HomeQuickNav } from "@/components/site-chrome/HomeQuickNav";
import { SiteFooter } from "@/components/site-chrome/SiteFooter";
import { ProgressBar } from "@/components/site-chrome/ProgressBar";
import { ScrollReveal } from "@/components/site-chrome/ScrollReveal";
import type { SiteNav } from "@/lib/public-nav";

interface SiteChromeProps {
  children: ReactNode;
  siteNav: SiteNav;
}

function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function SiteChrome({ children, siteNav }: SiteChromeProps) {
  const pathname = usePathname();
  const admin = isAdminRoute(pathname);

  if (admin) {
    return <div className="admin-root admin-root--cms">{children}</div>;
  }

  return (
    <>
      <ProgressBar />
      <div className="site-header-stack">
        <SiteHeader />
        <HomeQuickNav siteNav={siteNav} />
      </div>
      <main>{children}</main>
      <SiteFooter />
      <ScrollReveal />
    </>
  );
}
