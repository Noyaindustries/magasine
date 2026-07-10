import mongoose from "mongoose";
import { Article } from "@/models/Article";
import { Author } from "@/models/Author";
import {
  revalidateArticlePage,
  revalidateAuthorContent,
  revalidateContentListings,
} from "@/lib/revalidate-public";

export interface AuthorDeleteStats {
  totalArticles: number;
  soleAuthorArticles: number;
}

export async function getAuthorDeleteStats(
  authorId: mongoose.Types.ObjectId | string
): Promise<AuthorDeleteStats> {
  const articles = await Article.find({ authors: authorId }).select("authors").lean();
  const soleAuthorArticles = articles.filter((article) => article.authors.length === 1).length;
  return {
    totalArticles: articles.length,
    soleAuthorArticles,
  };
}

export interface DeleteAuthorResult {
  success?: boolean;
  error?: string;
  status?: number;
  detachedFromArticles?: number;
}

/**
 * Supprime un profil auteur. Retire l'auteur des articles à co-signature ;
 * refuse la suppression s'il est seul auteur sur au moins un article.
 */
export async function deleteAuthorAsAdmin(
  authorId: mongoose.Types.ObjectId | string
): Promise<DeleteAuthorResult> {
  const author = await Author.findById(authorId);
  if (!author) {
    return { error: "Auteur introuvable.", status: 404 };
  }

  const articles = await Article.find({ authors: authorId }).select("slug authors").lean();
  const soleAuthorArticles = articles.filter((article) => article.authors.length === 1);

  if (soleAuthorArticles.length > 0) {
    return {
      error:
        soleAuthorArticles.length === 1
          ? "Impossible de supprimer : 1 article n'a que cet auteur. Réattribuez-le d'abord dans Articles."
          : `Impossible de supprimer : ${soleAuthorArticles.length} articles n'ont que cet auteur. Réattribuez-les d'abord dans Articles.`,
      status: 409,
    };
  }

  if (articles.length > 0) {
    await Article.updateMany({ authors: authorId }, { $pull: { authors: authorId } });
    for (const article of articles) {
      revalidateArticlePage(article.slug);
    }
    revalidateContentListings();
  }

  const slug = author.slug;
  await Author.findByIdAndDelete(authorId);
  revalidateAuthorContent(slug);

  return { success: true, detachedFromArticles: articles.length };
}
