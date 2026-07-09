import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { canManageUsers } from "@/lib/permissions";
import { getPublicSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { isTypographyPresetId } from "@/lib/site-fonts";
import { revalidateSiteShell } from "@/lib/revalidate-public";
import type { UserRole } from "@/types";

const homeSectionSchema = z.object({
  intro: z.boolean().optional(),
  urgent: z.boolean().optional(),
  hero: z.boolean().optional(),
  megaAd: z.boolean().optional(),
  editorial: z.boolean().optional(),
  live: z.boolean().optional(),
  media: z.boolean().optional(),
  insights: z.boolean().optional(),
  rubriques: z.boolean().optional(),
  closing: z.boolean().optional(),
});

const updateSchema = z.object({
  siteName: z.string().min(1).optional(),
  tagline: z.string().optional(),
  contactEmail: z.string().email().optional(),
  siteLogo: z.string().min(1).optional(),
  favicon: z.string().min(1).optional(),
  breakingAlertEnabled: z.boolean().optional(),
  commentsEnabled: z.boolean().optional(),
  newsletterEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  homeSections: homeSectionSchema.optional(),
  pulseStats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  closingStats: z
    .array(z.object({ num: z.string(), suffix: z.string(), label: z.string() }))
    .optional(),
  newsletterTitle: z.string().optional(),
  newsletterTitleEm: z.string().optional(),
  newsletterDescription: z.string().optional(),
  newsletterBenefits: z.array(z.string()).optional(),
  mastheadVolume: z.string().optional(),
  mastheadCities: z.string().optional(),
  mastheadBadge: z.string().optional(),
  trustStripLabel: z.string().optional(),
  trustStripEnabled: z.boolean().optional(),
  trustPartners: z
    .array(
      z.object({
        name: z.string().min(1),
        logo: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        url: z.string().optional(),
        isActive: z.boolean(),
      })
    )
    .optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  mailchimpConnected: z.boolean().optional(),
  brevoConnected: z.boolean().optional(),
  typographyPreset: z
    .string()
    .refine((value) => isTypographyPresetId(value), { message: "Invalid typography preset" })
    .optional(),
});

type UpdatePayload = z.infer<typeof updateSchema>;

const ADMIN_ONLY_PATCH_KEYS = new Set<keyof UpdatePayload>([
  "breakingAlertEnabled",
  "commentsEnabled",
  "newsletterEnabled",
  "maintenanceMode",
  "homeSections",
  "pulseStats",
  "closingStats",
  "trustStripLabel",
  "trustStripEnabled",
  "trustPartners",
  "siteLogo",
  "favicon",
  "typographyPreset",
]);

function filterSettingsPatch(data: UpdatePayload, role: UserRole) {
  if (canManageUsers(role)) return data;

  return Object.fromEntries(
    Object.entries(data).filter(
      ([key]) => !ADMIN_ONLY_PATCH_KEYS.has(key as keyof UpdatePayload)
    )
  ) as UpdatePayload;
}

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const settings = await getPublicSiteSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const patch = filterSettingsPatch(parsed.data, guard.session!.user.role);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Unauthorized fields" }, { status: 403 });
  }

  const settings = await updateSiteSettings(patch);
  revalidateSiteShell();
  return NextResponse.json(settings);
}
