// Pure ranking logic, run in the browser so changing the window or a rule re-ranks instantly.
// Deterministic by design (D2): category weight + the user's own rules. No model in the ranking.
import type { Bar, Bundle, Category, Filing, Fundamentals, Rules, WindowKey } from "./types";
import { fyQuarter, istDate } from "./time";

export const CAT_LABEL: Record<Category, string> = {
  governance: "Governance",
  results: "Results",
  mna: "M&A",
  management: "Top management",
  fundraise: "Fund-raise",
  dividend: "Dividend",
  rating: "Credit rating",
  orders: "Orders",
  concall: "Call transcript",
  other: "Business update",
  routine: "Routine",
};

export const RULE_CATS: Category[] = ["results", "mna", "management", "fundraise", "dividend", "rating", "orders"];

export const DEFAULT_RULES: Rules = { vol: 2, pct: 5, onlyUnexplained: true, cats: ["results", "mna", "management", "fundraise"] };

export type Tier = "act" | "know" | "routine";

export function tierOf(f: Filing, rules: Rules): Tier {
  if (f.category === "governance") return "act"; // always (A3)
  if (f.category === "routine") return "routine";
  return rules.cats.includes(f.category) ? "act" : "know";
}

const W: Record<Category, number> = {
  governance: 100, results: 80, mna: 70, management: 60, fundraise: 60, rating: 45, orders: 40, dividend: 30, concall: 25, other: 20, routine: 0,
};

export function windowStart(w: WindowKey, since: number, now = Date.now()): number {
  if (w === "24h") return now - 864e5;
  if (w === "7d") return now - 7 * 864e5;
  if (w === "30d") return now - 30 * 864e5;
  return since;
}

export const WINDOW_LABEL: Record<WindowKey, string> = {
  since: "Since you last looked",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

// ---------- price / volume moves (A4) ----------
export interface Move {
  symbol: string;
  d: string; // session date
  chg: number; // % vs previous close
  ratio: number; // volume ÷ 20-day average (excluding the day, I7)
  avgVol: number;
  volFired: boolean;
  pctFired: boolean;
  explainedBy?: Filing;
}

export function movesFor(b: Bundle, rules: Rules, fromMs: number): Move[] {
  const bars = b.prices;
  const out: Move[] = [];
  for (let i = 21; i < bars.length; i++) {
    const bar = bars[i];
    const closeMs = new Date(`${bar.d}T15:30:00+05:30`).getTime();
    if (closeMs < fromMs) continue;
    const prev = bars[i - 1];
    const avg = bars.slice(i - 20, i).reduce((s, x) => s + x.v, 0) / 20;
    const ratio = avg ? bar.v / avg : 0;
    const chg = (bar.c / prev.c - 1) * 100;
    const volFired = ratio >= rules.vol;
    const pctFired = Math.abs(chg) >= rules.pct;
    if (!volFired && !pctFired) continue;
    // I6: skip split/bonus days — the price "move" is mechanical.
    if (b.splits.some((s) => Math.abs(new Date(s).getTime() - new Date(bar.d).getTime()) <= 864e5)) continue;
    out.push({ symbol: b.symbol, d: bar.d, chg, ratio, avgVol: avg, volFired, pctFired, explainedBy: explain(b.filings, bar, prev) });
  }
  return out;
}

/** A move is explained by a non-routine filing between the previous close and this close. */
function explain(fs: Filing[], bar: Bar, prev: Bar): Filing | undefined {
  const from = new Date(`${prev.d}T15:30:00+05:30`).getTime();
  const to = new Date(`${bar.d}T15:30:00+05:30`).getTime();
  return fs
    .filter((f) => f.category !== "routine" && f.category !== "concall")
    .filter((f) => {
      const t = new Date(f.at).getTime();
      return t > from - 3 * 36e5 && t <= to;
    })
    .sort((a, b) => W[b.category] - W[a.category])[0];
}

// ---------- results (deterministic numbers, C4 + I1/I2/I3) ----------
export interface ResultsView {
  period: string;
  q: string;
  months: string;
  basis: string;
  lender: boolean;
  rows: { label: string; key: string; now: number | null; qoq: number | null; yoy: number | null; computed?: boolean; formula?: string }[];
  margin?: { now: number | null; lastYear: number | null };
  pdf: string | null;
  source: string;
}

const pct = (a: number | null | undefined, b: number | null | undefined) =>
  a == null || b == null || b === 0 ? null : ((a - b) / Math.abs(b)) * 100;

export function resultsView(f: Fundamentals | null, i?: number): ResultsView | null {
  if (!f || !f.quarters.length) return null;
  const n = f.quarters.length;
  const k = i ?? n - 1;
  const r = f.rows;
  const at = (key: string, j: number) => (r[key] && j >= 0 ? r[key][j] ?? null : null);
  const ebitda = (j: number) => {
    const pbt = at("Profit before tax", j);
    const fin = at("Interest", j);
    const dep = at("Depreciation", j);
    const oi = at("Other Income", j);
    if (pbt == null || fin == null || dep == null || oi == null) return null;
    return pbt + fin + dep - oi;
  };
  const salesKey = r["Sales"] ? "Sales" : "Revenue";
  const row = (label: string, key: string, get: (j: number) => number | null, extra = {}) => ({
    label, key, now: get(k), qoq: pct(get(k), get(k - 1)), yoy: pct(get(k), get(k - 4)), ...extra,
  });
  const rows = [row(f.lender ? "Revenue" : "Sales", salesKey, (j) => at(salesKey, j))];
  if (!f.lender)
    rows.push(
      row("EBITDA", "EBITDA", ebitda, {
        computed: true,
        formula: "PBT + finance cost + depreciation − other income",
      }),
    );
  rows.push(row("PBT", "Profit before tax", (j) => at("Profit before tax", j)));
  rows.push(row("Profit (PAT)", "Net Profit", (j) => at("Net Profit", j)));
  const e = (j: number) => {
    const s = at(salesKey, j);
    const x = ebitda(j);
    return s && x != null ? (x / s) * 100 : null;
  };
  const { q, months } = fyQuarter(f.quarters[k]);
  return {
    period: f.quarters[k],
    q,
    months,
    basis: f.basis,
    lender: f.lender,
    rows,
    margin: f.lender ? undefined : { now: e(k), lastYear: e(k - 4) },
    pdf: f.pdfs[k] ?? null,
    source: f.url,
  };
}

/** Results card only when the standard table already has the quarter the filing reports. */
function resultsForFiling(b: Bundle, fl: Filing): ResultsView | null {
  if (!b.fund) return null;
  const end = b.fund.quarters[b.fund.quarters.length - 1];
  const days = (new Date(fl.at).getTime() - new Date(end).getTime()) / 864e5;
  return days >= 0 && days <= 75 ? resultsView(b.fund) : null;
}

// ---------- company state + Today ----------
export type State = "challenged" | "look" | "unchanged";

export interface CompanyDay {
  b: Bundle;
  state: State;
  reason: string;
  items: Filing[]; // non-routine in window, ranked
  routine: Filing[];
  moves: Move[];
  alert?: Move; // most recent fired rule (respecting onlyUnexplained)
  results?: { filing: Filing; view: ResultsView | null };
  filingsRead: number;
}

export function rank(fs: Filing[]): Filing[] {
  return [...fs].sort((a, b) => {
    const sa = W[a.category] + (a.govSeverity === "high" ? 30 : 0);
    const sb = W[b.category] + (b.govSeverity === "high" ? 30 : 0);
    return sb - sa || b.at.localeCompare(a.at);
  });
}

export function companyDay(b: Bundle, rules: Rules, fromMs: number): CompanyDay {
  const inWin = b.filings.filter((f) => new Date(f.at).getTime() >= fromMs);
  const items = rank(inWin.filter((f) => f.category !== "routine"));
  const routine = inWin.filter((f) => f.category === "routine");
  const moves = movesFor(b, rules, fromMs);
  const fired = moves.filter((m) => !rules.onlyUnexplained || !m.explainedBy);
  const alert = fired[fired.length - 1];
  const resF = items.find((f) => f.category === "results");
  const results = resF ? { filing: resF, view: resultsForFiling(b, resF) } : undefined;

  const govHigh = items.find((f) => f.category === "governance" && f.govSeverity === "high");
  const gov = items.find((f) => f.category === "governance");
  const pat = results?.view?.rows.find((r) => r.key === "Net Profit");
  const profitFell = pat?.yoy != null && pat.yoy <= -20;
  const act = items.filter((f) => tierOf(f, rules) === "act");

  let state: State = "unchanged";
  let reason = "";
  if (govHigh) {
    state = "challenged";
    reason = `${govHigh.govKind ?? "Governance"}: ${govHigh.headline}`;
  } else if (profitFell) {
    state = "challenged";
    reason = `Profit ${fmtPct(pat!.yoy!)} vs last year (${results!.view!.q})`;
  } else if (gov) {
    state = "look";
    reason = `${gov.govKind ?? "Governance"}: ${gov.headline}`;
  } else if (alert) {
    state = "look";
    reason = moveSentence(alert, true);
  } else if (act.length) {
    state = "look";
    const f = act[0];
    reason = f.category === "results" && results?.view ? resultsHeadline(results.view) : f.headline;
  }
  return { b, state, reason, items, routine, moves, alert, results, filingsRead: inWin.length };
}

export const fmtPct = (x: number) => `${x >= 0 ? "▲" : "▼"}${Math.abs(x).toFixed(Math.abs(x) >= 100 ? 0 : 1)}%`;

export function moveSentence(m: Move, short = false): string {
  const dir = m.chg >= 0 ? "rose" : "fell";
  const parts: string[] = [];
  if (m.volFired) parts.push(`${m.ratio.toFixed(1)}× its usual volume`);
  const p = `${dir} ${Math.abs(m.chg).toFixed(1)}%`;
  if (short) return `${m.chg >= 0 ? "+" : "−"}${Math.abs(m.chg).toFixed(1)}% on ${m.ratio.toFixed(1)}× volume${m.explainedBy ? "" : ", no filing"}`;
  return parts.length ? `traded ${parts[0]} and ${p}` : p;
}

export function resultsHeadline(v: ResultsView): string {
  const pat = v.rows.find((r) => r.key === "Net Profit");
  const sales = v.rows[0];
  if (!pat || pat.yoy == null) return `${v.q} results filed`;
  const y = pat.yoy;
  const verb =
    y >= 90 ? "Profit roughly doubled from a year ago" :
    y >= 20 ? `Profit up ${Math.round(y)}% from a year ago` :
    y > -5 ? "Profit roughly flat vs last year" :
    y > -20 ? `Profit down ${Math.round(-y)}% from a year ago` :
    `Profit fell ${Math.round(-y)}% from a year ago`;
  const s = sales?.yoy != null ? `; ${v.lender ? "revenue" : "sales"} ${sales.yoy >= 0 ? "up" : "down"} ${Math.abs(Math.round(sales.yoy))}%` : "";
  return verb + s;
}

export interface Today {
  days: CompanyDay[];
  counts: Record<State, number>;
  filingsRead: number;
  routine: Filing[];
  cards: Card[];
}

export type Card =
  | { kind: "alert"; day: CompanyDay; move: Move }
  | { kind: "filing"; day: CompanyDay; filing: Filing };

export function buildToday(bundles: Bundle[], rules: Rules, fromMs: number): Today {
  const days = bundles.map((b) => companyDay(b, rules, fromMs));
  const order: Record<State, number> = { challenged: 0, look: 1, unchanged: 2 };
  days.sort((a, b) => order[a.state] - order[b.state] || b.items.length - a.items.length);
  const counts = { challenged: 0, look: 0, unchanged: 0 } as Record<State, number>;
  days.forEach((d) => counts[d.state]++);
  const cards: Card[] = [];
  // 1. Your rules fired (fix #5: an alert you asked for goes to the top).
  for (const d of days) if (d.alert) cards.push({ kind: "alert", day: d, move: d.alert });
  // 2. Needs you: governance, then the user's chosen categories. 3. Worth knowing.
  const filingCards: Card[] = [];
  for (const d of days) for (const f of d.items) filingCards.push({ kind: "filing", day: d, filing: f });
  const score = (c: Card) => (c.kind === "filing" ? W[c.filing.category] + (c.filing.govSeverity === "high" ? 30 : 0) + (tierOf(c.filing, rules) === "act" ? 100 : 0) : 999);
  filingCards.sort((a, b) => score(b) - score(a) || (b as { filing: Filing }).filing.at.localeCompare((a as { filing: Filing }).filing.at));
  cards.push(...filingCards);
  return {
    days,
    counts,
    filingsRead: days.reduce((s, d) => s + d.filingsRead, 0),
    routine: days.flatMap((d) => d.routine).sort((a, b) => b.at.localeCompare(a.at)),
    cards,
  };
}

export function sessionLabel(d: string, now = Date.now()): string {
  const today = istDate(now);
  if (d === today) return "today's close";
  const wd = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" }).format(new Date(d + "T00:00:00Z"));
  return `${wd} close`;
}

export function routineGroups(fs: Filing[]): { label: string; n: number }[] {
  const m = new Map<string, number>();
  for (const f of fs) {
    const k = /newspaper/i.test(f.nseCat + f.headline) ? "Newspaper ads"
      : /trading window/i.test(f.nseCat + f.headline) ? "Trading-window notices"
      : /analyst|investor meet|recording|schedule/i.test(f.nseCat + f.headline) ? "Analyst-meet schedules & recordings"
      : /presentation|press release/i.test(f.nseCat + f.headline) ? "Presentations & press copies of results"
      : /certificate|compliance|reg(ulation)?\.? ?\d/i.test(f.nseCat + f.headline) ? "Compliance certificates"
      : /esop|esos|options|allotment/i.test(f.nseCat + f.headline) ? "Employee stock allotments"
      : /commercial paper|debenture|redemption|interest payment/i.test(f.nseCat + f.headline) ? "Debt servicing notices"
      : "Other paperwork";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
}
