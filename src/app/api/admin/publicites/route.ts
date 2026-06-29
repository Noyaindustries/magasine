import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { loadAdZones, saveAdZones } from "@/lib/ad-zones-storage";
import type { AdZoneDoc } from "@/models/SiteSettings";

function formatImpressions(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function formatCtr(impressions: number, clicks: number) {
  if (impressions <= 0) return "—";
  return `${((clicks / impressions) * 100).toFixed(1).replace(".", ",")}%`;
}

function formatRevenue(n: number) {
  if (n <= 0) return "Paused";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(".", ",")}M FCFA`;
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

const patchSchema = z.object({
  zoneId: z.string(),
  active: z.boolean().optional(),
  impressions: z.number().optional(),
  clicks: z.number().optional(),
  revenueFcfa: z.number().optional(),
});

const createSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  size: z.string().min(1),
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

    zones[index] = zone;
    await saveAdZones(zones);

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
      position: parsed.data.position,
      size: parsed.data.size,
      active: true,
      impressions: 0,
      clicks: 0,
      revenueFcfa: 0,
    };

    zones.push(zone);
    await saveAdZones(zones);

    return NextResponse.json({ _id: key, key }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/publicites:", error);
    return NextResponse.json({ error: "Creation failed." }, { status: 500 });
  }
}
