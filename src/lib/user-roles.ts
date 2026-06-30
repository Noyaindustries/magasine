import type { UserRole } from "@/types";

export const USER_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "editor",
  "author",
  "contributor",
  "reader",
];

export const EDITORIAL_ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "editor",
  "author",
  "contributor",
];

/** Roles an admin actor may assign when creating or updating users. */
export function getAssignableRoles(actorRole: UserRole): UserRole[] {
  if (actorRole === "super_admin") {
    return USER_ROLES;
  }
  if (actorRole === "admin") {
    return ["admin", "editor", "author", "contributor", "reader"];
  }
  return [];
}

export function canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (targetRole === "super_admin") {
    return actorRole === "super_admin";
  }
  return getAssignableRoles(actorRole).includes(targetRole);
}

export function assertCanAssignRole(actorRole: UserRole, targetRole: UserRole): string | null {
  if (!canAssignRole(actorRole, targetRole)) {
    if (targetRole === "super_admin") {
      return "Only super admins can assign the super admin role.";
    }
    return "You are not allowed to assign this role.";
  }
  return null;
}
