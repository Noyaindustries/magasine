import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ensureAuthorForUser } from "@/lib/author-provision";

export const DEFAULT_ADMIN_EMAIL = "admin@globalsouthwatch.com";

/** Mot de passe dev uniquement — jamais utilisé en production. */
const DEV_FALLBACK_PASSWORD = "Admin123!";

interface EnsureAdminOptions {
  /** Réinitialise le mot de passe admin (dev / recovery bootstrap uniquement). */
  resetPassword?: boolean;
}

/**
 * Retourne le mot de passe bootstrap admin.
 * En production, DEFAULT_ADMIN_PASSWORD (≥12 caractères) est obligatoire.
 */
export function getDefaultAdminPassword(): string {
  const fromEnv = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
  if (fromEnv && fromEnv.length >= 12) return fromEnv;
  if (process.env.NODE_ENV === "development") return DEV_FALLBACK_PASSWORD;
  throw new Error(
    "DEFAULT_ADMIN_PASSWORD must be set in production (minimum 12 characters).",
  );
}

/** @deprecated Utiliser getDefaultAdminPassword() — conservé pour compatibilité dev. */
export const DEFAULT_ADMIN_PASSWORD =
  process.env.NODE_ENV === "development" ? DEV_FALLBACK_PASSWORD : "";

/** Garantit qu'un compte super_admin existe (création ou réparation optionnelle). */
export async function ensureDefaultAdmin(options: EnsureAdminOptions = {}) {
  await connectDB();

  const email = DEFAULT_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(getDefaultAdminPassword(), 12);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.findOne({
      email: { $regex: /^admin@globalsouthwatch\.com$/i },
    });
  }

  if (!user) {
    const created = await User.create({
      name: "Administrator",
      email,
      password: passwordHash,
      role: "super_admin",
    });
    await ensureAuthorForUser({
      userId: created._id,
      name: created.name,
      email: created.email,
      role: created.role,
    });
    return { created: true, email, repaired: true };
  }

  let repaired = false;

  if (user.email !== email) {
    user.email = email;
    repaired = true;
  }

  if (user.role !== "super_admin" && user.role !== "admin") {
    user.role = "super_admin";
    repaired = true;
  }

  if (!user.password || options.resetPassword) {
    user.password = passwordHash;
    repaired = true;
  }

  if (repaired) {
    await user.save();
  }

  await ensureAuthorForUser({
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return { created: false, email, repaired };
}
