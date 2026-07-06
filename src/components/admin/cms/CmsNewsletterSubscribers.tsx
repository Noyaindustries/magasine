"use client";

import { useCallback, useEffect, useState } from "react";
import { RelativeTime } from "@/components/admin/cms/RelativeTime";
import { readApiError, toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import { NEWSLETTER_TOPICS } from "@/lib/newsletter-topics";
import { getPaginationItems, NEWSLETTER_PAGE_SIZE } from "@/lib/pagination";

type SubscriberStatusFilter = "active" | "inactive" | "all";

interface SubscriberRow {
  _id: string;
  email: string;
  preferences: string[];
  isActive: boolean;
  subscribedAt?: string;
}

interface SubscribersResponse {
  subscribers: SubscriberRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function topicLabel(id: string): string {
  return NEWSLETTER_TOPICS.find((topic) => topic.id === id)?.label ?? id;
}

function formatSubscribedDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function rangeLabel(page: number, total: number): string {
  if (total === 0) return "0 subscribers";
  const from = (page - 1) * NEWSLETTER_PAGE_SIZE + 1;
  const to = Math.min(page * NEWSLETTER_PAGE_SIZE, total);
  return `${from}–${to} of ${total.toLocaleString("en-US")} subscribers`;
}

interface CmsNewsletterSubscribersProps {
  refreshKey?: number;
}

export function CmsNewsletterSubscribers({ refreshKey = 0 }: CmsNewsletterSubscribersProps) {
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriberStatusFilter>("active");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(NEWSLETTER_PAGE_SIZE),
        status,
      });
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/newsletter/subscribers?${params.toString()}`);
      if (!res.ok) {
        toast.error(await readApiError(res, "Unable to load subscribers"));
        return;
      }

      const data = (await res.json()) as SubscribersResponse;
      setRows(data.subscribers ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toastNetworkError();
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
  };

  const paginationItems = getPaginationItems(page, totalPages);

  return (
    <div className="card mb20">
      <div className="card-header">
        <span className="card-title">Subscriber list</span>
        <span className="card-meta">{total.toLocaleString("en-US")} total</span>
      </div>

      <div className="card-body cms-stack">
        <form className="fbar" onSubmit={submitSearch}>
          <input
            className="input"
            type="search"
            placeholder="Search by email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search subscribers"
            style={{ flex: 1, minWidth: 200 }}
          />
          <button type="submit" className="btn btn-out btn-sm">
            Search
          </button>
          {search ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setQuery("");
                setSearch("");
              }}
            >
              Clear
            </button>
          ) : null}
        </form>

        <div className="tabs" role="tablist" aria-label="Subscriber status">
          {(
            [
              { id: "active" as const, label: "Active" },
              { id: "inactive" as const, label: "Unsubscribed" },
              { id: "all" as const, label: "All" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={status === tab.id}
              className={`tab${status === tab.id ? " on" : ""}`}
              onClick={() => setStatus(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card-np">
          <table className="tbl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Topics</th>
                <th>Status</th>
                <th>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="cms-empty-cell">
                    Loading subscribers…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="cms-empty-cell">
                    {search
                      ? "No subscribers match this search."
                      : status === "active"
                        ? "No active subscribers yet. Import a Mailchimp CSV or wait for sign-ups on the site."
                        : "No subscribers in this list."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <div className="tc-main">{row.email}</div>
                    </td>
                    <td className="tc-muted" style={{ maxWidth: 280 }}>
                      {row.preferences.length > 0
                        ? row.preferences.map(topicLabel).join(", ")
                        : "Daily briefing, Weekly digest"}
                    </td>
                    <td>
                      <span className={`badge ${row.isActive ? "b-pub" : "b-arch"}`}>
                        {row.isActive ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="tc-muted">
                      {row.subscribedAt ? (
                        <>
                          <span title={formatSubscribedDate(row.subscribedAt)}>
                            {formatSubscribedDate(row.subscribedAt)}
                          </span>
                          <span className="tc-sub">
                            {" "}
                            · <RelativeTime iso={row.subscribedAt} />
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pag">
            <div className="paginfo">
              {rangeLabel(page, total)} · Page {page} of {totalPages}
            </div>
            <div className="pagbtns">
              <button
                type="button"
                className={`pagb${page <= 1 || loading ? " pagb--disabled" : ""}`}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                ←
              </button>
              {paginationItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="pagdots" aria-hidden>
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`pagb${item === page ? " on" : ""}`}
                    disabled={loading}
                    onClick={() => setPage(item)}
                    aria-current={item === page ? "page" : undefined}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                className={`pagb${page >= totalPages || loading ? " pagb--disabled" : ""}`}
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
