"use client";
// Company page — the hub (04 doc §9, §11): Updates · Results · Track record for any NSE ticker.
// No price in the header (thesis-centric); price lives only inside Updates, small.
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Bundle } from "@/lib/types";
import { companyDay, fmtPct, rank, resultsHeadline, resultsView, sessionLabel, tierOf } from "@/lib/digest";
import { markSeen, useBundle, usePortfolio, useRules } from "@/lib/client";
import { anchor } from "@/lib/time";
import { AgainstTheirWord, chipFor, filingEvidence, stateChip } from "./cards";
import TrackView from "./TrackView";
import { Footer, Skeleton, Toast, TopBar, useEvidence } from "./ui";

type Tab = "updates" | "results" | "track";

export default function CompanyView({ symbol }: { symbol: string }) {
  const sp = useSearchParams();
  const from = sp.get("from");
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "updates");
  const { b, loading, error } = useBundle(symbol);
  const [portfolio, setPortfolio] = usePortfolio();
  const [toast, setToast] = useState<string | null>(null);
  const inPf = portfolio.includes(symbol);
  const back = from === "today" ? { label: "Today", href: "/" } : { label: "Companies", href: "/companies" };

  const toggle = () => {
    if (inPf) {
      setPortfolio(portfolio.filter((s) => s !== symbol));
      setToast("Removed from portfolio");
    } else {
      setPortfolio([...portfolio, symbol]);
      setToast("Added to portfolio");
    }
  };

  return (
    <>
      <TopBar back={back} />
      {loading && (
        <div className="stack gap12">
          <Skeleton h={30} w="70%" />
          <Skeleton h={14} w="40%" />
          <div className="card stack gap10"><Skeleton h={14} /><Skeleton h={14} w="80%" /></div>
          <span className="small muted">First look at {symbol}: reading NSE filings, prices and reported results…</span>
        </div>
      )}
      {error && (
        <div className="card stack gap8">
          <span className="headline">Couldn’t open {symbol}</span>
          <span className="s14 ink2">{error}. Check the NSE symbol, or try again in a minute.</span>
        </div>
      )}
      {b && (
        <div className="stack gap14">
          <div className="stack gap4">
            <div className="row between gap10" style={{ alignItems: "flex-start" }}>
              <h1 className="title" style={{ fontSize: 26, lineHeight: "32px" }}>{b.name.replace(/ Limited$/, "")}</h1>
              <button className="row gap8 s13 ink2" style={{ background: "none", border: 0, minHeight: 44, flex: "0 0 auto" }} onClick={toggle} role="switch" aria-checked={inPf}>
                In portfolio <span className="toggle" aria-checked={inPf} />
              </button>
            </div>
            <span className="s13 muted"><span className="mono">{b.symbol}</span>{b.industry ? ` · ${b.industry}` : ""} · data as of {anchor(b.updatedAt)} IST</span>
          </div>
          <Header b={b} />
          <div className="seg" role="tablist">
            {(["updates", "results", "track"] as Tab[]).map((t) => (
              <button key={t} role="tab" aria-pressed={tab === t} aria-selected={tab === t} onClick={() => setTab(t)}>
                {t === "updates" ? "Updates" : t === "results" ? "Results" : "Track record"}
              </button>
            ))}
          </div>
          {tab === "updates" && <Updates b={b} />}
          {tab === "results" && <Results b={b} onTrack={() => setTab("track")} />}
          {tab === "track" && <TrackView b={b} />}
          {b.errors.length > 0 && <span className="small t-watch">{b.errors.join(" · ")}</span>}
          <Footer />
        </div>
      )}
      {toast && <Toast text={toast} action="Undo" onAction={() => { toggle(); setToast(null); }} onDone={() => setToast(null)} />}
    </>
  );
}

/** State banner + governance strip (pledge, auditor, senior exits, regulatory) over the last 45 days. */
function Header({ b }: { b: Bundle }) {
  const [rules] = useRules();
  const day = useMemo(() => companyDay(b, rules, Date.now() - 7 * 864e5), [b, rules]);
  const gov = b.filings.filter((f) => f.category === "governance");
  const count = (re: RegExp) => gov.filter((f) => re.test(f.govKind ?? "")).length;
  const strip = [
    { k: "Auditor changes", v: count(/Auditor/) },
    { k: "Senior exits", v: count(/exit/i) },
    { k: "Regulatory actions", v: count(/Regulatory|Insolvency|Red flag/) },
    { k: "Pledge / promoter", v: count(/Pledge|Insider/) },
  ];
  return (
    <>
      {day.state !== "unchanged" && (
        <div className="row gap8" style={{ alignItems: "flex-start" }}>
          {stateChip(day.state)}
          <span className="s14 ink2">{day.reason} <span className="muted">(last 7 days)</span></span>
        </div>
      )}
      <section className="card" style={{ padding: "12px 14px", gap: 8 }} aria-label="Governance">
        <span className="label">Governance · last 45 days</span>
        <span style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: "8px 12px" }}>
          {strip.map((s) => (
            <span key={s.k} className="row between s13">
              <span className="ink2">{s.k}</span>
              <span className={`mono ${s.v ? "t-act strong" : "muted"}`}>{s.v || "None"}</span>
            </span>
          ))}
        </span>
      </section>
    </>
  );
}

function Updates({ b }: { b: Bundle }) {
  const [rules] = useRules();
  const ev = useEvidence();
  const [showRoutine, setShowRoutine] = useState(false);
  const since = Date.now() - 30 * 864e5;
  const day = useMemo(() => companyDay(b, rules, since), [b, rules, since]);
  const items = rank(day.items);
  const last = b.prices[b.prices.length - 1];
  const prev = b.prices[b.prices.length - 2];
  const avg = b.prices.length > 21 ? b.prices.slice(-21, -1).reduce((s, x) => s + x.v, 0) / 20 : 0;
  return (
    <div className="stack gap10">
      {items.length === 0 && <div className="card s14 ink2">No material filings in the last 30 days — {day.routine.length} routine ones checked.</div>}
      {items.map((f) => {
        const tier = tierOf(f, rules);
        const view = f.category === "results" ? resultsView(b.fund) : null;
        return (
          <button key={f.id} className="card" style={{ textAlign: "left" }} onClick={() => { markSeen(`f:${f.id}`); ev(filingEvidence(b, f)); }}>
            <span className="row between gap8">
              {chipFor(f, tier)}
              <span className="small muted">{anchor(f.at)}</span>
            </span>
            <span className="headline" style={{ fontSize: 15 }}>{view ? resultsHeadline(view) : f.headline}</span>
            {f.summary && <span className="s13 ink2" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{f.summary}</span>}
            <span className="small muted">{f.nseCat} · tap for source</span>
          </button>
        );
      })}

      {day.moves.length > 0 && (
        <section className="card stack gap6">
          <span className="label">Price and volume moves · 30 days</span>
          {day.moves.slice(-5).reverse().map((m) => (
            <span key={m.d} className="s13 row between gap8">
              <span>{sessionLabel(m.d)} {m.d.slice(5)}: <span className="mono">{fmtPct(m.chg)}</span> on <span className="mono">{m.ratio.toFixed(1)}×</span> volume</span>
              <span className={m.explainedBy ? "muted small" : "t-watch small strong"}>{m.explainedBy ? "explained" : "no filing"}</span>
            </span>
          ))}
        </section>
      )}
      {last && prev && (
        <span className="small muted">
          Last close <span className="mono">₹{last.c.toLocaleString("en-IN")}</span> ({fmtPct((last.c / prev.c - 1) * 100)}) · volume{" "}
          <span className="mono">{avg ? (last.v / avg).toFixed(1) : "–"}×</span> its 20-day average · {sessionLabel(last.d)}
        </span>
      )}

      {day.routine.length > 0 && (
        <section className="card" style={{ padding: "12px 14px" }}>
          <button className="row between" style={{ background: "none", border: 0, padding: 0, minHeight: 36 }} onClick={() => setShowRoutine(!showRoutine)}>
            <span className="s14">{day.routine.length} routine filings this month</span>
            <span className="s14 strong">{showRoutine ? "Hide" : "Show"}</span>
          </button>
          {showRoutine && day.routine.map((f) => (
            <button key={f.id} className="s13 ink2" style={{ background: "none", border: 0, borderTop: "1px solid var(--line)", padding: "9px 0", textAlign: "left" }} onClick={() => ev(filingEvidence(b, f))}>
              <span className="muted mono small">{anchor(f.at)} </span>{f.headline}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function Results({ b, onTrack }: { b: Bundle; onTrack: () => void }) {
  const ev = useEvidence();
  const v = resultsView(b.fund);
  if (!v || !b.fund) return <div className="card s14 ink2">No quarterly results table found for {b.symbol} on Screener, so FINN shows no numbers rather than guessing.</div>;
  const f = b.fund;
  const n = f.quarters.length;
  const val = (key: string, j: number) => f.rows[key]?.[j];
  const fmt = (x: number | null | undefined) => (x == null ? "–" : x.toLocaleString("en-IN", { maximumFractionDigits: 0 }));
  const pc = (x: number | null) => (x == null ? <span className="muted">–</span> : <span className={x >= 0 ? "t-good" : "t-act"}>{fmtPct(x)}</span>);
  const openRow = (r: (typeof v.rows)[number]) => {
    const nums = r.computed
      ? [
          { label: "Profit before tax", value: fmt(val("Profit before tax", n - 1)) },
          { label: "+ Finance cost", value: fmt(val("Interest", n - 1)) },
          { label: "+ Depreciation", value: fmt(val("Depreciation", n - 1)) },
          { label: "− Other income", value: fmt(val("Other Income", n - 1)) },
          { label: `= EBITDA ${v.q}`, value: fmt(r.now) },
        ]
      : [
          { label: `${v.q} (this quarter)`, value: fmt(val(r.key, n - 1)) },
          { label: "Last quarter", value: fmt(val(r.key, n - 2)) },
          { label: "Same quarter last year", value: fmt(val(r.key, n - 5)) },
        ];
    ev({
      company: b.name,
      title: `${r.label} · ${v.q} (${v.months})`,
      detail: `${v.basis} · ₹ crore · Screener’s standardised table of the company’s results filings`,
      numbers: nums,
      formula: r.computed ? r.formula : "growth = (this − then) ÷ |then|",
      url: v.pdf ?? v.source,
      extra: v.pdf ? [{ label: "Open Screener table", url: v.source }] : undefined,
    });
  };
  return (
    <div className="stack gap14">
      <section className="card stack gap12">
        <span className="headline">{resultsHeadline(v)}</span>
        <span className="small muted">{v.q} ({v.months}) · {v.basis} · ₹ crore</span>
        <table className="ntable">
          <thead>
            <tr><th></th><th>This<br />quarter</th><th>vs last<br />quarter</th><th>vs last<br />year</th></tr>
          </thead>
          <tbody>
            {v.rows.map((r) => (
              <tr key={r.key} className="tap" onClick={() => openRow(r)}>
                <td>{r.label}{r.computed && <span className="small muted"> · computed</span>}</td>
                <td className="mono">{fmt(r.now)}</td>
                <td className="mono">{pc(r.qoq)}</td>
                <td className="mono">{pc(r.yoy)}</td>
              </tr>
            ))}
            {v.margin && v.margin.now != null && (
              <tr>
                <td>EBITDA margin</td>
                <td className="mono">{v.margin.now.toFixed(1)}%</td>
                <td></td>
                <td className="mono small muted">{v.margin.lastYear != null ? `${v.margin.lastYear.toFixed(1)}% a year ago` : ""}</td>
              </tr>
            )}
          </tbody>
        </table>
        {v.lender && <span className="small muted">EBITDA isn’t meaningful for a lender, so FINN doesn’t show one.</span>}
        <span className="small muted">Tap any row to see where the number comes from. Numbers are read from the filing table, never generated by a model.</span>
      </section>
      <AgainstTheirWord b={b} />
      <button className="btn" style={{ height: 44, justifyContent: "center" }} onClick={onTrack}>
        {b.track ? `Track record · kept ${b.track.kept} of ${b.track.due} due ›` : "Did they do what they said? Track record ›"}
      </button>
    </div>
  );
}
