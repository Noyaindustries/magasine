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
        error: "AUTH_SECRET ou NEXTAUTH_SECRET manquant sur le serveur",
        hint: "Ajoutez AUTH_SECRET dans les variables d'environnement de production, puis redéployez.",
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
          ? "Compte admin prêt. Connectez-vous puis changez le mot de passe."
          : "Compte admin déjà présent. Utilisez ?resetPassword=true pour réinitialiser le mot de passe.",
    });
  } catch (error) {
    console.error("[bootstrap/admin]", error);
    return NextResponse.json(
      {
        error: "Impossible de joindre la base de données",
        hint: "Vérifiez MONGODB_URI et l'accès réseau MongoDB Atlas (0.0.0.0/0).",
      },
      { status: 500 }
    );
  }
}
