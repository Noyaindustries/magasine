import type { Metadata } from "next";
import { DonateExperience } from "@/components/donation/DonateExperience";
import { DONATION_STATS } from "@/lib/donation";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support independent journalism from Africa and the Global South. Give in U.S. dollars to fund investigations, correspondents, and public-interest reporting.",
};

type DonatePageProps = {
  searchParams: Promise<{ donation?: string }>;
};

export default async function DonatePage({ searchParams }: DonatePageProps) {
  const { donation } = await searchParams;
  const checkoutStatus =
    donation === "success" ? "success" : donation === "cancelled" ? "cancelled" : null;
  const liveMode = isStripeConfigured();

  return (
    <div className="donate-page">
      <div className="container donate-hero">
        <span className="donate-eyebrow">Support us</span>
        <h1 className="donate-title">
          Fuel independent journalism
          <span> from the Global South</span>
        </h1>
        <p className="donate-lead">
          Global South Watch is reader-supported. Your gift — in U.S. dollars — keeps our coverage free to
          access, editorially independent, and rooted in the communities we report on.
        </p>
        <div className="donate-stats">
          {DONATION_STATS.map((s) => (
            <div key={s.label} className="donate-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <DonateExperience liveMode={liveMode} checkoutStatus={checkoutStatus} />
    </div>
  );
}
