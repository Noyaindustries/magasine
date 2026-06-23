import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Globe2,
  Radio,
  Scale,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UtilityPageLayout } from "@/components/layout/UtilityPageLayout";
import { SocialLinks } from "@/components/ui/SocialIcons";
import "./about-page.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Global South Watch — our mission, story, and commitment to independent journalism from Africa and the Global South.",
};

const MISSION_PILLARS: {
  icon: LucideIcon;
  title: string;
  text: string;
}[] = [
  {
    icon: BookOpen,
    title: "Inform with depth",
    text: "We explain transformations — political, economic, social and cultural — with context, not just headlines.",
  },
  {
    icon: Users,
    title: "Center Southern voices",
    text: "Our correspondents live in the regions they cover. Local expertise drives every story we publish.",
  },
  {
    icon: Scale,
    title: "Hold power to account",
    text: "Investigations, fact-checking, and public-interest reporting are at the heart of our newsroom.",
  },
  {
    icon: Radio,
    title: "Stay free and accessible",
    text: "Breaking news stays free. We reach readers through the web, newsletters, podcasts, and video.",
  },
];

const VALUES = [
  {
    label: "Editorial independence",
    text: "No political or commercial interference in topic selection or editorial line.",
  },
  {
    label: "Factual rigor",
    text: "Cross-checked sources, transparent methods, and visible corrections when we err.",
  },
  {
    label: "Pluralism",
    text: "Diversity of voices, territories, and legitimate perspectives on every subject.",
  },
  {
    label: "Proximity",
    text: "Reporting rooted in the field — from Abidjan to São Paulo, Mumbai to Nairobi.",
  },
];

const COVERAGE = ["Africa", "Latin America", "South Asia", "West Asia"];

const STATS = [
  ["2M+", "Monthly readers"],
  ["145k", "Newsletter subscribers"],
  ["42", "Countries covered"],
  ["120+", "Regional correspondents"],
] as const;

export default function AProposPage() {
  return (
    <UtilityPageLayout
      eyebrow="Global South Watch"
      eyebrowIcon={Globe2}
      title={
        <>
          About
          <span>us</span>
        </>
      }
      lead="Global South Watch is an independent newsroom reporting from Africa and the Global South — with rigor, proximity, and a commitment to public-interest journalism."
      actions={[
        { label: "Our mission", href: "#mission" },
        { label: "Editorial charter", href: "/editorial-charter" },
        { label: "Our team", href: "/team" },
      ]}
      wide
    >
      <div className="about-intro-grid">
        <article className="utility-card utility-prose">
          <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">Who we are</h2>
          <p>
            Founded by Noya Industries and published from Abidjan, Global South Watch is a digital
            news portal dedicated to Africa and the wider Global South. We bring together
            journalists, correspondents, columnists, and experts based across the continent and in
            the diaspora.
          </p>
          <p>
            From elections and economic policy to culture, climate, and technology, we cover the
            stories that shape societies south of the equator — for readers who want reliable
            reporting without Western-centric filters.
          </p>
        </article>

        <aside className="utility-card">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-3">At a glance</h2>
          <ul className="about-list">
            <li>
              <span>
                <strong>Headquarters</strong> — Abidjan, Côte d&apos;Ivoire
              </span>
            </li>
            <li>
              <span>
                <strong>Publisher</strong> — Noya Industries
              </span>
            </li>
            <li>
              <span>
                <strong>Languages</strong> — French, English, and regional editions
              </span>
            </li>
            <li>
              <span>
                <strong>Formats</strong> — Articles, investigations, video, podcasts, newsletters
              </span>
            </li>
          </ul>
          <div className="about-coverage-grid">
            {COVERAGE.map((region) => (
              <span key={region} className="about-coverage-chip">
                {region}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <section id="mission" className="utility-wide-panel about-mission-panel">
        <p className="utility-card-sub">Our mission</p>
        <h2>To inform, analyze, and amplify agents of change across the Global South</h2>
        <p className="about-mission-lead">
          We believe quality journalism rooted in local realities is essential to understanding
          global transformations and building informed public debate. Our mission is to give readers
          the context, evidence, and voices they need to engage with the world on equal terms.
        </p>
        <p>
          We do not chase clicks at the expense of accuracy. We invest in correspondents on the
          ground, long-form investigations, and formats that reach audiences wherever they are —
          from morning briefings to in-depth reports.
        </p>

        <div className="about-pillars">
          {MISSION_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
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
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">Our values</h2>
          <ul className="about-list">
            {VALUES.map((value) => (
              <li key={value.label}>
                <span>
                  <strong>{value.label}</strong> — {value.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="utility-card">
          <h2 className="font-serif text-xl font-bold text-charcoal mb-4">How we work</h2>
          <p className="text-sm text-muted leading-relaxed mb-4">
            Every story passes through editorial review. Sensitive claims are verified with multiple
            sources; anonymous sources are used only when the public interest clearly outweighs the
            risk, and never without senior editorial approval.
          </p>
          <ul className="about-list">
            <li>
              <span>Field reporting prioritized over desk rewrites</span>
            </li>
            <li>
              <span>Visible corrections when facts change</span>
            </li>
            <li>
              <span>Source protection as a non-negotiable principle</span>
            </li>
            <li>
              <span>Clear separation between news and opinion</span>
            </li>
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
          <h2>Key figures</h2>
          <p>Reach and editorial scope — updated annually</p>
        </div>
        <div className="about-stats">
          {STATS.map(([num, label]) => (
            <div key={label} className="about-stat">
              <strong>{num}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="about-cta-row">
        <div className="utility-cta-band">
          <p>Meet the journalists and correspondents behind our coverage.</p>
          <Link href="/team">Our team</Link>
        </div>
        <div className="utility-cta-band">
          <p>Independent journalism needs readers who believe in the mission.</p>
          <Link href="/donate">Support us</Link>
        </div>
      </div>

      <div className="utility-cta-band">
        <p>
          <Target className="inline w-4 h-4 mr-2 align-text-bottom opacity-70" aria-hidden />
          Get the morning briefing and regional newsletters — free, curated by our newsroom.
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
