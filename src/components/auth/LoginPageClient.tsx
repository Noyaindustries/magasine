"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  LogIn,
  Bookmark,
  Clock,
  MessageSquare,
  Mail,
  Shield,
} from "lucide-react";
import { BrandLogo } from "@/components/site-chrome/BrandLogo";
import { GoogleIcon } from "@/components/auth/auth-shared";
import { AuthPasswordField, AuthTextField } from "@/components/auth/AuthFields";
import { toast } from "@/lib/toast";

const STATS = [
  { value: "Free", label: "Reader account" },
  { value: "24/7", label: "Breaking access" },
  { value: "1 click", label: "Save articles" },
];

const PERKS = [
  {
    icon: Bookmark,
    title: "Saved articles",
    text: "Bookmark investigations and return to them from any device.",
  },
  {
    icon: Clock,
    title: "Reading history",
    text: "Pick up where you left off across Africa, Latin America, and beyond.",
  },
  {
    icon: MessageSquare,
    title: "Join the conversation",
    text: "Comment on stories and engage with our reporting community.",
  },
  {
    icon: Mail,
    title: "Newsletter sync",
    text: "Manage your regional editions from your reader profile.",
  },
];

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("E-mail ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    window.location.href = callbackUrl;
  };

  const handleGoogleSignIn = () => {
    void signIn("google", { callbackUrl });
  };

  return (
    <div className="auth-page auth-page--login">
      <header className="auth-hero">
        <div className="auth-hero-ornament" aria-hidden />
        <div className="auth-hero-grid" aria-hidden />
        <div className="container auth-hero-inner">
          <div className="auth-hero-brand-row">
            <Link href="/" className="auth-hero-logo" aria-label="Global South Watch — Home">
              <BrandLogo variant="auth" showTagline={false} linked={false} />
            </Link>
            <span className="auth-page-eyebrow auth-page-eyebrow--login">
              <LogIn className="auth-page-eyebrow-icon" aria-hidden />
              Reader space
            </span>
          </div>
          <h1 className="auth-page-title">
            Welcome back to
            <span> Global South Watch</span>
          </h1>
          <p className="auth-page-lead">
            Sign in to save articles, track your reading, and join the conversation —
            independent journalism from the Global South, free to read.
          </p>
          <div className="auth-page-stats">
            {STATS.map((stat) => (
              <div key={stat.label} className="auth-page-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="container auth-page-layout">
        <section className="auth-page-card" aria-labelledby="login-form-heading">
          <div className="auth-page-card-head">
            <h2 id="login-form-heading">Sign in</h2>
            <p className="auth-page-card-sub">
              Use your email or continue with Google.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <AuthTextField
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="you@example.com"
            />

            <AuthPasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="Your password"
            />

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button type="button" onClick={handleGoogleSignIn} className="auth-google-btn">
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="auth-card-footer">
            Don&apos;t have an account yet?{" "}
            <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Create one free
            </Link>
          </p>
        </section>

        <aside className="auth-page-aside">
          <h2>Your reader benefits</h2>
          <ul className="auth-page-perks">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <li key={perk.title}>
                  <span className="auth-page-perk-icon" aria-hidden>
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

          <div className="auth-trust-note">
            <Shield className="auth-trust-icon" aria-hidden />
            <p>
              We never sell your data. Your account only powers saved articles,
              comments, and newsletter preferences.
            </p>
          </div>

          <div className="auth-page-aside-cta">
            <p>No account needed for breaking news.</p>
            <Link href="/newsletter">Subscribe to newsletters →</Link>
          </div>
        </aside>
      </div>

      <section className="auth-switch-band" aria-label="Account options">
        <div className="container auth-switch-band-inner">
          <p>New to Global South Watch?</p>
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="auth-switch-band-link"
          >
            Create a free account →
          </Link>
        </div>
      </section>
    </div>
  );
}

export function LoginPageFallback() {
  return (
    <div className="auth-page auth-page--loading">
      <div className="container auth-loading-inner">
        <p>Loading sign-in…</p>
      </div>
    </div>
  );
}
