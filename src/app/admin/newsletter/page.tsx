import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import { NewsletterAdminPanel } from "@/components/admin/NewsletterAdminPanel";
import { isAdminRole } from "@/lib/permissions";

export default async function AdminNewsletterPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  await connectDB();
  const [subscribers, total] = await Promise.all([
    Newsletter.find().sort({ subscribedAt: -1 }).limit(50).lean(),
    Newsletter.countDocuments({ isActive: true }),
  ]);

  const rows = subscribers.map((sub) => ({
    email: sub.email,
    preferences: sub.preferences ?? [],
    isActive: sub.isActive,
    subscribedAt: sub.subscribedAt,
  }));

  return (
    <div className="admin-content admin-content--premium">
      <NewsletterAdminPanel subscribers={rows} totalActive={total} />
    </div>
  );
}
