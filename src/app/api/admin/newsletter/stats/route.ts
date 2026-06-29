import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import { NewsletterCampaign } from "@/models/NewsletterCampaign";

const LIST_COLORS: Record<string, string> = {
  actualites: "var(--cms-red)",
  sport: "var(--blue)",
  finance: "var(--green)",
};

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  await connectDB();

  const [totalActive, monthlyNew, unsubscribes, preferenceAgg, sentCampaigns] = await Promise.all([
    Newsletter.countDocuments({ isActive: true }),
    Newsletter.countDocuments({
      isActive: true,
      subscribedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    Newsletter.countDocuments({
      isActive: false,
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    Newsletter.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $unwind: "$preferences" },
      { $group: { _id: "$preferences", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    NewsletterCampaign.find({ status: "sent" }).select("openCount clickCount recipientCount").lean(),
  ]);

  const totalOpens = sentCampaigns.reduce((s, c) => s + c.openCount, 0);
  const totalClicks = sentCampaigns.reduce((s, c) => s + c.clickCount, 0);
  const totalSent = sentCampaigns.reduce((s, c) => s + c.recipientCount, 0);
  const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 1000) / 10 : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 1000) / 10 : 0;

  const lists =
    preferenceAgg.length > 0
      ? preferenceAgg.map((row) => ({
          name: row._id,
          count: row.count,
          pct: totalActive > 0 ? Math.round((row.count / totalActive) * 100) : 0,
          color: LIST_COLORS[row._id.toLowerCase()] ?? "var(--t3)",
        }))
      : [
          { name: "General news", count: totalActive, pct: 100, color: "var(--cms-red)" },
        ];

  return NextResponse.json({
    totalActive,
    monthlyNew,
    unsubscribes,
    openRate,
    clickRate,
    lists,
  });
}
