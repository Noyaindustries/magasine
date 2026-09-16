"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons } from "@/components/admin/cms/CmsIcons";
import { RelativeTime } from "@/components/admin/cms/RelativeTime";
import { readApiError, toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import {
  DEFAULT_NEWSLETTER_TOPICS,
  NEWSLETTER_MULTI_EDITION_ENABLED,
  NEWSLETTER_TOPICS,
  PRIMARY_NEWSLETTER_TOPIC_ID,
} from "@/lib/newsletter-topics";
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

interface SubscriberFormState {
  email: string;
  preferences: string[];
  isActive: boolean;
}

interface CmsNewsletterSubscribersViewProps {
  initialActive: number;
  initialTotal: number;
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

function emptyForm(): SubscriberFormState {
  return {
    email: "",
    preferences: NEWSLETTER_MULTI_EDITION_ENABLED
      ? [...DEFAULT_NEWSLETTER_TOPICS]
      : [PRIMARY_NEWSLETTER_TOPIC_ID],
    isActive: true,
  };
}

export function CmsNewsletterSubscribersView({
  initialActive,
  initialTotal,
}: CmsNewsletterSubscribersViewProps) {
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SubscriberStatusFilter>("active");
  const [importing, setImporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriberRow | null>(null);
  const [form, setForm] = useState<SubscriberFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

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
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      setEditing(null);
      setForm(emptyForm());
      setModalOpen(true);
      params.delete("add");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(query.trim());
  };

  const exportSubscribers = () => {
    window.open("/api/admin/newsletter/export", "_blank");
    toast.success("Subscriber export started");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row: SubscriberRow) => {
    setEditing(row);
    setForm({
      email: row.email,
      preferences:
        row.preferences.length > 0
          ? row.preferences
          : NEWSLETTER_MULTI_EDITION_ENABLED
            ? [...DEFAULT_NEWSLETTER_TOPICS]
            : [PRIMARY_NEWSLETTER_TOPIC_ID],
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const togglePreference = (topicId: string) => {
    setForm((current) => {
      const has = current.preferences.includes(topicId);
      if (has) {
        const next = current.preferences.filter((id) => id !== topicId);
        return {
          ...current,
          preferences:
            next.length > 0
              ? next
              : NEWSLETTER_MULTI_EDITION_ENABLED
                ? [PRIMARY_NEWSLETTER_TOPIC_ID]
                : [PRIMARY_NEWSLETTER_TOPIC_ID],
        };
      }
      return { ...current, preferences: [...current.preferences, topicId] };
    });
  };

  const saveSubscriber = async () => {
    const email = form.email.trim();
    if (!email) {
      toast.error("Email is required.");
      return;
    }

    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/newsletter/subscribers/${editing._id}`
        : "/api/admin/newsletter/subscribers";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          preferences: form.preferences,
          isActive: form.isActive,
        }),
      });
      const data = (await res.json()) as { error?: string; created?: boolean };
      if (!res.ok) {
        toast.error(data.error ?? "Unable to save contact.");
        return;
      }
      toast.success(
        editing
          ? "Contact updated."
          : data.created === false
            ? "Existing contact updated."
            : "Contact added."
      );
      setModalOpen(false);
      void load();
    } catch {
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const removeSubscriber = async (row: SubscriberRow) => {
    if (!globalThis.confirm(`Delete ${row.email} permanently?`)) return;
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers/${row._id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Unable to delete contact.");
        return;
      }
      toast.success("Contact deleted.");
      void load();
    } catch {
      toastNetworkError();
    }
  };

  const importMailchimpCsv = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".zip")) {
      toast.error(
        "ZIP detected. Unzip the Mailchimp export and upload subscribed_members_*.csv."
      );
      return;
    }

    setImporting(true);
    const toastId = toast.loading("Importing Mailchimp subscribers…");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/newsletter/import", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        errors?: string[];
      };
      toast.dismiss(toastId);

      if (!res.ok) {
        const detail = data.errors?.length
          ? `${data.error ?? "Import failed."} (${data.errors.slice(0, 2).join(" ")})`
          : (data.error ?? "Import failed.");
        toast.error(detail);
        return;
      }

      toast.success(data.message ?? "Import complete.");
      void load();
    } catch {
      toast.dismiss(toastId);
      toastNetworkError();
    } finally {
      setImporting(false);
    }
  };

  const paginationItems = getPaginationItems(page, totalPages);

  return (
    <CmsPage className="cms-newsletter-subscribers-page">
      <div className="vhead">
        <div>
          <div className="vh1">Subscribers</div>
          <div className="vh2">
            {initialActive.toLocaleString("en-US")} active · {initialTotal.toLocaleString("en-US")}{" "}
            total in database
            {search ? ` · ${total.toLocaleString("en-US")} matching` : ""}
          </div>
        </div>
        <div className="vacts">
          <Link href="/admin/newsletter" className="btn btn-ghost">
            ← Newsletter
          </Link>
          <label className="btn btn-out" style={{ cursor: importing ? "wait" : "pointer" }}>
            {importing ? "Importing…" : "Import Mailchimp CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void importMailchimpCsv(file);
              }}
            />
          </label>
          <button type="button" className="btn btn-out" onClick={exportSubscribers}>
            Export CSV
          </button>
          <button type="button" className="btn btn-red" onClick={openCreate}>
            Add contact
          </button>
        </div>
      </div>

      <div className="card mb20">
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
                  <th className="tbl-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="cms-empty-cell">
                      Loading subscribers…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="cms-empty-cell">
                      {search
                        ? "No subscribers match this search."
                        : status === "active"
                          ? "No active subscribers yet. Add a contact, import a CSV, or wait for sign-ups."
                          : "No subscribers in this list."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <div className="tc-main">{row.email}</div>
                      </td>
                      <td className="tc-muted" style={{ maxWidth: 320 }}>
                        {row.preferences.length > 0
                          ? row.preferences.map(topicLabel).join(", ")
                          : "Newsletter"}
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
                      <td className="tbl-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-icon"
                          title="Edit contact"
                          onClick={() => openEdit(row)}
                        >
                          <CmsActionIcons.edit size={14} className="cms-icon" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs btn-icon"
                          title="Delete contact"
                          onClick={() => void removeSubscriber(row)}
                        >
                          <CmsActionIcons.delete
                            size={14}
                            className="cms-icon cms-icon--error"
                            aria-hidden
                          />
                        </button>
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

      {modalOpen && (
        <div
          className="cms-ad-modal-overlay"
          role="presentation"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="cms-ad-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nl-contact-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cms-ad-modal-head">
              <h3 id="nl-contact-modal-title">
                {editing ? "Edit contact" : "Add contact"}
              </h3>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                disabled={saving}
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="cms-stack" style={{ padding: "16px 20px" }}>
              <div className="field">
                <label className="lbl" htmlFor="nl-contact-email">
                  Email
                </label>
                <input
                  id="nl-contact-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="name@example.com"
                  autoFocus
                />
              </div>

              {NEWSLETTER_MULTI_EDITION_ENABLED ? (
                <div className="field">
                  <span className="lbl">Topics</span>
                  <div className="cms-region-grid">
                    {NEWSLETTER_TOPICS.map((topic) => {
                      const checked = form.preferences.includes(topic.id);
                      return (
                        <label key={topic.id} className="cms-region-option">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePreference(topic.id)}
                          />
                          <span>{topic.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="field">
                <label className="cms-region-option">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, isActive: e.target.checked }))
                    }
                  />
                  <span>Active subscriber</span>
                </label>
                <p className="cms-field-hint">
                  Uncheck to mark as unsubscribed without deleting the contact.
                </p>
              </div>

              <div className="cms-ad-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-red"
                  disabled={saving}
                  onClick={() => void saveSubscriber()}
                >
                  {saving ? "Saving…" : editing ? "Save changes" : "Add contact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CmsPage>
  );
}
