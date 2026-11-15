"use client";
// Companies: the library. Portfolio list (state + track-record dots), search any NSE company,
// long-press a row to remove (with Undo) — 04 doc §10.6.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { companyDay } from "@/lib/digest";
import { DEMO, useBundles, usePortfolio, useRules } from "@/lib/client";
import type { Bundle } from "@/lib/types";
import { stateChip } from "./cards";
import { Footer, Icon, Sheet, Skeleton, Toast, TopBar } from "./ui";

export default function CompaniesView() {
  const [portfolio, setPortfolio, hydrated] = usePortfolio();
  const [rules] = useRules();
  const { bundles, loading } = useBundles(portfolio, hydrated);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ symbol: string; name: string }[]>([]);
  const [menu, setMenu] = useState<Bundle | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) {
      setHits([]);
      return;
    }
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(t)}`).then((r) => r.json()).then(setHits).catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  const days = useMemo(() => {
    const from = Date.now() - 7 * 864e5;
    const order = { challenged: 0, look: 1, unchanged: 2 };
    return bundles.map((b) => companyDay(b, rules, from)).sort((a, b) => order[a.state] - order[b.state] || a.b.name.localeCompare(b.b.name));
  }, [bundles, rules]);

  const remove = (sym: string, name: string) => {
    const before = portfolio;
    setPortfolio(portfolio.filter((s) => s !== sym));
    setToast({ text: `Removed ${name.replace(/ Limited$/, "")}`, undo: () => setPortfolio(before) });
  };
  const add = (sym: string) => {
    if (!portfolio.includes(sym)) setPortfolio([...portfolio, sym]);
    router.push(`/c/${sym}`);
  };

  return (
    <>
      <TopBar />
      <div className="stack gap14">
        <h1 className="title">Companies</h1>
        <label className="row gap8" style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, color: "var(--ink3)" }}>{Icon.search}</span>
          <input className="input" style={{ paddingLeft: 40 }} placeholder="Any NSE company or ticker" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search companies" />
        </label>
        {hits.length > 0 && (
          <section className="card flush">
            {hits.map((h) => (
              <div key={h.symbol} className="rowlink" style={{ alignItems: "center" }}>
                <Link href={`/c/${h.symbol}`} className="stack" style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <span className="strong">{h.name}</span>
                  <span className="mono small muted">{h.symbol}</span>
                </Link>
                {portfolio.includes(h.symbol) ? (
                  <span className="small muted">In portfolio</span>
                ) : (
                  <button className="btn" onClick={() => add(h.symbol)}>Add</button>
                )}
              </div>
            ))}
          </section>
        )}

        <span className="row between">
          <span className="label">Your portfolio · {portfolio.length}</span>
          <span className="small muted">Long-press a company for options</span>
        </span>
        {loading && <div className="card stack gap10"><Skeleton /><Skeleton w="70%" /><Skeleton w="85%" /></div>}
        {!loading && (
          <section className="card flush">
            {days.map((d) => (
              <Row key={d.b.symbol} b={d.b} onLong={() => setMenu(d.b)}>
                {stateChip(d.state)}
                <span className="stack" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                  <span className="row between gap8">
                    <span className="strong" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.b.name.replace(/ Limited$/, "")}</span>
                    <span className="mono small muted">{d.b.symbol}</span>
                  </span>
                  <span className="s13 ink2" style={{ lineHeight: "18px" }}>{d.state === "unchanged" ? "Nothing material this week" : d.reason}</span>
                  {d.b.track && (
                    <span className="small muted">Kept {d.b.track.kept} of {d.b.track.due} promises due</span>
                  )}
                </span>
              </Row>
            ))}
            {portfolio.length === 0 && <div className="rowlink s14 ink2">Empty. Search above to add any NSE company.</div>}
          </section>
        )}
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
            <span className="headline" style={{ marginBottom: 6 }}>{menu.name.replace(/ Limited$/, "")}</span>
            {[
              { label: "Open company", go: () => router.push(`/c/${menu.symbol}`) },
              { label: menu.track ? "Open track record" : "Build track record", go: () => router.push(`/c/${menu.symbol}?tab=track`) },
              { label: "Remove from portfolio", danger: true, go: () => remove(menu.symbol, menu.name) },
            ].map((a) => (
              <button key={a.label} className={`row ${a.danger ? "t-act" : ""}`} style={{ height: 52, border: 0, borderTop: "1px solid var(--line)", background: "none", fontSize: 16, textAlign: "left" }} onClick={() => { setMenu(null); a.go(); }}>
                {a.label}
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
      className="rowlink"
      style={{ userSelect: "none", WebkitTouchCallout: "none" }}
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
