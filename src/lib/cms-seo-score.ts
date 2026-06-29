export interface SeoCheck {
  id: string;
  text: string;
  level: "ok" | "warn" | "error";
}

export function computeSeoScore(input: {
  title: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
  featuredImage: string;
  featuredImageAlt?: string;
}) {
  const checks: SeoCheck[] = [];
  let score = 0;

  const seoTitle = input.seoTitle.trim() || input.title.trim();
  const hasH2 = /<h2[\s>]/i.test(input.content);

  if (input.title.trim().length >= 12) {
    score += 18;
    checks.push({ id: "keyword", text: "Keyword in title", level: "ok" });
  } else {
    checks.push({ id: "keyword", text: "Title too short", level: "warn" });
  }

  if (input.featuredImage.trim()) {
    score += 15;
    checks.push({
      id: "image",
      text: input.featuredImageAlt?.trim() ? "Images with alt text" : "Cover image",
      level: input.featuredImageAlt?.trim() ? "ok" : "warn",
    });
  } else {
    checks.push({ id: "image", text: "Missing cover image", level: "error" });
  }

  const internalLinks = (input.content.match(/href="\/article\//g) ?? []).length;
  if (internalLinks >= 1) {
    score += 12;
    checks.push({ id: "links", text: `Internal links (${internalLinks})`, level: "ok" });
  } else {
    checks.push({ id: "links", text: "No internal links", level: "warn" });
  }

  if (seoTitle.length >= 50 && seoTitle.length <= 60) {
    score += 20;
    checks.push({ id: "seo-title", text: "SEO title optimal", level: "ok" });
  } else if (seoTitle.length > 60) {
    score += 8;
    checks.push({ id: "seo-title", text: "SEO title too long", level: "warn" });
  } else {
    score += 10;
    checks.push({ id: "seo-title", text: "SEO title short", level: "warn" });
  }

  const descLen = input.seoDescription.trim().length;
  if (descLen >= 120 && descLen <= 155) {
    score += 20;
    checks.push({ id: "meta", text: "Meta description OK", level: "ok" });
  } else if (descLen > 0) {
    score += 10;
    checks.push({ id: "meta", text: "Meta description needs tuning", level: "warn" });
  } else {
    checks.push({ id: "meta", text: "Meta description missing", level: "error" });
  }

  if (hasH2) {
    score += 15;
    checks.push({ id: "h2", text: "H2 subheadings present", level: "ok" });
  } else {
    checks.push({ id: "h2", text: "No H2 subheadings", level: "error" });
  }

  return { score: Math.min(100, score), checks };
}
