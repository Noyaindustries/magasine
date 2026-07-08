import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { createUserAsAdmin } from "@/lib/admin-create-user";
import { deleteUserAsAdmin, updateUserAsAdmin } from "@/lib/admin-update-user";
import { getAdminUsers, type UserListFilter } from "@/lib/admin-users";
import { USER_ROLES, assertCanAssignRole } from "@/lib/user-roles";
import { imageSrcField } from "@/lib/image-src";
import type { UserRole } from "@/types";

const roleEnum = z.enum(USER_ROLES as [UserRole, ...UserRole[]]);

const filterEnum = z.enum(["all", "editorial", "readers", "banned", "premium"]);

const createSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: roleEnum,
  password: z.string().min(8).optional(),
  image: imageSrcField,
});

const patchSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).max(100).optional(),
  role: roleEnum.optional(),
  isPremium: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  password: z.string().min(8).optional(),
  image: imageSrcField,
});

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  await connectDB();

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const filterParam = request.nextUrl.searchParams.get("filter") ?? "all";
  const filterParsed = filterEnum.safeParse(filterParam);
  const filter: UserListFilter = filterParsed.success ? filterParsed.data : "all";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);

  const result = await getAdminUsers({ q, filter, page });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();
  const result = await createUserAsAdmin({
    ...parsed.data,
    actorRole: guard.session!.user.role,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json(result.user, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  if (parsed.data.role) {
    const roleError = assertCanAssignRole(guard.session!.user.role, parsed.data.role);
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 });
    }
  }

  await connectDB();
  const result = await updateUserAsAdmin({
    userId: parsed.data.userId,
    actorId: guard.session!.user.id,
    actorRole: guard.session!.user.role,
    name: parsed.data.name,
    role: parsed.data.role,
    isPremium: parsed.data.isPremium,
    isBanned: parsed.data.isBanned,
    password: parsed.data.password,
    image: parsed.data.image,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json(result.user);
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = z.object({ userId: z.string() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();
  const result = await deleteUserAsAdmin({
    userId: parsed.data.userId,
    actorId: guard.session!.user.id,
    actorRole: guard.session!.user.role,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ success: true });
}
