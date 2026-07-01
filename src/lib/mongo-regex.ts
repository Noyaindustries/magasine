const MAX_SEARCH_LENGTH = 120;

/**
 * Échappe les métacaractères regex pour éviter ReDoS / injection $regex MongoDB.
 */
export function escapeMongoRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalise et borne une requête de recherche utilisateur.
 */
export function clampSearchQuery(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  return escapeMongoRegex(trimmed);
}

export function buildCaseInsensitiveRegex(
  raw: string | null | undefined,
): RegExp | null {
  const escaped = clampSearchQuery(raw);
  if (!escaped) return null;
  return new RegExp(escaped, "i");
}
