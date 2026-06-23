import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { isAdminRole } from "@/lib/permissions";
import { filterRetiredCategories } from "@/lib/retired-categories";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  await connectDB();
  const docs = await Category.find().sort({ order: 1 }).lean();
  const categories = filterRetiredCategories(
    docs.map((c) => ({
      _id: String(c._id),
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      color: c.color,
      order: c.order,
      isActive: c.isActive,
    }))
  );

  return (
    <div className="admin-content admin-content--premium">
      <CategoriesManager initial={categories} />
    </div>
  );
}
