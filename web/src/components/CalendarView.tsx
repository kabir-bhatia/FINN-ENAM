"use client";
// Calendar: board meetings (results, dividends, fund raising) for portfolio companies, by date.
// Source: NSE's event calendar, refreshed with each company's data. Only announced dates are shown.
import Link from "next/link";
import { useMemo } from "react";
import { dayLabel, portfolioEvents, type PortfolioEvent } from "@/lib/home";
import { useBundles, usePortfolio } from "@/lib/client";
import { istDate } from "@/lib/time";
import { Footer, Icon, Skeleton } from "./ui";

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

  const day = (g: { d: string; items: PortfolioEvent[] }, first: boolean) => (
    <section key={g.d} className="card flush">
      <span className="row between" style={{ padding: "12px 16px", background: first ? "var(--hero)" : "transparent", color: first ? "var(--hero-ink)" : "var(--ink)" }}>
        <span style={{ fontWeight: 700 }}>{dayLabel(g.d)}{g.d === today ? " · today" : ""}</span>
        <span className="small" style={{ opacity: 0.8 }}>{g.items.length} {g.items.length === 1 ? "company" : "companies"}</span>
      </span>
      {g.items.map((e, i) => (
        <Link key={e.symbol + i} href={`/c/${e.symbol}`} className="rowlink" style={{ borderTop: "1px solid var(--line)", alignItems: "center" }}>
          <span className="stack" style={{ flex: 1, gap: 3, minWidth: 0 }}>
            <span className="row gap8">
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</span>
              <span className={`chip ${tone(e.kind)}`}>{e.kind}</span>
            </span>
            {e.desc && <span className="s13 ink2" style={{ lineHeight: "18px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{e.desc}</span>}
          </span>
          <span className="muted" style={{ flex: "0 0 auto" }}>{Icon.chevR}</span>
        </Link>
      ))}
    </section>
  );

  return (
    <>
      <div style={{ height: 20 }} />
      <div className="stack gap14">
        <div className="stack gap4">
          <h1 className="title">Calendar</h1>
          <span className="s14 ink2">Board meetings your companies have announced to the exchange.</span>
        </div>
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
            {up.length ? up.map((g, i) => day(g, i === 0)) : (
              <div className="card s14 ink2">
                None of your {bundles.length} companies has announced a board meeting ahead. Results dates are usually announced about a week before; they will appear here when filed.
              </div>
            )}
            {past.length > 0 && (
              <>
                <span className="sect" style={{ marginTop: 6 }}>Last 45 days</span>
                {past.map((g) => day(g, false))}
              </>
            )}
          </>
        )}
        <span className="small muted">Source: NSE event calendar, read with each data refresh. Earnings-call dates are not in this feed; they appear in a company’s Updates when it files the schedule.</span>
        <Footer />
      </div>
    </>
  );
}
