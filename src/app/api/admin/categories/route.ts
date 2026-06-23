import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { filterRetiredCategories } from "@/lib/retired-categories";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  await connectDB();
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
  return NextResponse.json({
    categories: filterRetiredCategories(
      categories.map((c) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        color: c.color,
        order: c.order,
        isActive: c.isActive,
      }))
    ),
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
  const existing = await Category.findOne({ slug });
  if (existing) {
    return NextResponse.json({ error: "Category slug already exists" }, { status: 409 });
  }

  const category = await Category.create({
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    color: parsed.data.color ?? "#1A3896",
    order: parsed.data.order ?? 0,
    isActive: parsed.data.isActive ?? true,
  });

  return NextResponse.json(
    { _id: String(category._id), slug: category.slug },
    { status: 201 }
  );
}
