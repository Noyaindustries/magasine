"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import type { HeroSlide } from "@/types/home";
import { SectionImage } from "@/components/presse-ivoire/SectionImage";
import { isVideoFile } from "@/lib/format-article";

const AUTO_MS = 7000;

interface HeroCarouselContextValue {
  slides: HeroSlide[];
  active: number;
  slide: HeroSlide;
  count: number;
  paused: boolean;
  setPaused: (paused: boolean) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
}

const HeroCarouselContext = createContext<HeroCarouselContextValue | null>(null);

function useHeroCarousel() {
  const ctx = useContext(HeroCarouselContext);
  if (!ctx) {
    throw new Error("Hero carousel components must be used within HeroCarouselProvider");
  }
  return ctx;
}

interface HeroCarouselProviderProps {
  slides: HeroSlide[];
  children: ReactNode;
}

export function HeroCarouselProvider({ slides, children }: HeroCarouselProviderProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const slide = slides[active] ?? slides[0];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!slide) return null;

  return (
    <HeroCarouselContext.Provider
      value={{ slides, active, slide, count, paused, setPaused, goTo, next, prev }}
    >
      {children}
    </HeroCarouselContext.Provider>
  );
}

export function HeroCarouselMedia() {
  const { slide, active, slides, count, setPaused, goTo, next, prev } = useHeroCarousel();

  const isVideo = slide.contentType === "video";
  const isFileVideo = slide.videoUrl ? isVideoFile(slide.videoUrl) : false;

  return (
    <div
      className="hero-carousel hero-carousel--media"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link href={`/article/${slide.slug}`} className="hero-cover-link">
        <div className="hero-frame">
          <div className="hero-illustration hero-carousel-slide">
            {isVideo && slide.videoUrl && isFileVideo ? (
              <video
                key={slide.slug}
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
                priority={active === 0}
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

            <span className="hero-corner hero-corner--tl" aria-hidden />
            <span className="hero-corner hero-corner--tr" aria-hidden />
            <span className="hero-corner hero-corner--bl" aria-hidden />
            <span className="hero-corner hero-corner--br" aria-hidden />
          </div>
        </div>
      </Link>

      {count > 1 && (
        <>
          <div className="hero-carousel-controls">
            <button
              type="button"
              className="hero-carousel-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous article"
            >
              ‹
            </button>
            <button
              type="button"
              className="hero-carousel-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                next();
              }}
              aria-label="Next article"
            >
              ›
            </button>
          </div>

          <div className="hero-carousel-dots" role="tablist" aria-label="Featured articles">
            {slides.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                className={`hero-carousel-dot${i === active ? " active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <div className="hero-carousel-progress" aria-hidden>
            <span
              key={active}
              className="hero-carousel-progress-bar"
              style={{ animationDuration: `${AUTO_MS}ms` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function HeroCarouselStory() {
  const { slide } = useHeroCarousel();

  return (
    <div className="hero-carousel-story" key={slide.slug}>
      <div className="hero-carousel-story-head">
        <span className="tag outline">{slide.category}</span>
        <Link href={`/article/${slide.slug}`} className="hero-cta">
          Read now
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M2 7h10M8 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
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
        <span>{slide.readingTime}</span>
        <span aria-hidden>·</span>
        <span>{slide.timeAgo}</span>
      </p>

      {slide.excerpt ? <p className="hero-excerpt hero-carousel-story-excerpt">{slide.excerpt}</p> : null}

      <div className="hero-meta hero-carousel-story-byline">
        <div className="hero-author">
          <div className="hero-avatar">{slide.authorInitials}</div>
          <div>
            <div className="hero-author-name">{slide.author}</div>
            <div className="hero-author-role">{slide.authorRole}</div>
          </div>
        </div>
        <span className="hero-dot" aria-hidden>
          ·
        </span>
        <span>{slide.date}</span>
      </div>
    </div>
  );
}

/** @deprecated Use HeroCarouselProvider + HeroCarouselMedia + HeroCarouselStory */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  return (
    <HeroCarouselProvider slides={slides}>
      <HeroCarouselMedia />
      <HeroCarouselStory />
    </HeroCarouselProvider>
  );
}
