import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Comment } from "@/models/Comment";
import { Donation } from "@/models/Donation";
import { Newsletter } from "@/models/Newsletter";
import { User } from "@/models/User";
import { getTodayMetrics } from "@/lib/admin-today-metrics";

const EDITORIAL_ROLES = ["super_admin", "admin", "editor", "author", "contributor"] as const;

export interface AdminNavStats {
  pendingReview: number;
  pendingComments: number;
  pendingDonations: number;
  publishedArticles: number;
  newsletterSubscribers: number;
  teamMemberCount: number;
  publishedToday: number;
  uniqueReadersToday: number;
  subscribersToday: number;
}

export async function getAdminNavStats(): Promise<AdminNavStats> {
  try {
    await connectDB();
    const [
      pendingReview,
      pendingComments,
      pendingDonations,
      publishedArticles,
      newsletterSubscribers,
      teamMemberCount,
      today,
    ] = await Promise.all([
      Article.countDocuments({ status: "review" }),
      Comment.countDocuments({ isApproved: false }),
      Donation.countDocuments({ status: "pledged" }),
      Article.countDocuments({ status: "published" }),
      Newsletter.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $in: [...EDITORIAL_ROLES] } }),
      getTodayMetrics(),
    ]);
    return {
      pendingReview,
      pendingComments,
      pendingDonations,
      publishedArticles,
      newsletterSubscribers,
      teamMemberCount,
      publishedToday: today.publishedToday,
      uniqueReadersToday: today.uniqueReadersToday,
      subscribersToday: today.subscribersToday,
    };
  } catch {
    return {
      pendingReview: 0,
      pendingComments: 0,
      pendingDonations: 0,
      publishedArticles: 0,
      newsletterSubscribers: 0,
      teamMemberCount: 0,
      publishedToday: 0,
      uniqueReadersToday: 0,
      subscribersToday: 0,
    };
  }
}
