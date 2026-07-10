"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

interface DemoContentActionsProps {
  demoCount: number;
  virtualDemoCount: number;
  seedTotal: number;
}

export function DemoContentActions({
  demoCount,
  virtualDemoCount,
  seedTotal,
}: DemoContentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"import" | "delete" | "tag" | null>(null);

  async function callDemoApi(
    action: "import" | "delete_all" | "tag_existing",
    options?: { confirmMessage?: string; redirectToDemo?: boolean }
  ) {
    if (loading) return;
    if (options?.confirmMessage && !window.confirm(options.confirmMessage)) return;

    const actionLabels = {
      import: "import",
      delete_all: "delete",
      tag_existing: "tag",
    } as const;

    setLoading(actionLabels[action]);
    const toastId = toast.loading(
      action === "import"
        ? "Chargement des articles de test…"
        : action === "delete_all"
          ? "Suppression des articles de test…"
          : "Marquage des articles de test…"
    );

    try {
      const res = await fetch("/api/admin/demo-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(toastId);

      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Échec de l'opération");
        return;
      }

      if (action === "import") {
        const created = (data as { articlesCreated?: number }).articlesCreated ?? 0;
        const skipped = (data as { articlesSkipped?: number }).articlesSkipped ?? 0;
        toast.success(
          created > 0
            ? `${created} article(s) de test chargé(s)${skipped ? `, ${skipped} déjà en base` : ""}.`
            : "Articles de test déjà en base — ouvrez l'onglet Démo pour les supprimer."
        );
        if (options?.redirectToDemo ?? true) {
          router.push("/admin/articles?demo=1");
          router.refresh();
          return;
        }
      } else if (action === "delete_all") {
        const deleted = (data as { deleted?: number }).deleted ?? 0;
        toast.success(
          deleted > 0
            ? `${deleted} article(s) de test supprimé(s).`
            : "Aucun article de test en base."
        );
      } else {
        const tagged = (data as { tagged?: number }).tagged ?? 0;
        toast.success(
          tagged > 0
            ? `${tagged} article(s) marqué(s) comme test.`
            : "Les articles de test sont déjà identifiés."
        );
        if (tagged > 0) {
          router.push("/admin/articles?demo=1");
          router.refresh();
          return;
        }
      }

      router.refresh();
    } catch {
      toast.dismiss(toastId);
      toast.error("Erreur réseau");
    } finally {
      setLoading(null);
    }
  }

  const showBanner = virtualDemoCount > 0 || demoCount > 0;

  return (
    <div className="demo-content-actions-wrap">
      {showBanner && (
        <div className="admin-alert-banner demo-content-banner">
          <div className="demo-content-banner-text">
            {virtualDemoCount > 0 ? (
              <>
                <strong>{virtualDemoCount}</strong> article(s) de test sont visibles sur le site
                public mais <strong>pas encore dans l&apos;admin</strong> (contenu fictif). Cliquez
                sur «&nbsp;Charger les articles de test&nbsp;» pour les afficher ici et les
                supprimer un par un ou en masse.
              </>
            ) : (
              <>
                <strong>{demoCount}</strong> article(s) de test en base sur{" "}
                {seedTotal.toLocaleString("fr-FR")} du pack de démonstration. Utilisez l&apos;onglet{" "}
                <strong>Démo</strong> pour les filtrer.
              </>
            )}
          </div>
        </div>
      )}

      <div className="demo-content-actions">
        {(virtualDemoCount > 0 || demoCount < seedTotal) && (
          <button
            type="button"
            className="btn btn-out"
            onClick={() =>
              void callDemoApi("import", {
                confirmMessage: `Charger les articles de test en base (${virtualDemoCount > 0 ? virtualDemoCount : "restants"} à importer) ? Vous pourrez ensuite les supprimer depuis l'onglet Démo.`,
                redirectToDemo: true,
              })
            }
            disabled={loading !== null}
          >
            {loading === "import"
              ? "Chargement…"
              : virtualDemoCount > 0
                ? `Charger les articles de test (${virtualDemoCount})`
                : "Compléter les articles de test"}
          </button>
        )}

        {demoCount > 0 && (
          <>
            <Link href="/admin/articles?demo=1" className="btn btn-ghost">
              Voir les tests ({demoCount})
            </Link>
            <button
              type="button"
              className="btn btn-ghost cms-delete-btn"
              onClick={() =>
                void callDemoApi("delete_all", {
                  confirmMessage: `Supprimer définitivement les ${demoCount} article(s) de test ? Vos propres articles ne seront pas touchés.`,
                })
              }
              disabled={loading !== null}
            >
              {loading === "delete" ? "Suppression…" : "Supprimer tous les tests"}
            </button>
          </>
        )}

        {demoCount === 0 && virtualDemoCount === 0 && seedTotal > 0 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() =>
              void callDemoApi("tag_existing", {
                confirmMessage:
                  "Marquer les anciens articles seed comme « test » pour les retrouver dans l'onglet Démo ?",
              })
            }
            disabled={loading !== null}
            title="Si des articles de test sont en base mais non détectés"
          >
            {loading === "tag" ? "…" : "Identifier les articles seed"}
          </button>
        )}
      </div>
    </div>
  );
}
