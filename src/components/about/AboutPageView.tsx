import Link from "next/link";
import {
  BookOpen,
  Globe2,
  Radio,
  Scale,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { UtilityPageLayout } from "@/components/layout/UtilityPageLayout";
import { SocialLinks } from "@/components/ui/SocialIcons";
import type { AboutPageContent, AboutPillarIcon } from "@/lib/about-page-content";

const PILLAR_ICONS: Record<AboutPillarIcon, LucideIcon> = {
  "book-open": BookOpen,
  users: Users,
  scale: Scale,
  radio: Radio,
};

interface AboutPageViewProps {
  content: AboutPageContent;
}

export function AboutPageView({ content }: AboutPageViewProps) {
  return (
    <UtilityPageLayout
      eyebrow={content.eyebrow}
      eyebrowIcon={Globe2}
      title={
        <>
          {content.titleMain}
          <span>{content.titleEm}</span>
        </>
      }
      lead={content.lead}
      actions={[
        { label: "Our mission", href: "#mission" },
        { label: "Editorial charter", href: "/editorial-charter" },
        { label: "Our team", href: "/team" },
      ]}
      wide
    >
      <div className="about-intro-grid">
        <article className="utility-card utility-prose">
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">{content.whoWeAreTitle}</h2>
          {content.whoWeAreParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </article>

        <aside className="utility-card">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-3">{content.glanceTitle}</h2>
          <ul className="about-list">
            {content.glanceItems.map((item) => (
              <li key={item.label}>
                <span>
                  <strong>{item.label}</strong> — {item.value}
                </span>
              </li>
            ))}
          </ul>
          <div className="about-coverage-grid">
            {content.coverageRegions.map((region) => (
              <span key={region} className="about-coverage-chip">
                {region}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <section id="mission" className="utility-wide-panel about-mission-panel">
        <p className="utility-card-sub">{content.missionSubtitle}</p>
        <h2>{content.missionTitle}</h2>
        <p className="about-mission-lead">{content.missionLead}</p>
        <p>{content.missionParagraph}</p>

        <div className="about-pillars">
          {content.missionPillars.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.icon];
            return (
              <div key={pillar.title} className="about-pillar">
                <span className="about-pillar-icon" aria-hidden>
                  <Icon size={18} />
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="about-split-section">
        <section className="utility-card">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">{content.valuesTitle}</h2>
          <ul className="about-list">
            {content.values.map((value) => (
              <li key={value.label}>
                <span>
                  <strong>{value.label}</strong> — {value.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="utility-card">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">{content.howWeWorkTitle}</h2>
          <p className="text-sm text-muted leading-relaxed mb-4">{content.howWeWorkIntro}</p>
          <ul className="about-list">
            {content.howWeWorkItems.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm mt-4">
            <Link href="/editorial-charter" className="text-accent font-semibold hover:underline">
              Read our full editorial charter →
            </Link>
          </p>
        </section>
      </div>

      <section className="utility-wide-panel">
        <div className="utility-wide-panel-head">
          <h2>{content.statsTitle}</h2>
          <p>{content.statsSubtitle}</p>
        </div>
        <div className="about-stats">
          {content.stats.map((stat) => (
            <div key={stat.label} className="about-stat">
              <strong>{stat.num}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="about-cta-row">
        <div className="utility-cta-band">
          <p>{content.ctaTeamText}</p>
          <Link href="/team">Our team</Link>
        </div>
        <div className="utility-cta-band">
          <p>{content.ctaDonateText}</p>
          <Link href="/donate">Support us</Link>
        </div>
      </div>

      <div className="utility-cta-band">
        <p>
          <Target className="inline w-4 h-4 mr-2 align-text-bottom opacity-70" aria-hidden />
          {content.ctaNewsletterText}
        </p>
        <Link href="/newsletter">Subscribe</Link>
      </div>

      <div className="utility-social-block">
        <p>Follow Global South Watch</p>
        <SocialLinks variant="inline" iconClassName="w-5 h-5" />
      </div>
    </UtilityPageLayout>
  );
}
