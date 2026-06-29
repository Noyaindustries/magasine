"use client";

import { useCallback, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileEdit,
  Inbox,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { ReviewQueueItem } from "@/lib/admin-review";
import { resolveFeaturedImage } from "@/lib/images";
import { formatDate, formatRelativeDate } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface ReviewQueueManagerProps {
  initialItems: ReviewQueueItem[];
}

function stripHtml(html: string, maxLength = 320): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

function ReviewQueueCard({
  item,
  onStatusChange,
  busyId,
}: {
  item: ReviewQueueItem;
  onStatusChange: (id: string, status: "published" | "draft") => Promise<void>;
  busyId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const authorName = item.authors[0]?.name ?? "Editorial";
  const accent = item.category.color ?? "#1a3896";
  const busy = busyId === item._id;
  const imageSrc = resolveFeaturedImage(item.featuredImage);

  return (
    <article
      className="rvq-card"
      style={
        {
          "--rvq-accent": accent,
        } as CSSProperties
      }
    >
      <div className="rvq-card-media">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 320px"
        />
        <div className="rvq-card-media-overlay" aria-hidden />
        <Link href={`/admin/articles/${item._id}`} className="rvq-card-media-link" aria-label={`Edit ${item.title}`} />
      </div>

      <div className="rvq-card-body">
        <div className="rvq-card-kicker">
          <span className="rvq-category-pill">
            <span className="rvq-category-dot" aria-hidden />
            {item.category.name}
          </span>
          <span className="rvq-status-pill">Awaiting review</span>
          {item.isUrgent && <span className="rvq-flag rvq-flag--urgent">Urgent</span>}
          {item.isPremium && <span className="rvq-flag rvq-flag--premium">Premium</span>}
          {item.contentType !== "article" && (
            <span className="rvq-flag rvq-flag--type">{item.contentType}</span>
          )}
        </div>

        <h2 className="rvq-card-title">
          <Link href={`/admin/articles/${item._id}`}>{item.title}</Link>
        </h2>

        {item.subtitle && <p className="rvq-card-subtitle">{item.subtitle}</p>}

        <p className="rvq-card-excerpt">{item.excerpt}</p>

        <div className="rvq-card-meta">
          <span>{authorName}</span>
          <span className="rvq-meta-dot" aria-hidden />
          <span className="rvq-meta-item">
            <Clock className="w-3.5 h-3.5" aria-hidden />
            {item.readingTime} min
          </span>
          <span className="rvq-meta-dot" aria-hidden />
          <time dateTime={item.updatedAt} title={formatDate(item.updatedAt)}>
            Updated {formatRelativeDate(item.updatedAt)}
          </time>
        </div>

        <button
          type="button"
          className="rvq-expand-btn"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" aria-hidden />
              Hide preview
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" aria-hidden />
              Read preview
            </>
          )}
        </button>

        {expanded && (
          <div className="rvq-preview-panel">
            <span className="rvq-preview-label">Content preview</span>
            <p>{stripHtml(item.content)}</p>
          </div>
        )}

        <div className="rvq-card-actions">
          <Link href={`/admin/articles/${item._id}`} className="rvq-btn rvq-btn--ghost">
            <FileEdit className="w-4 h-4" aria-hidden />
            Edit
          </Link>
          <button
            type="button"
            className="rvq-btn rvq-btn--outline"
            disabled={busy}
            onClick={() => onStatusChange(item._id, "draft")}
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
            Return to draft
          </button>
          <button
            type="button"
            className="rvq-btn rvq-btn--publish"
            disabled={busy}
            onClick={() => onStatusChange(item._id, "published")}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ReviewQueueManager({ initialItems }: ReviewQueueManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleStatusChange = useCallback(
    async (id: string, status: "published" | "draft") => {
      setBusyId(id);
      const toastId = toast.loading(
        status === "published" ? "Publishing article…" : "Moving back to draft…"
      );

      try {
        const res = await fetch(`/api/admin/articles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Action failed");
        }

        setItems((prev) => prev.filter((item) => item._id !== id));
        toast.dismiss(toastId);
        toast.success(
          status === "published" ? "Article published successfully" : "Article moved back to draft"
        );
        router.refresh();
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(
          error instanceof Error ? error.message : "Could not update the article."
        );
      } finally {
        setBusyId(null);
      }
    },
    [router]
  );

  return (
    <div className="rvq-root">
      <header className="rvq-hero">
        <div className="rvq-hero-mesh" aria-hidden />
        <div className="rvq-hero-inner">
          <div>
            <p className="rvq-hero-eyebrow">
              <span className="rvq-hero-eyebrow-dot" aria-hidden />
              Editorial workflow
            </p>
            <h1 className="rvq-hero-title">
              Review <em>queue</em>
            </h1>
            <p className="rvq-hero-desc">
              Approve, refine, or send back submissions awaiting editorial sign-off. Each card mirrors
              the public article layout for a faithful preview.
            </p>
          </div>
          <div className="rvq-hero-stats">
            <div className="rvq-stat">
              <strong>{items.length}</strong>
              <span>Pending</span>
            </div>
            <Link href="/admin/articles/new" className="rvq-hero-cta">
              <Sparkles className="w-4 h-4" aria-hidden />
              New article
            </Link>
            <Link href="/admin/articles" className="rvq-hero-link">
              <ExternalLink className="w-4 h-4" aria-hidden />
              All articles
            </Link>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rvq-empty">
          <div className="rvq-empty-icon" aria-hidden>
            <Inbox className="w-8 h-8" />
          </div>
          <h2>Queue is clear</h2>
          <p>No articles are waiting for review. New submissions will appear here when marked &ldquo;In review&rdquo;.</p>
          <Link href="/admin/articles" className="rvq-btn rvq-btn--publish">
            Browse all articles
          </Link>
        </div>
      ) : (
        <div className="rvq-list">
          {items.map((item, index) => (
            <div
              key={item._id}
              className="rvq-list-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ReviewQueueCard item={item} onStatusChange={handleStatusChange} busyId={busyId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
