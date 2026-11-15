"use client";
// Today (04 doc §11 v3): thesis board first (unit = company, not filing), then what happened,
// then a finite ending — routine filings collapsed, "You're caught up", next brief time.
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildToday, routineGroups, windowStart, WINDOW_LABEL } from "@/lib/digest";
import { useBundles, usePortfolio, useRules, useSeen, useSettings, useSince } from "@/lib/client";
import type { WindowKey } from "@/lib/types";
import { anchor, nextBrief } from "@/lib/time";
import { AlertCard, FilingCard, filingEvidence } from "./cards";
import { Footer, Icon, Sheet, Skeleton, TopBar, useEvidence } from "./ui";

export default function TodayView() {
  const [portfolio, , hydrated] = usePortfolio();
  const [rules] = useRules();
  const [settings, setSettings] = useSettings();
  const [seen] = useSeen();
  const since = useSince();
  const [win, setWin] = useState<WindowKey | null>(null);
  const w = win ?? settings.window;
  const [sheet, setSheet] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const ev = useEvidence();
  const { bundles, failed, loading, error } = useBundles(portfolio, hydrated);
  const from = windowStart(w, since);
  const today = useMemo(() => buildToday(bundles, rules, from), [bundles, rules, from]);
  const total = portfolio.length;
  const dataAsOf = bundles.length ? bundles.map((b) => b.updatedAt).sort()[0] : null;
  const winText = w === "since" ? `Since you last looked · ${anchor(since)}` : WINDOW_LABEL[w];

  return (
    <>
      <TopBar />
      <div className="stack gap14">
        <div className="stack gap4">
          <h1 className="title">Today</h1>
          <button className="sub row gap4" style={{ background: "none", border: 0, padding: 0, alignSelf: "flex-start", minHeight: 28 }} onClick={() => setSheet(true)}>
            {winText}
            {!loading && ` · ${today.filingsRead} filings read`} {Icon.chevD}
          </button>
        </div>

        {loading && (
          <div className="card stack gap10">
            <Skeleton h={12} w={140} />
            <Skeleton h={20} w="80%" />
            <Skeleton h={8} />
            <span className="small muted">Reading filings for {total} companies…</span>
          </div>
        )}
        {error && <div className="card s14">Couldn’t load your companies ({error}). Pull to refresh or try again in a minute.</div>}

        {!loading && !error && total === 0 && (
          <div className="card stack gap10">
            <span className="headline">Your portfolio is empty</span>
            <span className="s14 ink2">Add companies to see what changed for them.</span>
            <Link className="btn primary" href="/companies">Add companies</Link>
          </div>
        )}

        {!loading && bundles.length > 0 && (
          <>
            {/* Thesis board */}
            <section className="card flush" aria-label="Thesis board">
              <div className="stack gap10" style={{ padding: "14px 14px 12px" }}>
                <span className="label">Your {bundles.length} companies</span>
                <span style={{ fontSize: 17, lineHeight: "23px", fontWeight: 600 }}>
                  {today.counts.challenged} challenged · {today.counts.look} worth a look · {today.counts.unchanged} unchanged
                </span>
                <span className="bar" role="img" aria-label={`${today.counts.challenged} challenged, ${today.counts.look} worth a look, ${today.counts.unchanged} unchanged`}>
                  {today.counts.challenged > 0 && <span style={{ flex: today.counts.challenged, background: "var(--act)" }} />}
                  {today.counts.look > 0 && <span style={{ flex: today.counts.look, background: "var(--watch)" }} />}
                  {today.counts.unchanged > 0 && <span style={{ flex: today.counts.unchanged, background: "var(--quietbg)" }} />}
                </span>
              </div>
              {today.days
                .filter((d) => d.state !== "unchanged")
                .map((d) => (
                  <Link key={d.b.symbol} href={`/c/${d.b.symbol}?from=today`} className="rowlink">
                    <span className={`chip ${d.state === "challenged" ? "c-act" : "c-watch"}`} style={{ marginTop: 2 }}>
                      {d.state === "challenged" ? "Challenged" : "Look"}
                    </span>
                    <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                      <span className="strong">{d.b.name.replace(/ Limited$/, "")}</span>
                      <span className="s13 ink2" style={{ lineHeight: "18px" }}>{d.reason}</span>
                    </span>
                  </Link>
                ))}
              {today.counts.unchanged > 0 && (
                <Link href="/companies" className="rowlink between ink2 s14" style={{ alignItems: "center" }}>
                  <span>{today.counts.unchanged} unchanged — every filing checked</span>
                  {Icon.chevR}
                </Link>
              )}
            </section>

            {today.cards.length > 0 && <span className="label" style={{ marginTop: 6 }}>What happened</span>}
            {today.cards.map((c) =>
              c.kind === "alert" ? (
                <AlertCard key={`m${c.day.b.symbol}${c.move.d}`} day={c.day} move={c.move} seen={!!seen[`m:${c.day.b.symbol}:${c.move.d}`]} />
              ) : (
                <FilingCard key={c.filing.id} day={c.day} f={c.filing} seen={!!seen[`f:${c.filing.id}`]} />
              ),
            )}

            {today.cards.length === 0 && (
              <div className="card stack gap10">
                <span className="headline">Nothing material {w === "since" ? "since you last looked" : `in the ${WINDOW_LABEL[w].toLowerCase()}`}</span>
                <span className="s14 ink2">{today.filingsRead} filings checked; all routine. Your rules didn’t fire.</span>
                {w !== "30d" && (
                  <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setWin(w === "7d" ? "30d" : "7d")}>
                    Show {w === "7d" ? "last 30 days" : "last 7 days"}
                  </button>
                )}
              </div>
            )}

            {today.routine.length > 0 && (
              <section className="card" style={{ padding: "12px 14px" }}>
                <button className="row between" style={{ background: "none", border: 0, padding: 0, textAlign: "left", minHeight: 40 }} onClick={() => setShowRoutine(!showRoutine)} aria-expanded={showRoutine}>
                  <span className="stack" style={{ gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{today.routine.length} routine filings</span>
                    <span className="small muted">{routineGroups(today.routine).slice(0, 3).map((g) => g.label).join(", ")}</span>
                  </span>
                  <span className="s14 strong">{showRoutine ? "Hide" : "Show"}</span>
                </button>
                {showRoutine && (
                  <div className="stack">
                    {routineGroups(today.routine).map((g) => (
                      <span key={g.label} className="row between s13 ink2" style={{ padding: "4px 0" }}>
                        <span>{g.label}</span>
                        <span className="mono">{g.n}</span>
                      </span>
                    ))}
                    <div className="stack" style={{ marginTop: 8 }}>
                      {today.routine.slice(0, 60).map((f) => {
                        const b = bundles.find((x) => x.symbol === f.symbol)!;
                        return (
                          <button key={f.id} className="row gap10 s13" style={{ background: "none", border: 0, borderTop: "1px solid var(--line)", padding: "9px 0", textAlign: "left", alignItems: "flex-start" }} onClick={() => ev(filingEvidence(b, f))}>
                            <span className="mono small muted" style={{ width: 82, flex: "0 0 auto" }}>{f.symbol}</span>
                            <span className="ink2">{f.headline}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {failed.length > 0 && (
              <div className="card s13 ink2">
                Couldn’t read {failed.map((f) => f.symbol).join(", ")} right now — {failed[0].error}. They’ll be retried on the next refresh.
              </div>
            )}

            <div className="stack" style={{ alignItems: "center", gap: 6, padding: "22px 0 4px", textAlign: "center" }}>
              {Icon.check}
              <span style={{ fontSize: 17, fontWeight: 600 }}>You’re caught up</span>
              <span className="s13 muted">
                Next brief {nextBrief(settings.briefs, settings.weekdaysOnly)}
                {dataAsOf && ` · data as of ${anchor(dataAsOf)} IST`}
              </span>
            </div>
          </>
        )}
        <Footer />
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} label="Time window">
        <div className="stack gap10">
          <span className="headline">Show filings from</span>
          {(["since", "24h", "7d", "30d"] as WindowKey[]).map((k) => (
            <button
              key={k}
              className="row between"
              style={{ height: 52, border: 0, borderTop: "1px solid var(--line)", background: "none", fontSize: 16, textAlign: "left" }}
              onClick={() => {
                setWin(k);
                setSheet(false);
              }}
            >
              <span>
                {WINDOW_LABEL[k]}
                {k === "since" && <span className="s13 muted"> · {anchor(since)}</span>}
              </span>
              {w === k && <span className="strong">✓</span>}
            </button>
          ))}
          <button className="btn" style={{ height: 44, justifyContent: "center" }} onClick={() => { setSettings({ ...settings, window: w }); setSheet(false); }}>
            Make “{WINDOW_LABEL[w]}” my default
          </button>
          <span className="small muted">All windows are in IST. Markets closed at weekends, so “last 24 hours” on a Sunday is usually empty.</span>
        </div>
      </Sheet>
    </>
  );
}
