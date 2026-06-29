"use client";

import { NewsletterSignupForm } from "@/components/newsletter/NewsletterSignupForm";

interface NewsletterBannerProps {
  enabled?: boolean;
  title?: string;
  titleEm?: string;
  description?: string;
  benefits?: string[];
}

const DEFAULT_BENEFITS = [
  "Daily briefing every morning",
  "Regional editions you choose",
  "Investigation alerts — always free",
];

export function NewsletterBanner({
  enabled = true,
  title = "The essentials every morning,",
  titleEm = "delivered straight to your inbox.",
  description = "An editorial selection of the most important news from Africa and the Global South, curated by our newsroom.",
  benefits = DEFAULT_BENEFITS,
}: NewsletterBannerProps) {
  if (!enabled) return null;

  return (
    <section className="newsletter-banner newsletter-premium">
      <div className="newsletter-pattern" aria-hidden />
      <div className="newsletter-inner">
        <div className="newsletter-copy">
          <div className="nl-emblem" aria-hidden>GSW</div>
          <div className="nl-label">Newsletter</div>
          <h2 className="nl-title">
            {title}
            <br />
            <em>{titleEm}</em>
          </h2>
          <p className="nl-desc">{description}</p>
          <ul className="nl-benefits">
            {benefits.map((b) => (
              <li key={b}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="8" r="8" fill="rgba(26,56,150,0.1)" />
                  <path d="M5 8l2 2 4-4" stroke="#1a3896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="newsletter-form-wrap">
          <div className="newsletter-form-card">
            <NewsletterSignupForm variant="banner" showTopics={false} />
          </div>
        </div>
      </div>
    </section>
  );
}
