"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { ArticleCard } from "@/components/article/ArticleCard";
import { PRIMARY_NAV, REGION_NAV } from "@/data/site-home";
import { toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import type { ArticleListItem } from "@/types";

const RECENT_KEY = "gsw-recent-searches";
const MAX_RECENT = 6;

const CATEGORY_FILTERS = [
  ...PRIMARY_NAV.map((item) => ({
    label: item.label,
    slug: item.href.replace("/category/", ""),
  })),
  ...REGION_NAV.map((item) => ({
    label: item.label,
    slug: item.href.replace("/category/", ""),
  })),
];

const TYPE_FILTERS = [
  { label: "All formats", value: "" },
  { label: "Articles", value: "article" },
  { label: "Video", value: "video" },
  { label: "Podcast", value: "podcast" },
  { label: "Gallery", value: "gallery" },
] as const;

type Suggestion = { title: string; slug: string };

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const next = [trimmed, ...readRecent().filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(
    0,
    MAX_RECENT
  );
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function SearchPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlType = searchParams.get("type") ?? "";

  const [input, setInput] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const [contentType, setContentType] = useState(urlType);
  const [urlKey, setUrlKey] = useState(`${urlQuery}\0${urlCategory}\0${urlType}`);
  const currentUrlKey = `${urlQuery}\0${urlCategory}\0${urlType}`;
  if (urlKey !== currentUrlKey) {
    setUrlKey(currentUrlKey);
    setInput(urlQuery);
    setCategory(urlCategory);
    setContentType(urlType);
  }

  const [results, setResults] = useState<ArticleListItem[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    void Promise.resolve().then(() => setRecent(readRecent()));
  }, []);

  const pushSearch = useCallback(
    (q: string, nextCategory = category, nextType = contentType) => {
      const params = new URLSearchParams();
      const trimmed = q.trim();
      if (trimmed) params.set("q", trimmed);
      if (nextCategory) params.set("category", nextCategory);
      if (nextType) params.set("type", nextType);
      const qs = params.toString();
      router.push(qs ? `/search?${qs}` : "/search");
    },
    [router, category, contentType]
  );

  useEffect(() => {
    let cancelled = false;

    if (!urlQuery.trim()) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setResults([]);
          setSearched(false);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setSearched(true);
      }
    });

    const params = new URLSearchParams({ q: urlQuery.trim() });
    if (urlCategory) params.set("category", urlCategory);
    if (urlType) params.set("type", urlType);

    void fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { results?: ArticleListItem[] }) => {
        if (!cancelled) setResults(data.results ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          toast.error("Search failed. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlQuery, urlCategory, urlType]);

  useEffect(() => {
    let cancelled = false;
    const term = input.trim();

    if (term.length < 2) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(() => {
      if (!cancelled) setSuggestLoading(true);
    });

    const timer = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}&suggest=true`)
        .then((res) => res.json())
        .then((data: { suggestions?: Suggestion[] }) => {
          if (!cancelled) setSuggestions(data.suggestions ?? []);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setSuggestLoading(false);
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [input]);

  const runSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    setRecent(readRecent());
    setPanelOpen(false);
    pushSearch(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(input);
  };

  const clearFilters = () => {
    setCategory("");
    setContentType("");
    pushSearch(input, "", "");
  };

  const hasFilters = Boolean(category || contentType);
  const showPanel = panelOpen && input.trim().length >= 2 && (suggestLoading || suggestions.length > 0);

  return (
    <div className="search-page">
      <div className="container search-page-inner">
        <header className="search-page-head">
          <Search className="search-page-icon" aria-hidden />
          <h1 className="search-page-title">Search</h1>
          <p className="search-page-lead">
            Find articles, reports, and analysis across the Global South.
          </p>
        </header>

        <div className="search-page-form-wrap">
          <form className="search-page-form" onSubmit={handleSubmit} role="search">
            <label htmlFor="site-search" className="sr-only">
              Search articles
            </label>
            <Search className="search-page-form-icon" aria-hidden />
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setPanelOpen(true);
              }}
              onFocus={() => setPanelOpen(true)}
              onBlur={() => window.setTimeout(() => setPanelOpen(false), 180)}
              placeholder="Search by topic, author, or keyword…"
              className="search-page-input"
              autoComplete="off"
              enterKeyHint="search"
            />
            {input && (
              <button
                type="button"
                className="search-page-clear"
                onClick={() => {
                  setInput("");
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={16} aria-hidden />
              </button>
            )}
            <button type="submit" className="search-page-submit">
              Search
            </button>
          </form>

          {showPanel && (
            <ul className="search-page-suggestions" aria-label="Suggestions">
              {suggestLoading && suggestions.length === 0 && (
                <li className="search-page-suggestion search-page-suggestion--muted">Searching…</li>
              )}
              {suggestions.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/article/${item.slug}`}
                    className="search-page-suggestion"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="search-page-filters">
          <div className="search-page-filter-group">
            <span className="search-page-filter-label">Section</span>
            <div className="search-page-chips">
              <button
                type="button"
                className={`search-page-chip${!category ? " is-active" : ""}`}
                onClick={() => pushSearch(input, "", contentType)}
              >
                All
              </button>
              {CATEGORY_FILTERS.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  className={`search-page-chip${category === item.slug ? " is-active" : ""}`}
                  onClick={() => pushSearch(input, item.slug, contentType)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="search-page-filter-group">
            <span className="search-page-filter-label">Format</span>
            <div className="search-page-chips">
              {TYPE_FILTERS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={`search-page-chip${contentType === item.value ? " is-active" : ""}`}
                  onClick={() => pushSearch(input, category, item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button type="button" className="search-page-clear-filters" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {!urlQuery && recent.length > 0 && (
          <section className="search-page-recent" aria-label="Recent searches">
            <h2 className="search-page-section-title">
              <Clock size={16} aria-hidden />
              Recent searches
            </h2>
            <div className="search-page-chips">
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="search-page-chip"
                  onClick={() => {
                    setInput(term);
                    runSearch(term);
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        {!urlQuery && (
          <section className="search-page-browse" aria-label="Browse by section">
            <h2 className="search-page-section-title">Browse by section</h2>
            <div className="search-page-browse-grid">
              {CATEGORY_FILTERS.map((item) => (
                <Link key={item.slug} href={`/category/${item.slug}`} className="search-page-browse-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {urlQuery && (
          <section className="search-page-results" aria-live="polite">
            <p className="search-page-results-meta">
              {loading
                ? "Searching…"
                : searched
                  ? `${results.length} result${results.length === 1 ? "" : "s"} for “${urlQuery}”`
                  : null}
              {hasFilters && !loading && (
                <span className="search-page-results-filtered"> · filtered</span>
              )}
            </p>

            {!loading && searched && results.length === 0 && (
              <div className="search-page-empty">
                <p>No articles match your search.</p>
                <p>Try broader keywords or remove filters.</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="search-page-grid">
                {results.map((article) => (
                  <ArticleCard key={article._id} article={article} variant="horizontal" />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
