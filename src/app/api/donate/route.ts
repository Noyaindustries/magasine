import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DONATION_CURRENCY, DONATION_MIN_AMOUNT } from "@/lib/donation";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/Donation";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site";
import { enforceRateLimit } from "@/lib/rate-limit";

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
  const limited = enforceRateLimit(request, {
    prefix: "donate",
    max: 10,
    windowMs: 3600_000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Invalid data";
      return NextResponse.json({ error: first }, { status: 400 });
    }

    const data = parsed.data;

    await connectDB();
    const donation = await Donation.create({
      name: data.name,
      email: data.email,
      amount: data.amount,
      currency: DONATION_CURRENCY,
      frequency: data.frequency,
      message: data.message,
      coverFees: data.coverFees ?? false,
      anonymous: data.anonymous ?? false,
      status: "pledged",
    });

    // Demo mode: no Stripe key configured — keep the pledge, skip real payment.
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          success: true,
          mode: "demo",
          currency: DONATION_CURRENCY,
          message:
            "Thank you for your support. In production, you would be redirected to a secure USD checkout.",
        },
        { status: 201 }
      );
    }

    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const isMonthly = data.frequency === "monthly";
    const unitAmount = Math.round(data.amount * 100);
    const donationId = String(donation._id);

    const session = await stripe.checkout.sessions.create({
      mode: isMonthly ? "subscription" : "payment",
      customer_email: data.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DONATION_CURRENCY.toLowerCase(),
            unit_amount: unitAmount,
            ...(isMonthly ? { recurring: { interval: "month" as const } } : {}),
            product_data: {
              name: isMonthly ? "Monthly donation — Global South Watch" : "Donation — Global South Watch",
            },
          },
        },
      ],
      metadata: { donationId },
      ...(isMonthly
        ? { subscription_data: { metadata: { donationId } } }
        : { payment_intent_data: { metadata: { donationId } } }),
      success_url: `${siteUrl}/donate?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/donate?donation=cancelled`,
    });

    donation.stripeSessionId = session.id;
    await donation.save();

    return NextResponse.json(
      {
        success: true,
        mode: "stripe",
        url: session.url,
        currency: DONATION_CURRENCY,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
