import type { CSSProperties } from "react";
import Link from "next/link";
import type { SectionKind } from "@/lib/sections";

interface SectionPageHeroProps {
  name: string;
  slug: string;
  kind: SectionKind;
  eyebrow: string;
  lead: string;
  description?: string;
  accent?: string;
  linkHref?: string;
  linkLabel?: string;
  formatLinks?: { label: string; href: string }[];
}

export function SectionPageHero({
  name,
  slug,
  kind,
  eyebrow,
  lead,
  description,
  accent,
  linkHref,
  linkLabel,
  formatLinks,
}: SectionPageHeroProps) {
  const displayLead = description?.trim() || lead;

  return (
    <header
      className={`section-page-hero section-page-hero--${kind}`}
      style={accent ? ({ "--section-accent": accent } as CSSProperties) : undefined}
    >
      <div className="section-page-hero-ornament" aria-hidden />
      <div className="section-page-hero-grid" aria-hidden />
      <div className="container section-page-hero-inner">
        <nav className="category-breadcrumb section-page-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <span>{name}</span>
        </nav>

        <div className="section-page-hero-main">
          <div>
            <span className="section-page-hero-eyebrow">{eyebrow}</span>
            <h1 className="section-page-hero-title">{name}</h1>
            <p className="section-page-hero-lead">{displayLead}</p>
          </div>
        </div>

        <div className="section-page-hero-actions">
          {linkHref && linkLabel && (
            <Link href={linkHref} className="section-page-hero-link">
              {linkLabel}
            </Link>
          )}
          {formatLinks?.map((item) => (
            <Link key={item.href} href={item.href} className="section-page-hero-link">
              {item.label}
            </Link>
          ))}
          <Link href={`/search?category=${slug}`} className="section-page-hero-link section-page-hero-link--muted">
            Search in {name}
          </Link>
        </div>
      </div>
    </header>
  );
}
