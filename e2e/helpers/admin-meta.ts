import { expect, type Page } from "@playwright/test";

export async function fetchMetaIds(page: Page) {
  const res = await page.request.get("/api/admin/meta");
  expect(res.ok()).toBeTruthy();
  const json = (await res.json()) as {
    categories: { _id: string }[];
    authors: { _id: string }[];
  };
  expect(json.categories.length).toBeGreaterThan(0);
  expect(json.authors.length).toBeGreaterThan(0);
  return {
    categoryId: json.categories[0]!._id,
    authorId: json.authors[0]!._id,
  };
}
