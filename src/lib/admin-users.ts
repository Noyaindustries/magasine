import mongoose from "mongoose";
import { User } from "@/models/User";
import { Author } from "@/models/Author";
import { Article } from "@/models/Article";
import { EDITORIAL_ROLES } from "@/lib/user-roles";
import { USERS_PAGE_SIZE } from "@/lib/pagination";
import { buildCaseInsensitiveRegex } from "@/lib/mongo-regex";
import type { UserRole } from "@/types";

export type UserListFilter = "all" | "editorial" | "readers" | "banned" | "premium";

export interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isPremium: boolean;
  isBanned: boolean;
  image: string;
  articleCount: number;
  createdAt: string;
}

export interface AdminUserCounts {
  all: number;
  editorial: number;
  readers: number;
  banned: number;
  premium: number;
  admins: number;
}

export interface AdminUsersQuery {
  q?: string;
  filter?: UserListFilter;
  page?: number;
}

export interface AdminUsersResult {
  users: AdminUserRow[];
  counts: AdminUserCounts;
  editorialTeam: AdminUserRow[];
  page: number;
  totalPages: number;
  totalFiltered: number;
  filter: UserListFilter;
  query?: string;
}

async function getArticleCountByEmail(): Promise<Map<string, number>> {
  const authors = await Author.find({ email: { $exists: true, $ne: "" } })
    .select("email _id")
    .lean();

  if (authors.length === 0) {
    return new Map();
  }

  const authorIds = authors.map((author) => author._id);
  const emailByAuthorId = new Map(
    authors.map((author) => [String(author._id), author.email!.toLowerCase().trim()])
  );

  const counts = await Article.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $unwind: "$authors" },
    { $match: { authors: { $in: authorIds } } },
    { $group: { _id: "$authors", count: { $sum: 1 } } },
  ]);

  const emailCounts = new Map<string, number>();
  for (const row of counts) {
    const email = emailByAuthorId.get(String(row._id));
    if (!email) continue;
    emailCounts.set(email, (emailCounts.get(email) ?? 0) + row.count);
  }

  return emailCounts;
}

function buildMongoFilter(query?: string, filter: UserListFilter = "all"): Record<string, unknown> {
  const mongoFilter: Record<string, unknown> = {};

  if (query?.trim()) {
    const termRegex = buildCaseInsensitiveRegex(query);
    if (termRegex) {
      mongoFilter.$or = [{ name: termRegex }, { email: termRegex }];
    }
  }

  switch (filter) {
    case "editorial":
      mongoFilter.role = { $in: EDITORIAL_ROLES };
      break;
    case "readers":
      mongoFilter.role = "reader";
      break;
    case "banned":
      mongoFilter.isBanned = true;
      break;
    case "premium":
      mongoFilter.isPremium = true;
      break;
    default:
      break;
  }

  return mongoFilter;
}

function mapUserRow(
  user: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: UserRole;
    isPremium: boolean;
    isBanned?: boolean;
    image?: string;
    createdAt: Date;
  },
  articleCountByEmail: Map<string, number>
): AdminUserRow {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isPremium: user.isPremium,
    isBanned: user.isBanned ?? false,
    image: user.image ?? "",
    articleCount: articleCountByEmail.get(user.email.toLowerCase().trim()) ?? 0,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getAdminUsers(params: AdminUsersQuery = {}): Promise<AdminUsersResult> {
  const filter = params.filter ?? "all";
  const page = Math.max(1, params.page ?? 1);
  const mongoFilter = buildMongoFilter(params.q, filter);
  const skip = (page - 1) * USERS_PAGE_SIZE;

  const [articleCountByEmail, usersRaw, totalFiltered, countAll, countEditorial, countReaders, countBanned, countPremium, countAdmins, editorialRaw] =
    await Promise.all([
      getArticleCountByEmail(),
      User.find(mongoFilter)
        .select("name email role isPremium isBanned image createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(USERS_PAGE_SIZE)
        .lean(),
      User.countDocuments(mongoFilter),
      User.countDocuments(),
      User.countDocuments({ role: { $in: EDITORIAL_ROLES } }),
      User.countDocuments({ role: "reader" }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isPremium: true }),
      User.countDocuments({ role: { $in: ["super_admin", "admin"] } }),
      User.find({ role: { $in: EDITORIAL_ROLES } })
        .select("name email role isPremium isBanned image createdAt")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

  const users = usersRaw.map((user) => mapUserRow(user, articleCountByEmail));
  const editorialTeam = editorialRaw.map((user) => mapUserRow(user, articleCountByEmail));

  return {
    users,
    counts: {
      all: countAll,
      editorial: countEditorial,
      readers: countReaders,
      banned: countBanned,
      premium: countPremium,
      admins: countAdmins,
    },
    editorialTeam,
    page,
    totalPages: Math.max(1, Math.ceil(totalFiltered / USERS_PAGE_SIZE)),
    totalFiltered,
    filter,
    query: params.q?.trim() || undefined,
  };
}

export async function countUserArticlesByEmail(email: string): Promise<number> {
  const normalized = email.toLowerCase().trim();
  const author = await Author.findOne({ email: normalized }).select("_id").lean();
  if (!author) return 0;
  return Article.countDocuments({ authors: author._id });
}
