// One thin wrapper over the Gemini REST API with a model tier, retries and a fallback model.
// Routing (D1–D6, revised by the spike): "cheap" = flash-lite for bulk reading,
// "strong" = flash for judgment on small inputs. No Pro model exists on the free tier.
import type { CostLine } from "./types";

export type Tier = "cheap" | "strong";

const MODELS: Record<Tier, string[]> = {
  cheap: ["gemini-3.5-flash-lite", "gemini-3.5-flash"], // flash-lite 503s under load → fall back
  strong: ["gemini-3.5-flash", "gemini-3.5-flash-lite"],
};

// Cost receipt (A10). We run on the free tier (actual cost ₹0); the receipt shows what the
// same call would cost at paid list prices, so efficiency stays visible. USD per 1M tokens —
// assumptions, kept in one place.
const PRICE: Record<string, { in: number; out: number }> = {
  "gemini-3.5-flash-lite": { in: 0.1, out: 0.4 },
  "gemini-3.5-flash": { in: 0.3, out: 2.5 },
};
const INR_PER_USD = 88;

export function inr(model: string, inTok: number, outTok: number) {
  const p = PRICE[model] ?? PRICE["gemini-3.5-flash"];
  return ((inTok * p.in + outTok * p.out) / 1e6) * INR_PER_USD;
}

export interface LlmResult<T> {
  data: T;
  cost: CostLine;
}

export async function llmJSON<T>(
  tier: Tier,
  step: string,
  prompt: string,
  opts: { pdfBase64?: string; maxOut?: number; timeoutMs?: number } = {},
): Promise<LlmResult<T>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  const parts: unknown[] = [];
  if (opts.pdfBase64) parts.push({ inline_data: { mime_type: "application/pdf", data: opts.pdfBase64 } });
  parts.push({ text: prompt });
  let lastErr = "";
  for (const model of MODELS[tier]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const t0 = Date.now();
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
              maxOutputTokens: opts.maxOut ?? 4096,
            },
          }),
          signal: AbortSignal.timeout(opts.timeoutMs ?? 90000),
        });
        const j = await r.json();
        if (!r.ok) {
          lastErr = `${model} ${r.status} ${JSON.stringify(j?.error?.message ?? "").slice(0, 120)}`;
          if (r.status === 503 || r.status === 429 || r.status >= 500) {
            await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
            continue;
          }
          break; // 4xx other than 429: try next model
        }
        const text: string = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
        const data = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as T;
        const inTok = j?.usageMetadata?.promptTokenCount ?? 0;
        const outTok = (j?.usageMetadata?.candidatesTokenCount ?? 0) + (j?.usageMetadata?.thoughtsTokenCount ?? 0);
        return { data, cost: { step, model, inTok, outTok, inr: inr(model, inTok, outTok), ms: Date.now() - t0 } };
      } catch (e) {
        lastErr = `${model} ${String(e).slice(0, 120)}`;
      }
    }
  }
  throw new Error(`LLM failed: ${lastErr}`);
}
