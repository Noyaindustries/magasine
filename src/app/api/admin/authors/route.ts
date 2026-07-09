import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Author } from "@/models/Author";
import { getArticleCountsByAuthor } from "@/lib/author-stats";
import { imageSrcField } from "@/lib/image-src";
import { revalidateAuthorContent } from "@/lib/revalidate-public";

const createSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  avatar: imageSrcField,
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  await connectDB();
  const [authors, articleCounts] = await Promise.all([
    Author.find().sort({ name: 1 }).lean(),
    getArticleCountsByAuthor(),
  ]);
  return NextResponse.json({
    authors: authors.map((a) => ({
      _id: String(a._id),
      name: a.name,
      slug: a.slug,
      bio: a.bio ?? "",
      email: a.email ?? "",
      avatar: a.avatar ?? "",
      twitter: a.social?.twitter ?? "",
      linkedin: a.social?.linkedin ?? "",
      articleCount: articleCounts.get(String(a._id)) ?? 0,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await connectDB();
  const slug = slugify(parsed.data.name, { lower: true, strict: true });
  const existing = await Author.findOne({ slug });
  if (existing) {
    return NextResponse.json({ error: "Author slug already exists" }, { status: 409 });
  }

  const author = await Author.create({
    name: parsed.data.name,
    slug,
    bio: parsed.data.bio,
    email: parsed.data.email || undefined,
    avatar: parsed.data.avatar || undefined,
    social: {
      twitter: parsed.data.twitter || undefined,
      linkedin: parsed.data.linkedin || undefined,
    },
  });

  revalidateAuthorContent(author.slug);
  return NextResponse.json(
    { _id: String(author._id), slug: author.slug },
    { status: 201 }
  );
}
