import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/data";
import { getSectionMeta } from "@/lib/sections";
import { CategoryPageView } from "@/components/category/CategoryPageView";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) return { title: "Section not found" };

  const meta = getSectionMeta(slug);

  return {
    title: data.category.name,
    description:
      data.category.description ??
      meta?.lead ??
      `Articles in the ${data.category.name} section`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCategoryBySlug(slug);
  if (!data) notFound();

  const meta = getSectionMeta(slug);
  if (!meta) notFound();

  const { category, articles } = data;

  return (
    <CategoryPageView
      category={{
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
      }}
      sectionMeta={{
        kind: meta.kind,
        eyebrow: meta.eyebrow,
        lead: meta.lead,
        relatedSlugs: meta.relatedSlugs,
        linkHref: meta.linkHref,
        linkLabel: meta.linkLabel,
        formatLinks: meta.formatLinks,
      }}
      articles={articles}
    />
  );
}
