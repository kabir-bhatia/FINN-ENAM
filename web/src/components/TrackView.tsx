"use client";
// Track record: did management do what it said? Built step by step with visible progress (A9),
// cached for everyone afterwards, with a cost receipt (A10).
import { useCallback, useEffect, useRef, useState } from "react";
import type { Bundle, Ledger, Promise_, Verdict } from "@/lib/types";
import { VERDICTS } from "@/lib/types";
import { getTrack, invalidate, postTrack } from "@/lib/client";
import { shortDate } from "@/lib/time";
import { Skeleton, useEvidence } from "./ui";

const vcls = (v?: Verdict) =>
  v === "Kept" ? "c-good" : v === "Missed" ? "c-act" : v === "Target changed" ? "c-watch" : "c-quiet";
const dotCls = (v?: Verdict) => `pdot v-${(v ?? "Too early").split(" ")[0]}`;

export default function TrackView({ b }: { b: Bundle }) {
  const [l, setL] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  const [all, setAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const ev = useEvidence();
  const started = useRef(false);

  useEffect(() => {
    getTrack(b.symbol)
      .then((d) => setL(d.status === "none" ? null : (d as Ledger)))
      .finally(() => setLoading(false));
  }, [b.symbol]);

  const build = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    setRunning(true);
    setErr("");
    try {
      let cur = await postTrack(b.symbol, { step: "discover" });
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
      <div className="card stack gap12">
        <span className="headline">Did {b.name.replace(/ Limited$/, "")} do what it said?</span>
        <span className="s14 ink2">
          FINN reads the last 4 earnings-call transcripts, lists every checkable promise with its exact quote and page,
          then checks each against the reported numbers. Primary sources only.
        </span>
        <span className="small muted">≈ 1 minute · flash-lite reads the calls, flash judges · about ₹0.3 at paid prices, ₹0 on the free tier · cached for everyone after</span>
        {l?.status === "building" && <span className="small t-watch">A previous build stopped part-way; it will resume where it left off.</span>}
        <button className="btn primary" onClick={build}>Build track record</button>
        {err && <span className="small t-act">{err}</span>}
      </div>
    );
  }

  if (l.status === "no-transcripts")
    return (
      <div className="card stack gap8">
        <span className="headline">No call transcripts found</span>
        <span className="s14 ink2">{l.note}</span>
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
  const shown = all ? ps : ps.slice(0, 6);
  return (
    <div className="stack gap14">
      <section className="card stack gap12">
        <span className="small muted">{done.length} calls · {done.length ? `${done[done.length - 1].month} – ${done[0].month}` : ""}</span>
        <span className="headline" style={{ fontSize: 18 }}>
          {l.promises.length ? `Kept ${counts.Kept} of the ${due} promises that are due` : "No checkable promises found"}
        </span>
        {l.promises.length > 0 && (
          <>
            <span className="pdots" role="img" aria-label="Promise scorecard">
              {ps.map((p) => <span key={p.id} className={dotCls(p.verdict)} title={p.verdict} />)}
            </span>
            <span className="row gap10 s13 ink2" style={{ flexWrap: "wrap" }}>
              {VERDICTS.filter((v) => counts[v]).map((v) => (
                <span key={v} className="row gap4"><span className={dotCls(v)} style={{ width: 10, height: 10 }} /><span className="mono">{counts[v]}</span> {v.toLowerCase()}</span>
              ))}
            </span>
          </>
        )}
        {l.note && <span className="s14 ink2">{l.note}</span>}
        {done.length < l.transcripts.length && (
          <span className="small t-watch">{l.transcripts.length - done.length} transcript(s) couldn’t be read: {l.transcripts.filter((t) => t.status === "failed").map((t) => `${t.month} (${t.error})`).join("; ")}</span>
        )}
      </section>

      {l.questions.length > 0 && (
        <section className="card stack gap10">
          <span className="row between">
            <span className="label">Questions to ask management</span>
            <button className="btn ghost small" onClick={() => { navigator.clipboard?.writeText(l.questions.map((q, i) => `${i + 1}. ${q.text}`).join("\n")); setCopied(true); }}>
              {copied ? "Copied" : "Copy all"}
            </button>
          </span>
          {l.questions.map((q, i) => (
            <div key={i} className="stack gap4" style={{ borderTop: i ? "1px solid var(--line)" : 0, paddingTop: i ? 10 : 0 }}>
              <span className="label" style={{ fontSize: 10 }}>From: {q.from}</span>
              <span className="s14">“{q.text}”</span>
            </div>
          ))}
        </section>
      )}

      {shown.map((p) => (
        <PromiseRow key={p.id} p={p} l={l} onEvidence={() => {
          const t = l.transcripts.find((x) => x.month === p.call);
          ev({
            company: l.name,
            title: `${l.name.replace(/ Limited$/, "")} — earnings call transcript (${p.call})`,
            detail: `Exchange filing · ${t?.pages ?? "?"} pages · quoted from page ${p.page}`,
            quote: p.quote,
            quoteNote: `Quote found word-for-word on p.${p.page} — checked by code, not by the model`,
            readBy: `Extracted by flash-lite · verdict by flash from the ledger + reported numbers only`,
            url: t?.url,
            page: p.page,
          });
        }} />
      ))}
      {ps.length > 6 && (
        <button className="btn" style={{ height: 44, justifyContent: "center" }} onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `See all ${ps.length} promises`}
        </button>
      )}

      <section className="card stack gap6">
        <span className="label">Cost receipt</span>
        {l.costs.map((c, i) => (
          <span key={i} className="row between small gap8">
            <span className="ink2" style={{ minWidth: 0 }}>{c.step}</span>
            <span className="mono muted" style={{ flex: "0 0 auto" }}>{c.cached ? "cached" : `${c.model.replace("gemini-", "")} · ${((c.inTok + c.outTok) / 1000).toFixed(1)}k`}</span>
          </span>
        ))}
        <span className="row between s13 strong" style={{ borderTop: "1px solid var(--line)", paddingTop: 6 }}>
          <span>{(tokens / 1000).toFixed(1)}k tokens · ≈ ₹{cost.toFixed(2)} at paid prices</span>
          <span className="muted">₹0 free tier</span>
        </span>
        <span className="small muted">Built {l.builtAt ? shortDate(l.builtAt) : ""} · cached for everyone · numbers from Screener’s table of reported results, never generated.</span>
      </section>
    </div>
  );
}

function PromiseRow({ p, onEvidence }: { p: Promise_; l: Ledger; onEvidence: () => void }) {
  return (
    <article className="card stack gap8">
      <span className="row between gap8">
        <span className="s13 strong" style={{ minWidth: 0 }}>{p.metric}</span>
        <span className={`chip ${vcls(p.verdict)}`}>{p.verdict}</span>
      </span>
      <span className="s14">
        <span className="mono">{p.target}</span>
        {p.horizon && <span className="muted"> · by {p.horizon}</span>}
      </span>
      <button className="s14 ink2" style={{ background: "none", border: 0, padding: 0, textAlign: "left", lineHeight: "21px" }} onClick={onEvidence}>
        “<span className="mark">{p.quote}</span>” <span className="small muted" style={{ textDecoration: "underline" }}>{p.call} call, p.{p.page}</span>
      </button>
      {p.reason && (
        <span className="inset s13">
          {p.actual && <span className="mono strong">{p.actual} · </span>}
          {p.reason}
        </span>
      )}
    </article>
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
    <div className="card stack gap12">
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
