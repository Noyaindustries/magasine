export const ARTICLE_IMAGE_LAYOUTS = ["block", "float-left", "float-right"] as const;

export type ArticleImageLayout = (typeof ARTICLE_IMAGE_LAYOUTS)[number];

export const ARTICLE_IMAGE_LAYOUT_CLASSES = [
  "art-img-block",
  "art-img-float-left",
  "art-img-float-right",
] as const;

export function isArticleImageLayout(value: string | undefined | null): value is ArticleImageLayout {
  return value === "block" || value === "float-left" || value === "float-right";
}

export function articleImageLayoutToClass(layout: ArticleImageLayout): string {
  if (layout === "float-left") return "art-img-float-left";
  if (layout === "float-right") return "art-img-float-right";
  return "art-img-block";
}

export function articleImageClassToLayout(className: string | undefined | null): ArticleImageLayout {
  if (className?.includes("art-img-float-left")) return "float-left";
  if (className?.includes("art-img-float-right")) return "float-right";
  return "block";
}

export const ARTICLE_IMAGE_LAYOUT_LABELS: Record<ArticleImageLayout, string> = {
  block: "Pleine largeur",
  "float-left": "Gauche",
  "float-right": "Droite",
};
