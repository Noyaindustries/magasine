import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CmsAboutPageView } from "@/components/admin/cms/CmsAboutPageView";
import { isAdminRole } from "@/lib/permissions";

export default async function AdminAboutPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  return <CmsAboutPageView />;
}
