"use client";

import { useEffect, useState } from "react";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { formatDate } from "@/lib/utils";
import type { UserRole } from "@/types";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isPremium: boolean;
  createdAt: string;
}

const ROLES: UserRole[] = [
  "super_admin",
  "admin",
  "editor",
  "author",
  "contributor",
  "reader",
];

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  admin: "Administrator",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  reader: "Reader",
};

export function UsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateUser = async (userId: string, patch: { role?: UserRole; isPremium?: boolean }) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...patch }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Update failed");
      return;
    }
    load();
  };

  const premiumCount = users.filter((u) => u.isPremium).length;

  return (
    <AdminSectionShell
      eyebrow="Access control"
      title={
        <>
          Users & <em>roles</em>
        </>
      }
      description="Manage registered accounts, editorial roles, and premium subscriber access."
      pulse="blue"
      stats={[
        { value: users.length, label: "Accounts" },
        { value: premiumCount, label: "Premium" },
      ]}
    >
      {loading ? (
        <p className="adm-loading">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="adm-empty">No users found.</p>
      ) : (
        <div className="adm-panel adm-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Premium</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="font-medium">{user.name}</td>
                  <td className="text-muted">{user.email}</td>
                  <td>
                    <select
                      className="admin-select"
                      value={user.role}
                      onChange={(e) => updateUser(user._id, { role: e.target.value as UserRole })}
                      aria-label={`Role for ${user.name}`}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label className="adm-toggle-item" style={{ padding: "8px 12px", display: "inline-flex" }}>
                      <input
                        type="checkbox"
                        checked={user.isPremium}
                        onChange={(e) => updateUser(user._id, { isPremium: e.target.checked })}
                        aria-label={`Premium for ${user.name}`}
                      />
                      {user.isPremium ? "Yes" : "No"}
                    </label>
                  </td>
                  <td className="text-muted text-sm">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminSectionShell>
  );
}
