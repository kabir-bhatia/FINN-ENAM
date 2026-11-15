"use client";
// Alerts: the user decides what is unusual; these rules decide what reaches Today (P6).
import Link from "next/link";
import { CAT_LABEL, DEFAULT_RULES, RULE_CATS } from "@/lib/digest";
import { useRules } from "@/lib/client";
import { Icon, TopBar } from "./ui";

export default function AlertsView() {
  const [rules, setRules] = useRules();
  const step = (k: "vol" | "pct", d: number, min: number, max: number) =>
    setRules({ ...rules, [k]: Math.round(Math.min(max, Math.max(min, rules[k] + d)) * 10) / 10 });
  return (
    <>
      <TopBar />
      <div className="stack gap14">
        <div className="stack gap4">
          <h1 className="title">Alerts</h1>
          <span className="s14 ink2">You decide what is unusual. These rules decide what reaches Home.</span>
        </div>
        <span className="label" style={{ marginTop: 6 }}>Price and volume</span>
        <section className="card flush">
          <Stepper title="Trading volume above" note="× its 20-day average (excluding the day itself)" value={`${rules.vol.toFixed(1)}×`} dec={() => step("vol", -0.5, 1.5, 10)} inc={() => step("vol", 0.5, 1.5, 10)} />
          <Stepper title="Price moves more than" note="in one session, up or down" value={`±${rules.pct}%`} dec={() => step("pct", -1, 2, 20)} inc={() => step("pct", 1, 2, 20)} />
          <button className="rowlink between" style={{ width: "100%", background: "none", border: 0, borderTop: "1px solid var(--line)", textAlign: "left", alignItems: "center" }} role="switch" aria-checked={rules.onlyUnexplained} onClick={() => setRules({ ...rules, onlyUnexplained: !rules.onlyUnexplained })}>
            <span className="stack" style={{ gap: 2 }}>
              <span className="s14 strong">Only if no filing explains it</span>
              <span className="small muted">Explained moves show on their filing instead</span>
            </span>
            <span className="toggle" aria-checked={rules.onlyUnexplained} />
          </button>
        </section>

        <span className="label" style={{ marginTop: 6 }}>Announcements that need you</span>
        <section className="card stack gap10">
          <span className="row gap8" style={{ flexWrap: "wrap" }}>
            <span className="chip c-act" style={{ fontSize: 13, padding: "8px 12px", borderRadius: 10, textTransform: "none", letterSpacing: 0 }}>Governance · always</span>
            {RULE_CATS.map((c) => {
              const on = rules.cats.includes(c);
              return (
                <button
                  key={c}
                  aria-pressed={on}
                  onClick={() => setRules({ ...rules, cats: on ? rules.cats.filter((x) => x !== c) : [...rules.cats, c] })}
                  style={{ height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid var(--line)", fontSize: 13, fontWeight: 500, background: on ? "var(--ink)" : "var(--surface)", color: on ? "var(--oninv)" : "var(--ink)" }}
                >
                  {CAT_LABEL[c]}
                </button>
              );
            })}
          </span>
          <span className="small muted">Selected types go to Needs you; the rest to Worth knowing.</span>
        </section>
        <button className="btn" style={{ height: 44, justifyContent: "center" }} onClick={() => setRules(DEFAULT_RULES)}>Restore default rules</button>
        <Link href="/how" className="row between s14 ink2" style={{ minHeight: 44 }}>
          How FINN ranks, and what it costs {Icon.chevR}
        </Link>
      </div>
    </>
  );
}

function Stepper({ title, note, value, dec, inc }: { title: string; note: string; value: string; dec: () => void; inc: () => void }) {
  const b = { width: 40, height: 40, borderRadius: 10, border: 0, background: "var(--sunk)", fontSize: 20 } as const;
  return (
    <div className="rowlink between" style={{ alignItems: "center" }}>
      <span className="stack" style={{ gap: 2, minWidth: 0 }}>
        <span className="s14 strong">{title}</span>
        <span className="small muted">{note}</span>
      </span>
      <span className="row gap6" style={{ flex: "0 0 auto" }}>
        <button style={b} onClick={dec} aria-label={`Decrease ${title}`}>−</button>
        <span className="s14 strong" style={{ minWidth: 48, textAlign: "center" }}>{value}</span>
        <button style={b} onClick={inc} aria-label={`Increase ${title}`}>+</button>
      </span>
    </div>
  );
}
