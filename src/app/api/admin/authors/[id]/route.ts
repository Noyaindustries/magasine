import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Author } from "@/models/Author";
import { imageSrcField } from "@/lib/image-src";
import { revalidateAuthorContent } from "@/lib/revalidate-public";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  avatar: imageSrcField,
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await connectDB();
  const author = await Author.findById(id);
  if (!author) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  const previousSlug = author.slug;
  const data = parsed.data;
  if (data.name) {
    author.name = data.name;
    author.slug = slugify(data.name, { lower: true, strict: true });
  }
  if (data.bio !== undefined) author.bio = data.bio;
  if (data.email !== undefined) author.email = data.email || undefined;
  if (data.avatar !== undefined) author.avatar = data.avatar || undefined;
  if (data.twitter !== undefined || data.linkedin !== undefined) {
    author.social = {
      twitter: data.twitter ?? author.social?.twitter,
      linkedin: data.linkedin ?? author.social?.linkedin,
    };
  }

  await author.save();
  revalidateAuthorContent(author.slug, { previousSlug });
  return NextResponse.json({ _id: String(author._id), slug: author.slug });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  await connectDB();
  const result = await Author.findByIdAndDelete(id);
  if (!result) {
    return NextResponse.json({ error: "Author not found" }, { status: 404 });
  }

  revalidateAuthorContent(result.slug);
  return NextResponse.json({ success: true });
}
