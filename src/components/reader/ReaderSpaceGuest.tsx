"use client";

import Link from "next/link";
import {
  Bookmark,
  Clock,
  LogIn,
  MessageSquare,
  Mail,
  User,
} from "lucide-react";
import { BrandLogo } from "@/components/site-chrome/BrandLogo";

const PERKS = [
  {
    icon: Bookmark,
    title: "Saved articles",
    text: "Bookmark investigations and return from any device.",
  },
  {
    icon: Clock,
    title: "Reading history",
    text: "Pick up where you left off across the Global South.",
  },
  {
    icon: MessageSquare,
    title: "Join the conversation",
    text: "Comment on stories and engage with our community.",
  },
  {
    icon: Mail,
    title: "Newsletter sync",
    text: "Manage regional editions from your reader space.",
  },
];

export function ReaderSpaceGuest() {
  return (
    <div className="reader-space reader-guest">
      <header className="auth-hero reader-hero">
        <div className="auth-hero-ornament" aria-hidden />
        <div className="reader-hero-inner" style={{ textAlign: "center", maxWidth: 720 }}>
          <div className="auth-hero-brand-row">
            <Link href="/" className="auth-hero-logo" aria-label="Global South Watch — Home">
              <BrandLogo variant="auth" showTagline={false} linked={false} />
            </Link>
            <span className="reader-hero-eyebrow">
              <User aria-hidden />
              Reader space
            </span>
          </div>
          <h1 className="auth-page-title" style={{ color: "#fff" }}>
            Your personal
            <span> reading desk</span>
          </h1>
          <p className="auth-page-lead" style={{ color: "rgba(255,255,255,0.65)" }}>
            Sign in to save articles, track your reading journey, and manage your
            newsletter — independent journalism from the Global South.
          </p>
          <div className="auth-page-stats" style={{ marginBottom: 32 }}>
            <div className="auth-page-stat">
              <strong style={{ color: "#fff" }}>Free</strong>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Reader account</span>
            </div>
            <div className="auth-page-stat">
              <strong style={{ color: "#fff" }}>24/7</strong>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Breaking access</span>
            </div>
            <div className="auth-page-stat">
              <strong style={{ color: "#fff" }}>1 click</strong>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>Save articles</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/login?callbackUrl=/profile" className="reader-empty-cta">
              <LogIn size={16} aria-hidden />
              Sign in
            </Link>
            <Link
              href="/register"
              className="reader-empty-cta"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.35)", color: "#fff" }}
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <div className="container auth-page-layout" style={{ paddingTop: 48 }}>
        <aside className="auth-page-aside">
          <h2>What you unlock</h2>
          <ul className="auth-page-perks">
            {PERKS.map((perk) => (
              <li key={perk.title}>
                <perk.icon className="auth-page-perk-icon" aria-hidden />
                <div>
                  <strong>{perk.title}</strong>
                  <p>{perk.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <div className="auth-page-card">
          <div className="auth-page-card-head">
            <h2>Ready to continue?</h2>
            <p className="auth-page-card-sub">
              Use the same credentials as the login page. Your saved articles sync
              instantly across devices.
            </p>
          </div>
          <Link href="/login?callbackUrl=/profile" className="auth-submit">
            <LogIn className="auth-submit-icon" aria-hidden />
            Sign in to reader space
          </Link>
          <p className="auth-card-footer">
            New here?{" "}
            <Link href="/register">Create a free account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
