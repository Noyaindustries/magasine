import type { AuthorInfo } from "@/types";

/** Join author display names — e.g. "Alice & Bob", "Alice, Bob & Charlie". */
export function formatAuthorNames(
  authors: ReadonlyArray<Pick<AuthorInfo, "name">>
): string {
  const names = authors.map((author) => author.name.trim()).filter(Boolean);
  if (names.length === 0) return "Editorial";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** Normalize author IDs from API payload (dedupe, preserve order). */
export function normalizeAuthorIds(
  authorIds: string[] | undefined,
  authorId: string | undefined
): string[] | null {
  const raw =
    authorIds && authorIds.length > 0
      ? authorIds
      : authorId?.trim()
        ? [authorId.trim()]
        : [];

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const id of raw) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized.length > 0 ? normalized : null;
}
