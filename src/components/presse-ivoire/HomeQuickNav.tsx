"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/data/presse-ivoire-home";

interface HomeQuickNavProps {
  categories?: { name: string; slug: string }[];
}

type NavItem = { label: string; href: string; featured: boolean; icon?: string };

function isActive(pathname: string, href: string) {
  if (href === "/urgent" || href === "/#urgent") {
    return pathname === "/urgent" || pathname === "/";
  }
  if (href.startsWith("/category/")) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href;
}

function NavPill({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "home-quick-pill",
        item.featured ? "home-quick-pill--featured" : "",
        active ? "home-quick-pill--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {item.icon && (
        <span className="home-quick-pill-icon" aria-hidden>
          {item.icon}
        </span>
      )}
      {item.label}
    </Link>
  );
}

export function HomeQuickNav({ categories: _categories }: HomeQuickNavProps) {
  const pathname = usePathname();

  const items: NavItem[] = NAV_SECTIONS.map((r) => ({
    label: r.label,
    href: r.href,
    featured: false,
  }));

  return (
    <nav className="home-quick-nav home-quick-nav--revolution" aria-label="Quick sections">
      <div className="container home-quick-nav-wrap">
        <div className="home-quick-nav-head">
          <div className="home-quick-nav-actions">
            <Link href="/donate" className="home-quick-nav-donate btn-donate">
              Donate
            </Link>
            <Link href="/newsletter" className="home-quick-nav-newsletter" aria-label="Newsletter">
              Newsletter
            </Link>
          </div>
        </div>

        <div className="home-quick-nav-rail">
          <div className="home-quick-nav-track">
            {items.map((item) => (
              <NavPill
                key={item.href + item.label}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
