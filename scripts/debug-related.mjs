/**
 * Debug related articles: homepage settings + sample article relatedArticles
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI missing");

await mongoose.connect(uri);
const db = mongoose.connection.db;

const settings = await db.collection("sitesettings").findOne({});
console.log("=== SiteSettings.homeRelatedArticles ===");
console.log(JSON.stringify(settings?.homeRelatedArticles ?? null, null, 2));

const articleId = process.argv[2] ?? "6a64c7e9b2c0517f4cc7daac";
const article = await db.collection("articles").findOne(
  { _id: new mongoose.Types.ObjectId(articleId) },
  { projection: { title: 1, slug: 1, status: 1, relatedArticles: 1 } }
);
console.log("\n=== Article", articleId, "===");
console.log(JSON.stringify(article, null, 2));

if (article?.relatedArticles?.length) {
  const related = await db
    .collection("articles")
    .find({ _id: { $in: article.relatedArticles } })
    .project({ title: 1, slug: 1, status: 1 })
    .toArray();
  console.log("\n=== Resolved related ===");
  console.log(JSON.stringify(related, null, 2));
}

await mongoose.disconnect();
