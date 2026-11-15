"use client";
// Browser-side state: portfolio, rules and settings live in localStorage (B6: no login —
// judges can try it in 10 seconds). Shared filing data lives once per ticker on the server.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { Bundle, Ledger, Rules, WindowKey } from "./types";
import { DEFAULT_RULES } from "./digest";

export const DEMO = [
  "NAUKRI", "TATASTEEL", "YESBANK", "SUNPHARMA", "PAYTM", "DABUR", "TRENT", "TITAN", "BAJFINANCE",
  "HAVELLS", "RELIANCE", "LT", "ADANIPORTS", "DMART", "ASTRAL", "KAJARIACER", "VGUARD", "SYMPHONY",
];

export interface Settings {
  theme: "system" | "light" | "dark";
  window: WindowKey;
  briefs: string[];
  weekdaysOnly: boolean;
}
export const DEFAULT_SETTINGS: Settings = { theme: "system", window: "since", briefs: ["08:30", "16:15"], weekdaysOnly: true };

const listeners = new Set<() => void>();
const cache = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  if (cache.has(key)) return cache.get(key) as T;
  let v = fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) v = { ...(typeof fallback === "object" && !Array.isArray(fallback) ? fallback : {}), ...JSON.parse(raw) } as T;
    if (raw && Array.isArray(fallback)) v = JSON.parse(raw) as T;
  } catch {}
  cache.set(key, v);
  return v;
}

function write<T>(key: string, v: T) {
  cache.set(key, v);
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function useStored<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const v = useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const set = useCallback((nv: T) => write(key, nv), [key]);
  return [v, set, hydrated];
}

export const usePortfolio = () => useStored<string[]>("finn.portfolio", DEMO);
export const useRules = () => useStored<Rules>("finn.rules", DEFAULT_RULES);
export const useSettings = () => useStored<Settings>("finn.settings", DEFAULT_SETTINGS);
const EMPTY: Record<string, number> = {};
export const useSeen = () => useStored<Record<string, number>>("finn.seen", EMPTY);

export function markSeen(id: string) {
  const s = read<Record<string, number>>("finn.seen", EMPTY);
  if (s[id]) return;
  write("finn.seen", { ...s, [id]: Date.now() });
}

export function applyTheme(t: Settings["theme"]) {
  const el = document.documentElement;
  if (t === "system") delete el.dataset.theme;
  else el.dataset.theme = t;
}

/** "Since you last looked": previous visit start; a new visit starts after 30 min away. */
export function useSince(): number {
  const [since, setSince] = useState<number>(() => Date.now() - 7 * 864e5);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("finn.visits") || "null") as { prev: number; cur: number; last: number } | null;
      const now = Date.now();
      let v = raw;
      if (!v) v = { prev: now - 7 * 864e5, cur: now, last: now }; // first visit: last 7 days
      else if (now - v.last > 30 * 60e3) v = { prev: v.cur, cur: now, last: now };
      else v = { ...v, last: now };
      localStorage.setItem("finn.visits", JSON.stringify(v));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSince(v.prev);
    } catch {}
  }, []);
  return since;
}

// ---------- data fetching ----------
const mem = new Map<string, { at: number; data: unknown }>();

async function getJSON<T>(url: string, maxAgeMs = 120_000): Promise<T> {
  const m = mem.get(url);
  if (m && Date.now() - m.at < maxAgeMs) return m.data as T;
  try {
    const ss = sessionStorage.getItem("finn.c:" + url);
    if (ss) {
      const p = JSON.parse(ss);
      if (Date.now() - p.at < maxAgeMs) {
        mem.set(url, p);
        return p.data as T;
      }
    }
  } catch {}
  const r = await fetch(url);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
  mem.set(url, { at: Date.now(), data });
  try {
    sessionStorage.setItem("finn.c:" + url, JSON.stringify({ at: Date.now(), data }));
  } catch {}
  return data as T;
}

export function useBundles(symbols: string[], enabled = true) {
  const key = [...symbols].sort().join(",");
  const [state, setState] = useState<{ bundles: Bundle[]; failed: { symbol: string; error: string }[]; loading: boolean; error?: string }>({
    bundles: [],
    failed: [],
    loading: true,
  });
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    if (!key) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ bundles: [], failed: [], loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    getJSON<{ bundles: Bundle[]; failed: { symbol: string; error: string }[] }>(`/api/bundles?s=${key}`)
      .then((d) => live && setState({ bundles: d.bundles, failed: d.failed, loading: false }))
      .catch((e) => live && setState((s) => ({ ...s, loading: false, error: String(e.message ?? e) })));
    return () => {
      live = false;
    };
  }, [key, enabled]);
  return state;
}

export function useBundle(symbol: string) {
  const [state, setState] = useState<{ b: Bundle | null; loading: boolean; error?: string }>({ b: null, loading: true });
  useEffect(() => {
    let live = true;
    getJSON<Bundle>(`/api/company/${symbol}`)
      .then((b) => live && setState({ b, loading: false }))
      .catch((e) => live && setState({ b: null, loading: false, error: String(e.message ?? e) }));
    return () => {
      live = false;
    };
  }, [symbol]);
  return state;
}

export async function postTrack(symbol: string, body: object): Promise<Ledger> {
  const r = await fetch(`/api/track/${symbol}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error ?? `HTTP ${r.status}`);
  return d;
}

export async function getTrack(symbol: string): Promise<Ledger | { status: "none" }> {
  const r = await fetch(`/api/track/${symbol}`);
  return r.json();
}

export function invalidate(prefix: string) {
  for (const k of [...mem.keys()]) if (k.includes(prefix)) mem.delete(k);
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.includes(prefix)) sessionStorage.removeItem(k);
    }
  } catch {}
}
