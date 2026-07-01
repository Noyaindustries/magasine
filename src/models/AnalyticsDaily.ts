import mongoose, { Schema, type Model } from "mongoose";

export interface IAnalyticsDaily {
  _id: mongoose.Types.ObjectId;
  /** Clé jour locale UTC — ex. 2026-06-29 */
  dateKey: string;
  pageViews: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsDailySchema = new Schema<IAnalyticsDaily>(
  {
    dateKey: { type: String, required: true, unique: true },
    pageViews: { type: Number, default: 0 },
  },
  { timestamps: true },
);

AnalyticsDailySchema.index({ dateKey: -1 });

export const AnalyticsDaily: Model<IAnalyticsDaily> =
  mongoose.models.AnalyticsDaily ??
  mongoose.model<IAnalyticsDaily>("AnalyticsDaily", AnalyticsDailySchema);
