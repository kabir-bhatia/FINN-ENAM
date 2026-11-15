"use client";
// Companies: the portfolio list (state + promise bar per company). Search lives on its own
// centre button; long-press a row to remove (with Undo) — 04 doc §13.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { companyDay } from "@/lib/digest";
import { sectorOf } from "@/lib/home";
import { DEMO, useBundles, usePortfolio, useRules } from "@/lib/client";
import type { Bundle } from "@/lib/types";
import { PromiseBar, short, stateChip } from "./cards";
import { Footer, Icon, Sheet, Skeleton, Toast } from "./ui";

export default function CompaniesView() {
  const [portfolio, setPortfolio, hydrated] = usePortfolio();
  const [rules] = useRules();
  const { bundles, loading } = useBundles(portfolio, hydrated);
  const [menu, setMenu] = useState<Bundle | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const router = useRouter();

  const days = useMemo(() => {
    const from = Date.now() - 7 * 864e5;
    const order = { challenged: 0, look: 1, unchanged: 2 };
    return bundles.map((b) => companyDay(b, rules, from)).sort((a, b) => order[a.state] - order[b.state] || a.b.name.localeCompare(b.b.name));
  }, [bundles, rules]);

  const remove = (sym: string, name: string) => {
    const before = portfolio;
    setPortfolio(portfolio.filter((s) => s !== sym));
    setToast({ text: `Removed ${short(name)}`, undo: () => setPortfolio(before) });
  };

  return (
    <>
      <div style={{ height: 20 }} />
      <div className="stack gap14">
        <div className="row between" style={{ alignItems: "flex-end" }}>
          <div className="stack gap4">
            <h1 className="title">Companies</h1>
            <span className="s13 ink2">{portfolio.length} in your portfolio · state over the last 7 days</span>
          </div>
          <Link className="roundbtn" href="/search" aria-label="Add a company">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
          </Link>
        </div>

        {loading && <div className="card stack gap10"><Skeleton /><Skeleton w="70%" /><Skeleton w="85%" /></div>}
        {!loading &&
          days.map((d) => (
            <Row key={d.b.symbol} b={d.b} onLong={() => setMenu(d.b)}>
              <span className="row between gap8">
                <span style={{ fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{short(d.b.name)}</span>
                {stateChip(d.state)}
              </span>
              <span className="small ink2">{sectorOf(d.b.symbol, d.b.industry)} · {d.b.symbol}</span>
              <span className="s13 ink2" style={{ lineHeight: "18px" }}>{d.state === "unchanged" ? "Nothing material this week" : d.reason}</span>
              {d.b.track && <PromiseBar t={d.b.track} />}
            </Row>
          ))}
        {!loading && portfolio.length === 0 && (
          <div className="card stack gap10">
            <span className="headline">Your portfolio is empty</span>
            <Link className="btn primary" href="/search">Search any NSE company</Link>
          </div>
        )}
        {!loading && portfolio.length > 0 && <span className="small muted" style={{ textAlign: "center" }}>Long-press a company for options</span>}
        {portfolio.length !== DEMO.length || portfolio.some((s) => !DEMO.includes(s)) ? (
          <button className="btn" style={{ height: 44, justifyContent: "center" }} onClick={() => { const before = portfolio; setPortfolio(DEMO); setToast({ text: "Demo portfolio restored", undo: () => setPortfolio(before) }); }}>
            Reset to demo portfolio
          </button>
        ) : null}
        <Footer />
      </div>

      <Sheet open={!!menu} onClose={() => setMenu(null)} label="Company options">
        {menu && (
          <div className="stack gap4">
            <span className="headline" style={{ marginBottom: 6 }}>{short(menu.name)}</span>
            {[
              { label: "Open company", go: () => router.push(`/c/${menu.symbol}`) },
              { label: menu.track ? "Open track record" : "Build track record", go: () => router.push(`/c/${menu.symbol}?tab=track`) },
              { label: "Remove from portfolio", danger: true, go: () => remove(menu.symbol, menu.name) },
            ].map((a) => (
              <button key={a.label} className={`row between ${a.danger ? "t-act" : ""}`} style={{ height: 52, border: 0, borderTop: "1px solid var(--line)", background: "none", fontSize: 16, fontWeight: 600, textAlign: "left" }} onClick={() => { setMenu(null); a.go(); }}>
                {a.label}
                {!a.danger && <span className="muted">{Icon.chevR}</span>}
              </button>
            ))}
          </div>
        )}
      </Sheet>
      {toast && <Toast text={toast.text} action={toast.undo ? "Undo" : undefined} onAction={() => { toast.undo?.(); setToast(null); }} onDone={() => setToast(null)} />}
    </>
  );
}

function Row({ b, onLong, children }: { b: Bundle; onLong: () => void; children: React.ReactNode }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const start = () => {
    fired.current = false;
    timer.current = setTimeout(() => {
      fired.current = true;
      navigator.vibrate?.(10);
      onLong();
    }, 480);
  };
  const cancel = () => timer.current && clearTimeout(timer.current);
  return (
    <a
      href={`/c/${b.symbol}`}
      className="card"
      style={{ userSelect: "none", WebkitTouchCallout: "none", gap: 6 }}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!fired.current) onLong();
        fired.current = true;
      }}
      onClick={(e) => {
        e.preventDefault();
        if (!fired.current) router.push(`/c/${b.symbol}`);
      }}
    >
      {children}
    </a>
  );
}
