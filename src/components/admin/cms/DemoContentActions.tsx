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
        ? "Loading test articles…"
        : action === "delete_all"
          ? "Deleting test articles…"
          : "Tagging test articles…"
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
        toast.error((data as { error?: string }).error ?? "Operation failed");
        return;
      }

      if (action === "import") {
        const created = (data as { articlesCreated?: number }).articlesCreated ?? 0;
        const skipped = (data as { articlesSkipped?: number }).articlesSkipped ?? 0;
        toast.success(
          created > 0
            ? `${created} test article(s) loaded${skipped ? `, ${skipped} already in database` : ""}.`
            : "Test articles already in database — open the Demo tab to delete them."
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
            ? `${deleted} test article(s) deleted.`
            : "No test articles in database."
        );
      } else {
        const tagged = (data as { tagged?: number }).tagged ?? 0;
        toast.success(
          tagged > 0
            ? `${tagged} article(s) tagged as test.`
            : "Test articles are already identified."
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
      toast.error("Network error");
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
                <strong>{virtualDemoCount}</strong> test article(s) are visible on the public site
                but <strong>not yet in the admin</strong> (placeholder content). Click « Load test
                articles » to show them here and delete them one by one or in bulk.
              </>
            ) : (
              <>
                <strong>{demoCount}</strong> test article(s) in database out of{" "}
                {seedTotal.toLocaleString("en-US")} in the demo pack. Use the <strong>Demo</strong>{" "}
                tab to filter them.
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
                confirmMessage: `Load test articles into the database (${virtualDemoCount > 0 ? virtualDemoCount : "remaining"} to import)? You can then delete them from the Demo tab.`,
                redirectToDemo: true,
              })
            }
            disabled={loading !== null}
          >
            {loading === "import"
              ? "Loading…"
              : virtualDemoCount > 0
                ? `Load test articles (${virtualDemoCount})`
                : "Complete test articles"}
          </button>
        )}

        {demoCount > 0 && (
          <>
            <Link href="/admin/articles?demo=1" className="btn btn-ghost">
              View tests ({demoCount})
            </Link>
            <button
              type="button"
              className="btn btn-ghost cms-delete-btn"
              onClick={() =>
                void callDemoApi("delete_all", {
                  confirmMessage: `Permanently delete ${demoCount} test article(s)? Your own articles will not be affected.`,
                })
              }
              disabled={loading !== null}
            >
              {loading === "delete" ? "Deleting…" : "Delete all tests"}
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
                  "Mark legacy seed articles as « test » so you can find them in the Demo tab?",
              })
            }
            disabled={loading !== null}
            title="If test articles are in the database but not detected"
          >
            {loading === "tag" ? "…" : "Identify seed articles"}
          </button>
        )}
      </div>
    </div>
  );
}
