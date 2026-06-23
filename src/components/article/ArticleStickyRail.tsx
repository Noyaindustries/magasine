"use client";

import { ShareButtons } from "@/components/article/ShareButtons";
import { SaveArticleButton } from "@/components/article/SaveArticleButton";
import { Clock } from "lucide-react";

interface ArticleStickyRailProps {
  url: string;
  title: string;
  articleId: string;
  readingTime: number;
}

export function ArticleStickyRail({ url, title, articleId, readingTime }: ArticleStickyRailProps) {
  return (
    <aside className="art-rail" aria-label="Article tools">
      <div className="art-rail-card">
        <ShareButtons url={url} title={title} variant="premium" />
        <SaveArticleButton articleId={articleId} variant="premium" />
        <div className="art-rail-stat">
          <Clock className="w-3.5 h-3.5" aria-hidden />
          {readingTime} min read
        </div>
      </div>
    </aside>
  );
}

interface ArticleMobileToolbarProps {
  url: string;
  title: string;
  articleId: string;
}

export function ArticleMobileToolbar({ url, title, articleId }: ArticleMobileToolbarProps) {
  return (
    <div className="art-mobile-toolbar">
      <ShareButtons url={url} title={title} variant="premium" layout="row" />
      <SaveArticleButton articleId={articleId} variant="premium" />
    </div>
  );
}
