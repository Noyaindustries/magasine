import Link from "next/link";

interface SectionHeaderProps {
  number: string;
  eyebrow: string;
  title: string;
  linkHref: string;
  linkLabel: string;
  revealDelay?: number;
}

export function SectionHeader({
  number,
  eyebrow,
  title,
  linkHref,
  linkLabel,
  revealDelay,
}: SectionHeaderProps) {
  return (
    <div
      className="section-header section-header-premium section-header--revolution reveal"
      {...(revealDelay !== undefined ? { "data-reveal-delay": revealDelay } : {})}
    >
      <div className="section-header-main">
        <span className="section-number" aria-hidden>
          {number}
        </span>
        <div>
          <span className="section-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <Link href={linkHref} className="section-link">
        {linkLabel}
      </Link>
    </div>
  );
}
