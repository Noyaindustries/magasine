"use client";

import Link from "next/link";
import { ABOUT_NAV, FOOTER_BOTTOM_LINKS, FOOTER_SUPPORT_LINKS, SITE_TAGLINE } from "@/data/site-home";
import { SocialLinks } from "@/components/ui/SocialIcons";
import { useSiteNav } from "@/components/site-chrome/SiteNavContext";

export function SiteFooter() {
  const { footerSections, footerRegions, footerFormats } = useSiteNav();

  const footerColumns = [
    { title: "Sections", links: footerSections },
    { title: "Regions", links: footerRegions, variant: "regions" as const },
    { title: "Formats", links: footerFormats },
    {
      title: "About & support",
      links: [
        ...ABOUT_NAV.map(({ label, href }) => ({ label, href })),
        ...FOOTER_SUPPORT_LINKS.map(({ label, href }) => ({ label, href })),
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Legal notice", href: "/legal" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Terms of use", href: "/terms" },
      ],
    },
  ] as const;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <p className="footer-brand-tagline">{SITE_TAGLINE}</p>
            <p className="footer-brand-desc">
              Independent journalism from Africa and the Global South — news, commentary,
              explainers, and regional coverage.
            </p>
            <SocialLinks />
          </div>
          <div className="footer-cols">
            {footerColumns.map((col) => (
              <div
                key={col.title}
                className={`footer-col${"variant" in col ? " footer-col--regions" : ""}`}
              >
                <div className="footer-col-title">{col.title}</div>
                <ul className={"variant" in col ? "footer-col-list--inline" : undefined}>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Global South Watch — Noya Industries. All rights
            reserved.
          </span>
          <div className="footer-bottom-links">
            {FOOTER_BOTTOM_LINKS.map((link) =>
              "external" in link && link.external ? (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
