"use client";

import Link from "next/link";
import { NewsletterSignupForm } from "@/components/newsletter/NewsletterSignupForm";

interface HeroLatestNewsletterProps {
  enabled?: boolean;
}

export function HeroLatestNewsletter({ enabled = true }: HeroLatestNewsletterProps) {
  if (!enabled) return null;

  return (
    <div className="hero-latest-newsletter">
      <div className="hero-latest-newsletter-head">
        <h4 className="hero-latest-newsletter-title">Newsletter</h4>
        <Link href="/newsletter" className="hero-latest-newsletter-link">
          Learn more
        </Link>
      </div>
      <p className="hero-latest-newsletter-lead">
        Curated by our newsroom, straight to your inbox.
      </p>
      <NewsletterSignupForm variant="sidebar" showTopics={false} />
    </div>
  );
}
