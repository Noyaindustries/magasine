import mongoose, { Schema, type Model } from "mongoose";

export type NewsletterCampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export interface INewsletterCampaign {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  subject: string;
  body: string;
  listTarget: string;
  status: NewsletterCampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    listTarget: { type: String, default: "all" },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent"],
      default: "draft",
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    recipientCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

NewsletterCampaignSchema.index({ status: 1, scheduledAt: -1 });

export const NewsletterCampaign: Model<INewsletterCampaign> =
  mongoose.models.NewsletterCampaign ??
  mongoose.model<INewsletterCampaign>("NewsletterCampaign", NewsletterCampaignSchema);
