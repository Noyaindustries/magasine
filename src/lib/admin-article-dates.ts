/** Format an ISO/date for `<input type="datetime-local" />` in the user's local timezone. */
export function toDatetimeLocalValue(value: string | Date | undefined | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parsePublishedAtInput(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Resolve `publishedAt` when saving an article.
 * Returns `invalid` when the provided date string cannot be parsed.
 */
export function resolvePublishedAtForSave(options: {
  status?: string;
  publishedAtInput?: string;
  existingPublishedAt?: Date | null;
}): Date | undefined | "invalid" {
  const parsedInput = parsePublishedAtInput(options.publishedAtInput);

  if (options.publishedAtInput !== undefined && options.publishedAtInput.trim() && parsedInput === null) {
    return "invalid";
  }

  if (parsedInput) {
    return parsedInput;
  }

  if (options.status === "published") {
    if (options.existingPublishedAt) {
      return options.existingPublishedAt;
    }
    return new Date();
  }

  return options.existingPublishedAt ?? undefined;
}
