import slugify from "slugify";
import { SEED_ARTICLES } from "@/lib/seed-data";

/** Slugs canoniques des articles de démonstration (seed). */
export function getSeedArticleSlugs(): string[] {
  return SEED_ARTICLES.map(
    (article) => article.slug ?? slugify(article.title, { lower: true, strict: true })
  );
}

/** Filtre MongoDB : articles de démo (flag ou slug seed connu). */
export function getDemoArticleFilter(): Record<string, unknown> {
  return {
    $or: [{ isDemo: true }, { slug: { $in: getSeedArticleSlugs() } }],
  };
}
