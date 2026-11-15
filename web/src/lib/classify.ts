// Filing classification cascade (D1): exchange category + keyword rules first (free, instant,
// covers most filings); flash-lite only for vague titles ("General Updates", "Press Release",
// some "Outcome of Board Meeting"), reading the exchange's own text summary — never the PDF.
import type { Category, CostLine, Filing } from "./types";
import type { NseRow } from "./sources";
import { nseToIso } from "./time";
import { llmJSON } from "./llm";

type Rule = Pick<Filing, "category" | "govSeverity" | "govKind"> | null;

const ROUTINE_CATS = new Set([
  "Copy of Newspaper Publication",
  "Certificate under SEBI (Depositories and Participants) Regulations, 2018",
  "Trading Window",
  "Shareholders meeting",
  "Record Date",
  "ESOP/ESOS/ESPS",
  "Committee Meeting Updates",
  "Monitoring Agency Report",
  "Options to purchase securities",
  "Loss of Share Certificates",
  "Duplicate Share Certificate",
  "Closure of Trading Window",
  "Investor Presentation",
  "Statement of deviation(s) or variation(s) under Reg. 32",
  "Compliances-Reg. 39 (3) - Details of Loss of Certificate / Duplicate Certificate",
  "Book Closure",
  "Analysts/Institutional Investor Meet/Con. Call Updates",
]);

const has = (t: string, re: RegExp) => re.test(t);

export function ruleClassify(r: NseRow): Rule {
  const cat = r.desc ?? "";
  const t = `${r.attchmntText ?? ""} ${(r.voiceSummary ?? "").slice(0, 400)}`.toLowerCase();

  // Governance first: these are never routine, whatever the title says (A3).
  if (has(t, /\bpledg|encumbr/)) return { category: "governance", govSeverity: "high", govKind: "Pledge / encumbrance" };
  if (has(t, /forensic|fraud|default in (re)?payment|wilful defaulter/))
    return { category: "governance", govSeverity: "high", govKind: "Red flag" };
  if (cat === "Change in Auditors" || has(t, /resignation of (the )?(statutory )?auditor/)) {
    // Only a resignation is a red flag; a rotation or unexplained change is "worth a look".
    const resigned = has(t, /resign/);
    return { category: "governance", govSeverity: resigned ? "high" : "low", govKind: resigned ? "Auditor resigned" : "Auditor change" };
  }
  if (cat === "Corporate Insolvency Resolution Process")
    return { category: "governance", govSeverity: "high", govKind: "Insolvency" };
  if (/^Action\(s\) (taken|initiated) or orders passed/.test(cat) || has(t, /show cause|penalty|warning letter|adjudicat|search and seizure|raid/)) {
    const minor = has(t, /\bgst\b|goods and services tax|income tax|tax demand|warning letter/) && !has(t, /sebi.*(order|penalt)|rbi.*penalt/);
    return { category: "governance", govSeverity: minor ? "low" : "high", govKind: "Regulatory action" };
  }
  if (/^Resignation/.test(cat) || ((cat === "Change in Director(s)" || cat === "Change in Management") && has(t, /resign|cessation|stepping down|step down/)))
    return { category: "governance", govSeverity: "high", govKind: "Senior exit" };
  if (cat.startsWith("Giving guarantees")) return { category: "governance", govSeverity: "low", govKind: "Guarantee for a third party" };
  if (has(t, /related party/) && !has(t, /half[- ]year|disclosure of related party transactions for/))
    return { category: "governance", govSeverity: "low", govKind: "Related-party deal" };
  if (has(t, /insider trading|sast|substantial acquisition/)) return { category: "governance", govSeverity: "low", govKind: "Insider / promoter dealing" };

  if (cat === "Change in Management" || cat === "Appointment" || cat === "Change in Director(s)" || cat === "Retirement" || cat.startsWith("Change in Company Secretary"))
    return { category: "management" };

  const subj = (r.attchmntText ?? "").toLowerCase();
  if (has(subj, /transcript/)) return { category: "concall" };

  if (/financial results|results for the (quarter|period|half)|unaudited.*results|audited.*results/.test(t) && !has(t, /newspaper|intimation of (board )?meeting|to consider/))
    return cat === "Press Release" || cat === "Investor Presentation" || cat.includes("Newspaper") ? { category: "routine" } : { category: "results" };

  if (/^(Acquisition|Amalgamation|Scheme of Arrangement|Sale or disposal|Diversification|Other Restructuring|Demerger)/.test(cat))
    return { category: "mna" };
  if (cat === "Allotment of Securities" || cat === "Issue of Securities") return has(t, /esop|esos|employee stock|options/) ? { category: "routine" } : { category: "fundraise" };
  if (has(t, /qualified institutions placement|\bqip\b|preferential issue|rights issue|raising of funds|fund raising|non-convertible debentures/))
    return { category: "fundraise" };
  if (cat.startsWith("Credit Rating") || has(t, /credit rating/)) return has(t, /esg rating/) ? { category: "routine" } : { category: "rating" };
  if (cat === "Dividend" || has(t, /\b(interim|final|special) dividend\b/)) return { category: "dividend" };
  if (cat.startsWith("Bagging/Receiving of orders")) return { category: "orders" };
  if (has(t, /earnings call transcript|transcript of (the )?(earnings|analyst|conference)|\btranscripts?\b/)) return { category: "concall" };

  if (ROUTINE_CATS.has(cat)) return { category: "routine" };
  if (has(t, /commercial paper|newspaper|registrar|share transfer agent|change of address|postal ballot|e-?voting|trading window|loss of share|duplicate share|audio recording|link of recording|schedule of (analyst|meet)|investor meet|esg rating|award|prize|closure of board meeting|reg(ulation)? 74\(5\)|compliance certificate|book closure|notice of (the )?agm/))
    return { category: "routine" };
  if (/^(News Verification|Rumour Verification|Monthly Business Updates|Effect\(s\) on listed entity|Strikes)/.test(cat)) return { category: "other" };
  return null; // vague → model
}

/** Clean "X Limited has informed the Exchange about Y" → "Y" */
export function headlineOf(r: NseRow): string {
  let t = (r.attchmntText || r.desc || "").replace(/\s+/g, " ").trim();
  t = t.replace(/^.*?has (informed|submitted to) the Exchange,? (about|regarding|that|the)?\s*/i, "");
  t = t.replace(/^['"‘“]|['"’”]\.?$/g, "").replace(/\.$/, "");
  if (t.length < 4) t = r.desc;
  if (/^general updates$/i.test(t)) t = r.desc;
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.length > 160 ? t.slice(0, 157) + "…" : t;
}

function summaryOf(r: NseRow): string {
  const s = (r.voiceSummary ?? "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  const cut = s.slice(0, 420);
  const end = cut.lastIndexOf(". ");
  return end > 120 ? cut.slice(0, end + 1) : cut;
}

const MODEL_CATS: Category[] = ["governance", "results", "mna", "management", "fundraise", "dividend", "rating", "orders", "concall", "other", "routine"];

/** Classify all rows; reuse earlier classifications (filings are immutable — D7). */
export async function classifyRows(
  rows: NseRow[],
  prior: Map<string, Filing>,
): Promise<{ filings: Filing[]; cost: CostLine | null }> {
  const out: Filing[] = [];
  const vague: { row: NseRow; f: Filing }[] = [];
  for (const r of rows) {
    const old = prior.get(r.seq_id);
    if (old) {
      out.push(old);
      continue;
    }
    const base: Filing = {
      id: r.seq_id,
      symbol: r.symbol,
      at: nseToIso(r.an_dt),
      nseCat: r.desc,
      headline: headlineOf(r),
      summary: summaryOf(r),
      url: r.attchmntFile,
      category: "other",
      by: "rule",
      revised: /revised|corrigendum|addendum/i.test(`${r.desc} ${r.attchmntText}`),
    };
    const rule = ruleClassify(r);
    if (rule) out.push({ ...base, ...rule });
    else {
      out.push(base);
      vague.push({ row: r, f: base });
    }
  }
  let cost: CostLine | null = null;
  if (vague.length) {
    const items = vague.slice(0, 25).map(({ row }, i) => ({
      i,
      title: row.desc,
      text: (row.attchmntText ?? "").slice(0, 200),
      summary: (row.voiceSummary ?? "").slice(0, 500),
    }));
    try {
      const prompt = `You triage Indian stock-exchange filings for a long-term, governance-focused investor.
For each filing choose ONE category from: ${MODEL_CATS.join(", ")}.
- governance: auditor change, resignation of directors/KMP, regulatory or court orders, penalties, pledges, related-party deals, fraud.
- routine: procedural paperwork with no information about the business (certificates, meeting schedules, ads, recordings, redemptions done on time).
- other: real business information that fits no other bucket (new plant, product, clarification, business update).
Use ONLY the text given. Also write "headline": a factual 6–12 word sentence of what happened (no adjectives, no advice).
Return JSON {"items":[{"i":0,"category":"...","headline":"...","severity":"high|low|null"}]}.
Filings:
${JSON.stringify(items)}`;
      const res = await llmJSON<{ items: { i: number; category: Category; headline?: string; severity?: string }[] }>(
        "cheap",
        "Classify vague filings",
        prompt,
        { maxOut: 2048, timeoutMs: 45000 },
      );
      cost = res.cost;
      for (const it of res.data.items ?? []) {
        const v = vague[it.i];
        if (!v || !MODEL_CATS.includes(it.category)) continue;
        v.f.category = it.category;
        v.f.by = "model";
        if (it.headline && it.headline.length > 8 && it.headline.length < 140) v.f.headline = it.headline.replace(/\.$/, "");
        if (it.category === "governance") {
          v.f.govSeverity = it.severity === "high" ? "high" : "low";
          v.f.govKind = "Governance";
        }
      }
    } catch {
      // Model unavailable: vague filings stay "other" (shown as worth knowing, never hidden).
    }
  }
  return { filings: dedupe(out), cost };
}

/** I5: same company + same category + same headline within 3 days = one item (keep newest, mark revised). */
function dedupe(fs: Filing[]): Filing[] {
  const sorted = [...fs].sort((a, b) => b.at.localeCompare(a.at));
  const seen = new Map<string, Filing>();
  const res: Filing[] = [];
  for (const f of sorted) {
    const key = `${f.category}|${f.headline.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60)}`;
    const prev = seen.get(key);
    if (prev && Math.abs(new Date(prev.at).getTime() - new Date(f.at).getTime()) < 3 * 864e5 && f.category !== "routine") {
      prev.revised = true;
      continue;
    }
    seen.set(key, f);
    res.push(f);
  }
  return res;
}
