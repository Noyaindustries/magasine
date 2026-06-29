"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SUBSCRIBE_LINK } from "@/data/site-home";

type GswNavSubscribeLinkProps = {
  className?: string;
};

export function GswNavSubscribeLink({ className }: GswNavSubscribeLinkProps) {
  const pathname = usePathname();
  const active = pathname === "/newsletter" || pathname.startsWith("/newsletter/");

  return (
    <Link
      href={NAV_SUBSCRIBE_LINK.href}
      className={`btn-subscribe gsw-nav-subscribe${active ? " is-active" : ""}${className ? ` ${className}` : ""}`}
    >
      <span className="btn-subscribe-label">{NAV_SUBSCRIBE_LINK.label}</span>
    </Link>
  );
}
