import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/Donation";
import { getStripe, getStripeWebhookSecret, isStripeConfigured } from "@/lib/stripe";

async function markDonation(
  donationId: string | undefined,
  status: "completed" | "failed",
  extra: Partial<{
    stripePaymentIntentId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
  }> = {}
) {
  if (!donationId) return;
  await connectDB();
  const donation = await Donation.findById(donationId);
  if (!donation) return;
  donation.status = status;
  if (extra.stripePaymentIntentId) donation.stripePaymentIntentId = extra.stripePaymentIntentId;
  if (extra.stripeSubscriptionId) donation.stripeSubscriptionId = extra.stripeSubscriptionId;
  if (extra.stripeCustomerId) donation.stripeCustomerId = extra.stripeCustomerId;
  await donation.save();
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // For subscriptions, wait for the invoice to be paid before completing.
        if (session.mode === "subscription" && session.payment_status !== "paid") {
          break;
        }
        await markDonation(session.metadata?.donationId, "completed", {
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : undefined,
          stripeCustomerId:
            typeof session.customer === "string" ? session.customer : undefined,
        });
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        await markDonation(session.metadata?.donationId, "failed");
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
