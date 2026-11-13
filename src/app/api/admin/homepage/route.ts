import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { getPublicSiteSettings, updateHomepageSettings } from "@/lib/site-settings";
import { revalidateSiteShell } from "@/lib/revalidate-public";
import { getHomeRelatedArticleIds } from "@/models/SiteSettings";
import {
  loadRelatedArticleOptions,
  resolveHomeRelatedArticleIds,
} from "@/lib/related-articles";
import type { RelatedArticleOption } from "@/lib/related-articles-shared";

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

const trustPartnerSchema = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  url: z.string().optional(),
  isActive: z.boolean(),
});

const updateSchema = z.object({
  tagline: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
  contactLocation: z.string().max(160).optional(),
  mastheadVolume: z.string().optional(),
  mastheadCities: z.string().optional(),
  mastheadBadge: z.string().optional(),
  pulseStats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  trustStripLabel: z.string().optional(),
  trustStripEnabled: z.boolean().optional(),
  trustPartners: z.array(trustPartnerSchema).optional(),
  homeSections: homeSectionSchema.optional(),
  closingStats: z
    .array(z.object({ num: z.string(), suffix: z.string(), label: z.string() }))
    .optional(),
  newsletterTitle: z.string().optional(),
  newsletterTitleEm: z.string().optional(),
  newsletterDescription: z.string().optional(),
  homeRelatedArticleIds: z.array(z.string()).max(6).optional(),
});

async function loadHomeRelatedArticlesForAdmin(): Promise<RelatedArticleOption[]> {
  return loadRelatedArticleOptions(await getHomeRelatedArticleIds());
}

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const [settings, homeRelatedArticles] = await Promise.all([
    getPublicSiteSettings(),
    loadHomeRelatedArticlesForAdmin(),
  ]);

  return NextResponse.json({ ...settings, homeRelatedArticles });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { homeRelatedArticleIds, ...rest } = parsed.data;
  let homeRelatedArticles: mongoose.Types.ObjectId[] | undefined;

  if (homeRelatedArticleIds !== undefined) {
    const resolved = await resolveHomeRelatedArticleIds(homeRelatedArticleIds);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    homeRelatedArticles = resolved.ids;
  }

  const settings = await updateHomepageSettings({
    ...rest,
    ...(homeRelatedArticles !== undefined ? { homeRelatedArticles } : {}),
  });

  const relatedOptions =
    homeRelatedArticles !== undefined
      ? await loadRelatedArticleOptions(homeRelatedArticles)
      : await loadHomeRelatedArticlesForAdmin();

  revalidateSiteShell();
  return NextResponse.json({ ...settings, homeRelatedArticles: relatedOptions });
}
