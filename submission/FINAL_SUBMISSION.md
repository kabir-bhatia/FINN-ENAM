**To:** assessment@enam.com
**Subject:** IIT Delhi – AI Engineer - 2027

---

Dear ENAM team,

Please find my submission for the FINN AI Engineer Build Challenge.

**Links**
- **App (open on a phone):** https://web-lake-chi-14.vercel.app (no login; Share → Add to Home Screen installs it, and notifications can then be turned on in Settings)
- **GitHub repository:** https://github.com/kabir-bhatia/FINN-ENAM
- **AI build history and artifacts (Google Drive):** `[DRIVE LINK]` — the full Claude Code conversations (3 chats, exported to Markdown, keys removed), planning docs, every design round, and the design-review notes
- **Attached:** *FINN — Product and Decisions* (PDF, 9 pages): every key decision, with the reasoning and the trade-off

**What I built**

FINN is a calm, mobile-first intelligence layer for a long-term, governance-first investment team. I read the brief as written for ENAM’s own analysts and partners, not retail users, so FINN cuts time and noise rather than simplifying the finance.

- **Push: Home.** Every exchange filing across an 18-company portfolio, classified and ranked by thesis impact. Governance always comes first, the investor’s own price and volume rules come next (shown only when no filing explains the move), and routine paperwork folds into one line. The page ends with “You’re caught up”. Real phone notifications cover red flags and rule hits, plus a morning and evening brief. Results cards show Sales, EBITDA, PBT and PAT vs last quarter and last year.
- **Pull: Track record, for any NSE ticker.** FINN reads the last 4 earnings-call transcripts and lists every checkable promise with its exact quote and page. It then judges each one against reported numbers (Kept, Missed, Target changed, Went silent or Too early), with a said-vs-reported view and questions to ask management. Ad-hoc examples outside the portfolio are Asian Paints, Pidilite and Britannia; you can also search any company you like.

**Key decisions and trade-offs**
- **Two workflows, done deeply.** A finished, explainable briefing (Push) and one structured research instrument (Pull), linked by the results card: when results land, FINN shows them against management’s own guidance. Ranking is deterministic and shows its reason (e.g. the rule that fired), and governance is never collapsed.
- **Models read words; code does maths and owns quotes.** No model produces a number. A promise appears only if code finds its quote word-for-word on the cited page, so a few genuine promises are lost to messy PDF text rather than risking invented ones.
- **Cheapest model that does the job.** Rules classify 79% of filings at zero cost. A small model reads only the exchange’s short summary for the rest, and judgment runs on a few KB of extracted ledger, not whole transcripts. Everything immutable is cached for every user. GLM 5.3 flash is the main model, with Gemini as an automatic fallback, all on free tiers. Classifying 366 filings would cost about ₹1 at paid prices; the actual cost was ₹0.
- **No database and no separate backend.** It runs as Next.js on Vercel with Vercel Blob documents. Push is precomputed on a schedule, so Home never waits on a live scrape.
- **Data was proved with a spike first.** The BSE API blocks cloud servers, so filings come from NSE. Reported numbers come from Screener’s standardised table, so results are deterministic for every ticker.

**What I deliberately left out:** intraday and technical charts, news and broker notes, business and balance-sheet snapshots (Screener does these well; I spent the time on promised vs. delivered), and logins. Not yet built: bios for newly appointed executives, NSE’s separate pledge feed, and a published accuracy test set.

**Where I’d take it next:** an evaluation harness with published accuracy; management-change cards built from the appointment filing’s own profile; annual-report red flags (cash conversion, related parties, auditor remarks); “ask about this” on a single promise, answered only from its transcript excerpt; and a team mode with a shared portfolio and notes.

I built FINN with Claude Code as a coding agent. I started with product discovery and a written decision log, ran a data spike before writing any app code, went through four design rounds driven by phone testing, and deployed after every round. The Drive folder shows that process end to end.

Thank you for your time. I would be glad to walk you through it.

Best regards,
Kabir Bhatia
IIT Delhi
