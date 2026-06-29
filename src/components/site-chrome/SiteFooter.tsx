import Link from "next/link";
import { FOOTER_BOTTOM_LINKS, FOOTER_COLS, SITE_TAGLINE } from "@/data/site-home";
import { SocialLinks } from "@/components/ui/SocialIcons";

const FOOTER_COLUMNS = [
  { title: "Sections", links: FOOTER_COLS.sections },
  { title: "Regions", links: FOOTER_COLS.regions, variant: "regions" as const },
  { title: "Formats", links: FOOTER_COLS.formats },
  { title: "About & support", links: FOOTER_COLS.about },
  { title: "Legal", links: FOOTER_COLS.legal },
] as const;

export function SiteFooter() {
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
            {FOOTER_COLUMNS.map((col) => (
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
