"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

interface DemoContentActionsProps {
  demoCount: number;
}

export function DemoContentActions({ demoCount }: DemoContentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"import" | "delete" | "tag" | null>(null);

  async function callDemoApi(
    action: "import" | "delete_all" | "tag_existing",
    confirmMessage?: string
  ) {
    if (loading) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const actionLabels = {
      import: "import",
      delete_all: "delete",
      tag_existing: "tag",
    } as const;

    setLoading(actionLabels[action]);
    const toastId = toast.loading(
      action === "import"
        ? "Import du contenu de démonstration…"
        : action === "delete_all"
          ? "Suppression des articles de démo…"
          : "Marquage des articles de démo…"
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
            ? `${created} article(s) importé(s)${skipped ? `, ${skipped} déjà présent(s)` : ""}.`
            : "Contenu de démonstration déjà présent — articles marqués comme démo."
        );
      } else if (action === "delete_all") {
        const deleted = (data as { deleted?: number }).deleted ?? 0;
        toast.success(
          deleted > 0 ? `${deleted} article(s) de démo supprimé(s).` : "Aucun article de démo en base."
        );
      } else {
        const tagged = (data as { tagged?: number }).tagged ?? 0;
        toast.success(
          tagged > 0 ? `${tagged} article(s) marqué(s) comme démo.` : "Tous les articles démo sont déjà marqués."
        );
      }

      router.refresh();
    } catch {
      toast.dismiss(toastId);
      toast.error("Erreur réseau");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="demo-content-actions">
      <button
        type="button"
        className="btn btn-out"
        onClick={() =>
          void callDemoApi(
            "import",
            "Importer les articles de démonstration en base ? Ils seront modifiables et supprimables depuis cet écran."
          )
        }
        disabled={loading !== null}
      >
        {loading === "import" ? "Import…" : "Importer la démo"}
      </button>

      {demoCount > 0 && (
        <>
          <Link href="/admin/articles?demo=1" className="btn btn-ghost">
            Articles de démo ({demoCount})
          </Link>
          <button
            type="button"
            className="btn btn-ghost cms-delete-btn"
            onClick={() =>
              void callDemoApi(
                "delete_all",
                `Supprimer définitivement les ${demoCount} article(s) de démonstration ?`
              )
            }
            disabled={loading !== null}
          >
            {loading === "delete" ? "Suppression…" : "Supprimer toute la démo"}
          </button>
        </>
      )}

      {demoCount === 0 && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() =>
            void callDemoApi(
              "tag_existing",
              "Marquer les articles seed existants comme démo pour les retrouver ici ?"
            )
          }
          disabled={loading !== null}
          title="Si des articles de test sont déjà en base mais invisibles dans le filtre démo"
        >
          {loading === "tag" ? "…" : "Marquer les articles seed"}
        </button>
      )}
    </div>
  );
}
