/** Cap for manually picked recipients and per-campaign send limit. */
export const MAX_SELECTED_NEWSLETTER_RECIPIENTS = 5000;
export const SELECTED_LIST_TARGET = "selected";
/** Default send size in the compose form (safe for Gmail tests). */
export const DEFAULT_NEWSLETTER_SEND_LIMIT = 10;

export function normalizeNewsletterEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function uniqueNewsletterEmails(emails: string[]): string[] {
  return [...new Set(emails.map(normalizeNewsletterEmail).filter(Boolean))];
}

/** Clamp a user-chosen send count to [1, maxAvailable] and the global cap. */
export function clampNewsletterSendLimit(
  requested: number | undefined,
  maxAvailable: number
): number {
  const available = Math.max(0, Math.floor(maxAvailable));
  if (available === 0) return 0;
  const raw =
    requested === undefined || !Number.isFinite(requested)
      ? Math.min(DEFAULT_NEWSLETTER_SEND_LIMIT, available)
      : Math.floor(requested);
  return Math.min(MAX_SELECTED_NEWSLETTER_RECIPIENTS, available, Math.max(1, raw));
}
