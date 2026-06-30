/** Secret JWT Auth.js — AUTH_SECRET (v5) ou NEXTAUTH_SECRET (legacy). */
export function getAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  return secret || undefined;
}

export function isGoogleAuthEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}
