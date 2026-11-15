"use client";
// Card anatomy (04 doc §13): icon tile → company · type → one-sentence headline → facts → source.
import Link from "next/link";
import type { Bundle, Filing, TrackSummary } from "@/lib/types";
import { CAT_LABEL, fmtPct, moveSentence, resultsHeadline, sessionLabel, tierOf, type CompanyDay, type Move, type ResultsView } from "@/lib/digest";
import { verdictBars } from "@/lib/home";
import { anchor, shortDate } from "@/lib/time";
import { markSeen, useRules } from "@/lib/client";
import { Icon, useEvidence, type Evidence } from "./ui";

export const short = (name: string) => name.replace(/ Limited$/, "");

export function filingEvidence(b: Bundle, f: Filing): Evidence {
  return {
    company: b.name,
    title: `${f.nseCat}${f.revised ? " (revised)" : ""}`,
    detail: `NSE filing · disseminated ${anchor(f.at)} IST · classified by ${f.by === "rule" ? "rules (no model)" : "flash-lite from the exchange's summary"}`,
    quote: f.summary || undefined,
    quoteNote: f.summary ? "Exchange's own summary of the document" : undefined,
    url: f.url,
  };
}

export function chipFor(f: Filing, tier: string) {
  if (f.category === "governance") return <span className="chip c-act">{f.govSeverity === "high" ? "Governance" : "Governance · check"}</span>;
  if (f.category === "results") return <span className="chip c-good">Results</span>;
  return <span className={`chip ${tier === "act" ? "c-ink" : "c-quiet"}`}>{CAT_LABEL[f.category]}</span>;
}

/** One small bar per promise with the count in words: "3 of 5 promises kept". */
export function PromiseBar({ t }: { t: TrackSummary }) {
  return (
    <span className="minibar" role="img" aria-label={`Kept ${t.kept} of ${t.due} promises due`}>
      {verdictBars(t.counts).map((v, i) => (
        <i key={i} className={`b-${v.split(" ")[0]}`} />
      ))}
      <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>
        {t.due ? `${t.kept} of ${t.due} due promises kept` : "all promises still too early to judge"}
      </span>
    </span>
  );
}

export function AlertCard({ day, move, seen }: { day: CompanyDay; move: Move; seen: boolean }) {
  const [rules] = useRules();
  const b = day.b;
  const which = move.volFired && move.pctFired ? "volume and price rules" : move.volFired ? "volume rule" : "price rule";
  const id = `m:${b.symbol}:${move.d}`;
  const t = b.track;
  return (
    <Link href={`/c/${b.symbol}?tab=updates&from=today`} onClick={() => markSeen(id)} className={`card enter${seen ? " seen" : ""}`} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      <span className="icontile c-watch" aria-hidden>{Icon.pulse}</span>
      <span className="stack gap6" style={{ minWidth: 0, flex: 1 }}>
        <span className="small ink2">{short(b.name)} · Your {which} · {sessionLabel(move.d)}</span>
        <span className="headline" style={{ fontSize: 15, lineHeight: "20px" }}>
          {short(b.name)} {moveSentence(move)}
        </span>
        <span className="small muted">
          {move.volFired ? `20-day average × ${move.ratio.toFixed(1)} · your rule × ${rules.vol.toFixed(1)}` : `${fmtPct(move.chg)} · your rule ±${rules.pct}%`}
        </span>
        {move.explainedBy ? (
          <span className="s13 ink2">
            Explained by a filing: <strong>{move.explainedBy.headline}</strong> ({anchor(move.explainedBy.at)})
          </span>
        ) : (
          <span className="s13">
            <span className="mark">Market moved, business didn’t.</span> No filing explains it
            {t && t.due ? `, and management kept ${t.kept} of the ${t.due} promises now due.` : "."}
          </span>
        )}
      </span>
    </Link>
  );
}

export function FilingCard({ day, f, seen }: { day: CompanyDay; f: Filing; seen: boolean }) {
  const [rules] = useRules();
  const ev = useEvidence();
  const b = day.b;
  const tier = tierOf(f, rules);
  const isRes = f.category === "results";
  const isGov = f.category === "governance";
  const view = isRes ? day.results?.view ?? null : null;
  const open = () => markSeen(`f:${f.id}`);
  const tab = isRes ? "results" : isGov ? "governance" : "updates";
  const tone = isGov ? (f.govSeverity === "high" ? "c-act" : "c-watch") : isRes ? "c-good" : tier === "act" ? "c-ink" : "c-quiet";
  const type = isGov ? `Governance${f.govKind ? ` · ${f.govKind}` : ""}` : isRes && view ? `Results · ${view.q}` : CAT_LABEL[f.category];
  return (
    <article className={`card enter${seen ? " seen" : ""}`} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      <span className={`icontile ${tone}`} aria-hidden>{isGov ? Icon.shield : isRes ? Icon.chart : Icon.page}</span>
      <span className="stack gap6" style={{ minWidth: 0, flex: 1 }}>
        <Link href={`/c/${b.symbol}?tab=${tab}&from=today`} onClick={open} className="stack gap4">
          <span className="small ink2">{short(b.name)} · {type}</span>
          <span className="headline" style={{ fontSize: 15, lineHeight: "20px" }}>{isRes && view ? resultsHeadline(view) : f.headline}</span>
        </Link>
        {isGov && (
          <span className="s13 ink2">
            <span className={f.govSeverity === "high" ? "t-act strong" : "t-watch strong"}>{f.govSeverity === "high" ? "Red flag" : "Worth checking"}</span>
            {f.summary ? ` · ${f.summary.length > 150 ? f.summary.slice(0, 147) + "…" : f.summary}` : ""}
          </span>
        )}
        {isRes && view && <ResultsLine v={view} />}
        {isRes && b.track && <PromiseBar t={b.track} />}
        {!isRes && !isGov && f.summary && (
          <span className="s13 ink2" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {f.summary}
          </span>
        )}
        <button className="small muted" style={{ background: "none", border: 0, padding: "4px 0", textAlign: "left", minHeight: 28 }} onClick={() => { open(); ev(filingEvidence(b, f)); }}>
          Filed {anchor(f.at)} · <span style={{ textDecoration: "underline" }}>source</span>
        </button>
      </span>
    </article>
  );
}

export function ResultsLine({ v }: { v: ResultsView }) {
  const sales = v.rows[0];
  const pat = v.rows.find((r) => r.key === "Net Profit");
  const c = (x: number | null) => (x == null ? "" : x >= 0 ? "t-good" : "t-act");
  return (
    <span className="row gap10 s13" style={{ flexWrap: "wrap", rowGap: 2 }}>
      {sales?.yoy != null && <span><span className="muted">{v.lender ? "Revenue " : "Sales "}</span><span className={`strong ${c(sales.yoy)}`}>{fmtPct(sales.yoy)}</span></span>}
      {pat?.yoy != null && <span><span className="muted">Profit </span><span className={`strong ${c(pat.yoy)}`}>{fmtPct(pat.yoy)}</span></span>}
      <span className="muted">vs last year</span>
    </span>
  );
}

/** "Against their word": the most decision-relevant promise next to what happened. */
export function AgainstTheirWord({ b, onBuild }: { b: Bundle; onBuild?: () => void }) {
  const ev = useEvidence();
  const s = b.track?.spotlight;
  if (!b.track)
    return (
      <button className="box-watch" onClick={onBuild}>
        <span className="cap">AGAINST THEIR WORD</span>
        <span className="s14">Track record not built yet. FINN can read the last 4 calls and check each promise (about 1 minute) ›</span>
      </button>
    );
  if (!s) return null;
  return (
    <button
      className="box-watch"
      onClick={() =>
        ev({
          company: b.name,
          title: `${short(b.name)} — earnings call transcript (${s.call})`,
          detail: `Exchange filing · quoted from page ${s.page}`,
          quote: s.quote,
          quoteNote: `Quote found word-for-word on p.${s.page} by code`,
          readBy: "Read by gemini flash-lite · verdict by gemini flash · quote checked by code, not by the model",
          url: s.url,
          page: s.page,
        })
      }
    >
      <span className="cap">AGAINST THEIR WORD</span>
      <span className="s14" style={{ lineHeight: "20px" }}>
        <strong>{s.verdict}</strong> · {s.metric}{s.text ? `: ${s.text}` : ""}
      </span>
      <span className="small ink2">
        {s.call} call, p.{s.page} · kept {b.track.kept} of {b.track.due} promises due · tap for the quote
      </span>
    </button>
  );
}

export const stateChip = (s: CompanyDay["state"]) =>
  s === "challenged" ? <span className="chip c-act">Challenged</span> : s === "look" ? <span className="chip c-watch">Worth a look</span> : <span className="chip c-quiet">Unchanged</span>;

export { shortDate };
