// One company's bundle; ?refresh=1 forces a live rebuild from NSE, Yahoo and Screener.
import { addTracked, buildBundle, cleanSymbol, readBundle } from "@/lib/bundle";

export const maxDuration = 60;

export async function GET(request: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const symbol = cleanSymbol((await ctx.params).symbol);
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  try {
    let b = refresh ? null : await readBundle(symbol);
    if (!b) {
      b = await buildBundle(symbol);
      await addTracked(symbol);
    }
    return Response.json(b, { headers: { "Cache-Control": refresh ? "no-store" : "public, s-maxage=60, stale-while-revalidate=600" } });
  } catch (e) {
    return Response.json({ error: String((e as Error).message ?? e) }, { status: 404 });
  }
}
