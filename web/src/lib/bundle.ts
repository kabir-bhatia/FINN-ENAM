// Per-company bundle: everything Today and the company page need, in one Blob document.
// Push is batch by nature, so the cron precomputes bundles; screens only read them (R3).
import type { Bundle, Filing, Ledger, TrackSummary } from "./types";
import { nseAnnouncements, screener, yahooBars } from "./sources";
import { classifyRows } from "./classify";
import { getJSON, putJSON } from "./store";

export const DEMO = [
  "NAUKRI", "TATASTEEL", "YESBANK", "SUNPHARMA", "PAYTM", "DABUR", "TRENT", "TITAN", "BAJFINANCE",
  "HAVELLS", "RELIANCE", "LT", "ADANIPORTS", "DMART", // liquid large caps (reliable data)
  "ASTRAL", "KAJARIACER", "VGUARD", "SYMPHONY", // ENAM-like mid caps (relevance)
];

export const cleanSymbol = (s: string) => s.toUpperCase().replace(/[^A-Z0-9&-]/g, "").slice(0, 20);

const key = (s: string) => `b/${s}.json`;
const STALE_MS = 6 * 36e5;
// Bump when classification rules change: cached classifications from older rules are discarded.
export const CLASSIFIER_VERSION = 2;

// Tiny in-instance cache so a warm function does not re-read Blob on every request.
const mem = new Map<string, { at: number; b: Bundle }>();

export async function readBundle(symbol: string): Promise<Bundle | null> {
  const m = mem.get(symbol);
  if (m && Date.now() - m.at < 60_000) return m.b;
  const b = await getJSON<Bundle>(key(symbol));
  if (b) mem.set(symbol, { at: Date.now(), b });
  return b;
}

export function isStale(b: Bundle) {
  return Date.now() - new Date(b.updatedAt).getTime() > STALE_MS;
}

export function summarizeLedger(l: Ledger): TrackSummary | null {
  if (l.status !== "ready" || !l.promises.length) return null;
  const counts = { Kept: 0, Missed: 0, "Target changed": 0, "Went silent": 0, "Too early": 0 } as TrackSummary["counts"];
  for (const p of l.promises) if (p.verdict) counts[p.verdict]++;
  const due = l.promises.filter((p) => p.verdict && p.verdict !== "Too early").length;
  const months = l.transcripts.filter((t) => t.status === "done").map((t) => t.month);
  const span = months.length ? `${months[months.length - 1].split(" ")[0]}–${months[0]}` : "";
  // Spotlight for "Against their word": the most decision-relevant promise from the latest calls.
  const order = ["Target changed", "Missed", "Went silent", "Kept", "Too early"];
  const best = [...l.promises]
    .filter((p) => p.verdict && p.verified)
    .sort((a, b) => order.indexOf(a.verdict!) - order.indexOf(b.verdict!) || b.callIdx - a.callIdx)[0];
  const tr = best && l.transcripts.find((t) => t.month === best.call);
  return {
    builtAt: l.builtAt ?? new Date().toISOString(),
    kept: counts.Kept,
    due,
    counts,
    calls: months.length,
    span,
    spotlight: best
      ? { metric: best.metric, verdict: best.verdict!, text: best.reason ?? "", quote: best.quote, page: best.page, call: best.call, url: tr?.url ?? "" }
      : undefined,
  };
}

export async function buildBundle(symbol: string): Promise<Bundle> {
  const prev = await getJSON<Bundle>(key(symbol), { fresh: true }).catch(() => null);
  const errors: string[] = [];
  const [ann, px, scr, ledger] = await Promise.allSettled([
    nseAnnouncements(symbol, 45),
    yahooBars(symbol),
    screener(symbol),
    getJSON<Ledger>(`t/${symbol}.json`),
  ]);
  const reuse = prev?.cv === CLASSIFIER_VERSION ? prev.filings : [];
  const prior = new Map<string, Filing>(reuse.map((f) => [f.id, f]));
  let filings: Filing[] = prev?.filings ?? [];
  let name = prev?.name ?? symbol;
  let industry = prev?.industry ?? "";
  let llm = prev?.llm ?? { calls: 0, inTok: 0, outTok: 0, inr: 0 };
  if (ann.status === "fulfilled") {
    const rows = ann.value;
    if (rows[0]) {
      name = rows[0].sm_name || name;
      industry = rows[0].smIndustry || industry;
    }
    const { filings: f, cost } = await classifyRows(rows, prior);
    filings = f;
    if (cost) llm = { calls: llm.calls + 1, inTok: llm.inTok + cost.inTok, outTok: llm.outTok + cost.outTok, inr: llm.inr + cost.inr };
  } else errors.push("NSE filings unavailable — showing last saved");
  let prices = prev?.prices ?? [];
  let splits = prev?.splits ?? [];
  if (px.status === "fulfilled") ({ bars: prices, splits } = px.value);
  else errors.push("Prices unavailable");
  let fund = prev?.fund ?? null;
  if (scr.status === "fulfilled") {
    fund = scr.value.fund ?? fund;
    if ((!name || name === symbol) && scr.value.name) name = scr.value.name;
  } else errors.push("Screener unavailable");
  const track = ledger.status === "fulfilled" && ledger.value ? summarizeLedger(ledger.value) : (prev?.track ?? null);
  if (ann.status === "fulfilled" && !ann.value.length && !fund && !prices.length) throw new Error(`No NSE company found for ${symbol}`);
  const b: Bundle = { cv: CLASSIFIER_VERSION, symbol, name, industry, updatedAt: new Date().toISOString(), filings, prices, splits, fund, track, errors, llm };
  await putJSON(key(symbol), b);
  mem.set(symbol, { at: Date.now(), b });
  return b;
}

/** Patch only the track summary (after a ledger is built) without refetching sources. */
export async function patchTrack(symbol: string, l: Ledger) {
  const b = await getJSON<Bundle>(key(symbol), { fresh: true });
  if (!b) return;
  b.track = summarizeLedger(l);
  await putJSON(key(symbol), b);
  mem.set(symbol, { at: Date.now(), b });
}

export async function trackedSymbols(): Promise<string[]> {
  const extra = (await getJSON<string[]>("meta/tracked.json")) ?? [];
  return [...new Set([...DEMO, ...extra])];
}

export async function addTracked(symbol: string) {
  if (DEMO.includes(symbol)) return;
  const extra = (await getJSON<string[]>("meta/tracked.json", { fresh: true })) ?? [];
  if (extra.includes(symbol)) return;
  await putJSON("meta/tracked.json", [...extra, symbol].slice(-60));
}

export async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        try {
          out[k] = { status: "fulfilled", value: await fn(items[k]) };
        } catch (e) {
          out[k] = { status: "rejected", reason: e };
        }
      }
    }),
  );
  return out;
}
