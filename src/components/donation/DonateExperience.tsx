"use client";

import { useState } from "react";
import { Check, CheckCircle2, XCircle } from "lucide-react";
import {
  DONATION_FAQ,
  DONATION_TIERS,
  DONATION_TRUST,
  DONATION_USES,
  formatDonationAmount,
} from "@/lib/donation";
import { DonateForm } from "@/components/donation/DonateForm";

interface DonateExperienceProps {
  liveMode?: boolean;
  checkoutStatus?: "success" | "cancelled" | null;
}

export function DonateExperience({ liveMode = false, checkoutStatus = null }: DonateExperienceProps) {
  const [amount, setAmount] = useState(35);
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const selectTier = (tierId: string, tierAmount: number, tierFrequency: "one-time" | "monthly") => {
    setSelectedTier(tierId);
    setAmount(tierAmount);
    setFrequency(tierFrequency);
  };

  return (
    <>
      {checkoutStatus === "success" && (
        <div className="container" role="status">
          <div className="donate-banner donate-banner--success">
            <CheckCircle2 size={20} aria-hidden />
            <div>
              <strong>Thank you — your payment was successful.</strong>
              <p>A confirmation and receipt in USD have been sent to your email.</p>
            </div>
          </div>
        </div>
      )}
      {checkoutStatus === "cancelled" && (
        <div className="container" role="status">
          <div className="donate-banner donate-banner--cancelled">
            <XCircle size={20} aria-hidden />
            <div>
              <strong>Checkout cancelled.</strong>
              <p>No payment was taken. You can try again whenever you are ready.</p>
            </div>
          </div>
        </div>
      )}

      <section className="donate-tiers" aria-labelledby="donate-tiers-heading">
        <div className="container">
          <div className="donate-section-head">
            <span className="donate-eyebrow">Membership</span>
            <h2 id="donate-tiers-heading">Choose your level of support</h2>
            <p>All recurring gifts are billed in U.S. dollars. Select a tier or customize your amount below.</p>
          </div>
          <div className="donate-tiers-grid">
            {DONATION_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                className={[
                  "donate-tier-card",
                  tier.featured ? "donate-tier-card--featured" : "",
                  selectedTier === tier.id ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => selectTier(tier.id, tier.amount, tier.frequency)}
              >
                {tier.featured && <span className="donate-tier-badge">Most popular</span>}
                <span className="donate-tier-name">{tier.name}</span>
                <span className="donate-tier-price">{formatDonationAmount(tier.amount, { frequency: "monthly" })}</span>
                <p className="donate-tier-blurb">{tier.blurb}</p>
                <ul className="donate-tier-perks">
                  {tier.perks.map((perk) => (
                    <li key={perk}>
                      <Check size={14} aria-hidden />
                      {perk}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container donate-layout">
        <aside className="donate-aside">
          <h2>Where your gift goes</h2>
          <ul className="donate-uses">
            {DONATION_USES.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
          <div className="donate-trust">
            <h3>Our pledge to donors</h3>
            <ul>
              {DONATION_TRUST.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="donate-card" aria-labelledby="donate-form-heading">
          <div className="donate-card-head">
            <div>
              <h2 id="donate-form-heading">Make a donation</h2>
              <p className="donate-card-sub">Secure pledge · amounts in USD</p>
            </div>
            <span className="donate-currency-badge">USD $</span>
          </div>
          <DonateForm
            amount={amount}
            frequency={frequency}
            liveMode={liveMode}
            onAmountChange={setAmount}
            onFrequencyChange={setFrequency}
            onTierClear={() => setSelectedTier(null)}
          />
        </section>
      </div>

      <section className="donate-faq" aria-labelledby="donate-faq-heading">
        <div className="container donate-faq-inner">
          <div className="donate-section-head">
            <span className="donate-eyebrow">FAQ</span>
            <h2 id="donate-faq-heading">Questions about giving</h2>
          </div>
          <div className="donate-faq-list">
            {DONATION_FAQ.map((item) => (
              <details key={item.q} className="donate-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
