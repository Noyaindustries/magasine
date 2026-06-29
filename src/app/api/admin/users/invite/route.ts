import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import type { UserRole } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["editor", "author", "contributor"]).default("author"),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();
  const email = parsed.data.email.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "This email is already in use." }, { status: 409 });
  }

  const tempPassword = randomBytes(6).toString("base64url");
  const hashed = await bcrypt.hash(tempPassword, 12);

  const user = await User.create({
    name: parsed.data.name.trim(),
    email,
    password: hashed,
    role: parsed.data.role as UserRole,
  });

  return NextResponse.json({
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    tempPassword,
  });
}
