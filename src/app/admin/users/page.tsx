import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { CmsUsersView } from "@/components/admin/cms/CmsUsersView";
import { canManageUsers } from "@/lib/permissions";
import { getAdminUsers, type UserListFilter } from "@/lib/admin-users";
import { getRolePermissionsMatrix } from "@/lib/role-permissions-matrix";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    page?: string;
  }>;
}

const FILTERS: UserListFilter[] = ["all", "editorial", "readers", "banned", "premium"];

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect("/admin");
  }

  const { q, filter: filterParam, page: pageParam } = await searchParams;
  const filter =
    filterParam && FILTERS.includes(filterParam as UserListFilter)
      ? (filterParam as UserListFilter)
      : "all";
  const page = Math.max(1, Number(pageParam) || 1);

  await connectDB();
  const data = await getAdminUsers({ q, filter, page });
  const roleMatrix = getRolePermissionsMatrix();

  return (
    <CmsUsersView
      actorRole={session.user.role}
      actorId={session.user.id}
      users={data.users}
      counts={data.counts}
      editorialTeam={data.editorialTeam}
      filter={data.filter}
      query={data.query}
      page={data.page}
      totalPages={data.totalPages}
      totalFiltered={data.totalFiltered}
      roleMatrix={roleMatrix}
    />
  );
}
