// Scheduled refresh, called by GitHub Actions cron (free, frequent) with a shared secret.
// The work runs here on Vercel bom1 because NSE/Screener are reachable from it (03 doc).
import { buildBundle, cleanSymbol, pool, trackedSymbols } from "@/lib/bundle";

export const preferredRegion = "bom1"; // Mumbai: next to NSE, Screener and BSE PDFs
export const maxDuration = 300;

// Two schedulers, one endpoint: Vercel Cron (daily, Hobby limit) sends "Authorization: Bearer
// CRON_SECRET"; GitHub Actions (intraday, free) sends x-ingest-secret.
function authorized(request: Request) {
  const s1 = process.env.INGEST_SECRET;
  const s2 = process.env.CRON_SECRET;
  const h = request.headers;
  return (!!s1 && h.get("x-ingest-secret") === s1) || (!!s2 && h.get("authorization") === `Bearer ${s2}`);
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const only = new URL(request.url).searchParams.get("only");
  const syms = only ? only.split(",").map(cleanSymbol) : await trackedSymbols();
  const t0 = Date.now();
  const res = await pool(syms, 4, buildBundle);
  const report = res.map((r, i) => ({
    symbol: syms[i],
    ok: r.status === "fulfilled",
    filings: r.status === "fulfilled" ? r.value.filings.length : 0,
    errors: r.status === "fulfilled" ? r.value.errors : [String(r.reason)],
  }));
  return Response.json({ ms: Date.now() - t0, n: syms.length, report });
}
