"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";
import { getAssignableRoles } from "@/lib/user-roles";
import type { UserRole } from "@/types";

export interface CmsUserFormValues {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

interface CmsUserFormModalProps {
  open: boolean;
  mode: "create" | "edit-role";
  actorRole: UserRole;
  initial?: { name: string; email: string; role: UserRole };
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: CmsUserFormValues) => void;
}

const DEFAULT_ROLE: UserRole = "author";

export function CmsUserFormModal({
  open,
  mode,
  actorRole,
  initial,
  saving = false,
  onClose,
  onSubmit,
}: CmsUserFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(DEFAULT_ROLE);
  const [password, setPassword] = useState("");

  const assignableRoles = getAssignableRoles(actorRole);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit-role" && initial) {
      setName(initial.name);
      setEmail(initial.email);
      setRole(initial.role);
      setPassword("");
      return;
    }
    setName("");
    setEmail("");
    setRole(assignableRoles.includes(DEFAULT_ROLE) ? DEFAULT_ROLE : assignableRoles[0] ?? "reader");
    setPassword("");
  }, [open, mode, initial, assignableRoles]);

  if (!open || !mounted) return null;

  const title = mode === "create" ? "Create user" : "Change role";
  const submitLabel = mode === "create" ? "Create user" : "Save role";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ name, email, role, password });
  };

  return createPortal(
    <div className="admin-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="cms-user-modal-title"
      >
        <form onSubmit={handleSubmit}>
          <div className="admin-modal-header">
            <h2 id="cms-user-modal-title">{title}</h2>
          </div>
          <div className="admin-modal-body admin-form-grid">
            {mode === "create" ? (
              <>
                <div className="admin-field">
                  <label htmlFor="user-name">Full name</label>
                  <input
                    id="user-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    autoComplete="name"
                    disabled={saving}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="user-email">Email</label>
                  <input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={saving}
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="user-password">Password (optional)</label>
                  <input
                    id="user-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Leave empty to generate one"
                    disabled={saving}
                  />
                  <p className="cms-field-hint">
                    If empty, a temporary password is generated and shown once after creation.
                  </p>
                </div>
              </>
            ) : (
              <div className="admin-field">
                <span className="admin-field-label">User</span>
                <p className="cms-field-hint" style={{ margin: 0 }}>
                  <strong>{initial?.name}</strong>
                  <br />
                  {initial?.email}
                </p>
              </div>
            )}
            <div className="admin-field">
              <label htmlFor="user-role">Role</label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
                disabled={saving}
              >
                {assignableRoles.map((option) => (
                  <option key={option} value={option}>
                    {CMS_ROLE_LABELS[option]}
                  </option>
                ))}
              </select>
              <p className="cms-field-hint">
                {role === "reader"
                  ? "Readers can sign in and access the public reader space."
                  : "Editorial roles can access the CMS according to their permissions."}
              </p>
            </div>
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-red" disabled={saving}>
              {saving ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
