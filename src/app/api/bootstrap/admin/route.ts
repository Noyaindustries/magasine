import { NextRequest, NextResponse } from "next/server";
import { isBootstrapAuthorized } from "@/lib/bootstrap-secret";
import { ensureDefaultAdmin } from "@/lib/ensure-admin";
import { getAuthSecret } from "@/lib/auth-secret";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Crée ou répare le compte admin en production.
 * Requiert BOOTSTRAP_SECRET (≥32 car.) via Authorization: Bearer …
 *
 * Exemple (une fois après déploiement) :
 * curl -H "Authorization: Bearer VOTRE_SECRET" https://votre-domaine.com/api/bootstrap/admin
 */
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    prefix: "bootstrap",
    max: 5,
    windowMs: 3600_000,
  });
  if (limited) return limited;

  if (!isBootstrapAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getAuthSecret()) {
    return NextResponse.json(
      {
        error: "AUTH_SECRET or NEXTAUTH_SECRET is missing on the server",
        hint: "Add AUTH_SECRET to your production environment variables, then redeploy.",
      },
      { status: 503 },
    );
  }

  const resetPassword =
    request.nextUrl.searchParams.get("resetPassword") === "true";

  try {
    const admin = await ensureDefaultAdmin({ resetPassword });
    return NextResponse.json({
      ok: true,
      email: admin.email,
      created: admin.created,
      repaired: admin.repaired,
      loginUrl: "/login",
      adminUrl: "/admin",
      message:
        admin.created || admin.repaired
          ? "Admin account ready. Sign in and change the password immediately."
          : "Admin account already exists. Use ?resetPassword=true with Bearer auth to reset.",
    });
  } catch (error) {
    console.error("[bootstrap/admin]", error);
    return NextResponse.json(
      {
        error: "Unable to connect to the database",
        hint: "Check MONGODB_URI and MongoDB Atlas network access (0.0.0.0/0).",
      },
      { status: 500 },
    );
  }
}
