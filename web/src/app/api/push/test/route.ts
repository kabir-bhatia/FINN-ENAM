// "Send a test": a real notification built from this browser's portfolio and rules
// over the last 7 days, so the user sees exactly what FINN would send.
import { readBundle } from "@/lib/bundle";
import { getSub, previewNote, send } from "@/lib/push";
import type { Bundle } from "@/lib/types";

export const preferredRegion = "bom1";
export const maxDuration = 30;

export async function POST(request: Request) {
  const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string };
  if (!endpoint) return Response.json({ error: "Missing endpoint" }, { status: 400 });
  const rec = await getSub(endpoint);
  if (!rec) return Response.json({ error: "Not subscribed" }, { status: 404 });
  const bundles = (await Promise.all(rec.portfolio.map((s) => readBundle(s).catch(() => null)))).filter(Boolean) as Bundle[];
  const r = await send(rec, previewNote(bundles, rec.rules));
  return r === "ok" ? Response.json({ ok: true }) : Response.json({ error: r }, { status: r === "gone" ? 410 : 502 });
}
