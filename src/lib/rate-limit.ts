import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Fenêtre glissante en millisecondes */
  windowMs: number;
  /** Nombre max de requêtes par fenêtre */
  max: number;
  /** Préfixe pour isoler les endpoints */
  prefix: string;
};

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60_000,
  max: 20,
  prefix: "global",
};

function pruneExpired(now: number): void {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function checkRateLimit(
  request: NextRequest,
  options: Partial<RateLimitOptions> = {},
): { ok: true } | { ok: false; retryAfterSec: number } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const ip = getClientIp(request);
  const key = `${opts.prefix}:${ip}`;
  const now = Date.now();

  pruneExpired(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > opts.max) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  return { ok: true };
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  );
}

/**
 * Applique un rate limit ; retourne une réponse 429 ou null si OK.
 */
export function enforceRateLimit(
  request: NextRequest,
  options: Partial<RateLimitOptions> = {},
): NextResponse | null {
  const result = checkRateLimit(request, options);
  if (!result.ok) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}
