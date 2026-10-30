import { notFound } from "next/navigation";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/data";
import { getActiveAdBySlot } from "@/lib/ad-public";
import { auth } from "@/lib/auth";
import { canManageArticles } from "@/lib/permissions";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { TrackReading } from "@/components/article/TrackReading";
import { ArticleDetailView } from "@/components/article/ArticleDetailView";
import type { Metadata } from "next";
import "@/app/article-page.css";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const session = await auth();
  const allowUnpublished = canManageArticles(session?.user?.role);
  const data = await getArticleBySlug(slug, { allowUnpublished });
  if (!data) return { title: "Article not found" };

  const robots = data.isPreview
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : undefined;

  return {
    title: data.isPreview
      ? `Preview: ${data.article.seoTitle ?? data.article.title}`
      : (data.article.seoTitle ?? data.article.title),
    description: data.article.seoDescription ?? data.article.excerpt,
    robots,
    openGraph: data.isPreview
      ? undefined
      : {
          type: "article",
          title: data.article.title,
          description: data.article.excerpt,
          images: [data.article.featuredImage],
          publishedTime: data.article.publishedAt,
        },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const allowUnpublished = canManageArticles(session?.user?.role);
  const [data, adRight, adBelow] = await Promise.all([
    getArticleBySlug(slug, { allowUnpublished }),
    getActiveAdBySlot("article-right"),
    getActiveAdBySlot("article-below"),
  ]);
  if (!data) notFound();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  return (
    <>
      <ReadingProgress />
      {!data.isPreview ? <TrackReading articleId={data.article._id} /> : null}
      <ArticleDetailView
        article={data.article}
        related={data.related}
        navigation={data.navigation}
        session={session}
        siteUrl={siteUrl}
        adRight={adRight}
        adBelow={adBelow}
        isPreview={data.isPreview}
      />
    </>
  );
}
