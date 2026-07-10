import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import { Author } from "@/models/Author";
import type { UserRole } from "@/types";
import { assertCanAssignRole } from "@/lib/user-roles";
import { ensureAuthorForUser } from "@/lib/author-provision";
import { deleteAuthorAsAdmin } from "@/lib/admin-delete-author";

export { canDeleteUserAsAdmin } from "@/lib/admin-user-permissions";

export interface UpdateUserInput {
  userId: string;
  actorId: string;
  actorRole: UserRole;
  name?: string;
  role?: UserRole;
  isPremium?: boolean;
  isBanned?: boolean;
  password?: string;
  image?: string;
}

export async function updateUserAsAdmin(
  input: UpdateUserInput
): Promise<{ user?: { _id: string; name: string; role: UserRole; isPremium: boolean; isBanned: boolean }; error?: string; status?: number }> {
  const user = await User.findById(input.userId);
  if (!user) {
    return { error: "User not found", status: 404 };
  }

  if (input.role && input.role !== user.role) {
    if (input.userId === input.actorId) {
      return { error: "You cannot change your own role", status: 400 };
    }

    if (user.role === "super_admin" && input.actorRole !== "super_admin") {
      return { error: "Only a super admin can change a super admin account.", status: 403 };
    }

    const roleError = assertCanAssignRole(input.actorRole, input.role);
    if (roleError) {
      return { error: roleError, status: 403 };
    }

    user.role = input.role;
  }

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2) {
      return { error: "Name must be at least 2 characters.", status: 400 };
    }
    user.name = name;
  }

  if (input.isPremium !== undefined) {
    user.isPremium = input.isPremium;
  }

  if (input.isBanned !== undefined) {
    if (input.isBanned && input.userId === input.actorId) {
      return { error: "You cannot ban your own account.", status: 400 };
    }
    if (input.isBanned && user.role === "super_admin") {
      return { error: "Cannot ban a super admin account.", status: 403 };
    }
    user.isBanned = input.isBanned;
  }

  if (input.password !== undefined) {
    const password = input.password.trim();
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters.", status: 400 };
    }
    user.password = await bcrypt.hash(password, 12);
  }

  if (input.image !== undefined) {
    user.image = input.image.trim() || undefined;
  }

  await user.save();

  await ensureAuthorForUser({
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.image,
  });

  return {
    user: {
      _id: String(user._id),
      name: user.name,
      role: user.role,
      isPremium: user.isPremium,
      isBanned: user.isBanned ?? false,
    },
  };
}

export async function deleteUserAsAdmin(input: {
  userId: string;
  actorId: string;
  actorRole: UserRole;
}): Promise<{ success?: boolean; error?: string; status?: number }> {
  if (input.userId === input.actorId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte.", status: 400 };
  }

  const user = await User.findById(input.userId);
  if (!user) {
    return { error: "Utilisateur introuvable.", status: 404 };
  }

  if (user.role === "super_admin") {
    return { error: "Impossible de supprimer un super administrateur.", status: 403 };
  }

  if (user.role === "admin" && input.actorRole !== "super_admin") {
    return {
      error: "Seul un super administrateur peut supprimer un compte administrateur.",
      status: 403,
    };
  }

  const email = user.email.toLowerCase().trim();
  const linkedAuthor = await Author.findOne({
    $or: [{ user: user._id }, ...(email ? [{ email }] : [])],
  })
    .select("_id")
    .lean();

  if (linkedAuthor) {
    const authorResult = await deleteAuthorAsAdmin(linkedAuthor._id);
    if (authorResult.error) {
      return { error: authorResult.error, status: authorResult.status ?? 409 };
    }
  }

  await User.findByIdAndDelete(input.userId);
  return { success: true };
}
