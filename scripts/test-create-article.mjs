/**
 * Test E2E création d'article via API admin (auth credentials + POST).
 * Usage: node --env-file=.env.local scripts/test-create-article.mjs
 */
const BASE = process.env.NEXTAUTH_URL || "http://localhost:3001";
const EMAIL = "admin@globalsouthwatch.com";
const PASSWORD = "Admin123!";

async function getCsrf(cookieJar) {
  const res = await fetch(`${BASE}/api/auth/csrf`, {
    headers: { cookie: cookieJar },
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) cookieJar = mergeCookie(cookieJar, c);
  const data = await res.json();
  return { csrfToken: data.csrfToken, cookieJar };
}

function mergeCookie(jar, setCookieHeader) {
  const part = setCookieHeader.split(";")[0];
  if (!part) return jar;
  const name = part.split("=")[0];
  const filtered = jar
    .split("; ")
    .filter((c) => c && !c.startsWith(`${name}=`));
  filtered.push(part);
  return filtered.join("; ");
}

async function signIn() {
  let cookieJar = "";
  const { csrfToken, cookieJar: jar1 } = await getCsrf(cookieJar);
  cookieJar = jar1;

  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    callbackUrl: `${BASE}/admin`,
    json: "true",
  });

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: cookieJar,
    },
    body,
    redirect: "manual",
  });

  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookies) cookieJar = mergeCookie(cookieJar, c);

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { cookie: cookieJar },
  });
  const session = await sessionRes.json();

  if (!session?.user?.email) {
    throw new Error(`Login failed: ${JSON.stringify(session)}`);
  }

  return { cookieJar, session };
}

async function getMeta(cookieJar) {
  const res = await fetch(`${BASE}/api/admin/meta`, {
    headers: { cookie: cookieJar },
  });
  if (!res.ok) throw new Error(`meta ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`[test] Base URL: ${BASE}`);

  const { cookieJar, session } = await signIn();
  console.log(`[test] Signed in as ${session.user.email} (${session.user.role})`);

  const meta = await getMeta(cookieJar);
  const categoryId = meta.categories?.[0]?._id;
  const authorId = meta.authors?.[0]?._id;

  if (!categoryId || !authorId) {
    throw new Error("Missing category or author in /api/admin/meta");
  }

  const stamp = Date.now();
  const title = `Test création article ${stamp}`;
  const payload = {
    title,
    subtitle: "Sous-titre de test automatisé",
    excerpt: "Extrait de test pour valider la création d'article via l'API admin.",
    content:
      "<p>Contenu <strong>HTML</strong> de test.</p><p>Paragraphe secondaire.</p>",
    featuredImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200",
    categoryId,
    authorId,
    tags: ["test", "automated"],
    status: "draft",
    contentType: "article",
  };

  const createRes = await fetch(`${BASE}/api/admin/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieJar,
    },
    body: JSON.stringify(payload),
  });

  const createBody = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`POST failed ${createRes.status}: ${JSON.stringify(createBody)}`);
  }

  console.log("[test] Article created:", createBody);

  const getRes = await fetch(`${BASE}/api/admin/articles/${createBody._id}`, {
    headers: { cookie: cookieJar },
  });
  const article = await getRes.json();
  if (!getRes.ok) {
    throw new Error(`GET failed ${getRes.status}: ${JSON.stringify(article)}`);
  }

  const checks = [
    ["title", article.title === title],
    ["slug", typeof article.slug === "string" && article.slug.length > 0],
    ["content sanitized", article.content.includes("<strong>")],
    ["no script", !article.content.toLowerCase().includes("<script")],
    ["categoryId", article.categoryId === categoryId],
    ["status draft", article.status === "draft"],
  ];

  let failed = false;
  for (const [name, ok] of checks) {
    console.log(`[test] Check ${name}: ${ok ? "OK" : "FAIL"}`);
    if (!ok) failed = true;
  }

  const publishRes = await fetch(`${BASE}/api/admin/articles/${createBody._id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieJar,
    },
    body: JSON.stringify({ status: "published" }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok) {
    throw new Error(`PATCH publish failed: ${JSON.stringify(published)}`);
  }
  console.log("[test] Published:", published.slug);

  const publicRes = await fetch(`${BASE}/article/${published.slug}`);
  console.log(`[test] Public page /article/${published.slug}: HTTP ${publicRes.status}`);

  const cleanup = await fetch(`${BASE}/api/admin/articles/${createBody._id}`, {
    method: "DELETE",
    headers: { cookie: cookieJar },
  });
  console.log(`[test] Cleanup DELETE: HTTP ${cleanup.status}`);

  if (failed) process.exit(1);
  console.log("[test] All checks passed.");
}

main().catch((err) => {
  console.error("[test] ERROR:", err.message || err);
  process.exit(1);
});
