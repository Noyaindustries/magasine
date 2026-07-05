import sanitizeHtml from "sanitize-html";

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
  img: ["src", "alt", "width", "height"],
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
      allowedSchemes: ["http", "https", "mailto", "tel"],
      allowedSchemesByTag: {
        img: ["http", "https"],
      },
      allowProtocolRelative: false,
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          rel: "noopener noreferrer",
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
