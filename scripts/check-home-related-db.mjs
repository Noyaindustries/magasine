/**
 * Vérifie homeRelatedArticles directement en MongoDB.
 * Usage: node --env-file=.env.local scripts/check-home-related-db.mjs
 */
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI missing");

await mongoose.connect(uri);
const doc = await mongoose.connection.db.collection("sitesettings").findOne({});
console.log("homeRelatedArticles in DB:", doc?.homeRelatedArticles ?? "(field missing)");
console.log("updatedAt:", doc?.updatedAt);
await mongoose.disconnect();
