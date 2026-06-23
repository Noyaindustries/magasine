import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
import { getLayoutNavData } from "@/lib/data";
import { Providers } from "@/components/Providers";
import { MaintenanceGate } from "@/components/MaintenanceGate";
import "./globals.css";
import "./responsive.css";
import "./revolution.css";
import "./home-page.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Global South Watch — Online Magazine & News Portal",
    template: "%s | Global South Watch",
  },
  description:
    "Global South Watch — the leading news portal for Africa and the Global South. Independent, rigorous, and committed journalism.",
  keywords: ["Global South", "Africa", "news", "magazine", "journalism", "current affairs"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Global South Watch",
    images: ["/images/logo-global-south-watch.png"],
  },
  icons: {
    icon: "/images/logo-global-south-watch.png",
  },
  other: {
    google: "notranslate",
  },
};

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

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${newsreader.variable} notranslate`}
    >
      <body className="notranslate" suppressHydrationWarning translate="no">
        <Providers>
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
