import { NextRequest, NextResponse } from "next/server";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type RatingPayload =
  | { ok: true; rating: number | null; provisional: boolean; source: "history" | "html"; contestCount: number }
  | { ok: false; reason: "not_found" | "error" };

async function tryHistoryJson(user: string): Promise<RatingPayload | null> {
  try {
    const res = await fetch(`https://atcoder.jp/users/${encodeURIComponent(user)}/history.json`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return { ok: false, reason: "error" };
    const arr = (await res.json()) as { NewRating: number }[];
    if (!Array.isArray(arr) || arr.length === 0) {
      return { ok: true, rating: null, provisional: false, source: "history", contestCount: 0 };
    }
    const last = arr[arr.length - 1].NewRating;
    return {
      ok: true,
      rating: typeof last === "number" ? last : null,
      provisional: arr.length < 6,
      source: "history",
      contestCount: arr.length,
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}

async function tryHtmlPage(user: string): Promise<RatingPayload> {
  try {
    const res = await fetch(`https://atcoder.jp/users/${encodeURIComponent(user)}`, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      cache: "no-store",
    });
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (!res.ok) return { ok: false, reason: "error" };
    const html = await res.text();

    const match = html.match(/var\s+rating_history\s*=\s*(\[[^;]*?\]);/);
    if (!match) {
      return { ok: true, rating: null, provisional: false, source: "html", contestCount: 0 };
    }
    const history = JSON.parse(match[1]) as { NewRating: number }[];
    if (!Array.isArray(history) || history.length === 0) {
      return { ok: true, rating: null, provisional: false, source: "html", contestCount: 0 };
    }
    const last = history[history.length - 1].NewRating;
    return {
      ok: true,
      rating: typeof last === "number" ? last : null,
      provisional: history.length < 6,
      source: "html",
      contestCount: history.length,
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!user || !/^[A-Za-z0-9_-]{1,32}$/.test(user)) {
    return NextResponse.json({ ok: false, reason: "error" }, { status: 400 });
  }

  const fromHistory = await tryHistoryJson(user);
  if (fromHistory) {
    return NextResponse.json(fromHistory, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  }

  const fromHtml = await tryHtmlPage(user);
  return NextResponse.json(fromHtml, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
