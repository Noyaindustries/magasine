"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import {
  ABOUT_PILLAR_ICONS,
  type AboutPageContent,
  type AboutPillarIcon,
} from "@/lib/about-page-content";

const PILLAR_ICON_LABELS: Record<AboutPillarIcon, string> = {
  "book-open": "Book",
  users: "Users",
  scale: "Scale",
  radio: "Radio",
};

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="lbl" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function CmsAboutPageView() {
  const [form, setForm] = useState<AboutPageContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/about")
      .then(async (response) => {
        if (!response.ok) {
          toast.error("Unable to load About page content.");
          return;
        }
        const data = (await response.json()) as AboutPageContent;
        setForm(data);
      })
      .catch(() => toastNetworkError());
  }, []);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.ok) {
        toast.success("About page saved.");
      } else {
        toast.error("Failed to save About page.");
      }
    } catch {
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const updateParagraph = (index: number, value: string) => {
    if (!form) return;
    const whoWeAreParagraphs = [...form.whoWeAreParagraphs];
    whoWeAreParagraphs[index] = value;
    setForm({ ...form, whoWeAreParagraphs });
  };

  if (!form) {
    return (
      <CmsPage>
        <p className="cms-empty">Loading About page…</p>
      </CmsPage>
    );
  }

  return (
    <CmsPage className="cms-about-page">
      <div className="vhead">
        <div>
          <div className="vh1">About page</div>
          <div className="vh2">Edit the public /about page content</div>
        </div>
        <div className="vacts">
          <Link href="/about" target="_blank" className="btn btn-out">
            Preview →
          </Link>
          <button type="button" className="btn btn-red" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save →"}
          </button>
        </div>
      </div>

      <div className="cms-stack">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Hero &amp; SEO</span>
          </div>
          <div className="card-body cms-stack">
            <Field label="Meta description" id="about-meta">
              <textarea
                id="about-meta"
                className="input"
                rows={2}
                value={form.metaDescription}
                onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              />
            </Field>
            <Field label="Eyebrow" id="about-eyebrow">
              <input
                id="about-eyebrow"
                className="input"
                value={form.eyebrow}
                onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
              />
            </Field>
            <div className="g2">
              <Field label="Title (main)" id="about-title-main">
                <input
                  id="about-title-main"
                  className="input"
                  value={form.titleMain}
                  onChange={(e) => setForm({ ...form, titleMain: e.target.value })}
                />
              </Field>
              <Field label="Title (emphasis)" id="about-title-em">
                <input
                  id="about-title-em"
                  className="input"
                  value={form.titleEm}
                  onChange={(e) => setForm({ ...form, titleEm: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Lead paragraph" id="about-lead">
              <textarea
                id="about-lead"
                className="input"
                rows={3}
                value={form.lead}
                onChange={(e) => setForm({ ...form, lead: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Who we are</span>
          </div>
          <div className="card-body cms-stack">
            <Field label="Section title" id="about-who-title">
              <input
                id="about-who-title"
                className="input"
                value={form.whoWeAreTitle}
                onChange={(e) => setForm({ ...form, whoWeAreTitle: e.target.value })}
              />
            </Field>
            {form.whoWeAreParagraphs.map((paragraph, index) => (
              <Field key={`who-p-${index}`} label={`Paragraph ${index + 1}`} id={`about-who-p-${index}`}>
                <textarea
                  id={`about-who-p-${index}`}
                  className="input"
                  rows={4}
                  value={paragraph}
                  onChange={(e) => updateParagraph(index, e.target.value)}
                />
              </Field>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setForm({ ...form, whoWeAreParagraphs: [...form.whoWeAreParagraphs, ""] })
              }
            >
              + Add paragraph
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">At a glance</span>
          </div>
          <div className="card-body cms-stack">
            <Field label="Section title" id="about-glance-title">
              <input
                id="about-glance-title"
                className="input"
                value={form.glanceTitle}
                onChange={(e) => setForm({ ...form, glanceTitle: e.target.value })}
              />
            </Field>
            {form.glanceItems.map((item, index) => (
              <div key={`glance-${index}`} className="g2">
                <Field label="Label" id={`about-glance-label-${index}`}>
                  <input
                    id={`about-glance-label-${index}`}
                    className="input"
                    value={item.label}
                    onChange={(e) => {
                      const glanceItems = [...form.glanceItems];
                      glanceItems[index] = { ...item, label: e.target.value };
                      setForm({ ...form, glanceItems });
                    }}
                  />
                </Field>
                <Field label="Value" id={`about-glance-value-${index}`}>
                  <input
                    id={`about-glance-value-${index}`}
                    className="input"
                    value={item.value}
                    onChange={(e) => {
                      const glanceItems = [...form.glanceItems];
                      glanceItems[index] = { ...item, value: e.target.value };
                      setForm({ ...form, glanceItems });
                    }}
                  />
                </Field>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setForm({
                  ...form,
                  glanceItems: [...form.glanceItems, { label: "", value: "" }],
                })
              }
            >
              + Add item
            </button>
            <Field label="Coverage regions (comma-separated)" id="about-coverage">
              <input
                id="about-coverage"
                className="input"
                value={form.coverageRegions.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    coverageRegions: e.target.value
                      .split(",")
                      .map((region) => region.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Mission</span>
          </div>
          <div className="card-body cms-stack">
            <Field label="Subtitle" id="about-mission-sub">
              <input
                id="about-mission-sub"
                className="input"
                value={form.missionSubtitle}
                onChange={(e) => setForm({ ...form, missionSubtitle: e.target.value })}
              />
            </Field>
            <Field label="Title" id="about-mission-title">
              <input
                id="about-mission-title"
                className="input"
                value={form.missionTitle}
                onChange={(e) => setForm({ ...form, missionTitle: e.target.value })}
              />
            </Field>
            <Field label="Lead" id="about-mission-lead">
              <textarea
                id="about-mission-lead"
                className="input"
                rows={3}
                value={form.missionLead}
                onChange={(e) => setForm({ ...form, missionLead: e.target.value })}
              />
            </Field>
            <Field label="Supporting paragraph" id="about-mission-p">
              <textarea
                id="about-mission-p"
                className="input"
                rows={3}
                value={form.missionParagraph}
                onChange={(e) => setForm({ ...form, missionParagraph: e.target.value })}
              />
            </Field>
            {form.missionPillars.map((pillar, index) => (
              <div key={`pillar-${index}`} className="cms-stack" style={{ paddingTop: 8, borderTop: "1px solid var(--cms-border, #e8e4dc)" }}>
                <Field label={`Pillar ${index + 1} — icon`} id={`about-pillar-icon-${index}`}>
                  <select
                    id={`about-pillar-icon-${index}`}
                    className="input"
                    value={pillar.icon}
                    onChange={(e) => {
                      const missionPillars = [...form.missionPillars];
                      missionPillars[index] = {
                        ...pillar,
                        icon: e.target.value as AboutPillarIcon,
                      };
                      setForm({ ...form, missionPillars });
                    }}
                  >
                    {ABOUT_PILLAR_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {PILLAR_ICON_LABELS[icon]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Title" id={`about-pillar-title-${index}`}>
                  <input
                    id={`about-pillar-title-${index}`}
                    className="input"
                    value={pillar.title}
                    onChange={(e) => {
                      const missionPillars = [...form.missionPillars];
                      missionPillars[index] = { ...pillar, title: e.target.value };
                      setForm({ ...form, missionPillars });
                    }}
                  />
                </Field>
                <Field label="Text" id={`about-pillar-text-${index}`}>
                  <textarea
                    id={`about-pillar-text-${index}`}
                    className="input"
                    rows={2}
                    value={pillar.text}
                    onChange={(e) => {
                      const missionPillars = [...form.missionPillars];
                      missionPillars[index] = { ...pillar, text: e.target.value };
                      setForm({ ...form, missionPillars });
                    }}
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <div className="g21 ga">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Values</span>
            </div>
            <div className="card-body cms-stack">
              <Field label="Section title" id="about-values-title">
                <input
                  id="about-values-title"
                  className="input"
                  value={form.valuesTitle}
                  onChange={(e) => setForm({ ...form, valuesTitle: e.target.value })}
                />
              </Field>
              {form.values.map((value, index) => (
                <div key={`value-${index}`} className="cms-stack">
                  <Field label="Label" id={`about-value-label-${index}`}>
                    <input
                      id={`about-value-label-${index}`}
                      className="input"
                      value={value.label}
                      onChange={(e) => {
                        const values = [...form.values];
                        values[index] = { ...value, label: e.target.value };
                        setForm({ ...form, values });
                      }}
                    />
                  </Field>
                  <Field label="Description" id={`about-value-text-${index}`}>
                    <textarea
                      id={`about-value-text-${index}`}
                      className="input"
                      rows={2}
                      value={value.text}
                      onChange={(e) => {
                        const values = [...form.values];
                        values[index] = { ...value, text: e.target.value };
                        setForm({ ...form, values });
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">How we work</span>
            </div>
            <div className="card-body cms-stack">
              <Field label="Section title" id="about-work-title">
                <input
                  id="about-work-title"
                  className="input"
                  value={form.howWeWorkTitle}
                  onChange={(e) => setForm({ ...form, howWeWorkTitle: e.target.value })}
                />
              </Field>
              <Field label="Introduction" id="about-work-intro">
                <textarea
                  id="about-work-intro"
                  className="input"
                  rows={3}
                  value={form.howWeWorkIntro}
                  onChange={(e) => setForm({ ...form, howWeWorkIntro: e.target.value })}
                />
              </Field>
              {form.howWeWorkItems.map((item, index) => (
                <Field key={`work-${index}`} label={`Item ${index + 1}`} id={`about-work-item-${index}`}>
                  <input
                    id={`about-work-item-${index}`}
                    className="input"
                    value={item}
                    onChange={(e) => {
                      const howWeWorkItems = [...form.howWeWorkItems];
                      howWeWorkItems[index] = e.target.value;
                      setForm({ ...form, howWeWorkItems });
                    }}
                  />
                </Field>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Key figures</span>
          </div>
          <div className="card-body cms-stack">
            <div className="g2">
              <Field label="Section title" id="about-stats-title">
                <input
                  id="about-stats-title"
                  className="input"
                  value={form.statsTitle}
                  onChange={(e) => setForm({ ...form, statsTitle: e.target.value })}
                />
              </Field>
              <Field label="Subtitle" id="about-stats-sub">
                <input
                  id="about-stats-sub"
                  className="input"
                  value={form.statsSubtitle}
                  onChange={(e) => setForm({ ...form, statsSubtitle: e.target.value })}
                />
              </Field>
            </div>
            {form.stats.map((stat, index) => (
              <div key={`stat-${index}`} className="g2">
                <Field label="Number" id={`about-stat-num-${index}`}>
                  <input
                    id={`about-stat-num-${index}`}
                    className="input"
                    value={stat.num}
                    onChange={(e) => {
                      const stats = [...form.stats];
                      stats[index] = { ...stat, num: e.target.value };
                      setForm({ ...form, stats });
                    }}
                  />
                </Field>
                <Field label="Label" id={`about-stat-label-${index}`}>
                  <input
                    id={`about-stat-label-${index}`}
                    className="input"
                    value={stat.label}
                    onChange={(e) => {
                      const stats = [...form.stats];
                      stats[index] = { ...stat, label: e.target.value };
                      setForm({ ...form, stats });
                    }}
                  />
                </Field>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setForm({ ...form, stats: [...form.stats, { num: "", label: "" }] })}
            >
              + Add stat
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Call-to-action bands</span>
          </div>
          <div className="card-body cms-stack">
            <Field label="Team CTA text" id="about-cta-team">
              <textarea
                id="about-cta-team"
                className="input"
                rows={2}
                value={form.ctaTeamText}
                onChange={(e) => setForm({ ...form, ctaTeamText: e.target.value })}
              />
            </Field>
            <Field label="Donate CTA text" id="about-cta-donate">
              <textarea
                id="about-cta-donate"
                className="input"
                rows={2}
                value={form.ctaDonateText}
                onChange={(e) => setForm({ ...form, ctaDonateText: e.target.value })}
              />
            </Field>
            <Field label="Newsletter CTA text" id="about-cta-newsletter">
              <textarea
                id="about-cta-newsletter"
                className="input"
                rows={2}
                value={form.ctaNewsletterText}
                onChange={(e) => setForm({ ...form, ctaNewsletterText: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </div>
    </CmsPage>
  );
}
