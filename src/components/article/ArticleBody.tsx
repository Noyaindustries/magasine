import Image from "next/image";
import { Play, Mic } from "lucide-react";
import type { ArticleDetail } from "@/types";
import { toVideoEmbedUrl, isVideoFile } from "@/lib/format-article";
import { resolveFeaturedImage } from "@/lib/images";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";

interface ArticleBodyProps {
  article: ArticleDetail;
  truncated?: boolean;
}

export function ArticleBody({ article, truncated = false }: ArticleBodyProps) {
  const embedUrl = article.videoUrl ? toVideoEmbedUrl(article.videoUrl) : null;
  const isVideo = article.contentType === "video";
  const isPodcast = article.contentType === "podcast";
  const isGalleryType = article.contentType === "gallery";
  const heroImage = resolveFeaturedImage(article.featuredImage);
  const galleryItems = article.gallery?.filter((item) => item.url) ?? [];

  const galleryBlock =
    galleryItems.length > 0 ? (
      <div className="article-gallery">
        {galleryItems.map((item, index) => (
          <figure key={`${item.url}-${index}`} className="article-gallery-item">
            <div className="article-gallery-img">
              <Image
                src={resolveFeaturedImage(item.url)}
                alt={item.caption ?? article.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
            {(item.caption || item.credit) && (
              <figcaption>
                {item.caption}
                {item.credit && <span className="article-gallery-credit"> · {item.credit}</span>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    ) : null;

  return (
    <div className={truncated ? "article-body article-body--truncated" : "article-body"}>
      {isVideo && embedUrl && (
        <div className="article-media article-media--video">
          {isVideoFile(embedUrl) ? (
            <video controls className="article-video-native" src={embedUrl} poster={heroImage}>
              <track kind="captions" />
            </video>
          ) : (
            <iframe
              src={embedUrl}
              title={article.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="article-video-embed"
            />
          )}
        </div>
      )}

      {isPodcast && (
        <div className="article-media article-media--podcast">
          <div className="article-podcast-card">
            <div className="article-podcast-icon" aria-hidden>
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <span className="article-podcast-label">Podcast · Global South Talks</span>
              <p className="article-podcast-desc">
                Listen to this episode in your favorite podcast app or read the transcript below.
              </p>
            </div>
            {embedUrl && (
              <a href={embedUrl} className="article-podcast-play" target="_blank" rel="noopener noreferrer">
                <Play className="w-4 h-4" />
                Listen
              </a>
            )}
          </div>
        </div>
      )}

      {isGalleryType && galleryBlock}

      <div
        className="article-content"
        dangerouslySetInnerHTML={{
          __html: sanitizeArticleHtml(
            truncated ? `${article.content.slice(0, 800)}…` : article.content,
          ),
        }}
      />

      {!isGalleryType && galleryBlock}
    </div>
  );
}
