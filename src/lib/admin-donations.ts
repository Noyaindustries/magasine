import { formatDonationAmount } from "@/lib/donation";
import type { IDonation } from "@/models/Donation";

export type DonationStatus = IDonation["status"];
export type DonationFrequency = IDonation["frequency"];

export interface AdminDonationRow {
  _id: string;
  name: string;
  email: string;
  displayName: string;
  amount: number;
  currency: string;
  frequency: DonationFrequency;
  message?: string;
  coverFees: boolean;
  anonymous: boolean;
  status: DonationStatus;
  createdAt: string;
}

export interface AdminDonationStats {
  totalCompleted: number;
  totalPledged: number;
  pledgedCount: number;
  completedCount: number;
  failedCount: number;
  monthlyRecurring: number;
  donorsThisMonth: number;
}

function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function serializeDonation(doc: IDonation): AdminDonationRow {
  return {
    _id: String(doc._id),
    name: doc.name,
    email: doc.email,
    displayName: doc.anonymous ? "Anonymous donor" : doc.name,
    amount: doc.amount,
    currency: doc.currency,
    frequency: doc.frequency,
    message: doc.message,
    coverFees: doc.coverFees ?? false,
    anonymous: doc.anonymous ?? false,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function buildDonationStats(
  donations: Pick<AdminDonationRow, "amount" | "status" | "frequency" | "createdAt" | "email">[]
): AdminDonationStats {
  const start = monthStart();

  let totalCompleted = 0;
  let totalPledged = 0;
  let pledgedCount = 0;
  let completedCount = 0;
  let failedCount = 0;
  let monthlyRecurring = 0;
  const donorsThisMonth = new Set<string>();

  for (const donation of donations) {
    if (donation.status === "completed") {
      totalCompleted += donation.amount;
      completedCount += 1;
    } else if (donation.status === "pledged") {
      totalPledged += donation.amount;
      pledgedCount += 1;
    } else if (donation.status === "failed") {
      failedCount += 1;
    }

    if (donation.frequency === "monthly" && donation.status !== "failed") {
      monthlyRecurring += 1;
    }

    if (new Date(donation.createdAt) >= start && donation.status !== "failed") {
      donorsThisMonth.add(donation.email);
    }
  }

  return {
    totalCompleted,
    totalPledged,
    pledgedCount,
    completedCount,
    failedCount,
    monthlyRecurring,
    donorsThisMonth: donorsThisMonth.size,
  };
}

export function formatAdminDonationAmount(
  amount: number,
  options?: { frequency?: DonationFrequency; currency?: string }
): string {
  if (options?.currency && options.currency !== "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: options.currency,
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  }
  return formatDonationAmount(amount, { frequency: options?.frequency });
}

export function donationStatusLabel(status: DonationStatus): string {
  switch (status) {
    case "pledged":
      return "Pledged";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
