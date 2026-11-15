"use client";
import Link from "next/link";
import { useState } from "react";
import { DEFAULT_RULES, WINDOW_LABEL } from "@/lib/digest";
import { DEFAULT_SETTINGS, DEMO, usePortfolio, useRules, useSettings } from "@/lib/client";
import type { WindowKey } from "@/lib/types";
import { nextBrief } from "@/lib/time";
import { Footer, Icon, Toast, TopBar } from "./ui";

export default function SettingsView() {
  const [s, setS] = useSettings();
  const [, setPortfolio] = usePortfolio();
  const [, setRules] = useRules();
  const [toast, setToast] = useState<string | null>(null);
  const setBrief = (i: number, v: string) => setS({ ...s, briefs: s.briefs.map((x, j) => (j === i ? v : x)) });
  return (
    <>
      <TopBar back={{ label: "Back" }} />
      <div className="stack gap14">
        <h1 className="title">Settings</h1>
        <span className="label">Appearance</span>
        <div className="seg">
          {(["system", "light", "dark"] as const).map((t) => (
            <button key={t} aria-pressed={s.theme === t} onClick={() => setS({ ...s, theme: t })}>{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        <span className="label" style={{ marginTop: 6 }}>Daily brief</span>
        <section className="card flush">
          {[{ t: "Morning brief", n: "before the 09:15 open" }, { t: "Evening brief", n: "after the close, when results land" }].map((x, i) => (
            <label key={x.t} className="rowlink between" style={{ alignItems: "center" }}>
              <span className="stack" style={{ gap: 2 }}><span className="s14 strong">{x.t}</span><span className="small muted">{x.n}</span></span>
              <input type="time" value={s.briefs[i] ?? ""} onChange={(e) => setBrief(i, e.target.value)} style={{ height: 40, border: "1px solid var(--line)", borderRadius: 10, padding: "0 8px", background: "var(--surface)", color: "var(--ink)" }} />
            </label>
          ))}
          <button className="rowlink between" style={{ width: "100%", background: "none", border: 0, borderTop: "1px solid var(--line)", textAlign: "left", alignItems: "center" }} role="switch" aria-checked={s.weekdaysOnly} onClick={() => setS({ ...s, weekdaysOnly: !s.weekdaysOnly })}>
            <span className="s14 strong">Weekdays only</span>
            <span className="toggle" aria-checked={s.weekdaysOnly} />
          </button>
          <div className="rowlink between" style={{ alignItems: "center" }}>
            <span className="s14 strong">Send to</span>
            <span className="s13 ink2">In app · <span className="muted">Telegram (coming soon)</span></span>
          </div>
        </section>
        <span className="small muted">Next brief {nextBrief(s.briefs, s.weekdaysOnly)}. Home is assembled from data refreshed on a schedule, so it is ready when you open it.</span>

        <span className="label" style={{ marginTop: 6 }}>Home shows</span>
        <div className="seg" style={{ gridAutoColumns: "auto" }}>
          {(["since", "24h", "7d", "30d"] as WindowKey[]).map((w) => (
            <button key={w} aria-pressed={s.window === w} onClick={() => setS({ ...s, window: w })} style={{ fontSize: 13 }}>
              {w === "since" ? "Since last look" : w}
            </button>
          ))}
        </div>
        <span className="small muted">Default window: {WINDOW_LABEL[s.window]}.</span>

        <section className="card flush" style={{ marginTop: 6 }}>
          <Link href="/how" className="rowlink between" style={{ alignItems: "center" }}><span className="s14">How FINN thinks, and what it costs</span>{Icon.chevR}</Link>
          <button className="rowlink" style={{ width: "100%", background: "none", border: 0, borderTop: "1px solid var(--line)", textAlign: "left" }} onClick={() => {
            setPortfolio(DEMO); setRules(DEFAULT_RULES); setS(DEFAULT_SETTINGS);
            try { localStorage.removeItem("finn.seen"); localStorage.removeItem("finn.visits"); } catch {}
            setToast("Demo portfolio, rules and settings restored");
          }}>
            <span className="s14 t-act">Reset to demo portfolio</span>
          </button>
        </section>
        <Footer />
      </div>
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </>
  );
}
