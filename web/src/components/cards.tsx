"use client";
// Card anatomy (04 doc §13): icon tile → company · type → one-sentence headline → facts → source.
import Link from "next/link";
import type { Bundle, Filing, TrackSummary } from "@/lib/types";
import { CAT_LABEL, resultsHeadline, tierOf, type CompanyDay, type Move } from "@/lib/digest";
import { verdictBars } from "@/lib/home";
import { anchor, shortDate } from "@/lib/time";
import { markSeen, useRules } from "@/lib/client";
import { useEvidence, type Evidence } from "./ui";

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
        {t.due ? `${t.kept}/${t.due} kept` : "too early to judge"}
      </span>
    </span>
  );
}

/** Short right-hand time for a row: "Today", "Thu", or "12 Nov". */
function when(t: string | number, isDay = false) {
  const ms = isDay ? new Date(String(t) + "T12:00:00+05:30").getTime() : new Date(t).getTime();
  const ymd = (x: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(x));
  if (ymd(ms) === ymd(Date.now())) return "Today";
  if (Date.now() - ms < 6 * 864e5) return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "short" }).format(new Date(ms));
  return shortDate(ms);
}

/** One line per company, in the style of the routine list: dot · name · one fact · time (04 doc §13, declutter). */
export function NeedRow({ day, move, f, seen, onOpen }: { day: CompanyDay; move?: Move; f?: Filing; seen: boolean; onOpen?: () => void }) {
  const [rules] = useRules();
  const b = day.b;
  let dot = "var(--quiet)";
  let fact: React.ReactNode = null;
  let href = `/c/${b.symbol}?tab=updates&from=today`;
  let id = "";
  let time = "";
  if (move) {
    id = `m:${b.symbol}:${move.d}`;
    time = when(move.d, true);
    dot = "var(--watch-solid)";
    const pct = `${move.chg >= 0 ? "+" : "−"}${Math.abs(move.chg).toFixed(1)}%`;
    fact = (
      <>
        {move.volFired ? `${move.ratio.toFixed(1)}× volume, ${pct}` : `${pct} in a session`}
        {" · "}
        {move.explainedBy ? "a filing explains it" : <span className="mark">no filing</span>}
      </>
    );
  } else if (f) {
    id = `f:${f.id}`;
    time = when(f.at);
    const isRes = f.category === "results";
    const isGov = f.category === "governance";
    const view = isRes ? day.results?.view ?? null : null;
    href = `/c/${b.symbol}?tab=${isRes ? "results" : isGov ? "governance" : "updates"}&from=today`;
    dot = isGov ? (f.govSeverity === "high" ? "var(--act-solid)" : "var(--watch-solid)") : isRes ? "var(--good-solid)" : tierOf(f, rules) === "act" ? "var(--ink)" : "var(--quiet)";
    const text = (isRes && view ? resultsHeadline(view) : f.headline).replace(/\.$/, "");
    fact = isGov ? (
      <>
        <span className={f.govSeverity === "high" ? "t-act strong" : "t-watch strong"}>{f.govSeverity === "high" ? "Red flag" : "Check"}</span> · {text}
      </>
    ) : (
      text
    );
  }
  const body = (
    <>
      <span aria-hidden style={{ width: 10, height: 10, borderRadius: 5, background: dot, flex: "0 0 auto", marginTop: 6 }} />
      <span className="stack" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <span className="row between gap8">
          <span style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{short(b.name)}</span>
          <span className="small muted" style={{ flex: "0 0 auto" }}>{time}</span>
        </span>
        <span className="s13 ink2 clamp2" style={{ lineHeight: "19px" }}>{fact}</span>
      </span>
    </>
  );
  const cls = `rowlink${seen ? " seen" : ""}`;
  if (onOpen)
    return (
      <button className={cls} style={{ width: "100%", background: "none", border: 0, textAlign: "left", font: "inherit", color: "inherit" }} onClick={() => { markSeen(id); onOpen(); }}>
        {body}
      </button>
    );
  return (
    <Link href={href} onClick={() => markSeen(id)} className={cls}>
      {body}
    </Link>
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
          readBy: "Read and judged by GLM 5.3 flash (Gemini as fallback) · quote checked by code, not by the model",
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
        {s.call} call, p.{s.page} · {b.track.kept}/{b.track.due} kept
      </span>
    </button>
  );
}

export const stateChip = (s: CompanyDay["state"]) =>
  s === "challenged" ? <span className="chip c-act">Challenged</span> : s === "look" ? <span className="chip c-watch">Worth a look</span> : <span className="chip c-quiet">Unchanged</span>;

export { shortDate };
