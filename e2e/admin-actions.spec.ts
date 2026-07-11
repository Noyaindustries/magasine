import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";
import { fetchMetaIds } from "./helpers/admin-meta";

test.describe.configure({ mode: "serial", timeout: 120_000 });

const ADMIN_READ_ENDPOINTS = [
  { path: "/api/admin/meta", key: "categories" },
  { path: "/api/admin/settings", key: "siteName" },
  { path: "/api/admin/homepage", key: "homeSections" },
  { path: "/api/admin/users", key: "users" },
  { path: "/api/admin/comments", key: "comments" },
  { path: "/api/admin/categories", key: "categories" },
  { path: "/api/admin/authors", key: "authors" },
  { path: "/api/admin/publicites", key: "zones" },
  { path: "/api/admin/analytics", key: "pageViews" },
  { path: "/api/admin/newsletter/stats", key: "totalActive" },
] as const;

const ADMIN_PAGES = [
  "/admin",
  "/admin/articles",
  "/admin/articles/new",
  "/admin/medias",
  "/admin/comments",
  "/admin/users",
  "/admin/authors",
  "/admin/categories",
  "/admin/homepage",
  "/admin/publicites",
  "/admin/newsletter",
  "/admin/analytics",
  "/admin/seo",
  "/admin/settings",
] as const;

test.describe("Admin — API lecture", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const endpoint of ADMIN_READ_ENDPOINTS) {
    test(`GET ${endpoint.path}`, async ({ page }) => {
      const res = await page.request.get(endpoint.path);
      expect(res.ok(), await res.text()).toBeTruthy();
      const json = (await res.json()) as Record<string, unknown>;
      expect(json[endpoint.key]).toBeDefined();
    });
  }
});

test.describe("Admin — catégories (API)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("création, modification et suppression", async ({ page }) => {
    const stamp = Date.now();
    const name = `E2E Cat ${stamp}`;

    const createRes = await page.request.post("/api/admin/categories", {
      data: { name, description: "Rubrique E2E", color: "#1A3896" },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { _id: string; slug: string };
    expect(created._id).toBeTruthy();

    const patchRes = await page.request.patch(`/api/admin/categories/${created._id}`, {
      data: { description: "Rubrique E2E modifiée" },
    });
    expect(patchRes.ok(), await patchRes.text()).toBeTruthy();

    const listRes = await page.request.get("/api/admin/categories");
    const list = (await listRes.json()) as { categories: { _id: string; description: string }[] };
    const row = list.categories.find((c) => c._id === created._id);
    expect(row?.description).toBe("Rubrique E2E modifiée");

    const deleteRes = await page.request.delete(`/api/admin/categories/${created._id}`);
    expect(deleteRes.ok(), await deleteRes.text()).toBeTruthy();
  });
});

test.describe("Admin — page d'accueil (API)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("toggle section hero puis restauration", async ({ page }) => {
    const beforeRes = await page.request.get("/api/admin/homepage");
    expect(beforeRes.ok()).toBeTruthy();
    const before = (await beforeRes.json()) as { homeSections: { hero: boolean } };
    const originalHero = before.homeSections.hero;

    const patchRes = await page.request.patch("/api/admin/homepage", {
      data: { homeSections: { hero: !originalHero } },
    });
    expect(patchRes.ok(), await patchRes.text()).toBeTruthy();

    const toggled = (await (await page.request.get("/api/admin/homepage")).json()) as {
      homeSections: { hero: boolean };
    };
    expect(toggled.homeSections.hero).toBe(!originalHero);

    const restoreRes = await page.request.patch("/api/admin/homepage", {
      data: { homeSections: { hero: originalHero } },
    });
    expect(restoreRes.ok()).toBeTruthy();
  });
});

test.describe("Admin — auteurs (API)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("création et suppression", async ({ page }) => {
    const stamp = Date.now();
    const name = `E2E Author ${stamp}`;

    const createRes = await page.request.post("/api/admin/authors", {
      data: { name, bio: "Auteur E2E" },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { _id: string };

    const deleteRes = await page.request.delete(`/api/admin/authors/${created._id}`);
    expect(deleteRes.ok(), await deleteRes.text()).toBeTruthy();
    const deleted = (await deleteRes.json()) as { success: boolean; detachedFromArticles: number };
    expect(deleted.success).toBe(true);
    expect(deleted.detachedFromArticles).toBe(0);

    const listRes = await page.request.get("/api/admin/authors");
    const list = (await listRes.json()) as { authors: { _id: string }[] };
    expect(list.authors.some((a) => a._id === created._id)).toBe(false);
  });

  test("refuse la suppression si seul auteur d'un article", async ({ page }) => {
    const stamp = Date.now();
    const name = `E2E Sole Author ${stamp}`;
    const { categoryId } = await fetchMetaIds(page);

    const authorRes = await page.request.post("/api/admin/authors", {
      data: { name, bio: "Auteur seul E2E" },
    });
    expect(authorRes.status(), await authorRes.text()).toBe(201);
    const author = (await authorRes.json()) as { _id: string };

    const articleRes = await page.request.post("/api/admin/articles", {
      data: {
        title: `E2E sole author ${stamp}`,
        excerpt: "Test suppression auteur",
        content: "<p>Article E2E auteur unique.</p>",
        featuredImage:
          "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop",
        categoryId,
        authorId: author._id,
        status: "draft",
        slug: `e2e-sole-author-${stamp}`,
      },
    });
    expect(articleRes.status(), await articleRes.text()).toBe(201);
    const article = (await articleRes.json()) as { _id: string };

    const deleteAuthorRes = await page.request.delete(`/api/admin/authors/${author._id}`);
    expect(deleteAuthorRes.status()).toBe(409);
    const body = (await deleteAuthorRes.json()) as { error: string };
    expect(body.error).toMatch(/article/i);

    await page.request.delete(`/api/admin/articles/${article._id}`);
    await page.request.delete(`/api/admin/authors/${author._id}`);
  });
});

test.describe("Admin — utilisateurs (API)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("création et suppression d'un lecteur", async ({ page }) => {
    const stamp = Date.now();
    const email = `e2e-user-${stamp}@example.com`;

    const createRes = await page.request.post("/api/admin/users", {
      data: {
        name: `E2E User ${stamp}`,
        email,
        role: "reader",
        password: "Password123!",
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { _id: string };

    const deleteRes = await page.request.delete("/api/admin/users", {
      data: { userId: created._id },
    });
    expect(deleteRes.ok(), await deleteRes.text()).toBeTruthy();

    const listRes = await page.request.get("/api/admin/users");
    const list = (await listRes.json()) as { users: { _id: string }[] };
    expect(list.users.some((u) => u._id === created._id)).toBe(false);
  });
});

test.describe("Admin — navigation UI", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const path of ADMIN_PAGES) {
    test(`charge ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator(".cms-shell")).toBeVisible({ timeout: 60_000 });
      await expect(page.locator("main")).toBeVisible();
    });
  }
});
