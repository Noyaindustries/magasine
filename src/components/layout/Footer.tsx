"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";

const footerLinks = {
  rubriques: [
    { label: "News", href: "/category/actualites" },
    { label: "World", href: "/category/monde" },
    { label: "Technology", href: "/category/technologie" },
    { label: "Culture", href: "/category/culture" },
    { label: "Health", href: "/category/sante" },
  ],
  magazine: [
    { label: "Editor's Choice", href: "/#editors-choice" },
    { label: "Investigations", href: "/category/investigations" },
    { label: "Special Reports", href: "/category/reportages-speciaux" },
    { label: "Opinion", href: "/category/opinion" },
    { label: "Multimedia", href: "/category/multimedia" },
  ],
  legal: [
    { label: "Legal notice", href: "/legal" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
    { label: "Contact", href: "/contact" },
  ],
};

const socialLinks = [
  { label: "Facebook", href: "#", letter: "f" },
  { label: "Twitter", href: "#", letter: "𝕏" },
  { label: "Instagram", href: "#", letter: "◎" },
  { label: "LinkedIn", href: "#", letter: "in" },
  { label: "YouTube", href: "#", letter: "▶" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="bg-charcoal text-white mt-20">
      <div className="gold-line" />

      <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link href="/" className="inline-block mb-6">
              <span className="font-serif text-2xl font-bold">
                Depth<span className="text-gold">Mag</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Your premium magazine portal. Quality journalism, in-depth analysis,
              and exceptional reporting.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ href, label, letter }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 flex items-center justify-center rounded-sm bg-white/5 hover:bg-gold hover:text-charcoal transition-all duration-300 text-xs font-bold"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-6">
              Sections
            </h4>
            <ul className="space-y-3">
              {footerLinks.rubriques.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-6">
              The Magazine
            </h4>
            <ul className="space-y-3">
              {footerLinks.magazine.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold mb-6">
              Newsletter
            </h4>
            <p className="text-sm text-white/60 mb-4">
              Get the day&apos;s essential headlines every morning.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-sm text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold"
                />
              </div>
              <Button
                type="submit"
                variant="gold"
                size="sm"
                className="w-full"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </Button>
              {status === "success" && (
                <p className="text-xs text-gold">Successfully subscribed!</p>
              )}
              {status === "error" && (
                <p className="text-xs text-accent">Something went wrong.</p>
              )}
            </form>
          </div>
        </div>

        <div className="gold-line my-10 opacity-30" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>© {new Date().getFullYear()} Global South Watch — Noya Industries. All rights reserved.</p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-white/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
