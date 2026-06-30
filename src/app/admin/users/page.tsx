import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CmsUsersView } from "@/components/admin/cms/CmsUsersView";
import { canManageUsers } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect("/admin");
  }

  return <CmsUsersView actorRole={session.user.role} />;
}
