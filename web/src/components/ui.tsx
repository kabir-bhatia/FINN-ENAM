"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { applyTheme, useSettings } from "@/lib/client";

// ---------- icons (hand-drawn 24px strokes, one family) ----------
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
export const Icon = {
  info: <svg width="22" height="22" viewBox="0 0 24 24" {...P} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></svg>,
  gear: <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={1.6} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  today: <svg width="22" height="22" viewBox="0 0 24 24" {...P} aria-hidden><path d="M4 13h4l2 3h4l2-3h4" /><path d="M5.5 5h13l1.5 8v6H4v-6z" /></svg>,
  companies: <svg width="22" height="22" viewBox="0 0 24 24" {...P} aria-hidden><path d="M4 20V8l6-4v16" /><path d="M10 20V10l10 4v6" /><path d="M3 20h18" /></svg>,
  bell: <svg width="22" height="22" viewBox="0 0 24 24" {...P} aria-hidden><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>,
  bellSm: <svg width="16" height="16" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>,
  chevR: <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M9 6l6 6-6 6" /></svg>,
  chevL: <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M15 6l-6 6 6 6" /></svg>,
  chevD: <svg width="14" height="14" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M6 9l6 6 6-6" /></svg>,
  check: <svg width="28" height="28" viewBox="0 0 24 24" {...P} stroke="var(--good)" strokeWidth={2} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16.5 9.5" /></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  doc: <svg width="18" height="18" viewBox="0 0 24 24" {...P} aria-hidden><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></svg>,
};

// ---------- theme sync ----------
export function ThemeSync() {
  const [s] = useSettings();
  useEffect(() => applyTheme(s.theme), [s.theme]);
  return null;
}

// ---------- tab bar ----------
export function TabBar() {
  const path = usePathname();
  const tabs = [
    { href: "/", label: "Today", icon: Icon.today, on: path === "/" },
    { href: "/companies", label: "Companies", icon: Icon.companies, on: path.startsWith("/companies") || path.startsWith("/c/") },
    { href: "/alerts", label: "Alerts", icon: Icon.bell, on: path.startsWith("/alerts") },
  ];
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="inner">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.on ? "page" : undefined}>
            {t.icon}
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function TopBar({ back }: { back?: { label: string; href?: string } }) {
  const router = useRouter();
  return (
    <div className="topbar">
      {back ? (
        <button className="back" onClick={() => (back.href ? router.push(back.href) : router.back())}>
          {Icon.chevL}
          {back.label}
        </button>
      ) : (
        <span className="brand">FINN</span>
      )}
      <span className="row" style={{ marginRight: -10 }}>
        <Link className="iconbtn" href="/how" aria-label="How FINN thinks">{Icon.info}</Link>
        <Link className="iconbtn" href="/settings" aria-label="Settings">{Icon.gear}</Link>
      </span>
    </div>
  );
}

// ---------- bottom sheet (drag down to close) ----------
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [dy, setDy] = useState(0);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        ref={ref}
        className="sheet"
        role="dialog"
        aria-label={label}
        style={dy ? { transform: `translateY(${dy}px)`, transition: "none" } : undefined}
        onTouchStart={(e) => {
          if ((ref.current?.scrollTop ?? 0) <= 0) start.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (start.current == null) return;
          setDy(Math.max(0, e.touches[0].clientY - start.current));
        }}
        onTouchEnd={() => {
          if (dy > 90) onClose();
          setDy(0);
          start.current = null;
        }}
      >
        <div className="grab" />
        {children}
      </div>
    </>
  );
}

// ---------- evidence sheet (A18): every number and quote opens its source ----------
export interface Evidence {
  company: string;
  title: string; // document name
  detail: string; // "Exchange filing · filed 5 Nov 18:36" / "page 7 of 18"
  quote?: string;
  quoteNote?: string; // "Quote found word-for-word on p.7"
  numbers?: { label: string; value: string }[];
  formula?: string;
  readBy?: string; // "Read by gemini-3.5-flash-lite · checked by code"
  url?: string;
  page?: number;
  extra?: { label: string; url: string }[];
}

const EvCtx = createContext<(e: Evidence) => void>(() => {});
export const useEvidence = () => useContext(EvCtx);

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [ev, setEv] = useState<Evidence | null>(null);
  const [copied, setCopied] = useState(false);
  const href = ev?.url ? (ev.page ? `${ev.url}#page=${ev.page}` : ev.url) : undefined;
  return (
    <EvCtx.Provider value={(e) => { setCopied(false); setEv(e); }}>
      {children}
      <Sheet open={!!ev} onClose={() => setEv(null)} label="Evidence">
        {ev && (
          <div className="stack gap14">
            <div className="stack gap4">
              <span className="label">Source · {ev.company}</span>
              <div className="row gap10" style={{ alignItems: "flex-start" }}>
                <span className="muted" style={{ marginTop: 2 }}>{Icon.doc}</span>
                <span className="stack gap4">
                  <span className="strong">{ev.title}</span>
                  <span className="small muted">{ev.detail}</span>
                </span>
              </div>
            </div>
            {ev.quote && (
              <div className="stack gap6">
                <p style={{ margin: 0, fontSize: 15, lineHeight: "23px" }}>
                  “<span className="mark">{ev.quote}</span>”
                </p>
                {ev.quoteNote && <span className="small t-good strong">✓ {ev.quoteNote}</span>}
              </div>
            )}
            {ev.numbers && (
              <div className="inset stack gap6">
                {ev.numbers.map((n) => (
                  <span key={n.label} className="row between s14">
                    <span className="ink2">{n.label}</span>
                    <span className="mono">{n.value}</span>
                  </span>
                ))}
                {ev.formula && <span className="small muted">Computed by code: {ev.formula}</span>}
              </div>
            )}
            {ev.readBy && <span className="small muted">{ev.readBy}</span>}
            <div className="stack gap8">
              {href && (
                <a className="btn primary" href={href} target="_blank" rel="noopener noreferrer">
                  Open document{ev.page ? ` at p.${ev.page}` : ""}
                </a>
              )}
              {ev.quote && (
                <button
                  className="btn"
                  style={{ height: 44, justifyContent: "center" }}
                  onClick={() => {
                    navigator.clipboard?.writeText(`“${ev.quote}” — ${ev.title}${ev.page ? `, p.${ev.page}` : ""}`);
                    setCopied(true);
                  }}
                >
                  {copied ? "Copied" : "Copy quote with citation"}
                </button>
              )}
              {ev.extra?.map((x) => (
                <a key={x.url} className="btn" style={{ height: 44, justifyContent: "center" }} href={x.url} target="_blank" rel="noopener noreferrer">
                  {x.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </Sheet>
    </EvCtx.Provider>
  );
}

export function Toast({ text, action, onAction, onDone }: { text: string; action?: string; onAction?: () => void; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast" role="status">
      <span>{text}</span>
      {action && <button onClick={onAction}>{action}</button>}
    </div>
  );
}

export function Skeleton({ h = 16, w = "100%" }: { h?: number; w?: number | string }) {
  return <span className="skel" style={{ display: "block", height: h, width: w }} />;
}

export function Footer() {
  return (
    <p className="small muted" style={{ textAlign: "center", margin: "28px 0 8px" }}>
      Research aid, not investment advice. Sources: NSE filings, company call transcripts, Screener’s table of reported results.
    </p>
  );
}
