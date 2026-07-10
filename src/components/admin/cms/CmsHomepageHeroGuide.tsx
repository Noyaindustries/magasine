import Link from "next/link";
import type { ArticleAdminStats } from "@/lib/article-admin-stats";

interface CmsHomepageHeroGuideProps {
  stats: ArticleAdminStats;
}

function findCategoryPublished(stats: ArticleAdminStats, slug: string): number {
  return stats.byCategory.find((row) => row.slug === slug)?.published ?? 0;
}

export function CmsHomepageHeroGuide({ stats }: CmsHomepageHeroGuideProps) {
  const { overview, editorialFlags } = stats;
  const publishedReal = overview.publishedReal;
  const featuredCount = editorialFlags.find((row) => row.key === "featured")?.count ?? 0;
  const opinionPublished = findCategoryPublished(stats, "opinion");

  const relatedTarget = 6;
  const opinionTarget = 3;
  const relatedOk = publishedReal >= relatedTarget;
  const opinionOk = opinionPublished >= opinionTarget;
  const heroOk = featuredCount >= 1;

  return (
    <details className="articles-hero-guide">
      <summary className="articles-hero-guide-summary">
        <span className="articles-hero-guide-title">Comment remplir l&apos;accueil (hero)</span>
        <span
          className={
            relatedOk && opinionOk && heroOk
              ? "articles-hero-guide-badge articles-hero-guide-badge--ok"
              : "articles-hero-guide-badge"
          }
        >
          {relatedOk && opinionOk && heroOk ? "Complet" : "À compléter"}
        </span>
      </summary>

      <div className="articles-hero-guide-body">
        <p className="articles-hero-guide-intro">
          Après suppression des articles de test, seuls vos articles <strong>publiés</strong>{" "}
          apparaissent sur la page d&apos;accueil. Voici comment alimenter chaque bloc visible sous
          la grande image.
        </p>

        <div className="articles-hero-guide-grid">
          <article className="articles-hero-guide-card">
            <h3>Grande image du hero</h3>
            <p>
              Un article avec l&apos;option <strong>Homepage feature</strong> activée dans
              l&apos;éditeur, puis statut <strong>Published</strong>.
            </p>
            <p className="articles-hero-guide-status">
              {heroOk ? (
                <>✓ {featuredCount} article(s) à la une</>
              ) : (
                <>⚠ Aucun article « Homepage feature » publié</>
              )}
            </p>
            <Link href="/admin/articles/new" className="articles-hero-guide-link">
              + Créer l&apos;article principal
            </Link>
          </article>

          <article className="articles-hero-guide-card">
            <h3>Related Stories</h3>
            <p>
              Les <strong>derniers articles publiés</strong> (toutes rubriques), jusqu&apos;à 6
              cartes. L&apos;article du hero principal est exclu automatiquement.
            </p>
            <p className="articles-hero-guide-status">
              {relatedOk ? (
                <>✓ {publishedReal} article(s) publiés — bandeau complet</>
              ) : (
                <>
                  ⚠ {publishedReal}/{relatedTarget} articles publiés recommandés (il en manque{" "}
                  {Math.max(0, relatedTarget - publishedReal)})
                </>
              )}
            </p>
            <Link href="/admin/articles/new" className="articles-hero-guide-link">
              + Ajouter un article
            </Link>
          </article>

          <article className="articles-hero-guide-card">
            <h3>Opinion &amp; Ideas</h3>
            <p>
              Articles <strong>publiés</strong> dont la rubrique principale est{" "}
              <strong>Opinion</strong> (pas seulement une région cochée à côté).
            </p>
            <p className="articles-hero-guide-status">
              {opinionOk ? (
                <>✓ {opinionPublished} article(s) Opinion publiés</>
              ) : (
                <>
                  ⚠ {opinionPublished}/{opinionTarget} articles Opinion publiés (il en manque{" "}
                  {Math.max(0, opinionTarget - opinionPublished)})
                </>
              )}
            </p>
            <Link
              href="/admin/articles/new"
              className="articles-hero-guide-link"
            >
              + Créer un article Opinion
            </Link>
          </article>
        </div>

        <ol className="articles-hero-guide-steps">
          <li>
            <Link href="/admin/articles/new">Nouvel article</Link> → titre, image à la une, extrait,
            contenu, auteur.
          </li>
          <li>Choisir la <strong>rubrique thématique</strong> (Politics, Feature, Opinion…).</li>
          <li>
            Cocher <strong>Homepage feature</strong> uniquement pour l&apos;article principal du
            hero.
          </li>
          <li>Passer le statut à <strong>Published</strong> et enregistrer.</li>
          <li>
            Répéter pour <strong>5–6 articles variés</strong> + <strong>2–3 en Opinion</strong>.
          </li>
        </ol>

        <p className="articles-hero-guide-footnote">
          La page d&apos;accueil se met à jour en ~1 minute. Pour désactiver tout contenu fictif
          restant : <code>ENABLE_DEMO_CONTENT=false</code> dans <code>.env.local</code>.
        </p>
      </div>
    </details>
  );
}
