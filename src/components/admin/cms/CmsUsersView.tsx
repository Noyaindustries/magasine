"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons, Check, Star } from "@/components/admin/cms/CmsIcons";
import { CmsUserFormModal, type CmsUserFormValues } from "@/components/admin/cms/CmsUserFormModal";
import { CmsUsersTable } from "@/components/admin/cms/CmsUsersTable";
import type { RoleMatrixRow } from "@/lib/role-permissions-matrix";
import type { AdminUserCounts, AdminUserRow, UserListFilter } from "@/lib/admin-users";
import { toast } from "@/lib/toast";
import { toastNetworkError } from "@/lib/api-toast";
import { canDeleteUserAsAdmin } from "@/lib/admin-user-permissions";
import { authorAvatarGradient, authorInitials } from "@/components/admin/cms/cms-ui";
import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";
import type { UserRole } from "@/types";

const ROLE_COLORS: Partial<Record<UserRole, string>> = {
  super_admin: "var(--cms-red)",
  admin: "var(--cms-red)",
  editor: "var(--purple)",
  author: "var(--blue)",
  contributor: "var(--amber)",
  reader: "var(--t3)",
};

const FILTER_TABS: { id: UserListFilter; label: string; countKey: keyof AdminUserCounts }[] = [
  { id: "all", label: "All", countKey: "all" },
  { id: "editorial", label: "Editorial", countKey: "editorial" },
  { id: "readers", label: "Readers", countKey: "readers" },
  { id: "premium", label: "Premium", countKey: "premium" },
  { id: "banned", label: "Banned", countKey: "banned" },
];

interface CmsUsersViewProps {
  actorRole: UserRole;
  actorId: string;
  users: AdminUserRow[];
  counts: AdminUserCounts;
  editorialTeam: AdminUserRow[];
  filter: UserListFilter;
  query?: string;
  page: number;
  totalPages: number;
  totalFiltered: number;
  roleMatrix: RoleMatrixRow[];
}

function buildUsersHref(params: { filter?: UserListFilter; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.filter && params.filter !== "all") sp.set("filter", params.filter);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

function matrixCell(value: boolean | "own" | string) {
  if (value === true) {
    return (
      <span className="cms-matrix-yes">
        <Check size={14} aria-hidden />
      </span>
    );
  }
  if (value === "own") return <span className="cms-matrix-own">Own content</span>;
  return <span className="cms-matrix-no">—</span>;
}

export function CmsUsersView({
  actorRole,
  actorId,
  users,
  counts,
  editorialTeam,
  filter,
  query,
  page,
  totalPages,
  totalFiltered,
  roleMatrix,
}: CmsUsersViewProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(query ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserRow | null>(null);
  const [saving, setSaving] = useState(false);

  const paginationBase = buildUsersHref({ filter, q: query });

  const refresh = () => router.refresh();

  const createUser = async (values: CmsUserFormValues) => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
      };
      if (values.password.trim()) {
        payload.password = values.password.trim();
      }
      if (values.image.trim()) {
        payload.image = values.image.trim();
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create user.");
        return;
      }

      setCreateOpen(false);
      if (data.tempPassword) {
        toast.success("User created", {
          description: `${data.email} · Temporary password: ${data.tempPassword}`,
          duration: 12000,
        });
      } else {
        toast.success("User created", { description: data.email });
      }
      refresh();
    } catch {
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (values: CmsUserFormValues) => {
    if (!editUser) return;

    setSaving(true);
    try {
      const payload: Record<string, string | boolean> = {
        userId: editUser._id,
        name: values.name.trim(),
        role: values.role,
        isPremium: values.isPremium,
        isBanned: values.isBanned,
        image: values.image.trim(),
      };
      if (values.password.trim()) {
        payload.password = values.password.trim();
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update user.");
        return;
      }

      toast.success("User updated");
      setEditUser(null);
      refresh();
    } catch {
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (user: AdminUserRow) => {
    if (
      !canDeleteUserAsAdmin({
        userId: user._id,
        userRole: user.role,
        actorId,
        actorRole,
      })
    ) {
      if (user.role === "super_admin") {
        toast.error("Impossible de supprimer un super administrateur.");
      } else if (user.role === "admin") {
        toast.error("Seul un super administrateur peut supprimer un administrateur.");
      } else {
        toast.error("Vous ne pouvez pas supprimer ce compte.");
      }
      return;
    }

    const articleHint =
      user.articleCount > 0
        ? `\n\nCe compte a ${user.articleCount} article(s) lié(s). La suppression échouera si un article n'a que cet auteur comme signature.`
        : "";

    if (
      !confirm(
        `Supprimer ${user.name} (${user.email}) ? Cette action est irréversible.${articleHint}`
      )
    ) {
      return;
    }

    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id }),
    });
    if (res.ok) {
      toast.success("Utilisateur supprimé");
      setEditUser((current) => (current?._id === user._id ? null : current));
      refresh();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Échec de la suppression.");
    }
  };

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Users</div>
          <div className="vh2">
            {counts.all.toLocaleString("en-US")} accounts · {counts.editorial.toLocaleString("en-US")}{" "}
            editorial · {counts.admins.toLocaleString("en-US")} administrators
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-red" onClick={() => setCreateOpen(true)}>
            + Create user
          </button>
        </div>
      </div>

      <div className="card mb20">
        <div className="card-header">
          <span className="card-title">Editorial team</span>
        </div>
        <div className="card-body">
          <div className="ugrid">
            {editorialTeam.map((user) => (
              <div key={user._id} className="ucard-wrap">
                <button
                  type="button"
                  className="ucard"
                  onClick={() => setEditUser(user)}
                  title="Edit user"
                >
                  <div className="uav" style={{ background: authorAvatarGradient(user.name) }}>
                    {authorInitials(user.name)}
                  </div>
                  <div className="uname">{user.name}</div>
                  <div className="urole" style={{ color: ROLE_COLORS[user.role] ?? "var(--t3)" }}>
                    {CMS_ROLE_LABELS[user.role]}
                    {user.isBanned ? " · Banned" : ""}
                  </div>
                  <div className="ustats">
                    <div>
                      <div className="usv">{user.articleCount}</div>
                      <div className="usl">Articles</div>
                    </div>
                    <div>
                      <div className="usv">
                        {user.isPremium ? (
                          <Star size={14} className="cms-icon cms-icon--premium" aria-hidden />
                        ) : (
                          "—"
                        )}
                      </div>
                      <div className="usl">{user.isPremium ? "Premium" : "Standard"}</div>
                    </div>
                  </div>
                </button>
                {canDeleteUserAsAdmin({
                  userId: user._id,
                  userRole: user.role,
                  actorId,
                  actorRole,
                }) && (
                  <button
                    type="button"
                    className="ucard-del btn btn-ghost btn-xs btn-icon"
                    title="Supprimer l'utilisateur"
                    onClick={() => void removeMember(user)}
                  >
                    <CmsActionIcons.delete size={14} className="cms-icon cms-icon--error" aria-hidden />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="ucard ucard--invite" onClick={() => setCreateOpen(true)}>
              <div className="ucard-invite-icon">+</div>
              <div>Create user</div>
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        {FILTER_TABS.map((tab) => {
          const href = buildUsersHref({ filter: tab.id, q: query });
          const active = filter === tab.id;
          return (
            <Link key={tab.id} href={href} className={active ? "tab on" : "tab"}>
              {tab.label} ({counts[tab.countKey].toLocaleString("en-US")})
            </Link>
          );
        })}
      </div>

      <form className="fbar" action="/admin/users" method="get">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        <input
          className="input"
          type="search"
          name="q"
          placeholder="Search by name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search users"
        />
        <button type="submit" className="btn btn-out">
          Search
        </button>
        {query ? (
          <Link href={buildUsersHref({ filter })} className="btn btn-ghost">
            Clear
          </Link>
        ) : null}
      </form>

      <div className="card mb20">
        <div className="card-header">
          <span className="card-title">All accounts</span>
        </div>
        <div className="card-np">
          {users.length === 0 ? (
            <p className="cms-empty" style={{ padding: "1.5rem" }}>
              No users match this filter.
            </p>
          ) : (
            <CmsUsersTable
              users={users}
              page={page}
              totalPages={totalPages}
              totalFiltered={totalFiltered}
              baseHref={paginationBase}
              actorId={actorId}
              actorRole={actorRole}
              onEdit={setEditUser}
              onDelete={(user) => void removeMember(user)}
            />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Roles &amp; permissions matrix</span>
        </div>
        <div className="card-np">
          <table className="tbl">
            <thead>
              <tr>
                <th>Role</th>
                <th>CMS</th>
                <th>Write</th>
                <th>Publish</th>
                <th>Edit others</th>
                <th>Manage users</th>
                <th>Advertising</th>
                <th>Settings</th>
              </tr>
            </thead>
            <tbody>
              {roleMatrix.map((row) => (
                <tr key={row.role}>
                  <td style={{ fontWeight: 700, color: row.color }}>{row.label}</td>
                  <td>{matrixCell(row.cmsAccess)}</td>
                  <td>{matrixCell(row.write)}</td>
                  <td>{matrixCell(row.publish)}</td>
                  <td>{matrixCell(row.editOthers)}</td>
                  <td>{matrixCell(row.manageUsers)}</td>
                  <td>{matrixCell(row.manageAds)}</td>
                  <td>{matrixCell(row.manageSettings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CmsUserFormModal
        open={createOpen}
        mode="create"
        actorRole={actorRole}
        saving={saving}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => void createUser(values)}
      />

      <CmsUserFormModal
        open={editUser !== null}
        mode="edit"
        actorRole={actorRole}
        initial={
          editUser
            ? {
                name: editUser.name,
                email: editUser.email,
                role: editUser.role,
                isPremium: editUser.isPremium,
                isBanned: editUser.isBanned,
                image: editUser.image,
              }
            : undefined
        }
        canDelete={
          editUser
            ? canDeleteUserAsAdmin({
                userId: editUser._id,
                userRole: editUser.role,
                actorId,
                actorRole,
              })
            : false
        }
        articleCount={editUser?.articleCount ?? 0}
        saving={saving}
        onClose={() => setEditUser(null)}
        onSubmit={(values) => void updateUser(values)}
        onDelete={
          editUser
            ? () => {
                void removeMember(editUser);
              }
            : undefined
        }
      />
    </CmsPage>
  );
}
