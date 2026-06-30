import type { UserRole } from "@/types";

export type CmsBadgeKey = "pendingReview" | "pendingComments" | "teamMemberCount" | "pendingDonations";

export type CmsNavItem = {
  id: string;
  label: string;
  href?: string;
  roles?: UserRole[];
  badge?: CmsBadgeKey;
  badgeTone?: "red" | "amber" | "dim";
  disabled?: boolean;
};

export type CmsNavGroup = {
  id: string;
  label: string;
  items: CmsNavItem[];
};

import { SITE_NAME } from "@/lib/site";

/** CMS back-office navigation */
export const CMS_NAV_GROUPS: CmsNavGroup[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin" },
      { id: "articles", label: "Articles", href: "/admin/articles", badge: "pendingReview" },
      { id: "editor", label: "Article editor", href: "/admin/articles/new" },
      { id: "medias", label: "Media library", href: "/admin/medias" },
      {
        id: "comments",
        label: "Comments",
        href: "/admin/comments",
        badge: "pendingComments",
        badgeTone: "amber",
      },
      {
        id: "categories",
        label: "Categories",
        href: "/admin/categories",
        roles: ["super_admin", "admin", "editor"],
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        id: "users",
        label: "Users",
        href: "/admin/users",
        badge: "teamMemberCount",
        badgeTone: "dim",
        roles: ["super_admin", "admin"],
      },
      { id: "ads", label: "Advertising", href: "/admin/publicites" },
      {
        id: "newsletter",
        label: "Newsletter",
        href: "/admin/newsletter",
        roles: ["super_admin", "admin", "editor"],
      },
      {
        id: "donations",
        label: "Donations",
        href: "/admin/donations",
        badge: "pendingDonations",
        badgeTone: "amber",
        roles: ["super_admin", "admin", "editor"],
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { id: "analytics", label: "Analytics", href: "/admin/analytics" },
      { id: "seo", label: "SEO settings", href: "/admin/seo" },
    ],
  },
];

export const CMS_PAGE_META: { match: (path: string) => boolean; title: string; breadcrumb: string }[] = [
  { match: (p) => p === "/admin", title: "Dashboard", breadcrumb: "Overview" },
  { match: (p) => p === "/admin/articles/new", title: "Editor", breadcrumb: "Articles / New article" },
  { match: (p) => p.startsWith("/admin/articles/"), title: "Editor", breadcrumb: "Articles / Edit" },
  { match: (p) => p.startsWith("/admin/articles"), title: "Articles", breadcrumb: "Articles" },
  { match: (p) => p.startsWith("/admin/review"), title: "Review queue", breadcrumb: "Review" },
  { match: (p) => p.startsWith("/admin/homepage"), title: "Homepage", breadcrumb: "Homepage layout" },
  { match: (p) => p.startsWith("/admin/categories"), title: "Categories", breadcrumb: "Categories" },
  { match: (p) => p.startsWith("/admin/authors"), title: "Authors", breadcrumb: "Authors" },
  { match: (p) => p.startsWith("/admin/medias"), title: "Media library", breadcrumb: "Media" },
  { match: (p) => p.startsWith("/admin/publicites"), title: "Advertising", breadcrumb: "Advertising" },
  { match: (p) => p.startsWith("/admin/analytics"), title: "Analytics", breadcrumb: "Performance" },
  { match: (p) => p.startsWith("/admin/seo"), title: "SEO settings", breadcrumb: "SEO" },
  { match: (p) => p.startsWith("/admin/comments"), title: "Comments", breadcrumb: "Comments" },
  { match: (p) => p.startsWith("/admin/newsletter"), title: "Newsletter", breadcrumb: "Newsletter" },
  { match: (p) => p.startsWith("/admin/donations"), title: "Donations", breadcrumb: "Donations" },
  { match: (p) => p.startsWith("/admin/users"), title: "Users", breadcrumb: "Editorial team" },
  { match: (p) => p.startsWith("/admin/alerts"), title: "Alerts", breadcrumb: "Alerts" },
  { match: (p) => p.startsWith("/admin/settings"), title: "Settings", breadcrumb: "Configuration" },
];

export function getCmsPageMeta(pathname: string) {
  const found = CMS_PAGE_META.find((entry) => entry.match(pathname));
  return found ?? { title: "Back office", breadcrumb: SITE_NAME };
}

export function canSeeCmsNav(item: CmsNavItem, role: UserRole) {
  if (!item.roles) return true;
  return item.roles.includes(role);
}

export const CMS_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  reader: "Reader",
};
