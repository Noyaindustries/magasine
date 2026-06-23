import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsAdmin } from "@/components/admin/SettingsAdmin";
import { canManageUsers } from "@/lib/permissions";
import { getFeedUrl, getSiteUrl } from "@/lib/site";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect("/admin");
  }

  return (
    <div className="admin-content admin-content--premium">
      <SettingsAdmin
        siteUrl={getSiteUrl()}
        feedUrl={getFeedUrl()}
        isSuperAdmin={session.user.role === "super_admin"}
      />
    </div>
  );
}
