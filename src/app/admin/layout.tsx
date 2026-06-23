import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canManageArticles } from "@/lib/permissions";
import { getAdminNavStats } from "@/lib/admin-nav";
import { AdminShell } from "@/components/admin/AdminShell";
import "./admin.css";
import "./admin-premium.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || !canManageArticles(session.user.role)) {
    redirect("/login?callbackUrl=/admin");
  }

  const navStats = await getAdminNavStats();

  return (
    <AdminShell user={session.user} navStats={navStats}>
      {children}
    </AdminShell>
  );
}
