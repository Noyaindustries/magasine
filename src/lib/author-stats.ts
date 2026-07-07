import type mongoose from "mongoose";
import { Article } from "@/models/Article";

/**
 * Nombre d'articles (tous statuts) par auteur, indexé par id d'auteur (string).
 * Un article co-signé compte pour chacun de ses auteurs.
 */
export async function getArticleCountsByAuthor(): Promise<Map<string, number>> {
  const rows = await Article.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $unwind: "$authors" },
    { $group: { _id: "$authors", count: { $sum: 1 } } },
  ]);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(String(row._id), row.count);
  }
  return counts;
}
