"use client";

import { useCallback, useEffect, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons } from "@/components/admin/cms/CmsIcons";
import { toast } from "@/lib/toast";
import { useSiteBranding } from "@/components/SiteBranding";

interface CampaignRow {
  _id: string;
  title: string;
  subtitle: string;
  status: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
}

interface ListRow {
  name: string;
  count: number;
  pct: number;
  color: string;
}

interface CmsNewsletterViewProps {
  initialTotalActive: number;
}

export function CmsNewsletterView({ initialTotalActive }: CmsNewsletterViewProps) {
  const { siteName } = useSiteBranding();
  const [stats, setStats] = useState({
    totalActive: initialTotalActive,
    monthlyNew: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribes: 0,
    lists: [] as ListRow[],
  });
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [subject, setSubject] = useState(`L'essentiel du jour — ${siteName}`);
  const [listTarget, setListTarget] = useState("all");
  const [scheduledAt, setScheduledAt] = useState("");
  const [body, setBody] = useState(
    `Bonjour,\n\nVoici la sélection éditoriale du jour.\n\n— L'équipe ${siteName}`
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/newsletter/stats").then((r) => r.json()),
      fetch("/api/admin/newsletter/campaigns").then((r) => r.json()),
    ]).then(([statsData, campaignsData]) => {
      if (statsData.totalActive !== undefined) {
        setStats({
          totalActive: statsData.totalActive,
          monthlyNew: statsData.monthlyNew ?? 0,
          openRate: statsData.openRate ?? 0,
          clickRate: statsData.clickRate ?? 0,
          unsubscribes: statsData.unsubscribes ?? 0,
          lists: statsData.lists ?? [],
        });
      }
      setCampaigns(campaignsData.campaigns ?? []);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const scheduleCampaign = async () => {
    setSaving(true);
    const toastId = toast.loading("Enregistrement de la campagne…");
    try {
      const res = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: subject,
          subject,
          body,
          listTarget,
          scheduledAt: scheduledAt || undefined,
        }),
      });
      if (!res.ok) {
        toast.dismiss(toastId);
        toast.error("Échec de la planification.");
        return;
      }
      toast.dismiss(toastId);
      toast.success("Campagne enregistrée avec succès.");
      load();
    } finally {
      setSaving(false);
    }
  };

  const exportSubscribers = () => {
    window.open("/api/admin/newsletter/export", "_blank");
  };

  const deleteCampaign = async (campaign: CampaignRow) => {
    if (!confirm(`Supprimer la campagne « ${campaign.title} » ?`)) return;
    const res = await fetch(`/api/admin/newsletter/campaigns/${campaign._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Suppression impossible.");
      return;
    }
    toast.success("Campagne supprimée");
    load();
  };

  const formatRate = (opens: number, clicks: number, sent: number) => {
    if (sent <= 0) return { opens: "—", clicks: "—" };
    const openPct = ((opens / sent) * 100).toFixed(1).replace(".", ",");
    const clickPct = ((clicks / sent) * 100).toFixed(1).replace(".", ",");
    return {
      opens: `${opens.toLocaleString("fr-FR")} (${openPct}%)`,
      clicks: `${clicks.toLocaleString("fr-FR")} (${clickPct}%)`,
    };
  };

  return (
    <CmsPage className="cms-newsletter-page">
      <div className="vhead">
        <div>
          <div className="vh1">Newsletter</div>
          <div className="vh2">
            {stats.totalActive.toLocaleString("fr-FR")} abonnés actifs · Taux d&apos;ouverture{" "}
            {stats.openRate}%
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-out" onClick={exportSubscribers}>
            Exporter les abonnés
          </button>
          <button type="button" className="btn btn-red" onClick={() => void scheduleCampaign()}>
            + Nouvelle campagne
          </button>
        </div>
      </div>

      <div className="kgrid mb20">
        <div className="kpi k-green">
          <div className="klbl">Abonnés totaux</div>
          <div className="kval">{stats.totalActive.toLocaleString("fr-FR")}</div>
          <div className="kmeta">
            <span className="kdelta up">▲ +{stats.monthlyNew}</span> ce mois
          </div>
        </div>
        <div className="kpi k-blue">
          <div className="klbl">Taux d&apos;ouverture</div>
          <div className="kval">{stats.openRate}%</div>
        </div>
        <div className="kpi k-amber">
          <div className="klbl">Taux de clic</div>
          <div className="kval">{stats.clickRate}%</div>
        </div>
        <div className="kpi k-red">
          <div className="klbl">Désabonnements</div>
          <div className="kval">{stats.unsubscribes}</div>
        </div>
      </div>

      <div className="g21 ga">
        <div className="cms-newsletter-main">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Campagnes récentes</span>
            </div>
            <div className="card-np">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Campagne</th>
                    <th>Envoyé</th>
                    <th>Ouverts</th>
                    <th>Clics</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((row) => {
                    const rates = formatRate(row.openCount, row.clickCount, row.recipientCount);
                    return (
                      <tr key={row._id}>
                        <td>
                          <div className="tc-main">{row.title}</div>
                          <div className="tc-sub">{row.subtitle}</div>
                        </td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "11.5px" }}>
                          {row.recipientCount > 0 ? row.recipientCount.toLocaleString("fr-FR") : "—"}
                        </td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--green)" }}>
                          {rates.opens}
                        </td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--blue)" }}>
                          {rates.clicks}
                        </td>
                        <td>
                          <span className={`badge b-${row.status === "sent" ? "pub" : "plan"}`}>
                            {row.status === "sent" ? "Envoyée" : "Planifiée"}
                          </span>
                        </td>
                        <td className="tbl-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-icon"
                            title="Supprimer"
                            onClick={() => void deleteCampaign(row)}
                          >
                            <CmsActionIcons.delete size={14} className="cms-icon cms-icon--error" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="nlprev">
            <div className="nlph">
              <div className="nlplogo">{siteName}</div>
              <div className="nlph-meta">Aperçu en direct</div>
            </div>
            <div className="nlpbody">
              <div className="nlpsubj">{subject}</div>
              <div className="nlptxt" style={{ whiteSpace: "pre-wrap" }}>
                {body}
              </div>
            </div>
          </div>
        </div>

        <div className="cms-newsletter-side">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Segmentation des listes</span>
            </div>
            <div className="card-body cms-list-segment">
              {stats.lists.map((list) => (
                <div key={list.name} className="mm">
                  <div className="mml">
                    <div className="mmdot" style={{ background: list.color }} />
                    <span className="mmname">{list.name}</span>
                  </div>
                  <div className="mm-right">
                    <div className="mmv">{list.count.toLocaleString("fr-FR")}</div>
                    <div className="mmbar">
                      <div className="mmfill" style={{ width: `${list.pct}%`, background: list.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Composer une campagne</span>
            </div>
            <div className="card-body cms-stack">
              <div className="field">
                <label className="lbl" htmlFor="nl-subject">
                  Objet de l&apos;e-mail
                </label>
                <input
                  id="nl-subject"
                  className="input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="nl-body">
                  Corps du message
                </label>
                <textarea
                  id="nl-body"
                  className="input"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="nl-list">
                  Liste cible
                </label>
                <select
                  id="nl-list"
                  className="input sel"
                  value={listTarget}
                  onChange={(e) => setListTarget(e.target.value)}
                >
                  <option value="all">
                    Tous les abonnés ({stats.totalActive.toLocaleString("fr-FR")})
                  </option>
                  {stats.lists.map((list) => (
                    <option key={list.name} value={list.name}>
                      {list.name} ({list.count.toLocaleString("fr-FR")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="lbl" htmlFor="nl-schedule">
                  Date d&apos;envoi (optionnel)
                </label>
                <input
                  id="nl-schedule"
                  className="input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-red cms-full-btn"
                disabled={saving}
                onClick={() => void scheduleCampaign()}
              >
                {saving ? "Enregistrement…" : "Planifier l'envoi →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CmsPage>
  );
}
