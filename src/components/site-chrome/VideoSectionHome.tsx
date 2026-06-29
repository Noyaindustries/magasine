import Link from "next/link";
import type { HomeVideo } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { SectionHeader } from "@/components/site-chrome/SectionHeader";

interface VideoSectionHomeProps {
  data: HomeVideo[];
}

export function VideoSectionHome({ data }: VideoSectionHomeProps) {
  if (data.length === 0) return null;

  return (
    <div className="section section-premium section-video">
      <div className="container">
        <SectionHeader
          eyebrow="Multimedia"
          title="Featured Videos"
          linkHref="/category/multimedia"
          linkLabel="Full video library"
        />
        <div className="video-row video-row--grid-3">
          {data.slice(0, 3).map((video, i) => {
            const card = (
              <>
                <div className="video-card-thumb">
                  <SectionImage
                    src={video.image}
                    alt={video.title}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="play-btn">
                    <svg viewBox="0 0 16 16" aria-hidden>
                      <path d="M4 2l10 6-10 6V2z" />
                    </svg>
                  </div>
                  <span className="video-duration">{video.duration}</span>
                </div>
                <div className="video-card-body">
                  <div className="video-cat">{video.cat}</div>
                  <div className="video-title">{video.title}</div>
                  <div className="video-meta">{video.views}</div>
                </div>
              </>
            );

            return video.slug ? (
              <Link
                key={video.slug}
                href={video.slug}
                className="video-card reveal"
                data-reveal-delay={i * 70}
              >
                {card}
              </Link>
            ) : (
              <div key={video.title} className="video-card reveal" data-reveal-delay={i * 70}>
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
