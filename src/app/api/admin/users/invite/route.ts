import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { createUserAsAdmin } from "@/lib/admin-create-user";
import { resendUserInviteAsAdmin } from "@/lib/admin-resend-user-invite";
import { USER_ROLES } from "@/lib/user-roles";
import type { UserRole } from "@/types";

const legacyCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(USER_ROLES as [UserRole, ...UserRole[]]).default("author"),
  password: z.string().min(8).optional(),
});

const resendSchema = z.object({
  userId: z.string().min(1),
});

/** Renvoyer une invitation (nouveau mot de passe temporaire par e-mail). */
export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();

  const resendParsed = resendSchema.safeParse(body);
  if (resendParsed.success) {
    await connectDB();
    const result = await resendUserInviteAsAdmin({
      userId: resendParsed.data.userId,
      actorRole: guard.session!.user.role,
      inviterName: guard.session!.user.name ?? undefined,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json(result.result);
  }

  const legacyParsed = legacyCreateSchema.safeParse(body);
  if (!legacyParsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();
  const result = await createUserAsAdmin({
    ...legacyParsed.data,
    actorRole: guard.session!.user.role,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json(result.user);
}
