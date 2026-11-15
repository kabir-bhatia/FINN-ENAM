"use client";
// Track record: did management do what it said? Built step by step with visible progress (A9),
// cached for everyone afterwards, with a cost receipt (A10). Layout per 04 doc §13:
// scorecard → said vs reported → ledger rows → questions to ask → cost receipt.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Bundle, Ledger, Promise_, Verdict } from "@/lib/types";
import { VERDICTS } from "@/lib/types";
import { getTrack, invalidate, postTrack } from "@/lib/client";
import { saidVsReported, type SaidRow } from "@/lib/home";
import { shortDate } from "@/lib/time";
import { Sheet, Skeleton, useEvidence } from "./ui";

const vcls = (v?: Verdict) =>
  v === "Kept" ? "t-good" : v === "Missed" ? "t-act" : v === "Target changed" ? "t-watch" : "t-quiet";
const barCls = (v?: Verdict) => `b-${(v ?? "Too early").split(" ")[0]}`;

export default function TrackView({ b }: { b: Bundle }) {
  const [l, setL] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  const [all, setAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ask, setAsk] = useState(false);
  const ev = useEvidence();
  const started = useRef(false);

  useEffect(() => {
    getTrack(b.symbol)
      .then((d) => setL(d.status === "none" ? null : (d as Ledger)))
      .finally(() => setLoading(false));
  }, [b.symbol]);

  const build = useCallback(async (retry = false) => {
    if (started.current) return;
    started.current = true;
    setRunning(true);
    setErr("");
    try {
      let cur = await postTrack(b.symbol, { step: "discover", retry });
      setL(cur);
      if (cur.status === "building") {
        for (let i = 0; i < cur.transcripts.length; i++) {
          if (cur.transcripts[i].status === "done") continue;
          cur = await postTrack(b.symbol, { step: "extract", i });
          setL(cur);
        }
        cur = await postTrack(b.symbol, { step: "verdict" });
        setL(cur);
        invalidate(b.symbol);
      }
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setRunning(false);
      started.current = false;
    }
  }, [b.symbol]);

  if (loading) return <div className="card stack gap10"><Skeleton h={20} w="70%" /><Skeleton h={14} /><Skeleton h={14} w="60%" /></div>;

  if (!l || (l.status === "building" && !running)) {
    return (
      <div className="card big" style={{ gap: 12 }}>
        <span className="headline" style={{ fontSize: 18, lineHeight: "24px" }}>Did {b.name.replace(/ Limited$/, "")} do what it said?</span>
        <span className="s14 ink2">
          FINN reads the last 4 earnings-call transcripts, lists every checkable promise with its exact quote and page,
          then checks each against the reported numbers. Primary sources only.
        </span>
        <span className="small muted">≈ 1–2 minutes · GLM 5.3 flash reads the calls and judges (Gemini as fallback) · ₹0 on free tiers · cached for everyone after</span>
        {l?.status === "building" && <span className="small t-watch">A previous build stopped part-way; it will resume where it left off.</span>}
        <button className="btn primary" onClick={() => build()}>Build track record</button>
        {err && <span className="small t-act">{err}</span>}
      </div>
    );
  }

  if (l.status === "no-transcripts")
    return (
      <div className="card stack gap8">
        <span className="headline">No call transcripts found</span>
        <span className="s14 ink2">{l.note}</span>
        <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => build()}>Check again</button>
        {err && <span className="small t-act">{err}</span>}
      </div>
    );

  if (running || l.status === "building") return <Progress l={l} err={err} />;

  // ready
  const ps = [...l.promises].sort((a, b) => VERDICTS.indexOf(a.verdict ?? "Too early") - VERDICTS.indexOf(b.verdict ?? "Too early") || b.callIdx - a.callIdx);
  const counts = Object.fromEntries(VERDICTS.map((v) => [v, l.promises.filter((p) => p.verdict === v).length])) as Record<Verdict, number>;
  const due = l.promises.filter((p) => p.verdict && p.verdict !== "Too early").length;
  const done = l.transcripts.filter((t) => t.status === "done");
  const cost = l.costs.reduce((s, c) => s + c.inr, 0);
  const tokens = l.costs.reduce((s, c) => s + c.inTok + c.outTok, 0);
  const shown = all ? ps : ps.slice(0, 8);
  const svr = saidVsReported(l);
  const openPromise = (p: Promise_) => {
    const t = l.transcripts.find((x) => x.month === p.call);
    ev({
      company: l.name,
      title: `${l.name.replace(/ Limited$/, "")} — earnings call transcript (${p.call})`,
      detail: `Exchange filing · ${t?.pages ?? "?"} pages · quoted from page ${p.page}`,
      quote: p.quote,
      quoteNote: `Quote found word-for-word on p.${p.page} — checked by code, not by the model`,
      numbers: [
        { label: "They said", value: `${p.target}${p.horizon ? ` · by ${p.horizon}` : ""}` },
        ...(p.actual ? [{ label: "Reported", value: p.actual }] : []),
        { label: "Verdict", value: p.verdict ?? "Too early" },
      ],
      readBy: `${p.reason ? `${p.reason} · ` : ""}Extracted and judged by the model named in the cost receipt · verdict uses the ledger + reported numbers only`,
      url: t?.url,
      page: p.page,
    });
  };
  return (
    <div className="stack gap14">
      <section className="card big" style={{ gap: 12 }}>
        <span className="small ink2">{done.length} calls read · {done.length ? `${done[done.length - 1].month} – ${done[0].month}` : ""}</span>
        <span style={{ fontSize: 20, lineHeight: "26px", fontWeight: 700 }}>
          {!l.promises.length ? "No checkable promises found" : due ? `Kept ${counts.Kept} of the ${due} ${due === 1 ? "promise that is" : "promises that are"} due` : `${l.promises.length} promises on record; none is due yet`}
        </span>
        {l.promises.length > 0 && (
          <>
            <span className="minibar" role="img" aria-label="Promise scorecard" style={{ flexWrap: "nowrap" }}>
              {ps.map((p) => <i key={p.id} className={barCls(p.verdict)} style={{ flex: "1 1 0", width: "auto", maxWidth: 28, height: 8, borderRadius: 4 }} title={p.verdict} />)}
            </span>
            <span className="row gap10 s13 ink2" style={{ flexWrap: "wrap", rowGap: 4 }}>
              {VERDICTS.filter((v) => counts[v]).map((v) => (
                <span key={v} className="row gap4"><i className={barCls(v)} style={{ width: 10, height: 10, borderRadius: 5, display: "block" }} /><b style={{ color: "var(--ink)" }}>{counts[v]}</b> {v.toLowerCase()}</span>
              ))}
            </span>
          </>
        )}
        {l.note && <span className="s14 ink2">{l.note}</span>}
        {done.length < l.transcripts.length && (
          <span className="stack gap6">
            <span className="small t-watch">
              {l.transcripts.length - done.length} call(s) couldn’t be read:{" "}
              {l.transcripts.filter((t) => t.status === "failed").map((t) => `${t.month} (${/429|quota/i.test(t.error ?? "") ? "free-tier model quota reached" : t.error})`).join("; ")}. Verdicts use the calls that were read.
            </span>
            <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => build(true)}>Retry missing calls</button>
          </span>
        )}
      </section>

      {svr && <SaidVsReported metric={svr.metric} rows={svr.rows} onOpen={openPromise} />}

      {l.promises.length > 0 && (
        <section className="card flush">
          <span className="label" style={{ padding: "14px 16px 6px" }}>Ledger · {l.promises.length} promises</span>
          {shown.map((p) => (
            <button key={p.id} className="ledger" style={{ borderTop: "1px solid var(--line)" }} onClick={() => openPromise(p)}>
              <span className="stack" style={{ gap: 2 }}>
                <span className={`small strong ${vcls(p.verdict)}`}>{p.verdict ?? "Too early"}</span>
                <span className="small muted">{p.call.split(" ")[0]} · p.{p.page}</span>
              </span>
              <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                <span className="s14" style={{ lineHeight: "20px" }}>
                  <span style={{ fontWeight: 600 }}>{p.metric}</span> · {p.target}
                  {p.actual ? <span className="ink2"> · reported {p.actual}</span> : null}
                </span>
                {p.reason && <span className="small ink2" style={{ lineHeight: "17px" }}>{p.reason}</span>}
              </span>
            </button>
          ))}
          {ps.length > 8 && (
            <button className="link" style={{ height: 48, borderTop: "1px solid var(--line)", width: "100%" }} onClick={() => setAll(!all)}>
              {all ? "Show fewer" : `See all ${ps.length} promises`}
            </button>
          )}
        </section>
      )}

      {l.questions.length > 0 && (
        <button className="btn primary" onClick={() => { setCopied(false); setAsk(true); }}>Questions to ask management</button>
      )}

      <details className="card stack gap6 receipt">
        <summary className="row between s14" style={{ fontWeight: 600, minHeight: 32, cursor: "pointer" }}>
          <span>Cost receipt</span>
          <span className="small muted">{(tokens / 1000).toFixed(1)}k tokens · ₹0 ›</span>
        </summary>
        {l.costs.map((c, i) => (
          <span key={i} className="row between small gap8">
            <span className="ink2" style={{ minWidth: 0 }}>{c.step}</span>
            <span className="muted" style={{ flex: "0 0 auto" }}>{c.cached ? "cached" : `${c.model.replace("gemini-", "").replace("hyde/", "")} · ${((c.inTok + c.outTok) / 1000).toFixed(1)}k`}</span>
          </span>
        ))}
        <span className="row between s13 strong" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
          <span>{(tokens / 1000).toFixed(1)}k tokens{cost > 0 ? ` · ≈ ₹${cost.toFixed(2)} at Gemini list prices` : ""}</span>
          <span className="muted">₹0 free tier</span>
        </span>
        <span className="small muted">Built {l.builtAt ? shortDate(l.builtAt) : ""} · cached for everyone · numbers from Screener’s table of reported results, never generated.</span>
      </details>

      <Sheet open={ask} onClose={() => setAsk(false)} label="Questions to ask management">
        <div className="stack gap12">
          <span className="row between gap8">
            <span className="headline">Questions to ask management</span>
            <button className="btn ghost small" onClick={() => { navigator.clipboard?.writeText(l.questions.map((q, i) => `${i + 1}. ${q.text}`).join("\n")); setCopied(true); }}>
              {copied ? "Copied" : "Copy all"}
            </button>
          </span>
          {l.questions.map((q, i) => (
            <div key={i} className="stack gap4" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <span className={`small strong ${vcls(q.from)}`}>From a promise that was: {q.from.toLowerCase()}</span>
              <span className="s14" style={{ lineHeight: "21px" }}>“{q.text}”</span>
            </div>
          ))}
          <span className="small muted">Drafted by the model from the ledger only; each one traces to a quoted promise in the ledger.</span>
        </div>
      </Sheet>
    </div>
  );
}

/** Said vs reported for the metric management has guided on the most, call by call. */
function SaidVsReported({ metric, rows, onOpen }: { metric: string; rows: SaidRow[]; onOpen: (p: Promise_) => void }) {
  const said = rows.map((r) => r.saidNum);
  const rep = rows.map((r) => r.reportedNum);
  const nums = [...said, ...rep].filter((x): x is number => x != null);
  const chart = said.filter((x) => x != null).length >= 2;
  const repLine = rep.filter((v) => v != null).length >= 2;
  const W = 320, H = 86, padX = 18, padY = 16;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  const x = (i: number) => padX + (rows.length === 1 ? 0 : (i * (W - 2 * padX)) / (rows.length - 1));
  const y = (v: number) => (hi === lo ? H / 2 : H - padY - ((v - lo) / (hi - lo)) * (H - 2 * padY));
  const pts = (arr: (number | null)[]) => arr.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ");
  const cols = `minmax(0, 1.15fr) repeat(${rows.length}, minmax(0, 1fr))`;
  return (
    <section className="card big" style={{ gap: 12 }}>
      <span className="row between gap8" style={{ alignItems: "baseline" }}>
        <span style={{ fontSize: 15, fontWeight: 700, flex: "0 0 auto" }}>Said vs reported</span>
        <span className="small ink2" style={{ textAlign: "right" }}>{metric}</span>
      </span>
      <div style={{ display: "grid", gridTemplateColumns: cols, rowGap: 8, columnGap: 6, fontSize: 12.5, alignItems: "baseline" }}>
        <span className="ink2">Call</span>
        {rows.map((r) => <span key={r.call} className="ink2" style={{ textAlign: "right" }}>{r.call.replace(/ 20(\d\d)$/, " ’$1")}</span>)}
        <span style={{ fontWeight: 600 }}>They said</span>
        {rows.map((r) => (
          <button key={r.call} onClick={() => onOpen(r.p)} className="t-watch" style={{ textAlign: "right", background: "none", border: 0, padding: 0, font: "inherit", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>{r.said}</button>
        ))}
        <span style={{ fontWeight: 600 }}>Reported</span>
        {rows.map((r) => <span key={r.call} style={{ textAlign: "right", fontWeight: 600 }}>{r.reported}</span>)}
      </div>
      {chart && (
        <div className="stack gap6">
          <div role="img" aria-label={`Guided: ${rows.map((r) => r.said).join(", ")}. Reported: ${rows.map((r) => r.reported).join(", ")}`} style={{ background: "var(--ground)", borderRadius: 14 }}>
            <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden style={{ display: "block" }}>
              <polyline points={pts(said)} fill="none" stroke="var(--watch-solid)" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {repLine && <polyline points={pts(rep)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
            </svg>
          </div>
          <span className="row gap14 small ink2">
            <span className="row gap6"><svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke="var(--watch-solid)" strokeWidth="2.5" strokeDasharray="5 4" /></svg>guided</span>
            {repLine && <span className="row gap6"><svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke="var(--accent)" strokeWidth="2.5" /></svg>reported</span>}
          </span>
        </div>
      )}
      <span className="small muted">Tap a “they said” figure for the quote</span>
    </section>
  );
}

function Progress({ l, err }: { l: Ledger; err: string }) {
  const steps: { label: string; state: "ok" | "on" | "wait" | "bad" }[] = [
    { label: `Found ${l.transcripts.length} call transcripts on the exchange`, state: "ok" },
  ];
  let active = false;
  for (const t of l.transcripts) {
    const st = t.status === "done" ? "ok" : t.status === "failed" ? "bad" : !active ? ((active = true), "on") : "wait";
    steps.push({
      label:
        t.status === "done"
          ? `Read ${t.month} call (${t.pages} pages) · ${t.promises} promises, every quote checked`
          : t.status === "failed"
            ? `${t.month} call couldn’t be read — ${t.error}`
            : `Reading ${t.month} call…`,
      state: st as "ok" | "on" | "wait" | "bad",
    });
  }
  const allRead = l.transcripts.every((t) => t.status !== "pending");
  steps.push({ label: `Checking ${l.promises.length} promises against reported numbers…`, state: allRead ? (l.status === "ready" ? "ok" : "on") : "wait" });
  return (
    <div className="card big" style={{ gap: 12 }}>
      <span className="headline">Building the track record</span>
      {steps.map((s, i) => (
        <div key={i} className="step">
          <span className={`dot ${s.state === "ok" ? "ok" : s.state === "on" ? "on" : s.state === "bad" ? "bad" : ""}`} />
          <span className={s.state === "wait" ? "muted" : ""}>{s.label}</span>
        </div>
      ))}
      {err && <span className="small t-act">Stopped: {err}. Tap the tab again to resume.</span>}
      <span className="small muted">Each step is cached, so nothing is read twice.</span>
    </div>
  );
}
