import { notFound } from "next/navigation";
import Image from "next/image";
import { getAuthorBySlug } from "@/lib/data";
import { ArticleCard } from "@/components/article/ArticleCard";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAuthorBySlug(slug);
  if (!data) return { title: "Author not found" };
  return {
    title: `${data.author.name} — Global South Watch`,
    description: data.author.bio ?? `Articles by ${data.author.name}`,
  };
}

export default async function AuthorPage({ params }: Props) {
  const { slug } = await params;
  const data = await getAuthorBySlug(slug);
  if (!data) notFound();

  const { author, articles } = data;

  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-16">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-12 pb-12 border-b border-border">
        <div className="w-24 h-24 rounded-full bg-gold-light flex items-center justify-center text-3xl font-bold text-gold-dark shrink-0 overflow-hidden">
          {author.avatar ? (
            <Image src={author.avatar} alt={author.name} width={96} height={96} className="object-cover" />
          ) : (
            author.name.charAt(0)
          )}
        </div>
        <div className="text-center sm:text-left">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-gold">Author</span>
          <h1 className="font-serif text-4xl font-bold text-charcoal mt-2 mb-4">{author.name}</h1>
          {author.bio && (
            <p className="text-muted max-w-2xl leading-relaxed">{author.bio}</p>
          )}
          <p className="text-sm text-muted mt-4">{articles.length} published article(s)</p>
        </div>
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted py-16">No published articles yet.</p>
      )}
    </div>
  );
}
