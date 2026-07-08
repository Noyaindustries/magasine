import type { Metadata } from "next";
import { DM_Sans, Libre_Baskerville } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import { getLayoutNavData } from "@/lib/data";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { Providers } from "@/components/Providers";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import { getSiteUrl } from "@/lib/site";
import { getTypographyPreset, getTypographyCssVariables } from "@/lib/site-fonts";
import "./globals.css";
import "./responsive.css";
import "./revolution.css";
import "./home-page.css";
import "./article-cards.css";
import "./images-flat.css";
import "./reader-space.css";
import "./site-typography.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-canela-fallback",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const adobeFontsKitId = process.env.NEXT_PUBLIC_ADOBE_FONTS_KIT_ID;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteUrl = settings.canonicalUrl?.startsWith("http")
    ? settings.canonicalUrl.replace(/\/$/, "")
    : getSiteUrl();

  return {
    metadataBase: new URL(`${siteUrl}/`),
    title: {
      default: `${settings.siteName} — Online Magazine & News Portal`,
      template: `%s | ${settings.siteName}`,
    },
    description:
      "Global South Watch — the leading news portal for Africa and the Global South. Independent, rigorous, and committed journalism.",
    keywords: ["Global South", "Africa", "news", "magazine", "journalism", "current affairs"],
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: settings.siteName,
      images: [settings.siteLogo],
    },
    icons: {
      // URL constante (bakeable sur les pages statiques) mais qui redirige vers le
      // favicon courant configuré dans l'admin — voir src/app/api/favicon/route.ts.
      icon: "/api/favicon",
      shortcut: "/api/favicon",
      apple: "/api/favicon",
    },
    other: {
      google: "notranslate",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function getLayoutData() {
  return getLayoutNavData();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { categories, siteSettings } = await getLayoutData();
  const typography = getTypographyPreset(siteSettings.typographyPreset);
  const typographyVars = getTypographyCssVariables(typography);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-typography={typography.id}
      style={typographyVars as React.CSSProperties}
      className={`${dmSans.variable} ${libreBaskerville.variable} notranslate`}
    >
      <head>
        {typography.googleFontsHref ? (
          <link rel="stylesheet" href={typography.googleFontsHref} />
        ) : null}
        {adobeFontsKitId && typography.id === "canela-editorial" ? (
          <link rel="stylesheet" href={`https://use.typekit.net/${adobeFontsKitId}.css`} />
        ) : null}
      </head>
      <body className="notranslate" suppressHydrationWarning translate="no">
        <Providers
          branding={{
            siteName: siteSettings.siteName,
            tagline: siteSettings.tagline,
            siteLogo: siteSettings.siteLogo,
            favicon: siteSettings.favicon,
          }}
        >
          <MaintenanceGate
            maintenanceMode={siteSettings.maintenanceMode}
            siteName={siteSettings.siteName}
          >
            <SiteChrome categories={categories}>
              {children}
            </SiteChrome>
          </MaintenanceGate>
        </Providers>
      </body>
    </html>
  );
}
