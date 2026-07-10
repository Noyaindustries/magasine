"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";
import { AvatarUploadField } from "@/components/admin/AvatarUploadField";
import { getAssignableRoles } from "@/lib/user-roles";
import type { UserRole } from "@/types";

export interface CmsUserFormValues {
  name: string;
  email: string;
  role: UserRole;
  password: string;
  isPremium: boolean;
  isBanned: boolean;
  image: string;
}

interface CmsUserFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  actorRole: UserRole;
  initial?: {
    name: string;
    email: string;
    role: UserRole;
    isPremium: boolean;
    isBanned: boolean;
    image?: string;
  };
  canDelete?: boolean;
  articleCount?: number;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: CmsUserFormValues) => void;
  onDelete?: () => void;
}

const DEFAULT_ROLE: UserRole = "author";

export function CmsUserFormModal({
  open,
  mode,
  actorRole,
  initial,
  canDelete = false,
  articleCount = 0,
  saving = false,
  onClose,
  onSubmit,
  onDelete,
}: CmsUserFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(DEFAULT_ROLE);
  const [password, setPassword] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [image, setImage] = useState("");

  const assignableRoles = getAssignableRoles(actorRole);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setName(initial.name);
      setEmail(initial.email);
      setRole(initial.role);
      setPassword("");
      setIsPremium(initial.isPremium);
      setIsBanned(initial.isBanned);
      setImage(initial.image ?? "");
      return;
    }
    setName("");
    setEmail("");
    setRole(assignableRoles.includes(DEFAULT_ROLE) ? DEFAULT_ROLE : assignableRoles[0] ?? "reader");
    setPassword("");
    setIsPremium(false);
    setIsBanned(false);
    setImage("");
  }, [open, mode, initial, assignableRoles]);

  if (!open || !mounted) return null;

  const title = mode === "create" ? "Create user" : "Edit user";
  const submitLabel = mode === "create" ? "Create user" : "Save changes";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ name, email, role, password, isPremium, isBanned, image });
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

            <AvatarUploadField
              label="Photo"
              value={image}
              onChange={setImage}
              disabled={saving}
            />

            {mode === "create" ? (
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
            ) : (
              <div className="admin-field">
                <span className="admin-field-label">Email</span>
                <p className="cms-field-hint" style={{ margin: 0 }}>
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
                disabled={saving || (mode === "edit" && initial?.role === "super_admin" && actorRole !== "super_admin")}
              >
                {assignableRoles.map((option) => (
                  <option key={option} value={option}>
                    {CMS_ROLE_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            {mode === "create" ? (
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
            ) : (
              <div className="admin-field">
                <label htmlFor="user-password-reset">New password (optional)</label>
                <input
                  id="user-password-reset"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Leave empty to keep current password"
                  disabled={saving}
                />
              </div>
            )}

            {mode === "edit" && (
              <>
                <div className="admin-field">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      disabled={saving}
                    />
                    Premium subscriber
                  </label>
                  <p className="cms-field-hint">Grants access to premium articles on the public site.</p>
                </div>
                <div className="admin-field">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isBanned}
                      onChange={(e) => setIsBanned(e.target.checked)}
                      disabled={saving || initial?.role === "super_admin"}
                    />
                    Banned
                  </label>
                  <p className="cms-field-hint">Banned users cannot sign in.</p>
                </div>
              </>
            )}
          </div>
          <div className="admin-modal-footer" style={{ justifyContent: "space-between" }}>
            <div>
              {mode === "edit" && canDelete && onDelete ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ color: "var(--cms-red)" }}
                  onClick={onDelete}
                  disabled={saving}
                >
                  Supprimer
                </button>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
                Annuler
              </button>
              <button type="submit" className="btn btn-red" disabled={saving}>
                {saving ? "Enregistrement…" : submitLabel}
              </button>
            </div>
          </div>
          {mode === "edit" && articleCount > 0 ? (
            <p className="cms-field-hint" style={{ padding: "0 1.25rem 1rem", margin: 0 }}>
              {articleCount} article(s) lié(s) via le profil auteur. La suppression échouera si un
              article n&apos;a que cet auteur.
            </p>
          ) : null}
        </form>
      </div>
    </div>,
    document.body
  );
}
