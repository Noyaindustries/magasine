import { CmsSeoSettingsView } from "@/components/admin/cms/CmsSeoSettingsView";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";

export default async function AdminSeoPage() {
  const session = await auth();
  const canManageBranding = canManageUsers(session?.user?.role);

  return <CmsSeoSettingsView canManageBranding={canManageBranding} />;
}
