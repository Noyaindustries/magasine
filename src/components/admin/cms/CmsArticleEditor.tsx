"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { CmsPage } from "@/components/admin/cms/CmsPage";

const CmsRichTextEditor = dynamic(
  () =>
    import("@/components/admin/cms/CmsRichTextEditor").then((module) => module.CmsRichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="cms-editor-wrap">
        <div className="etb" />
        <div className="ebody cms-editor-loading">Loading editor…</div>
      </div>
    ),
  }
);
import { CmsToggle } from "@/components/admin/cms/CmsToggle";
import { CmsHintIcon, CmsStatusIcon, ImageIcon, Star, Trash2 } from "@/components/admin/cms/CmsIcons";
import { computeSeoScore } from "@/lib/cms-seo-score";
import { toast } from "@/lib/toast";
import { estimateReadingTime } from "@/lib/utils";
import { getSiteHostname } from "@/lib/site";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { CmsArticleGalleryEditor, type GalleryFormItem } from "@/components/admin/cms/CmsArticleGalleryEditor";
import {
  ARTICLE_CONTENT_TYPES,
  type ArticleContentType,
  isValidVideoSourceUrl,
} from "@/lib/article-content-types";
import { getVideoThumbnailUrl } from "@/lib/video-url";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";

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
  regionCategoryIds: string[];
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
  gallery: GalleryFormItem[];
  contentType: ArticleContentType;
  videoUrl: string;
}

const EMPTY_FORM: ArticleEditorForm = {
  title: "",
  subtitle: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  featuredImageCaption: "",
  categoryId: "",
  regionCategoryIds: [],
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
  gallery: [],
  contentType: "article",
  videoUrl: "",
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
  if (mode === "draft") return "Draft";
  if (mode === "review") return "In review";
  if (mode === "schedule") return "Scheduled";
  return "Published";
}

function formatAutoSave(seconds: number) {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} sec ago`;
  return `${Math.floor(seconds / 60)} min ago`;
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
  defaultContentType?: ArticleContentType;
}

export function CmsArticleEditor({
  mode,
  articleId,
  defaultContentType = "article",
}: CmsArticleEditorProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [form, setForm] = useState<ArticleEditorForm>({
    ...EMPTY_FORM,
    contentType: defaultContentType,
  });
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autoSaveAgeSec, setAutoSaveAgeSec] = useState(0);
  const [pushNotify, setPushNotify] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const patchForm = useCallback((patch: Partial<ArticleEditorForm>) => {
    dirtyRef.current = true;
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const topicCategories = useMemo(
    () => categories.filter((category) => !isRegionCategorySlug(category.slug)),
    [categories]
  );
  const regionCategories = useMemo(
    () => categories.filter((category) => isRegionCategorySlug(category.slug)),
    [categories]
  );
  const selectedCategory = categories.find((category) => category._id === form.categoryId);

  const toggleRegionCategory = useCallback(
    (categoryId: string) => {
      patchForm({
        regionCategoryIds: form.regionCategoryIds.includes(categoryId)
          ? form.regionCategoryIds.filter((id) => id !== categoryId)
          : [...form.regionCategoryIds, categoryId],
      });
    },
    [form.regionCategoryIds, patchForm]
  );

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

  const handleQuickCreateCategory = useCallback(async () => {
    const name = window.prompt("Nom de la nouvelle catégorie ?")?.trim();
    if (!name) return;
    const toastId = toast.loading("Création de la catégorie…");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(toastId);
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Échec de la création");
        return;
      }
      const created: Category = {
        _id: String(data._id),
        name,
        slug: String(data.slug ?? ""),
      };
      setCategories((prev) => {
        if (prev.some((category) => category._id === created._id)) {
          return prev;
        }
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      patchForm({ categoryId: created._id });
      toast.success(
        (data as { reused?: boolean }).reused
          ? "Catégorie existante sélectionnée"
          : "Catégorie créée"
      );
    } catch {
      toast.dismiss(toastId);
      toast.error("Échec de la création");
    }
  }, [patchForm]);

  const handleQuickCreateAuthor = useCallback(async () => {
    const name = window.prompt("Nom du nouvel auteur ?")?.trim();
    if (!name) return;
    const toastId = toast.loading("Création de l'auteur…");
    try {
      const res = await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      toast.dismiss(toastId);
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? "Échec de la création");
        return;
      }
      const created: Author = { _id: String(data._id), name };
      setAuthors((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      patchForm({ authorId: created._id });
      toast.success("Auteur créé");
    } catch {
      toast.dismiss(toastId);
      toast.error("Échec de la création");
    }
  }, [patchForm]);

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
          regionCategoryIds: article.regionCategoryIds ?? [],
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
          gallery: (article.gallery ?? []).map(
            (item: { url?: string; caption?: string; credit?: string }) => ({
              url: item.url ?? "",
              caption: item.caption ?? "",
              credit: item.credit ?? "",
            })
          ),
          contentType: article.contentType ?? "article",
          videoUrl: article.videoUrl ?? "",
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
      ? "Not saved"
      : `Auto-saved ${formatAutoSave(autoSaveAgeSec)}`;

  const buildPayload = useCallback(
    (publishModeOverride?: PublishMode) => {
      const publishMode = publishModeOverride ?? form.publishMode;
      const excerpt = form.excerpt.trim() || form.subtitle.trim() || form.title.trim();
      return {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        excerpt,
        content: form.content,
        featuredImage:
          form.featuredImage.trim() ||
          (form.contentType === "video"
            ? getVideoThumbnailUrl(form.videoUrl) ?? ""
            : ""),
        featuredImageCaption: form.featuredImageCaption.trim() || undefined,
        categoryId: form.categoryId,
        regionCategoryIds: form.regionCategoryIds,
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
        gallery: form.gallery
          .filter((item) => item.url.trim())
          .map((item) => ({
            url: item.url.trim(),
            caption: item.caption.trim() || undefined,
            credit: item.credit.trim() || undefined,
          })),
        contentType: form.contentType,
        videoUrl: form.videoUrl.trim() || undefined,
      };
    },
    [form, pushNotify]
  );

  const saveArticle = useCallback(
    async (options?: { redirectAfter?: boolean; publishMode?: PublishMode; silent?: boolean }) => {
      if (!form.title.trim() || !form.categoryId || !form.authorId) {
        if (!options?.silent) {
          toast.error("Title, category, and author are required.");
        }
        return false;
      }

      const publishing =
        (options?.publishMode ?? form.publishMode) === "publish" ||
        (options?.publishMode ?? form.publishMode) === "schedule";

      if (form.contentType === "video" && publishing) {
        if (!form.videoUrl.trim() || !isValidVideoSourceUrl(form.videoUrl)) {
          if (!options?.silent) {
            toast.error("Add a YouTube/Vimeo link or upload an MP4 for this video.");
          }
          return false;
        }
        // La couverture est facultative : miniature YouTube auto ou image par défaut côté serveur.
      }

      setLoading(true);
      const toastId = options?.silent ? null : toast.loading("Saving article…");
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
            toast.error((err as { error?: string }).error ?? "Failed to save");
          }
          return false;
        }
        const data = await res.json();
        if (options?.publishMode) {
          patchForm({ publishMode: options.publishMode });
        }
        setLastSavedAt(Date.now());
        dirtyRef.current = false;
        // Invalide le cache routeur client de Next pour que la liste /admin/articles
        // affiche immédiatement l'article créé/modifié (sinon version en cache = périmée).
        if (!options?.silent) router.refresh();
        if (toastId) toast.dismiss(toastId);
        if (!options?.silent) {
          if (options?.publishMode === "publish") {
            toast.success("Article published");
          } else {
            toast.success("Article saved");
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
      const { url } = await uploadAdminMedia(file, form.title || file.name);
      patchForm({ featuredImage: url });
      toast.success("Image saved locally.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadVideo = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Only video files are allowed (MP4 recommended).");
      return;
    }
    setUploadingVideo(true);
    try {
      const { url } = await uploadAdminMedia(file, form.title || file.name);
      patchForm({ videoUrl: url, contentType: "video" });
      toast.success("Video uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingVideo(false);
    }
  };

  const editorTitle =
    form.contentType === "video"
      ? "Video editor"
      : form.contentType === "podcast"
        ? "Podcast editor"
        : form.contentType === "gallery"
          ? "Gallery editor"
          : "Article editor";

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
    if (!articleId || !confirm("Permanently delete this article?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Article deleted");
        router.push("/admin/articles");
        router.refresh();
      } else {
        toast.error("Delete failed");
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
          <div className="vh1">{editorTitle}</div>
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
              Preview
            </Link>
          )}
          <button
            type="button"
            className="btn btn-out"
            disabled={loading}
            onClick={() => void saveArticle()}
          >
            Save draft
          </button>
          <button
            type="button"
            className="btn btn-red"
            disabled={loading}
            onClick={() => void saveArticle({ publishMode: "publish", redirectAfter: true })}
          >
            Publish now →
          </button>
        </div>
      </div>

      <div className="g21 ga">
        <div className="cms-editor-main">
          <div className="field">
            <label className="lbl">
              Article title <span className="req">*</span>
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
              placeholder="Catchy headline…"
              required
            />
          </div>

          <div className="field">
            <label className="lbl">Lede / Subtitle</label>
            <input
              className="input"
              type="text"
              value={form.subtitle}
              onChange={(e) => patchForm({ subtitle: e.target.value, excerpt: e.target.value })}
              placeholder="Engaging summary…"
            />
          </div>

          <div className="field">
            <label className="lbl">
              Article body <span className="req">*</span>
            </label>
            <CmsRichTextEditor
              value={form.content}
              onChange={(content) => patchForm({ content })}
            />
            <div className="cms-editor-meta-row">
              <span>
                {words} word{words > 1 ? "s" : ""} ·{" "}
                <span className="cms-editor-meta-strong">
                  Estimated reading time: {readingTime} min
                </span>
              </span>
              {mode === "edit" && (
                <span>Version history ({form.version}) →</span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">SEO optimization</span>
              <div className={`seo-orb ${orbClass}`}>{seo.score}</div>
            </div>
            <div className="card-body cms-seo-body">
              <div className="field">
                <label className="lbl">SEO title</label>
                <input
                  className="input"
                  type="text"
                  value={form.seoTitle}
                  onChange={(e) => patchForm({ seoTitle: e.target.value })}
                  placeholder={form.title || "Title for search engines"}
                />
                <div className="cms-field-hint">
                  <span>50–60 characters recommended</span>
                  <span className={seoTitleLen > 60 ? "cms-warn" : "cms-ok"}>
                    {seoTitleLen} / 60 <CmsHintIcon ok={seoTitleLen <= 60} />
                  </span>
                </div>
              </div>
              <div className="field">
                <label className="lbl">Meta description</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.seoDescription}
                  onChange={(e) => patchForm({ seoDescription: e.target.value })}
                  placeholder="Summary for Google and social networks"
                />
                <div className="cms-field-hint">
                  <span>Max 155 characters</span>
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
                <label className="lbl">Status</label>
                <select
                  className="input sel"
                  value={form.publishMode}
                  onChange={(e) =>
                    patchForm({ publishMode: e.target.value as PublishMode })
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="review">In review</option>
                  <option value="publish">Publish immediately</option>
                  <option value="schedule">Schedule</option>
                </select>
              </div>
              <div className="field">
                <label className="lbl">Publish date</label>
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
                  Publish now →
                </button>
                <button
                  type="button"
                  className="btn btn-out"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={loading}
                  onClick={() => void saveArticle()}
                >
                  Save draft
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
                    Delete article
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
                  aria-label="Rubrique"
                  value={form.categoryId}
                  onChange={(e) => patchForm({ categoryId: e.target.value })}
                  required
                >
                  <option value="">Choisir…</option>
                  {selectedCategory && isRegionCategorySlug(selectedCategory.slug) && (
                    <option value={selectedCategory._id}>
                      {selectedCategory.name} (région — choisir une rubrique)
                    </option>
                  )}
                  {topicCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="cms-quick-add"
                  onClick={handleQuickCreateCategory}
                >
                  + Nouvelle catégorie
                </button>
              </div>
              <div className="field">
                <label className="lbl">Région / pays couverts</label>
                <p className="cms-field-hint">
                  L&apos;article apparaîtra aussi sur les pages régionales (Afrique, Amérique latine, etc.).
                </p>
                <div className="cms-region-grid">
                  {regionCategories.map((region) => {
                    const checked = form.regionCategoryIds.includes(region._id);
                    return (
                      <label key={region._id} className="cms-region-option">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRegionCategory(region._id)}
                        />
                        <span>{region.name}</span>
                      </label>
                    );
                  })}
                </div>
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
                      title="Remove"
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
                <label className="lbl">Author(s)</label>
                <select
                  className="input sel"
                  aria-label="Author"
                  value={form.authorId}
                  onChange={(e) => patchForm({ authorId: e.target.value })}
                  required
                >
                  <option value="">Choose…</option>
                  {authors.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="cms-quick-add"
                  onClick={handleQuickCreateAuthor}
                >
                  + Nouvel auteur
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Content format</span>
            </div>
            <div className="card-body cms-stack">
              <div className="field">
                <label className="lbl" htmlFor="cms-content-type">
                  Type
                </label>
                <select
                  id="cms-content-type"
                  className="input sel"
                  value={form.contentType}
                  onChange={(e) =>
                    patchForm({ contentType: e.target.value as ArticleContentType })
                  }
                >
                  {ARTICLE_CONTENT_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <p className="cms-field-hint">
                  Choose <strong>Video</strong> to publish on the <Link href="/videos">/videos</Link>{" "}
                  page and the home video section.
                </p>
              </div>

              {form.contentType === "video" && (
                <>
                  <div className="field">
                    <label className="lbl" htmlFor="cms-video-url">
                      Video URL <span className="req">*</span>
                    </label>
                    <input
                      id="cms-video-url"
                      className="input"
                      type="url"
                      value={form.videoUrl}
                      onChange={(e) => patchForm({ videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=… or MP4 URL"
                    />
                    <p className="cms-field-hint">
                      YouTube, YouTube Shorts, Vimeo, or a direct MP4 link (upload below).
                    </p>
                  </div>
                  <div className="field">
                    <label className="lbl">Upload MP4</label>
                    <button
                      type="button"
                      className="btn btn-out"
                      disabled={uploadingVideo}
                      onClick={() => videoFileRef.current?.click()}
                    >
                      {uploadingVideo ? "Uploading…" : "Upload video file (max 15 MB)"}
                    </button>
                    <input
                      ref={videoFileRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void uploadVideo(file);
                      }}
                    />
                    {form.videoUrl && (
                      <p className="cms-branding-path">
                        <code>{form.videoUrl}</code>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Featured image</span>
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
                    <div>{uploadingCover ? "Uploading…" : "Click to upload"}</div>
                    <div className="cms-cover-hint">
                      JPG · PNG · WebP — max 15 MB
                      {form.contentType === "video"
                        ? " · optional (YouTube thumbnail auto-detected)"
                        : ""}
                    </div>
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
              {form.featuredImage && (
                <p className="cms-branding-path">
                  <code>{form.featuredImage}</code>
                </p>
              )}
              <div className="field">
                <label className="lbl">Caption</label>
                <input
                  className="input"
                  type="text"
                  value={form.featuredImageCaption}
                  onChange={(e) => patchForm({ featuredImageCaption: e.target.value })}
                  placeholder="Image caption…"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Article images</span>
            </div>
            <div className="card-body">
              <p className="cms-field-hint cms-gallery-intro">
                Additional images shown in the article detail page (caption and credit optional).
              </p>
              <CmsArticleGalleryEditor
                items={form.gallery}
                onChange={(gallery) => patchForm({ gallery })}
                uploadTitle={form.title}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Article options</span>
            </div>
            <div className="card-body cms-stack">
              <CmsToggle
                on={form.commentsEnabled}
                onChange={(commentsEnabled) => patchForm({ commentsEnabled })}
                label="Comments enabled"
              />
              <CmsToggle
                on={form.socialShare}
                onChange={(socialShare) => patchForm({ socialShare })}
                label="Social sharing"
              />
              <CmsToggle
                on={form.isPremium}
                onChange={(isPremium) => patchForm({ isPremium })}
                label={
                  <>
                    Premium article <Star size={13} className="cms-icon cms-icon--premium" aria-hidden />
                  </>
                }
              />
              <CmsToggle
                on={form.isFeatured}
                onChange={(isFeatured) => patchForm({ isFeatured })}
                label="Homepage feature"
              />
              <CmsToggle
                on={pushNotify}
                onChange={setPushNotify}
                label="Push notification"
              />
            </div>
          </div>
        </div>
      </div>
    </CmsPage>
  );
}
