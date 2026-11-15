"use client";
// Calendar: board meetings (results, dividends, fund raising) for portfolio companies, by date.
// Source: NSE's event calendar, refreshed with each company's data. Only announced dates are shown.
import Link from "next/link";
import { useMemo, useState } from "react";
import { dayLabel, portfolioEvents, type PortfolioEvent } from "@/lib/home";
import { useBundles, usePortfolio } from "@/lib/client";
import { istDate } from "@/lib/time";
import { Skeleton } from "./ui";

function groupByDay(es: PortfolioEvent[]) {
  const out: { d: string; items: PortfolioEvent[] }[] = [];
  for (const e of es) {
    const g = out.find((x) => x.d === e.d);
    if (g) g.items.push(e);
    else out.push({ d: e.d, items: [e] });
  }
  return out;
}

const tone = (k: string) => (k === "Results" ? "c-good" : k === "Dividend" ? "c-ink" : k === "Fund raising" ? "c-watch" : "c-quiet");

export default function CalendarView() {
  const [portfolio, , hydrated] = usePortfolio();
  const { bundles, loading } = useBundles(portfolio, hydrated);
  const cal = useMemo(() => portfolioEvents(bundles), [bundles]);
  const today = istDate(Date.now());
  const up = groupByDay(cal.upcoming);
  const past = groupByDay(cal.recent);
  const [open, setOpen] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  // One list with date headers, routine-list style; the NSE purpose text sits behind a tap.
  const list = (gs: { d: string; items: PortfolioEvent[] }[], firstHot: boolean) => (
    <section className="card flush">
      {gs.map((g, gi) => (
        <div key={g.d}>
          <span className="row small strong" style={{ padding: "10px 16px 6px", borderTop: gi ? "1px solid var(--line)" : 0, color: firstHot && gi === 0 ? "var(--good)" : "var(--ink2)" }}>
            {dayLabel(g.d)}{g.d === today ? " · today" : ""}
          </span>
          {g.items.map((e, i) => {
            const k = g.d + e.symbol + i;
            const isOpen = open === k;
            return (
              <div key={k} style={{ padding: "0 16px" }}>
                <button className="row between gap8" style={{ width: "100%", minHeight: 44, background: "none", border: 0, padding: "4px 0", textAlign: "left", font: "inherit", color: "inherit" }} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : k)}>
                  <span className="s14" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{e.name}</span>
                  <span className={`chip ${tone(e.kind)}`}>{e.kind}</span>
                </button>
                {isOpen && (
                  <span className="stack gap6" style={{ paddingBottom: 10 }}>
                    {e.desc && <span className="s13 ink2" style={{ lineHeight: "18px" }}>{e.desc}</span>}
                    <Link className="link s13" href={`/c/${e.symbol}`}>Open {e.name} ›</Link>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );

  return (
    <>
      <div style={{ height: 20 }} />
      <div className="stack gap14">
        <h1 className="title">Calendar</h1>
        {loading && <div className="card stack gap10"><Skeleton /><Skeleton w="70%" /><Skeleton w="85%" /></div>}
        {!loading && !cal.loaded && bundles.length > 0 && (
          <div className="card s14 ink2">Event dates are being fetched from NSE for the first time. Open this tab again in a minute.</div>
        )}
        {!loading && portfolio.length === 0 && (
          <div className="card s14 ink2">Your portfolio is empty. <Link className="link" href="/search">Search any NSE company ›</Link></div>
        )}
        {!loading && cal.loaded && (
          <>
            <span className="sect">Coming up</span>
            {up.length ? list(up, true) : <div className="card s14 ink2">No board meetings announced yet. Results dates usually appear about a week ahead.</div>}
            {past.length > 0 && (
              <section className="card">
                <button className="row between" style={{ background: "none", border: 0, padding: 0, textAlign: "left", minHeight: 40, font: "inherit", color: "inherit" }} onClick={() => setShowPast(!showPast)} aria-expanded={showPast}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{past.reduce((n, g) => n + g.items.length, 0)} meetings in the last 45 days</span>
                  <span className="link">{showPast ? "Hide" : "Show"}</span>
                </button>
              </section>
            )}
            {showPast && list(past, false)}
          </>
        )}
        <span className="small muted">Source: NSE event calendar · earnings-call dates appear in a company’s Updates</span>
      </div>
    </>
  );
}
