import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { loadAdZones, saveAdZones } from "@/lib/ad-zones-storage";
import { revalidateSiteShell } from "@/lib/revalidate-public";
import type { AdZoneDoc } from "@/models/SiteSettings";

function formatImpressions(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function formatCtr(impressions: number, clicks: number) {
  if (impressions <= 0) return "—";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

function formatRevenue(n: number) {
  if (n <= 0) return "Paused";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M FCFA`;
  if (n >= 1000) return `${Math.round(n / 1000)}k FCFA`;
  return `${n} FCFA`;
}

function serializeZones(zones: AdZoneDoc[]) {
  return zones.map((z) => ({
    _id: z.key,
    key: z.key,
    name: z.name,
    position: z.position,
    size: z.size,
    active: z.active,
    slot: z.slot ?? "",
    imageUrl: z.imageUrl ?? "",
    linkUrl: z.linkUrl ?? "",
    impressions: formatImpressions(z.impressions),
    ctr: formatCtr(z.impressions, z.clicks),
    revenue: formatRevenue(z.revenueFcfa),
  }));
}

function buildSummary(zones: AdZoneDoc[]) {
  const active = zones.filter((z) => z.active);
  const totalImpressions = zones.reduce((s, z) => s + z.impressions, 0);
  const totalRevenue = zones.reduce((s, z) => s + z.revenueFcfa, 0);
  const totalClicks = zones.reduce((s, z) => s + z.clicks, 0);
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return {
    impressions: totalImpressions,
    revenueFcfa: totalRevenue,
    ctr,
    activeCount: active.length,
    totalCount: zones.length,
  };
}

export async function GET() {
  try {
    const guard = await requireAdminApi("editorial");
    if (guard.error) return guard.error;

    const zones = await loadAdZones();

    return NextResponse.json({
      summary: buildSummary(zones),
      zones: serializeZones(zones),
    });
  } catch (error) {
    console.error("GET /api/admin/publicites:", error);
    return NextResponse.json(
      { error: "Could not load ad zones." },
      { status: 500 }
    );
  }
}

const AD_SLOT_VALUES = [
  "",
  "home-below",
  "home-sidebar",
  "article-right",
  "article-below",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"),
    "Invalid link (http(s):// or internal path)"
  )
  .optional();

const patchSchema = z.object({
  zoneId: z.string(),
  active: z.boolean().optional(),
  impressions: z.number().optional(),
  clicks: z.number().optional(),
  revenueFcfa: z.number().optional(),
  name: z.string().min(1).max(120).optional(),
  position: z.string().max(160).optional(),
  size: z.string().max(80).optional(),
  slot: z.enum(AD_SLOT_VALUES).optional(),
  imageUrl: optionalUrl,
  linkUrl: optionalUrl,
});

const createSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  slot: z.enum(AD_SLOT_VALUES).optional(),
  imageUrl: optionalUrl,
  linkUrl: optionalUrl,
});

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireAdminApi("editorial");
    if (guard.error) return guard.error;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    const zones = [...(await loadAdZones())];
    const index = zones.findIndex((z) => z.key === parsed.data.zoneId);

    if (index < 0) {
      return NextResponse.json({ error: "Zone not found." }, { status: 404 });
    }

    const zone = { ...zones[index] };
    if (parsed.data.active !== undefined) zone.active = parsed.data.active;
    if (parsed.data.impressions !== undefined) zone.impressions = parsed.data.impressions;
    if (parsed.data.clicks !== undefined) zone.clicks = parsed.data.clicks;
    if (parsed.data.revenueFcfa !== undefined) zone.revenueFcfa = parsed.data.revenueFcfa;
    if (parsed.data.name !== undefined) zone.name = parsed.data.name;
    if (parsed.data.position !== undefined) zone.position = parsed.data.position;
    if (parsed.data.size !== undefined) zone.size = parsed.data.size;
    if (parsed.data.slot !== undefined) zone.slot = parsed.data.slot;
    if (parsed.data.imageUrl !== undefined) zone.imageUrl = parsed.data.imageUrl;
    if (parsed.data.linkUrl !== undefined) zone.linkUrl = parsed.data.linkUrl;

    zones[index] = zone;
    await saveAdZones(zones);
    revalidateSiteShell();

    return NextResponse.json({ success: true, active: zone.active });
  } catch (error) {
    console.error("PATCH /api/admin/publicites:", error);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdminApi("editorial");
    if (guard.error) return guard.error;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data." }, { status: 400 });
    }

    const zones = [...(await loadAdZones())];
    const key = `zone-${Date.now()}`;
    const zone: AdZoneDoc = {
      key,
      name: parsed.data.name,
      position: parsed.data.position ?? "",
      size: parsed.data.size ?? "",
      active: true,
      impressions: 0,
      clicks: 0,
      revenueFcfa: 0,
      slot: parsed.data.slot ?? "",
      imageUrl: parsed.data.imageUrl ?? "",
      linkUrl: parsed.data.linkUrl ?? "",
    };

    zones.push(zone);
    await saveAdZones(zones);
    revalidateSiteShell();

    return NextResponse.json({ _id: key, key }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/publicites:", error);
    return NextResponse.json({ error: "Creation failed." }, { status: 500 });
  }
}
