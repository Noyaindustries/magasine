import mongoose, { Schema, type Model } from "mongoose";
import type { ArticleStatus } from "@/types";

export interface IArticle {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle?: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  category: mongoose.Types.ObjectId;
  secondaryCategories: mongoose.Types.ObjectId[];
  authors: mongoose.Types.ObjectId[];
  tags: string[];
  status: ArticleStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  readingTime: number;
  views: number;
  shareCount: number;
  isPremium: boolean;
  isEditorsChoice: boolean;
  isFeatured: boolean;
  isTopStory: boolean;
  isUrgent: boolean;
  contentType: "article" | "video" | "podcast" | "gallery";
  videoUrl?: string;
  gallery?: { url: string; caption?: string; credit?: string }[];
  seoTitle?: string;
  seoDescription?: string;
  sendPushOnPublish: boolean;
  commentsDisabled: boolean;
  allowSocialShare: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    featuredImage: { type: String, required: true },
    featuredImageAlt: { type: String },
    featuredImageCaption: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    secondaryCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    authors: [{ type: Schema.Types.ObjectId, ref: "Author", required: true }],
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "review", "scheduled", "published", "archived"],
      default: "draft",
    },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    readingTime: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    isEditorsChoice: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isTopStory: { type: Boolean, default: false },
    isUrgent: { type: Boolean, default: false },
    contentType: {
      type: String,
      enum: ["article", "video", "podcast", "gallery"],
      default: "article",
    },
    videoUrl: { type: String },
    gallery: [
      {
        url: String,
        caption: String,
        credit: String,
      },
    ],
    seoTitle: { type: String },
    seoDescription: { type: String },
    sendPushOnPublish: { type: Boolean, default: false },
    commentsDisabled: { type: Boolean, default: false },
    allowSocialShare: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ArticleSchema.index({ title: "text", excerpt: "text", content: "text" });
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ category: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ secondaryCategories: 1, status: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, isUrgent: 1, publishedAt: -1 });
ArticleSchema.index({ tags: 1 });

export const Article: Model<IArticle> =
  mongoose.models.Article ?? mongoose.model<IArticle>("Article", ArticleSchema);
