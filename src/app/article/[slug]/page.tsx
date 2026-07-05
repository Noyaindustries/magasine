import { notFound } from "next/navigation";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/data";
import { auth } from "@/lib/auth";
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
  const data = await getArticleBySlug(slug);
  if (!data) return { title: "Article not found" };

  return {
    title: data.article.seoTitle ?? data.article.title,
    description: data.article.seoDescription ?? data.article.excerpt,
    openGraph: {
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
  const [data, session] = await Promise.all([getArticleBySlug(slug), auth()]);
  if (!data) notFound();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  return (
    <>
      <ReadingProgress />
      <TrackReading articleId={data.article._id} />
      <ArticleDetailView
        article={data.article}
        related={data.related}
        navigation={data.navigation}
        session={session}
        siteUrl={siteUrl}
      />
    </>
  );
}
