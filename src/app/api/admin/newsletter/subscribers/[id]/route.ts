import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import {
  getNewsletterSignupPreferences,
  NEWSLETTER_TOPICS,
  type NewsletterTopicId,
} from "@/lib/newsletter-topics";
import { normalizeNewsletterEmail } from "@/lib/newsletter-recipients";

type RouteContext = { params: Promise<{ id: string }> };

const topicIds = NEWSLETTER_TOPICS.map((t) => t.id) as NewsletterTopicId[];

function isValidTopicId(value: string): value is NewsletterTopicId {
  return (topicIds as readonly string[]).includes(value);
}

const updateSchema = z.object({
  email: z.string().email().optional(),
  preferences: z
    .array(z.string())
    .optional()
    .refine((prefs) => !prefs || prefs.every(isValidTopicId), "Invalid topic"),
  isActive: z.boolean().optional(),
});

function serializeSubscriber(row: {
  _id: mongoose.Types.ObjectId;
  email: string;
  preferences?: string[];
  isActive?: boolean;
  subscribedAt?: Date;
}) {
  return {
    _id: String(row._id),
    email: row.email,
    preferences: row.preferences ?? [],
    isActive: !!row.isActive,
    subscribedAt: row.subscribedAt ? new Date(row.subscribedAt).toISOString() : undefined,
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid subscriber id." }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  try {
    await connectDB();
    const subscriber = await Newsletter.findById(id);
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
    }

    if (parsed.data.email !== undefined) {
      const email = normalizeNewsletterEmail(parsed.data.email);
      if (!email) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
      }
      if (email !== subscriber.email.toLowerCase()) {
        const clash = await Newsletter.findOne({
          email,
          _id: { $ne: subscriber._id },
        })
          .select("_id")
          .lean();
        if (clash) {
          return NextResponse.json(
            { error: "Another subscriber already uses this email." },
            { status: 409 }
          );
        }
        subscriber.email = email;
      }
    }

    if (parsed.data.preferences !== undefined) {
      subscriber.preferences = getNewsletterSignupPreferences(parsed.data.preferences);
    }

    if (parsed.data.isActive !== undefined) {
      subscriber.isActive = parsed.data.isActive;
    }

    await subscriber.save();
    return NextResponse.json({ subscriber: serializeSubscriber(subscriber) });
  } catch (error) {
    console.error("[newsletter/subscribers PATCH]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid subscriber id." }, { status: 400 });
  }

  try {
    await connectDB();
    const deleted = await Newsletter.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[newsletter/subscribers DELETE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
