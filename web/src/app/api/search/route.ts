// Company search for "add any NSE ticker": Screener's search, NSE-listed symbols only.
import { screenerSearch } from "@/lib/sources";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  if (q.length < 2) return Response.json([]);
  try {
    return Response.json(await screenerSearch(q), { headers: { "Cache-Control": "public, s-maxage=86400" } });
  } catch {
    return Response.json([]);
  }
}
