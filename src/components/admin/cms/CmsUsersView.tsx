"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons, Check, Star } from "@/components/admin/cms/CmsIcons";
import { CmsUserFormModal, type CmsUserFormValues } from "@/components/admin/cms/CmsUserFormModal";
import { CMS_ROLE_MATRIX } from "@/lib/cms-mock-data";
import { toast } from "@/lib/toast";
import { toastNetworkError } from "@/lib/api-toast";
import { authorAvatarGradient, authorInitials } from "@/components/admin/cms/cms-ui";
import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";
import { EDITORIAL_ROLES } from "@/lib/user-roles";
import type { UserRole } from "@/types";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isPremium: boolean;
  isBanned: boolean;
  articleCount: number;
  createdAt: string;
}

type UserFilter = "all" | "editorial" | "readers";

const ROLE_COLORS: Partial<Record<UserRole, string>> = {
  super_admin: "var(--cms-red)",
  admin: "var(--cms-red)",
  editor: "var(--purple)",
  author: "var(--blue)",
  contributor: "var(--amber)",
  reader: "var(--t3)",
};

interface CmsUsersViewProps {
  actorRole: UserRole;
}

function matrixCell(value: boolean | "own" | string) {
  if (value === true) {
    return (
      <span className="cms-matrix-yes">
        <Check size={14} aria-hidden />
      </span>
    );
  }
  if (value === "own") return <span className="cms-matrix-own">Own articles</span>;
  return <span className="cms-matrix-no">—</span>;
}

function fetchAdminUsers() {
  return fetch("/api/admin/users")
    .then((r) => r.json())
    .then((data) => (data.users ?? []) as UserRow[]);
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function CmsUsersView({ actorRole }: CmsUsersViewProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UserFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void fetchAdminUsers()
      .then(setUsers)
      .catch(() => toastNetworkError())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminUsers()
      .then((rows) => {
        if (!cancelled) setUsers(rows);
      })
      .catch(() => {
        if (!cancelled) toastNetworkError();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    if (filter === "editorial") {
      return users.filter((u) => EDITORIAL_ROLES.includes(u.role));
    }
    if (filter === "readers") {
      return users.filter((u) => u.role === "reader");
    }
    return users;
  }, [users, filter]);

  const editorial = users.filter((u) => EDITORIAL_ROLES.includes(u.role));

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
      load();
    } catch {
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (values: CmsUserFormValues) => {
    if (!editUser || values.role === editUser.role) {
      setEditUser(null);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editUser._id, role: values.role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update role.");
        return;
      }
      toast.success("Role updated");
      setEditUser(null);
      load();
    } catch {
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (user: UserRow) => {
    if (user.role === "super_admin") {
      toast.error("Cannot remove a super administrator.");
      return;
    }
    if (!confirm(`Remove ${user.name} from the team?`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id }),
    });
    if (res.ok) {
      toast.success("User removed");
      load();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Delete failed.");
    }
  };

  const canRemoveMember = (user: UserRow) => user.role !== "super_admin";

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Users</div>
          <div className="vh2">
            {users.length} accounts · {editorial.length} editorial ·{" "}
            {users.filter((u) => u.role === "super_admin" || u.role === "admin").length} administrators
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-red" onClick={() => setCreateOpen(true)}>
            + Create user
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Editorial team</span>
        </div>
        <div className="card-body">
          {loading ? (
            <p className="cms-empty">Loading team…</p>
          ) : (
            <div className="ugrid">
              {editorial.slice(0, 6).map((user, index) => (
                <div key={user._id} className="ucard-wrap">
                  <button
                    type="button"
                    className="ucard"
                    onClick={() => setEditUser(user)}
                    title="Change role"
                  >
                    <div className="uav" style={{ background: authorAvatarGradient(user.name) }}>
                      {index < 3 && <div className="uonline" />}
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
                  {canRemoveMember(user) && (
                    <button
                      type="button"
                      className="ucard-del btn btn-ghost btn-xs btn-icon"
                      title="Remove user"
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
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All accounts</span>
          <div className="card-actions" style={{ display: "flex", gap: 6 }}>
            {(["all", "editorial", "readers"] as UserFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`btn btn-xs btn-ghost${filter === key ? " is-active" : ""}`}
                onClick={() => setFilter(key)}
              >
                {key === "all" ? "All" : key === "editorial" ? "Editorial" : "Readers"}
              </button>
            ))}
          </div>
        </div>
        <div className="card-np">
          {loading ? (
            <p className="cms-empty" style={{ padding: "1.5rem" }}>
              Loading users…
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="cms-empty" style={{ padding: "1.5rem" }}>
              No users match this filter.
            </p>
          ) : (
            <table className="tbl tbl-compact">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Articles</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <strong>{user.name}</strong>
                      {user.isPremium ? (
                        <span className="cms-field-hint" style={{ marginLeft: 8 }}>
                          Premium
                        </span>
                      ) : null}
                    </td>
                    <td>{user.email}</td>
                    <td style={{ color: ROLE_COLORS[user.role] ?? "inherit", fontWeight: 600 }}>
                      {CMS_ROLE_LABELS[user.role]}
                    </td>
                    <td>{user.articleCount}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="tbl-actions">
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          onClick={() => setEditUser(user)}
                        >
                          Role
                        </button>
                        {canRemoveMember(user) ? (
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost"
                            onClick={() => void removeMember(user)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <th>Write</th>
                <th>Publish</th>
                <th>Edit others</th>
                <th>Manage users</th>
                <th>Advertising</th>
                <th>Settings</th>
              </tr>
            </thead>
            <tbody>
              {CMS_ROLE_MATRIX.map((row) => (
                <tr key={row.role}>
                  <td style={{ fontWeight: 700, color: row.color }}>{row.role}</td>
                  <td>{matrixCell(row.write)}</td>
                  <td>{matrixCell(row.publish)}</td>
                  <td>{matrixCell(row.editOthers)}</td>
                  <td>{matrixCell(row.users)}</td>
                  <td>{matrixCell(row.ads)}</td>
                  <td>{matrixCell(row.settings)}</td>
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
        mode="edit-role"
        actorRole={actorRole}
        initial={
          editUser
            ? { name: editUser.name, email: editUser.email, role: editUser.role }
            : undefined
        }
        saving={saving}
        onClose={() => setEditUser(null)}
        onSubmit={(values) => void updateRole(values)}
      />
    </CmsPage>
  );
}
