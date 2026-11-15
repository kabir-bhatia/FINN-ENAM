# FINN — Final Scope Document

> **Purpose of this doc:** single source of truth for *what* we are building, *for whom*, and *why*. The deck and the submission writeup will be built from this.
> **Status:** Locked (15 Nov 2026). Changes need a written reason added to §9.

---

## 0. One-line summary

**FINN is a calm, mobile-first intelligence layer for a long-term, fundamental investment team: it tells them only what changed their investment thesis (Push), and checks whether management has kept its word (Pull) — every claim traceable to the primary source.**

---

## 1. The brief in brief

| Item | What ENAM asked for |
|---|---|
| Product | FINN — a mobile-first financial investment agent with two modes: **Push** (proactively tells you what changed and why you should care) and **Pull** (research on demand) |
| Core problem (their words) | *"The scarce skill is not aggregating information. It's filtering it."* |
| Data | EOD price/volume (yfinance), NSE/BSE corporate announcements, fundamentals (annual reports + concall transcripts via screener.in) |
| Companies | Mock portfolio of 15–20 NSE/BSE stocks + 3–5 ad-hoc research companies; **pull engine must generalise to any NSE ticker** |
| Grading | Creativity, product sense, judgment, architecture — **not completeness**. *"Thin-but-working beats broad-but-broken."* *"A demo that doesn't run is the worst outcome."* |
| Bonus | Cost efficiency: model routing, caching, chunking. Free tiers are enough. |
| Rule for Pull | Primary sources only — no news, broker notes, or the model's own outside knowledge |
| Bar | "No AI slop" — core, concise, beautifully presented, interactive; density and design both count |
| Submission | Deployed mobile link + GitHub repo + AI build history + short writeup → assessment@enam.com, subject **"IIT Delhi – AI Engineer - 2027"** |
| Minimum # of workflows | **None stated.** Brief calls the lists "a menu" and "illustrations, not a checklist". Implicit expectation: at least one Push and one Pull. |

---

## 2. Who we are building for

### 2.1 Why not retail investors
The brief never names the user explicitly, so we inferred it from evidence:

| Evidence | Inference |
|---|---|
| "We are a public-markets investment firm… a small team makes high-conviction decisions" | User is a professional on an investment team |
| "An AI-powered intelligence layer for **how we invest**" | ENAM is building this for itself |
| Vocabulary: EBITDA, PBT, concalls, guidance, narrative vs. numbers, pledging | Professional reader; retail users don't read concall transcripts |
| "You don't need finance expertise" | Addressed to the *builder*, not the user |
| Primary-sources-only discipline | How serious fundamental research works |
| ENAM philosophy: long-term, bottom-up, management quality, margin of safety, contrarian, unlevered | This mindset defines what "important" means |

**Decision:** Target = **professional, long-term, fundamental buy-side investor — specifically ENAM's own investment team.** Retail is out of scope. We do **not** simplify the finance; we cut **time and noise**.

### 2.2 Persona A — The Coverage Analyst
- **Who:** 3–8 yrs experience (CA/MBA), covers 15–20 companies across 2–3 sectors, owns each thesis, reports to partners.
- **Job to be done:** "Make sure nothing material is missed, and turn raw disclosures into a judgment the partners can act on."
- **Today:** scans NSE/BSE + terminals + WhatsApp groups each morning; copies results into Excel at night in results season; re-reads old transcripts before management meetings.
- **Pain points:** P1, P2, P3, P7, P8, P10 (see §3).
- **Needs:** completeness, speed, depth on demand, a source for every number.
- **Fear:** missing a material filing; passing a wrong AI number to a partner.
- **Success metric:** filing → "I know what it means" in minutes, not hours.

### 2.3 Persona B — The Partner / Decision-maker
- **Who:** 20+ yrs, makes allocation calls, meets promoters and managements; extremely time-poor, often on mobile between meetings.
- **Job to be done:** "Tell me if anything changed my thesis, and whether I need to act."
- **Pain points:** P4, P5, P6, P9, P10.
- **Needs:** ruthless prioritisation, governance first, one-screen answers, evidence one tap away.
- **Fear:** a governance red flag buried under routine paperwork.
- **Success metric:** time to "do I need to act?" < 1 minute.

### 2.4 The design tension → the design principle
Analyst wants **completeness**; Partner wants **brevity**. Same team, same product.
**Principle: "One product, two depths, always traceable."**
Every item has three layers: **Headline (5 sec, Partner) → Summary (30 sec, Analyst) → Source document/page (trust).**

---

## 3. Problem map (all problems identified)

| # | Problem | Side | Persona | Addressed now? |
|---|---|---|---|---|
| P1 | **Filing overload** — most daily filings are routine paperwork; material ones get buried | Push | Both | ✅ Smart Digest |
| P2 | **Uninformative titles** — "Outcome of Board Meeting", "General Updates" hide results, fund-raises, resignations; ranking by title fails | Push | Analyst | ✅ Classify on content, not title |
| P3 | **Results-season crunch** — many companies report in the same weeks, often after hours; manual extraction + QoQ/YoY maths | Push | Analyst | ✅ Results card |
| P4 | **"Who is this person?"** — new CFO/MD named with no context | Push | Partner | ⏳ Stretch (Management card) |
| P5 | **Unexplained moves** — price/volume spikes with no filing behind them | Push | Partner | ✅ "Unexplained move" alert (thin) |
| P6 | **Alert fatigue** — too many pings → all ignored | Push | Partner | ✅ User-set thresholds + finite digest |
| P7 | **No memory across quarters** — what did management promise 4 quarters ago? | Pull | Analyst | ✅ Promised vs. Delivered |
| P8 | **Quiet guidance drift** — targets reframed or dropped over time | Pull | Analyst | ✅ Promised vs. Delivered |
| P9 | **Trust** — professionals won't act on an uncited AI number | Both | Both | ✅ Citations everywhere (cross-cutting) |
| P10 | **Last-minute prep** — "meeting management in 15 minutes" | Pull | Both | ⏳ Partially (questions-to-ask, stretch) |

**Approach (standard PM practice):** show the full map → prioritise with explicit criteria → go deep on the chosen few → state what's parked and why.

---

## 4. Product principles (non-negotiable)

1. **Thesis-centric, not price-centric.** ENAM invests long-term and "does not oscillate with market cycles". A price move alone is not news. What matters is whether the business or management changed.
2. **Governance is top priority.** ENAM is "extremely focussed on the quality of management teams and governance frameworks". Pledging, auditor exits, KMP exits, insider selling, related-party transactions, regulatory orders rank near the top — never buried. A generic app treats these as minor; FINN doesn't.
3. **Every number is traceable.** Claim → document → page. No citation, no claim.
4. **Calm, finite, dense.** An inbox you can finish, not a feed you scroll. Few colours, used only for meaning.
5. **LLMs read words; code does maths.** Numbers, growth rates and comparisons are computed deterministically, never generated.
6. **Cheapest model that does the job.** Rules first, small model for bulk, strong model only for judgment. Cache everything immutable.

---

## 5. Workflow selection

### 5.1 Scoring (1–5)
**Criteria:** Pain = size of investor pain; Creative = room for an original solution; Explain = how easy to justify from first principles; Risk = build risk on free tier (tiebreaker).

**Push**
| Workflow | Pain | Creative | Explain | Risk | Verdict |
|---|---|---|---|---|---|
| **Smart Digest** (windowed, prioritised, routine collapsed) | 5 | 5 | 5 | Med | **✅ CHOSEN** |
| Material-type alerts | 4 | 2 | 4 | Low | Included (filter on Digest) |
| Price/volume alerts | 2 | 4* | 3 | Low | ✅ Thin add-on, reframed as "unexplained move" |
| **Results card** (Rev/EBITDA/PBT/PAT, QoQ/YoY) | 5 | 3 | 5 | Med | **✅ CHOSEN as Digest's flagship card** |
| Management-change card (bio) | 4 | 4 | 5 | High | ⏳ Stretch |

**Pull**
| Workflow | Pain | Creative | Explain | Risk | Verdict |
|---|---|---|---|---|---|
| Business snapshot | 2 | 2 | 3 | Low | ❌ Analyst already knows their companies |
| Financial snapshot | 2 | 1 | 3 | Low | ❌ Screener already does this well |
| Trajectory | 3 | 2 | 3 | Low | ❌ Commodity chart |
| Balance sheet | 3 | 2 | 3 | Low | ❌ Commodity |
| Cash quality | 3 | 3 | 4 | Low | ⏳ Possible later add-on (red-flag angle) |
| **Promised vs. Delivered** | 5 | 5 | 5 | Med-High | **✅ CHOSEN** |
| Guidance | 4 | 3 | 4 | Med | Included (step 1 of Promised vs. Delivered) |
| Bull vs. Bear | 3 | 3 | 3 | Med | ⏳ Stretch — only if built *from* the evidence ledger |

### 5.2 Why these two
- **Smart Digest** directly attacks the brief's central claim ("filtering is the scarce skill") and the Partner's most frequent moment (morning triage). Covers P1, P2, P3, P5, P6.
- **Promised vs. Delivered** is what the brief calls *"the kind of thing we value most"* and maps to ENAM's "invest in management" philosophy. Covers P7, P8, P9. Hours of manual work that rarely gets done properly.
- **Each contains other menu items** — the Digest contains alerts and the results card; Promised vs. Delivered contains Guidance and can feed Bull vs. Bear. One pipeline, several menu items.
- **Each also showcases a graded skill:** Digest → judgment about materiality; Promised vs. Delivered → cost-efficient LLM pipelines over long documents (routing, chunking, caching).

---

## 6. Final scope

### 6.1 In scope (must ship)
| Feature | Description | Success criteria |
|---|---|---|
| **Smart Digest** | All filings for the portfolio in a chosen window (default 24h; 7d/30d selectable), ranked by thesis impact; governance always surfaces; routine items collapsed into one line | Partner sees what matters in < 1 min; every card links to the original filing |
| **Results card** | Revenue, EBITDA, PBT, PAT — this quarter vs. last quarter (QoQ) and vs. same quarter last year (YoY), extracted from the results filing | Numbers match the filing; source shown; standalone vs. consolidated labelled |
| **Unexplained-move alert** | EOD volume > N× recent average or price beyond ±X% **with no filing** that day | Thresholds user-configurable; explained moves are linked to their filing |
| **Promised vs. Delivered** | For any NSE ticker with transcripts: guidance from the last ~4 concalls set against reported numbers; a verdict per promise | Every promise cites transcript + page; graceful message if no transcripts exist |
| **Citations + evidence sheet** | Cross-cutting: every number/claim → source document (+ page where possible); tap opens quote, document and page | No uncited claim on screen |
| **Editable portfolio** | Demo portfolio by default; add any NSE ticker or remove one; "Reset to demo". Adding triggers a 30-day backfill with visible progress | Judges can test Push on a company they choose |

**Interaction model (clarified):** no general chatbot. *Brief* is a curated, finite screen; *Research* is "pick a ticker → structured report". The user's inputs are choices (ticker, window, thresholds), not prompts.

### 6.2 Spice — differentiators, built right after the core works
1. **Results vs. Promises bridge:** when results land, the Results card says whether they met management's own guidance. Links Push and Pull into one memory.
2. **Evaluation harness:** small hand-checked test set; publish extraction and classification accuracy (rules-only vs. rules + model) in README and deck.
3. **"How FINN thinks" page + first-run tour:** explains ranking, governance weights, model routing and cost in 20 seconds.

### 6.3 Stretch (only if time allows, in this order)
1. Management-change card (bio from the filing itself, web enrichment optional)
2. "Questions to ask management" generated from gaps in the ledger (pre-meeting prep, P10)
3. Bull vs. Bear built from the evidence ledger
4. Bank/NBFC results card (NII, NIM, GNPA instead of EBITDA)
5. Real push delivery (Telegram bot / Web Push)
6. Contextual "Ask about this" on a ledger row (answered only from that transcript excerpt)
7. 60-second audio brief (browser text-to-speech)

### 6.4 Out of scope — and why
| Left out | Why |
|---|---|
| Live tick data, intraday charts | Long-term investor; intraday noise is exactly what FINN filters out |
| Technical-analysis charts / indicators | Not how a bottom-up fundamental investor decides |
| Buy/sell buttons, order flow | FINN is an intelligence layer, not a trading app; decisions stay with humans |
| News feeds, broker notes | Brief bans secondary sources for Pull; for Push they add noise, not signal |
| Retail-style simplification / explainers | Users are professionals; simplifying would slow them down |
| General-purpose chatbot | Every submission will have one; hard to ground and cite; a finished briefing + structured research is a clearer point of view |
| Accounts / login | Judges must be able to try it instantly on a phone |
| EBITDA card for banks | EBITDA isn't meaningful for lenders; handled in stretch with sector metrics or excluded explicitly |

---

## 7. Companies

### 7.1 Portfolio style — Hybrid (chosen)
| Option | Pros | Cons |
|---|---|---|
| A. Large-cap diversified | Reliable data (transcripts, clean PDFs, complete prices); high filing volume; recognisable names | Generic (every candidate will pick these); doesn't match ENAM; AI adds less value where many analysts already cover; many are banks (no EBITDA) |
| B. ENAM-style mid/small caps | Shows homework; AI adds most value where coverage is thin; governance events more frequent | Missing transcripts; scanned PDFs; few filings/day (empty digest risk); patchy prices; copying ENAM's actual book feels presumptuous |
| **C. Hybrid ✅** | Reliability of A + relevance of B | Slightly more selection effort |

**Composition:** ~13–15 liquid large/mid caps across sectors + 3–5 ENAM-*like* (not ENAM's actual) mid caps.
**Selection method:** data-driven — scan the last ~30 days of announcements and pick companies that together cover the most event types (results, management change, pledging, M&A, fund-raise, litigation…).
**Writeup line:** *"Large caps make the demo reliable, ENAM-style mid caps make it relevant, and selecting for event coverage makes it interesting."*

### 7.2 Ad-hoc research set (3–5)
Chosen for: ≥4 recent concall transcripts available, management that gives explicit numeric guidance, and at least one case where delivery diverged from guidance (to show the tool catches it). Final list fixed during the data spike.

---

## 8. Key risks

| Risk | Mitigation |
|---|---|
| NSE blocks cloud IPs | Prefer BSE feed; precompute on schedule; local-run fallback with committed data |
| Empty digest on the day judges test | Window picker (24h/7d/30d); scheduled refresh; seeded recent data |
| Transcripts missing for a ticker | Explicit "no transcripts found" state; never fabricate |
| LLM extraction errors on numbers | Arithmetic consistency checks; cross-check with screener's standardised table; always show source |
| Free-tier rate limits / cold starts | Cache everything; precompute demo tickers; stream progress for live runs |
| Time (deadline 15 Nov 2026) | Deploy a thin end-to-end version first, then improve |

---

## 9. Decision log

| Date | Decision | Reason |
|---|---|---|
| 13 Nov | Target user = ENAM's investment team (Analyst + Partner) | Evidence in §2.1 |
| 13 Nov | Thesis-centric, governance-first principles | ENAM's stated philosophy |
| 13 Nov | Build 1 Push + 1 Pull first | Brief: "nail one or two workflows" |
| 15 Nov | Push = Smart Digest (+ Results card); Pull = Promised vs. Delivered | Scoring in §5 |
| 15 Nov | Hybrid portfolio, selected by event coverage | §7.1 |
| 15 Nov | Leave out ticks, TA charts, trading, news, general chatbot | §6.4 |
| 15 Nov | Add editable portfolio (add/remove + reset) | Judges can test Push on their own picks |
| 15 Nov | Add 3 spice items: Results vs. Promises, evaluation harness, "How FINN thinks" | Visible differentiation + proof of quality |
| 15 Nov | Add "Not yet due" verdict; compute EBITDA; normalise units; ISIN ticker map | Domain correctness (see 02 doc §I) |
| 15 Nov | Neon (via Vercel) instead of Supabase | Fewer accounts; no week-long pause |
| 15 Nov | Deadline = EOD 15 Nov; no paid API credits | Free tiers only; deploy a thin version first |
