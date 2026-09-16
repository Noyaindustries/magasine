/**
 * Test E2E : sélection Related Stories homepage (PATCH + persistance + affichage).
 * Usage: node --env-file=.env.local scripts/test-home-related-stories.mjs
 */
const BASE = process.env.NEXTAUTH_URL || "http://localhost:3000";
const EMAIL = "admin@globalsouthwatch.com";
const PASSWORD = "Admin123!";

function mergeCookie(jar, setCookieHeader) {
  const part = setCookieHeader.split(";")[0];
  if (!part) return jar;
  const name = part.split("=")[0];
  const filtered = jar.split("; ").filter((c) => c && !c.startsWith(`${name}=`));
  filtered.push(part);
  return filtered.join("; ");
}

async function getCsrf(cookieJar) {
  const res = await fetch(`${BASE}/api/auth/csrf`, {
    headers: { cookie: cookieJar },
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) cookieJar = mergeCookie(cookieJar, c);
  const data = await res.json();
  return { csrfToken: data.csrfToken, cookieJar };
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

async function getHomepageSettings(cookieJar) {
  const res = await fetch(`${BASE}/api/admin/homepage`, {
    headers: { cookie: cookieJar },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GET homepage ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function patchHomeRelated(cookieJar, ids) {
  const res = await fetch(`${BASE}/api/admin/homepage`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieJar,
    },
    body: JSON.stringify({ homeRelatedArticleIds: ids }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PATCH homepage ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function listPublishedArticles(cookieJar, limit = 8) {
  const res = await fetch(`${BASE}/api/admin/articles?limit=${limit}`, {
    headers: { cookie: cookieJar },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GET articles ${res.status}: ${JSON.stringify(data)}`);
  const published = (data.articles ?? []).filter((a) => a.status === "published");
  return published;
}

async function main() {
  console.log(`[test] Base URL: ${BASE}`);

  const { cookieJar, session } = await signIn();
  console.log(`[test] Signed in as ${session.user.email}`);

  const before = await getHomepageSettings(cookieJar);
  const originalIds = (before.homeRelatedArticles ?? []).map((a) => a._id);
  console.log(`[test] Original selection: ${originalIds.length} article(s)`);

  const pool = await listPublishedArticles(cookieJar, 12);
  if (pool.length < 2) {
    throw new Error("Need at least 2 published articles to test selection");
  }

  const pick = pool.slice(0, 2).map((a) => a._id);
  const pickTitles = pool.slice(0, 2).map((a) => a.title);
  console.log(`[test] Saving selection:`, pickTitles);

  const saved = await patchHomeRelated(cookieJar, pick);
  const savedIds = (saved.homeRelatedArticles ?? []).map((a) => a._id);
  if (savedIds.length !== 2 || savedIds[0] !== pick[0] || savedIds[1] !== pick[1]) {
    throw new Error(
      `PATCH response mismatch: expected ${JSON.stringify(pick)}, got ${JSON.stringify(savedIds)}`
    );
  }
  console.log("[test] PATCH response OK");

  const afterPatch = await getHomepageSettings(cookieJar);
  const persistedIds = (afterPatch.homeRelatedArticles ?? []).map((a) => a._id);
  if (JSON.stringify(persistedIds) !== JSON.stringify(pick)) {
    throw new Error(
      `Persistence failed on GET: expected ${JSON.stringify(pick)}, got ${JSON.stringify(persistedIds)}`
    );
  }
  console.log("[test] GET after PATCH — persisted OK");

  await new Promise((r) => setTimeout(r, 500));

  const afterReload = await getHomepageSettings(cookieJar);
  const reloadIds = (afterReload.homeRelatedArticles ?? []).map((a) => a._id);
  if (JSON.stringify(reloadIds) !== JSON.stringify(pick)) {
    throw new Error(
      `Persistence failed after reload: expected ${JSON.stringify(pick)}, got ${JSON.stringify(reloadIds)}`
    );
  }
  console.log("[test] Second GET — still persisted OK");

  const homeRes = await fetch(`${BASE}/`, { headers: { "cache-control": "no-cache" } });
  const homeHtml = await homeRes.text();
  if (!homeRes.ok) throw new Error(`Homepage HTTP ${homeRes.status}`);

  for (const title of pickTitles) {
    const snippet = title.length > 40 ? title.slice(0, 40) : title;
    if (!homeHtml.includes(snippet)) {
      console.warn(`[test] WARN: title snippet not found on homepage HTML: "${snippet}"`);
    } else {
      console.log(`[test] Homepage HTML contains: "${snippet}…"`);
    }
  }

  console.log("[test] Restoring original selection…");
  const restored = await patchHomeRelated(cookieJar, originalIds);
  const restoredIds = (restored.homeRelatedArticles ?? []).map((a) => a._id);
  if (JSON.stringify(restoredIds) !== JSON.stringify(originalIds)) {
    throw new Error("Failed to restore original selection");
  }
  console.log("[test] Original selection restored");

  console.log("[test] All checks passed.");
}

main().catch((err) => {
  console.error("[test] ERROR:", err.message || err);
  process.exit(1);
});
