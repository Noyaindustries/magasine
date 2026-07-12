import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { normalizeCategorySlug } from "@/lib/category-admin";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Article } from "@/models/Article";
import { revalidateCategoryContent, revalidateContentListings } from "@/lib/revalidate-public";

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

function preprocessUpdateBody(raw: unknown) {
  if (!raw || typeof raw !== "object") return raw;
  const body = { ...(raw as Record<string, unknown>) };
  if (typeof body.name === "string") body.name = body.name.trim();
  if (typeof body.slug === "string") {
    const normalized = normalizeCategorySlug(body.slug);
    body.slug = normalized || undefined;
  }
  return body;
}

async function ensureUniqueSlug(slug: string, excludeId: string) {
  const existing = await Category.findOne({ slug, _id: { $ne: excludeId } });
  if (existing) {
    return NextResponse.json(
      { error: `Slug "${slug}" is already used by category "${existing.name}".` },
      { status: 409 }
    );
  }
  return null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  const body = preprocessUpdateBody(await request.json());
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await connectDB();
  const category = await Category.findById(id);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const previousSlug = category.slug;
  const data = parsed.data;
  if (data.name) category.name = data.name;
  if (data.slug) {
    const slug = normalizeCategorySlug(data.slug);
    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    if (slug !== category.slug) {
      const conflict = await ensureUniqueSlug(slug, id);
      if (conflict) return conflict;
      category.slug = slug;
    }
  }
  if (data.description !== undefined) category.description = data.description;
  if (data.color) category.color = data.color;
  if (data.order !== undefined) category.order = data.order;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();
  revalidateCategoryContent(category.slug, { previousSlug });
  return NextResponse.json({ _id: String(category._id), slug: category.slug });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  await connectDB();

  const inUse = await Article.countDocuments({
    $or: [{ category: id }, { secondaryCategories: id }],
  });
  if (inUse > 0) {
    return NextResponse.json(
      {
        error: `This category is used by ${inUse} article(s). Deactivate it instead of deleting it.`,
      },
      { status: 409 }
    );
  }

  const result = await Category.findByIdAndDelete(id);
  if (!result) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  revalidateCategoryContent(result.slug);
  revalidateContentListings();
  return NextResponse.json({ success: true });
}
