import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Author } from "@/models/Author";
import { AuthorsManager } from "@/components/admin/AuthorsManager";
import { isAdminRole } from "@/lib/permissions";
import { getArticleCountsByAuthor } from "@/lib/author-stats";

export default async function AdminAuthorsPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  await connectDB();
  const [docs, articleCounts] = await Promise.all([
    Author.find().sort({ name: 1 }).lean(),
    getArticleCountsByAuthor(),
  ]);
  const authors = docs.map((a) => ({
    _id: String(a._id),
    name: a.name,
    slug: a.slug,
    bio: a.bio ?? "",
    email: a.email ?? "",
    avatar: a.avatar ?? "",
    twitter: a.social?.twitter ?? "",
    linkedin: a.social?.linkedin ?? "",
    articleCount: articleCounts.get(String(a._id)) ?? 0,
  }));

  return (
    <div className="admin-content admin-content--premium">
      <AuthorsManager initial={authors} />
    </div>
  );
}
