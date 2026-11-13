import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection, ContentCta } from "@/components/layout/ContentPage";
import { getPublicSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Press room",
  description: "Press releases, media contacts, and resources — Global South Watch.",
};

export default async function EspacePressePage() {
  const settings = await getPublicSiteSettings();
  const phoneHref = settings.contactPhone.replace(/[^\d+]/g, "");

  return (
    <ContentPage
      eyebrow="Media"
      title="Press room"
      description="Journalists and partner media: find our press releases, contacts, and institutional resources."
    >
      <ContentSection title="Press contact">
        <ul className="space-y-3 not-prose">
          <li className="p-4 bg-muted-bg border border-border rounded-sm">
            <p className="text-xs font-bold tracking-wider uppercase text-muted">Press relations</p>
            <a href={`mailto:${settings.contactEmail}`} className="text-charcoal font-medium hover:text-accent">
              {settings.contactEmail}
            </a>
          </li>
          {settings.contactPhone ? (
            <li className="p-4 bg-muted-bg border border-border rounded-sm">
              <p className="text-xs font-bold tracking-wider uppercase text-muted">Phone</p>
              <a href={`tel:${phoneHref}`} className="text-charcoal font-medium hover:text-accent">
                {settings.contactPhone}
              </a>
            </li>
          ) : null}
        </ul>
      </ContentSection>

      <ContentSection title="Resources">
        <ul className="list-disc pl-6 space-y-2">
          <li>Logo and brand guidelines on request</li>
          <li>Interviews and speaking opportunities with editorial leadership</li>
          <li>Early access to major investigations (upon accreditation)</li>
          <li>RSS feed: <a href="/feed.xml" className="text-accent hover:underline">/feed.xml</a> · <Link href="/rss" className="text-accent hover:underline">RSS hub</Link></li>
          <li>Sitemap: <Link href="/sitemap" className="text-accent hover:underline">/sitemap</Link></li>
        </ul>
      </ContentSection>

      <ContentSection title="Latest press releases">
        <div className="space-y-3 not-prose text-sm">
          <p className="p-4 border-l-4 border-gold bg-muted-bg pl-5">
            <strong>June 2026</strong> — Global South Watch surpasses 2 million monthly readers.
          </p>
          <p className="p-4 border-l-4 border-gold bg-muted-bg pl-5">
            <strong>May 2026</strong> — Launch of the Investigations section with a dedicated team in Abidjan.
          </p>
        </div>
      </ContentSection>

      <ContentCta text="Have a question? Our team replies within 24 hours." href="/contact" label="Contact us" />
    </ContentPage>
  );
}
