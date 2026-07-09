import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { getAllAuthors } from "@/lib/data";
import { UtilityPageLayout } from "@/components/layout/UtilityPageLayout";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our team",
  description: "The journalists, correspondents and columnists of Global South Watch.",
};

export default async function TeamPage() {
  const authors = await getAllAuthors();

  return (
    <UtilityPageLayout
      eyebrow="Editorial"
      eyebrowIcon={Users}
      title={
        <>
          Our
          <span> team</span>
        </>
      }
      lead="Passionate journalists rooted in the field — delivering reliable, independent reporting for the Global South."
      actions={[
        { label: "Editorial charter", href: "/editorial-charter" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ]}
      wide
    >
      <div className="team-grid">
        {authors.map((author) => (
          <Link
            key={author._id}
            href={`/author/${author.slug}`}
            className="team-card"
          >
            <div className="team-card-avatar">
              {author.avatar && (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  fill
                  className="object-cover"
                  sizes="88px"
                />
              )}
            </div>
            <h2>{author.name}</h2>
            {author.bio && <p>{author.bio}</p>}
            <span className="team-card-link">View articles →</span>
          </Link>
        ))}
      </div>
    </UtilityPageLayout>
  );
}
