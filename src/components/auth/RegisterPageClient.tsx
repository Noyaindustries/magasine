"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  UserPlus,
  Bookmark,
  Bell,
  Globe2,
  Sparkles,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { BrandLogo } from "@/components/site-chrome/BrandLogo";
import { GoogleIcon } from "@/components/auth/auth-shared";
import { AuthPasswordField, AuthTextField } from "@/components/auth/AuthFields";
import { toast } from "@/lib/toast";
import { PUBLISHER_NAME } from "@/lib/site";

const STATS = [
  { value: "Free", label: "Forever" },
  { value: "2 min", label: "To sign up" },
  { value: "0", label: "Paywalls on news" },
];

const PERKS = [
  {
    icon: Bookmark,
    title: "Save what matters",
    text: "Bookmark investigations and build your personal reading list.",
  },
  {
    icon: Bell,
    title: "Newsletter ready",
    text: "Link regional editions to your profile after signing up.",
  },
  {
    icon: Globe2,
    title: "Global South focus",
    text: "Comment, react, and follow coverage across four continents.",
  },
  {
    icon: Sparkles,
    title: "Reader-first",
    text: "No subscription required to read breaking news — account is optional power-ups.",
  },
];

const STEPS = [
  { num: "01", title: "Create your profile", text: "Name, email, and a secure password." },
  { num: "02", title: "Start reading", text: "Instant access to saved articles and history." },
  { num: "03", title: "Go further", text: "Add newsletter editions from your profile." },
];

export function RegisterPageClient({ googleAuthEnabled = false }: { googleAuthEnabled?: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast.error("Please accept the terms of use to continue.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(
        data.error === "Email already in use"
          ? "This email is already registered."
          : (data.error ?? "Registration failed. Please try again.")
      );
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.warning("Account created — please sign in manually.");
      setLoading(false);
      return;
    }

    toast.success("Welcome!");

    window.location.href = callbackUrl;
  };

  const handleGoogleSignIn = () => {
    void signIn("google", { callbackUrl });
  };

  return (
    <div className="auth-page auth-page--register">
      <header className="auth-hero">
        <div className="auth-hero-ornament" aria-hidden />
        <div className="auth-hero-grid" aria-hidden />
        <div className="container auth-hero-inner">
          <div className="auth-hero-brand-row">
            <Link href="/" className="auth-hero-logo" aria-label="Global South Watch — Home">
              <BrandLogo variant="auth" showTagline={false} linked={false} />
            </Link>
            <span className="auth-page-eyebrow auth-page-eyebrow--register">
              <UserPlus className="auth-page-eyebrow-icon" aria-hidden />
              Join us
            </span>
          </div>
          <h1 className="auth-page-title">
            Create your
            <span> reader account</span>
          </h1>
          <p className="auth-page-lead">
            Free access to independent journalism from the Global South — save articles,
            track your reading, and join the conversation. Published by {PUBLISHER_NAME}.
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
        <section className="auth-page-card" aria-labelledby="register-form-heading">
          <div className="auth-page-card-head">
            <h2 id="register-form-heading">Sign up</h2>
            <p className="auth-page-card-sub">
              {googleAuthEnabled
                ? "All fields are required. You can also register with Google."
                : "All fields are required."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <AuthTextField
              id="name"
              label="Full name"
              value={name}
              onChange={setName}
              autoComplete="name"
              placeholder="Ada Lovelace"
              minLength={2}
            />

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
              autoComplete="new-password"
              placeholder="At least 12 characters"
              minLength={12}
              showStrength
              hint="Minimum 12 characters with uppercase, lowercase, and a number."
            />

            <label className="auth-checkbox-field">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer">
                  terms of use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </Link>
                .
              </span>
            </label>

            <button type="submit" className="auth-submit auth-submit--register" disabled={loading}>
              {loading ? "Creating account…" : "Create my account"}
            </button>
          </form>

          {googleAuthEnabled && (
            <>
              <div className="auth-divider">
                <span>or</span>
              </div>

              <button type="button" onClick={handleGoogleSignIn} className="auth-google-btn">
                <GoogleIcon />
                Continue with Google
              </button>
            </>
          )}

          <p className="auth-card-footer">
            Already have an account?{" "}
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Sign in
            </Link>
          </p>
        </section>

        <aside className="auth-page-aside">
          <h2>Why join?</h2>
          <ul className="auth-page-perks">
            {PERKS.map((perk) => {
              const Icon = perk.icon;
              return (
                <li key={perk.title}>
                  <span className="auth-page-perk-icon auth-page-perk-icon--register" aria-hidden>
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

          <div className="auth-trust-note auth-trust-note--register">
            <Shield className="auth-trust-icon" aria-hidden />
            <p>
              Your data stays with {PUBLISHER_NAME}. We use your email only for account
              access and optional newsletters you choose.
            </p>
          </div>

          <div className="auth-page-aside-cta">
            <p>Just browsing? Breaking news stays free.</p>
            <Link href="/">Back to homepage →</Link>
          </div>
        </aside>
      </div>

      <section className="auth-steps-band" aria-label="How registration works">
        <div className="container">
          <p className="auth-steps-band-label">How it works</p>
          <div className="auth-steps-band-grid">
            {STEPS.map((step) => (
              <article key={step.num} className="auth-steps-band-item">
                <span className="auth-steps-band-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
          <p className="auth-steps-band-note">
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            No credit card · No premium paywall on daily news
          </p>
        </div>
      </section>
    </div>
  );
}

export function RegisterPageFallback() {
  return (
    <div className="auth-page auth-page--loading">
      <div className="container auth-loading-inner">
        <p>Loading registration…</p>
      </div>
    </div>
  );
}
