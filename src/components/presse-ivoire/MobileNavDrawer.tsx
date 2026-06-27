"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HeartHandshake } from "lucide-react";
import { HEADER_TOP_ACTIONS, MOBILE_NAV, NAV_SUBSCRIBE_LINK } from "@/data/presse-ivoire-home";

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
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

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
    ...MOBILE_NAV.legal,
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
            <MobileNavSection label="News" links={MOBILE_NAV.news} onClose={onClose} />
            <MobileNavSection label="Sections" links={MOBILE_NAV.sections} onClose={onClose} />
            <MobileNavSection
              label="Regions"
              links={MOBILE_NAV.regions}
              onClose={onClose}
              variant="region"
            />
            <MobileNavSection label="Formats" links={MOBILE_NAV.formats} onClose={onClose} />
            <MobileNavSection
              label="About"
              links={MOBILE_NAV.about}
              onClose={onClose}
              variant="utility"
            />
            <MobileNavSection
              label="Support"
              links={MOBILE_NAV.support}
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
