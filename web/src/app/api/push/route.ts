// Subscribe / update / unsubscribe this browser for push notifications.
import type webpush from "web-push";
import { addTracked, cleanSymbol } from "@/lib/bundle";
import { deleteSub, saveSub, send } from "@/lib/push";
import { nextBrief } from "@/lib/time";
import type { Rules } from "@/lib/types";

export const preferredRegion = "bom1";
export const maxDuration = 30;

interface Body {
  sub?: webpush.PushSubscription;
  portfolio?: string[];
  rules?: Rules;
  briefs?: string[];
  weekdaysOnly?: boolean;
  endpoint?: string;
}

const okEndpoint = (u?: string) => !!u && /^https:\/\//.test(u) && u.length < 1000;

export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Body;
  if (!b.sub || !okEndpoint(b.sub.endpoint) || !b.sub.keys?.p256dh || !b.sub.keys?.auth) return Response.json({ error: "Bad subscription" }, { status: 400 });
  const portfolio = (b.portfolio ?? []).map(cleanSymbol).filter(Boolean);
  const { rec, isNew } = await saveSub({ sub: b.sub, portfolio, rules: b.rules, briefs: b.briefs, weekdaysOnly: b.weekdaysOnly });
  // Companies outside the demo set join the scheduled refresh, so alerts cover them too.
  for (const s of portfolio) await addTracked(s).catch(() => {});
  if (isNew)
    await send(rec, {
      title: "FINN alerts are on",
      body: `You'll hear about governance red flags and your own rules as they happen, plus a brief ${nextBrief(rec.briefs, rec.weekdaysOnly) ? `next at ${nextBrief(rec.briefs, rec.weekdaysOnly)}` : "at your brief times"}.`,
      url: "/",
      tag: "finn-welcome",
    });
  return Response.json({ ok: true, id: rec.id, companies: rec.portfolio.length });
}

export async function DELETE(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Body;
  if (!okEndpoint(b.endpoint)) return Response.json({ error: "Bad endpoint" }, { status: 400 });
  await deleteSub(b.endpoint!);
  return Response.json({ ok: true });
}
