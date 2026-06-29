"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsRichTextEditor } from "@/components/admin/cms/CmsRichTextEditor";
import { CmsToggle } from "@/components/admin/cms/CmsToggle";
import { CmsHintIcon, CmsStatusIcon, ImageIcon, Star, Trash2 } from "@/components/admin/cms/CmsIcons";
import { computeSeoScore } from "@/lib/cms-seo-score";
import { toast } from "@/lib/toast";
import { estimateReadingTime } from "@/lib/utils";
import { getSiteHostname } from "@/lib/site";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Author {
  _id: string;
  name: string;
}

type PublishMode = "draft" | "review" | "publish" | "schedule";

interface ArticleEditorForm {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageCaption: string;
  categoryId: string;
  authorId: string;
  tags: string[];
  publishMode: PublishMode;
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  isPremium: boolean;
  isFeatured: boolean;
  commentsEnabled: boolean;
  socialShare: boolean;
  version: number;
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop";

const EMPTY_FORM: ArticleEditorForm = {
  title: "",
  subtitle: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  featuredImageCaption: "",
  categoryId: "",
  authorId: "",
  tags: [],
  publishMode: "draft",
  scheduledAt: "",
  seoTitle: "",
  seoDescription: "",
  slug: "",
  isPremium: false,
  isFeatured: false,
  commentsEnabled: true,
  socialShare: true,
  version: 1,
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(html: string) {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function statusLabel(mode: PublishMode) {
  if (mode === "draft") return "Brouillon";
  if (mode === "review") return "En révision";
  if (mode === "schedule") return "Planifié";
  return "Publié";
}

function formatAutoSave(seconds: number) {
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds} sec`;
  return `il y a ${Math.floor(seconds / 60)} min`;
}

function mapStatusToPublishMode(status: string): PublishMode {
  if (status === "published") return "publish";
  if (status === "review") return "review";
  if (status === "scheduled") return "schedule";
  return "draft";
}

function publishModeToStatus(mode: PublishMode) {
  if (mode === "publish") return "published";
  if (mode === "schedule") return "scheduled";
  if (mode === "review") return "review";
  return "draft";
}

interface CmsArticleEditorProps {
  mode: "create" | "edit";
  articleId?: string;
}

export function CmsArticleEditor({ mode, articleId }: CmsArticleEditorProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [form, setForm] = useState<ArticleEditorForm>(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autoSaveAgeSec, setAutoSaveAgeSec] = useState(0);
  const [pushNotify, setPushNotify] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const patchForm = useCallback((patch: Partial<ArticleEditorForm>) => {
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (lastSavedAt === null) return;
    const updateAge = () => {
      setAutoSaveAgeSec(Math.max(0, Math.floor((Date.now() - lastSavedAt) / 1000)));
    };
    const boot = window.setTimeout(updateAge, 0);
    const interval = window.setInterval(updateAge, 5000);
    return () => {
      window.clearTimeout(boot);
      window.clearInterval(interval);
    };
  }, [lastSavedAt]);

  useEffect(() => {
    fetch("/api/admin/meta")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setAuthors(data.authors ?? []);
      });
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !articleId) return;
    fetch(`/api/admin/articles/${articleId}`)
      .then((r) => r.json())
      .then((article) => {
        if (!article._id) return;
        setPreviewSlug(article.slug ?? null);
        setForm({
          title: article.title ?? "",
          subtitle: article.subtitle ?? "",
          excerpt: article.excerpt ?? "",
          content: article.content ?? "",
          featuredImage: article.featuredImage ?? "",
          featuredImageCaption: article.featuredImageCaption ?? "",
          categoryId: article.categoryId ?? "",
          authorId: article.authorId ?? "",
          tags: article.tags ?? [],
          publishMode: mapStatusToPublishMode(article.status ?? "draft"),
          scheduledAt: article.scheduledAt
            ? new Date(article.scheduledAt).toISOString().slice(0, 16)
            : "",
          seoTitle: article.seoTitle ?? "",
          seoDescription: article.seoDescription ?? "",
          slug: article.slug ?? "",
          isPremium: article.isPremium ?? false,
          isFeatured: article.isFeatured ?? false,
          commentsEnabled: !(article.commentsDisabled ?? false),
          socialShare: article.allowSocialShare ?? true,
          version: article.version ?? 1,
        });
        setPushNotify(article.sendPushOnPublish ?? false);
        setSlugTouched(true);
        setLastSavedAt(Date.now());
        dirtyRef.current = false;
      });
  }, [mode, articleId]);

  const categorySlug =
    categories.find((c) => c._id === form.categoryId)?.slug ?? "actualites";

  const words = wordCount(form.content);
  const readingTime = estimateReadingTime(form.content);
  const seo = useMemo(
    () =>
      computeSeoScore({
        title: form.title,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        content: form.content,
        featuredImage: form.featuredImage,
        featuredImageAlt: form.featuredImageCaption,
      }),
    [form]
  );

  const seoTitleLen = (form.seoTitle.trim() || form.title.trim()).length;
  const seoDescLen = form.seoDescription.trim().length;

  const autoSaveLabel =
    lastSavedAt === null
      ? "Non enregistré"
      : `Sauvegarde auto ${formatAutoSave(autoSaveAgeSec)}`;

  const buildPayload = useCallback(
    (publishModeOverride?: PublishMode) => {
      const publishMode = publishModeOverride ?? form.publishMode;
      const excerpt = form.excerpt.trim() || form.subtitle.trim() || form.title.trim();
      return {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        excerpt,
        content: form.content,
        featuredImage: form.featuredImage.trim() || DEFAULT_IMAGE,
        featuredImageCaption: form.featuredImageCaption.trim() || undefined,
        categoryId: form.categoryId,
        authorId: form.authorId,
        tags: form.tags,
        status: publishModeToStatus(publishMode),
        scheduledAt:
          publishMode === "schedule" && form.scheduledAt ? form.scheduledAt : undefined,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        slug: form.slug.trim() || undefined,
        isPremium: form.isPremium,
        isFeatured: form.isFeatured,
        isTopStory: form.isFeatured,
        commentsDisabled: !form.commentsEnabled,
        allowSocialShare: form.socialShare,
        sendPushOnPublish: pushNotify,
      };
    },
    [form, pushNotify]
  );

  const saveArticle = useCallback(
    async (options?: { redirectAfter?: boolean; publishMode?: PublishMode; silent?: boolean }) => {
      if (!form.title.trim() || !form.categoryId || !form.authorId) {
        if (!options?.silent) {
          toast.error("Titre, rubrique et auteur sont requis.");
        }
        return false;
      }

      setLoading(true);
      const toastId = options?.silent ? null : toast.loading("Enregistrement de l'article…");
      try {
        const payload = buildPayload(options?.publishMode);
        const url =
          mode === "edit" && articleId ? `/api/admin/articles/${articleId}` : "/api/admin/articles";
        const method = mode === "edit" ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (toastId) toast.dismiss(toastId);
          if (!options?.silent) {
            toast.error((err as { error?: string }).error ?? "Échec de l'enregistrement");
          }
          return false;
        }
        const data = await res.json();
        if (options?.publishMode) {
          patchForm({ publishMode: options.publishMode });
        }
        setLastSavedAt(Date.now());
        dirtyRef.current = false;
        if (toastId) toast.dismiss(toastId);
        if (!options?.silent) {
          if (options?.publishMode === "publish") {
            toast.success("Article publié");
          } else {
            toast.success("Article enregistré");
          }
        }
        if (mode === "create" && data._id) {
          router.replace(`/admin/articles/${data._id}`);
          return true;
        }
        if (data.slug) setPreviewSlug(data.slug);
        if (options?.redirectAfter) router.push("/admin/articles");
        return true;
      } finally {
        setLoading(false);
      }
    },
    [articleId, buildPayload, form.authorId, form.categoryId, form.title, mode, patchForm, router]
  );

  useEffect(() => {
    if (mode !== "edit" || !articleId) return;
    if (!form.title.trim() || !dirtyRef.current) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      if (!dirtyRef.current) return;
      void saveArticle({ silent: true });
    }, 8000);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [form, mode, articleId, saveArticle]);

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", form.title || file.name);
      const res = await fetch("/api/admin/medias", { method: "POST", body: fd });
      if (!res.ok) return;
      const data = await res.json();
      patchForm({ featuredImage: data.url });
    } finally {
      setUploadingCover(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    patchForm({ tags: [...form.tags, tag] });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    patchForm({ tags: form.tags.filter((t) => t !== tag) });
  };

  const handleDelete = async () => {
    if (!articleId || !confirm("Supprimer définitivement cet article ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Article supprimé");
        router.push("/admin/articles");
      } else {
        toast.error("Suppression impossible");
      }
    } finally {
      setDeleting(false);
    }
  };

  const orbClass =
    seo.score >= 75 ? "orb-ok" : seo.score >= 50 ? "orb-warn" : "orb-low";

  return (
    <CmsPage className="cms-editor-page">
      <div className="vhead">
        <div>
          <div className="vh1">Éditeur d&apos;article</div>
          <div className="vh2">
            {statusLabel(form.publishMode)} · {autoSaveLabel}
          </div>
        </div>
        <div className="vacts">
          {previewSlug && (
            <Link
              href={`/article/${previewSlug}`}
              target="_blank"
              className="btn btn-ghost"
            >
              Prévisualiser
            </Link>
          )}
          <button
            type="button"
            className="btn btn-out"
            disabled={loading}
            onClick={() => void saveArticle()}
          >
            Enregistrer brouillon
          </button>
          <button
            type="button"
            className="btn btn-red"
            disabled={loading}
            onClick={() => void saveArticle({ publishMode: "publish", redirectAfter: true })}
          >
            Publier maintenant →
          </button>
        </div>
      </div>

      <div className="g21 ga">
        <div className="cms-editor-main">
          <div className="field">
            <label className="lbl">
              Titre de l&apos;article <span className="req">*</span>
            </label>
            <input
              className="input lg"
              type="text"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                patchForm({
                  title,
                  ...(slugTouched
                    ? {}
                    : { slug: slugify(title, { lower: true, strict: true }) }),
                });
              }}
              placeholder="Titre accrocheur…"
              required
            />
          </div>

          <div className="field">
            <label className="lbl">Chapô / Sous-titre</label>
            <input
              className="input"
              type="text"
              value={form.subtitle}
              onChange={(e) => patchForm({ subtitle: e.target.value, excerpt: e.target.value })}
              placeholder="Résumé accrocheur…"
            />
          </div>

          <div className="field">
            <label className="lbl">
              Corps de l&apos;article <span className="req">*</span>
            </label>
            <CmsRichTextEditor
              value={form.content}
              onChange={(content) => patchForm({ content })}
            />
            <div className="cms-editor-meta-row">
              <span>
                {words} mot{words > 1 ? "s" : ""} ·{" "}
                <span className="cms-editor-meta-strong">
                  Lecture estimée : {readingTime} min
                </span>
              </span>
              {mode === "edit" && (
                <span>Historique des versions ({form.version}) →</span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Optimisation SEO</span>
              <div className={`seo-orb ${orbClass}`}>{seo.score}</div>
            </div>
            <div className="card-body cms-seo-body">
              <div className="field">
                <label className="lbl">Titre SEO</label>
                <input
                  className="input"
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => patchForm({ seoTitle: e.target.value })}
                  placeholder={form.title || "Titre pour les moteurs de recherche"}
                />
                <div className="cms-field-hint">
                  <span>50–60 caractères recommandés</span>
                  <span className={seoTitleLen > 60 ? "cms-warn" : "cms-ok"}>
                    {seoTitleLen} / 60 <CmsHintIcon ok={seoTitleLen <= 60} />
                  </span>
                </div>
              </div>
              <div className="field">
                <label className="lbl">Méta-description</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.seoDescription}
                  onChange={(e) => patchForm({ seoDescription: e.target.value })}
                  placeholder="Résumé pour Google et les réseaux sociaux"
                />
                <div className="cms-field-hint">
                  <span>Max 155 caractères</span>
                  <span className={seoDescLen > 155 ? "cms-warn" : "cms-ok"}>
                    {seoDescLen} <CmsHintIcon ok={seoDescLen <= 155} />
                  </span>
                </div>
              </div>
              <div className="field">
                <label className="lbl">Slug URL</label>
                <div className="cms-slug-row">
                  <span className="cms-slug-prefix">{getSiteHostname()}/{categorySlug}/</span>
                  <input
                    className="input"
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      patchForm({ slug: e.target.value });
                    }}
                    placeholder="slug-de-l-article"
                  />
                </div>
              </div>
              <div className="seochips">
                {seo.checks.map((check) => (
                  <span
                    key={check.id}
                    className={`seoc seo-${check.level === "ok" ? "ok" : check.level === "warn" ? "w" : "e"}`}
                  >
                    <CmsStatusIcon
                      level={check.level === "ok" ? "ok" : check.level === "warn" ? "warn" : "error"}
                    />{" "}
                    {check.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cms-editor-side">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Publication</span>
            </div>
            <div className="card-body cms-stack">
              <div className="field">
                <label className="lbl">Statut</label>
                <select
                  className="input sel"
                  value={form.publishMode}
                  onChange={(e) =>
                    patchForm({ publishMode: e.target.value as PublishMode })
                  }
                >
                  <option value="draft">Brouillon</option>
                  <option value="review">En révision</option>
                  <option value="publish">Publier immédiatement</option>
                  <option value="schedule">Planifier</option>
                </select>
              </div>
              <div className="field">
                <label className="lbl">Date de publication</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => patchForm({ scheduledAt: e.target.value })}
                  disabled={form.publishMode !== "schedule"}
                />
              </div>
              <div className="cms-publish-actions">
                <button
                  type="button"
                  className="btn btn-red"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={loading}
                  onClick={() =>
                    void saveArticle({ publishMode: "publish", redirectAfter: true })
                  }
                >
                  Publier maintenant →
                </button>
                <button
                  type="button"
                  className="btn btn-out"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={loading}
                  onClick={() => void saveArticle()}
                >
                  Enregistrer brouillon
                </button>
                {mode === "edit" && (
                  <button
                    type="button"
                    className="btn btn-ghost cms-delete-btn"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={deleting}
                    onClick={() => void handleDelete()}
                  >
                    <Trash2 size={14} className="cms-icon cms-icon--error" aria-hidden />
                    Supprimer l&apos;article
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Classification</span>
            </div>
            <div className="card-body cms-stack">
              <div className="field">
                <label className="lbl">
                  Rubrique <span className="req">*</span>
                </label>
                <select
                  className="input sel"
                  value={form.categoryId}
                  onChange={(e) => patchForm({ categoryId: e.target.value })}
                  required
                >
                  <option value="">Choisir…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="lbl">Tags</label>
                <div className="cms-tags-box">
                  {form.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="cms-tag"
                      onClick={() => removeTag(tag)}
                      title="Retirer"
                    >
                      {tag}
                    </button>
                  ))}
                  <input
                    type="text"
                    className="cms-tag-input"
                    placeholder="+ Tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    onBlur={addTag}
                  />
                </div>
              </div>
              <div className="field">
                <label className="lbl">Auteur(s)</label>
                <select
                  className="input sel"
                  value={form.authorId}
                  onChange={(e) => patchForm({ authorId: e.target.value })}
                  required
                >
                  <option value="">Choisir…</option>
                  {authors.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Image à la une</span>
            </div>
            <div className="card-body">
              <label className="cms-cover-drop">
                {form.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.featuredImage} alt="" className="cms-cover-preview" />
                ) : (
                  <>
                    <div className="cms-cover-icon">
                      <ImageIcon size={32} aria-hidden />
                    </div>
                    <div>{uploadingCover ? "Téléversement…" : "Cliquer pour téléverser"}</div>
                    <div className="cms-cover-hint">JPG · PNG · WebP — max 15 Mo</div>
                  </>
                )}
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="cms-cover-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadCover(file);
                  }}
                />
              </label>
              <div className="field">
                <label className="lbl">URL de l&apos;image (optionnel)</label>
                <input
                  className="input"
                  type="url"
                  value={form.featuredImage}
                  onChange={(e) => patchForm({ featuredImage: e.target.value })}
                  placeholder="https://…"
                />
              </div>
              <div className="field">
                <label className="lbl">Légende</label>
                <input
                  className="input"
                  type="text"
                  value={form.featuredImageCaption}
                  onChange={(e) => patchForm({ featuredImageCaption: e.target.value })}
                  placeholder="Légende de l'image…"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Options article</span>
            </div>
            <div className="card-body cms-stack">
              <CmsToggle
                on={form.commentsEnabled}
                onChange={(commentsEnabled) => patchForm({ commentsEnabled })}
                label="Commentaires activés"
              />
              <CmsToggle
                on={form.socialShare}
                onChange={(socialShare) => patchForm({ socialShare })}
                label="Partage social"
              />
              <CmsToggle
                on={form.isPremium}
                onChange={(isPremium) => patchForm({ isPremium })}
                label={
                  <>
                    Article Premium <Star size={13} className="cms-icon cms-icon--premium" aria-hidden />
                  </>
                }
              />
              <CmsToggle
                on={form.isFeatured}
                onChange={(isFeatured) => patchForm({ isFeatured })}
                label="Mise en avant accueil"
              />
              <CmsToggle
                on={pushNotify}
                onChange={setPushNotify}
                label="Notification push"
              />
            </div>
          </div>
        </div>
      </div>
    </CmsPage>
  );
}
