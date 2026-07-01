import { connectDB } from "@/lib/mongodb";
import { AnalyticsDaily } from "@/models/AnalyticsDaily";

/** Retourne la clé jour YYYY-MM-DD (minuit locale). */
export function toDateKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateKeyToStart(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(y!, m! - 1, d);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Incrémente le compteur de pages vues pour la journée courante. */
export async function recordDailyPageView(at = new Date()): Promise<void> {
  await connectDB();
  const dateKey = toDateKey(at);
  await AnalyticsDaily.findOneAndUpdate(
    { dateKey },
    { $inc: { pageViews: 1 }, $setOnInsert: { dateKey } },
    { upsert: true },
  );
}
