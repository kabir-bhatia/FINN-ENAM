// Track record (promise ledger). GET = cached ledger; POST runs one pipeline step at a time
// so the client can show real progress and each call stays inside the function time limit.
import { cleanSymbol, patchTrack } from "@/lib/bundle";
import { applyExtraction, discover, extractTranscript, getLedger, saveLedger, verdicts } from "@/lib/track";
import { screener } from "@/lib/sources";

export const preferredRegion = "bom1"; // Mumbai: next to NSE, Screener and BSE PDFs
export const maxDuration = 300;

export async function GET(_req: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const symbol = cleanSymbol((await ctx.params).symbol);
  const l = await getLedger(symbol, true);
  return Response.json(l ?? { symbol, status: "none" }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const symbol = cleanSymbol((await ctx.params).symbol);
  const body = (await request.json().catch(() => ({}))) as { step?: string; i?: number };
  try {
    if (body.step === "discover") {
      const existing = await getLedger(symbol, true);
      // A ready ledger is returned as-is, unless the caller asks to retry calls that failed
      // (usually a model quota error) — then only those calls are re-read.
      if (existing?.status === "ready" && !(body as { retry?: boolean }).retry) return Response.json(existing);
      if (existing?.status === "ready" && existing.transcripts.some((t) => t.status === "failed")) {
        existing.transcripts.forEach((t) => t.status === "failed" && ((t.status = "pending"), (t.error = undefined)));
        existing.status = "building";
        await saveLedger(existing);
        return Response.json(existing);
      }
      const { ledger } = await discover(symbol);
      if (ledger.status === "no-transcripts") {
        ledger.builtAt = new Date().toISOString();
      }
      await saveLedger(ledger);
      return Response.json(ledger);
    }
    const l = await getLedger(symbol, true);
    if (!l) return Response.json({ error: "Run discover first" }, { status: 400 });
    if (body.step === "extract") {
      const i = Number(body.i ?? 0);
      const t = l.transcripts[i];
      if (!t) return Response.json({ error: "No such transcript" }, { status: 400 });
      try {
        const ex = await extractTranscript(t);
        applyExtraction(l, i, ex);
      } catch (e) {
        t.status = "failed";
        t.error = String((e as Error).message ?? e).slice(0, 140);
      }
      await saveLedger(l);
      return Response.json(l);
    }
    if (body.step === "verdict") {
      const { fund } = await screener(symbol);
      await verdicts(l, fund);
      await saveLedger(l);
      await patchTrack(symbol, l);
      return Response.json(l);
    }
    return Response.json({ error: "Unknown step" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: String((e as Error).message ?? e) }, { status: 500 });
  }
}
