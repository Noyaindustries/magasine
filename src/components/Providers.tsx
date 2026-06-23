"use client";

import { SessionProvider } from "next-auth/react";
import { SiteBrandingProvider, type SiteBrandingValue } from "@/components/SiteBranding";

interface ProvidersProps {
  children: React.ReactNode;
  branding?: SiteBrandingValue;
}

export function Providers({ children, branding }: ProvidersProps) {
  const content = <SessionProvider>{children}</SessionProvider>;

  if (!branding) return content;

  return <SiteBrandingProvider value={branding}>{content}</SiteBrandingProvider>;
}
