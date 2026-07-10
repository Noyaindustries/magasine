import type { UserRole } from "@/types";

/** Règles d'affichage / suppression côté client (miroir de deleteUserAsAdmin). */
export function canDeleteUserAsAdmin(input: {
  userId: string;
  userRole: UserRole;
  actorId: string;
  actorRole: UserRole;
}): boolean {
  if (input.userId === input.actorId) return false;
  if (input.userRole === "super_admin") return false;
  if (input.userRole === "admin" && input.actorRole !== "super_admin") return false;
  return true;
}
