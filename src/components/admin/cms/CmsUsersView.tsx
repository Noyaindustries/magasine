"use client";

import { useCallback, useEffect, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons, Check, Star } from "@/components/admin/cms/CmsIcons";
import { CMS_ROLE_MATRIX } from "@/lib/cms-mock-data";
import { toast } from "@/lib/toast";
import { authorAvatarGradient, authorInitials } from "@/components/admin/cms/cms-ui";
import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";
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

const ROLE_COLORS: Partial<Record<UserRole, string>> = {
  super_admin: "var(--cms-red)",
  admin: "var(--cms-red)",
  editor: "var(--purple)",
  author: "var(--blue)",
  contributor: "var(--amber)",
  reader: "var(--t3)",
};

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

export function CmsUsersView() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void fetchAdminUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminUsers()
      .then((rows) => {
        if (!cancelled) setUsers(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const inviteMember = async () => {
    const name = window.prompt("Member name");
    if (!name?.trim()) return;
    const email = window.prompt("Email address");
    if (!email?.trim()) return;
    const role = window.prompt("Role (editor, author, contributor)", "author") ?? "author";

    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Invitation failed");
      return;
    }
    toast.success("Member created", {
      description: `Email: ${data.email} · Temporary password: ${data.tempPassword}`,
      duration: 8000,
    });
    load();
  };

  const changeRole = async (user: UserRow) => {
    const role = window.prompt(
      `New role for ${user.name} (editor, author, contributor, admin)`,
      user.role
    );
    if (!role || role === user.role) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, role }),
    });
    if (res.ok) {
      toast.success("Role updated");
      load();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Update failed");
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
      toast.success("Member removed from team");
      load();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Delete failed.");
    }
  };

  const canRemoveMember = (user: UserRow) => user.role !== "super_admin";

  const editorial = users.filter((u) =>
    ["super_admin", "admin", "editor", "author", "contributor"].includes(u.role)
  );

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Editorial team</div>
          <div className="vh2">
            {editorial.length} members ·{" "}
            {users.filter((u) => u.role === "super_admin" || u.role === "admin").length} administrators
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-red" onClick={() => void inviteMember()}>
            + Invite member
          </button>
        </div>
      </div>

      {loading ? (
        <p className="cms-empty">Loading team…</p>
      ) : (
        <div className="ugrid">
          {editorial.slice(0, 6).map((user, index) => (
            <div key={user._id} className="ucard-wrap">
              <button
                type="button"
                className="ucard"
                onClick={() => void changeRole(user)}
                title="Click to change role"
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
                  title="Remove member"
                  onClick={() => void removeMember(user)}
                >
                  <CmsActionIcons.delete size={14} className="cms-icon cms-icon--error" aria-hidden />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="ucard ucard--invite" onClick={() => void inviteMember()}>
            <div className="ucard-invite-icon">+</div>
            <div>Invite member</div>
          </button>
        </div>
      )}

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
    </CmsPage>
  );
}
