import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  password: z
    .string()
    .min(12)
    .max(128)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { prefix: "register", max: 10, windowMs: 3600_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectDB();
    const email = parsed.data.email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await User.create({
      name: parsed.data.name,
      email,
      password: hashed,
      role: "reader",
    });

    return NextResponse.json({ message: "Account created" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
