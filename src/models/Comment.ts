import mongoose, { Schema, type Model } from "mongoose";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  article: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  content: string;
  isApproved: boolean;
  isReported: boolean;
  isRejected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    article: { type: Schema.Types.ObjectId, ref: "Article", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "Comment" },
    content: { type: String, required: true, maxlength: 2000 },
    isApproved: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CommentSchema.index({ article: 1, createdAt: -1 });

export const Comment: Model<IComment> =
  mongoose.models.Comment ?? mongoose.model<IComment>("Comment", CommentSchema);
