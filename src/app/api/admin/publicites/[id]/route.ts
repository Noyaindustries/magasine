import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { loadAdZones, saveAdZones } from "@/lib/ad-zones-storage";
import { revalidateSiteShell } from "@/lib/revalidate-public";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const guard = await requireAdminApi("editorial");
    if (guard.error) return guard.error;

    const { id } = await context.params;
    const zones = [...(await loadAdZones())];
    const index = zones.findIndex((z) => z.key === id);

    if (index < 0) {
      return NextResponse.json({ error: "Zone not found." }, { status: 404 });
    }

    zones.splice(index, 1);
    await saveAdZones(zones);
    revalidateSiteShell();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/publicites/[id]:", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
