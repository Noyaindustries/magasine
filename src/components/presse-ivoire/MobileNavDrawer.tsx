"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HEADER_NAV, NAV_RUBRIQUES, REGION_NAV, ABOUT_NAV } from "@/data/presse-ivoire-home";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`mobile-nav-chevron${open ? " is-open" : ""}`}
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
    >
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    onClose();
    setRegionsOpen(false);
    setSectionsOpen(false);
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

  useEffect(() => {
    if (open) {
      setRegionsOpen(true);
      setSectionsOpen(true);
    } else {
      setRegionsOpen(false);
      setSectionsOpen(false);
    }
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/urgent" || href === "/#urgent") {
      return pathname === "/urgent" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const mainLinks = HEADER_NAV.filter((item) => !item.mega);
  const sectionLinks = NAV_RUBRIQUES.filter(
    (item) => !REGION_NAV.some((region) => region.href === item.href)
  );

  if (!mounted) {
    return null;
  }

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
          <ul className="mobile-nav-list">
            {mainLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`mobile-nav-link${isActive(item.href) ? " is-active" : ""}`}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mobile-nav-accordion">
            <button
              type="button"
              className={`mobile-nav-accordion-trigger${regionsOpen ? " is-open" : ""}`}
              aria-expanded={regionsOpen}
              onClick={() => setRegionsOpen((v) => !v)}
            >
              <span>
                Regions
                <small className="mobile-nav-accordion-count">{REGION_NAV.length}</small>
              </span>
              <Chevron open={regionsOpen} />
            </button>
            <div
              className={`mobile-nav-accordion-panel${regionsOpen ? " is-open" : ""}`}
              aria-hidden={!regionsOpen}
            >
              <div className="mobile-nav-accordion-panel-inner">
                <ul className="mobile-nav-sublist">
                {REGION_NAV.map((region) => (
                  <li key={region.href}>
                    <Link
                      href={region.href}
                      className={`mobile-nav-sublink${isActive(region.href) ? " is-active" : ""}`}
                      style={{ "--region-accent": region.accent } as React.CSSProperties}
                      onClick={onClose}
                    >
                      <span className="mobile-nav-region-dot" aria-hidden />
                      <span>
                        <strong>{region.label}</strong>
                        <small>{region.description}</small>
                      </span>
                    </Link>
                  </li>
                ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mobile-nav-accordion">
            <button
              type="button"
              className={`mobile-nav-accordion-trigger${sectionsOpen ? " is-open" : ""}`}
              aria-expanded={sectionsOpen}
              onClick={() => setSectionsOpen((v) => !v)}
            >
              <span>
                Sections
                <small className="mobile-nav-accordion-count">{sectionLinks.length}</small>
              </span>
              <Chevron open={sectionsOpen} />
            </button>
            <div
              className={`mobile-nav-accordion-panel${sectionsOpen ? " is-open" : ""}`}
              aria-hidden={!sectionsOpen}
            >
              <div className="mobile-nav-accordion-panel-inner">
                <ul className="mobile-nav-sublist mobile-nav-sublist--grid">
                {sectionLinks.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className={`mobile-nav-sublink mobile-nav-sublink--compact${isActive(item.href) ? " is-active" : ""}`}
                      onClick={onClose}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                </ul>
              </div>
            </div>
          </div>
        </nav>

        <nav className="mobile-nav-about" aria-label="About Global South Watch">
          <p className="mobile-nav-about-label">About us</p>
          <ul className="mobile-nav-about-list">
            {ABOUT_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`mobile-nav-about-link${isActive(item.href.split("#")[0] ?? item.href) ? " is-active" : ""}`}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-nav-footer">
          <Link href="/newsletter" className="mobile-nav-cta mobile-nav-cta--primary" onClick={onClose}>
            Newsletter
          </Link>
          <Link href="/donate" className="mobile-nav-cta mobile-nav-cta--secondary" onClick={onClose}>
            Donate
          </Link>
          <Link href="/search" className="mobile-nav-cta mobile-nav-cta--ghost" onClick={onClose}>
            Search
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
