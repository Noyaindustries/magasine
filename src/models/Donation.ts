import mongoose, { Schema, type Model } from "mongoose";

export interface IDonation {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  amount: number;
  currency: string;
  frequency: "one-time" | "monthly";
  message?: string;
  coverFees?: boolean;
  anonymous?: boolean;
  status: "pledged" | "completed" | "failed";
  createdAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: "USD" },
    frequency: { type: String, enum: ["one-time", "monthly"], default: "one-time" },
    message: { type: String, trim: true, maxlength: 500 },
    coverFees: { type: Boolean, default: false },
    anonymous: { type: Boolean, default: false },
    status: { type: String, enum: ["pledged", "completed", "failed"], default: "pledged" },
  },
  { timestamps: true }
);

DonationSchema.index({ status: 1, createdAt: -1 });
DonationSchema.index({ createdAt: -1 });
DonationSchema.index({ email: 1, createdAt: -1 });

export const Donation: Model<IDonation> =
  mongoose.models.Donation ?? mongoose.model<IDonation>("Donation", DonationSchema);
