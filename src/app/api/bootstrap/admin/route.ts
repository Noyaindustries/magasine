import { NextRequest, NextResponse } from "next/server";
import { isBootstrapAuthorized } from "@/lib/bootstrap-secret";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  ensureDefaultAdmin,
} from "@/lib/ensure-admin";
import { getAuthSecret } from "@/lib/auth-secret";

/**
 * Crée ou répare le compte admin en production.
 * Requiert BOOTSTRAP_SECRET sur l'hébergeur + ?key=… ou Authorization: Bearer …
 *
 * Exemple (une fois après déploiement) :
 * GET https://votre-domaine.com/api/bootstrap/admin?key=VOTRE_SECRET
 */
export async function GET(request: NextRequest) {
  if (!isBootstrapAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getAuthSecret()) {
    return NextResponse.json(
      {
        error: "AUTH_SECRET or NEXTAUTH_SECRET is missing on the server",
        hint: "Add AUTH_SECRET to your production environment variables, then redeploy.",
      },
      { status: 503 }
    );
  }

  const resetPassword = request.nextUrl.searchParams.get("resetPassword") !== "false";

  try {
    const admin = await ensureDefaultAdmin({ resetPassword });
    return NextResponse.json({
      ok: true,
      email: admin.email,
      password:
        admin.created || (resetPassword && admin.repaired)
          ? DEFAULT_ADMIN_PASSWORD
          : undefined,
      created: admin.created,
      repaired: admin.repaired,
      loginUrl: "/login",
      adminUrl: "/admin",
      message:
        admin.created || admin.repaired
          ? "Admin account ready. Sign in and change the password."
          : "Admin account already exists. Use ?resetPassword=true to reset the password.",
    });
  } catch (error) {
    console.error("[bootstrap/admin]", error);
    return NextResponse.json(
      {
        error: "Unable to connect to the database",
        hint: "Check MONGODB_URI and MongoDB Atlas network access (0.0.0.0/0).",
      },
      { status: 500 }
    );
  }
}
