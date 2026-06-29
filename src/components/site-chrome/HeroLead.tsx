import Link from "next/link";
import type { HeroSlide } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { isVideoFile } from "@/lib/format-article";

export function HeroLeadImage({ slide }: { slide: HeroSlide }) {
  const isVideo = slide.contentType === "video";
  const isFileVideo = slide.videoUrl ? isVideoFile(slide.videoUrl) : false;

  return (
    <Link href={`/article/${slide.slug}`} className="hero-cover-link">
      <div className="hero-frame">
        <div className="hero-illustration">
          {isVideo && slide.videoUrl && isFileVideo ? (
            <video
              className="hero-video-native"
              src={slide.videoUrl}
              poster={slide.image}
              muted
              loop
              playsInline
              autoPlay
            />
          ) : (
            <SectionImage
              src={slide.image}
              alt={slide.title}
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
              className="hero-illustration-photo"
            />
          )}

          <div className="hero-illustration-text hero-illustration-text--badges-only">
            <div className="hero-cover-badges">
              <span className="hero-story-badge">{slide.badge}</span>
              {slide.isPremium && (
                <span className="premium-badge premium-badge-glow">★ Premium</span>
              )}
              {isVideo && <span className="hero-video-badge">▶ Video</span>}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HeroLeadStory({ slide }: { slide: HeroSlide }) {
  return (
    <div className="hero-carousel-story">
      <div className="hero-carousel-story-head">
        <span className="tag outline">{slide.category}</span>
      </div>

      <h2 className="hero-carousel-story-title">
        <Link href={`/article/${slide.slug}`}>
          {slide.title}
          {slide.titleEm && <em>{slide.titleEm}</em>}
        </Link>
      </h2>

      <p className="hero-carousel-story-meta">
        <span>
          By <strong>{slide.author}</strong>
        </span>
        <span aria-hidden>·</span>
        <span>{slide.date}</span>
      </p>

      {slide.excerpt ? (
        <p className="hero-excerpt hero-carousel-story-excerpt">{slide.excerpt}</p>
      ) : null}
    </div>
  );
}
