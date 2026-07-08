"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export function ImportDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (loading) return;
    if (
      !window.confirm(
        "Importer les articles de démonstration en base ? Ils deviendront modifiables et supprimables ici.",
      )
    ) {
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Import du contenu de démonstration…");
    try {
      const res = await fetch("/api/admin/demo-content", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(toastId);
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Échec de l'import");
        return;
      }
      const created = (data as { articlesCreated?: number }).articlesCreated ?? 0;
      const skipped = (data as { articlesSkipped?: number }).articlesSkipped ?? 0;
      toast.success(
        created > 0
          ? `${created} article(s) importé(s)${skipped ? `, ${skipped} déjà présent(s)` : ""}.`
          : "Contenu de démonstration déjà présent.",
      );
      router.refresh();
    } catch {
      toast.dismiss(toastId);
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn btn-out" onClick={handleImport} disabled={loading}>
      {loading ? "Import…" : "Importer la démo"}
    </button>
  );
}
