import Link from "next/link";
import type { AdminUserRow } from "@/lib/admin-users";
import { CMS_ROLE_LABELS } from "@/components/admin/cms/cms-nav";
import {
  buildPageHref,
  getPaginationItems,
  userPaginationRangeLabel,
  USERS_PAGE_SIZE,
} from "@/lib/pagination";
import { canDeleteUserAsAdmin } from "@/lib/admin-user-permissions";
import type { UserRole } from "@/types";

const ROLE_COLORS: Partial<Record<UserRole, string>> = {
  super_admin: "var(--cms-red)",
  admin: "var(--cms-red)",
  editor: "var(--purple)",
  author: "var(--blue)",
  contributor: "var(--amber)",
  reader: "var(--t3)",
};

interface CmsUsersTableProps {
  users: AdminUserRow[];
  page: number;
  totalPages: number;
  totalFiltered: number;
  baseHref: string;
  actorId: string;
  actorRole: UserRole;
  onEdit: (user: AdminUserRow) => void;
  onDelete: (user: AdminUserRow) => void;
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

function canDeleteUser(user: AdminUserRow, actorId: string, actorRole: UserRole): boolean {
  return canDeleteUserAsAdmin({
    userId: user._id,
    userRole: user.role,
    actorId,
    actorRole,
  });
}

export function CmsUsersTable({
  users,
  page,
  totalPages,
  totalFiltered,
  baseHref,
  actorId,
  actorRole,
  onEdit,
  onDelete,
}: CmsUsersTableProps) {
  const paginationItems = getPaginationItems(page, totalPages);

  return (
    <>
      <table className="tbl tbl-compact">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Articles</th>
            <th>Joined</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className={user.isBanned ? "tbl-row--muted" : undefined}>
              <td>
                <strong>{user.name}</strong>
              </td>
              <td>{user.email}</td>
              <td style={{ color: ROLE_COLORS[user.role] ?? "inherit", fontWeight: 600 }}>
                {CMS_ROLE_LABELS[user.role]}
              </td>
              <td>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {user.isPremium ? (
                    <span className="badge" style={{ background: "var(--amber)", color: "#1a1a1a" }}>
                      Premium
                    </span>
                  ) : null}
                  {user.isBanned ? (
                    <span className="badge" style={{ background: "var(--cms-red)", color: "#fff" }}>
                      Banned
                    </span>
                  ) : null}
                  {!user.isPremium && !user.isBanned ? (
                    <span className="cms-field-hint">Active</span>
                  ) : null}
                </div>
              </td>
              <td>{user.articleCount}</td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <div className="tbl-actions">
                  <button type="button" className="btn btn-xs btn-ghost" onClick={() => onEdit(user)}>
                    Edit
                  </button>
                  {canDeleteUser(user, actorId, actorRole) ? (
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={() => onDelete(user)}
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pag">
          <div className="paginfo">
            {userPaginationRangeLabel(page, USERS_PAGE_SIZE, totalFiltered)} · Page {page} of {totalPages}
          </div>
          <div className="pagbtns">
            {page > 1 ? (
              <Link href={buildPageHref(baseHref, page - 1)} className="pagb" aria-label="Previous page">
                ←
              </Link>
            ) : (
              <span className="pagb pagb--disabled" aria-hidden>
                ←
              </span>
            )}

            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="pagdots" aria-hidden>
                  …
                </span>
              ) : item === page ? (
                <span key={item} className="pagb on" aria-current="page">
                  {item}
                </span>
              ) : (
                <Link key={item} href={buildPageHref(baseHref, item)} className="pagb">
                  {item}
                </Link>
              )
            )}

            {page < totalPages ? (
              <Link href={buildPageHref(baseHref, page + 1)} className="pagb" aria-label="Next page">
                →
              </Link>
            ) : (
              <span className="pagb pagb--disabled" aria-hidden>
                →
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
