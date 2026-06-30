"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { formatRelativeEn } from "@/components/admin/cms/cms-ui";
import { readApiError, toastNetworkError } from "@/lib/api-toast";
import {
  type AdminDonationRow,
  type AdminDonationStats,
  donationStatusLabel,
  formatAdminDonationAmount,
} from "@/lib/admin-donations";
import { toast } from "@/lib/toast";

type Filter = "all" | "pledged" | "completed" | "failed" | "monthly" | "one-time";

const EMPTY_STATS: AdminDonationStats = {
  totalCompleted: 0,
  totalPledged: 0,
  pledgedCount: 0,
  completedCount: 0,
  failedCount: 0,
  monthlyRecurring: 0,
  donorsThisMonth: 0,
};

function fetchDonations() {
  return fetch("/api/admin/donations")
    .then((r) => r.json())
    .then((data) => ({
      stats: (data.stats ?? EMPTY_STATS) as AdminDonationStats,
      donations: (data.donations ?? []) as AdminDonationRow[],
    }));
}

function statusBadgeClass(status: AdminDonationRow["status"]) {
  if (status === "completed") return "badge b-pub";
  if (status === "pledged") return "badge b-plan";
  return "badge b-arch";
}

function exportCsv(rows: AdminDonationRow[]) {
  const header = ["Date", "Name", "Email", "Amount", "Currency", "Frequency", "Status", "Cover fees", "Anonymous", "Message"];
  const lines = rows.map((row) =>
    [
      row.createdAt,
      row.displayName,
      row.email,
      row.amount,
      row.currency,
      row.frequency,
      row.status,
      row.coverFees ? "yes" : "no",
      row.anonymous ? "yes" : "no",
      (row.message ?? "").replace(/"/g, '""'),
    ]
      .map((cell) => `"${String(cell)}"`)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `donations-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CmsDonationsView() {
  const [donations, setDonations] = useState<AdminDonationRow[]>([]);
  const [stats, setStats] = useState<AdminDonationStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pledged");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void fetchDonations()
      .then(({ stats: nextStats, donations: rows }) => {
        setStats(nextStats);
        setDonations(rows);
      })
      .catch(() => toastNetworkError())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return donations.filter((row) => {
      if (filter === "pledged") return row.status === "pledged";
      if (filter === "completed") return row.status === "completed";
      if (filter === "failed") return row.status === "failed";
      if (filter === "monthly") return row.frequency === "monthly";
      if (filter === "one-time") return row.frequency === "one-time";
      return true;
    });
  }, [donations, filter]);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: donations.length },
    { id: "pledged", label: "Pledged", count: stats.pledgedCount },
    { id: "completed", label: "Completed", count: stats.completedCount },
    { id: "failed", label: "Failed", count: stats.failedCount },
    { id: "monthly", label: "Monthly", count: stats.monthlyRecurring },
    {
      id: "one-time",
      label: "One-time",
      count: donations.filter((d) => d.frequency === "one-time").length,
    },
  ];

  const updateStatus = async (donationId: string, status: AdminDonationRow["status"]) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId, status }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res, "Unable to update donation."));
        return;
      }
      toast.success(`Marked as ${donationStatusLabel(status).toLowerCase()}.`);
      load();
    } catch {
      toastNetworkError();
    } finally {
      setBusy(false);
    }
  };

  const removeDonation = async (row: AdminDonationRow) => {
    if (!confirm(`Delete the ${formatAdminDonationAmount(row.amount, { frequency: row.frequency })} pledge from ${row.displayName}?`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId: row._id }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res, "Unable to delete donation."));
        return;
      }
      toast.success("Donation removed.");
      load();
    } catch {
      toastNetworkError();
    } finally {
      setBusy(false);
    }
  };

  const markAllPledgedCompleted = async () => {
    const pledged = donations.filter((d) => d.status === "pledged");
    if (pledged.length === 0) return;
    if (!confirm(`Mark ${pledged.length} pledged donation(s) as completed?`)) return;
    setBusy(true);
    try {
      await Promise.all(
        pledged.map((row) =>
          fetch("/api/admin/donations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donationId: row._id, status: "completed" }),
          })
        )
      );
      toast.success("Pledged donations marked as completed.");
      load();
    } catch {
      toastNetworkError();
    } finally {
      setBusy(false);
    }
  };

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Donations</div>
          <div className="vh2">
            {donations.length} records · {stats.pledgedCount} to confirm · {stats.donorsThisMonth} donors this month
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-out" onClick={() => exportCsv(filtered)} disabled={filtered.length === 0}>
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-red"
            disabled={busy || stats.pledgedCount === 0}
            onClick={() => void markAllPledgedCompleted()}
          >
            Confirm all pledged
          </button>
        </div>
      </div>

      <div className="kgrid mb20">
        <div className="kpi k-red">
          <div className="klbl">Completed</div>
          <div className="kval">{formatAdminDonationAmount(stats.totalCompleted)}</div>
          <div className="kmeta">{stats.completedCount} gifts</div>
        </div>
        <div className="kpi k-amber">
          <div className="klbl">Pledged</div>
          <div className="kval">{formatAdminDonationAmount(stats.totalPledged)}</div>
          <div className="kmeta">{stats.pledgedCount} awaiting payment</div>
        </div>
        <div className="kpi k-green">
          <div className="klbl">Monthly supporters</div>
          <div className="kval">{stats.monthlyRecurring}</div>
          <div className="kmeta">Active recurring pledges</div>
        </div>
        <div className="kpi k-blue">
          <div className="klbl">This month</div>
          <div className="kval">{stats.donorsThisMonth}</div>
          <div className="kmeta">Unique donors</div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={filter === tab.id ? "tab on" : "tab"}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-np">
          {loading ? (
            <p className="cms-empty" style={{ padding: "1.5rem" }}>
              Loading donations…
            </p>
          ) : filtered.length === 0 ? (
            <p className="cms-empty" style={{ padding: "1.5rem" }}>
              No donations in this view.
            </p>
          ) : (
            <table className="tbl tbl-compact">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Message</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <strong>{row.displayName}</strong>
                      {!row.anonymous && (
                        <div className="cms-field-hint" style={{ margin: 0 }}>
                          {row.email}
                        </div>
                      )}
                      {row.coverFees && (
                        <div className="cms-field-hint" style={{ margin: 0 }}>
                          +3% fees covered
                        </div>
                      )}
                    </td>
                    <td>{formatAdminDonationAmount(row.amount, { frequency: row.frequency, currency: row.currency })}</td>
                    <td>{row.frequency === "monthly" ? "Monthly" : "One-time"}</td>
                    <td>
                      <span className={statusBadgeClass(row.status)}>{donationStatusLabel(row.status)}</span>
                    </td>
                    <td>{formatRelativeEn(row.createdAt)}</td>
                    <td className="cms-donation-message">{row.message || "—"}</td>
                    <td>
                      <div className="tbl-actions">
                        {row.status === "pledged" && (
                          <>
                            <button
                              type="button"
                              className="btn btn-xs btn-red"
                              disabled={busy}
                              onClick={() => void updateStatus(row._id, "completed")}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost"
                              disabled={busy}
                              onClick={() => void updateStatus(row._id, "failed")}
                            >
                              Failed
                            </button>
                          </>
                        )}
                        {row.status === "completed" && (
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost"
                            disabled={busy}
                            onClick={() => void updateStatus(row._id, "pledged")}
                          >
                            Reopen
                          </button>
                        )}
                        {row.status === "failed" && (
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost"
                            disabled={busy}
                            onClick={() => void updateStatus(row._id, "pledged")}
                          >
                            Restore
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost cms-delete-btn"
                          disabled={busy}
                          onClick={() => void removeDonation(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Workflow</span>
        </div>
        <div className="card-body cms-stack">
          <p className="cms-field-hint" style={{ margin: 0 }}>
            Public pledges are saved as <strong>Pledged</strong> until payment is live. Mark them{" "}
            <strong>Completed</strong> after manual confirmation or when Stripe webhooks are connected.
            Failed payments stay in the archive for follow-up.
          </p>
        </div>
      </div>
    </CmsPage>
  );
}
