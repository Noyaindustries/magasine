import slugify from "slugify";
import type mongoose from "mongoose";
import { Author } from "@/models/Author";
import { User } from "@/models/User";
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

export interface BackfillAuthorsResult {
  /** Comptes éditoriaux inspectés. */
  processed: number;
  /** Nouveaux profils auteur créés. */
  created: number;
  /** Auteurs existants dont le lien `user` a été complété. */
  linked: number;
}

/**
 * Backfill unique : garantit un profil `Author` pour tous les comptes éditoriaux
 * existants. Idempotent — relançable sans créer de doublons.
 */
export async function backfillEditorialAuthors(): Promise<BackfillAuthorsResult> {
  const users = await User.find({ role: { $in: EDITORIAL_ROLES } })
    .select("name email role")
    .lean();

  let created = 0;
  let linked = 0;

  for (const user of users) {
    const email = (user.email ?? "").toLowerCase().trim();
    if (!email) continue;
    const name = (user.name ?? "").trim();

    const existing = await Author.findOne({
      $or: [{ user: user._id }, { email }],
    })
      .select("_id user")
      .lean();

    if (existing) {
      if (!existing.user) {
        await Author.updateOne({ _id: existing._id }, { $set: { user: user._id } });
        linked += 1;
      }
      continue;
    }

    const slug = await generateUniqueAuthorSlug(name || email);
    await Author.create({ name: name || email, slug, email, user: user._id });
    created += 1;
  }

  return { processed: users.length, created, linked };
}
