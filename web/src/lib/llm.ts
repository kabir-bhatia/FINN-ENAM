// One thin wrapper over two providers, with a model tier, retries and a fallback chain.
// Main: GLM 5.3 flash through Hyde Inference (OpenAI-compatible; higher free limits).
// Fallback: Gemini (flash-lite for bulk reading, flash for judgment), used when GLM fails or is
// not configured. Every caller gets JSON back; the cost receipt names the model that answered.
import type { CostLine } from "./types";

export type Tier = "cheap" | "strong";

const GLM_MODEL = "hyde/glm-5.3-flash";
const GLM_URL = "https://inference.hyde.tech/v1/chat/completions";

const GEMINI: Record<Tier, string[]> = {
  cheap: ["gemini-3.5-flash-lite", "gemini-3.5-flash"], // flash-lite 503s under load → fall back
  strong: ["gemini-3.5-flash", "gemini-3.5-flash-lite"],
};

// Cost receipt (A10). We run on free tiers (actual cost ₹0); the receipt shows what the same call
// would cost at paid list prices, so efficiency stays visible. USD per 1M tokens — assumptions,
// kept in one place. Hyde does not publish a GLM price we can cite, so GLM lines show tokens only.
const PRICE: Record<string, { in: number; out: number }> = {
  "gemini-3.5-flash-lite": { in: 0.1, out: 0.4 },
  "gemini-3.5-flash": { in: 0.3, out: 2.5 },
};
const INR_PER_USD = 88;

export function inr(model: string, inTok: number, outTok: number) {
  const p = PRICE[model];
  if (!p) return 0;
  return ((inTok * p.in + outTok * p.out) / 1e6) * INR_PER_USD;
}

export const isPriced = (model: string) => model in PRICE;

export interface LlmResult<T> {
  data: T;
  cost: CostLine;
}

/** Strip reasoning tags and code fences, then parse the first JSON object or array. */
function parseJSON<T>(text: string): T {
  const t = (text || "").replace(/<think>[\s\S]*?<\/think>/g, "").replace(/^```(?:json)?\s*|\s*```$/gm, "").trim();
  try {
    return JSON.parse(t) as T;
  } catch {
    const m = /(\{[\s\S]*\}|\[[\s\S]*\])/.exec(t);
    if (m) return JSON.parse(m[1]) as T;
    throw new Error("model did not return JSON");
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function glm<T>(key: string, step: string, prompt: string, maxOut: number, timeoutMs: number): Promise<LlmResult<T>> {
  let last = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const t0 = Date.now();
    try {
      const r = await fetch(GLM_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GLM_MODEL,
          messages: [
            { role: "system", content: "You return valid JSON only, with no prose and no code fences." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          // GLM reasons before answering; leave room so the JSON is never cut off.
          max_tokens: maxOut + 4096,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        last = `${GLM_MODEL} ${r.status} ${JSON.stringify(j?.error?.message ?? "").slice(0, 120)}`;
        if (r.status === 401 || r.status === 403) break; // bad key: go straight to the fallback
        await wait(1200 * (attempt + 1));
        continue;
      }
      const data = parseJSON<T>(j?.choices?.[0]?.message?.content ?? "");
      const inTok = j?.usage?.prompt_tokens ?? 0;
      const outTok = j?.usage?.completion_tokens ?? 0;
      return { data, cost: { step, model: GLM_MODEL, inTok, outTok, inr: 0, ms: Date.now() - t0 } };
    } catch (e) {
      last = `${GLM_MODEL} ${String(e).slice(0, 120)}`;
    }
  }
  throw new Error(last);
}

async function gemini<T>(key: string, tier: Tier, step: string, prompt: string, maxOut: number, timeoutMs: number): Promise<LlmResult<T>> {
  let last = "";
  for (const model of GEMINI[tier]) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const t0 = Date.now();
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: maxOut },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const j = await r.json();
        if (!r.ok) {
          last = `${model} ${r.status} ${JSON.stringify(j?.error?.message ?? "").slice(0, 120)}`;
          if (r.status === 503 || r.status === 429 || r.status >= 500) {
            await wait(1200 * (attempt + 1));
            continue;
          }
          break; // 4xx other than 429: try next model
        }
        const text: string = j?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
        const data = parseJSON<T>(text);
        const inTok = j?.usageMetadata?.promptTokenCount ?? 0;
        const outTok = (j?.usageMetadata?.candidatesTokenCount ?? 0) + (j?.usageMetadata?.thoughtsTokenCount ?? 0);
        return { data, cost: { step, model, inTok, outTok, inr: inr(model, inTok, outTok), ms: Date.now() - t0 } };
      } catch (e) {
        last = `${model} ${String(e).slice(0, 120)}`;
      }
    }
  }
  throw new Error(last);
}

export async function llmJSON<T>(
  tier: Tier,
  step: string,
  prompt: string,
  opts: { maxOut?: number; timeoutMs?: number } = {},
): Promise<LlmResult<T>> {
  const maxOut = opts.maxOut ?? 4096;
  const timeoutMs = opts.timeoutMs ?? 90000;
  const hyde = process.env.HYDE_API_KEY;
  const gem = process.env.GEMINI_API_KEY;
  if (!hyde && !gem) throw new Error("No model key configured (HYDE_API_KEY or GEMINI_API_KEY)");
  const errs: string[] = [];
  if (hyde) {
    try {
      return await glm<T>(hyde, step, prompt, maxOut, timeoutMs);
    } catch (e) {
      errs.push(String((e as Error).message ?? e));
    }
  }
  if (gem) {
    try {
      return await gemini<T>(gem, tier, step, prompt, maxOut, timeoutMs);
    } catch (e) {
      errs.push(String((e as Error).message ?? e));
    }
  }
  throw new Error(`LLM failed: ${errs.join(" · ")}`);
}
