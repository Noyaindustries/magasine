import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { MultilineText } from "@/components/ui/MultilineText";

interface UtilityPageLayoutProps {
  eyebrow: string;
  eyebrowIcon?: LucideIcon;
  title: React.ReactNode;
  lead?: string;
  actions?: { label: string; href: string; external?: boolean }[];
  children: React.ReactNode;
  wide?: boolean;
}

export function UtilityPageLayout({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  lead,
  actions,
  children,
  wide = false,
}: UtilityPageLayoutProps) {
  return (
    <div className="utility-page">
      <header className="utility-hero">
        <div className="utility-hero-ornament" aria-hidden />
        <div className="container utility-hero-inner">
          <span className="utility-eyebrow">
            {EyebrowIcon && <EyebrowIcon className="utility-eyebrow-icon" aria-hidden />}
            {eyebrow}
          </span>
          <h1 className="utility-title">{title}</h1>
          {lead && <MultilineText className="utility-lead">{lead}</MultilineText>}
          {actions && actions.length > 0 && (
            <div className="utility-hero-actions">
              {actions.map((action) =>
                action.external ? (
                  <a
                    key={action.href}
                    href={action.href}
                    className="utility-hero-btn"
                  >
                    {action.label}
                  </a>
                ) : (
                  <Link key={action.href} href={action.href} className="utility-hero-btn">
                    {action.label}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </header>
      <div className={`container utility-body${wide ? " utility-body--wide" : ""}`}>
        {children}
      </div>
    </div>
  );
}
