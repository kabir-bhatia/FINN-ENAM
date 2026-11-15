// Primary-source fetchers. All three key on the NSE symbol (03 doc: no ISIN/BSE map needed).
// Polite scraping (I11): one generic browser UA, short timeouts, everything cached in Blob afterwards.
import type { Bar, ConcallLink, Fundamentals } from "./types";

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function get(url: string, headers: Record<string, string> = {}, ms = 15000) {
  return fetch(url, { headers: { "User-Agent": UA, ...headers }, cache: "no-store", signal: AbortSignal.timeout(ms) });
}

// ---------- NSE corporate announcements ----------
export interface NseRow {
  an_dt: string;
  attchmntFile: string;
  attchmntText: string;
  desc: string;
  seq_id: string;
  sm_name: string;
  smIndustry: string;
  symbol: string;
  voiceSummary?: string;
}

function ddmmyyyy(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

export async function nseAnnouncements(symbol: string, days = 45): Promise<NseRow[]> {
  const to = new Date(Date.now() + 5.5 * 36e5);
  const from = new Date(to.getTime() - days * 864e5);
  const url = `https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=${encodeURIComponent(
    symbol,
  )}&from_date=${ddmmyyyy(from)}&to_date=${ddmmyyyy(to)}`;
  const h = { Accept: "application/json", Referer: "https://www.nseindia.com/" };
  let r = await get(url, h);
  if (r.status === 401 || r.status === 403) {
    // Cookie handshake fallback (needed from some IPs).
    const home = await get("https://www.nseindia.com/", { Accept: "text/html" });
    const cookie = (home.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    r = await get(url, { ...h, Cookie: cookie });
  }
  if (!r.ok) throw new Error(`NSE ${r.status}`);
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

// ---------- Yahoo EOD prices ----------
export async function yahooBars(symbol: string): Promise<{ bars: Bar[]; splits: string[] }> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?range=6mo&interval=1d&events=div%2Csplits`;
  const r = await get(url);
  if (!r.ok) throw new Error(`Yahoo ${r.status}`);
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  if (!res) throw new Error("Yahoo: no data");
  const ts: number[] = res.timestamp ?? [];
  const q = res.indicators?.quote?.[0] ?? {};
  const bars: Bar[] = [];
  ts.forEach((t, i) => {
    const c = q.close?.[i];
    const v = q.volume?.[i];
    if (c == null || v == null) return;
    const d = new Date((t + 5.5 * 3600) * 1000).toISOString().slice(0, 10);
    if (bars.length && bars[bars.length - 1].d === d) bars.pop();
    bars.push({ d, c: Math.round(c * 100) / 100, v });
  });
  const splits = Object.values(res.events?.splits ?? {}).map((s) =>
    new Date(((s as { date: number }).date + 5.5 * 3600) * 1000).toISOString().slice(0, 10),
  );
  return { bars: bars.slice(-70), splits };
}

// ---------- Screener: quarterly table + concall links ----------
const strip = (s: string) =>
  s.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;/g, " ").replace(/\s+/g, " ").trim();

function parseNum(s: string): number | null {
  const t = s.replace(/[,%+\s]/g, "");
  if (!t || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function parseScreener(html: string, url: string): { fund: Fundamentals | null; name: string } {
  const name = strip(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "");
  const sec = /<section id="quarters"[\s\S]*?<\/section>/.exec(html)?.[0];
  let fund: Fundamentals | null = null;
  if (sec) {
    const quarters = [...sec.matchAll(/data-date-key="([^"]+)"/g)].map((m) => m[1]);
    const body = /<tbody>([\s\S]*?)<\/tbody>/.exec(sec)?.[1] ?? "";
    const rows: Record<string, (number | null)[]> = {};
    const pdfs: (string | null)[] = [];
    for (const tr of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      if (!tds.length) continue;
      const label = strip(tds[0]).replace(/\s*\+$/, "").trim();
      if (/raw pdf/i.test(label)) {
        tds.slice(1).forEach((c) => {
          const h = /href="([^"]+)"/.exec(c)?.[1];
          pdfs.push(h ? (h.startsWith("http") ? h : `https://www.screener.in${h}`) : null);
        });
        continue;
      }
      rows[label] = tds.slice(1).map((c) => parseNum(strip(c)));
    }
    const basis = /Consolidated\s+Figures/i.test(strip(sec)) ? "consolidated" : "standalone";
    const lender = "Financing Profit" in rows || ("Revenue" in rows && !("Sales" in rows));
    if (quarters.length && Object.keys(rows).length) {
      fund = { url, basis, lender, quarters, rows, pdfs, concalls: [] };
    }
  }
  const concalls: ConcallLink[] = [];
  const ci = html.indexOf(">Concalls<");
  if (ci > 0) {
    const block = html.slice(ci, ci + 60000);
    const ul = /<ul class="list-links">([\s\S]*?)<\/ul>/.exec(block)?.[1] ?? "";
    for (const li of ul.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const month = strip(/<div[^>]*>([\s\S]*?)<\/div>/.exec(li[1])?.[1] ?? "");
      const links = [...li[1].matchAll(/<a([^>]*)>([\s\S]*?)<\/a>/g)];
      const c: ConcallLink = { month };
      for (const l of links) {
        const href = /href="([^"]+)"/.exec(l[1])?.[1];
        const label = strip(l[2]);
        if (!href) continue;
        if (label === "Transcript") c.transcript = href.replace(/&amp;/g, "&");
        if (label === "PPT") c.ppt = href.replace(/&amp;/g, "&");
      }
      if (month) concalls.push(c);
    }
  }
  if (fund) fund.concalls = concalls;
  return { fund, name };
}

export async function screener(symbol: string): Promise<{ fund: Fundamentals | null; name: string }> {
  // I3: prefer consolidated; fall back to standalone when the consolidated table is empty.
  const urls = [
    `https://www.screener.in/company/${encodeURIComponent(symbol)}/consolidated/`,
    `https://www.screener.in/company/${encodeURIComponent(symbol)}/`,
  ];
  let last: { fund: Fundamentals | null; name: string } = { fund: null, name: "" };
  for (const u of urls) {
    const r = await get(u, { Accept: "text/html" });
    if (r.status === 404) continue;
    if (!r.ok) throw new Error(`Screener ${r.status}`);
    const parsed = parseScreener(await r.text(), u);
    const sales = parsed.fund && (parsed.fund.rows["Sales"] ?? parsed.fund.rows["Revenue"]);
    if (parsed.fund && sales && sales.some((v) => v != null && v !== 0)) return parsed;
    last = parsed.fund || !last.name ? parsed : last;
  }
  return last;
}

export async function screenerSearch(q: string): Promise<{ symbol: string; name: string }[]> {
  const r = await get(`https://www.screener.in/api/company/search/?q=${encodeURIComponent(q)}&v=3&fts=1`, {
    Accept: "application/json",
  });
  if (!r.ok) return [];
  const j = (await r.json()) as { name: string; url: string }[];
  return j
    .map((x) => ({ name: x.name, symbol: /\/company\/([^/]+)\//.exec(x.url ?? "")?.[1] ?? "" }))
    .filter((x) => x.symbol && !/^\d+$/.test(x.symbol)) // NSE-listed only (BSE-only cos have numeric codes)
    .slice(0, 8);
}
