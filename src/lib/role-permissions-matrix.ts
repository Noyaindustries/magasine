import type { UserRole } from "@/types";
import { USER_ROLES } from "@/lib/user-roles";
import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";

export type PermissionCell = boolean | "own";

export interface RoleMatrixRow {
  role: UserRole;
  label: string;
  color: string;
  cmsAccess: boolean;
  write: PermissionCell;
  publish: PermissionCell;
  editOthers: PermissionCell;
  manageUsers: boolean;
  manageAds: boolean;
  manageSettings: boolean;
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: "var(--cms-red)",
  admin: "var(--cms-red)",
  editor: "var(--purple)",
  author: "var(--blue)",
  contributor: "var(--amber)",
  reader: "var(--t3)",
};

function editorialWrite(role: UserRole): PermissionCell {
  return role === "reader" ? false : true;
}

function publishLevel(role: UserRole): PermissionCell {
  if (role === "reader" || role === "contributor") return false;
  if (role === "author") return "own";
  return true;
}

function editOthersLevel(role: UserRole): PermissionCell {
  if (role === "super_admin" || role === "admin" || role === "editor") return true;
  return false;
}

export function getRolePermissionsMatrix(): RoleMatrixRow[] {
  return USER_ROLES.map((role) => ({
    role,
    label: CMS_ROLE_LABELS[role],
    color: ROLE_COLORS[role],
    cmsAccess: role !== "reader",
    write: editorialWrite(role),
    publish: publishLevel(role),
    editOthers: editOthersLevel(role),
    manageUsers: role === "super_admin" || role === "admin",
    manageAds: role === "super_admin" || role === "admin",
    manageSettings: role === "super_admin" || role === "admin",
  }));
}
