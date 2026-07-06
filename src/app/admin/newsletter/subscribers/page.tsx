import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import { CmsNewsletterSubscribersView } from "@/components/admin/cms/CmsNewsletterSubscribersView";
import { isAdminRole } from "@/lib/permissions";

export default async function AdminNewsletterSubscribersPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  await connectDB();
  const [initialActive, initialTotal] = await Promise.all([
    Newsletter.countDocuments({ isActive: true }),
    Newsletter.countDocuments({}),
  ]);

  return (
    <CmsNewsletterSubscribersView initialActive={initialActive} initialTotal={initialTotal} />
  );
}
