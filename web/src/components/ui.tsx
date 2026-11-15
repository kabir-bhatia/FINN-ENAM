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
  home: <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden><path d="M4 11l8-6.5 8 6.5v8.5h-5.5v-5.5h-5V19.5H4z" /></svg>,
  homeOn: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z" /></svg>,
  companies: <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  calendar: <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>,
  searchLg: <svg width="24" height="24" viewBox="0 0 24 24" {...P} strokeWidth={2.2} aria-hidden><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></svg>,
  sliders: <svg width="20" height="20" viewBox="0 0 24 24" {...P} strokeWidth={1.8} aria-hidden><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /><path d="M12 9v4M12 16v.01" /></svg>,
  chart: <svg width="20" height="20" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" /></svg>,
  pulse: <svg width="20" height="20" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M3 12h4l2.5-6 4 12 2.5-6H21" /></svg>,
  page: <svg width="20" height="20" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></svg>,
  bell: <svg width="22" height="22" viewBox="0 0 24 24" {...P} aria-hidden><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>,
  bellSm: <svg width="16" height="16" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>,
  chevR: <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M9 6l6 6-6 6" /></svg>,
  chevL: <svg width="22" height="22" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M15 6l-6 6 6 6" /></svg>,
  chevD: <svg width="14" height="14" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><path d="M6 9l6 6 6-6" /></svg>,
  check: <svg width="28" height="28" viewBox="0 0 24 24" {...P} stroke="var(--good-solid)" strokeWidth={2} aria-hidden><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.8 2.8L16.5 9.5" /></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" {...P} strokeWidth={2} aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>,
  doc: <svg width="18" height="18" viewBox="0 0 24 24" {...P} aria-hidden><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></svg>,
};

// ---------- theme sync ----------
export function ThemeSync() {
  const [s] = useSettings();
  useEffect(() => applyTheme(s.theme), [s.theme]);
  return null;
}

// ---------- tab bar: Home · Companies · [Search] · Alerts · Calendar ----------
export function TabBar() {
  const path = usePathname();
  const tab = (href: string, label: string, icon: ReactNode, on: boolean) => (
    <Link key={href} href={href} aria-current={on ? "page" : undefined}>
      {icon}
      {label}
    </Link>
  );
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="inner">
        {tab("/", "Home", path === "/" ? Icon.homeOn : Icon.home, path === "/")}
        {tab("/companies", "Companies", Icon.companies, path.startsWith("/companies") || path.startsWith("/c/"))}
        <Link href="/search" className="fab" aria-label="Search any company" aria-current={path.startsWith("/search") ? "page" : undefined}>
          {Icon.searchLg}
        </Link>
        {tab("/alerts", "Alerts", Icon.bell, path.startsWith("/alerts"))}
        {tab("/calendar", "Calendar", Icon.calendar, path.startsWith("/calendar"))}
      </div>
    </nav>
  );
}

/** Top row: round back button on inner pages, optional control on the right. */
export function TopBar({ back, right }: { back?: { label: string; href?: string }; right?: ReactNode }) {
  const router = useRouter();
  if (!back && !right) return <div style={{ height: 20 }} />;
  return (
    <div className="topbar">
      {back ? (
        <button className="roundbtn" aria-label={`Back to ${back.label}`} onClick={() => (back.href ? router.push(back.href) : router.back())}>
          {Icon.chevL}
        </button>
      ) : (
        <span />
      )}
      {right}
    </div>
  );
}

// ---------- ring (donut) : segments by count, any content in the centre ----------
export function Ring({ size, stroke, segments, track, label, children }: {
  size: number;
  stroke: number;
  segments: { value: number; color: string }[];
  track?: string;
  label: string;
  children?: ReactNode;
}) {
  const r = 50 - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const live = segments.filter((x) => x.value > 0);
  const gap = live.length > 1 ? 4 : 0;
  let off = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: `0 0 ${size}px` }}>
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label} style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={track ?? "var(--sunk)"} strokeWidth={stroke} />
        {total > 0 &&
          live.map((x, i) => {
            const len = (x.value / total) * c;
            const el = <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={x.color} strokeWidth={stroke} strokeDasharray={`${Math.max(1, len - gap)} ${c}`} strokeDashoffset={-off} />;
            off += len;
            return el;
          })}
      </svg>
      <span style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</span>
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
