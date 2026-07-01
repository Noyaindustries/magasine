import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
  "span",
  "div",
  "iframe",
] as const;

const ALLOWED_ATTR = [
  "href",
  "title",
  "target",
  "rel",
  "src",
  "alt",
  "width",
  "height",
  "class",
  "colspan",
  "rowspan",
  "allow",
  "allowfullscreen",
  "frameborder",
  "referrerpolicy",
] as const;

const SAFE_URL_PATTERN =
  /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
  if (data.attrName === "href" || data.attrName === "src") {
    const value = data.attrValue?.trim() ?? "";
    if (/^\s*javascript:/i.test(value) || /^\s*data:/i.test(value)) {
      data.keepAttr = false;
    }
  }

  if (node.tagName === "IFRAME" && data.attrName === "src") {
    const src = data.attrValue?.trim() ?? "";
    const allowed =
      /^https:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/i.test(src) ||
      /^https:\/\/player\.vimeo\.com\/video\/\d+/i.test(src);
    if (!allowed) {
      data.keepAttr = false;
    }
  }
});

/**
 * Sanitise le HTML riche des articles (contenu CMS / TipTap).
 * Bloque scripts, handlers inline et iframes non whitelistées.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html?.trim()) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: ["script", "style", "object", "embed", "form", "input", "base"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "style"],
  })
    .replace(/<a\s/gi, '<a rel="noopener noreferrer" ')
    .trim();
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
