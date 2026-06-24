"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { HEADER_NAV, REGION_NAV } from "@/data/presse-ivoire-home";
import { BrandLogo } from "@/components/presse-ivoire/BrandLogo";
import { HeaderAuth } from "@/components/presse-ivoire/HeaderAuth";
import { MobileMenuButton, MobileNavDrawer } from "@/components/presse-ivoire/MobileNavDrawer";

function RegionsMegaMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isRegionActive = REGION_NAV.some((r) => pathname === r.href || pathname.startsWith(`${r.href}/`));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`header-nav-mega${open ? " is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`header-nav-mega-trigger${open || isRegionActive ? " is-active" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        Regions
        <svg
          className="header-nav-mega-chevron"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      <div className="header-nav-mega-panel" role="menu" aria-hidden={!open}>
        <div className="header-nav-mega-panel-head">
          <span className="header-nav-mega-panel-kicker">Global South coverage</span>
          <span className="header-nav-mega-panel-title">Explore by region</span>
        </div>
        <div className="header-nav-mega-panel-body">
          {REGION_NAV.map((region) => (
            <Link
              key={region.href}
              href={region.href}
              className={`header-nav-mega-item${pathname === region.href ? " is-current" : ""}`}
              role="menuitem"
              style={{ "--region-accent": region.accent } as React.CSSProperties}
              onClick={() => setOpen(false)}
            >
              <span className="header-nav-mega-item-accent" aria-hidden />
              <span className="header-nav-mega-item-text">
                <span className="header-nav-mega-item-label">{region.label}</span>
                <span className="header-nav-mega-item-desc">{region.description}</span>
              </span>
              <svg className="header-nav-mega-item-arrow" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeaderNavLinks({ className }: { className: string }) {
  return (
    <nav className={className} aria-label="Main navigation">
      {HEADER_NAV.map((item) =>
        item.mega ? (
          <RegionsMegaMenu key={item.label} />
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className={item.active ? "active" : undefined}
          >
            {item.label}
          </Link>
        )
      )}
    </nav>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    closeMobileMenu();
    setSearchOpen(false);
  }, [pathname, closeMobileMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="header" translate="no">
      <div className="header-inner">
        <div className="header-brand-row">
          <MobileMenuButton
            open={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          />
          <BrandLogo variant="header" />
        </div>

        <HeaderNavLinks className="header-nav-left header-nav-left--desktop" />

        <div className="header-actions">
          <button
            type="button"
            className="btn-search"
            title="Search"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
            aria-expanded={searchOpen}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <HeaderAuth />
        </div>
      </div>

      <nav className="header-regions-strip" aria-label="Regions">
        {REGION_NAV.map((region) => (
          <Link
            key={region.href}
            href={region.href}
            className={pathname === region.href || pathname.startsWith(`${region.href}/`) ? "is-active" : undefined}
          >
            {region.label}
          </Link>
        ))}
      </nav>

      <MobileNavDrawer open={mobileMenuOpen} onClose={closeMobileMenu} />

      {searchOpen && (
        <form onSubmit={handleSearch} className="container header-search" style={{ paddingBottom: 16 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an article, section, or author..."
            className="nl-input"
            style={{ width: "100%", background: "var(--cream)", color: "var(--ink)", borderColor: "var(--rule)" }}
            autoFocus
          />
        </form>
      )}
    </header>
  );
}
