import mongoose, { Schema, type Model } from "mongoose";

export interface IAuthor {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  email?: string;
  user?: mongoose.Types.ObjectId;
  social?: {
    twitter?: string;
    linkedin?: string;
  };
}

const AuthorSchema = new Schema<IAuthor>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    bio: { type: String },
    avatar: { type: String },
    email: { type: String },
    // Lien optionnel vers le compte utilisateur (auto-provisionné pour les rôles éditoriaux).
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    social: {
      twitter: String,
      linkedin: String,
    },
  },
  { timestamps: true }
);

export const Author: Model<IAuthor> =
  mongoose.models.Author ?? mongoose.model<IAuthor>("Author", AuthorSchema);
