"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MAX_RELATED_ARTICLES,
  type RelatedArticleOption,
} from "@/lib/related-articles-shared";

interface SearchHit {
  _id: string;
  title: string;
  slug: string;
  status: string;
}

interface CmsRelatedArticlesPickerProps {
  value: RelatedArticleOption[];
  onChange: (next: RelatedArticleOption[]) => void;
  excludeId?: string;
  maxItems?: number;
  label?: string;
  hint?: string;
}

function formatStatus(status: string): string {
  if (status === "published") return "Published";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function CmsRelatedArticlesPicker({
  value,
  onChange,
  excludeId,
  maxItems = MAX_RELATED_ARTICLES,
  label = "Related stories",
  hint,
}: CmsRelatedArticlesPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [allAlreadySelected, setAllAlreadySelected] = useState(false);

  useEffect(() => {
    const q = query.trim();

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError(null);
      setAllAlreadySelected(false);
      const params = new URLSearchParams({
        limit: "12",
      });
      if (q.length > 0) {
        params.set("q", q);
      }
      if (excludeId) {
        params.set("exclude", excludeId);
      }

      fetch(`/api/admin/articles?${params.toString()}`, {
        signal: controller.signal,
        credentials: "include",
      })
        .then(async (res) => {
          const data = (await res.json()) as { articles?: SearchHit[]; error?: string };
          if (!res.ok) {
            setResults([]);
            setSearchError(data.error ?? `Search failed (${res.status})`);
            return;
          }
          const selected = new Set(value.map((item) => item._id));
          const hits = data.articles ?? [];
          setAllAlreadySelected(hits.length > 0 && hits.every((item) => selected.has(item._id)));
          setResults(hits.filter((item) => !selected.has(item._id)));
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setResults([]);
          setSearchError("Network error — check your connection.");
        })
        .finally(() => setSearching(false));
    }, q.length === 0 ? 0 : 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, value, excludeId]);

  const add = useCallback(
    (article: SearchHit) => {
      if (value.some((item) => item._id === article._id)) return;
      if (value.length >= maxItems) return;
      onChange([...value, article]);
      setQuery("");
      setResults([]);
    },
    [onChange, value, maxItems]
  );

  const remove = useCallback(
    (id: string) => {
      onChange(value.filter((item) => item._id !== id));
    },
    [onChange, value]
  );

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= value.length) return;
      const next = [...value];
      const [item] = next.splice(index, 1);
      if (!item) return;
      next.splice(nextIndex, 0, item);
      onChange(next);
    },
    [onChange, value]
  );

  return (
    <div className="field">
      <label className="lbl">{label}</label>
      <p className="cms-field-hint">
        {hint ??
          `Pick up to ${maxItems} articles shown in the Related Stories block on the public page. Leave empty to auto-fill from the same category.`}
      </p>

      {value.length > 0 && (
        <ul className="cms-related-list">
          {value.map((article, index) => (
            <li key={article._id} className="cms-related-item">
              <div className="cms-related-item-main">
                <span className="cms-related-item-title">{article.title}</span>
                <span className="cms-related-item-meta">
                  {formatStatus(article.status)} · /{article.slug}
                </span>
              </div>
              <div className="cms-related-item-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => remove(article._id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length < maxItems && (
        <div className="cms-related-search">
          <input
            type="search"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const first = results[0];
              if (first) add(first);
            }}
            placeholder="Search by title, excerpt, or slug…"
            aria-label="Search articles for related stories"
          />
          {searching && <p className="cms-field-hint">Searching…</p>}
          {searchError && (
            <p className="cms-field-hint cms-field-hint--warn">{searchError}</p>
          )}
          {!searching && !searchError && allAlreadySelected && (
            <p className="cms-field-hint">
              Matching article(s) already in your selection above.
            </p>
          )}
          {!searching &&
            !searchError &&
            !allAlreadySelected &&
            query.trim().length > 0 &&
            results.length === 0 && (
            <p className="cms-field-hint">
              No matching article for « {query.trim()} ». Try a shorter keyword (title, excerpt, or slug).
            </p>
          )}
          {!searching && !searchError && query.trim().length === 0 && results.length === 0 && (
            <p className="cms-field-hint">
              No article available to add. Create or publish articles first.
            </p>
          )}
          {!searching && !searchError && query.trim().length === 0 && results.length > 0 && (
            <p className="cms-field-hint">Recent articles — type to filter.</p>
          )}
          {results.length > 0 && (
            <ul className="cms-related-results">
              {results.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    className="cms-related-result"
                    onClick={() => add(item)}
                  >
                    <span>{item.title}</span>
                    <span className="cms-related-item-meta">{formatStatus(item.status)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
