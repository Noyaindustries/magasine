"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { toastNetworkError } from "@/lib/api-toast";
import { MAX_SELECTED_NEWSLETTER_RECIPIENTS } from "@/lib/newsletter-recipients";

interface SubscriberHit {
  _id: string;
  email: string;
  isActive?: boolean;
}

interface CmsNewsletterRecipientsPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE = 200;

function looksLikeEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim().toLowerCase());
}

export function CmsNewsletterRecipientsPicker({
  value,
  onChange,
}: CmsNewsletterRecipientsPickerProps) {
  const [query, setQuery] = useState("");
  const [addQuery, setAddQuery] = useState("");
  const [contacts, setContacts] = useState<SubscriberHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const selectedSet = useMemo(() => new Set(value), [value]);

  const loadPage = useCallback(async (page: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        status: "active",
      });
      const res = await fetch(`/api/admin/newsletter/subscribers?${params.toString()}`);
      if (!res.ok) {
        toast.error("Unable to load subscribers.");
        return;
      }
      const data = (await res.json()) as {
        subscribers?: SubscriberHit[];
        total?: number;
      };
      const rows = (data.subscribers ?? []).map((row) => ({
        ...row,
        email: row.email.toLowerCase(),
      }));
      setTotal(data.total ?? rows.length);
      setContacts((prev) => {
        if (!append) return rows;
        const seen = new Set(prev.map((item) => item.email));
        return [...prev, ...rows.filter((item) => !seen.has(item.email))];
      });
    } catch {
      toastNetworkError();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1, false);
  }, [loadPage]);

  const filteredContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((item) => item.email.includes(q));
  }, [contacts, query]);

  const toggle = useCallback(
    (email: string) => {
      const normalized = email.trim().toLowerCase();
      if (selectedSet.has(normalized)) {
        onChange(value.filter((item) => item !== normalized));
        return;
      }
      if (value.length >= MAX_SELECTED_NEWSLETTER_RECIPIENTS) {
        toast.error(
          `You can select at most ${MAX_SELECTED_NEWSLETTER_RECIPIENTS.toLocaleString("en-US")} contacts.`
        );
        return;
      }
      onChange([...value, normalized]);
    },
    [onChange, selectedSet, value]
  );

  const selectVisible = useCallback(() => {
    const next = new Set(value);
    for (const item of filteredContacts) {
      if (next.size >= MAX_SELECTED_NEWSLETTER_RECIPIENTS) break;
      next.add(item.email);
    }
    onChange([...next]);
  }, [filteredContacts, onChange, value]);

  const clearSelection = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const createAndAdd = useCallback(
    async (rawEmail: string) => {
      const email = rawEmail.trim().toLowerCase();
      if (!looksLikeEmail(email)) {
        toast.error("Enter a valid email address.");
        return;
      }
      if (value.length >= MAX_SELECTED_NEWSLETTER_RECIPIENTS) {
        toast.error(
          `You can select at most ${MAX_SELECTED_NEWSLETTER_RECIPIENTS.toLocaleString("en-US")} contacts.`
        );
        return;
      }

      setCreating(true);
      try {
        const res = await fetch("/api/admin/newsletter/subscribers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, isActive: true }),
        });
        const data = (await res.json()) as {
          error?: string;
          created?: boolean;
          subscriber?: { _id?: string; email: string };
        };
        if (!res.ok) {
          toast.error(data.error ?? "Unable to add contact.");
          return;
        }
        const savedEmail = (data.subscriber?.email ?? email).toLowerCase();
        setContacts((prev) => {
          if (prev.some((item) => item.email === savedEmail)) return prev;
          return [
            {
              _id: data.subscriber?._id ?? savedEmail,
              email: savedEmail,
              isActive: true,
            },
            ...prev,
          ];
        });
        setTotal((n) => n + (data.created === false ? 0 : 1));
        if (!selectedSet.has(savedEmail)) {
          onChange([...value, savedEmail]);
        }
        setAddQuery("");
        toast.success(
          data.created === false
            ? "Existing contact reactivated and selected."
            : "Contact added and selected."
        );
      } catch {
        toastNetworkError();
      } finally {
        setCreating(false);
      }
    },
    [onChange, selectedSet, value]
  );

  const canLoadMore = contacts.length < total;
  const nextPage = Math.floor(contacts.length / PAGE_SIZE) + 1;
  const trimmedAdd = addQuery.trim().toLowerCase();
  const canCreateNew = looksLikeEmail(trimmedAdd);

  return (
    <div className="field">
      <label className="lbl">
        Select emails ({value.length.toLocaleString("en-US")} selected)
      </label>
      <p className="cms-field-hint">
        Tick the addresses to include in this send. Up to{" "}
        {MAX_SELECTED_NEWSLETTER_RECIPIENTS.toLocaleString("en-US")} contacts.
      </p>

      <div className="fbar" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <input
          type="search"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter the list…"
          aria-label="Filter subscriber emails"
          style={{ flex: 1, minWidth: 180 }}
        />
        <button type="button" className="btn btn-out btn-sm" onClick={selectVisible}>
          Select visible
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={clearSelection}
          disabled={value.length === 0}
        >
          Clear
        </button>
      </div>

      <div
        className="cms-related-list"
        style={{
          maxHeight: 280,
          overflowY: "auto",
          border: "1px solid var(--cms-border, #ddd)",
          borderRadius: 6,
          padding: "4px 0",
        }}
        role="listbox"
        aria-label="Subscriber emails"
        aria-multiselectable="true"
      >
        {loading ? (
          <p className="cms-field-hint" style={{ padding: "8px 12px" }}>
            Loading contacts…
          </p>
        ) : filteredContacts.length === 0 ? (
          <p className="cms-field-hint" style={{ padding: "8px 12px" }}>
            {contacts.length === 0
              ? "No active subscribers yet. Add an email below."
              : "No match for this filter."}
          </p>
        ) : (
          filteredContacts.map((item) => {
            const checked = selectedSet.has(item.email);
            return (
              <label
                key={item._id}
                className="cms-related-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(item.email)}
                  aria-label={`Select ${item.email}`}
                />
                <span className="cms-related-item-title">{item.email}</span>
              </label>
            );
          })
        )}
      </div>

      {canLoadMore && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8 }}
          disabled={loadingMore}
          onClick={() => void loadPage(nextPage, true)}
        >
          {loadingMore
            ? "Loading…"
            : `Load more (${contacts.length.toLocaleString("en-US")} / ${total.toLocaleString("en-US")})`}
        </button>
      )}

      {value.length > 0 && (
        <p className="cms-field-hint" style={{ marginTop: 8 }}>
          Selected: {value.slice(0, 5).join(", ")}
          {value.length > 5 ? ` (+${value.length - 5} more)` : ""}
        </p>
      )}

      {value.length < MAX_SELECTED_NEWSLETTER_RECIPIENTS && (
        <div className="cms-related-search" style={{ marginTop: 12 }}>
          <div className="fbar" style={{ gap: 8 }}>
            <input
              type="email"
              className="input"
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (canCreateNew) void createAndAdd(trimmedAdd);
              }}
              placeholder="Add a new email…"
              aria-label="Add a new newsletter contact"
              style={{ flex: 1, minWidth: 180 }}
              disabled={creating}
            />
            <button
              type="button"
              className="btn btn-out btn-sm"
              disabled={creating || !canCreateNew}
              onClick={() => void createAndAdd(trimmedAdd)}
            >
              {creating ? "Adding…" : "Add email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
