"use client";
// How FINN thinks (A17): ranking rules, model routing and real cost, from live data.
import { useMemo } from "react";
import { useBundles, usePortfolio } from "@/lib/client";
import { Footer, TopBar } from "./ui";

export default function HowView() {
  const [portfolio, , hydrated] = usePortfolio();
  const { bundles } = useBundles(portfolio, hydrated);
  const stats = useMemo(() => {
    const fs = bundles.flatMap((b) => b.filings);
    const llm = bundles.reduce((a, b) => ({ calls: a.calls + (b.llm?.calls ?? 0), tok: a.tok + (b.llm?.inTok ?? 0) + (b.llm?.outTok ?? 0), inr: a.inr + (b.llm?.inr ?? 0) }), { calls: 0, tok: 0, inr: 0 });
    return { n: fs.length, rule: fs.filter((f) => f.by === "rule").length, model: fs.filter((f) => f.by === "model").length, routine: fs.filter((f) => f.category === "routine").length, llm };
  }, [bundles]);
  const pct = (a: number) => (stats.n ? Math.round((a / stats.n) * 100) : 0);
  return (
    <>
      <TopBar back={{ label: "Back" }} />
      <div className="stack gap14">
        <h1 className="title">How FINN thinks</h1>
        <p className="s14 ink2" style={{ margin: 0 }}>
          FINN tells a long-term investor only what changed for their companies, and checks whether management kept its word.
          Every number and quote opens its source document.
        </p>

        <Section title="1 · What reaches Today">
          <Li><b>Governance always comes first</b> — auditor changes, senior exits, regulatory orders, pledges, guarantees. It can never be collapsed.</Li>
          <Li><b>Your categories</b> (Alerts tab) count as “needs you”; everything else non-routine is “worth knowing”.</Li>
          <Li><b>Routine paperwork</b> (trading-window notices, newspaper ads, certificates, call recordings) is collapsed into one line.</Li>
          <Li><b>Price moves</b> only reach you when they cross <i>your</i> rule — and by default only when no filing explains them. Split and bonus days are ignored.</Li>
          <Li><b>Each company gets a state:</b> challenged (a red-flag governance event, or profit down ≥ 20% vs last year), worth a look (anything you asked to hear about), or unchanged.</Li>
        </Section>

        <Section title="2 · Cheapest model that does the job">
          <Li><b>Rules first.</b> The exchange’s own category plus keywords classify most filings for free.</Li>
          <Li><b>flash-lite</b> only for vague titles (“General Updates”), reading the exchange’s short summary — never the PDF.</Li>
          <Li><b>flash-lite</b> reads call transcripts and lists promises with exact quotes. <b>Code</b> then finds each quote in the PDF text and drops any it can’t find.</Li>
          <Li><b>flash</b> judges verdicts on the small ledger only (a few KB), not on whole transcripts.</Li>
          <Li><b>No model touches numbers.</b> Results come from Screener’s table of the filed results; growth and EBITDA are computed in code.</Li>
          <Li><b>Cached forever:</b> filings never change, so nothing is read twice.</Li>
        </Section>

        <Section title="3 · Live numbers for your portfolio">
          {stats.n ? (
            <>
              <Stat k="Filings read (last 45 days)" v={String(stats.n)} />
              <Stat k="Classified by rules, no model" v={`${stats.rule} · ${pct(stats.rule)}%`} />
              <Stat k="Needed flash-lite" v={`${stats.model} · ${pct(stats.model)}%`} />
              <Stat k="Routine, collapsed" v={`${stats.routine} · ${pct(stats.routine)}%`} />
              <Stat k="Model cost for all of it" v={`₹${stats.llm.inr.toFixed(2)} · ${(stats.llm.tok / 1000).toFixed(1)}k tokens`} />
              <span className="small muted">Costs are at paid Gemini list prices; FINN runs on the free tier, so the actual cost is ₹0. A full track record costs about ₹0.2–0.5 once, then it is cached for everyone.</span>
            </>
          ) : (
            <span className="s14 muted">Loading…</span>
          )}
        </Section>

        <Section title="4 · Sources">
          <Li>NSE corporate announcements (filings and the exchange’s summary of each).</Li>
          <Li>Earnings-call transcripts filed with the exchange, found via Screener.</Li>
          <Li>Screener’s standardised quarterly table of reported results (₹ crore; consolidated when available).</Li>
          <Li>Yahoo end-of-day prices and volume (split-adjusted).</Li>
          <Li>No news, broker notes, or the model’s own outside knowledge.</Li>
        </Section>
        <Footer />
      </div>
    </>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="card stack gap8"><span className="label">{title}</span>{children}</section>
);
const Li = ({ children }: { children: React.ReactNode }) => <span className="s14" style={{ lineHeight: "21px" }}>{children}</span>;
const Stat = ({ k, v }: { k: string; v: string }) => (
  <span className="row between s14"><span className="ink2">{k}</span><span className="mono">{v}</span></span>
);
