import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CmsDonationsView } from "@/components/admin/cms/CmsDonationsView";
import { isAdminRole } from "@/lib/permissions";

export default async function AdminDonationsPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  return <CmsDonationsView />;
}
