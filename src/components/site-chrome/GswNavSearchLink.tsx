"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_SEARCH_LINK } from "@/data/site-home";

type GswNavSearchLinkProps = {
  className?: string;
};

export function GswNavSearchLink({ className }: GswNavSearchLinkProps) {
  const pathname = usePathname();
  const active = pathname === "/search" || pathname.startsWith("/search/");

  return (
    <Link
      href={NAV_SEARCH_LINK.href}
      className={`gsw-nav-search-icon${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
      aria-label={NAV_SEARCH_LINK.label}
      title={NAV_SEARCH_LINK.label}
    >
      <Search size={18} strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
