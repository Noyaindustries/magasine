import { revalidatePath } from "next/cache";

const LISTING_PATHS = [
  "/",
  "/news",
  "/urgent",
  "/videos",
  "/podcasts",
  "/photo-galleries",
  "/infographics",
] as const;

/** Revalidates the root layout (nav, metadata, site settings). */
export function revalidateSiteLayout() {
  revalidatePath("/", "layout");
}

export function revalidateAboutPage() {
  revalidatePath("/about");
}

export function revalidateTeamPage() {
  revalidatePath("/team");
}

export function revalidateArticlePage(slug: string) {
  revalidatePath(`/article/${slug}`);
}

export function revalidateAuthorPage(slug: string) {
  revalidatePath(`/author/${slug}`);
}

export function revalidateCategoryPage(slug: string) {
  revalidatePath(`/category/${slug}`);
}

/** Homepage and pages that aggregate editorial content. */
export function revalidateContentListings() {
  for (const path of LISTING_PATHS) {
    revalidatePath(path);
  }
}

/** After site settings, homepage, branding, or ads change. */
export function revalidateSiteShell() {
  revalidateSiteLayout();
  revalidateContentListings();
}

export function revalidateArticleContent(
  slug: string,
  options?: {
    previousSlug?: string;
    categorySlug?: string;
    previousCategorySlug?: string;
    regionSlugs?: string[];
    previousRegionSlugs?: string[];
  }
) {
  revalidateArticlePage(slug);
  if (options?.previousSlug && options.previousSlug !== slug) {
    revalidateArticlePage(options.previousSlug);
  }
  if (options?.categorySlug) {
    revalidateCategoryPage(options.categorySlug);
  }
  if (
    options?.previousCategorySlug &&
    options.previousCategorySlug !== options.categorySlug
  ) {
    revalidateCategoryPage(options.previousCategorySlug);
  }

  const regionSlugs = new Set([
    ...(options?.regionSlugs ?? []),
    ...(options?.previousRegionSlugs ?? []),
  ]);
  for (const regionSlug of regionSlugs) {
    revalidateCategoryPage(regionSlug);
  }

  revalidateContentListings();
  revalidateSiteLayout();
}

export function revalidateCategoryContent(
  slug: string,
  options?: { previousSlug?: string }
) {
  revalidateCategoryPage(slug);
  if (options?.previousSlug && options.previousSlug !== slug) {
    revalidateCategoryPage(options.previousSlug);
  }
  revalidateContentListings();
}

export function revalidateAuthorContent(
  slug: string,
  options?: { previousSlug?: string }
) {
  revalidateAuthorPage(slug);
  if (options?.previousSlug && options.previousSlug !== slug) {
    revalidateAuthorPage(options.previousSlug);
  }
  revalidateTeamPage();
}
