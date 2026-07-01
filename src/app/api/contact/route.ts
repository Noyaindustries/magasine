import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { prefix: "contact", max: 5, windowMs: 3600_000 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid form" }, { status: 400 });
    }

    await connectDB();
    // En production : envoi email via SendGrid/Resend
    console.info("[contact]", parsed.data);

    return NextResponse.json({
      success: true,
      message: "Your message has been sent. We will reply within 48 hours.",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
