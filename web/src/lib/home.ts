// Portfolio-level summaries for Home and Calendar (04 doc §13). Everything here is counted
// from real bundles; when a figure has no data behind it the caller hides the block.
import type { Bundle, CalEvent, Ledger, Promise_, Verdict } from "./types";
import { VERDICTS } from "./types";
import { istDate } from "./time";

// ---------- sector mix (static map for the demo set; exchange industry text for anything else) ----------
const SECTOR: Record<string, string> = {
  NAUKRI: "Technology", PAYTM: "Financials", YESBANK: "Financials", BAJFINANCE: "Financials",
  TATASTEEL: "Materials", RELIANCE: "Energy", SUNPHARMA: "Healthcare",
  DABUR: "Consumer", TRENT: "Consumer", TITAN: "Consumer", DMART: "Consumer", HAVELLS: "Consumer", VGUARD: "Consumer", SYMPHONY: "Consumer",
  LT: "Industrials", ADANIPORTS: "Industrials", ASTRAL: "Industrials", KAJARIACER: "Industrials",
};

const BY_TEXT: [RegExp, string][] = [
  [/bank|financ|insur|nbfc|broking|asset manage|fintech/i, "Financials"],
  [/pharma|health|hospital|diagnos/i, "Healthcare"],
  [/software|comput|it |technology|internet|telecom/i, "Technology"],
  [/steel|metal|mining|cement|chemical|paper|alumin/i, "Materials"],
  [/oil|gas|refin|power|energy|coal/i, "Energy"],
  [/fmcg|consumer|retail|jewel|watch|apparel|textile|food|beverage|personal|durable|auto|hotel|media/i, "Consumer"],
  [/engineer|construct|infra|capital goods|port|logistic|electric|pipe|ceramic|defen|rail|ship/i, "Industrials"],
];

export function sectorOf(symbol: string, industry?: string): string {
  if (SECTOR[symbol]) return SECTOR[symbol];
  for (const [re, s] of BY_TEXT) if (re.test(industry ?? "")) return s;
  return "Other";
}

export const SECTOR_COLORS = ["var(--ink)", "var(--accent)", "var(--watch-solid)", "var(--blue)", "var(--quiet-solid)"];

/** Sector mix by company count: top four sectors, the rest folded into "Other". */
export function sectorMix(bundles: Bundle[]): { name: string; n: number; pct: number }[] {
  const m = new Map<string, number>();
  for (const b of bundles) {
    const s = sectorOf(b.symbol, b.industry);
    m.set(s, (m.get(s) ?? 0) + 1);
  }
  const rows = [...m.entries()].filter(([k]) => k !== "Other").sort((a, b) => b[1] - a[1]);
  const top = rows.slice(0, 4);
  const rest = rows.slice(4).reduce((s, r) => s + r[1], 0) + (m.get("Other") ?? 0);
  if (rest) top.push(["Other", rest]);
  const total = bundles.length || 1;
  return top.map(([name, n]) => ({ name, n, pct: Math.round((n / total) * 100) }));
}

// ---------- promises kept across the portfolio ----------
export function promisesKept(bundles: Bundle[]): { kept: number; due: number; companies: number; pct: number } | null {
  const built = bundles.filter((b) => b.track && b.track.due > 0);
  if (!built.length) return null;
  const kept = built.reduce((s, b) => s + b.track!.kept, 0);
  const due = built.reduce((s, b) => s + b.track!.due, 0);
  return { kept, due, companies: built.length, pct: Math.round((kept / due) * 100) };
}

/** One small bar per promise, in verdict order (capped so it fits one line). */
export function verdictBars(counts: Record<Verdict, number>, cap = 12): Verdict[] {
  const out: Verdict[] = [];
  for (const v of VERDICTS) for (let i = 0; i < counts[v]; i++) out.push(v);
  return out.slice(0, cap);
}

// ---------- calendar ----------
export type EventKind = "Results" | "Dividend" | "Fund raising" | "Board meeting";

export interface PortfolioEvent extends CalEvent {
  symbol: string;
  name: string;
  kind: EventKind;
}

export function eventKind(e: CalEvent): EventKind {
  const t = `${e.purpose} ${e.desc}`;
  if (/result/i.test(t)) return "Results";
  if (/dividend/i.test(e.purpose)) return "Dividend";
  if (/fund|rais|issue|buy.?back/i.test(e.purpose)) return "Fund raising";
  return "Board meeting";
}

export function portfolioEvents(bundles: Bundle[], now = Date.now()): { upcoming: PortfolioEvent[]; recent: PortfolioEvent[]; loaded: boolean } {
  const today = istDate(now);
  const all: PortfolioEvent[] = [];
  let loaded = false;
  for (const b of bundles) {
    if (b.events) loaded = true;
    for (const e of b.events ?? []) all.push({ ...e, symbol: b.symbol, name: b.name.replace(/ Limited$/, ""), kind: eventKind(e) });
  }
  return {
    upcoming: all.filter((e) => e.d >= today).sort((a, b) => a.d.localeCompare(b.d)),
    recent: all.filter((e) => e.d < today).sort((a, b) => b.d.localeCompare(a.d)),
    loaded,
  };
}

/** "Tue 18 Nov" for an exchange date. */
export function dayLabel(ymd: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(ymd + "T00:00:00Z"));
}

// ---------- said vs reported (Track record) ----------
export interface SaidRow {
  call: string;
  said: string; // short form of management's own target
  saidNum: number | null;
  reported: string;
  reportedNum: number | null;
  p: Promise_;
}

const family = (m: string) =>
  m.toLowerCase().replace(/\b(target|guidance|trajectory|outlook|expectation|range|guided)\b/g, "").replace(/\s+/g, " ").trim();

/** First figure in a phrase: "12% to 15%" → 13.5, "around 11%" → 11. */
export function firstNumber(s: string): number | null {
  const r = /(\d+(?:\.\d+)?)\s*%?\s*(?:to|–|-)\s*(\d+(?:\.\d+)?)\s*%/.exec(s);
  if (r) return (Number(r[1]) + Number(r[2])) / 2;
  const m = /(\d+(?:\.\d+)?)\s*%/.exec(s);
  return m ? Number(m[1]) : null;
}

export function shortTarget(s: string): string {
  const m = /(?:~|around |about |over |above |below |at least )?\d+(?:\.\d+)?\s*%?(?:\s*(?:to|–|-)\s*\d+(?:\.\d+)?\s*%?)?/i.exec(s);
  const t = m && /\d/.test(m[0]) ? m[0].trim() : s;
  return t.length > 16 ? t.slice(0, 15) + "…" : t;
}

/**
 * The one metric management has spoken about on the most calls, call by call, next to what the
 * verdict step recorded as reported. Null when no metric appears on at least two calls.
 */
export function saidVsReported(l: Ledger): { metric: string; rows: SaidRow[] } | null {
  const groups = new Map<string, Promise_[]>();
  for (const p of l.promises) {
    const k = family(p.metric);
    if (!k) continue;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  let best: Promise_[] | null = null;
  let bestScore = 0;
  for (const ps of groups.values()) {
    const calls = new Set(ps.map((p) => p.callIdx)).size;
    if (calls < 2) continue;
    const score = calls * 10 + ps.filter((p) => p.actual).length + ps.filter((p) => firstNumber(p.target) != null).length;
    if (score > bestScore) {
      best = ps;
      bestScore = score;
    }
  }
  if (!best) return null;
  const byCall = new Map<number, Promise_>();
  for (const p of best) if (!byCall.has(p.callIdx)) byCall.set(p.callIdx, p);
  const rows = [...byCall.values()]
    .sort((a, b) => a.callIdx - b.callIdx)
    .map((p) => ({
      call: p.call,
      said: shortTarget(p.target),
      saidNum: firstNumber(p.target),
      reported: p.actual ? shortTarget(p.actual) : "–",
      reportedNum: p.actual ? firstNumber(p.actual) : null,
      p,
    }));
  const metric = best[0].metric.replace(/\b(target|guidance|trajectory)\b/gi, "").replace(/\s+/g, " ").trim();
  return { metric, rows };
}
