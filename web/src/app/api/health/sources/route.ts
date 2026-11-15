// Reachability check: can this deployment's servers reach each data source?
// Kept in the app as a health endpoint (useful for the demo and for debugging blocked sources).
// (Next 16 + cacheComponents: no `dynamic` export; reading the request keeps this handler per-request.)
export const maxDuration = 30;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function probe(name: string, url: string, headers: Record<string, string> = {}) {
  const t = Date.now();
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, ...headers }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    const body = await r.text();
    return { name, ok: r.ok, status: r.status, ms: Date.now() - t, bytes: body.length, sample: body.slice(0, 120) };
  } catch (e) {
    return { name, ok: false, status: 0, ms: Date.now() - t, error: String(e) };
  }
}

export async function GET(request: Request) {
  const scrip = new URL(request.url).searchParams.get("scrip") ?? "500325";
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
  const from = new Date(today.getTime() - 7 * 864e5);
  const results = await Promise.all([
    probe(
      "bse",
      `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate=${ymd(from)}&strScrip=${scrip}&strSearch=P&strToDate=${ymd(today)}&strType=C&subcategory=-1`,
      { Referer: "https://www.bseindia.com/", Origin: "https://www.bseindia.com" },
    ),
    probe("screener", "https://www.screener.in/company/TITAN/consolidated/"),
    probe("bse_pdf", "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=daa6c172-771a-4af5-b4b3-9813fdf7536a.pdf", {
      Referer: "https://www.bseindia.com/",
    }),
    probe("yahoo", "https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?range=1mo&interval=1d"),
    probe("nse", "https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=RELIANCE", {
      Accept: "application/json",
      Referer: "https://www.nseindia.com/",
    }),
  ]);
  return Response.json({ region: process.env.VERCEL_REGION ?? "local", results });
}
