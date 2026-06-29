"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HEADER_SOCIAL_NETWORKS,
  HEADER_UTILITY_LINKS,
} from "@/data/site-home";
import { SocialLinks } from "@/components/ui/SocialIcons";

function isUtilityLinkActive(pathname: string, href: string) {
  const [path, hash] = href.split("#");
  if (hash) {
    return pathname === path;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderUtilityBar() {
  const pathname = usePathname();

  return (
    <nav className="header-utility" aria-label="About and support">
      <div className="container header-utility-inner">
        <div className="header-top-links">
        {HEADER_UTILITY_LINKS.map((item) => {
          const active = isUtilityLinkActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`header-top-link${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}

        <span className="header-utility-divider" aria-hidden />

        <SocialLinks
          variant="header"
          networks={[...HEADER_SOCIAL_NETWORKS]}
          iconClassName="w-3.5 h-3.5"
        />
        </div>
      </div>
    </nav>
  );
}
