import type { NextRequest } from "next/server";
import { getAuthSecret } from "@/lib/auth-secret";

/** Cookie Auth.js sécurisé sur HTTPS (prod), classique en local HTTP. */
export function useSecureAuthCookies(request: NextRequest): boolean {
  if (request.nextUrl.protocol === "https:") return true;
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  return authUrl.startsWith("https://");
}

export function getAuthTokenOptions(request: NextRequest) {
  return {
    secret: getAuthSecret(),
    secureCookie: useSecureAuthCookies(request),
  };
}
