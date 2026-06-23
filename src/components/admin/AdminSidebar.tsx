"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  MessageSquare,
  Mail,
  Bell,
  Settings,
  PenLine,
  Plus,
  ExternalLink,
  LogOut,
  Home,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { SITE_LOGO } from "@/lib/images";
import type { UserRole } from "@/types";
import type { AdminNavStats } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  stats: AdminNavStats;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

type BadgeKey = keyof AdminNavStats;

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  badge?: BadgeKey;
  badgeTone?: "gold" | "blue";
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      {
        label: "Homepage",
        href: "/admin/homepage",
        icon: Home,
        roles: ["super_admin", "admin", "editor"],
      },
    ],
  },
  {
    id: "editorial",
    label: "Editorial",
    items: [
      {
        label: "Articles",
        href: "/admin/articles",
        icon: FileText,
      },
      {
        label: "Review queue",
        href: "/admin/review",
        icon: Sparkles,
        badge: "pendingReview",
        badgeTone: "gold",
      },
      {
        label: "Categories",
        href: "/admin/categories",
        icon: FolderTree,
        roles: ["super_admin", "admin", "editor"],
      },
      {
        label: "Authors",
        href: "/admin/authors",
        icon: PenLine,
        roles: ["super_admin", "admin", "editor"],
      },
      {
        label: "Alerts",
        href: "/admin/alerts",
        icon: Bell,
        roles: ["super_admin", "admin", "editor"],
      },
    ],
  },
  {
    id: "audience",
    label: "Audience",
    items: [
      {
        label: "Comments",
        href: "/admin/comments",
        icon: MessageSquare,
        badge: "pendingComments",
        badgeTone: "blue",
      },
      {
        label: "Newsletter",
        href: "/admin/newsletter",
        icon: Mail,
        roles: ["super_admin", "admin", "editor"],
      },
    ],
  },
  {
    id: "system",
    label: "Administration",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        roles: ["super_admin", "admin"],
      },
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        roles: ["super_admin", "admin"],
      },
    ],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Administrator",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  reader: "Reader",
};

function canSeeNav(item: NavItem, role: UserRole) {
  if (!item.roles) return true;
  return item.roles.includes(role);
}

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ED";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function AdminSidebar({ user, stats, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (path === "/admin" && !query) return pathname === "/admin";

    if (query) {
      const params = new URLSearchParams(query);
      const status = params.get("status");
      if (status && pathname.startsWith("/admin/articles")) {
        return searchParams.get("status") === status;
      }
    }

    if (path === "/admin/articles" && !query) {
      return pathname.startsWith("/admin/articles") && !searchParams.get("status");
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleNavClick = () => {
    if (mobileOpen) onCloseMobile();
  };

  return (
    <aside
      className={cn("admin-sidebar", mobileOpen && "admin-sidebar--open")}
      aria-label="Admin navigation"
    >
      <div className="admin-sidebar-mesh" aria-hidden />

      <div className="admin-sidebar-brand">
        <Link href="/admin" className="admin-sidebar-logo" onClick={handleNavClick}>
          <Image
            src={SITE_LOGO}
            alt="Global South Watch"
            width={130}
            height={28}
            style={{ height: 28, width: "auto" }}
          />
        </Link>
        <div className="admin-sidebar-brand-row">
          <span className="admin-sidebar-badge">Editorial suite</span>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Link href="/admin/articles/new" className="admin-sidebar-cta" onClick={handleNavClick}>
        <Plus className="w-4 h-4" aria-hidden />
        New article
        <ChevronRight className="admin-sidebar-cta-arrow w-4 h-4" aria-hidden />
      </Link>

      <nav className="admin-sidebar-nav" aria-label="Sections">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => canSeeNav(item, user.role));
          if (items.length === 0) return null;

          return (
            <div key={group.id} className="admin-sidebar-group">
              <p className="admin-sidebar-group-label">{group.label}</p>
              <ul className="admin-sidebar-group-list">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const badgeCount = item.badge ? stats[item.badge] : 0;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          "admin-sidebar-link",
                          active && "admin-sidebar-link--active"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="admin-sidebar-link-icon" aria-hidden>
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="admin-sidebar-link-label">{item.label}</span>
                        {badgeCount > 0 && (
                          <span
                            className={cn(
                              "admin-sidebar-badge-count",
                              item.badgeTone === "blue"
                                ? "admin-sidebar-badge-count--blue"
                                : "admin-sidebar-badge-count--gold"
                            )}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-footer-compact">
          <div className="admin-sidebar-avatar" aria-hidden>
            {userInitials(user.name)}
          </div>
          <div className="admin-sidebar-user-info">
            <p className="admin-sidebar-user-name">{user.name}</p>
            <span className="admin-sidebar-role-pill">{ROLE_LABELS[user.role]}</span>
          </div>
          <div className="admin-sidebar-footer-actions">
            <Link
              href="/"
              className="admin-sidebar-footer-btn"
              title="View live site"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              type="button"
              className="admin-sidebar-footer-btn admin-sidebar-footer-btn--danger"
              title="Sign out"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
