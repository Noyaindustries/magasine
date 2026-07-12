import sanitizeHtml from "sanitize-html";
import { escapeHtml } from "@/lib/sanitize-html";
import { toAbsoluteSiteAssetUrl } from "@/lib/newsletter-email-branding";

const NEWSLETTER_BODY_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "blockquote",
  "img",
  "figure",
  "figcaption",
];

const NEWSLETTER_BODY_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  figure: [],
  figcaption: [],
};

const HTML_BODY_PATTERN =
  /<(p|h[1-6]|ul|ol|li|blockquote|figure|figcaption|img|br|strong|em|a)\b/i;

export function isNewsletterBodyHtml(body: string): boolean {
  return HTML_BODY_PATTERN.test(body.trim());
}

export function plainTextToNewsletterEditorHtml(text: string): string {
  if (!text.trim()) return "<p></p>";
  if (isNewsletterBodyHtml(text)) return text;

  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`
    )
    .join("");
}

export function sanitizeNewsletterBodyHtml(html: string): string {
  if (!html?.trim()) return "";

  try {
    return sanitizeHtml(html, {
      allowedTags: NEWSLETTER_BODY_TAGS,
      allowedAttributes: NEWSLETTER_BODY_ATTRIBUTES,
      allowedSchemes: ["http", "https", "mailto", "tel"],
      allowedSchemesByTag: {
        img: ["http", "https"],
        a: ["http", "https", "mailto", "tel"],
      },
      allowProtocolRelative: false,
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          rel: "noopener noreferrer",
          target: "_blank",
        }),
      },
    }).trim();
  } catch (error) {
    console.error("[newsletter-body-html] sanitize failed:", error);
    return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim();
  }
}

function resolveEmailAssetUrl(src: string): string {
  const trimmed = src.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return toAbsoluteSiteAssetUrl(trimmed);
}

function withInlineStyles(
  tagName: string,
  attribs: Record<string, string>
): { tagName: string; attribs: Record<string, string> } {
  const next = { ...attribs };

  switch (tagName) {
    case "p":
      next.style = "margin:0 0 16px;line-height:1.6;";
      break;
    case "h2":
      next.style = "margin:24px 0 12px;font-size:20px;line-height:1.3;font-weight:700;";
      break;
    case "h3":
      next.style = "margin:20px 0 10px;font-size:18px;line-height:1.35;font-weight:700;";
      break;
    case "blockquote":
      next.style =
        "margin:16px 0;padding:0 0 0 16px;border-left:3px solid #c41e3a;color:#444;";
      break;
    case "ul":
    case "ol":
      next.style = "margin:0 0 16px;padding-left:24px;line-height:1.6;";
      break;
    case "li":
      next.style = "margin:0 0 8px;";
      break;
    case "a":
      next.style = "color:#c41e3a;text-decoration:underline;";
      if (next.href) next.href = resolveEmailAssetUrl(next.href);
      break;
    case "img": {
      if (next.src) next.src = resolveEmailAssetUrl(next.src);
      next.style =
        "display:block;max-width:100%;width:100%;height:auto;margin:16px auto;border:0;";
      break;
    }
    case "figure":
      next.style = "margin:16px 0;text-align:center;";
      break;
    case "figcaption":
      next.style = "margin:8px 0 0;font-size:13px;line-height:1.4;color:#666;";
      break;
    default:
      break;
  }

  return { tagName, attribs: next };
}

export function newsletterBodyHtmlToEmailFragment(html: string): string {
  const sanitized = sanitizeNewsletterBodyHtml(html);
  if (!sanitized) return "";

  return sanitizeHtml(sanitized, {
    allowedTags: NEWSLETTER_BODY_TAGS,
    allowedAttributes: {
      ...NEWSLETTER_BODY_ATTRIBUTES,
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      blockquote: ["style"],
      ul: ["style"],
      ol: ["style"],
      li: ["style"],
      a: ["href", "title", "target", "rel", "style"],
      img: ["src", "alt", "width", "height", "style"],
      figure: ["style"],
      figcaption: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
      a: ["http", "https", "mailto", "tel"],
    },
    allowProtocolRelative: false,
    transformTags: {
      p: (_tag, attribs) => withInlineStyles("p", attribs),
      h2: (_tag, attribs) => withInlineStyles("h2", attribs),
      h3: (_tag, attribs) => withInlineStyles("h3", attribs),
      blockquote: (_tag, attribs) => withInlineStyles("blockquote", attribs),
      ul: (_tag, attribs) => withInlineStyles("ul", attribs),
      ol: (_tag, attribs) => withInlineStyles("ol", attribs),
      li: (_tag, attribs) => withInlineStyles("li", attribs),
      a: (_tag, attribs) => withInlineStyles("a", attribs),
      img: (_tag, attribs) => withInlineStyles("img", attribs),
      figure: (_tag, attribs) => withInlineStyles("figure", attribs),
      figcaption: (_tag, attribs) => withInlineStyles("figcaption", attribs),
    },
  }).trim();
}

export function newsletterBodyToPlainText(body: string): string {
  if (!body.trim()) return "";
  if (!isNewsletterBodyHtml(body)) return body;

  const stripped = sanitizeHtml(body, {
    allowedTags: ["br", "p", "li", "h2", "h3", "blockquote", "figcaption"],
    allowedAttributes: {},
  })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[23]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/blockquote>/gi, "\n\n")
    .replace(/<\/figcaption>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return stripped.replace(/\n{3,}/g, "\n\n").trim();
}
