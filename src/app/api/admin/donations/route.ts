import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Donation } from "@/models/Donation";
import { buildDonationStats, serializeDonation } from "@/lib/admin-donations";

const patchSchema = z.object({
  donationId: z.string(),
  status: z.enum(["pledged", "completed", "failed"]),
});

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  await connectDB();
  const docs = await Donation.find().sort({ createdAt: -1 }).limit(500).lean();
  const donations = docs.map((doc) =>
    serializeDonation({
      ...doc,
      _id: doc._id,
      createdAt: doc.createdAt,
    })
  );

  return NextResponse.json({
    stats: buildDonationStats(donations),
    donations,
  });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();
  const donation = await Donation.findById(parsed.data.donationId);
  if (!donation) {
    return NextResponse.json({ error: "Donation not found." }, { status: 404 });
  }

  donation.status = parsed.data.status;
  await donation.save();

  return NextResponse.json({
    _id: String(donation._id),
    status: donation.status,
  });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = z.object({ donationId: z.string() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();
  const deleted = await Donation.findByIdAndDelete(parsed.data.donationId);
  if (!deleted) {
    return NextResponse.json({ error: "Donation not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
