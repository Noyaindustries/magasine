import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { User } from "@/models/User";
import type { UserRole } from "@/types";
import { assertCanAssignRole } from "@/lib/user-roles";
import { ensureAuthorForUser } from "@/lib/author-provision";

export interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  actorRole: UserRole;
}

export interface CreateUserResult {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  tempPassword?: string;
}

export async function createUserAsAdmin(
  input: CreateUserInput
): Promise<{ user?: CreateUserResult; error?: string; status?: number }> {
  const name = input.name.trim();
  const email = input.email.toLowerCase().trim();

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters.", status: 400 };
  }

  const roleError = assertCanAssignRole(input.actorRole, input.role);
  if (roleError) {
    return { error: roleError, status: 403 };
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return { error: "This email is already in use.", status: 409 };
  }

  let tempPassword: string | undefined;
  let plainPassword = input.password?.trim();

  if (plainPassword) {
    if (plainPassword.length < 8) {
      return { error: "Password must be at least 8 characters.", status: 400 };
    }
  } else {
    tempPassword = randomBytes(9).toString("base64url");
    plainPassword = tempPassword;
  }

  const hashed = await bcrypt.hash(plainPassword, 12);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role: input.role,
  });

  // Auto-provisionne une signature éditoriale pour les rôles qui peuvent publier.
  await ensureAuthorForUser({
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      tempPassword,
    },
  };
}
