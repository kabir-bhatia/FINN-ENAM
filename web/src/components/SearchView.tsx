"use client";
// Search (centre button): any NSE company → its page. Results come from Screener's search,
// NSE-listed only. Nothing is suggested that the search did not return.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sectorOf } from "@/lib/home";
import { useBundles, usePortfolio } from "@/lib/client";
import { short } from "./cards";
import { Icon } from "./ui";

export default function SearchView() {
  const [portfolio, setPortfolio, hydrated] = usePortfolio();
  const { bundles } = useBundles(portfolio, hydrated);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ symbol: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState("");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);

  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) return;
    const id = setTimeout(() => {
      setBusy(true);
      fetch(`/api/search?q=${encodeURIComponent(t)}`)
        .then((r) => r.json())
        .then((d) => setHits(Array.isArray(d) ? d : []))
        .catch(() => setHits([]))
        .finally(() => {
          setBusy(false);
          setSearched(t);
        });
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  const typed = q.trim().length >= 2;
  const add = (sym: string) => {
    if (!portfolio.includes(sym)) setPortfolio([...portfolio, sym]);
    router.push(`/c/${sym}`);
  };

  return (
    <>
      <div style={{ height: 20 }} />
      <div className="stack gap14">
        <h1 className="title">Search</h1>
        <label className="row" style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 18, color: "var(--ink3)", display: "flex" }}>{Icon.search}</span>
          <input
            ref={input}
            className="input"
            style={{ paddingLeft: 46 }}
            placeholder="Any NSE company or ticker"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search any NSE company"
            autoComplete="off"
            autoCapitalize="characters"
            enterKeyHint="search"
          />
        </label>

        {typed && busy && !hits.length && <span className="s13 muted">Searching…</span>}
        {typed && hits.length > 0 && (
          <section className="card flush">
            {hits.map((h) => (
              <div key={h.symbol} className="rowlink" style={{ alignItems: "center" }}>
                <Link href={`/c/${h.symbol}`} className="stack" style={{ flex: 1, gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 600 }}>{h.name}</span>
                  <span className="small muted">{h.symbol} · NSE</span>
                </Link>
                {portfolio.includes(h.symbol) ? (
                  <span className="chip c-good">✓ In portfolio</span>
                ) : (
                  <button className="btn" onClick={() => add(h.symbol)}>Add</button>
                )}
              </div>
            ))}
          </section>
        )}
        {typed && !busy && searched === q.trim() && hits.length === 0 && (
          <div className="card s14 ink2">No NSE-listed company matches “{q.trim()}”. Try the ticker (for example TITAN) or the first word of the name.</div>
        )}

        {!typed && (
          <>
            <span className="s14 ink2">Open any NSE-listed company: its filings, results and whether management kept its word. A new company takes about 5–8 seconds the first time.</span>
            {bundles.length > 0 && (
              <>
                <span className="sect" style={{ marginTop: 6 }}>In your portfolio</span>
                <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                  {[...bundles].sort((a, b) => a.name.localeCompare(b.name)).map((b) => (
                    <Link key={b.symbol} href={`/c/${b.symbol}`} className="pill" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }} title={sectorOf(b.symbol, b.industry)}>
                      {short(b.name)}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
