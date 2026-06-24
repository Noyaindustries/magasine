export const DONATION_CURRENCY = "USD" as const;

export const DONATION_PRESETS = [15, 35, 75, 150] as const;

export const DONATION_MIN_AMOUNT = 1;

export const DONATION_IMPACT = [
  { amount: 15, text: "Funds one field dispatch from a regional correspondent" },
  { amount: 35, text: "Supports a week of fact-checking for an investigation" },
  { amount: 75, text: "Helps produce a video report from the Global South" },
  { amount: 150, text: "Sponsors an in-depth regional dossier" },
] as const;

export const DONATION_STATS = [
  { value: "42", label: "Countries covered" },
  { value: "120+", label: "Regional correspondents" },
  { value: "0", label: "Paywalls on breaking news" },
] as const;

export const DONATION_USES = [
  {
    title: "Field reporting",
    text: "Send journalists to conflict zones, elections, and climate frontlines across the Global South.",
  },
  {
    title: "Investigations",
    text: "Fund months-long probes into corruption, resource extraction, and public accountability.",
  },
  {
    title: "Local languages",
    text: "Translate and distribute stories in French, Arabic, Portuguese, and indigenous languages.",
  },
  {
    title: "Early-career talent",
    text: "Train the next generation of reporters through fellowships and newsroom mentorship.",
  },
] as const;

export const DONATION_TIERS = [
  {
    id: "reader",
    name: "Reader",
    amount: 5,
    frequency: "monthly" as const,
    blurb: "Keep daily coverage free for everyone.",
    perks: ["Weekly newsletter", "Reader badge on profile"],
    featured: false,
  },
  {
    id: "ally",
    name: "Ally",
    amount: 15,
    frequency: "monthly" as const,
    blurb: "Back correspondents on the ground.",
    perks: ["All Reader perks", "Early access to investigations"],
    featured: true,
  },
  {
    id: "champion",
    name: "Champion",
    amount: 50,
    frequency: "monthly" as const,
    blurb: "Power multimedia and video reporting.",
    perks: ["All Ally perks", "Quarterly newsroom briefing"],
    featured: false,
  },
  {
    id: "patron",
    name: "Patron",
    amount: 150,
    frequency: "monthly" as const,
    blurb: "Sponsor major cross-border series.",
    perks: ["All Champion perks", "Named credit on a special report"],
    featured: false,
  },
] as const;

export const DONATION_FAQ = [
  {
    q: "Is my donation tax-deductible?",
    a: "Global South Watch is working toward registered nonprofit status in the United States. Tax receipts will be issued once our 501(c)(3) application is approved. Until then, your gift is recorded and acknowledged by email.",
  },
  {
    q: "Can I give in USD from outside the United States?",
    a: "Yes. All amounts are charged in U.S. dollars (USD). Your bank or card issuer may apply a conversion fee if your account uses another currency.",
  },
  {
    q: "How do I cancel a monthly gift?",
    a: "Email donate@globalsouthwatch.org with the address used at checkout. When live payments are enabled, you will also manage subscriptions from your donor portal.",
  },
  {
    q: "Do you accept wire transfers or checks?",
    a: "For gifts above $1,000, contact our partnerships desk at donate@globalsouthwatch.org for wire instructions or mailing details.",
  },
] as const;

export const DONATION_TRUST = [
  "SSL-encrypted checkout (Stripe in production)",
  "No ads on breaking news",
  "Editorial firewall — funders never influence coverage",
  "Transparent allocation published annually",
] as const;

export function formatDonationAmount(
  amount: number,
  options?: { frequency?: "one-time" | "monthly"; compact?: boolean }
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: DONATION_CURRENCY,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);

  if (options?.frequency === "monthly") {
    return `${formatted}/mo`;
  }
  return formatted;
}

export function getDonationImpact(amount: number): string | undefined {
  return DONATION_IMPACT.filter((item) => item.amount <= amount).at(-1)?.text;
}
