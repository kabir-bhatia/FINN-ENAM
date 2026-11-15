// Shared types for server routes and the client. One data model for every screen
// (fix #1/#2 of the design review: every count and every card comes from here).

export type Category =
  | "governance" // auditor change, senior exits, regulatory action, pledge, guarantees, insolvency
  | "results"
  | "mna"
  | "management" // appointments, planned retirements
  | "fundraise"
  | "dividend"
  | "rating"
  | "orders"
  | "concall" // transcript published
  | "other" // non-routine but not in a named bucket (press releases, clarifications)
  | "routine";

export interface Filing {
  id: string; // NSE seq_id
  symbol: string;
  at: string; // ISO timestamp with +05:30 (exchange dissemination time)
  nseCat: string; // exchange's own category ("desc")
  headline: string; // cleaned subject line
  summary: string; // exchange's own summary of the document (NSE voiceSummary), trimmed
  url: string; // PDF on nsearchives
  category: Category;
  govSeverity?: "high" | "low"; // governance only: high = exit/resignation/order/pledge
  govKind?: string; // "Auditor change", "Senior exit", "Regulatory action", ...
  by: "rule" | "model"; // which step of the cascade classified it
  revised?: boolean;
}

export interface Bar {
  d: string; // YYYY-MM-DD (exchange date)
  c: number; // close (split-adjusted)
  v: number; // volume
}

export interface ConcallLink {
  month: string; // "Nov 2026"
  transcript?: string;
  ppt?: string;
}

export interface Fundamentals {
  url: string; // Screener page used
  basis: "consolidated" | "standalone";
  lender: boolean; // bank/NBFC layout: EBITDA not meaningful
  quarters: string[]; // period end dates, oldest → newest, e.g. "2026-09-30"
  rows: Record<string, (number | null)[]>; // label → values in ₹ crore
  pdfs: (string | null)[]; // results PDF per quarter (where Screener links one)
  concalls: ConcallLink[]; // newest first
}

export interface TrackSummary {
  builtAt: string;
  kept: number;
  due: number; // promises whose verdict is not "Too early"
  counts: Record<Verdict, number>;
  calls: number;
  span: string; // "Feb–Nov 2026"
  spotlight?: { metric: string; verdict: Verdict; text: string; quote: string; page: number; call: string; url: string };
}

export interface Bundle {
  cv?: number; // classifier version
  symbol: string;
  name: string;
  industry: string;
  updatedAt: string;
  filings: Filing[]; // newest first, last ~45 days
  prices: Bar[]; // oldest → newest, ~70 sessions
  splits: string[]; // YYYY-MM-DD of splits/bonus (I6: no false alerts)
  fund: Fundamentals | null;
  track: TrackSummary | null;
  errors: string[]; // which sources failed this time (shown honestly, never hidden)
  llm?: { calls: number; inTok: number; outTok: number; inr: number };
}

export type Verdict = "Kept" | "Missed" | "Target changed" | "Went silent" | "Too early";
export const VERDICTS: Verdict[] = ["Kept", "Missed", "Target changed", "Went silent", "Too early"];

export interface Promise_ {
  id: string;
  call: string; // "Nov 2026"
  callIdx: number; // 0 = oldest call in the ledger
  metric: string;
  target: string;
  horizon: string;
  quote: string;
  page: number;
  verified: boolean; // quote found word-for-word in the page text by code
  verdict?: Verdict;
  reason?: string;
  actual?: string;
}

export interface Transcript {
  month: string;
  url: string;
  pages?: number;
  status: "pending" | "done" | "failed";
  error?: string;
  promises?: number;
  topics?: string[];
}

export interface CostLine {
  step: string;
  model: string;
  inTok: number;
  outTok: number;
  inr: number;
  cached?: boolean;
  ms?: number;
}

export interface Ledger {
  symbol: string;
  name: string;
  status: "none" | "building" | "ready" | "no-transcripts";
  builtAt?: string;
  transcripts: Transcript[];
  promises: Promise_[];
  questions: { from: Verdict; text: string }[];
  costs: CostLine[];
  note?: string;
}

export interface Rules {
  vol: number; // × 20-day average volume
  pct: number; // ± % one-day move
  onlyUnexplained: boolean;
  cats: Category[]; // categories that count as "needs you" (governance always does)
}

export type WindowKey = "since" | "24h" | "7d" | "30d";
