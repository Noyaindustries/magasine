import Stripe from "stripe";

let cachedClient: Stripe | null = null;

export function getStripeSecretKey(): string {
  return (process.env.STRIPE_SECRET_KEY ?? "").trim();
}

export function isStripeConfigured(): boolean {
  return getStripeSecretKey().length > 0;
}

export function getStripeWebhookSecret(): string {
  return (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
}

/**
 * Returns a memoized Stripe client. Throws if the secret key is missing so
 * callers must gate on `isStripeConfigured()` before invoking it.
 */
export function getStripe(): Stripe {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  if (!cachedClient) {
    cachedClient = new Stripe(secretKey, {
      apiVersion: "2026-06-24.dahlia",
      appInfo: { name: "Global South Watch" },
    });
  }

  return cachedClient;
}
