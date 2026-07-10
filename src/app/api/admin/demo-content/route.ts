import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  deleteAllDemoArticles,
  importDemoContent,
  tagExistingDemoArticles,
} from "@/lib/seed-import";
import { revalidateContentListings, revalidateSiteLayout } from "@/lib/revalidate-public";

const bodySchema = z.object({
  action: z.enum(["import", "delete_all", "tag_existing"]).optional().default("import"),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  let action: "import" | "delete_all" | "tag_existing" = "import";
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (parsed.success) action = parsed.data.action;
  } catch {
    // Corps vide : import par défaut (compatibilité bouton existant).
  }

  try {
    if (action === "delete_all") {
      const result = await deleteAllDemoArticles();
      revalidateContentListings();
      revalidateSiteLayout();
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "tag_existing") {
      const tagged = await tagExistingDemoArticles();
      return NextResponse.json({ success: true, tagged });
    }

    const result = await importDemoContent();
    await tagExistingDemoArticles();
    revalidateContentListings();
    revalidateSiteLayout();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[admin/demo-content POST]", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
