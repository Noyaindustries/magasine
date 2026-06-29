"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  PenLine,
  MessageSquare,
  Users,
  Mail,
  Settings,
  ImageIcon,
  Megaphone,
  TrendingUp,
  X,
  LogOut,
} from "lucide-react";
import type { UserRole } from "@/types";
import type { AdminNavStats } from "@/lib/admin-nav";
import {
  CMS_NAV_GROUPS,
  CMS_ROLE_LABELS,
  canSeeCmsNav,
  type CmsNavItem,
} from "@/components/admin/cms/cms-nav";
import { CmsBrandLogo } from "@/components/admin/cms/CmsBrandLogo";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  articles: FileText,
  editor: PenLine,
  medias: ImageIcon,
  comments: MessageSquare,
  newsletter: Mail,
  users: Users,
  ads: Megaphone,
  analytics: TrendingUp,
  seo: Settings,
};

const NAV_ICON_TONES: Record<string, "red" | "blue" | "green" | "amber" | "purple" | "slate"> = {
  dashboard: "blue",
  articles: "red",
  editor: "green",
  medias: "purple",
  comments: "amber",
  users: "blue",
  ads: "amber",
  newsletter: "green",
  analytics: "purple",
  seo: "slate",
};

interface CmsSidebarProps {
  user: { name: string; email: string; role: UserRole };
  stats: AdminNavStats;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "PI";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function isNavActive(pathname: string, item: CmsNavItem) {
  if (!item.href) return false;
  const href = item.href;
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/articles") {
    return pathname === "/admin/articles" || pathname.startsWith("/admin/articles?");
  }
  if (href === "/admin/settings") {
    if (item.id === "seo") return pathname.startsWith("/admin/settings");
    return false;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  stats,
  active,
  onNavigate,
}: {
  item: CmsNavItem;
  stats: AdminNavStats;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = NAV_ICONS[item.id] ?? FileText;
  const iconTone = NAV_ICON_TONES[item.id] ?? "slate";
  const badgeCount = item.badge ? stats[item.badge] : 0;
  const className = cn("sb-link", active && "on", item.disabled && "sb-link--disabled");

  const content = (
    <>
      <span className={cn("sb-ico-box", `sb-ico-box--${iconTone}`)}>
        <Icon className="sb-ico" aria-hidden />
      </span>
      {item.label}
      {item.badge !== undefined && (
        <span
          className={cn(
            "sb-pill",
            item.badgeTone === "amber" && "am",
            item.badgeTone === "dim" && "dim"
          )}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </>
  );

  if (item.disabled || !item.href) {
    return (
      <span className={className} aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </Link>
  );
}

export function CmsSidebar({
  user,
  stats,
  mobileOpen,
  onCloseMobile,
}: CmsSidebarProps) {
  const pathname = usePathname();

  const handleNav = () => {
    if (mobileOpen) onCloseMobile();
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="cms-sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={onCloseMobile}
        />
      )}
      <aside className={cn("sidebar", mobileOpen && "sidebar--open")} aria-label="Navigation CMS">
        <div className="sb-header">
          <CmsBrandLogo onNavigate={handleNav} />
          <button
            type="button"
            className="cms-sidebar-close"
            onClick={onCloseMobile}
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="sb-nav">
          {CMS_NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => canSeeCmsNav(item, user.role));
            if (items.length === 0) return null;

            return (
              <div key={group.id} className="sb-group">
                <div className="sb-group-label">{group.label}</div>
                {items.map((item) => (
                  <NavLink
                    key={item.id}
                    item={item}
                    stats={stats}
                    active={isNavActive(pathname, item)}
                    onNavigate={handleNav}
                  />
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sb-stat">
          <div className="sb-stat-title">Today&apos;s activity</div>
          <div className="sb-stat-row">
            <span className="sb-stat-lbl">Articles published</span>
            <span className="sb-stat-val">{stats.publishedToday.toLocaleString("en-US")}</span>
          </div>
          <div className="sb-stat-row">
            <span className="sb-stat-lbl">Unique readers</span>
            <span className="sb-stat-val">
              {stats.uniqueReadersToday.toLocaleString("en-US")}
            </span>
          </div>
          <div className="sb-stat-row">
            <span className="sb-stat-lbl">New subscribers</span>
            <span className="sb-stat-val">
              {stats.subscribersToday > 0 ? `+${stats.subscribersToday}` : "0"}
            </span>
          </div>
        </div>

        <div className="sb-foot">
          <div
            className="sb-av"
            style={{ background: "linear-gradient(135deg, var(--cms-red), var(--gold))" }}
          >
            {userInitials(user.name)}
          </div>
          <div className="sb-foot-info">
            <div className="sb-uname">{user.name}</div>
            <div className="sb-urole">{CMS_ROLE_LABELS[user.role]}</div>
          </div>
          <button
            type="button"
            className="cms-signout"
            title="Sign out"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <div className="sb-online" title="Online" />
        </div>
      </aside>
    </>
  );
}
