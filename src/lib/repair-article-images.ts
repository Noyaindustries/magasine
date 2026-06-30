import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Media } from "@/models/Media";
import { replacementForBrokenLocalMedia, resolveFeaturedImage } from "@/lib/images";

const BROKEN_UNSPLASH_PATTERN =
  /photo-(1509316785289|1524492412937|1574943325722|1611162617474)/;

const LOCAL_UPLOAD_PATTERN = /^\/uploads\/(media|branding)\//;

let repairDone = false;

function fixLocalUploadUrl(url: string): string | null {
  if (!LOCAL_UPLOAD_PATTERN.test(url.trim())) return null;
  return replacementForBrokenLocalMedia(url);
}

/** Fixes removed Unsplash URLs and orphaned local upload paths (once per server instance). */
export async function repairBrokenArticleImagesOnce() {
  if (repairDone) return;
  repairDone = true;

  try {
    await connectDB();
    const articles = await Article.find({
      $or: [
        { featuredImage: BROKEN_UNSPLASH_PATTERN },
        { featuredImage: LOCAL_UPLOAD_PATTERN },
        { "gallery.url": BROKEN_UNSPLASH_PATTERN },
        { "gallery.url": LOCAL_UPLOAD_PATTERN },
        { content: LOCAL_UPLOAD_PATTERN },
      ],
    });

    for (const article of articles) {
      let dirty = false;

      const fixedFeatured = resolveFeaturedImage(article.featuredImage);
      if (fixedFeatured !== article.featuredImage) {
        article.featuredImage = fixedFeatured;
        dirty = true;
      }

      if (article.gallery?.length) {
        for (const item of article.gallery) {
          const fixed = resolveFeaturedImage(item.url);
          if (fixed !== item.url) {
            item.url = fixed;
            dirty = true;
          }
        }
      }

      if (article.content && LOCAL_UPLOAD_PATTERN.test(article.content)) {
        const updated = article.content.replace(
          /\/uploads\/(media|branding)\/([a-zA-Z0-9._-]+)/g,
          (match) => fixLocalUploadUrl(match) ?? match
        );
        if (updated !== article.content) {
          article.content = updated;
          dirty = true;
        }
      }

      if (dirty) {
        await article.save();
      }
    }

    const mediaItems = await Media.find({ url: LOCAL_UPLOAD_PATTERN });
    for (const item of mediaItems) {
      const fixed = fixLocalUploadUrl(item.url);
      if (fixed && fixed !== item.url) {
        item.url = fixed;
        await item.save();
      }
    }
  } catch (error) {
    console.error("repairBrokenArticleImages:", error);
  }
}
