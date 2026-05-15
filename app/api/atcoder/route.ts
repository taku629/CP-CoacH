import { NextRequest, NextResponse } from "next/server";

const BASE = "https://kenkoooo.com/atcoder";

const ALLOWED_PATHS: Array<{ prefix: string; cacheSeconds: number }> = [
  { prefix: "/resources/merged-problems.json", cacheSeconds: 3600 },
  { prefix: "/resources/problem-models.json", cacheSeconds: 3600 },
  { prefix: "/atcoder-api/v3/user/submissions", cacheSeconds: 300 },
];

function isAllowed(path: string): { ok: boolean; cacheSeconds: number } {
  for (const rule of ALLOWED_PATHS) {
    if (path.startsWith(rule.prefix)) {
      return { ok: true, cacheSeconds: rule.cacheSeconds };
    }
  }
  return { ok: false, cacheSeconds: 0 };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  let lastErr: unknown = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json,*/*;q=0.9",
          "Accept-Language": "ja,en;q=0.9",
        },
        cache: "no-store",
      });
      if (res.ok) return res;
      if (res.status >= 500 || res.status === 429) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  if (lastErr) throw lastErr;
  throw new Error("fetch failed after retries");
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  const query = req.nextUrl.searchParams.get("q") ?? "";

  if (!path) {
    return NextResponse.json({ error: "path parameter required" }, { status: 400 });
  }

  const { ok, cacheSeconds } = isAllowed(path);
  if (!ok) {
    return NextResponse.json({ error: "path not allowed" }, { status: 403 });
  }

  const upstreamUrl = `${BASE}${path}${query ? `?${query}` : ""}`;

  try {
    const upstream = await fetchWithRetry(upstreamUrl);
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}`, upstream: upstream.status },
        { status: 502 }
      );
    }
    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
