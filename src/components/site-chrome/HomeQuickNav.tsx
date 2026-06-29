"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import {
  PRIMARY_NAV,
  REGION_NAV,
} from "@/data/site-home";
import { GswNavNewsMenu } from "@/components/site-chrome/GswNavNewsMenu";
import { GswNavSearchLink } from "@/components/site-chrome/GswNavSearchLink";
import { GswNavSubscribeLink } from "@/components/site-chrome/GswNavSubscribeLink";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.split("#")[0] ?? href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavLink({
  href,
  label,
  variant = "section",
  className,
}: {
  href: string;
  label: string;
  variant?: "section" | "region";
  className?: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={`gsw-nav-link gsw-nav-link--${variant}${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function HomeQuickNav() {
  return (
    <div className="gsw-site-nav" translate="no">
      <nav className="gsw-nav" aria-label="Main navigation">
        <div className="container gsw-nav-inner gsw-nav-inner--single">
          <div className="gsw-nav-track">
            <div className="gsw-nav-track-group">
              <Suspense fallback={<span className="gsw-nav-link">News</span>}>
                <GswNavNewsMenu />
              </Suspense>
              {PRIMARY_NAV.filter((item) => item.label !== "News").map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
              <NavLink href="/about" label="About" />
            </div>
            <div className="gsw-nav-track-group gsw-nav-track-group--regions">
              <span className="gsw-nav-divider" aria-hidden />
              {REGION_NAV.map((region) => (
                <NavLink
                  key={region.href}
                  href={region.href}
                  label={region.label}
                  variant="region"
                />
              ))}
            </div>
          </div>
          <div className="gsw-nav-end-actions">
            <GswNavSearchLink className="gsw-nav-search-end" />
            <GswNavSubscribeLink />
          </div>
        </div>
      </nav>
    </div>
  );
}
