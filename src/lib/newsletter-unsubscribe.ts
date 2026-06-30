import { createHmac, timingSafeEqual } from "crypto";
import { getSiteUrl } from "@/lib/site";

function getUnsubscribeSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for newsletter unsubscribe links.");
  }
  return secret;
}

function signEmail(email: string): string {
  return createHmac("sha256", getUnsubscribeSecret()).update(email).digest("base64url");
}

export function createNewsletterUnsubscribeUrl(email: string): string {
  const normalized = email.toLowerCase().trim();
  const token = signEmail(normalized);
  const params = new URLSearchParams({
    email: normalized,
    token,
  });
  return `${getSiteUrl()}/api/newsletter/unsubscribe?${params.toString()}`;
}

export function verifyNewsletterUnsubscribeToken(email: string, token: string): boolean {
  const normalized = email.toLowerCase().trim();
  const expected = signEmail(normalized);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
