# Data Spike Results (15 Nov 2026)

Run from the developer machine (Windows, residential IP). Scripts: `spike/spike.py`, `spike/spike_llm.py`.

| Source | Result | Notes |
|---|---|---|
| **yfinance** (`.NS`) | ✅ Works | 1 batched call for 3 tickers; last bar 13 Nov 2026 (Fri). Adjusted prices on. |
| **BSE announcements API** | ✅ Works | Per-scrip JSON with category + subcategory (e.g. "Company Update / Credit Rating"), subject, timestamp, PDF name. Market-wide: **2,704 filings on 13 Nov alone** — the filtering problem is real. Needs Referer/Origin headers. |
| **NSE announcements API** | ✅ Works locally (cookie handshake) | Returns `attchmntText` — a short text summary of each filing — useful free signal for classification. Cloud-IP behaviour still unknown → BSE stays primary. |
| **Screener.in** | ✅ Works | Quarterly table (Sales, Operating Profit, PBT, Net Profit, last 6+ quarters) parses cleanly → deterministic "Delivered" numbers. Concalls list gives month + direct BSE transcript PDF links (Titan: Nov 2026 transcript already up). |
| **Transcript PDF** (via BSE link) | ✅ 437 KB, 18 pages, 0.6 s | pypdf extracts ~50k chars of text. |
| **Gemini `gemini-3.5-flash`** (free tier) | ✅ Works | Read the transcript PDF natively; returned clean JSON guidance with quotes + page numbers in ~22 s; ~11k tokens in. |
| **Gemini `gemini-3.5-flash-lite`** | ⚠️ 503 "high demand" at test time | Transient; retry + fallback needed. |
| **Gemini Pro (`3.1-pro-preview`)** | ❌ Free-tier quota = 0 | **No Pro model on free tier.** |

## Decisions this changes

1. **Model routing (D6 revised):** cheap tier = `flash-lite` (fallback: Gemma open model on the same API, then Groq); strong tier = `gemini-3.5-flash` with thinking. No Pro model — the "strong" step stays small (ledger only), so Flash is enough.
2. **Resilience:** every LLM call needs retry-with-backoff and a fallback model; 503s happen.
3. **"Delivered" numbers** come from Screener's quarterly table (deterministic, confirmed parseable).
4. **Transcript discovery** via Screener's concall list works for any ticker → supports "works on any NSE ticker".
5. **Open:** confirm BSE/Screener reachability from Vercel and GitHub Actions IPs after the first deploy.

## Cloud reachability (Vercel functions, endpoint `/api/health/sources`)

| Source | Vercel `iad1` (US East) | Vercel `bom1` (Mumbai) |
|---|---|---|
| BSE announcements API | ❌ 403 (Akamai "Access Denied") | ❌ 403 |
| BSE PDF files (transcripts, filings) | — | ✅ 200 |
| NSE announcements API | ✅ 200 | ✅ 200 (~0.45 s) |
| Screener.in | ✅ 200 | ✅ 200 (~75 ms) |
| Yahoo chart API | ✅ 200 | ✅ 200 |

## Architecture decisions after the cloud check (supersede 02 doc C1, C7, E2, E3, F4)

1. **Announcements: NSE is primary in the cloud, BSE is not used server-side.** The BSE API blocks cloud IPs even from Mumbai; NSE works from both regions and gives a free text summary per filing. *(Reverses C1.)*
2. **Ticker identity simplifies to the NSE symbol** — NSE announcements, Yahoo (`SYMBOL.NS`) and Screener all key on it. ISIN↔BSE-code map no longer needed. *(Simplifies C7.)*
3. **All server logic runs on Vercel in `bom1` (Mumbai)** — closest to the data sources and the users; one TypeScript codebase. *(E3 resolved: Vercel, no separate Python backend.)*
4. **Scheduled ingest = GitHub Actions cron that calls a secret-protected `/api/ingest` endpoint on Vercel.** The work runs where sources are reachable; GitHub only provides the free, frequent schedule (Vercel Hobby cron is limited to daily). *(Revises E2/F4: no Python ingest; Yahoo chart API replaces yfinance in production — yfinance stays for the local spike only.)*
5. **Preview deployments are behind Vercel Authentication**; the submission link will be the public **production** URL.

## Environment note
The C: drive is full (0 GB). Tooling is installed on E: (`E:\devtmp`): Vercel CLI 65.16.0 at `E:\devtmp\npm-global`, project venv at `.venv`.
