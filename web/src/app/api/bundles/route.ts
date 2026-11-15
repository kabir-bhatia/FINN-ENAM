// Portfolio read path: one request returns every company's precomputed bundle.
// Missing companies (a ticker the user just added) are built live; stale ones are served
// immediately and refreshed after the response (stale-while-revalidate), so Today never waits.
import { after } from "next/server";
import { addTracked, buildBundle, cleanSymbol, isStale, pool, readBundle } from "@/lib/bundle";
import type { Bundle } from "@/lib/types";

export const maxDuration = 120;

export async function GET(request: Request) {
  const syms = [...new Set((new URL(request.url).searchParams.get("s") ?? "").split(",").map(cleanSymbol).filter(Boolean))].slice(0, 40);
  const stale: string[] = [];
  const res = await pool(syms, 6, async (s) => {
    const b = await readBundle(s);
    if (b) {
      if (isStale(b)) stale.push(s);
      return b;
    }
    const nb = await buildBundle(s);
    await addTracked(s);
    return nb;
  });
  const bundles: Bundle[] = [];
  const failed: { symbol: string; error: string }[] = [];
  res.forEach((r, i) => (r.status === "fulfilled" ? bundles.push(r.value) : failed.push({ symbol: syms[i], error: String(r.reason?.message ?? r.reason) })));
  if (stale.length) after(() => pool(stale.slice(0, 8), 4, buildBundle).then(() => undefined));
  return Response.json(
    { bundles, failed, servedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
