// Promised vs. Delivered (Track record). Three kinds of step, each one short serverless call,
// orchestrated by the client so progress is visible (A9) and each step fits a function timeout:
//   1. discover  – Screener's concall list → last 4 transcript PDFs (no model)
//   2. extract   – per transcript: code pulls page text; flash-lite lists promises with quote + page;
//                  CODE checks every quote word-for-word against the page text and drops the rest (D8)
//   3. verdict   – flash gets only the extracted promises + Screener's numbers (a few KB) → verdicts
// Each extraction is cached by transcript URL; the finished ledger is cached per company (D7).
import { createHash } from "node:crypto";
import type { CostLine, Fundamentals, Ledger, Promise_, Transcript, Verdict } from "./types";
import { VERDICTS } from "./types";
import { UA, screener } from "./sources";
import { llmJSON } from "./llm";
import { getJSON, putJSON } from "./store";
import { fyQuarter } from "./time";

const lkey = (s: string) => `t/${s}.json`;
const xkey = (url: string) => `x/${createHash("sha1").update(url).digest("hex").slice(0, 16)}.json`;

export async function getLedger(symbol: string, fresh = false): Promise<Ledger | null> {
  return getJSON<Ledger>(lkey(symbol), { fresh });
}

export async function saveLedger(l: Ledger) {
  await putJSON(lkey(l.symbol), l);
}

export async function discover(symbol: string): Promise<{ ledger: Ledger; fund: Fundamentals | null }> {
  const { fund, name } = await screener(symbol);
  const calls = (fund?.concalls ?? []).filter((c) => c.transcript).slice(0, 4);
  const transcripts: Transcript[] = calls.map((c) => ({ month: c.month, url: c.transcript!, status: "pending" }));
  const ledger: Ledger = {
    symbol,
    name: name || symbol,
    status: transcripts.length ? "building" : "no-transcripts",
    transcripts,
    promises: [],
    questions: [],
    costs: [],
    note: transcripts.length
      ? undefined
      : "No earnings-call transcripts are listed for this company on Screener, so there are no management promises to check. FINN never fills the gap with outside knowledge.",
  };
  return { ledger, fund };
}

// ---------- PDF text, page by page (code, not the model, owns page numbers) ----------
async function pdfPages(url: string): Promise<string[]> {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Referer: "https://www.bseindia.com/" },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`Transcript download failed (${r.status})`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (String.fromCharCode(...buf.slice(0, 4)) !== "%PDF") throw new Error("Transcript link did not return a PDF");
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(buf);
  const { text } = await extractText(pdf, { mergePages: false });
  return (text as string[]).map((t) => t.replace(/\s+/g, " ").trim());
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[‘’“”"']/g, "").replace(/[–—]/g, "-").replace(/[^a-z0-9%.\- ]+/g, " ").replace(/\s+/g, " ").trim();

/** Find the page that contains the quote. Exact (normalised) match first, then an 8-word window. */
export function locateQuote(quote: string, pages: string[]): number {
  const q = norm(quote);
  if (q.length < 12) return 0;
  const np = pages.map(norm);
  for (let i = 0; i < np.length; i++) if (np[i].includes(q)) return i + 1;
  // Page breaks can split a quote: try page i + i+1 joined.
  for (let i = 0; i < np.length - 1; i++) if ((np[i] + " " + np[i + 1]).includes(q)) return i + 1;
  const words = q.split(" ");
  if (words.length >= 10) {
    for (let s = 0; s + 8 <= words.length; s += 4) {
      const w = words.slice(s, s + 8).join(" ");
      const hit = np.findIndex((p) => p.includes(w));
      if (hit >= 0) return hit + 1;
    }
  }
  return 0;
}

interface Extraction {
  promises: { metric: string; target: string; horizon: string; quote: string; page: number }[];
  topics: string[];
  pages: number;
  cost: CostLine;
}

export async function extractTranscript(t: Transcript): Promise<Extraction> {
  const cached = await getJSON<Extraction>(xkey(t.url));
  if (cached) return { ...cached, cost: { ...cached.cost, inr: 0, cached: true } };
  const pages = await pdfPages(t.url);
  const body = pages.map((p, i) => `[[PAGE ${i + 1}]]\n${p}`).join("\n").slice(0, 120_000);
  const prompt = `You read an Indian listed company's earnings-call transcript (${t.month}).
List up to 8 explicit, checkable forward-looking commitments made by MANAGEMENT (not analysts):
numeric guidance (growth, margin, capex, debt, capacity, store/plant additions, launches with dates), or firm statements of intent.
Skip vague optimism ("we are confident"), and skip anything said by analysts.
For each: metric (2–4 words), target (as stated, e.g. "12–13% EBITDA margin"), horizon (e.g. "FY27", "next 2 years", "H2"),
quote = the exact words from the transcript, copied verbatim, 12–40 words, and page = the [[PAGE n]] it appears on.
Also list "topics": up to 15 short business topics management discussed (2–4 words each).
Use ONLY this transcript. Return JSON {"promises":[{"metric":"","target":"","horizon":"","quote":"","page":0}],"topics":[""]}.

TRANSCRIPT:
${body}`;
  const res = await llmJSON<{ promises: Extraction["promises"]; topics: string[] }>("cheap", `Read ${t.month} call`, prompt, {
    maxOut: 4096,
    timeoutMs: 100000,
  });
  const promises = (res.data.promises ?? [])
    .filter((p) => p && p.quote && p.metric)
    .map((p) => {
      const page = locateQuote(p.quote, pages);
      return { ...p, page: page || -1 };
    });
  const ex: Extraction = { promises, topics: (res.data.topics ?? []).slice(0, 15), pages: pages.length, cost: res.cost };
  await putJSON(xkey(t.url), ex);
  return ex;
}

/** Apply one extraction to the ledger: only quotes found in the document survive (D8). */
export function applyExtraction(l: Ledger, idx: number, ex: Extraction) {
  const t = l.transcripts[idx];
  const callIdx = l.transcripts.length - 1 - idx; // transcripts are newest first; 0 = oldest call
  const kept = ex.promises.filter((p) => p.page > 0);
  t.status = "done";
  t.pages = ex.pages;
  t.promises = kept.length;
  t.topics = ex.topics;
  l.promises = l.promises.filter((p) => p.call !== t.month);
  kept.forEach((p, i) =>
    l.promises.push({
      id: `${callIdx}-${i}`,
      call: t.month,
      callIdx,
      metric: p.metric,
      target: p.target,
      horizon: p.horizon,
      quote: p.quote,
      page: p.page,
      verified: true,
    }),
  );
  l.costs.push({ ...ex.cost, step: `${ex.cost.step} · ${kept.length} of ${ex.promises.length} quotes verified` });
}

function numbersTable(fund: Fundamentals | null): string {
  if (!fund) return "(no reported numbers available)";
  const n = Math.min(10, fund.quarters.length);
  const qs = fund.quarters.slice(-n);
  const pick = fund.lender
    ? ["Revenue", "Financing Profit", "Financing Margin %", "Profit before tax", "Net Profit"]
    : ["Sales", "YoY Sales growth", "Operating Profit", "OPM %", "Profit before tax", "Net Profit"];
  const lines = [`Quarter | ${qs.map((q) => `${fyQuarter(q).q} (${q})`).join(" | ")}`];
  for (const k of pick) {
    const row = fund.rows[k];
    if (row) lines.push(`${k} | ${row.slice(-n).map((v) => (v == null ? "-" : String(v))).join(" | ")}`);
  }
  return `${fund.basis} figures, ₹ crore (% where labelled)\n${lines.join("\n")}`;
}

export async function verdicts(l: Ledger, fund: Fundamentals | null) {
  if (!l.promises.length) {
    l.status = "ready";
    l.builtAt = new Date().toISOString();
    l.note = l.note ?? "Management made no checkable, numeric commitments in the calls FINN read.";
    return;
  }
  const calls = [...l.transcripts].reverse().filter((t) => t.status === "done");
  const ledgerText = calls
    .map(
      (t) =>
        `CALL ${t.month}\n  topics: ${(t.topics ?? []).join("; ")}\n` +
        l.promises
          .filter((p) => p.call === t.month)
          .map((p) => `  [${p.id}] ${p.metric}: ${p.target} (${p.horizon}) — "${p.quote}"`)
          .join("\n"),
    )
    .join("\n");
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You audit whether a company's management kept its word. Today is ${today}.
Use ONLY the ledger and the reported numbers below — no outside knowledge.
For EVERY promise id give a verdict:
- "Kept": reported numbers or a later call show it was met.
- "Missed": its period is over and the numbers show it was not met.
- "Target changed": a later call restates the same metric with a different target or timeline.
- "Went silent": it never appears again in later calls' promises or topics (only possible if later calls exist).
- "Too early": its horizon has not ended and nothing above applies.
"reason": ≤ 22 words, cite the numbers or later call (e.g. "OPM 14% in Q2 FY27 vs 12–13% guided").
"actual": the reported number used, or "".
Then write 3 sharp "questions" to ask management, each built from a Missed / Target changed / Went silent promise (skip if none),
each ≤ 35 words, specific, quoting the numbers.
Return JSON {"verdicts":[{"id":"","verdict":"","reason":"","actual":""}],"questions":[{"from":"Missed|Target changed|Went silent","text":""}]}.

REPORTED NUMBERS (Screener standardised table from company filings):
${numbersTable(fund)}

LEDGER (oldest call first):
${ledgerText}`;
  const res = await llmJSON<{ verdicts: { id: string; verdict: Verdict; reason: string; actual: string }[]; questions: { from: Verdict; text: string }[] }>(
    "strong",
    "Judge verdicts",
    prompt,
    { maxOut: 6000, timeoutMs: 110000 },
  );
  const byId = new Map(res.data.verdicts?.map((v) => [v.id, v]) ?? []);
  for (const p of l.promises) {
    const v = byId.get(p.id);
    p.verdict = v && VERDICTS.includes(v.verdict) ? v.verdict : "Too early";
    p.reason = v?.reason ?? "";
    p.actual = v?.actual ?? "";
    // Code guard: nothing can "go silent" in the latest call.
    if (p.verdict === "Went silent" && p.callIdx === calls.length - 1) p.verdict = "Too early";
  }
  l.questions = (res.data.questions ?? []).filter((q) => q.text && VERDICTS.includes(q.from)).slice(0, 4);
  l.costs.push(res.cost);
  l.status = "ready";
  l.builtAt = new Date().toISOString();
}
