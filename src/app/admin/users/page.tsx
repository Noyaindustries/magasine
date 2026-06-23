import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UsersManager } from "@/components/admin/UsersManager";
import { canManageUsers } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect("/admin");
  }

  return (
    <div className="admin-content admin-content--premium">
      <UsersManager />
    </div>
  );
}
