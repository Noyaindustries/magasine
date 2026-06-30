"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bookmark } from "lucide-react";
import { toast } from "@/lib/toast";

interface SaveArticleButtonProps {
  articleId: string;
  variant?: "default" | "premium";
}

export function SaveArticleButton({ articleId, variant = "default" }: SaveArticleButtonProps) {
  const { data: session, status } = useSession();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const ids = (data.savedArticles ?? []).map((a: { _id: string }) => a._id);
        setSaved(ids.includes(articleId));
      })
      .catch(() => undefined);
  }, [session, articleId]);

  const toggle = async () => {
    if (!session?.user) {
      globalThis.location.href = `/login?callbackUrl=${encodeURIComponent(globalThis.location.pathname)}`;
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
        toast.success(data.saved ? "Article saved" : "Removed from saved");
      } else {
        toast.error("Action failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  if (variant === "premium") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={`art-save-btn${saved ? " art-save-btn--saved" : ""}`}
      >
        <Bookmark className={`w-4 h-4${saved ? " fill-current" : ""}`} aria-hidden />
        {saved ? "Saved" : "Save article"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 text-sm transition-colors disabled:opacity-50 ${
        saved ? "text-gold" : "text-muted hover:text-accent"
      }`}
    >
      <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
