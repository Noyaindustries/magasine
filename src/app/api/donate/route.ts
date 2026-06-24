import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DONATION_CURRENCY, DONATION_MIN_AMOUNT } from "@/lib/donation";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/Donation";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  amount: z
    .number()
    .min(DONATION_MIN_AMOUNT, `Minimum donation is $${DONATION_MIN_AMOUNT} USD`)
    .max(100_000),
  frequency: z.enum(["one-time", "monthly"]),
  message: z.string().trim().max(500).optional(),
  coverFees: z.boolean().optional(),
  anonymous: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    await connectDB();
    await Donation.create({
      name: parsed.data.name,
      email: parsed.data.email,
      amount: parsed.data.amount,
      currency: DONATION_CURRENCY,
      frequency: parsed.data.frequency,
      message: parsed.data.message,
      coverFees: parsed.data.coverFees ?? false,
      anonymous: parsed.data.anonymous ?? false,
      status: "pledged",
    });

    return NextResponse.json(
      {
        success: true,
        currency: DONATION_CURRENCY,
        message:
          "Thank you for your support. In production, you would be redirected to a secure USD checkout.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
