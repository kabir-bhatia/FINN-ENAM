"use client";
// Home (04 doc §13 "Clear Day"): a portfolio summary that is alive every day — state ring,
// three stats, sector mix — then one list of what needs you, what is worth knowing, what is coming up,
// and a finite ending. Every figure is counted from real filings; blocks without data are hidden.
import Link from "next/link";
import { useMemo, useState } from "react";
import { buildToday, routineGroups, tierOf, windowStart, WINDOW_LABEL, type Card } from "@/lib/digest";
import { dayLabel, portfolioEvents, promisesKept, SECTOR_COLORS, sectorMix, type PortfolioEvent } from "@/lib/home";
import { useBundles, usePortfolio, useRules, useSeen, useSettings, useSince } from "@/lib/client";
import type { WindowKey } from "@/lib/types";
import { anchor } from "@/lib/time";
import { filingEvidence, NeedRow } from "./cards";
import InstallCard from "./InstallCard";
import { Footer, Icon, Ring, Sheet, Skeleton, useEvidence } from "./ui";


function greeting(now = Date.now()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date(now)));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
const longDate = (now = Date.now()) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long" }).format(new Date(now));

export default function HomeView() {
  const [portfolio, , hydrated] = usePortfolio();
  const [rules] = useRules();
  const [settings, setSettings] = useSettings();
  const [seen] = useSeen();
  const since = useSince();
  const [win, setWin] = useState<WindowKey | null>(null);
  const w = win ?? settings.window;
  const [sheet, setSheet] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const [allAttn, setAllAttn] = useState(false);
  const [allKnow, setAllKnow] = useState(false);
  const ev = useEvidence();
  const { bundles, failed, loading, error } = useBundles(portfolio, hydrated);
  const from = windowStart(w, since);
  const today = useMemo(() => buildToday(bundles, rules, from), [bundles, rules, from]);
  const total = portfolio.length;
  const dataAsOf = bundles.length ? bundles.map((b) => b.updatedAt).sort()[0] : null;
  const winShort = w === "since" ? `since ${anchor(since)}` : WINDOW_LABEL[w].toLowerCase();
  const winPhrase = w === "since" ? `since ${anchor(since)}` : `in the ${WINDOW_LABEL[w].toLowerCase()}`;

  const attention = today.cards.filter((c) => c.kind === "alert" || tierOf(c.filing, rules) === "act");
  const know = today.cards.filter((c) => c.kind === "filing" && tierOf(c.filing, rules) !== "act") as Extract<Card, { kind: "filing" }>[];
  const kept = useMemo(() => promisesKept(bundles), [bundles]);
  const mix = useMemo(() => sectorMix(bundles), [bundles]);
  const cal = useMemo(() => portfolioEvents(bundles), [bundles]);
  const govFlags = today.days.reduce((s, d) => s + d.items.filter((f) => f.category === "governance").length, 0);
  const c = today.counts;

  // ----- coming up: next two dated groups -----
  const groups: { d: string; kind: string; items: PortfolioEvent[] }[] = [];
  for (const e of cal.upcoming) {
    const g = groups.find((x) => x.d === e.d && x.kind === e.kind);
    if (g) g.items.push(e);
    else groups.push({ d: e.d, kind: e.kind, items: [e] });
  }

  return (
    <>
      <div className="row between" style={{ padding: "20px 0 16px" }}>
        <span className="stack" style={{ gap: 2 }}>
          <span className="s13 ink2">{longDate()}</span>
          <h1 className="title" style={{ fontSize: 24, lineHeight: "30px" }}>{greeting()}</h1>
        </span>
        <Link className="roundbtn" href="/settings" aria-label="Settings">{Icon.sliders}</Link>
      </div>
      <div className="stack gap16">
        {loading && (
          <div className="card big">
            <Skeleton h={18} w={140} />
            <div className="row gap16"><Skeleton h={124} w={124} /><div className="stack gap10" style={{ flex: 1 }}><Skeleton /><Skeleton /><Skeleton /></div></div>
            <span className="small muted">Reading filings for {total} companies…</span>
          </div>
        )}
        {error && <div className="card s14">Couldn’t load your companies ({error}). Try again in a minute.</div>}

        {!loading && !error && total === 0 && (
          <div className="card big">
            <span className="headline">Your portfolio is empty</span>
            <span className="s14 ink2">Add companies to see what changed for them.</span>
            <Link className="btn primary" href="/search">Search any NSE company</Link>
          </div>
        )}

        {!loading && bundles.length > 0 && (
          <>
            {/* Portfolio card */}
            <section className="card big" aria-label="Your portfolio">
              <div className="row between" style={{ alignItems: "baseline" }}>
                <span className="sect">Your portfolio</span>
                <button className="row gap4 small ink2" style={{ background: "none", border: 0, padding: 0, minHeight: 28 }} onClick={() => setSheet(true)} aria-label="Change time window">
                  {winShort} {Icon.chevD}
                </button>
              </div>
              <div className="row" style={{ gap: 18 }}>
                <Ring
                  size={124}
                  stroke={13}
                  label={`${c.unchanged} unchanged, ${c.look} worth a look, ${c.challenged} challenged`}
                  segments={[
                    { value: c.unchanged, color: "var(--ink)" },
                    { value: c.look, color: "var(--watch-solid)" },
                    { value: c.challenged, color: "var(--act-solid)" },
                  ]}
                >
                  <span style={{ fontSize: 26, fontWeight: 700, lineHeight: "28px" }}>{bundles.length}</span>
                  <span style={{ fontSize: 11 }} className="ink2">companies</span>
                </Ring>
                <div className="stack gap10" style={{ flex: 1, minWidth: 0 }}>
                  {[
                    { k: "Unchanged", v: c.unchanged, col: "var(--ink)" },
                    { k: "Worth a look", v: c.look, col: "var(--watch-solid)" },
                    { k: "Challenged", v: c.challenged, col: "var(--act-solid)" },
                  ].map((x) => (
                    <Link key={x.k} href="/companies" className="row gap8 s14">
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: x.col, flex: "0 0 auto" }} />
                      <span style={{ flex: 1 }}>{x.k}</span>
                      <b>{x.v}</b>
                    </Link>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${kept ? 3 : 2}, minmax(0, 1fr))`, gap: 8 }}>
                {kept && (
                  <Link href="/companies" className="tile" title={`${kept.kept} of ${kept.due} due promises kept, across ${kept.companies} track records`}>
                    <span className="n t-good">{kept.pct}%</span>
                    <span className="k">promises kept</span>
                  </Link>
                )}
                <div className="tile">
                  <span className={`n ${govFlags ? "t-act" : ""}`}>{govFlags}</span>
                  <span className="k">governance flag{govFlags === 1 ? "" : "s"}</span>
                </div>
                <div className="tile">
                  <span className="n">{today.filingsRead}</span>
                  <span className="k">filings read</span>
                </div>
              </div>
              {mix.length > 0 && (
                <div className="stack gap8">
                  <span className="label">Sectors</span>
                  <span className="bar" role="img" aria-label={mix.map((m) => `${m.name} ${m.pct}%`).join(", ")}>
                    {mix.map((m, i) => <span key={m.name} style={{ flex: `${m.n} 1 0`, background: m.name === "Other" ? "var(--quiet-solid)" : SECTOR_COLORS[i] }} />)}
                  </span>
                  <span className="row ink2" style={{ flexWrap: "wrap", gap: "4px 12px", fontSize: 11 }}>
                    {mix.map((m, i) => (
                      <span key={m.name} className="row gap4"><span style={{ width: 8, height: 8, borderRadius: 4, background: m.name === "Other" ? "var(--quiet-solid)" : SECTOR_COLORS[i] }} />{m.name} {m.pct}%</span>
                    ))}
                  </span>
                </div>
              )}
            </section>

            <InstallCard />

            {/* Needs you: the old brief and the attention cards merged into one list (declutter plan) */}
            <div className="row between" style={{ alignItems: "baseline" }}>
              <span className="sect">Needs you{attention.length ? ` · ${attention.length}` : ""}</span>
              {attention.length > 4 && <button className="link" onClick={() => setAllAttn(!allAttn)}>{allAttn ? "Show fewer" : `See all ${attention.length}`}</button>}
            </div>
            {attention.length > 0 && (
              <section className="card flush">
                {(allAttn ? attention : attention.slice(0, 4)).map((card) =>
                  card.kind === "alert" ? (
                    <NeedRow key={`m${card.day.b.symbol}${card.move.d}`} day={card.day} move={card.move} seen={!!seen[`m:${card.day.b.symbol}:${card.move.d}`]} />
                  ) : (
                    <NeedRow key={card.filing.id} day={card.day} f={card.filing} seen={!!seen[`f:${card.filing.id}`]} />
                  ),
                )}
              </section>
            )}
            {attention.length === 0 && (
              <div className="card" style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                <span className="icontile c-good" aria-hidden>{Icon.check}</span>
                <span className="stack gap6" style={{ flex: 1 }}>
                  <span className="headline" style={{ fontSize: 15 }}>Nothing needs you {winPhrase}</span>
                  <span className="s13 ink2">{today.filingsRead} filings checked · none of your rules fired</span>
                  {w !== "30d" && (
                    <button className="link" style={{ alignSelf: "flex-start" }} onClick={() => setWin(w === "7d" ? "30d" : "7d")}>
                      Look back {w === "7d" ? "30 days" : "7 days"} ›
                    </button>
                  )}
                </span>
              </div>
            )}

            {know.length > 0 && (
              <>
                <div className="row between" style={{ alignItems: "baseline" }}>
                  <span className="sect">Worth knowing</span>
                  {know.length > 3 && <button className="link" onClick={() => setAllKnow(!allKnow)}>{allKnow ? "Show fewer" : `See all ${know.length}`}</button>}
                </div>
                <section className="card flush">
                  {(allKnow ? know : know.slice(0, 3)).map(({ day, filing: f }) => (
                    <NeedRow key={f.id} day={day} f={f} seen={!!seen[`f:${f.id}`]} onOpen={() => ev(filingEvidence(day.b, f))} />
                  ))}
                </section>
              </>
            )}

            {/* Coming up */}
            {cal.loaded && (
              <>
                <div className="row between" style={{ alignItems: "baseline" }}>
                  <span className="sect">Coming up</span>
                  <Link className="link" href="/calendar">Calendar ›</Link>
                </div>
                {groups.length > 0 ? (
                  <div className="row gap10" style={{ alignItems: "stretch" }}>
                    {groups.slice(0, 2).map((g, i) => (
                      <Link key={g.d + g.kind} href="/calendar" className="stack" style={{ flex: "1 1 0", minWidth: 0, gap: 2, borderRadius: 18, padding: "12px 14px", background: i === 0 ? "var(--hero)" : "var(--surface)", color: i === 0 ? "var(--hero-ink)" : "var(--ink)", boxShadow: i === 0 ? "none" : "var(--shadow)" }}>
                        <span style={{ fontSize: 11, opacity: i === 0 ? 0.75 : 1 }} className={i === 0 ? "" : "ink2"}>{dayLabel(g.d)}</span>
                        <span className="s14" style={{ fontWeight: 600 }}>{g.kind} · {g.items.length === 1 ? g.items[0].name : `${g.items.length} companies`}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link href="/calendar" className="card s14 ink2">
                    No dates announced yet
                  </Link>
                )}
              </>
            )}

            {/* Routine, collapsed */}
            {today.routine.length > 0 && (
              <section className="card">
                <button className="row between" style={{ background: "none", border: 0, padding: 0, textAlign: "left", minHeight: 40 }} onClick={() => setShowRoutine(!showRoutine)} aria-expanded={showRoutine}>
                  <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{today.routine.length} routine filings</span>
                    {!showRoutine && <span className="small muted">{routineGroups(today.routine).slice(0, 3).map((g) => g.label).join(", ")}</span>}
                  </span>
                  <span className="link">{showRoutine ? "Hide" : "Show"}</span>
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
                            <span className="small muted strong" style={{ width: 86, flex: "0 0 auto", overflow: "hidden", textOverflow: "ellipsis" }}>{f.symbol}</span>
                            <span className="ink2 clamp2">{f.headline}</span>
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

            <div className="stack" style={{ alignItems: "center", gap: 6, padding: "14px 0 4px", textAlign: "center" }}>
              {Icon.check}
              <span style={{ fontSize: 17, fontWeight: 700 }}>You’re caught up</span>
              <span className="s13 muted">
                {dataAsOf && `Data as of ${anchor(dataAsOf)} IST`}
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
              {w === k && <span className="strong t-good">✓</span>}
            </button>
          ))}
          <button className="btn" style={{ height: 44, justifyContent: "center" }} onClick={() => { setSettings({ ...settings, window: w }); setSheet(false); }}>
            Make “{WINDOW_LABEL[w]}” my default
          </button>
          <span className="small muted">All windows are in IST. Markets are closed at weekends, so “last 24 hours” on a Sunday is usually empty.</span>
        </div>
      </Sheet>
    </>
  );
}
