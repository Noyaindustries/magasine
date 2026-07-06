import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Newsletter } from "@/models/Newsletter";
import { buildCaseInsensitiveRegex } from "@/lib/mongo-regex";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

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
