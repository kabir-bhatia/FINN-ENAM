# FINN — Build Decisions (pre-engineering)

> Every decision we need before writing code, with the recommendation and the reason. The "Why" column feeds the writeup directly.
> Status legend: ✅ recommended & assumed unless you object · ❓ needs your input · 🧪 decided after the data spike
> Scope reference: [01_FINAL_SCOPE.md](01_FINAL_SCOPE.md)

---

## Hard requirements from the brief (our acceptance tests)

| # | Requirement | Source in brief | How we will prove it |
|---|---|---|---|
| R1 | Deployed and reachable by a link | "a deployed link… make it easy for us to try on a phone" | Public URL + QR code in the email |
| R2 | Works properly on a phone | "mobile-first" (repeated throughout) | Designed at 375px width first; tested on a real phone |
| R3 | It runs, every time | "A demo that doesn't run is the worst outcome" | Precomputed demo data + graceful fallbacks; no screen depends on a live scrape succeeding |
| R4 | Push: digest with selectable window + configurable thresholds | Push section | Window picker + settings screen |
| R5 | Pull works on any NSE ticker with data | "We may point it at a company you didn't pick" | Live pipeline for unknown tickers, cached demo tickers |
| R6 | Pull grounded only in primary sources | "One discipline for the pull side" | Model only sees transcripts/filings; prompt forbids outside knowledge; every claim cited |
| R7 | Cost-efficient | "Efficiency earns bonus points" | Rules → cheap model → strong model cascade; content-hash caching; cost shown per analysis |
| R8 | Repo + AI build history + writeup | "What to submit" | Public GitHub repo, exported Claude Code transcript, email writeup |
| R9 | Free tier only | Your constraint | Every service below has a free tier |

---

## A. Creative mechanisms — how FINN stands out

The brief: *"The best submissions will show a point of view about how an investor should interact with this, not just what data to show."* Most candidates will build a feed + a chatbot. Our edge comes from mechanisms that encode **ENAM's philosophy** into the product.

| # | Mechanism | What it is | Why it stands out | Cost to build | Rec |
|---|---|---|---|---|---|
| A1 | **"An inbox you can finish"** | The Digest is finite: items are triaged (Seen / Pin / Dig in) and it ends with "You're caught up — 3 things mattered, 41 routine filings hidden". | A clear interaction point of view: the opposite of an infinite feed. Directly answers "show only what's important". | Low | ✅ Core |
| A2 | **Thesis-impact ranking with "Why am I seeing this?"** | Every item gets a materiality tier (Act / Know / Routine) and a one-line reason ("Governance: promoter pledge rose from 0% to 12%"). | Ranking is explainable, not a black box. Shows judgment, which is what they grade. | Medium | ✅ Core |
| A3 | **Governance radar** | Governance events (pledging, auditor/KMP exit, insider selling, RPTs, regulatory orders) get a dedicated visual treatment and can never be collapsed. | Encodes ENAM's stated focus on management and governance. Most submissions won't think of it. | Low | ✅ Core |
| A4 | **Explained vs. unexplained moves** | A price/volume move is matched to that day's filings. Explained → shown as context on the filing card. Unexplained → its own alert. | Reframes a commodity feature (price alerts) into something a long-term investor actually needs. | Low | ✅ Core |
| A5 | **Three-depth cards** | Headline → summary → source (tap opens the original PDF). | Serves both personas with one design; builds trust (P9). | Low | ✅ Core |
| A6 | **Promise Ledger with verdicts** | Each guidance statement becomes a row: quarter, quote, target, actual, verdict chip — **Delivered / Missed / Goalposts moved / Quietly dropped / Not yet due** (full-year or multi-year targets can't be judged mid-year; saying so is more honest than guessing). | "Quietly dropped" (a promise that silently disappears from later calls) is the insight analysts value most and no generic summariser catches. | Medium | ✅ Core |
| A7 | **Guidance-drift timeline** | One metric's guidance plotted quarter by quarter (e.g. "20% growth" → "mid-teens" → "focus on margins"). | Makes "analysing, not summarising management" visible in one glance. | Medium | ✅ Core (simple version) |
| A8 | **Delivery score (with evidence)** | "Kept 5 of 8 measurable promises over 4 quarters" — a count, never an opaque score; each number taps through to the rows. | A crisp headline for the Partner, still fully traceable. | Low | ✅ Core |
| A9 | **Visible pipeline progress** | Live runs show steps: "Found 4 transcripts → Reading Q2 FY27 (p. 1–24) → 7 promises found → Checking against results…" | Turns latency into trust; shows the architecture to judges. | Low | ✅ Core |
| A10 | **Cost receipt** | Each analysis shows tokens, model used and approximate cost ("₹0.38 · cached for next time"). | Makes the efficiency bonus visible instead of hoping judges read the code. | Low | ✅ Core |
| A11 | **Questions to ask management** | From the ledger's misses and dropped promises, generate 3–5 pointed questions. | Serves P10 (pre-meeting prep) for the Partner; very cheap once the ledger exists. | Low | ⏳ Stretch #2 |
| A12 | **60-second audio brief** | Browser text-to-speech reads the morning digest headlines. | A second interaction mode (voice) at zero cost; fits the Partner's commute. | Low | ⏳ Stretch |
| A13 | **Real push via Telegram bot** | Material alerts arrive as Telegram messages with a deep link back into FINN. | Judges receive a real push; investors already live in messaging apps. iOS web push needs home-screen install, Telegram doesn't. | Medium | ⏳ Stretch #5 |
| A14 | Free-form chat over everything | General Q&A chatbot | Every candidate will build this; high slop risk; hard to ground. | High | ❌ Not now |
| A15 | **Push ↔ Pull bridge: "Results vs. Promises"** | When a results filing lands, the Results card also shows how it compares with what management guided ("Revenue +14% YoY · guided 18–20% · **below guidance**"). Needs the Promise Ledger precomputed for portfolio companies (cheap, cached). | Connects the two modes into one memory: FINN remembers what was promised, so the moment results arrive it tells you whether they kept their word. No generic feed can do this. | Medium | ✅ Spice #1 (right after core) |
| A16 | **Evaluation harness with published accuracy** | A small hand-checked test set (≈10 results filings → 40 numbers; ≈50 filings → category labels). Report accuracy and compare "rules only" vs. "rules + cheap model" in the README/deck. | Proves it works with numbers instead of claims. Exactly what an AI-engineer hiring panel looks for; very few candidates will do it. | Low–Med | ✅ Spice #2 |
| A17 | **"How FINN thinks" page + 3-step first-run tour** | One screen explaining the ranking rules, governance weights, model routing and cost per analysis; a short tour on first open. | Judges understand the design point of view in 20 seconds instead of discovering it by accident. | Low | ✅ Spice #3 |
| A18 | **Evidence sheet** | Tapping any citation opens a bottom sheet with the exact quote, document name and page, plus "Open PDF at p. N". | Makes "every claim is traceable" tangible in one tap. | Low | ✅ Core (part of A5) |
| A19 | **Contextual "Ask about this"** | On a ledger row only: one follow-up question answered strictly from that transcript excerpt. | Gives the "ask it" feel of Pull without becoming an open chatbot. | Medium | ⏳ Stretch |

---

## B. Interaction model & design

| # | Decision | Options | Recommendation | Why |
|---|---|---|---|---|
| B1 | Primary interaction model | Chat-first · Dashboard · Feed · **Briefing + focused tools** | ✅ **Briefing (Push) + one focused research tool (Pull)**, no general chat. *Brief* = a curated, finite screen of today's material items. *Research* = type or pick a ticker → FINN runs a fixed, structured analysis (Promise Ledger) and shows a report. The user's only inputs are choices (ticker, window, thresholds), not prompts. | A strong point of view: investors need a finished briefing and a sharp instrument, not another chat box. Structured output is also easier to verify and cite than free chat. |
| B2 | Navigation | Hamburger · **Bottom tab bar** | ✅ 3 tabs: **Brief · Research · Watch** (settings/thresholds) | Thumb-reachable on phones; three tabs map one-to-one to Push, Pull and thresholds. |
| B3 | Visual language | Colourful fintech · **Calm editorial** | ✅ Typography-led, neutral palette, colour only for meaning (red = governance/miss, amber = watch, green = delivered) | "No AI slop": density with restraint. Feels like a research note, not a trading app. |
| B4 | Theme | Light · Dark · **Both (follows system)** | ✅ Both | Investors read early morning and late night (results come after hours). |
| B5 | Delivery format | Native app · **PWA (installable web app)** | ✅ PWA | One codebase, instant link for judges, "Add to Home Screen" gives an app feel; no app-store review. |
| B6 | Login | Accounts · **None (single demo portfolio)** | ✅ None; thresholds saved in the browser | Judges must try it in 10 seconds. Writeup notes multi-user as "next". |
| B7 | Empty-state handling | Show nothing · **Smart default window** | ✅ If last 24h is empty, say so and offer 7d with one tap | Judges may test on a quiet day; an empty screen looks broken. |
| B8 | Editable portfolio | Fixed demo portfolio · **Demo portfolio + add/remove** | ✅ Ships with the demo portfolio; user can add any NSE ticker or remove one; "Reset to demo" button. Portfolio list saved in the browser; filing data stored once per ticker in the shared database. Adding a ticker triggers an on-demand backfill (last 30 days of filings + prices) with visible progress, and the ticker joins the scheduled refresh. | Lets judges test Push on companies they choose (same "works on any ticker" spirit as Pull). Shared per-ticker storage means no accounts and no duplicate work. |
| B9 | Disclaimer | ✅ Small footer: "Research aid, not investment advice. Sources: company filings." | Professional and expected for a finance product. |

---

## C. Data sources

| # | Data | Options | Recommendation | Why |
|---|---|---|---|---|
| C1 | Corporate announcements | **NSE API** · BSE API · both | ✅ **NSE primary** *(revised after spike: BSE API blocks cloud IPs, NSE works from Vercel Mumbai — see 03 doc)* | NSE commonly blocks cloud/datacenter IPs and needs cookie handshakes; BSE's JSON feed is usually more lenient. Verify in spike. |
| C2 | EOD price & volume | **yfinance** · NSE bhavcopy | ✅ yfinance, batched once a day | Suggested by the brief; one batch call for 20 tickers; cached. |
| C3 | Concall transcripts & annual reports | **Screener.in document links** · company IR sites | ✅ Screener for discovery of links; PDFs fetched from the exchange/company URLs it points to | Suggested by the brief; one place to find links for any ticker (needed for R5). |
| C4 | Reported quarterly numbers (for "Delivered") | LLM extraction from PDFs · **Screener's standardised quarterly table** | ✅ Screener table as the numbers source; results filing used for the Results card and cross-check | Deterministic numbers, no LLM error on maths ("LLMs read words; code does maths"). |
| C5 | Management bio (stretch) | LinkedIn scrape · **Filing's own disclosed profile** + optional web search | ✅ Filing first | LinkedIn blocks scraping and its terms forbid it; appointment filings typically include a brief profile (verify on a real filing). |
| C6 | Portfolio selection | Hand-picked · **Event-coverage scan** | 🧪 Scan last ~30 days of filings, pick a hybrid set covering most event types | Brief: "pick a mix that makes for an interesting demo"; defensible method. |
| C7 | Ticker identity | NSE symbol only · **NSE symbol ↔ BSE scrip code ↔ ISIN map** | ✅ Build one lookup table from the exchanges' public equity lists, joined on ISIN | BSE's announcement feed uses numeric scrip codes, yfinance uses `SYMBOL.NS`, screener uses the NSE symbol. Without this map, "add any ticker" breaks. |

---

## D. AI pipeline, model routing & cost

**Principle:** rules first → cheap model for bulk reading → strong model only for judgment → cache by content hash (filings never change).

| # | Step | Recommendation | Why |
|---|---|---|---|
| D1 | Filing classification | ✅ **Cascade:** (1) rules on BSE category + subject keywords handle the clear cases (trading-window closure, newspaper ads, compliance certificates) at zero cost; (2) cheap model reads page 1 only for ambiguous titles ("General Updates", "Outcome of Board Meeting") | Solves P2 (titles lie) while keeping LLM calls to the minority of filings. The cascade itself is a writeup talking point. |
| D2 | Materiality ranking | ✅ Deterministic score = category weight (governance high) × portfolio relevance + small model's one-line reason | Explainable, tunable, cheap; the LLM only writes the "why" line. |
| D3 | Results extraction | ✅ Cheap multimodal model reads the results PDF → strict JSON (Rev, EBITDA, PBT, PAT × 3 periods, standalone/consolidated, page); then **code** checks arithmetic and computes QoQ/YoY | Structured output + deterministic checks catch errors without a second LLM call. |
| D4 | Guidance extraction (per transcript) | ✅ Cheap model, chunked by transcript section (management remarks vs. Q&A), outputs promises with quote + page | Bulk reading of long documents is exactly where cheap models belong. |
| D5 | Verdicts & drift | ✅ Stronger model, given only the extracted ledger + numbers (a few KB, not the transcripts) | Reasoning where it matters, on a tiny input → low cost. |
| D6 | Model provider | ❓ Default: **Google Gemini API free tier** (Flash-class for bulk, Pro-class for reasoning; native PDF input). Fallback: **Groq** free tier (open models, very fast). | Free, generous, native PDF reading removes a fragile PDF-parsing step. If you have paid credits elsewhere (Claude/OpenAI), we can use them for D5 only. Exact current model names and quotas get checked at setup. |
| D7 | Caching | ✅ Cache every extraction keyed by PDF URL + content hash; cache full analyses per ticker + latest transcript date | Filings are immutable, so a re-run costs nothing. Second viewer of the same ticker gets an instant result. |
| D8 | Guardrails | ✅ Prompts restrict the model to supplied text; any claim without a quote/page is dropped by code | Enforces R6 and P9 mechanically, not by trust. |

---

## E. Architecture & hosting (free tier)

**Key insight:** Push is **batch** by nature (EOD prices + the day's filings), so we precompute it on a schedule; the app just reads results, so it's instant and never depends on a live scrape. Pull is **on-demand**, so it needs a live pipeline, broken into short steps that fit serverless time limits and are cached.

```
GitHub Actions (cron, daily + intraday) ── Python ingest ──► classify / extract (LLM) ──► Database
                                                                                      ▲
Phone (PWA) ◄── Next.js on Vercel ──── reads Digest ──────────────────────────────────┘
                     │
                     └── Pull: step-by-step API calls (find transcripts → extract each → verdict) ──► cache in Database
```

| # | Decision | Options | Recommendation | Why |
|---|---|---|---|---|
| E1 | Frontend hosting | **Vercel** · Cloudflare Pages · Netlify | ✅ Vercel (Hobby) | Best Next.js support, instant deploys, preview URLs to test on a phone. |
| E2 | Push ingest runner | **GitHub Actions cron** · Render cron · local | ✅ GitHub Actions (free on public repos) with Python | Free scheduled compute; Python ecosystem (yfinance, PDF libraries); the workflow file itself documents the pipeline. Fallback: run locally and push the results. |
| E3 | Pull execution | Vercel functions (client-orchestrated steps) · Python backend on Hugging Face Spaces / Render | 🧪 **Vercel functions, one step per call**, if the spike shows Vercel can reach screener/BSE; otherwise a small FastAPI on Hugging Face Spaces | Keeping everything on Vercel = one deploy, no cold-start sleep. Each step stays inside function time limits; progress is shown per step (A9). |
| E4 | Database / cache | Supabase · Neon Postgres · **Vercel Blob (JSON documents)** | ✅ **Vercel Blob, private store `finn-store` in Mumbai** *(final, 15 Nov — replaces Neon below: all our data is key-addressed documents, so no database is needed; Blob is native to Vercel, created from the CLI, no third-party terms)*. ~~Neon free tier, created from inside Vercel~~ | One click from the Vercel dashboard (no extra account to manage), connection string auto-added to Vercel env vars; also reachable from GitHub Actions. Wakes in about a second instead of pausing for a week like Supabase's free tier. *(Changed from Supabase on 15 Nov: fewer accounts, you currently only have GitHub.)* |
| E5 | Secrets | ✅ API keys only in Vercel/GitHub encrypted env vars; never in the client | Basic hygiene; judges will read the repo. |

---

## F. Tech stack

| # | Layer | Recommendation | Why |
|---|---|---|---|
| F1 | Frontend framework | ✅ **Next.js (App Router) + TypeScript** | Server routes and UI in one deploy; strong mobile/PWA support. |
| F2 | Styling / components | ✅ **Tailwind CSS + shadcn/ui** (heavily restyled) | Fast to build, accessible primitives, easy to make dense and calm. |
| F3 | Charts | ✅ Minimal: hand-rolled SVG sparklines + one small chart library for the drift timeline | Few charts on purpose (no TA); keeps the bundle light on phones. |
| F4 | Ingest language | ✅ **Python** (yfinance, requests, pdf tools) | Best ecosystem for market data and PDFs. |
| F5 | LLM SDK | ✅ Official Gemini SDK behind one thin `llm()` wrapper with model-tier parameter (`cheap` / `strong`) | Routing becomes one line; switching providers stays possible. |
| F6 | Validation | ✅ Zod (TS) / Pydantic (Python) schemas for every LLM output | Structured output is validated, not trusted. |

---

## I. Domain details that are easy to get wrong

Small things a finance reader notices immediately. Getting them right signals care; getting them wrong undermines trust in everything else.

| # | Detail | Decision | Why |
|---|---|---|---|
| I1 | **EBITDA is not printed in results filings** | ✅ Compute it: **EBITDA = PBT + finance costs + depreciation & amortisation − other income**, excluding exceptional items *(other income subtracted, revised 15 Nov after design review)*; label "computed" with the formula in the evidence sheet | Indian SEBI-format results show revenue, expenses, PBT, tax, PAT, but rarely EBITDA. Inventing a number silently would break trust. |
| I2 | **Units differ** (₹ lakh vs. ₹ crore vs. ₹ million) | ✅ Extract the stated unit, normalise everything to ₹ crore | Mixing units produces wildly wrong growth figures. |
| I3 | **Standalone vs. consolidated** | ✅ Prefer consolidated when present; always label which | Many filings contain both; investors care about consolidated for groups. |
| I4 | **Indian fiscal quarter labels** | ✅ Show "Q2 FY27 (Jul–Sep 2026)" | FY runs Apr–Mar; the label alone confuses, the months remove doubt. |
| I5 | **Duplicate & revised filings** | ✅ Deduplicate by company + subject + attachment hash; mark revisions/corrigenda | Same announcement can appear twice or be refiled; duplicates look like noise. |
| I6 | **Bonus/split days distort price & volume** | ✅ Use adjusted prices; suppress move alerts on ex-dates we already know from filings | Otherwise FINN would raise a false "unexplained move" on every split. |
| I7 | **"Recent average volume" definition** | ✅ 20 trading-day average, excluding the current day; skip market holidays | Standard, explainable, and stated in the Watch settings. |
| I8 | **Time zone** | ✅ All windows in IST; filing timestamps from the exchange | "Last 24h" must mean the investor's 24 hours. |
| I9 | **Transcript lag** | ✅ If the latest call's transcript isn't published yet, say "Q2 transcript not yet published — using up to Q1" | Transcripts often appear 1–2 weeks after the call; silent omission would look like a bug. |
| I10 | **Banks & NBFCs** | ✅ Results card shows a clear "EBITDA not meaningful for lenders" state (bank card is stretch) | Honest handling beats a meaningless number. |
| I11 | **Polite scraping** | ✅ Cache everything, rate-limit, identify a generic user agent, never re-download an unchanged PDF | Respects the sources and keeps us from being blocked mid-demo. |

---

## G. Reliability & demo safety

| # | Decision | Recommendation | Why |
|---|---|---|---|
| G1 | Demo tickers | ✅ Precompute Promised vs. Delivered for the 3–5 research companies | Judges see an instant, polished result first; live runs for other tickers prove generality (R5). |
| G2 | Failure states | ✅ Designed states for: no transcripts, scrape blocked, model quota hit (falls back to cached or to fallback provider) | "A demo that doesn't run is the worst outcome." |
| G3 | Data freshness label | ✅ "Data as of 15 Nov, 18:30 IST" on every screen | Honesty; avoids judges thinking it's broken on a quiet day. |
| G4 | Testing on mobile | ✅ Chrome devtools at 375px during build + real-phone check on each deploy | R2. |

---

## H. Process & submission

| # | Decision | Recommendation | Why |
|---|---|---|---|
| H1 | AI build history | ✅ Keep this Claude Code session as the main thread; export the transcript at the end | Brief asks to see how you work with AI tools; discovery → scope → build in one place tells that story. |
| H2 | Repo hygiene | ✅ Public GitHub repo, README with architecture diagram, setup steps, decision summary, and `docs/` (these files) | Judges grade architecture and judgment; the docs show both. |
| H3 | Writeup structure | ✅ What we built · who for · key decisions & trade-offs · what we left out · cost numbers · what's next | Mirrors the brief's own list. |
| H4 | Deck | ✅ Personas → problem map → prioritisation → solution → architecture → cost → left out → next | Built from 01 and 02 docs. |
| H5 | Build order | ✅ (1) data spike → (2) thin end-to-end deploy → (3) Digest quality → (4) Promised vs. Delivered → (5) polish → (6) docs/deck/email | Working link exists from early on; quality is added on top. |

---

## Answers & remaining setup

| Question | Answer (15 Nov) | Consequence |
|---|---|---|
| Submission cut-off | End of day, 15 Nov | Core first, deploy early; spice only after a working deploy |
| Paid API credits | None | 100% free tiers: Gemini (main), Groq (fallback) |
| Accounts | GitHub only | Need: **Vercel** (sign in with GitHub) → create **Neon** DB from Vercel Marketplace; **Google AI Studio** API key (any Google account); Groq key optional |

### Build priority (final)
1. Core: Smart Digest + Results card + unexplained-move alert + Promise Ledger + citations/evidence sheet + editable portfolio
2. Spice #1: Results vs. Promises bridge (A15)
3. Spice #2: Evaluation harness (A16)
4. Spice #3: "How FINN thinks" + first-run tour (A17)
5. Stretch: Management card → Questions to ask → Bull/Bear → Bank card → Telegram push → Ask-about-this (A19) → audio brief
