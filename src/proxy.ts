import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthTokenOptions } from "@/lib/auth-request";
import { enforceRateLimit } from "@/lib/rate-limit";

const ADMIN_ROLES = new Set(["super_admin", "admin", "editor", "author"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth/")) {
    const limited = enforceRateLimit(request, {
      prefix: "auth",
      max: 30,
      windowMs: 60_000,
    });
    if (limited) return limited;
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    ...getAuthTokenOptions(request),
  });

  if (!token || token.sessionRevoked) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    if (token?.sessionRevoked) {
      login.searchParams.set("error", "SessionRevoked");
    }
    return NextResponse.redirect(login);
  }

  if (!ADMIN_ROLES.has(token.role as string)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/auth/:path*"],
};
