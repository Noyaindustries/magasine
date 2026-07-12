import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import {
  getNewsletterSignupPreferences,
  NEWSLETTER_TOPICS,
  type NewsletterTopicId,
} from "@/lib/newsletter-topics";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { sendWelcomeNewsletterEmail } from "@/lib/newsletter-send";
import { enforceRateLimit } from "@/lib/rate-limit";

const topicIds = NEWSLETTER_TOPICS.map((t) => t.id) as NewsletterTopicId[];

function isValidTopicId(value: string): value is NewsletterTopicId {
  return (topicIds as readonly string[]).includes(value);
}

const postSchema = z.object({
  email: z.string().email("Invalid email"),
  preferences: z
    .array(z.string())
    .optional()
    .refine(
      (prefs) => !prefs || prefs.every(isValidTopicId),
      "Invalid newsletter preference"
    ),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ subscribed: false });
  }

  try {
    await connectDB();
    const subscriber = await Newsletter.findOne({
      email: session.user.email.toLowerCase(),
      isActive: true,
    }).lean();

    if (!subscriber) {
      return NextResponse.json({ subscribed: false });
    }

    return NextResponse.json({
      subscribed: true,
      preferences: subscriber.preferences,
      subscribedAt: subscriber.subscribedAt,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { prefix: "newsletter", max: 15, windowMs: 3600_000 });
  if (limited) return limited;

  try {
    const settings = await getPublicSiteSettings();
    if (!settings.newsletterEnabled) {
      return NextResponse.json({ error: "Newsletter sign-ups are currently disabled" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or preferences" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const preferences = getNewsletterSignupPreferences(parsed.data.preferences);

    await connectDB();
    const existing = await Newsletter.findOne({ email });

    if (existing) {
      existing.isActive = true;
      existing.preferences = preferences;
      await existing.save();
      return NextResponse.json({
        message: "Your newsletter preferences have been updated.",
        preferences,
      });
    }

    await Newsletter.create({ email, preferences });

    void sendWelcomeNewsletterEmail(email).catch((error) => {
      console.error("[newsletter] welcome email failed", email, error);
    });

    return NextResponse.json(
      {
        message: "Welcome! Check your inbox for our next edition.",
        preferences,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = postSchema.safeParse({
      email: session.user.email,
      preferences: body.preferences,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    }

    await connectDB();
    const email = session.user.email.toLowerCase();
    const preferences = getNewsletterSignupPreferences(parsed.data.preferences);

    const subscriber = await Newsletter.findOne({ email });
    if (!subscriber) {
      await Newsletter.create({ email, preferences });
    } else {
      subscriber.isActive = true;
      subscriber.preferences = preferences;
      await subscriber.save();
    }

    return NextResponse.json({
      message: "Preferences saved.",
      preferences,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
