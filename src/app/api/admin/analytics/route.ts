import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getAdminAnalyticsData } from "@/lib/admin-analytics";

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const period = request.nextUrl.searchParams.get("period");
  const data = await getAdminAnalyticsData(period);
  return NextResponse.json(data);
}
