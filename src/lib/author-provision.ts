import slugify from "slugify";
import type mongoose from "mongoose";
import { Author } from "@/models/Author";
import { EDITORIAL_ROLES } from "@/lib/user-roles";
import type { UserRole } from "@/types";

/** Rôles autorisés à signer un article (donc à avoir un profil auteur). */
export function roleCanAuthor(role: UserRole): boolean {
  return EDITORIAL_ROLES.includes(role);
}

async function generateUniqueAuthorSlug(name: string): Promise<string> {
  const base = slugify(name, { lower: true, strict: true }) || "auteur";
  let slug = base;
  let suffix = 1;
  while (await Author.exists({ slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export interface EnsureAuthorInput {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Garantit qu'un profil `Author` existe pour un compte éditorial.
 * Idempotent : réutilise l'auteur existant (lien `user` ou email identique)
 * et complète le lien `user` si absent. Ne fait rien pour les rôles non éditoriaux.
 */
export async function ensureAuthorForUser(input: EnsureAuthorInput): Promise<void> {
  if (!roleCanAuthor(input.role)) return;

  const email = input.email.toLowerCase().trim();
  const name = input.name.trim();

  const existing = await Author.findOne({
    $or: [{ user: input.userId }, { email }],
  })
    .select("_id user")
    .lean();

  if (existing) {
    if (!existing.user) {
      await Author.updateOne({ _id: existing._id }, { $set: { user: input.userId } });
    }
    return;
  }

  const slug = await generateUniqueAuthorSlug(name || email);
  await Author.create({
    name: name || email,
    slug,
    email,
    user: input.userId,
  });
}
