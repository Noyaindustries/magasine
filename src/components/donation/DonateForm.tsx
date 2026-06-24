"use client";

import { useEffect, useState } from "react";
import { Heart, CheckCircle2 } from "lucide-react";
import {
  DONATION_MIN_AMOUNT,
  DONATION_PRESETS,
  formatDonationAmount,
  getDonationImpact,
} from "@/lib/donation";

interface DonateFormProps {
  amount?: number;
  frequency?: "one-time" | "monthly";
  onAmountChange?: (amount: number) => void;
  onFrequencyChange?: (frequency: "one-time" | "monthly") => void;
  onTierClear?: () => void;
}

export function DonateForm({
  amount: controlledAmount,
  frequency: controlledFrequency,
  onAmountChange,
  onFrequencyChange,
  onTierClear,
}: DonateFormProps = {}) {
  const [frequency, setFrequency] = useState<"one-time" | "monthly">(controlledFrequency ?? "one-time");
  const [amount, setAmount] = useState<number>(controlledAmount ?? 35);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [coverFees, setCoverFees] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (controlledAmount !== undefined) {
      setAmount(controlledAmount);
      setCustom("");
    }
  }, [controlledAmount]);

  useEffect(() => {
    if (controlledFrequency !== undefined) {
      setFrequency(controlledFrequency);
    }
  }, [controlledFrequency]);

  const resolvedAmount = custom.trim() ? Number.parseFloat(custom) : amount;
  const feeBase = Number.isFinite(resolvedAmount) ? resolvedAmount : amount;
  const feeBuffer = coverFees ? feeBase * 0.03 : 0;
  const chargedAmount = Number.isFinite(resolvedAmount) ? resolvedAmount + feeBuffer : amount;
  const impactLine = Number.isFinite(resolvedAmount) ? getDonationImpact(resolvedAmount) : undefined;

  const updateAmount = (next: number) => {
    setAmount(next);
    onAmountChange?.(next);
    onTierClear?.();
  };

  const updateFrequency = (next: "one-time" | "monthly") => {
    setFrequency(next);
    onFrequencyChange?.(next);
    onTierClear?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const baseAmount = custom.trim() ? Number.parseFloat(custom) : amount;
    const finalAmount = coverFees ? baseAmount + baseAmount * 0.03 : baseAmount;

    if (!Number.isFinite(baseAmount) || baseAmount < DONATION_MIN_AMOUNT) {
      setErrorMsg(`Please enter a valid amount (minimum ${formatDonationAmount(DONATION_MIN_AMOUNT)}).`);
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
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
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

      {errorMsg && (
        <p className="donate-error" role="alert">
          {errorMsg}
        </p>
      )}

      <button type="submit" className="donate-submit" disabled={status === "loading"}>
        {status === "loading"
          ? "Processing…"
          : `Donate ${formatDonationAmount(chargedAmount, { frequency })}`}
      </button>

      <p className="donate-disclaimer">
        Demo mode: no real payment is processed yet. Pledges are stored securely in USD for demonstration
        purposes. Card, Apple Pay, and Google Pay will be enabled with Stripe.
      </p>
    </form>
  );
}
