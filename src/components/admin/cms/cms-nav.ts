import type { UserRole } from "@/types";

export type CmsBadgeKey = "pendingReview" | "pendingComments" | "teamMemberCount";

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

/** Navigation du back-office CMS */
export const CMS_NAV_GROUPS: CmsNavGroup[] = [
  {
    id: "main",
    label: "Principal",
    items: [
      { id: "dashboard", label: "Tableau de bord", href: "/admin" },
      { id: "articles", label: "Articles", href: "/admin/articles", badge: "pendingReview" },
      { id: "editor", label: "Éditeur d'article", href: "/admin/articles/new" },
      { id: "medias", label: "Médiathèque", href: "/admin/medias" },
      {
        id: "comments",
        label: "Commentaires",
        href: "/admin/comments",
        badge: "pendingComments",
        badgeTone: "amber",
      },
    ],
  },
  {
    id: "management",
    label: "Gestion",
    items: [
      {
        id: "users",
        label: "Utilisateurs",
        href: "/admin/users",
        badge: "teamMemberCount",
        badgeTone: "dim",
        roles: ["super_admin", "admin"],
      },
      { id: "ads", label: "Publicités", href: "/admin/publicites" },
      {
        id: "newsletter",
        label: "Newsletter",
        href: "/admin/newsletter",
        roles: ["super_admin", "admin", "editor"],
      },
    ],
  },
  {
    id: "system",
    label: "Système",
    items: [
      { id: "analytics", label: "Analytics", href: "/admin/analytics" },
      { id: "seo", label: "Paramètres SEO", href: "/admin/seo" },
    ],
  },
];

export const CMS_PAGE_META: { match: (path: string) => boolean; title: string; breadcrumb: string }[] = [
  { match: (p) => p === "/admin", title: "Tableau de bord", breadcrumb: "Vue générale" },
  { match: (p) => p === "/admin/articles/new", title: "Éditeur", breadcrumb: "Articles / Nouvel article" },
  { match: (p) => p.startsWith("/admin/articles/"), title: "Éditeur", breadcrumb: "Articles / Modifier" },
  { match: (p) => p.startsWith("/admin/articles"), title: "Articles", breadcrumb: "Articles" },
  { match: (p) => p.startsWith("/admin/review"), title: "File de relecture", breadcrumb: "Relecture" },
  { match: (p) => p.startsWith("/admin/homepage"), title: "Page d'accueil", breadcrumb: "Composition accueil" },
  { match: (p) => p.startsWith("/admin/categories"), title: "Rubriques", breadcrumb: "Rubriques" },
  { match: (p) => p.startsWith("/admin/authors"), title: "Auteurs", breadcrumb: "Auteurs" },
  { match: (p) => p.startsWith("/admin/medias"), title: "Médiathèque", breadcrumb: "Médias" },
  { match: (p) => p.startsWith("/admin/publicites"), title: "Publicités", breadcrumb: "Publicités" },
  { match: (p) => p.startsWith("/admin/analytics"), title: "Analytics", breadcrumb: "Performances" },
  { match: (p) => p.startsWith("/admin/seo"), title: "Paramètres SEO", breadcrumb: "Référencement" },
  { match: (p) => p.startsWith("/admin/comments"), title: "Commentaires", breadcrumb: "Commentaires" },
  { match: (p) => p.startsWith("/admin/newsletter"), title: "Newsletter", breadcrumb: "Newsletter" },
  { match: (p) => p.startsWith("/admin/users"), title: "Utilisateurs", breadcrumb: "Équipe éditoriale" },
  { match: (p) => p.startsWith("/admin/alerts"), title: "Alertes", breadcrumb: "Alertes" },
  { match: (p) => p.startsWith("/admin/settings"), title: "Paramètres", breadcrumb: "Configuration" },
];

export function getCmsPageMeta(pathname: string) {
  const found = CMS_PAGE_META.find((entry) => entry.match(pathname));
  return found ?? { title: "Back-office", breadcrumb: SITE_NAME };
}

export function canSeeCmsNav(item: CmsNavItem, role: UserRole) {
  if (!item.roles) return true;
  return item.roles.includes(role);
}

export const CMS_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
  editor: "Éditeur",
  author: "Auteur",
  contributor: "Contributeur",
  reader: "Lecteur",
};
