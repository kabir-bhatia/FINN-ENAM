"use client";
// Settings → Notifications: turn push on/off for this phone, send a test, and keep the server's
// copy of the portfolio and rules in step when they change (PushSync, mounted in the shell).
import { useEffect, useState } from "react";
import { usePortfolio, useRules, useSettings } from "@/lib/client";
import { currentSubscription, disablePush, enablePush, isStandalone, platform, pushSupported, syncPush, testPush } from "@/lib/pwa";

export function PushRow() {
  const [portfolio] = usePortfolio();
  const [rules] = useRules();
  const [s] = useSettings();
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const ios = platform() === "ios";
  const needsInstall = ios && !isStandalone();

  useEffect(() => {
    currentSubscription().then((sub) => setOn(!!sub)).catch(() => setOn(false));
  }, []);

  const toggle = async () => {
    setBusy(true);
    setMsg("");
    try {
      if (on) {
        await disablePush();
        setOn(false);
        setMsg("Notifications are off for this phone.");
      } else {
        const r = await enablePush({ portfolio, rules, briefs: s.briefs, weekdaysOnly: s.weekdaysOnly });
        if (r.ok) {
          setOn(true);
          setMsg("On. A confirmation notification is on its way.");
        } else
          setMsg(
            r.error === "denied"
              ? "Notifications are blocked for this site. Allow them in your browser's site settings, then try again."
              : r.error === "ios-install"
                ? "On iPhone, add FINN to your home screen first (Share → Add to Home Screen), then turn this on from the installed app."
                : r.error === "unsupported"
                  ? "This browser can't receive web notifications."
                  : `Couldn't turn on: ${r.error}`,
          );
      }
    } catch (e) {
      setMsg(`Couldn't change notifications: ${String((e as Error).message ?? e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="rowlink between"
        style={{ width: "100%", background: "none", border: 0, borderTop: "1px solid var(--line)", textAlign: "left", alignItems: "center" }}
        role="switch"
        aria-checked={!!on}
        disabled={busy || on === null}
        onClick={toggle}
      >
        <span className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span className="s14 strong">Notifications on this phone</span>
          <span className="small muted">
            {needsInstall ? "iPhone: add FINN to your home screen first" : !pushSupported() ? "Not supported in this browser" : "Red flags and your rules right away; a summary at your brief times"}
          </span>
        </span>
        <span className="toggle" aria-checked={!!on} />
      </button>
      {on && (
        <div className="rowlink between" style={{ alignItems: "center" }}>
          <span className="small muted" style={{ minWidth: 0 }}>See exactly what FINN would send now</span>
          <button
            className="btn"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMsg((await testPush()) ? "Test sent: built from your last 7 days." : "Test failed. Turn notifications off and on again.");
              setBusy(false);
            }}
          >
            Send a test
          </button>
        </div>
      )}
      {msg && <div className="rowlink small ink2" style={{ minHeight: 0 }}>{msg}</div>}
    </>
  );
}

/** Mounted once in the shell: re-registers portfolio and rules after they change (debounced). */
export function PushSync() {
  const [portfolio] = usePortfolio();
  const [rules] = useRules();
  const [s] = useSettings();
  const sig = JSON.stringify([portfolio, rules, s.briefs, s.weekdaysOnly]);
  useEffect(() => {
    const t = setTimeout(() => {
      syncPush({ portfolio, rules, briefs: s.briefs, weekdaysOnly: s.weekdaysOnly });
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return null;
}
