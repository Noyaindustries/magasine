import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { createUserAsAdmin } from "@/lib/admin-create-user";
import { USER_ROLES } from "@/lib/user-roles";
import type { UserRole } from "@/types";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(USER_ROLES as [UserRole, ...UserRole[]]).default("author"),
  password: z.string().min(8).optional(),
});

/** @deprecated Prefer POST /api/admin/users */
export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
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

  return NextResponse.json(result.user);
}
