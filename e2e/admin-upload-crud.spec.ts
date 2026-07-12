import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./helpers/admin-auth";
import { fetchMetaIds } from "./helpers/admin-meta";
import { e2ePngUpload, MINIMAL_PNG } from "./helpers/test-fixtures";

test.describe.configure({ mode: "serial", timeout: 180_000 });

test.describe("Admin — médiathèque (API)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("upload local, téléchargement HTTP et suppression", async ({ page }) => {
    const fileName = `e2e-media-${Date.now()}.png`;
    const title = `E2E media ${Date.now()}`;

    const uploadRes = await page.request.post("/api/admin/medias", {
      multipart: {
        file: e2ePngUpload(fileName),
        title,
      },
    });
    expect(uploadRes.ok(), await uploadRes.text()).toBeTruthy();
    const uploaded = (await uploadRes.json()) as {
      _id: string;
      url: string;
      title: string;
    };
    expect(uploaded._id).toBeTruthy();
    expect(uploaded.url).toMatch(
      /^(\/uploads\/media\/|https:\/\/[^/]+\.blob\.vercel-storage\.com\/)/
    );

    const downloadRes = await page.request.get(uploaded.url);
    expect(downloadRes.ok()).toBeTruthy();
    expect(downloadRes.headers()["content-type"]).toMatch(/image\/png/i);
    expect((await downloadRes.body()).equals(MINIMAL_PNG)).toBe(true);

    const listRes = await page.request.get(`/api/admin/medias?q=${encodeURIComponent(title)}`);
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { items?: { _id: string }[] };
    expect(list.items?.some((m) => m._id === uploaded._id)).toBe(true);

    const deleteRes = await page.request.delete(`/api/admin/medias/${uploaded._id}`);
    expect(deleteRes.ok()).toBeTruthy();

    const afterDelete = await page.request.get(`/api/admin/medias?q=${encodeURIComponent(title)}`);
    const afterJson = (await afterDelete.json()) as { items?: { _id: string }[] };
    expect(afterJson.items?.some((m) => m._id === uploaded._id)).toBe(false);
  });
});

test.describe("Admin — articles (API)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("enregistrement, modification et suppression", async ({ page }) => {
    const stamp = Date.now();
    const { categoryId, authorId } = await fetchMetaIds(page);
    const title = `E2E article ${stamp}`;
    const updatedTitle = `E2E article modifié ${stamp}`;
    const slug = `e2e-article-${stamp}`;

    const createRes = await page.request.post("/api/admin/articles", {
      data: {
        title,
        excerpt: "Résumé E2E",
        content: "<p>Contenu initial E2E.</p>",
        featuredImage:
          "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop",
        categoryId,
        authorId,
        status: "draft",
        slug,
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { _id: string; slug: string };

    const getRes = await page.request.get(`/api/admin/articles/${created._id}`);
    expect((await getRes.json()) as { title: string }).toMatchObject({ title });

    const patchRes = await page.request.patch(`/api/admin/articles/${created._id}`, {
      data: { title: updatedTitle },
    });
    expect(patchRes.ok()).toBeTruthy();

    const getUpdated = await page.request.get(`/api/admin/articles/${created._id}`);
    expect((await getUpdated.json()) as { title: string }).toMatchObject({
      title: updatedTitle,
    });

    const deleteRes = await page.request.delete(`/api/admin/articles/${created._id}`);
    expect(deleteRes.ok()).toBeTruthy();
    expect((await page.request.get(`/api/admin/articles/${created._id}`)).status()).toBe(404);
  });

  test("co-signature avec plusieurs auteurs", async ({ page }) => {
    const stamp = Date.now();
    const { categoryId, authorId } = await fetchMetaIds(page);

    const secondAuthorRes = await page.request.post("/api/admin/authors", {
      data: { name: `E2E co-auteur ${stamp}` },
    });
    expect(secondAuthorRes.status(), await secondAuthorRes.text()).toBe(201);
    const secondAuthor = (await secondAuthorRes.json()) as { _id: string };

    const createRes = await page.request.post("/api/admin/articles", {
      data: {
        title: `E2E co-signature ${stamp}`,
        excerpt: "Résumé co-signature E2E",
        content: "<p>Article co-signé E2E.</p>",
        featuredImage:
          "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop",
        categoryId,
        authorIds: [authorId, secondAuthor._id],
        status: "draft",
        slug: `e2e-co-signature-${stamp}`,
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { _id: string };

    const getRes = await page.request.get(`/api/admin/articles/${created._id}`);
    expect(getRes.ok()).toBeTruthy();
    const article = (await getRes.json()) as { authorIds: string[]; authorId: string };
    expect(article.authorIds).toEqual([authorId, secondAuthor._id]);
    expect(article.authorId).toBe(authorId);

    await page.request.delete(`/api/admin/articles/${created._id}`);
    await page.request.delete(`/api/admin/authors/${secondAuthor._id}`);
  });

  test("antidate un article publié via publishedAt", async ({ page }) => {
    const stamp = Date.now();
    const { categoryId, authorId } = await fetchMetaIds(page);
    const backdate = new Date("2020-06-15T10:30:00.000Z").toISOString();

    const createRes = await page.request.post("/api/admin/articles", {
      data: {
        title: `E2E antidate ${stamp}`,
        excerpt: "Résumé antidate E2E",
        content: "<p>Article antidaté E2E.</p>",
        featuredImage:
          "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop",
        categoryId,
        authorId,
        status: "published",
        publishedAt: backdate,
        slug: `e2e-antidate-${stamp}`,
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { _id: string };

    const getRes = await page.request.get(`/api/admin/articles/${created._id}`);
    expect(getRes.ok()).toBeTruthy();
    const article = (await getRes.json()) as { publishedAt?: string };
    expect(new Date(article.publishedAt!).toISOString()).toBe(backdate);

    await page.request.delete(`/api/admin/articles/${created._id}`);
  });

  test("conserve le layout flottant dans le contenu HTML", async ({ page }) => {
    const stamp = Date.now();
    const { categoryId, authorId } = await fetchMetaIds(page);
    const imageUrl =
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop";
    const content = `<p>Paragraphe d'introduction.</p><img src="${imageUrl}" alt="Illustration E2E" class="art-img-float-left" data-image-layout="float-left" /><p>Texte qui continue à côté de l'illustration.</p>`;

    const createRes = await page.request.post("/api/admin/articles", {
      data: {
        title: `E2E float image ${stamp}`,
        excerpt: "Résumé layout E2E",
        content,
        featuredImage:
          "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop",
        categoryId,
        authorId,
        status: "draft",
        slug: `e2e-float-image-${stamp}`,
      },
    });
    expect(createRes.status(), await createRes.text()).toBe(201);
    const created = (await createRes.json()) as { _id: string };

    const getRes = await page.request.get(`/api/admin/articles/${created._id}`);
    expect(getRes.ok()).toBeTruthy();
    const article = (await getRes.json()) as { content: string };
    expect(article.content).toContain('class="art-img-float-left"');
    expect(article.content).toContain('data-image-layout="float-left"');

    await page.request.delete(`/api/admin/articles/${created._id}`);
  });
});
