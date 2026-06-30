"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, Clock, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ReaderArticleItem } from "@/components/reader/types";

interface ReaderArticleCardProps {
  article: ReaderArticleItem;
  showExcerpt?: boolean;
  saved?: boolean;
  onToggleSave?: (articleId: string) => void;
  saveLoading?: boolean;
}

export function ReaderArticleCard({
  article,
  showExcerpt = false,
  saved,
  onToggleSave,
  saveLoading,
}: ReaderArticleCardProps) {
  const showSave = saved !== undefined && onToggleSave;

  return (
    <article className="reader-article">
      <Link href={`/article/${article.slug}`} className="reader-article-thumb">
        <Image
          src={article.featuredImage}
          alt=""
          fill
          sizes="(max-width: 560px) 100vw, 112px"
        />
      </Link>

      <Link href={`/article/${article.slug}`} className="reader-article-body">
        <h3 className="reader-article-title">{article.title}</h3>
        {showExcerpt && article.excerpt && (
          <p className="reader-article-excerpt">{article.excerpt}</p>
        )}
        <div className="reader-article-meta">
          {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          {article.readingTime > 0 && (
            <span>
              <Clock aria-hidden />
              {article.readingTime} min
            </span>
          )}
        </div>
      </Link>

      <div className="reader-article-actions">
        {showSave && (
          <button
            type="button"
            className={`reader-article-btn${saved ? " is-saved" : ""}`}
            title={saved ? "Remove from saved" : "Save article"}
            aria-label={saved ? "Remove from saved" : "Save article"}
            disabled={saveLoading}
            onClick={(e) => {
              e.preventDefault();
              onToggleSave(article._id);
            }}
          >
            <Bookmark className={saved ? "fill-current" : ""} aria-hidden />
          </button>
        )}
        <Link
          href={`/article/${article.slug}`}
          className="reader-article-btn"
          title="Read article"
          aria-label="Read article"
        >
          <ArrowUpRight aria-hidden />
        </Link>
      </div>
    </article>
  );
}
