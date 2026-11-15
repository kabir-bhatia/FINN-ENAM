# FINN — a calm investment agent for a long-term, governance-first team

**Live (phone-first):** https://web-lake-chi-14.vercel.app · built for ENAM's AI Engineer build challenge.

FINN does two things, both from primary sources only:

- **Push — Today.** What changed for *your* companies since you last looked, ranked by thesis impact. Governance first, your own price/volume rules second, routine paperwork collapsed into one line, and a finite ending: *"You're caught up."*
- **Pull — Track record.** For any NSE company with call transcripts: every checkable promise management made in the last 4 calls, the exact quote and page, and a verdict — **Kept · Missed · Target changed · Went silent · Too early** — checked against reported numbers.

The two meet on the results card: when results land, FINN shows them **against their word** (what management promised before).

## Who it is for

ENAM's own investment team — a coverage analyst (wants completeness, a source for every number) and a partner (wants one screen: *do I need to act?*). Not retail. FINN cuts time and noise, not finance. Full reasoning: [`docs/01_FINAL_SCOPE.md`](docs/01_FINAL_SCOPE.md).

## Screens

| Tab | What it does |
|---|---|
| **Today** | Thesis board (*1 challenged · 2 worth a look · 15 unchanged*, one reason per company) → alert cards when **your** rule fired (*"Market moved, business didn't — no filing explains it"*) → governance / results / other cards → *N routine filings · Show* → *You're caught up · next brief*. Window: since you last looked / 24 h / 7 d / 30 d. |
| **Company** `/c/SYMBOL` | Works for any NSE ticker. Governance strip (auditor changes, senior exits, regulatory actions, pledges). **Updates** (ranked filings, price/volume moves explained or not — price lives only here) · **Results** (Sales, EBITDA, PBT, PAT vs last quarter and last year) · **Track record** (promise ledger, questions to ask management, cost receipt). |
| **Companies** | Portfolio (saved in the browser) with each company's state; search any NSE company; long-press → remove with Undo. |
| **Alerts** | Volume × 20-day average, ±% price, "only if no filing explains it", which announcement types count as *needs you*. |
| Settings · How FINN thinks | Theme, brief times, default window, reset demo · ranking rules, model routing and live cost numbers. |

Every number and quote opens an **evidence sheet**: the document, page, exact quote (highlighted), and how it was produced.

## Architecture

```
GitHub Actions cron (weekdays, 5×/day) ─┐
Vercel Cron (daily, backup) ────────────┴─► POST /api/ingest  (Vercel, bom1 Mumbai)
                                                │  per company, 4 at a time:
                                                │  NSE announcements → rules → flash-lite (vague titles only)
                                                │  Yahoo EOD prices · Screener quarterly table + transcript links
                                                ▼
                                       Vercel Blob (private): b/SYMBOL.json bundles,
                                       t/SYMBOL.json ledgers, x/<hash>.json transcript extractions
                                                ▲
Phone ─► Next.js 16 app ─► GET /api/bundles?s=… (CDN-cached, stale-while-revalidate)
           │  ranking runs in the browser (instant re-rank when you change a rule)
           └► Track record: POST /api/track/SYMBOL {discover → extract ×4 → verdict}
                one short call per step → real progress, fits function limits, cached after
```

- **Everything runs on Vercel in Mumbai** because that's where NSE, Screener and BSE PDFs are reachable (the BSE announcements API blocks cloud IPs — see [`docs/03_DATA_SPIKE.md`](docs/03_DATA_SPIKE.md)).
- **No database:** all data is key-addressed documents, so Vercel Blob is enough. Filings never change, so classifications and transcript extractions are cached forever.
- **Push is precomputed** (cron) so Today never waits on a live scrape; a ticker the user adds is built live once (~5–8 s), then joins the scheduled refresh.

## Key decisions (and why)

| Decision | Why |
|---|---|
| **Rules → flash-lite → flash cascade** | Exchange category + keywords classify most filings at zero cost; flash-lite reads only the exchange's short summary of vague filings ("General Updates"), never the PDF. flash judges verdicts on a few KB of ledger, not whole transcripts. |
| **Code owns quotes and pages** | The model proposes a quote; code extracts the PDF text page by page (`unpdf`) and keeps a promise only if the quote is found there. The page number shown is the one code found. |
| **No model touches numbers** | Results come from Screener's standardised table of the filed results (₹ crore, consolidated when available); growth and EBITDA are computed in code. **EBITDA = PBT + finance cost + depreciation − other income**, labelled *computed*. Lenders get no EBITDA. |
| **Governance can't be buried** | Auditor changes, senior exits, regulatory orders, pledges, guarantees are always "needs you". Only a *resignation*-type event marks a company *challenged*; a routine auditor rotation is *worth a look*. |
| **Thesis board, not a feed** | The partner's question is about companies, not filings. Silence reads as *checked*: "15 unchanged — every filing checked". |
| **Your rules, visibly** | An alert shows the rule that fired (*20-day avg × 3.1 · your rule × 2.0*). Explained moves attach to their filing; split/bonus days never fire. |
| **No chatbot, no login** | Inputs are choices (ticker, window, thresholds). Judges can use it in 10 seconds; structured output is easier to cite than chat. |
| **IST everywhere, Indian FY labels** | "Q2 FY27 (Jul–Sep 2026)"; windows are in investor time; weekend-aware ("Fri close"). |

All decisions with alternatives considered: [`docs/02_BUILD_DECISIONS.md`](docs/02_BUILD_DECISIONS.md). Design language and review rounds: [`docs/04_DESIGN.md`](docs/04_DESIGN.md).

## Demo portfolio — chosen by data, not taste

A greedy scan of ~50 candidates' NSE filings over the last 30 days picked the set that covers the most distinct material event types (30 of 31 seen): 14 liquid large caps for reliable data + 4 ENAM-like mid caps for relevance.

`NAUKRI TATASTEEL YESBANK SUNPHARMA PAYTM DABUR TRENT TITAN BAJFINANCE HAVELLS RELIANCE LT ADANIPORTS DMART` + `ASTRAL KAJARIACER VGUARD SYMPHONY`

## Cost

Free tiers only (Vercel Hobby, Vercel Blob, Gemini API free tier, GitHub Actions). Receipts in the app show what each call *would* cost at paid Gemini list prices (assumed $0.10/$0.40 per M tokens for flash-lite, $0.30/$2.50 for flash, ₹88/$): classifying a whole portfolio's vague filings costs well under ₹0.10; a full 4-call track record about ₹0.2–0.5, once, then cached for everyone.

## Run locally

```bash
cd web
cp ../.env.example .env.local   # GEMINI_API_KEY, BLOB_READ_WRITE_TOKEN, INGEST_SECRET
npm install
npm run dev
```

Cron: set the repo secret `INGEST_SECRET` (same value as on Vercel) for `.github/workflows/ingest.yml`.

## Status (15 Nov 2026)

**Built:** data layer (NSE, Yahoo, Screener, Blob), filing classification cascade, Today (thesis board, rule alerts, governance/results cards, routine collapse, caught-up ending, window sheet), company page (governance strip, Updates, Results with evidence, Track record pipeline with step progress, verdicts, questions to ask, cost receipt), Companies (search any NSE ticker, long-press remove + Undo), Alerts, Settings, How FINN thinks, evidence sheet, dark mode, schedules.

**Not built yet:** preset "Ask about this" questions and "Go deeper"; real push delivery (Telegram); pledge data from NSE's separate SAST pledge feed (pledges are only caught when they appear in announcements); evaluation harness with published accuracy; bank-specific results metrics.

*Research aid, not investment advice.*
