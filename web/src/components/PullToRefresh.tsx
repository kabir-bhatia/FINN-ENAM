"use client";
// Pull to refresh (declutter plan): at the top of a data page, pull down past ~70 px and let go
// to refetch. An installed app has no reload button, so this is the natural way to refresh.
// It fetches the latest server copy; NSE itself is read on the schedule (see How FINN thinks).
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { requestRefresh } from "@/lib/client";
import { anchor } from "@/lib/time";
import { Toast } from "./ui";

const THRESHOLD = 70;
const MAX = 110;

const enabledOn = (p: string) => p === "/" || p === "/companies" || p === "/calendar" || p.startsWith("/c/");

export default function PullToRefresh() {
  const path = usePathname() ?? "/";
  const on = enabledOn(path);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const start = useRef<{ y: number; x: number } | null>(null);
  const dist = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!on) return;
    const blocked = () => busyRef.current || window.scrollY > 0 || !!document.querySelector(".sheet");
    const down = (e: TouchEvent) => {
      start.current = blocked() || e.touches.length > 1 ? null : { y: e.touches[0].clientY, x: e.touches[0].clientX };
      dist.current = 0;
    };
    const move = (e: TouchEvent) => {
      if (!start.current) return;
      const dy = e.touches[0].clientY - start.current.y;
      const dx = Math.abs(e.touches[0].clientX - start.current.x);
      if (dy <= 0 || window.scrollY > 0 || dx > dy) {
        if (dist.current) setPull(0);
        dist.current = 0;
        if (dy < 0) start.current = null;
        return;
      }
      e.preventDefault(); // we own this gesture now: stop the page bouncing under the spinner
      const d = Math.min(MAX, dy * 0.5);
      dist.current = d;
      setPull(d);
    };
    const up = async () => {
      if (!start.current) return;
      start.current = null;
      const fire = dist.current >= THRESHOLD;
      dist.current = 0;
      if (!fire) {
        setPull(0);
        return;
      }
      navigator.vibrate?.(10);
      busyRef.current = true;
      setBusy(true);
      setPull(THRESHOLD);
      try {
        const asOf = await requestRefresh();
        setToast(asOf ? `Updated · data as of ${anchor(asOf)} IST` : "Updated");
      } catch {
        setToast("Couldn’t refresh. Try again in a minute.");
      } finally {
        busyRef.current = false;
        setBusy(false);
        setPull(0);
      }
    };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    window.addEventListener("touchcancel", up);
    return () => {
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
    };
  }, [on]);

  const progress = Math.min(1, pull / THRESHOLD);
  return (
    <>
      {(pull > 0 || busy) && (
        <div className="ptr" style={{ transform: `translate(-50%, ${pull - 44}px)`, transition: busy ? "transform 180ms ease-out" : "none" }} role="status" aria-label={busy ? "Refreshing" : "Pull to refresh"}>
          <svg width="22" height="22" viewBox="0 0 24 24" className={busy ? "spin" : undefined} style={busy ? undefined : { transform: `rotate(${progress * 270}deg)`, opacity: 0.4 + progress * 0.6 }} aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" stroke="var(--line)" strokeWidth="2.5" />
            <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </>
  );
}
