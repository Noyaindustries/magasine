import type { NextRequest } from "next/server";

/** Vérifie la clé bootstrap (query `key` ou header Authorization: Bearer …). */
export function isBootstrapAuthorized(request: NextRequest): boolean {
  const secret = process.env.BOOTSTRAP_SECRET?.trim();
  if (!secret) return false;

  const key = request.nextUrl.searchParams.get("key")?.trim();
  if (key && key === secret) return true;

  const auth = request.headers.get("authorization")?.trim();
  if (auth === `Bearer ${secret}`) return true;

  return false;
}
