"use client";
import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import { PushSync } from "./PushControls";
import { EvidenceProvider, TabBar, ThemeSync } from "./ui";

const noop = () => () => {};

export default function Shell({ children }: { children: ReactNode }) {
  // Screens depend on the clock (IST windows, "since you last looked") and on the browser's
  // saved portfolio, so they render after mount; the static shell (tab bar, fonts) prerenders.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return (
    <EvidenceProvider>
      <ThemeSync />
      {mounted && <PushSync />}
      <main className="app">{mounted ? children : <div style={{ height: 56 }} />}</main>
      <Suspense fallback={null}>
        <TabBar />
      </Suspense>
    </EvidenceProvider>
  );
}
