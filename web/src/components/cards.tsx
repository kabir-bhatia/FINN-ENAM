"use client";
// Card anatomy (04 doc §10.4): company · time anchor → one-sentence headline → facts → source.
import Link from "next/link";
import type { Bundle, Filing } from "@/lib/types";
import { CAT_LABEL, fmtPct, moveSentence, resultsHeadline, sessionLabel, tierOf, type CompanyDay, type Move, type ResultsView } from "@/lib/digest";
import { anchor, shortDate } from "@/lib/time";
import { markSeen, useRules } from "@/lib/client";
import { Icon, useEvidence, type Evidence } from "./ui";

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
  if (f.category === "results") return <span className="chip c-ink">Results</span>;
  return <span className={`chip ${tier === "act" ? "c-ink" : "c-quiet"}`}>{CAT_LABEL[f.category]}</span>;
}

export function AlertCard({ day, move, seen }: { day: CompanyDay; move: Move; seen: boolean }) {
  const [rules] = useRules();
  const b = day.b;
  const which = move.volFired && move.pctFired ? "volume and price rules" : move.volFired ? "volume rule" : "price rule";
  const id = `m:${b.symbol}:${move.d}`;
  const t = b.track;
  return (
    <article className={`card enter${seen ? " seen" : ""}`}>
      <span className="row between">
        <span className="row gap6 s13 strong">
          <span className="t-watch">{Icon.bellSm}</span>Your {which} fired
        </span>
        <span className="small muted">{sessionLabel(move.d)}</span>
      </span>
      <span className="headline">
        {b.name.replace(/ Limited$/, "")} {moveSentence(move)}
      </span>
      <span className="mono small muted">
        {move.volFired ? `20-day avg × ${move.ratio.toFixed(1)} · your rule × ${rules.vol.toFixed(1)}` : `${fmtPct(move.chg)} · your rule ±${rules.pct}%`}
      </span>
      {move.explainedBy ? (
        <span className="inset">
          Explained by a filing: <strong>{move.explainedBy.headline}</strong> ({anchor(move.explainedBy.at)})
        </span>
      ) : (
        <span className="inset">
          <span className="mark">Market moved, business didn’t.</span> No filing explains it
          {t && t.due ? `, and management kept ${t.kept} of the ${t.due} promises now due.` : "."}
        </span>
      )}
      <span className="row gap8">
        <Link className="btn ghost" href={`/c/${b.symbol}?tab=updates&from=today`} onClick={() => markSeen(id)}>
          Open company ›
        </Link>
      </span>
    </article>
  );
}

export function FilingCard({ day, f, seen }: { day: CompanyDay; f: Filing; seen: boolean }) {
  const [rules] = useRules();
  const ev = useEvidence();
  const b = day.b;
  const tier = tierOf(f, rules);
  const isRes = f.category === "results";
  const view = isRes ? day.results?.view ?? null : null;
  const open = () => markSeen(`f:${f.id}`);
  const tab = isRes ? "results" : "updates";
  return (
    <article className={`card enter${seen ? " seen" : ""}`}>
      <span className="row between gap8">
        <Link href={`/c/${b.symbol}?tab=${tab}&from=today`} onClick={open} className="s13 strong" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {b.name.replace(/ Limited$/, "")}
        </Link>
        {isRes && view ? <span className="chip c-ink">Results · {view.q}</span> : chipFor(f, tier)}
      </span>
      <Link href={`/c/${b.symbol}?tab=${tab}&from=today`} onClick={open} className="headline">
        {isRes && view ? resultsHeadline(view) : f.headline}
      </Link>
      {f.category === "governance" && <GovFacts f={f} />}
      {isRes && view && <ResultsLine v={view} />}
      {isRes && <AgainstTheirWord b={b} />}
      {!isRes && f.category !== "governance" && f.summary && (
        <span className="s14 ink2" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {f.summary}
        </span>
      )}
      <span className="row between">
        <button className="small muted" style={{ background: "none", border: 0, padding: "6px 0", textAlign: "left" }} onClick={() => { open(); ev(filingEvidence(b, f)); }}>
          {f.nseCat} · filed {anchor(f.at)} · <span style={{ textDecoration: "underline" }}>source</span>
        </button>
        <Link className="btn ghost" href={`/c/${b.symbol}?tab=${isRes ? "track" : "updates"}&from=today`} onClick={open}>
          {isRes ? "Track record ›" : "Open ›"}
        </Link>
      </span>
    </article>
  );
}

function GovFacts({ f }: { f: Filing }) {
  return (
    <>
      <span style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }}>
        <span className="stack gap4"><span className="small muted">What</span><span className="s14">{f.govKind ?? "Governance"}</span></span>
        <span className="stack gap4"><span className="small muted">Severity</span><span className={`s14 ${f.govSeverity === "high" ? "t-act strong" : ""}`}>{f.govSeverity === "high" ? "Red flag" : "Worth checking"}</span></span>
      </span>
      {f.summary && <span className="s14 ink2">{f.summary}</span>}
    </>
  );
}

export function ResultsLine({ v }: { v: ResultsView }) {
  const sales = v.rows[0];
  const pat = v.rows.find((r) => r.key === "Net Profit");
  const c = (x: number | null) => (x == null ? "" : x >= 0 ? "t-good" : "t-act");
  return (
    <span className="row gap14 mono s13" style={{ flexWrap: "wrap" }}>
      {sales?.yoy != null && <span><span className="muted" style={{ fontFamily: "inherit" }}>{v.lender ? "Revenue " : "Sales "}</span><span className={c(sales.yoy)}>{fmtPct(sales.yoy)}</span></span>}
      {pat?.yoy != null && <span><span className="muted">Profit </span><span className={c(pat.yoy)}>{fmtPct(pat.yoy)}</span></span>}
      {v.margin?.now != null && <span><span className="muted">EBITDA margin </span>{v.margin.now.toFixed(1)}%</span>}
      <span className="muted">vs last year</span>
    </span>
  );
}

export function AgainstTheirWord({ b }: { b: Bundle }) {
  const ev = useEvidence();
  const s = b.track?.spotlight;
  if (!b.track)
    return (
      <Link href={`/c/${b.symbol}?tab=track&from=today`} className="inset stack gap4">
        <span className="label">Against their word</span>
        <span className="s14 ink2">Track record not built yet — read the last 4 calls and check (≈ 1 min) ›</span>
      </Link>
    );
  if (!s) return null;
  const cls = s.verdict === "Kept" ? "t-good" : s.verdict === "Missed" ? "t-act" : s.verdict === "Target changed" ? "t-watch" : "t-quiet";
  return (
    <button
      className="inset stack gap6"
      style={{ border: 0, textAlign: "left" }}
      onClick={() =>
        ev({
          company: b.name,
          title: `${b.name} — earnings call transcript (${s.call})`,
          detail: `Exchange filing · quoted from page ${s.page}`,
          quote: s.quote,
          quoteNote: `Quote found word-for-word on p.${s.page} by code`,
          readBy: "Read by gemini flash-lite · verdict by gemini flash · quote checked by code, not by the model",
          url: s.url,
          page: s.page,
        })
      }
    >
      <span className="label">Against their word</span>
      <span className="s14">
        {s.metric}: <span className="mark">“{s.quote.length > 120 ? s.quote.slice(0, 117) + "…" : s.quote}”</span>
      </span>
      <span className={`small strong ${cls}`}>
        {s.verdict} · {s.text} · {s.call} call, p.{s.page}
      </span>
      <span className="small muted">Kept {b.track.kept} of {b.track.due} promises due · last {b.track.calls} calls</span>
    </button>
  );
}

export const stateChip = (s: CompanyDay["state"]) =>
  s === "challenged" ? <span className="chip c-act">Challenged</span> : s === "look" ? <span className="chip c-watch">Look</span> : <span className="chip c-quiet">Unchanged</span>;

export { shortDate };
