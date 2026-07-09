import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  ABOUT_PILLAR_ICONS,
  getAboutPageContent,
  updateAboutPageContent,
} from "@/lib/about-page";
import { revalidateAboutPage } from "@/lib/revalidate-public";

const pillarSchema = z.object({
  icon: z.enum(ABOUT_PILLAR_ICONS),
  title: z.string().min(1),
  text: z.string().min(1),
});

const aboutPageSchema = z.object({
  metaDescription: z.string().min(1),
  eyebrow: z.string().min(1),
  titleMain: z.string().min(1),
  titleEm: z.string().min(1),
  lead: z.string().min(1),
  whoWeAreTitle: z.string().min(1),
  whoWeAreParagraphs: z.array(z.string().min(1)).min(1),
  glanceTitle: z.string().min(1),
  glanceItems: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .min(1),
  coverageRegions: z.array(z.string().min(1)).min(1),
  missionSubtitle: z.string().min(1),
  missionTitle: z.string().min(1),
  missionLead: z.string().min(1),
  missionParagraph: z.string().min(1),
  missionPillars: z.array(pillarSchema).min(1),
  valuesTitle: z.string().min(1),
  values: z
    .array(
      z.object({
        label: z.string().min(1),
        text: z.string().min(1),
      })
    )
    .min(1),
  howWeWorkTitle: z.string().min(1),
  howWeWorkIntro: z.string().min(1),
  howWeWorkItems: z.array(z.string().min(1)).min(1),
  statsTitle: z.string().min(1),
  statsSubtitle: z.string().min(1),
  stats: z
    .array(
      z.object({
        num: z.string().min(1),
        label: z.string().min(1),
      })
    )
    .min(1),
  ctaTeamText: z.string().min(1),
  ctaDonateText: z.string().min(1),
  ctaNewsletterText: z.string().min(1),
});

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const content = await getAboutPageContent();
  return NextResponse.json(content);
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = aboutPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const content = await updateAboutPageContent(parsed.data);
  revalidateAboutPage();
  return NextResponse.json(content);
}
