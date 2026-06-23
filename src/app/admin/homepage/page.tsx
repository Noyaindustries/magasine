import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { HomepageManager } from "@/components/admin/HomepageManager";
import { getHomepageAdminOverview } from "@/lib/homepage-admin";
import { isAdminRole } from "@/lib/permissions";
import "../admin-homepage.css";

export default async function AdminHomepagePage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  const { settings, sections, alertCount } = await getHomepageAdminOverview();

  return (
    <>
      <AdminPageTitle
        title="Homepage"
        description="Compose, configure, and publish every block on the public front page."
      />
      <div className="admin-content admin-content--homepage">
        <HomepageManager
          initialSettings={settings}
          initialSections={sections}
          alertCount={alertCount}
        />
      </div>
    </>
  );
}
