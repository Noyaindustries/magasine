"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { HeartHandshake } from "lucide-react";
import { ABOUT_MENU_NAV, HEADER_TOP_ACTIONS, NAV_SUBSCRIBE_LINK } from "@/data/site-home";
import { useSiteNav } from "@/components/site-chrome/SiteNavContext";
import { useIsClient } from "@/lib/use-is-client";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

function useNavActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/") return pathname === "/";
    const base = href.split("#")[0] ?? href;
    return pathname === base || pathname.startsWith(`${base}/`);
  };
}

function MobileNavSection({
  label,
  links,
  onClose,
  variant = "section",
}: {
  label: string;
  links: readonly { label: string; href: string }[];
  onClose: () => void;
  variant?: "section" | "region" | "utility";
}) {
  const isActive = useNavActive();
  const linkClass =
    variant === "region"
      ? "mobile-nav-link mobile-nav-link--region"
      : variant === "utility"
        ? "mobile-nav-link mobile-nav-link--utility"
        : "mobile-nav-link";

  return (
    <li className="mobile-nav-group">
      <p className="mobile-nav-section-label" id={`mobile-nav-${label.replace(/\s+/g, "-").toLowerCase()}`}>
        {label}
      </p>
      <ul className="mobile-nav-sublist" aria-labelledby={`mobile-nav-${label.replace(/\s+/g, "-").toLowerCase()}`}>
        {links.map((item) => (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              className={`${linkClass}${isActive(item.href) ? " is-active" : ""}`}
              onClick={onClose}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const mounted = useIsClient();
  const { newsMenu, primary, regions, footerFormats } = useSiteNav();

  const mobileNews = newsMenu.map(({ label, href }) => ({ label, href }));
  const mobileSections = primary.filter((item) => item.href !== "/category/news");
  const mobileRegions = regions.map(({ label, href }) => ({ label, href }));
  const mobileFormats = footerFormats;
  const mobileAbout = ABOUT_MENU_NAV.map(({ label, href }) => ({ label, href }));
  const mobileSupport = [
    { label: "Newsletter", href: "/newsletter" },
    { label: "Donate", href: "/donate" },
    { label: "Contact", href: "/contact" },
    { label: "Write for us", href: "/write-for-us" },
    { label: "Search", href: "/search" },
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) {
    return null;
  }

  const legalLinks = [
    { label: "Legal notice", href: "/legal" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of use", href: "/terms" },
    { label: "Accessibility", href: "/accessibility" },
  ];

  return createPortal(
    <>
      <button
        type="button"
        className={`mobile-nav-overlay${open ? " is-open" : ""}`}
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <div
        id="mobile-nav-drawer"
        className={`mobile-nav-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        aria-hidden={!open}
      >
        <div className="mobile-nav-drawer-head">
          <span className="mobile-nav-drawer-title">Menu</span>
          <button
            type="button"
            className="mobile-nav-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path
                d="M4 4l10 10M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="mobile-nav-body" aria-label="Mobile navigation">
          <ul className="mobile-nav-list mobile-nav-list--unified">
            <MobileNavSection label="News" links={mobileNews} onClose={onClose} />
            <MobileNavSection label="Sections" links={mobileSections} onClose={onClose} />
            <MobileNavSection
              label="Regions"
              links={mobileRegions}
              onClose={onClose}
              variant="region"
            />
            <MobileNavSection label="Formats" links={mobileFormats} onClose={onClose} />
            <MobileNavSection
              label="About"
              links={mobileAbout}
              onClose={onClose}
              variant="utility"
            />
            <MobileNavSection
              label="Support"
              links={mobileSupport}
              onClose={onClose}
              variant="utility"
            />
            <MobileNavSection
              label="Legal"
              links={legalLinks}
              onClose={onClose}
              variant="utility"
            />
          </ul>
        </nav>

        <div className="mobile-nav-footer">
          <Link
            href={NAV_SUBSCRIBE_LINK.href}
            className="mobile-nav-cta mobile-nav-cta--primary"
            onClick={onClose}
          >
            {NAV_SUBSCRIBE_LINK.label}
          </Link>
          <Link
            href={HEADER_TOP_ACTIONS[0].href}
            className="mobile-nav-cta mobile-nav-cta--secondary"
            onClick={onClose}
          >
            <HeartHandshake size={16} strokeWidth={2} aria-hidden />
            {HEADER_TOP_ACTIONS[0].label}
          </Link>
        </div>
      </div>
    </>,
    document.body
  );
}

interface MobileMenuButtonProps {
  open: boolean;
  onClick: () => void;
}

export function MobileMenuButton({ open, onClick }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      className={`btn-mobile-menu${open ? " is-open" : ""}`}
      aria-expanded={open}
      aria-controls="mobile-nav-drawer"
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onClick}
    >
      <span className="btn-mobile-menu-bars" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span className="btn-mobile-menu-label">Menu</span>
    </button>
  );
}
