// Tiny JSON document store on top of Vercel Blob (private, Mumbai region).
// Why Blob instead of a database: everything FINN stores is document-shaped
// (a filing's extraction, a ticker's analysis, the daily digest snapshot) and is
// looked up by key, never queried relationally. Blob is native to Vercel, needs
// no third-party account, and filings are immutable, so they cache perfectly.
import { get, put, BlobNotFoundError } from "@vercel/blob";

export async function getJSON<T>(key: string, opts: { fresh?: boolean } = {}): Promise<T | null> {
  try {
    const res = await get(key, { access: "private", useCache: !opts.fresh });
    if (!res || res.statusCode !== 200) return null;
    return (await new Response(res.stream).json()) as T;
  } catch (e) {
    if (e instanceof BlobNotFoundError) return null;
    throw e;
  }
}

export async function putJSON(key: string, value: unknown): Promise<void> {
  await put(key, JSON.stringify(value), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}
