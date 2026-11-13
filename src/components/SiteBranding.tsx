"use client";

import { createContext, useContext } from "react";
import { DEFAULT_FAVICON, DEFAULT_SITE_LOGO } from "@/lib/branding";

export interface SiteBrandingValue {
  siteName: string;
  tagline: string;
  siteLogo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
}

const SiteBrandingContext = createContext<SiteBrandingValue>({
  siteName: "Global South Watch",
  tagline: "",
  siteLogo: DEFAULT_SITE_LOGO,
  favicon: DEFAULT_FAVICON,
  contactEmail: "contact@globalsouthwatch.com",
  contactPhone: "",
  contactLocation: "Abidjan, Côte d'Ivoire",
});

export function SiteBrandingProvider({
  value,
  children,
}: {
  value: SiteBrandingValue;
  children: React.ReactNode;
}) {
  return <SiteBrandingContext.Provider value={value}>{children}</SiteBrandingContext.Provider>;
}

export function useSiteBranding(): SiteBrandingValue {
  return useContext(SiteBrandingContext);
}
