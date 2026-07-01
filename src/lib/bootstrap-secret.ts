import type { NextRequest } from "next/server";

function readBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization")?.trim();
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Vérifie l'autorisation bootstrap via en-tête Bearer uniquement.
 * Le secret en query string est refusé (fuite via logs / Referer).
 */
export function isBootstrapAuthorized(request: NextRequest): boolean {
  const secret = process.env.BOOTSTRAP_SECRET?.trim();
  if (!secret || secret.length < 32) return false;
  if (process.env.DISABLE_BOOTSTRAP === "true") return false;

  const token = readBearerToken(request);
  if (!token) return false;

  return timingSafeEqual(token, secret);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
