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

export type DemoContentStatus = {
  /** Articles de test déjà en base (supprimables dans l'admin). */
  inDatabase: number;
  /** Articles de test visibles sur le site public mais pas encore en base. */
  virtualOnSite: number;
  /** Nombre total d'articles dans le pack de démonstration. */
  seedTotal: number;
};

/** État du contenu de démo : en base vs affiché uniquement sur le site (mock). */
export async function getDemoContentStatus(): Promise<DemoContentStatus> {
  const { connectDB } = await import("@/lib/mongodb");
  const { Article } = await import("@/models/Article");

  await connectDB();

  const seedSlugs = getSeedArticleSlugs();
  const inDbSlugs = new Set(
    (await Article.find(getDemoArticleFilter()).select("slug").lean()).map((article) => article.slug)
  );

  const demoOnSiteEnabled = process.env.ENABLE_DEMO_CONTENT !== "false";
  const missingFromDb = seedSlugs.filter((slug) => !inDbSlugs.has(slug));

  return {
    inDatabase: inDbSlugs.size,
    virtualOnSite: demoOnSiteEnabled ? missingFromDb.length : 0,
    seedTotal: seedSlugs.length,
  };
}
