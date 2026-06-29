"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Radio, Trash2 } from "lucide-react";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { toast } from "@/lib/toast";

interface AlertRow {
  _id: string;
  text: string;
  link: string;
  isActive: boolean;
  order: number;
}

const emptyForm = { text: "", link: "", isActive: true, order: 0 };

export function AlertsManager({ initial }: { initial: AlertRow[] }) {
  const [alerts, setAlerts] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/admin/alerts")
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts ?? []));
  }, []);

  useEffect(() => {
    if (initial.length === 0) reload();
  }, [initial.length, reload]);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm(emptyForm);
        toast.success("Alert created");
        reload();
      } else {
        toast.error("Failed to create alert");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (alert: AlertRow) => {
    await fetch(`/api/admin/alerts/${alert._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !alert.isActive }),
    });
    toast.success(alert.isActive ? "Alert deactivated" : "Alert activated");
    reload();
  };

  const remove = async (id: string) => {
    if (!globalThis.confirm("Delete this alert?")) return;
    await fetch(`/api/admin/alerts/${id}`, { method: "DELETE" });
    toast.success("Alert deleted");
    reload();
  };

  const liveCount = alerts.filter((a) => a.isActive).length;

  return (
    <AdminSectionShell
      eyebrow="Breaking news"
      title={
        <>
          Alerts & <em>ticker</em>
        </>
      }
      description="Configure urgent headlines shown in the breaking news strip on the public homepage."
      pulse="gold"
      stats={[
        { value: alerts.length, label: "Total" },
        { value: liveCount, label: "Live" },
      ]}
      actions={
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" aria-hidden />
          Add alert
        </button>
      }
    >
      {alerts.length === 0 ? (
        <p className="adm-empty">No breaking alerts configured. Add one to activate the ticker.</p>
      ) : (
        <div className="adm-alert-list">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`adm-alert-card${alert.isActive ? " adm-alert-card--live" : ""}`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {alert.isActive && <span className="adm-alert-live-dot" aria-hidden />}
                <div className="min-w-0">
                  <p className="adm-alert-text">{alert.text}</p>
                  {alert.link && <p className="adm-alert-sub">→ {alert.link}</p>}
                  <p className="adm-alert-sub">Display order: {alert.order}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={`adm-btn adm-btn--sm ${alert.isActive ? "adm-btn--danger" : "adm-btn--secondary"}`}
                  onClick={() => toggle(alert)}
                >
                  <Radio className="w-3.5 h-3.5" aria-hidden />
                  {alert.isActive ? "Live" : "Off"}
                </button>
                <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => remove(alert._id)}>
                  <Trash2 className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="admin-modal-header">
              <h2>New breaking alert</h2>
            </div>
            <div className="admin-modal-body admin-form-grid">
              <div className="admin-field">
                <label>Alert text</label>
                <input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required />
              </div>
              <div className="admin-field">
                <label>Link (optional)</label>
                <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/urgent" />
              </div>
              <div className="admin-field">
                <label>Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="adm-btn adm-btn--primary" disabled={loading || !form.text} onClick={save}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSectionShell>
  );
}
