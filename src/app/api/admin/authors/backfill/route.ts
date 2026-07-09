import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { backfillEditorialAuthors } from "@/lib/author-provision";
import { revalidateTeamPage } from "@/lib/revalidate-public";

/** Génère les profils auteur manquants pour tous les comptes éditoriaux (backfill unique, idempotent). */
export async function POST() {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  await connectDB();
  const result = await backfillEditorialAuthors();
  revalidateTeamPage();
  return NextResponse.json(result);
}
