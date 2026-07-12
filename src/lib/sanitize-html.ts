import sanitizeHtml from "sanitize-html";
import {
  ARTICLE_IMAGE_LAYOUT_CLASSES,
  articleImageClassToLayout,
  articleImageLayoutToClass,
  isArticleImageLayout,
} from "@/lib/article-image-layout";

const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  "img",
  "figure",
  "figcaption",
  "h1",
  "h2",
  "iframe",
]);

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "class", "data-image-layout"],
  figure: ["class", "data-image-layout"],
  figcaption: [],
  iframe: [
    "src",
    "width",
    "height",
    "allow",
    "allowfullscreen",
    "frameborder",
    "referrerpolicy",
    "title",
  ],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

const SAFE_URL_PATTERN =
  /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

function isAllowedIframeSrc(src: string): boolean {
  const trimmed = src.trim();
  return (
    /^https:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/i.test(trimmed) ||
    /^https:\/\/player\.vimeo\.com\/video\/\d+/i.test(trimmed)
  );
}

function normalizeImageLayoutTag(
  _tagName: "img" | "figure",
  attribs: Record<string, string>
): Record<string, string> {
  const next = { ...attribs };
  const fromData = next["data-image-layout"];
  const layout = isArticleImageLayout(fromData)
    ? fromData
    : articleImageClassToLayout(next.class);

  next["data-image-layout"] = layout;
  next.class = articleImageLayoutToClass(layout);
  return next;
}

/**
 * Sanitise le HTML riche des articles (contenu CMS / TipTap).
 * Utilise sanitize-html (compatible serverless, sans jsdom).
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html?.trim()) return "";

  try {
    return sanitizeHtml(html, {
      allowedTags: ALLOWED_TAGS,
      allowedAttributes: ALLOWED_ATTRIBUTES,
      allowedClasses: {
        img: [...ARTICLE_IMAGE_LAYOUT_CLASSES],
        figure: [...ARTICLE_IMAGE_LAYOUT_CLASSES],
      },
      allowedSchemes: ["http", "https", "mailto", "tel"],
      allowedSchemesByTag: {
        img: ["http", "https"],
      },
      allowProtocolRelative: false,
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          rel: "noopener noreferrer",
        }),
        img: (_tagName, attribs) => ({
          tagName: "img",
          attribs: normalizeImageLayoutTag("img", attribs),
        }),
        figure: (_tagName, attribs) => ({
          tagName: "figure",
          attribs: normalizeImageLayoutTag("figure", attribs),
        }),
      },
      exclusiveFilter(frame) {
        if (frame.tag === "iframe") {
          const src = frame.attribs.src?.trim() ?? "";
          return !isAllowedIframeSrc(src);
        }
        return false;
      },
    }).trim();
  } catch (error) {
    console.error("[sanitize-html] failed:", error);
    return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim();
  }
}

/**
 * Échappe une chaîne pour affichage texte (évite XSS dans attributs / HTML simple).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export { SAFE_URL_PATTERN };
