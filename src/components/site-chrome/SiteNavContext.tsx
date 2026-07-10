"use client";

import { createContext, useContext, type ReactNode } from "react";
import { buildSiteNav, type SiteNav } from "@/lib/public-nav";

const emptySiteNav = buildSiteNav([]);

const SiteNavContext = createContext<SiteNav>(emptySiteNav);

export function SiteNavProvider({
  siteNav,
  children,
}: {
  siteNav: SiteNav;
  children: ReactNode;
}) {
  return <SiteNavContext.Provider value={siteNav}>{children}</SiteNavContext.Provider>;
}

export function useSiteNav(): SiteNav {
  return useContext(SiteNavContext);
}
