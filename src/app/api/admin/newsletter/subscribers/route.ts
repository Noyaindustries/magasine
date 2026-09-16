import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import { buildCaseInsensitiveRegex } from "@/lib/mongo-regex";
import {
  getNewsletterSignupPreferences,
  NEWSLETTER_TOPICS,
  type NewsletterTopicId,
} from "@/lib/newsletter-topics";
import { normalizeNewsletterEmail } from "@/lib/newsletter-recipients";

const DEFAULT_LIMIT = 25;
/** Higher cap for the campaign recipient picker checklist. */
const MAX_LIMIT = 500;

const topicIds = NEWSLETTER_TOPICS.map((t) => t.id) as NewsletterTopicId[];

function isValidTopicId(value: string): value is NewsletterTopicId {
  return (topicIds as readonly string[]).includes(value);
}

const createSchema = z.object({
  email: z.string().email(),
  preferences: z
    .array(z.string())
    .optional()
    .refine((prefs) => !prefs || prefs.every(isValidTopicId), "Invalid topic"),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit") ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT)
  );
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "active";

  const filter: Record<string, unknown> = {};
  if (status === "active") filter.isActive = true;
  else if (status === "inactive") filter.isActive = false;

  const emailRegex = buildCaseInsensitiveRegex(q);
  if (emailRegex) {
    filter.email = emailRegex;
  }

  try {
    await connectDB();

    const [total, subscribers] = await Promise.all([
      Newsletter.countDocuments(filter),
      Newsletter.find(filter)
        .select("email preferences isActive subscribedAt")
        .sort({ subscribedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      subscribers: subscribers.map((row) => ({
        _id: String(row._id),
        email: row.email,
        preferences: row.preferences ?? [],
        isActive: !!row.isActive,
        subscribedAt: row.subscribedAt
          ? new Date(row.subscribedAt).toISOString()
          : undefined,
      })),
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("[newsletter/subscribers GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or preferences." }, { status: 400 });
  }

  const email = normalizeNewsletterEmail(parsed.data.email);
  const preferences = getNewsletterSignupPreferences(parsed.data.preferences);
  const isActive = parsed.data.isActive ?? true;

  try {
    await connectDB();
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      existing.preferences = preferences;
      existing.isActive = isActive;
      if (isActive && !existing.subscribedAt) {
        existing.subscribedAt = new Date();
      }
      await existing.save();
      return NextResponse.json({
        subscriber: {
          _id: String(existing._id),
          email: existing.email,
          preferences: existing.preferences ?? [],
          isActive: !!existing.isActive,
          subscribedAt: existing.subscribedAt
            ? new Date(existing.subscribedAt).toISOString()
            : undefined,
        },
        created: false,
      });
    }

    const created = await Newsletter.create({
      email,
      preferences,
      isActive,
      subscribedAt: new Date(),
    });

    return NextResponse.json(
      {
        subscriber: {
          _id: String(created._id),
          email: created.email,
          preferences: created.preferences ?? [],
          isActive: !!created.isActive,
          subscribedAt: created.subscribedAt
            ? new Date(created.subscribedAt).toISOString()
            : undefined,
        },
        created: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[newsletter/subscribers POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
