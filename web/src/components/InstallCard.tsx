"use client";
// "Put FINN on your home screen" — shown from the second visit (or after opening a company),
// never on first open, never once installed; "Not now" hides it for 7 days.
import { useEffect, useState } from "react";
import { platform, promptInstall, useInstall } from "@/lib/pwa";

const KEY = "finn.install";

export default function InstallCard() {
  const { canPrompt, standalone } = useInstall();
  const [show, setShow] = useState(false);
  const os = typeof navigator === "undefined" ? "other" : platform();

  useEffect(() => {
    try {
      const st = JSON.parse(localStorage.getItem(KEY) || "{}") as { snooze?: number };
      if (st.snooze && Date.now() < st.snooze) return;
      const v = JSON.parse(localStorage.getItem("finn.visits") || "null") as { prev: number; cur: number } | null;
      const returning = !!v && v.cur - v.prev < 6.9 * 864e5; // a real earlier visit, not the first-visit default
      const opened = Object.keys(JSON.parse(localStorage.getItem("finn.seen") || "{}")).length > 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(returning || opened);
    } catch {}
  }, []);

  if (!show || standalone) return null;
  if (os === "other" && !canPrompt) return null; // desktop browsers without an install prompt
  if (os === "android" && !canPrompt) return null; // Chrome hasn't offered it yet

  const snooze = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ snooze: Date.now() + 7 * 864e5 }));
    } catch {}
    setShow(false);
  };

  return (
    <section className="card" style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }} aria-label="Install FINN">
      <span className="icontile" style={{ background: "var(--hero)", color: "var(--hero-accent)" }} aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M11 18.5h2" /></svg>
      </span>
      <span className="stack gap6" style={{ flex: 1, minWidth: 0 }}>
        <span className="headline" style={{ fontSize: 15, lineHeight: "20px" }}>Put FINN on your home screen</span>
        {os === "ios" ? (
          <span className="s13 ink2" style={{ lineHeight: "19px" }}>
            Tap{" "}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share" style={{ verticalAlign: "-2px" }}><path d="M12 15V3M8 7l4-4 4 4" /><path d="M5 11v9h14v-9" /></svg>{" "}
            <b>Share</b>, then <b>Add to Home Screen</b>. It opens like an app, and on iPhone that is also what lets FINN send you alerts.
          </span>
        ) : (
          <span className="s13 ink2" style={{ lineHeight: "19px" }}>Opens full-screen like an app, one tap from your home screen, and can send you the brief and alerts.</span>
        )}
        <span className="row gap8" style={{ marginTop: 2 }}>
          {canPrompt && (
            <button className="btn" style={{ background: "var(--primary)", color: "var(--oninv)" }} onClick={async () => { if (await promptInstall()) setShow(false); }}>
              Install
            </button>
          )}
          <button className="btn ghost" onClick={snooze}>Not now</button>
        </span>
      </span>
    </section>
  );
}
