"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { Bell, HelpCircle, Plus } from "lucide-react";
import { getCmsPageMeta } from "@/components/admin/cms/cms-nav";
import type { AdminNavStats } from "@/lib/admin-nav";
import { useSiteBranding } from "@/components/SiteBranding";

interface CmsTopBarProps {
  stats: AdminNavStats;
  onOpenMenu?: () => void;
}

export function CmsTopBar({ stats, onOpenMenu }: CmsTopBarProps) {
  const { siteName } = useSiteBranding();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const meta = getCmsPageMeta(pathname);
  const notifications = stats.pendingReview + stats.pendingComments;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/admin/articles?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="topbar">
      {onOpenMenu && (
        <button type="button" className="cms-menu-btn" onClick={onOpenMenu} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
      )}
      <div>
        <div className="tb-title">{meta.title}</div>
        <div className="tb-bc">
          {siteName} <strong>/ {meta.breadcrumb}</strong>
        </div>
      </div>
      <form className="tb-search" onSubmit={onSearch}>
        <Search className="w-3.5 h-3.5" aria-hidden />
        <input
          type="search"
          placeholder="Articles, media, authors, tags…"
          aria-label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="tb-kbd">↵</span>
      </form>
      <div className="tb-sep" />
      <div className="tb-actions">
        <Link href="/admin/review" className="tb-btn" title="Notifications">
          <Bell className="w-3.5 h-3.5" />
          {notifications > 0 && (
            <span className="tb-ndot">{notifications > 9 ? "9+" : notifications}</span>
          )}
        </Link>
        <button type="button" className="tb-btn" title="Help">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
        <div className="tb-sep" />
        <Link href="/admin/articles/new" className="tb-cta">
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          New article
        </Link>
      </div>
    </header>
  );
}
