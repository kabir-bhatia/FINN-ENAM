// Web Push, server side. One Blob document per subscribed browser (no login: the browser's
// push subscription is the identity, with its own portfolio and rules).
// What is sent (04 doc, "calm agent"):
//   • right away, once per item: governance red flags, the user's price/volume rules firing,
//     and filings in the categories the user marked "needs you";
//   • at the user's brief times: one summary ("2 need you · 16 unchanged");
//   • never: routine filings.
import { createHash } from "node:crypto";
import webpush from "web-push";
import { list, del } from "@vercel/blob";
import type { Bundle, Rules } from "./types";
import { companyDay, DEFAULT_RULES, moveSentence, resultsHeadline, tierOf } from "./digest";
import { getJSON, putJSON } from "./store";
import { istDate } from "./time";

export interface SubRecord {
  id: string;
  sub: webpush.PushSubscription;
  portfolio: string[];
  rules: Rules;
  briefs: string[];
  weekdaysOnly: boolean;
  createdAt: string;
  lastCheck: number; // items after this instant are new for this browser
  lastBrief: number; // last brief slot already sent
  sent: string[]; // recent item ids, so nothing is sent twice
}

export interface Note {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

const PREFIX = "push/";
export const subId = (endpoint: string) => createHash("sha1").update(endpoint).digest("hex").slice(0, 24);
const key = (id: string) => `${PREFIX}${id}.json`;

let configured = false;
function configure() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails("https://web-lake-chi-14.vercel.app", pub, priv);
  configured = true;
  return true;
}

export async function saveSub(input: { sub: webpush.PushSubscription; portfolio: string[]; rules?: Rules; briefs?: string[]; weekdaysOnly?: boolean }) {
  const id = subId(input.sub.endpoint);
  const prev = await getJSON<SubRecord>(key(id), { fresh: true });
  const now = Date.now();
  const rec: SubRecord = {
    id,
    sub: input.sub,
    portfolio: input.portfolio.slice(0, 40),
    rules: { ...DEFAULT_RULES, ...(input.rules ?? {}) },
    briefs: (input.briefs ?? ["08:30", "16:15"]).filter((t) => /^\d{2}:\d{2}$/.test(t)).slice(0, 4),
    weekdaysOnly: input.weekdaysOnly ?? true,
    createdAt: prev?.createdAt ?? new Date(now).toISOString(),
    lastCheck: prev?.lastCheck ?? now,
    lastBrief: prev?.lastBrief ?? now,
    sent: prev?.sent ?? [],
  };
  await putJSON(key(id), rec);
  return { rec, isNew: !prev };
}

export async function deleteSub(endpoint: string) {
  const id = subId(endpoint);
  const { blobs } = await list({ prefix: key(id) });
  if (blobs.length) await del(blobs.map((b) => b.url));
}

export async function getSub(endpoint: string) {
  return getJSON<SubRecord>(key(subId(endpoint)), { fresh: true });
}

async function allSubs(): Promise<SubRecord[]> {
  const out: SubRecord[] = [];
  let cursor: string | undefined;
  do {
    const r = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of r.blobs) {
      const id = b.pathname.slice(PREFIX.length).replace(/\.json$/, "");
      const rec = await getJSON<SubRecord>(key(id), { fresh: true });
      if (rec) out.push(rec);
    }
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

/** Send one notification. Returns "gone" when the browser has unsubscribed (we then delete it). */
export async function send(rec: SubRecord, n: Note): Promise<"ok" | "gone" | "error"> {
  if (!configure()) return "error";
  try {
    await webpush.sendNotification(rec.sub, JSON.stringify(n), { TTL: 6 * 3600, urgency: "normal" });
    return "ok";
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    return code === 404 || code === 410 ? "gone" : "error";
  }
}

// ---------- what to say ----------
interface Item {
  id: string;
  symbol: string;
  name: string;
  line: string; // "Yes Bank · Governance"
  text: string; // one sentence
  url: string;
}

const short = (n: string) => n.replace(/ Limited$/, "");

/** Items that "need you" for this browser's rules since `from`. */
export function itemsFor(bundles: Bundle[], rules: Rules, from: number): { items: Item[]; unchanged: number; checked: number } {
  const items: Item[] = [];
  let unchanged = 0;
  let checked = 0;
  for (const b of bundles) {
    const day = companyDay(b, rules, from);
    checked += day.filingsRead;
    if (day.state === "unchanged") unchanged++;
    const name = short(b.name);
    if (day.alert) {
      const m = day.alert;
      items.push({ id: `m:${b.symbol}:${m.d}`, symbol: b.symbol, name, line: `${name} · your ${m.volFired ? "volume" : "price"} rule`, text: `${name} ${moveSentence(m)}${m.explainedBy ? "" : ", no filing explains it"}.`, url: `/c/${b.symbol}?tab=updates&from=today` });
    }
    for (const f of day.items) {
      if (tierOf(f, rules) !== "act") continue;
      const gov = f.category === "governance";
      const view = f.category === "results" ? day.results?.view : null;
      items.push({
        id: `f:${f.id}`,
        symbol: b.symbol,
        name,
        line: `${name} · ${gov ? (f.govSeverity === "high" ? "Governance red flag" : "Governance") : view ? `Results ${view.q}` : f.nseCat}`,
        text: view ? `${resultsHeadline(view)}.` : f.headline,
        url: `/c/${b.symbol}?tab=${gov ? "governance" : view ? "results" : "updates"}&from=today`,
      });
    }
  }
  // Governance first, then rule alerts, then the rest.
  const rank = (i: Item) => (i.line.includes("red flag") ? 0 : i.line.includes("Governance") ? 1 : i.id.startsWith("m:") ? 2 : 3);
  items.sort((a, b) => rank(a) - rank(b));
  return { items, unchanged, checked };
}

function alertNote(items: Item[]): Note {
  if (items.length === 1) return { title: items[0].line, body: items[0].text, url: items[0].url, tag: items[0].id };
  return {
    title: `${items.length} things need you`,
    body: items.slice(0, 3).map((i) => `${i.name}: ${i.text}`).join("\n"),
    url: "/",
    tag: "finn-alerts",
  };
}

/** The latest brief slot (IST) at or before now, or 0 if none in the last two days. */
function lastSlot(briefs: string[], weekdaysOnly: boolean, now = Date.now()): number {
  let best = 0;
  for (let back = 0; back < 3; back++) {
    const ymd = istDate(now - back * 864e5);
    const wd = new Date(ymd + "T00:00:00Z").getUTCDay();
    if (weekdaysOnly && (wd === 0 || wd === 6)) continue;
    for (const hm of briefs) {
      const t = new Date(`${ymd}T${hm}:00+05:30`).getTime();
      if (t <= now && t > best) best = t;
    }
  }
  return best;
}

function briefNote(slot: number, items: Item[], unchanged: number, checked: number, total: number): Note {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date(slot)));
  const name = hour < 12 ? "Morning brief" : "Evening brief";
  const body = items.length
    ? `${items.length} need${items.length === 1 ? "s" : ""} you: ${items.slice(0, 2).map((i) => i.name).join(", ")}${items.length > 2 ? "…" : ""}. ${unchanged} of ${total} unchanged.`
    : `Nothing needs you. ${checked} filings checked across ${total} companies; your rules didn't fire.`;
  return { title: `${name} · FINN`, body, url: "/", tag: "finn-brief" };
}

/** A preview of what this browser would get now (last 7 days), for the "Send a test" button. */
export function previewNote(bundles: Bundle[], rules: Rules): Note {
  const { items, unchanged, checked } = itemsFor(bundles, rules, Date.now() - 7 * 864e5);
  if (!items.length) return { title: "FINN test · all quiet", body: `Nothing needed you in the last 7 days. ${checked} filings checked; ${unchanged} companies unchanged.`, url: "/", tag: "finn-test" };
  const n = alertNote(items);
  return { ...n, title: `Test · ${n.title}`, tag: "finn-test" };
}

/** Called after each scheduled refresh: send new alerts and any brief that is due. */
export async function notifyAll(byId: Map<string, Bundle>, readMissing: (s: string) => Promise<Bundle | null>) {
  if (!configure()) return { subs: 0, sent: 0, gone: 0, skipped: "no VAPID keys" };
  const subs = await allSubs();
  let sent = 0;
  let gone = 0;
  const now = Date.now();
  for (const rec of subs) {
    const bundles: Bundle[] = [];
    for (const s of rec.portfolio) {
      const b = byId.get(s) ?? (await readMissing(s).catch(() => null));
      if (b) {
        byId.set(s, b);
        bundles.push(b);
      }
    }
    const fresh = itemsFor(bundles, rec.rules, rec.lastCheck).items.filter((i) => !rec.sent.includes(i.id));
    const slot = lastSlot(rec.briefs, rec.weekdaysOnly, now);
    const briefDue = slot > rec.lastBrief;
    let note: Note | null = null;
    if (briefDue) {
      const w = itemsFor(bundles, rec.rules, rec.lastBrief);
      note = briefNote(slot, w.items, w.unchanged, w.checked, bundles.length);
    } else if (fresh.length) {
      note = alertNote(fresh);
    }
    if (note) {
      const r = await send(rec, note);
      if (r === "gone") {
        await deleteSub(rec.sub.endpoint).catch(() => {});
        gone++;
        continue;
      }
      if (r === "ok") sent++;
    }
    rec.sent = [...rec.sent, ...fresh.map((i) => i.id)].slice(-300);
    rec.lastCheck = now;
    if (briefDue) rec.lastBrief = slot;
    await putJSON(key(rec.id), rec);
  }
  return { subs: subs.length, sent, gone };
}
