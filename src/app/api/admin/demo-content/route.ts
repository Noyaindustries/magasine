import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { importDemoContent } from "@/lib/seed-import";

export async function POST() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  try {
    const result = await importDemoContent();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[admin/demo-content POST]", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
