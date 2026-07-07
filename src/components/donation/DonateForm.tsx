"use client";

import { useState } from "react";
import { Heart, CheckCircle2 } from "lucide-react";
import {
  DONATION_MIN_AMOUNT,
  DONATION_PRESETS,
  formatDonationAmount,
  getDonationImpact,
} from "@/lib/donation";
import { toast } from "@/lib/toast";

interface DonateFormProps {
  amount?: number;
  frequency?: "one-time" | "monthly";
  liveMode?: boolean;
  onAmountChange?: (amount: number) => void;
  onFrequencyChange?: (frequency: "one-time" | "monthly") => void;
  onTierClear?: () => void;
}

export function DonateForm({
  amount: controlledAmount,
  frequency: controlledFrequency,
  liveMode = false,
  onAmountChange,
  onFrequencyChange,
  onTierClear,
}: DonateFormProps = {}) {
  const [internalFrequency, setInternalFrequency] = useState<"one-time" | "monthly">("one-time");
  const [internalAmount, setInternalAmount] = useState(35);
  const frequency = controlledFrequency ?? internalFrequency;
  const amount = controlledAmount ?? internalAmount;
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [coverFees, setCoverFees] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const resolvedAmount = custom.trim() ? Number.parseFloat(custom) : amount;
  const feeBase = Number.isFinite(resolvedAmount) ? resolvedAmount : amount;
  const feeBuffer = coverFees ? feeBase * 0.03 : 0;
  const chargedAmount = Number.isFinite(resolvedAmount) ? resolvedAmount + feeBuffer : amount;
  const impactLine = Number.isFinite(resolvedAmount) ? getDonationImpact(resolvedAmount) : undefined;

  const updateAmount = (next: number) => {
    if (controlledAmount === undefined) {
      setInternalAmount(next);
    }
    onAmountChange?.(next);
    onTierClear?.();
  };

  const updateFrequency = (next: "one-time" | "monthly") => {
    if (controlledFrequency === undefined) {
      setInternalFrequency(next);
    }
    onFrequencyChange?.(next);
    onTierClear?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const baseAmount = custom.trim() ? Number.parseFloat(custom) : amount;
    const finalAmount = coverFees ? baseAmount + baseAmount * 0.03 : baseAmount;

    if (!Number.isFinite(baseAmount) || baseAmount < DONATION_MIN_AMOUNT) {
      toast.error(`Minimum amount: ${formatDonationAmount(DONATION_MIN_AMOUNT)}`);
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: anonymous ? "Anonymous donor" : name,
          email,
          amount: finalAmount,
          frequency,
          message: message.trim() || undefined,
          coverFees,
          anonymous,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        url?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      // Live mode: redirect to Stripe's secure checkout.
      if (data.url) {
        toast.success("Redirecting to secure checkout…");
        window.location.assign(data.url);
        return;
      }
      // Demo mode: no payment processor configured.
      setStatus("success");
      toast.success("Thank you for your generosity!");
    } catch {
      toast.error("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="donate-success">
        <CheckCircle2 className="donate-success-icon" aria-hidden />
        <h2>Thank you for your generosity</h2>
        <p>
          Your {formatDonationAmount(chargedAmount, { frequency })} pledge has been recorded. When payment
          processing goes live, you will receive a confirmation email with your receipt in USD.
        </p>
        <button type="button" className="donate-submit" onClick={() => setStatus("idle")}>
          Make another donation
        </button>
      </div>
    );
  }

  return (
    <form className="donate-form" onSubmit={handleSubmit}>
      <div className="donate-frequency" role="group" aria-label="Donation frequency">
        <button
          type="button"
          className={frequency === "one-time" ? "is-active" : undefined}
          onClick={() => updateFrequency("one-time")}
        >
          One-time
        </button>
        <button
          type="button"
          className={frequency === "monthly" ? "is-active" : undefined}
          onClick={() => updateFrequency("monthly")}
        >
          Monthly
        </button>
      </div>

      <fieldset className="donate-amounts">
        <legend className="sr-only">Choose an amount in U.S. dollars</legend>
        {DONATION_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={`donate-amount-btn${amount === preset && !custom ? " is-active" : ""}`}
            onClick={() => {
              updateAmount(preset);
              setCustom("");
            }}
          >
            {formatDonationAmount(preset)}
          </button>
        ))}
      </fieldset>

      <label className="donate-field">
        <span>Other amount (USD)</span>
        <div className="donate-amount-input">
          <span className="donate-amount-prefix" aria-hidden>
            $
          </span>
          <input
            type="number"
            min={DONATION_MIN_AMOUNT}
            step={1}
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              onTierClear?.();
            }}
          />
        </div>
      </label>

      {impactLine && (
        <p className="donate-impact">
          <Heart size={14} aria-hidden />
          {impactLine}
        </p>
      )}

      <div className="donate-checkboxes">
        <label className="donate-checkbox">
          <input
            type="checkbox"
            checked={coverFees}
            onChange={(e) => setCoverFees(e.target.checked)}
          />
          <span>Add 3% to cover processing fees ({formatDonationAmount(feeBase * 0.03)})</span>
        </label>
        <label className="donate-checkbox">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <span>Give anonymously (name hidden from public lists)</span>
        </label>
      </div>

      <div className="donate-fields-row">
        <label className="donate-field">
          <span>Full name</span>
          <input
            type="text"
            required={!anonymous}
            disabled={anonymous}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="donate-field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>

      <label className="donate-field">
        <span>Message (optional)</span>
        <textarea
          rows={3}
          maxLength={500}
          placeholder="Dedicate your gift or leave a note for our newsroom…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <button type="submit" className="donate-submit" disabled={status === "loading"}>
        {status === "loading"
          ? "Processing…"
          : `Donate ${formatDonationAmount(chargedAmount, { frequency })}`}
      </button>

      <p className="donate-disclaimer">
        {liveMode
          ? "Secure checkout powered by Stripe. You will be redirected to complete your payment in USD. Card, Apple Pay, and Google Pay are supported."
          : "Demo mode: no real payment is processed yet. Pledges are stored securely in USD for demonstration purposes. Card, Apple Pay, and Google Pay will be enabled with Stripe."}
      </p>
    </form>
  );
}
