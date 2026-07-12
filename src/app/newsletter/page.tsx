import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Globe2,
  CalendarDays,
  Sun,
  Search,
  Zap,
  MapPin,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { NewsletterSignupForm } from "@/components/newsletter/NewsletterSignupForm";
import {
  isNewsletterMultiEditionEnabled,
  NEWSLETTER_TOPICS,
} from "@/lib/newsletter-topics";

const multiEdition = isNewsletterMultiEditionEnabled();

export const metadata: Metadata = {
  title: "Newsletter",
  description: multiEdition
    ? "Subscribe to Global South Watch newsletters — daily briefings and regional editions for Africa, Latin America, South Asia and West Asia."
    : "Subscribe to the Global South Watch newsletter — a free daily briefing of independent journalism from the Global South.",
};

const STATS = multiEdition
  ? [
      { value: "145k+", label: "Morning readers" },
      { value: "8", label: "Editions to choose" },
      { value: "Free", label: "Independent journalism" },
    ]
  : [
      { value: "145k+", label: "Morning readers" },
      { value: "Daily", label: "Editorial briefing" },
      { value: "Free", label: "Independent journalism" },
    ];

const PERKS = multiEdition
  ? [
      {
        icon: Sparkles,
        title: "Editorial curation",
        text: "Stories selected by our newsroom, not algorithms.",
      },
      {
        icon: Globe2,
        title: "Regional editions",
        text: "Follow Africa, Latin America, South Asia or West Asia.",
      },
      {
        icon: Search,
        title: "Investigations first",
        text: "Early alerts when our reporters publish major probes.",
      },
      {
        icon: CheckCircle2,
        title: "Always free",
        text: "No paywall on breaking news — the newsletter is our reader relationship.",
      },
    ]
  : [
      {
        icon: Sparkles,
        title: "Editorial curation",
        text: "Stories selected by our newsroom, not algorithms.",
      },
      {
        icon: Globe2,
        title: "Global South coverage",
        text: "Independent reporting from Africa, Latin America, Asia and beyond.",
      },
      {
        icon: Search,
        title: "Investigations first",
        text: "Early alerts when our reporters publish major probes.",
      },
      {
        icon: CheckCircle2,
        title: "Always free",
        text: "No paywall on breaking news — the newsletter is our reader relationship.",
      },
    ];

const STEPS = multiEdition
  ? [
      {
        num: "01",
        title: "Pick your editions",
        text: "Daily briefing, weekly digest, or regional feeds.",
      },
      { num: "02", title: "Confirm your email", text: "One click to verify — no account required." },
      { num: "03", title: "Read every morning", text: "Independent journalism, straight to your inbox." },
    ]
  : [
      { num: "01", title: "Enter your email", text: "One field — no account required." },
      { num: "02", title: "Confirm your subscription", text: "You're on the list in seconds." },
      { num: "03", title: "Read every morning", text: "Independent journalism, straight to your inbox." },
    ];

const TOPIC_ICONS: Record<string, typeof Sun> = {
  general: Sun,
  weekly: CalendarDays,
  africa: Globe2,
  "latin-america": MapPin,
  "south-asia": Globe2,
  "west-asia": Globe2,
  investigations: Search,
  breaking: Zap,
};

export default function NewsletterPage() {
  return (
    <div className="newsletter-page">
      <header className="newsletter-hero">
        <div className="newsletter-hero-ornament" aria-hidden />
        <div className="container newsletter-hero-inner">
          <span className="newsletter-page-eyebrow">
            <Mail className="newsletter-page-eyebrow-icon" aria-hidden />
            Stay informed
          </span>
          <h1 className="newsletter-page-title">
            Newsletters from the
            <span> Global South</span>
          </h1>
          <p className="newsletter-page-lead">
            {multiEdition
              ? "Choose your editions and receive independent journalism in your inbox — daily briefings, weekly digests, and regional coverage tailored to you."
              : "Receive our daily briefing in your inbox — independent journalism from across the Global South, curated by our newsroom."}
          </p>
          <div className="newsletter-page-stats">
            {STATS.map((stat) => (
              <div key={stat.label} className="newsletter-page-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="container newsletter-page-layout">
        <section className="newsletter-page-card" aria-labelledby="newsletter-signup-heading">
          <div className="newsletter-page-card-head">
            <h2 id="newsletter-signup-heading">Subscribe</h2>
            <p className="newsletter-page-card-sub">
              {multiEdition
                ? "Pick one or more editions below. Update your preferences anytime."
                : "Enter your email address to receive our newsletter. Unsubscribe anytime."}
            </p>
          </div>
          <NewsletterSignupForm variant="page" showTopics={multiEdition} />
        </section>

        <aside className="newsletter-page-aside">
          <h2>Why subscribe?</h2>
          <ul className="newsletter-page-perks">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <li key={perk.title}>
                  <span className="newsletter-page-perk-icon" aria-hidden>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <h3>{perk.title}</h3>
                    <p>{perk.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {multiEdition && (
            <div className="newsletter-page-editions">
              <h3>Available editions</h3>
              <ul className="newsletter-page-editions-grid">
                {NEWSLETTER_TOPICS.map((topic) => {
                  const Icon = TOPIC_ICONS[topic.id] ?? Mail;
                  return (
                    <li key={topic.id} className={`newsletter-edition-chip newsletter-edition-chip--${topic.id}`}>
                      <span className="newsletter-edition-chip-icon" aria-hidden>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <strong>{topic.label}</strong>
                        <span>{topic.description}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="newsletter-page-aside-cta">
            <p>Want to support our newsroom directly?</p>
            <Link href="/donate">Make a donation →</Link>
          </div>
        </aside>
      </div>

      <section className="newsletter-steps" aria-label="How it works">
        <div className="container">
          <p className="newsletter-steps-label">How it works</p>
          <div className="newsletter-steps-grid">
            {STEPS.map((step) => (
              <article key={step.num} className="newsletter-step">
                <span className="newsletter-step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <blockquote className="newsletter-quote">
        <div className="container newsletter-quote-inner">
          <p>
            &ldquo;The only morning read that puts Abidjan, São Paulo and Mumbai in the same
            conversation — without the Western filter.&rdquo;
          </p>
          <footer>— Reader, Nairobi</footer>
        </div>
      </blockquote>
    </div>
  );
}
