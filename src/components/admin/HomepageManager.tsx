"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Newspaper,
  Sparkles,
  Megaphone,
  Star,
  Radio,
  Play,
  Lightbulb,
  Rows3,
  BarChart3,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import type { HomepageSectionStatus } from "@/lib/homepage-admin";
import type { PublicSiteSettings, TrustPartner } from "@/lib/site-settings";
import type { HomeSectionId } from "@/lib/homepage-sections";
import { toast } from "@/lib/toast";

interface HomepageManagerProps {
  initialSettings: PublicSiteSettings;
  initialSections: HomepageSectionStatus[];
  alertCount: number;
}

type HpgTab = "sections" | "masthead" | "trust" | "closing";

const SECTION_ICONS: Record<HomeSectionId, ComponentType<{ className?: string }>> = {
  intro: Newspaper,
  urgent: Megaphone,
  hero: Sparkles,
  megaAd: LayoutGrid,
  editorial: Star,
  live: Radio,
  media: Play,
  insights: Lightbulb,
  rubriques: Rows3,
  closing: BarChart3,
};

const NAV_ITEMS: { id: HpgTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "sections", label: "Layout", icon: LayoutGrid },
  { id: "masthead", label: "Masthead & pulse", icon: Newspaper },
  { id: "trust", label: "Trust strip", icon: Star },
  { id: "closing", label: "Closing band", icon: BarChart3 },
];

const emptyPartner = (): TrustPartner => ({
  name: "",
  logo: "/images/partners/",
  width: 120,
  height: 28,
  url: "",
  isActive: true,
});

function HpgToggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <label className="hpg-switch" title={label} aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="hpg-switch-track" aria-hidden />
    </label>
  );
}

export function HomepageManager({
  initialSettings,
  initialSections,
  alertCount,
}: HomepageManagerProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<HpgTab>("sections");

  const liveCount = useMemo(
    () => sections.filter((s) => settings.homeSections[s.id]).length,
    [sections, settings.homeSections]
  );

  const slottedArticles = useMemo(
    () => sections.reduce((n, s) => n + s.articles.length, 0),
    [sections]
  );

  const save = async (patch: Partial<PublicSiteSettings>) => {
    setSaving(true);
    const toastId = toast.loading("Enregistrement des modifications…");
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.dismiss(toastId);
        toast.error(data.error ?? "Échec de l'enregistrement");
        return;
      }
      setSettings(data);
      if (patch.homeSections) {
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            enabled: data.homeSections[s.id as HomeSectionId],
          }))
        );
      }
      toast.dismiss(toastId);
      toast.success("Page d'accueil mise à jour");
    } catch {
      toast.dismiss(toastId);
      toast.error("Erreur réseau — réessayez.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id: HomeSectionId, enabled: boolean) => {
    const homeSections = { ...settings.homeSections, [id]: enabled };
    void save({ homeSections });
  };

  const updatePulse = (index: number, field: "value" | "label", value: string) => {
    const pulseStats = settings.pulseStats.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setSettings({ ...settings, pulseStats });
  };

  const updateClosing = (
    index: number,
    field: "num" | "suffix" | "label",
    value: string
  ) => {
    const closingStats = settings.closingStats.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setSettings({ ...settings, closingStats });
  };

  const updatePartner = (
    index: number,
    field: keyof TrustPartner,
    value: string | number | boolean
  ) => {
    const trustPartners = settings.trustPartners.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    setSettings({ ...settings, trustPartners });
  };

  const addPartner = () => {
    setSettings({ ...settings, trustPartners: [...settings.trustPartners, emptyPartner()] });
  };

  const removePartner = (index: number) => {
    setSettings({
      ...settings,
      trustPartners: settings.trustPartners.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="hpg-root">
      {/* Hero */}
      <div className="hpg-hero">
        <div className="hpg-hero-mesh" aria-hidden />
        <div className="hpg-hero-inner">
          <div>
            <p className="hpg-hero-eyebrow">
              <span className="hpg-hero-eyebrow-dot" aria-hidden />
              Homepage composer
            </p>
            <h2 className="hpg-hero-title">
              Shape your <em>front page</em>
            </h2>
            <p className="hpg-hero-desc">
              Toggle sections, edit masthead copy, manage trust partners, and configure the closing
              newsletter band — all in one place.
            </p>
            <div className="hpg-hero-actions" style={{ marginTop: 18 }}>
              <Link href="/" target="_blank" rel="noopener noreferrer" className="hpg-btn-preview">
                <ExternalLink className="w-4 h-4" />
                Preview live site
              </Link>
            </div>
          </div>
          <div className="hpg-hero-metrics">
            <div className="hpg-hero-metric">
              <strong>{liveCount}</strong>
              <span>Sections live</span>
            </div>
            <div className="hpg-hero-metric">
              <strong>{slottedArticles}</strong>
              <span>Articles slotted</span>
            </div>
            <div className="hpg-hero-metric">
              <strong>{alertCount}</strong>
              <span>Active alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout: nav + panel */}
      <div className="hpg-layout">
        <nav className="hpg-nav" aria-label="Homepage settings">
          <p className="hpg-nav-label">Configure</p>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`hpg-nav-btn${activeTab === id ? " hpg-nav-btn--active" : ""}`}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <span className="hpg-nav-btn-icon">
                <Icon className="w-4 h-4" />
              </span>
              {label}
            </button>
          ))}
        </nav>

        <div className="hpg-panel">
          {/* —— Sections —— */}
          {activeTab === "sections" && (
            <div className="hpg-panel-card">
              <div className="hpg-panel-head">
                <div>
                  <h3 className="hpg-panel-title">Homepage layout</h3>
                  <p className="hpg-panel-desc">
                    Enable or disable each block on the public homepage. Article slots fill
                    automatically from editorial flags and categories.
                  </p>
                </div>
              </div>

              <div className="hpg-sections-grid">
                {sections.map((section) => {
                  const isLive = settings.homeSections[section.id];
                  const Icon = SECTION_ICONS[section.id];

                  return (
                    <article
                      key={section.id}
                      className={`hpg-section-card${isLive ? " hpg-section-card--live" : ""}`}
                    >
                      <div className="hpg-section-card-top">
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                          <span className="hpg-section-icon">
                            <Icon className="w-4 h-4" />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <h4 className="hpg-section-name">{section.label}</h4>
                            <p className="hpg-section-desc">{section.description}</p>
                          </div>
                        </div>
                        <HpgToggle
                          label={`Toggle ${section.label}`}
                          checked={isLive}
                          disabled={saving}
                          onChange={(v) => toggleSection(section.id, v)}
                        />
                      </div>

                      <div className="hpg-section-meta">
                        <span className={`hpg-section-badge${isLive ? " hpg-section-badge--live" : " hpg-section-badge--off"}`}>
                          {isLive ? "Live" : "Hidden"}
                        </span>
                        {section.count > 0 && (
                          <span className="hpg-section-badge hpg-section-badge--count">
                            {section.count} item{section.count !== 1 ? "s" : ""}
                          </span>
                        )}
                        {section.articleFlag && (
                          <code className="hpg-section-flag">{section.articleFlag}</code>
                        )}
                      </div>

                      {section.articles.length > 0 ? (
                        <ul className="hpg-slots">
                          {section.articles.slice(0, 4).map((a) => (
                            <li key={a._id} className="hpg-slot">
                              {a.category && <span className="hpg-slot-cat">{a.category}</span>}
                              <span className="hpg-slot-title">{a.title}</span>
                              <Link href={`/admin/articles/${a._id}`} className="admin-action-link">
                                Edit
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : section.id !== "intro" && section.id !== "megaAd" && section.id !== "closing" ? (
                        <p className="hpg-slot-empty">No articles in this slot yet.</p>
                      ) : null}

                      <div className="hpg-section-actions">
                        {section.articlesHref && (
                          <Link href={section.articlesHref} className="admin-btn admin-btn--sm admin-btn--secondary">
                            Manage content
                          </Link>
                        )}
                        {section.id === "urgent" && (
                          <Link href="/admin/alerts" className="admin-btn admin-btn--sm admin-btn--secondary">
                            Alerts ({alertCount})
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* —— Masthead —— */}
          {activeTab === "masthead" && (
            <div className="hpg-panel-card">
              <div className="hpg-panel-head">
                <div>
                  <h3 className="hpg-panel-title">Masthead & pulse stats</h3>
                  <p className="hpg-panel-desc">
                    Edition header copy and live pulse counters shown in the intro band.
                  </p>
                </div>
              </div>

              <div className="hpg-form-grid">
                <div className="hpg-form-grid-2">
                  <div className="hpg-field">
                    <label>Edition badge</label>
                    <input
                      value={settings.mastheadBadge}
                      onChange={(e) => setSettings({ ...settings, mastheadBadge: e.target.value })}
                      placeholder="Today's Edition"
                    />
                  </div>
                  <div className="hpg-field">
                    <label>Edition volume</label>
                    <input
                      value={settings.mastheadVolume}
                      onChange={(e) => setSettings({ ...settings, mastheadVolume: e.target.value })}
                      placeholder="Vol. XII · N° 1847"
                    />
                  </div>
                </div>
                <div className="hpg-field">
                  <label>Tagline</label>
                  <textarea
                    rows={2}
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  />
                </div>
                <div className="hpg-field">
                  <label>Bureau cities</label>
                  <input
                    value={settings.mastheadCities}
                    onChange={(e) => setSettings({ ...settings, mastheadCities: e.target.value })}
                    placeholder="Abidjan · Dakar · Nairobi"
                  />
                </div>

                {settings.pulseStats.map((stat, i) => (
                  <div key={i} className="hpg-pulse-row">
                    <span className="hpg-pulse-index">Pulse stat {i + 1}</span>
                    <div className="hpg-field">
                      <label>Value</label>
                      <input
                        value={stat.value}
                        onChange={(e) => updatePulse(i, "value", e.target.value)}
                        placeholder="54"
                      />
                    </div>
                    <div className="hpg-field">
                      <label>Label</label>
                      <input
                        value={stat.label}
                        onChange={(e) => updatePulse(i, "label", e.target.value)}
                        placeholder="countries"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hpg-save-bar">
                <p className="hpg-save-hint">Changes apply to the intro section when enabled.</p>
                <button
                  type="button"
                  className="hpg-btn-gold"
                  disabled={saving}
                  onClick={() =>
                    save({
                      mastheadBadge: settings.mastheadBadge,
                      tagline: settings.tagline,
                      mastheadVolume: settings.mastheadVolume,
                      mastheadCities: settings.mastheadCities,
                      pulseStats: settings.pulseStats,
                    })
                  }
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save masthead & pulse
                </button>
              </div>
            </div>
          )}

          {/* —— Trust strip —— */}
          {activeTab === "trust" && (
            <div className="hpg-panel-card">
              <div className="hpg-panel-head">
                <div>
                  <h3 className="hpg-panel-title">Trust strip — As seen in</h3>
                  <p className="hpg-panel-desc">
                    Partner logos in the scrolling strip below the masthead.
                  </p>
                </div>
                <HpgToggle
                  label="Show trust strip"
                  checked={settings.trustStripEnabled}
                  onChange={(v) => setSettings({ ...settings, trustStripEnabled: v })}
                />
              </div>

              <div className="hpg-field" style={{ marginBottom: 20 }}>
                <label>Strip label</label>
                <input
                  value={settings.trustStripLabel}
                  onChange={(e) => setSettings({ ...settings, trustStripLabel: e.target.value })}
                  placeholder="As seen in"
                />
              </div>

              <div className="hpg-partners">
                {settings.trustPartners.map((partner, i) => (
                  <div
                    key={i}
                    className={`hpg-partner-card${partner.isActive ? " hpg-partner-card--active" : ""}`}
                  >
                    <div className="hpg-partner-head">
                      <HpgToggle
                        label={`Partner ${partner.name || i + 1} active`}
                        checked={partner.isActive}
                        onChange={(v) => updatePartner(i, "isActive", v)}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--charcoal)" }}>
                        {partner.name || `Partner ${i + 1}`}
                      </span>
                      <button
                        type="button"
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        style={{ marginLeft: "auto" }}
                        onClick={() => removePartner(i)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="hpg-form-grid-2">
                      <div className="hpg-field">
                        <label>Name</label>
                        <input
                          value={partner.name}
                          onChange={(e) => updatePartner(i, "name", e.target.value)}
                          placeholder="RFI"
                        />
                      </div>
                      <div className="hpg-field">
                        <label>Logo URL</label>
                        <input
                          value={partner.logo}
                          onChange={(e) => updatePartner(i, "logo", e.target.value)}
                          placeholder="/images/partners/rfi.svg"
                        />
                      </div>
                      <div className="hpg-field">
                        <label>Width (px)</label>
                        <input
                          type="number"
                          min={1}
                          value={partner.width}
                          onChange={(e) => updatePartner(i, "width", Number(e.target.value))}
                        />
                      </div>
                      <div className="hpg-field">
                        <label>Height (px)</label>
                        <input
                          type="number"
                          min={1}
                          value={partner.height}
                          onChange={(e) => updatePartner(i, "height", Number(e.target.value))}
                        />
                      </div>
                      <div className="hpg-field" style={{ gridColumn: "1 / -1" }}>
                        <label>Link URL (optional)</label>
                        <input
                          value={partner.url ?? ""}
                          onChange={(e) => updatePartner(i, "url", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    {partner.logo && (
                      <div className="hpg-partner-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={partner.logo}
                          alt={partner.name || "Preview"}
                          width={partner.width}
                          height={partner.height}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="hpg-save-bar">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={addPartner}>
                  <Plus className="w-4 h-4" />
                  Add partner
                </button>
                <button
                  type="button"
                  className="hpg-btn-gold"
                  disabled={saving}
                  onClick={() =>
                    save({
                      trustStripLabel: settings.trustStripLabel,
                      trustStripEnabled: settings.trustStripEnabled,
                      trustPartners: settings.trustPartners.map((p) => ({
                        ...p,
                        url: p.url?.trim() || undefined,
                      })),
                    })
                  }
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save trust strip
                </button>
              </div>
            </div>
          )}

          {/* —— Closing —— */}
          {activeTab === "closing" && (
            <div className="hpg-panel-card">
              <div className="hpg-panel-head">
                <div>
                  <h3 className="hpg-panel-title">Closing band</h3>
                  <p className="hpg-panel-desc">
                    Impact statistics and newsletter signup copy at the bottom of the homepage.
                  </p>
                </div>
              </div>

              <div className="hpg-form-grid">
                {settings.closingStats.map((stat, i) => (
                  <div key={i} className="hpg-form-grid-3">
                    <div className="hpg-field">
                      <label>Stat {i + 1} — number</label>
                      <input
                        value={stat.num}
                        onChange={(e) => updateClosing(i, "num", e.target.value)}
                      />
                    </div>
                    <div className="hpg-field">
                      <label>Suffix</label>
                      <input
                        value={stat.suffix}
                        onChange={(e) => updateClosing(i, "suffix", e.target.value)}
                      />
                    </div>
                    <div className="hpg-field">
                      <label>Label</label>
                      <input
                        value={stat.label}
                        onChange={(e) => updateClosing(i, "label", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="hpg-field">
                  <label>Newsletter title</label>
                  <input
                    value={settings.newsletterTitle}
                    onChange={(e) => setSettings({ ...settings, newsletterTitle: e.target.value })}
                  />
                </div>
                <div className="hpg-field">
                  <label>Newsletter emphasis line</label>
                  <input
                    value={settings.newsletterTitleEm}
                    onChange={(e) => setSettings({ ...settings, newsletterTitleEm: e.target.value })}
                  />
                </div>
                <div className="hpg-field">
                  <label>Newsletter description</label>
                  <textarea
                    rows={3}
                    value={settings.newsletterDescription}
                    onChange={(e) =>
                      setSettings({ ...settings, newsletterDescription: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="hpg-save-bar">
                <p className="hpg-save-hint">Displayed in the closing section when enabled.</p>
                <button
                  type="button"
                  className="hpg-btn-gold"
                  disabled={saving}
                  onClick={() =>
                    save({
                      closingStats: settings.closingStats,
                      newsletterTitle: settings.newsletterTitle,
                      newsletterTitleEm: settings.newsletterTitleEm,
                      newsletterDescription: settings.newsletterDescription,
                    })
                  }
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save closing band
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
