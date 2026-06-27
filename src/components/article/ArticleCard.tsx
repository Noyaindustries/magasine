import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatArticleCardMeta } from "@/lib/format-article";
import { resolveFeaturedImage } from "@/lib/images";
import type { ArticleListItem } from "@/types";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  article: ArticleListItem;
  variant?: "default" | "hero" | "compact" | "horizontal" | "video";
  className?: string;
  priority?: boolean;
}

export function ArticleCard({
  article,
  variant = "default",
  className,
  priority = false,
}: ArticleCardProps) {
  const imageSrc = resolveFeaturedImage(article.featuredImage);

  if (variant === "hero") {
    return (
      <Link
        href={`/article/${article.slug}`}
        className={cn("group relative block overflow-hidden rounded-sm", className)}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageSrc}
            alt={article.featuredImageAlt ?? article.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            <Badge variant="accent" className="mb-3">
              {article.category.name}
            </Badge>
            <h2 className="font-serif text-2xl lg:text-4xl font-bold text-white leading-tight mb-3 group-hover:text-gold-light transition-colors">
              {article.title}
            </h2>
            <p className="text-white/70 text-sm line-clamp-2 mb-4 max-w-2xl">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 text-xs text-white/50">
              {article.publishedAt && (
                <span>{formatArticleCardMeta(article)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/article/${article.slug}`}
        className={cn("group flex gap-3 py-3 border-b border-border last:border-0", className)}
      >
        <div className="relative w-20 h-16 shrink-0 overflow-hidden rounded-sm">
          <Image
            src={imageSrc}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="80px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-sm font-medium text-charcoal line-clamp-2 group-hover:text-accent transition-colors leading-snug">
            {article.title}
          </h3>
          <span className="text-[11px] text-muted mt-1 block">
            {formatArticleCardMeta(article)}
          </span>
        </div>
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link
        href={`/article/${article.slug}`}
        className={cn("group flex gap-5 p-4 bg-surface border border-border rounded-sm hover:shadow-card transition-all duration-300", className)}
      >
        <div className="relative w-32 h-24 shrink-0 overflow-hidden rounded-sm">
          <Image
            src={imageSrc}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="128px"
          />
        </div>
        <div className="flex-1">
          <Badge variant="accent" className="mb-2">{article.category.name}</Badge>
          <h3 className="font-serif text-lg font-semibold text-charcoal line-clamp-2 group-hover:text-accent transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-muted line-clamp-2 mt-1">{article.excerpt}</p>
        </div>
      </Link>
    );
  }

  if (variant === "video") {
    return (
      <Link
        href={`/article/${article.slug}`}
        className={cn("group block", className)}
      >
        <div className="relative aspect-video overflow-hidden rounded-sm mb-3">
          <Image
            src={imageSrc}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          <div className="absolute inset-0 bg-charcoal/20 group-hover:bg-charcoal/40 transition-colors flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-luxury">
              <Play className="w-6 h-6 text-accent fill-accent ml-1" />
            </div>
          </div>
        </div>
        <Badge variant="gold" className="mb-2">Video</Badge>
        <h3 className="font-serif text-base font-semibold text-charcoal line-clamp-2 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm mb-4">
        <Image
          src={imageSrc}
          alt={article.featuredImageAlt ?? article.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {article.isPremium && (
          <div className="absolute top-3 left-3">
            <Badge variant="premium">Premium</Badge>
          </div>
        )}
      </div>
      <Badge variant="accent" className="mb-2">{article.category.name}</Badge>
      <h3 className="font-serif text-xl font-semibold text-charcoal line-clamp-2 group-hover:text-accent transition-colors leading-snug mb-2">
        {article.title}
      </h3>
      <p className="text-sm text-muted line-clamp-2 mb-3">{article.excerpt}</p>
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>{formatArticleCardMeta(article)}</span>
      </div>
    </Link>
  );
}
