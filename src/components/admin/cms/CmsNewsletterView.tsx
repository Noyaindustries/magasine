"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons } from "@/components/admin/cms/CmsIcons";
import { readApiError, toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import { useSiteBranding } from "@/components/SiteBranding";
import {
  formatNewsletterDefaultSubject,
  resolveNewsletterEmailHeaderTitle,
} from "@/lib/newsletter-email-branding";
import {
  isNewsletterBodyHtml,
  plainTextToNewsletterEditorHtml,
  sanitizeNewsletterBodyHtml,
} from "@/lib/newsletter-body-html";
import { CmsNewsletterBodyEditor } from "@/components/admin/cms/CmsNewsletterBodyEditor";

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
  label?: string;
  count: number;
  pct: number;
  color: string;
}

interface CmsNewsletterViewProps {
  initialTotalActive: number;
}

export function CmsNewsletterView({ initialTotalActive }: CmsNewsletterViewProps) {
  const { siteName, siteLogo } = useSiteBranding();
  const [stats, setStats] = useState({
    totalActive: initialTotalActive,
    monthlyNew: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribes: 0,
    lists: [] as ListRow[],
  });
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [mailConfigured, setMailConfigured] = useState(true);
  const [subject, setSubject] = useState("");
  const [emailHeaderTitle, setEmailHeaderTitle] = useState(siteName);
  const [listTarget, setListTarget] = useState("all");
  const [scheduledAt, setScheduledAt] = useState("");
  const [body, setBody] = useState(
    plainTextToNewsletterEditorHtml(
      `Hello,\n\nHere is today's editorial selection.\n\n— The ${siteName} team`
    )
  );
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/newsletter/stats"),
      fetch("/api/admin/newsletter/campaigns"),
      fetch("/api/admin/settings"),
    ])
      .then(async ([statsRes, campaignsRes, settingsRes]) => {
        if (!statsRes.ok) {
          toast.error(await readApiError(statsRes, "Unable to load statistics"));
        } else {
          const statsData = await statsRes.json();
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
        }
        if (!campaignsRes.ok) {
          toast.error(await readApiError(campaignsRes, "Unable to load campaigns"));
        } else {
          const campaignsData = await campaignsRes.json();
          setCampaigns(campaignsData.campaigns ?? []);
          setMailConfigured(campaignsData.mailConfigured !== false);
        }
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          const resolvedName = settingsData.siteName ?? siteName;
          const defaultSubject = formatNewsletterDefaultSubject(
            settingsData.newsletterDefaultSubject ?? "Today's essentials — {siteName}",
            resolvedName
          );
          setSubject((current) => current || defaultSubject);
          setEmailHeaderTitle(
            resolveNewsletterEmailHeaderTitle({
              newsletterEmailHeaderTitle: settingsData.newsletterEmailHeaderTitle ?? "",
              siteName: resolvedName,
            })
          );
        }
      })
      .catch(() => toastNetworkError());
  }, [siteName]);

  useEffect(() => {
    load();
  }, [load]);

  const scheduleCampaign = async () => {
    if (!mailConfigured) {
      toast.error("Configure SMTP_HOST and SMTP_FROM before sending newsletters.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading(scheduledAt ? "Scheduling campaign…" : "Sending to subscribers…");
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
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        recipientCount?: number;
        failed?: number;
      };
      toast.dismiss(toastId);
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send campaign.");
        return;
      }
      if (data.failed && data.failed > 0) {
        toast.success(
          data.message ??
            `Sent to ${data.recipientCount ?? 0} subscriber(s). ${data.failed} delivery failure(s).`
        );
      } else {
        toast.success(data.message ?? "Campaign sent to subscribers.");
      }
      load();
    } catch {
      toast.dismiss(toastId);
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const exportSubscribers = () => {
    window.open("/api/admin/newsletter/export", "_blank");
    toast.success("Subscriber export started");
  };

  const importMailchimpCsv = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".zip")) {
      toast.error(
        'ZIP file detected. Unzip the Mailchimp export and import the "subscribed_members" CSV.'
      );
      return;
    }
    if (!name.endsWith(".csv") && file.type && file.type !== "text/csv" && file.type !== "application/vnd.ms-excel") {
      toast.error("Choose a .csv file exported from Mailchimp.");
      return;
    }

    setImporting(true);
    const toastId = toast.loading("Importing Mailchimp subscribers…");
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/newsletter/import", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        errors?: string[];
        added?: number;
        updated?: number;
        reactivated?: number;
        skipped?: number;
        invalid?: number;
      };
      toast.dismiss(toastId);

      if (!res.ok) {
        const detail = data.errors?.length
          ? `${data.error ?? "Import failed."} (${data.errors.slice(0, 2).join(" ")})`
          : (data.error ?? "Import failed.");
        toast.error(detail);
        return;
      }

      toast.success(
        data.message ??
          `Import complete: ${data.added ?? 0} added, ${data.updated ?? 0} updated.`
      );
      load();
    } catch {
      toast.dismiss(toastId);
      toastNetworkError();
    } finally {
      setImporting(false);
    }
  };

  const deleteCampaign = async (campaign: CampaignRow) => {
    if (!confirm(`Delete campaign "${campaign.title}"?`)) return;
    const res = await fetch(`/api/admin/newsletter/campaigns/${campaign._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Delete failed.");
      return;
    }
    toast.success("Campaign deleted");
    load();
  };

  const formatRate = (opens: number, clicks: number, sent: number) => {
    if (sent <= 0) return { opens: "—", clicks: "—" };
    const openPct = ((opens / sent) * 100).toFixed(1);
    const clickPct = ((clicks / sent) * 100).toFixed(1);
    return {
      opens: `${opens.toLocaleString("en-US")} (${openPct}%)`,
      clicks: `${clicks.toLocaleString("en-US")} (${clickPct}%)`,
    };
  };

  return (
    <CmsPage className="cms-newsletter-page">
      <div className="vhead">
        <div>
          <div className="vh1">Newsletter</div>
          <div className="vh2">
            {stats.totalActive.toLocaleString("en-US")} active subscribers · Open rate{" "}
            {stats.openRate}%
          </div>
        </div>
        <div className="vacts">
          <Link href="/admin/newsletter/subscribers" className="btn btn-out">
            View subscribers
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
            Export subscribers
          </button>
          <button type="button" className="btn btn-red" disabled={saving || !mailConfigured} onClick={() => void scheduleCampaign()}>
            {scheduledAt ? "+ Schedule campaign" : "+ Send now"}
          </button>
        </div>
      </div>

      {!mailConfigured && (
        <div className="card mb20">
          <div className="card-body cms-stack">
            <p className="cms-field-hint" style={{ margin: 0 }}>
              SMTP is not configured. Add <strong>SMTP_HOST</strong> and <strong>SMTP_FROM</strong> to your
              environment so campaigns are delivered automatically to subscribers.
            </p>
          </div>
        </div>
      )}

      <div className="card mb20">
        <div className="card-header">
          <span className="card-title">Import from Mailchimp</span>
        </div>
        <div className="card-body cms-stack">
          <p className="cms-field-hint" style={{ margin: 0 }}>
            In Mailchimp: <strong>Audience → Export audience → Export CSV</strong> (you receive a{" "}
            <strong>ZIP</strong>). Unzip it and upload the file named like{" "}
            <strong>subscribed_members_*.csv</strong> — not the whole ZIP, and not unsubscribed/cleaned
            files. Only <strong>subscribed</strong> contacts are imported.
          </p>
        </div>
      </div>

      <div className="kgrid mb20">
        <div className="kpi k-green">
          <div className="klbl">Total subscribers</div>
          <div className="kval">{stats.totalActive.toLocaleString("en-US")}</div>
          <div className="kmeta">
            <span className="kdelta up">▲ +{stats.monthlyNew}</span> this month
          </div>
        </div>
        <div className="kpi k-blue">
          <div className="klbl">Open rate</div>
          <div className="kval">{stats.openRate}%</div>
        </div>
        <div className="kpi k-amber">
          <div className="klbl">Click rate</div>
          <div className="kval">{stats.clickRate}%</div>
        </div>
        <div className="kpi k-red">
          <div className="klbl">Unsubscribes</div>
          <div className="kval">{stats.unsubscribes}</div>
        </div>
      </div>

      <div className="g21 ga">
        <div className="cms-newsletter-main">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent campaigns</span>
            </div>
            <div className="card-np">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Sent</th>
                    <th>Opens</th>
                    <th>Clicks</th>
                    <th>Status</th>
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
                          {row.recipientCount > 0 ? row.recipientCount.toLocaleString("en-US") : "—"}
                        </td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--green)" }}>
                          {rates.opens}
                        </td>
                        <td style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--blue)" }}>
                          {rates.clicks}
                        </td>
                        <td>
                          <span
                            className={`badge b-${
                              row.status === "sent"
                                ? "pub"
                                : row.status === "scheduled"
                                  ? "plan"
                                  : "arch"
                            }`}
                          >
                            {row.status === "sent"
                              ? "Sent"
                              : row.status === "scheduled"
                                ? "Scheduled"
                                : row.status === "sending"
                                  ? "Sending"
                                  : "Draft"}
                          </span>
                        </td>
                        <td className="tbl-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-icon"
                            title="Delete"
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
              <div className="nlph-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={siteLogo} alt="" className="nlprev-logo" />
                <div className="nlplogo">{emailHeaderTitle}</div>
              </div>
              <div className="nlph-meta">Live preview</div>
            </div>
            <div className="nlpbody">
              <div className="nlpsubj">{subject}</div>
              {isNewsletterBodyHtml(body) ? (
                <div
                  className="nlptxt cms-prose cms-newsletter-prose"
                  dangerouslySetInnerHTML={{ __html: sanitizeNewsletterBodyHtml(body) }}
                />
              ) : (
                <div className="nlptxt" style={{ whiteSpace: "pre-wrap" }}>
                  {body}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="cms-newsletter-side">
          <div className="card">
            <div className="card-header">
              <span className="card-title">List segmentation</span>
            </div>
            <div className="card-body cms-list-segment">
              {stats.lists.map((list) => (
                <div key={list.name} className="mm">
                  <div className="mml">
                    <div className="mmdot" style={{ background: list.color }} />
                    <span className="mmname">{list.label ?? list.name}</span>
                  </div>
                  <div className="mm-right">
                    <div className="mmv">{list.count.toLocaleString("en-US")}</div>
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
              <span className="card-title">Compose campaign</span>
            </div>
            <div className="card-body cms-stack">
              <div className="field">
                <label className="lbl" htmlFor="nl-subject">
                  Email subject
                </label>
                <input
                  id="nl-subject"
                  className="input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <p className="cms-field-hint">
                  Default subject configurable in{" "}
                  <Link href="/admin/seo">SEO settings → Newsletter &amp; contact</Link>.
                </p>
              </div>
              <div className="field">
                <label className="lbl" htmlFor="nl-body">
                  Message body
                </label>
                <CmsNewsletterBodyEditor value={body} onChange={setBody} />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="nl-list">
                  Target list
                </label>
                <select
                  id="nl-list"
                  className="input sel"
                  value={listTarget}
                  onChange={(e) => setListTarget(e.target.value)}
                >
                  <option value="all">
                    All subscribers ({stats.totalActive.toLocaleString("en-US")})
                  </option>
                  {stats.lists.map((list) => (
                    <option key={list.name} value={list.name}>
                      {list.label ?? list.name} ({list.count.toLocaleString("en-US")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="lbl" htmlFor="nl-schedule">
                  Send date (optional)
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
                disabled={saving || !mailConfigured}
                onClick={() => void scheduleCampaign()}
              >
                {saving
                  ? scheduledAt
                    ? "Scheduling…"
                    : "Sending…"
                  : scheduledAt
                    ? "Schedule send →"
                    : "Send to subscribers →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CmsPage>
  );
}
