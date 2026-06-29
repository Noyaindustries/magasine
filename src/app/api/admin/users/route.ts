import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Article } from "@/models/Article";
import type { UserRole } from "@/types";

const patchSchema = z.object({
  role: z
    .enum(["super_admin", "admin", "editor", "author", "contributor", "reader"])
    .optional(),
  isPremium: z.boolean().optional(),
});

export async function GET() {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  await connectDB();
  const users = await User.find()
    .select("name email role isPremium isBanned createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const articleCounts = await Article.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $unwind: "$authors" },
    { $group: { _id: "$authors", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    articleCounts.map((row) => [String(row._id), row.count])
  );

  return NextResponse.json({
    users: users.map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role as UserRole,
      isPremium: u.isPremium,
      isBanned: u.isBanned ?? false,
      articleCount: countMap.get(String(u._id)) ?? 0,
      createdAt: u.createdAt,
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = z
    .object({
      userId: z.string(),
      ...patchSchema.shape,
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { userId, role, isPremium } = parsed.data;

  if (role === "super_admin" && guard.session!.user.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can assign super_admin role" }, { status: 403 });
  }

  if (userId === guard.session!.user.id && role && role !== guard.session!.user.role) {
    return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (role) user.role = role;
  if (isPremium !== undefined) user.isPremium = isPremium;

  await user.save();
  return NextResponse.json({
    _id: String(user._id),
    role: user.role,
    isPremium: user.isPremium,
  });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = z.object({ userId: z.string() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const { userId } = parsed.data;

  if (userId === guard.session!.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.role === "super_admin") {
    return NextResponse.json(
      { error: "Cannot delete a super admin account." },
      { status: 403 }
    );
  }

  if (user.role === "admin" && guard.session!.user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only a super admin can delete an admin account." },
      { status: 403 }
    );
  }

  const articleCount = await Article.countDocuments({ authors: user._id });
  if (articleCount > 0) {
    return NextResponse.json(
      { error: `This user has ${articleCount} article(s). Reassign them before deleting.` },
      { status: 409 }
    );
  }

  await User.findByIdAndDelete(userId);
  return NextResponse.json({ success: true });
}
