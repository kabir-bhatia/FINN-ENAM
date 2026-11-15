"use client";
// Company page (04 doc §13): header + navy hero with the promises-kept ring, then
// Updates · Results · Track record · Governance. Works for any NSE ticker.
// No price in the header (thesis-centric); price lives only inside Updates, small.
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Bundle } from "@/lib/types";
import { VERDICTS } from "@/lib/types";
import { companyDay, fmtPct, rank, resultsHeadline, resultsView, sessionLabel, tierOf } from "@/lib/digest";
import { sectorOf } from "@/lib/home";
import { markSeen, useBundle, usePortfolio, useRules } from "@/lib/client";
import { anchor, fyQuarter } from "@/lib/time";
import { AgainstTheirWord, chipFor, filingEvidence, short, stateChip } from "./cards";
import TrackView from "./TrackView";
import { Ring, Skeleton, Toast, TopBar, useEvidence } from "./ui";

type Tab = "updates" | "results" | "track" | "governance";
const TABS: { k: Tab; label: string }[] = [
  { k: "updates", label: "Updates" },
  { k: "results", label: "Results" },
  { k: "track", label: "Track record" },
  { k: "governance", label: "Governance" },
];

export default function CompanyView({ symbol }: { symbol: string }) {
  const sp = useSearchParams();
  const from = sp.get("from");
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "updates");
  const { b, loading, error } = useBundle(symbol);
  const [portfolio, setPortfolio] = usePortfolio();
  const [toast, setToast] = useState<string | null>(null);
  const inPf = portfolio.includes(symbol);
  const back = from === "today" ? { label: "Home", href: "/" } : { label: "Companies", href: "/companies" };

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
      <TopBar
        back={back}
        right={
          <button className={`pill${inPf ? " on" : ""}`} onClick={toggle} role="switch" aria-checked={inPf}>
            {inPf ? "✓ In portfolio" : "+ Add to portfolio"}
          </button>
        }
      />
      {loading && (
        <div className="stack gap12" style={{ paddingTop: 8 }}>
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
        <div className="stack gap14" style={{ paddingTop: 8 }}>
          <div className="stack" style={{ gap: 2 }}>
            <h1 className="title">{short(b.name)}</h1>
            <span className="s13 ink2">{sectorOf(b.symbol, b.industry)} · {b.symbol}</span>
          </div>
          <StateLine b={b} />
          <Hero b={b} onOpen={() => setTab("track")} />
          <div className="seg tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.k} role="tab" aria-pressed={tab === t.k} aria-selected={tab === t.k} onClick={() => setTab(t.k)}>
                {t.label}
              </button>
            ))}
          </div>
          {tab === "updates" && <Updates b={b} />}
          {tab === "results" && <Results b={b} onTrack={() => setTab("track")} />}
          {tab === "track" && <TrackView b={b} />}
          {tab === "governance" && <Governance b={b} />}
          {b.errors.length > 0 && <span className="small t-watch">{b.errors.join(" · ")}</span>}
          <span className="small muted" style={{ textAlign: "center", margin: "20px 0 8px" }}>Data as of {anchor(b.updatedAt)} IST</span>
        </div>
      )}
      {toast && <Toast text={toast} action="Undo" onAction={() => { toggle(); setToast(null); }} onDone={() => setToast(null)} />}
    </>
  );
}

function StateLine({ b }: { b: Bundle }) {
  const [rules] = useRules();
  const day = useMemo(() => companyDay(b, rules, Date.now() - 7 * 864e5), [b, rules]);
  if (day.state === "unchanged") return null;
  return (
    <div className="row gap8" style={{ alignItems: "flex-start" }}>
      {stateChip(day.state)}
      <span className="s14 ink2">{day.reason} <span className="muted">(last 7 days)</span></span>
    </div>
  );
}

/** Navy hero: how many of the promises now due were kept. Opens the track record. */
function Hero({ b, onOpen }: { b: Bundle; onOpen: () => void }) {
  const t = b.track;
  if (!t)
    return (
      <button className="hero" onClick={onOpen}>
        <Ring size={96} stroke={11} label="Track record not built yet" segments={[]} track="rgba(255,255,255,0.18)">
          <span style={{ fontSize: 22, fontWeight: 700 }}>?</span>
        </Ring>
        <span className="stack gap6">
          <span style={{ fontSize: 16, fontWeight: 700 }}>Did they do what they said?</span>
          <span className="go">Build the track record ›</span>
        </span>
      </button>
    );
  const others = VERDICTS.filter((v) => v !== "Kept" && t.counts[v]).map((v) => `${t.counts[v]} ${v.toLowerCase()}`);
  return (
    <button className="hero" onClick={onOpen}>
      <Ring
        size={96}
        stroke={11}
        label={`${t.kept} of ${t.due} promises due were kept`}
        track="rgba(255,255,255,0.18)"
        segments={t.due ? [{ value: t.kept, color: "var(--hero-accent)" }, { value: t.due - t.kept, color: "transparent" }] : []}
      >
        <span style={{ fontSize: 22, fontWeight: 700 }}>{t.kept}/{t.due}</span>
      </Ring>
      <span className="stack gap6" style={{ minWidth: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{t.due ? "Promises kept" : "Promises due so far"}</span>
        <span className="s13 dim" style={{ lineHeight: "18px" }}>
          {others.length ? others.join(" · ") : "No other promises on record"} · last {t.calls} calls
        </span>
        <span className="go">See the track record ›</span>
      </span>
    </button>
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
      {items.length === 0 && <div className="card s14 ink2">Nothing material in 30 days · {day.routine.length} routine filings checked</div>}
      {items.length > 0 && (
        <section className="card flush">
      {items.map((f) => {
        const tier = tierOf(f, rules);
        const view = f.category === "results" ? resultsView(b.fund) : null;
        return (
          <button key={f.id} className="rowlink" style={{ width: "100%", background: "none", border: 0, textAlign: "left", flexDirection: "column", gap: 4, font: "inherit", color: "inherit" }} onClick={() => { markSeen(`f:${f.id}`); ev(filingEvidence(b, f)); }}>
            <span className="row between gap8" style={{ width: "100%" }}>
              {chipFor(f, tier)}
              <span className="small muted">{anchor(f.at)}</span>
            </span>
            <span className="headline" style={{ fontSize: 15, lineHeight: "20px" }}>{view ? resultsHeadline(view) : f.headline}</span>
            {f.summary && <span className="s13 ink2 clamp1">{f.summary}</span>}
          </button>
        );
      })}
        </section>
      )}

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
        <section className="card">
          <button className="row between" style={{ background: "none", border: 0, padding: 0, minHeight: 36 }} onClick={() => setShowRoutine(!showRoutine)}>
            <span className="s14" style={{ fontWeight: 600 }}>{day.routine.length} routine filings this month</span>
            <span className="link">{showRoutine ? "Hide" : "Show"}</span>
          </button>
          {showRoutine && day.routine.map((f) => (
            <button key={f.id} className="s13 ink2" style={{ background: "none", border: 0, borderTop: "1px solid var(--line)", padding: "9px 0", textAlign: "left" }} onClick={() => ev(filingEvidence(b, f))}>
              <span className="muted small">{anchor(f.at)} · </span>{f.headline}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

/** Highlight the clause of a quote that carries the figure (or the whole quote if it has none). */
function QuoteMark({ q }: { q: string }) {
  const m = /[^,.;:]*\d[^,.;:]*/.exec(q);
  if (!m || m[0].trim().length < 6) return <span className="mark">{q}</span>;
  const i = m.index;
  return (
    <>
      {q.slice(0, i)}
      <span className="mark">{m[0]}</span>
      {q.slice(i + m[0].length)}
    </>
  );
}

function Results({ b, onTrack }: { b: Bundle; onTrack: () => void }) {
  const ev = useEvidence();
  const [vs, setVs] = useState<"yoy" | "qoq">("yoy");
  const v = resultsView(b.fund);
  if (!v || !b.fund) return <div className="card s14 ink2">No quarterly results table found for {b.symbol} on Screener, so FINN shows no numbers rather than guessing.</div>;
  const f = b.fund;
  const n = f.quarters.length;
  const val = (key: string, j: number) => f.rows[key]?.[j];
  const fmt = (x: number | null | undefined) => (x == null ? "–" : x.toLocaleString("en-IN", { maximumFractionDigits: 0 }));
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

  // Profit, last 5 quarters (reported net profit, ₹ crore).
  const profit = f.rows["Net Profit"] ?? [];
  const bars = f.quarters.map((q, j) => ({ q, j, x: profit[j] ?? null })).slice(-5).filter((x) => x.x != null) as { q: string; j: number; x: number }[];
  const max = Math.max(...bars.map((x) => Math.abs(x.x)), 1);
  const qShort = (q: string) => fyQuarter(q).q.replace(" FY", "’");
  const s = b.track?.spotlight;

  return (
    <div className="stack gap14">
      <section className="card big" style={{ gap: 14 }}>
        <div className="stack gap6">
          <span className="label t-good">RESULTS · {v.q} ({v.months})</span>
          <span style={{ fontSize: 22, lineHeight: "28px", fontWeight: 700, letterSpacing: "-0.01em" }}>{resultsHeadline(v)}.</span>
        </div>
        <div className="seg sm" style={{ alignSelf: "flex-start", gridAutoColumns: "auto" }}>
          <button aria-pressed={vs === "yoy"} onClick={() => setVs("yoy")} style={{ padding: "0 12px" }}>vs last year</button>
          <button aria-pressed={vs === "qoq"} onClick={() => setVs("qoq")} style={{ padding: "0 12px" }}>vs last quarter</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, v.rows.length)}, minmax(0, 1fr))`, columnGap: 8, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          {v.rows.map((r) => {
            const x = vs === "yoy" ? r.yoy : r.qoq;
            return (
              <button key={r.key} onClick={() => openRow(r)} className="stack" style={{ gap: 2, background: "none", border: 0, padding: "10px 0", textAlign: "left", minWidth: 0 }} aria-label={`${r.label}: ${fmt(r.now)} crore. Tap for source`}>
                <span style={{ fontSize: 11 }} className="ink2">{r.label.replace(" (PAT)", "")}{r.computed ? "*" : ""}</span>
                <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap" }} className={x == null ? "muted" : x >= 0 ? "t-good" : "t-act"}>{x == null ? "–" : fmtPct(x)}</span>
                <span style={{ fontSize: 11 }} className="muted">{fmt(r.now)}</span>
              </button>
            );
          })}
        </div>
        <span className="small muted" style={{ marginTop: -6 }}>
          {vs === "yoy" ? "vs the same quarter last year" : "vs the previous quarter"} · {v.basis} · ₹ crore
          {v.margin?.now != null && ` · EBITDA margin ${v.margin.now.toFixed(1)}%${v.margin.lastYear != null ? ` (${v.margin.lastYear.toFixed(1)}% a year ago)` : ""}`}
          {!v.lender && " · *computed"}
        </span>
        <span className="small muted">Tap a figure for its source{v.lender ? " · no EBITDA for a lender" : ""}</span>
      </section>

      {bars.length >= 2 && (
        <section className="card big" style={{ gap: 14 }}>
          <div className="row between" style={{ alignItems: "baseline" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Profit, last {bars.length} quarters</span>
            <span className="small ink2">₹ crore</span>
          </div>
          <div role="img" aria-label={`Profit by quarter: ${bars.map((x) => `${qShort(x.q)} ${fmt(x.x)}`).join(", ")}`} style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 136 }}>
            {bars.map((x, i) => {
              const lastBar = i === bars.length - 1;
              return (
                <button
                  key={x.q}
                  style={{ flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, justifyContent: "flex-end", height: "100%", background: "none", border: 0, padding: 0, minWidth: 0 }}
                  onClick={() =>
                    ev({
                      company: b.name,
                      title: `Profit (PAT) · ${fyQuarter(x.q).q} (${fyQuarter(x.q).months})`,
                      detail: `${v.basis} · ₹ crore · Screener’s standardised table of the company’s results filings`,
                      numbers: [{ label: `Net profit ${fyQuarter(x.q).q}`, value: fmt(x.x) }],
                      url: f.pdfs[x.j] ?? v.source,
                      extra: f.pdfs[x.j] ? [{ label: "Open Screener table", url: v.source }] : undefined,
                    })
                  }
                >
                  <span style={{ fontSize: 11, fontWeight: lastBar ? 700 : 500 }} className={x.x < 0 ? "t-act" : lastBar ? "" : "ink2"}>{fmt(x.x)}</span>
                  <span style={{ width: "100%", height: `${Math.max(4, (Math.abs(x.x) / max) * 70)}%`, borderRadius: 8, background: x.x < 0 ? "var(--act-solid)" : lastBar ? "var(--accent)" : "var(--quiet-solid)" }} />
                  <span style={{ fontSize: 11, fontWeight: lastBar ? 700 : 400 }} className={lastBar ? "" : "ink2"}>{qShort(x.q)}</span>
                </button>
              );
            })}
          </div>
          {bars.some((x) => x.x < 0) && <span className="small muted">Red bars are losses.</span>}
        </section>
      )}

      {s && (
        <button
          className="card"
          style={{ textAlign: "left", gap: 8 }}
          onClick={() =>
            ev({
              company: b.name,
              title: `${short(b.name)} — earnings call transcript (${s.call})`,
              detail: `Exchange filing · quoted from page ${s.page}`,
              quote: s.quote,
              quoteNote: `Quote found word-for-word on p.${s.page} by code`,
              readBy: "Read by GLM 5.3 flash (Gemini as fallback) · quote checked by code, not by the model",
              url: s.url,
              page: s.page,
            })
          }
        >
          <span className="label">What management said</span>
          <span style={{ borderLeft: "3px solid var(--accent)", paddingLeft: 14, fontSize: 17, lineHeight: "26px", fontStyle: "italic" }}>
            “<QuoteMark q={s.quote.length > 220 ? s.quote.slice(0, 217) + "…" : s.quote} />”
          </span>
          <span className="small ink2">{s.call} call, p.{s.page} · {s.metric}</span>
        </button>
      )}

      <AgainstTheirWord b={b} onBuild={onTrack} />
      {b.track && (
        <button className="btn" style={{ height: 44, justifyContent: "center" }} onClick={onTrack}>
          Track record · kept {b.track.kept} of {b.track.due} due ›
        </button>
      )}
    </div>
  );
}

/** Governance: four tiles (auditor, senior exits, regulatory, pledge) and the filings behind them. */
function Governance({ b }: { b: Bundle }) {
  const ev = useEvidence();
  const gov = b.filings.filter((f) => f.category === "governance");
  const pick = (re: RegExp) => gov.filter((f) => re.test(f.govKind ?? ""));
  const tiles = [
    { k: "Auditor changes", fs: pick(/Auditor/) },
    { k: "Senior exits", fs: pick(/exit/i) },
    { k: "Regulatory actions", fs: pick(/Regulatory|Insolvency|Red flag/) },
    { k: "Pledge / promoter", fs: pick(/Pledge|Insider/) },
  ];
  return (
    <div className="stack gap14">
      <section className="card big" style={{ gap: 12 }}>
        <span className="row between" style={{ alignItems: "baseline" }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Governance</span>
          <span className="small ink2">last 45 days of filings</span>
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          {tiles.map((t) => (
            <div key={t.k} className="tile" style={t.fs.length ? { background: "var(--actbg)" } : undefined}>
              <span className={`n ${t.fs.length ? "t-act" : ""}`}>{t.fs.length || "None"}</span>
              <span className="k" style={t.fs.length ? { color: "var(--act)" } : undefined}>{t.k}</span>
            </div>
          ))}
        </div>
        <span className="small muted">
          From exchange announcements · pledges are caught only when announced
        </span>
      </section>
      {gov.length === 0 ? (
        <div className="card s14 ink2">No governance filing in 45 days</div>
      ) : (
        <section className="card flush">
          {gov.map((f) => (
            <button key={f.id} className="rowlink" style={{ width: "100%", background: "none", border: 0, borderTop: "1px solid var(--line)", textAlign: "left", flexDirection: "column", gap: 4 }} onClick={() => ev(filingEvidence(b, f))}>
              <span className="row between gap8" style={{ width: "100%" }}>
                <span className={`chip ${f.govSeverity === "high" ? "c-act" : "c-watch"}`}>{f.govKind ?? "Governance"} · {f.govSeverity === "high" ? "red flag" : "check"}</span>
                <span className="small muted">{anchor(f.at)}</span>
              </span>
              <span className="s14" style={{ fontWeight: 600, lineHeight: "20px" }}>{f.headline}</span>
              {f.summary && <span className="s13 ink2 clamp1">{f.summary}</span>}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
