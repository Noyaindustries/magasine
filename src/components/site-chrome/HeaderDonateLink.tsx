"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { HEADER_TOP_ACTIONS } from "@/data/site-home";

export function HeaderDonateLink() {
  const pathname = usePathname();
  const support = HEADER_TOP_ACTIONS[0];

  if (!support) return null;

  const active = pathname === support.href || pathname.startsWith(`${support.href}/`);

  return (
    <Link
      href={support.href}
      className={`header-donate-link${active ? " is-active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      <HeartHandshake className="header-donate-link-icon" size={17} strokeWidth={2} aria-hidden />
      <span className="header-donate-link-label">{support.label}</span>
    </Link>
  );
}
