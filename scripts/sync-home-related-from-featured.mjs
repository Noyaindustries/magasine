import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI missing");

await mongoose.connect(uri);
const db = mongoose.connection.db;

const featured = await db.collection("articles").findOne(
  {
    status: "published",
    isFeatured: true,
    "relatedArticles.0": { $exists: true },
  },
  { sort: { updatedAt: -1 }, projection: { relatedArticles: 1, title: 1 } }
);

if (!featured?.relatedArticles?.length) {
  console.log("No featured article with related stories found.");
  await mongoose.disconnect();
  process.exit(0);
}

console.log("Source article:", featured.title);
await db.collection("sitesettings").updateOne(
  {},
  { $set: { homeRelatedArticles: featured.relatedArticles, updatedAt: new Date() } }
);
console.log("Synced", featured.relatedArticles.length, "article(s) to homepage Related Stories.");

await mongoose.disconnect();
