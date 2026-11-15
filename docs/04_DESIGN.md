# FINN — Design Language & Navigation

> Visual source of truth: the **FINN Design System** canvas — https://claude.ai/artifact/2jcSDWjGcdMULktsQGYFsg (13 phone screens, theme board, navigation map; screens are clickable in Play mode).
> Status: **Partially approved (15 Nov 2026).** Approved: colour language, type, motion, three-tab structure, screen set. Not yet approved: wording, labels and how easy the app is to understand — see §8 "Clarity pass".

## 1. Concept — "Annotated ledger"
Ink on paper, with one highlighter. The app should feel like a well-kept research note, not a trading app.
- **Colour appears only when it means something.** Interface chrome is monochrome (ink on a warm-grey ground); colour is reserved for meaning (governance, verdicts, direction).
- **The highlighter is the signature.** Every quoted line from a filing or transcript is highlighted exactly like an analyst marks a PDF. It doubles as the visual cue for "this is evidence".

## 2. Colour tokens

| Token | Light | Dark | Used for |
|---|---|---|---|
| ground | `#F3F3EF` | `#0F1012` | Page background |
| surface | `#FFFFFF` | `#17191C` | Cards, sheets, tab bar |
| sunk | `#EAEAE4` | `#202328` | Chips, inputs, secondary buttons |
| ink | `#15171B` | `#ECECE6` | Text, primary buttons, active tab |
| ink2 | `#4C515A` | `#B4B8BF` | Secondary text |
| ink3 | `#656A73` | `#8D929B` | Labels, timestamps |
| line | `#DEDDD6` | `#2A2D33` | Hairlines |
| act (+bg) | `#B3261E` / `#FBEAE7` | `#FF8A7A` / `#3A1C19` | Needs you, governance, missed, down |
| watch (+bg) | `#8A5300` / `#FBF0DC` | `#E8B45A` / `#33260F` | Worth knowing, unexplained move, goalposts moved |
| good (+bg) | `#1E6B3A` / `#E4F1E7` | `#74C98F` / `#14301E` | Delivered, up |
| quiet (+bg) | `#5B6270` / `#ECECE7` | `#9AA1AD` / `#24272C` | Routine, dropped, not yet due |
| mark | `#FFE27A` | `#5E4B0B` | Highlighter behind quoted evidence |

**Why these colours (and not the usual AI palette):** no purple/violet/electric-blue accent, no gradients or glow. Primary actions are plain ink, so the only saturated colours on screen are the ones carrying a signal. Text colours were picked to clear 4.5:1 contrast on their backgrounds. Every coloured state also carries a word (NEEDS YOU, MISSED…) or an arrow (▲▼), so colour is never the only signal.

## 3. Type
- **IBM Plex Sans** for UI text (28/600 screen titles, 17/600 card headlines, 15/400 body, 11/600 caps labels).
- **IBM Plex Mono** for every number and ticker — tabular figures make columns line up, and it reads as "data" at a glance.
- Why Plex: institutional, highly legible on small screens, free, and not the Inter/Space Grotesk default most AI apps ship with.

## 4. Motion (fast and snappy)
- 160 ms ease-out for taps, list changes, tab switches.
- 240 ms spring for bottom sheets; drag down to close.
- Cards enter with a fade + 8 px rise; no bouncing.
- Cached screens render in < 200 ms; live work shows a **step list**, never a spinner.
- Honour the OS reduced-motion setting.

## 5. Layout & touch rules
- Designed at 390 × 844 first; single column; 20 px side gutters.
- Every touch target ≥ 44 px; primary buttons 48–50 px tall, full contrast (ink on ground).
- Bottom tab bar (76 px incl. safe area) on every main screen: **Brief · Research · Watch**. No hamburger menu.
- Sheets for quick choices (time window, evidence, add company); full screens for reading (results, ledger, promise).

## 6. Navigation map (summary)
- **Brief** → time-window sheet · results detail (→ evidence, → promise ledger) · other filing card (→ evidence) · routine list.
- **Research** → (new company) running → promise ledger → promise detail → evidence. Analysed companies open the ledger instantly.
- **Watch** → add-company sheet (→ back to Brief with the new company) · How FINN thinks · thresholds & categories edited in place.
- Header ⓘ on the Brief also opens How FINN thinks. First open shows a 3-step tour.
- Every screen is at most two taps from a tab.

## 7. Screens on the canvas
Brief (light + dark) · Results detail · Time-window sheet · Evidence sheet · Research home · Research running · Promise ledger (light + dark) · Promise drift detail · Watch · Add-company sheet · How FINN thinks · Theme board · Navigation map.

## 13. FINAL design — "Clear Day" hybrid (approved by user, 16 Nov) — BUILD THIS

**User's decisions:** A (Clear Day) is the base — its portfolio ring and its bottom nav are liked ("like an actual production app"). Keep B's company page (Night Desk — Company) and C's company page (Morning Paper — Company) ideas. B's heat map is cluttered: **do not build it now** (low-priority later improvement).

**Visual language = A everywhere** (one app, one look). Reference mockups: `web/.canvas/project/V4AHome.dc.html`, `V4ACompany.dc.html`, `V4BCompany.dc.html`, `V4CCompany.dc.html`.

**Tokens (light):** ground `#F4F7FB` · card `#FFFFFF` · sunk `#E7EDF5` · navy ink `#0B2545` · ink2 `#5A6B82` · ink3 `#8493A8` · line `#E3E9F1` · accent teal `#0FA3A3` (text-on-light teal `#0A7C7C`, tint `#E3F5F5`) · watch amber `#F2A900` (text `#8A5F00`, tint `#FFF4D6`) · act red `#E5484D` (text `#C8323A`, tint `#FDECEC`) · sector blue `#5B8DEF` · quiet `#C5D0DE` · highlight (quotes) `#FFE9A8`.
**Tokens (dark, for the Settings toggle):** ground `#0A1626` · card `#122238` · sunk `#1A2E49` · ink `#EAF0F8` · ink2 `#A9B8CC` · ink3 `#7F90A8` · line `#213754` · teal `#3DD6C6` · amber `#F5BE4B` · red `#FF7A7E` · highlight `#5A4A12`.
**Type:** Plus Jakarta Sans (400/500/600/700); numbers use tabular figures (`font-variant-numeric: tabular-nums`). **Shape:** cards radius 20–24, soft shadow `0 6px 24px rgba(11,37,69,.06)`, pills radius full, buttons ≥ 44 px. **Motion:** unchanged (§4). Every colour signal also has a word or arrow.

**Navigation (from A):** bottom bar, 5 slots — **Home · Companies · [centre teal Search button, raised] · Alerts · Calendar**. Settings = icon button top-right of Home. Search opens a full-screen search for any NSE company → company page.

**Home (from A, plus C's lead):**
1. Greeting + date; settings button.
2. **Portfolio card:** ring of company states (unchanged / worth a look / challenged, centre = company count) with legend; three stat tiles — **promises kept %** (across cached track records), **governance flags**, **filings read**; **sector mix** bar with legend; "since <last looked>" window control.
3. **The lead (from C):** 2–3 sentence written summary with highlighted facts; each highlight opens its source. Templated from data; on a quiet day it says so plainly ("Nothing material across 18 companies; 12 routine filings checked").
4. **Needs your attention:** event cards with icon tile, company · type, one-sentence headline, promise mini-bar where relevant ("Against their word").
5. **Coming up:** next results / earnings calls (also feeds the Calendar tab).
6. Routine filings collapsed; "You're caught up · next brief …".
Home must look complete on a quiet day: ring, stats, sector mix and Coming up always render.

**Company page (A's frame + C's Results + B's Track record):**
- Header (A): back, "✓ In portfolio" pill, name, sector · followed-for; navy hero card with **promises-kept ring** and breakdown → Track record.
- Segments: Updates · Results · Track record · Governance.
- **Results (from C):** one-sentence headline; 4-metric strip (Sales, EBITDA, PBT, Profit vs last year, toggle vs last quarter); profit bar chart, last 5 quarters (A); management **pull-quote with highlight** and page; "Against their word" box.
- **Track record (from B):** **said vs reported table** per quarter; small line chart (guided dashed vs reported solid); **ledger rows** = status word (Kept / Missed / Target changed / Went silent / Too early) + promise + source page; "Questions to ask management" button.
- **Governance:** the four-tile strip from v3.
- Evidence sheet from any number or quote (unchanged).

**Other screens:** Companies list, Alerts (rules), Settings, Ask sheet, long-press remove — keep behaviour from v3 (§11), restyled with these tokens. **Calendar** (new, simple): upcoming results/board meetings/calls for portfolio companies by date.

**Not now:** heat map; audio brief; Night Desk / Morning Paper colour themes.

## 12. v4 — three new visual directions (drawn 16 Nov; user picked the hybrid in §13)

**Why:** the shipped app (git tag `design-v3-shipped`, canvas page v3) works but looks like a generic AI app, and on a quiet day Home is an empty grey screen ("0 challenged · 18 unchanged · caught up"). The home needs a **portfolio summary that is alive every day**, not only a list of events.

**Research used:** Lollypop investment-dashboard guide (summary header, donut labelled with value + %, sparkline holding cards, never red/green alone); Fey (dense pro look, ticker command, progressive disclosure); Quartr (event calendar, calls, alerts one tap from the watchlist, answers linked to source); Finimize (For You / Research / News tabs, audio brief with mini-player); Lazarev fintech review (explain before acting, micro-feedback).

Canvas page **"v4 · Three new directions"**, each with Home + Company:

| | A · Clear Day | B · Night Desk | C · Morning Paper |
|---|---|---|---|
| Feel | Friendly, visual, consumer-grade | Pro terminal | A daily newspaper |
| Colour | White/ice, navy ink, teal accent, amber/red signals | Black, amber accent, mono numbers | Salmon paper, claret accent, serif headlines |
| Type | Plus Jakarta Sans | Inter Tight + JetBrains Mono | Newsreader + IBM Plex Sans |
| Portfolio summary | **Ring** (unchanged/look/challenged) + 3 stats (promises kept %, governance flags, filings read) + sector bar + "Coming up" | **Credibility score 71/100** + **heat map** of all 18 companies + dense tape | **Written lead** with highlights + portfolio table with sparklines + week calendar |
| Navigation | 5-slot bottom bar, centre **Search** button: Home · Companies · Search · Alerts · Calendar | Floating pill: Desk · Companies · Rules · Calendar + **"/" ticker command bar** | Top tabs: Brief · Portfolio · Calendar · Alerts + bottom **Listen** bar |
| Best for | Anyone in 5 seconds; strongest on a quiet day | Analysts; highest density | Partners who read; most distinctive |
| Risk | Could look "consumer"; ring uses counts, not ₹ | Intimidating; small tap targets in heat map | Top tabs harder to reach; prose must be tightly templated |

**Recommendation:** A as the base (ring + stats + nav), borrowing B's heat map as the "see all companies" view and C's highlighted written lead as the first card. All three keep every brief requirement (digest, window, thresholds, results card, promise ledger, citations).

**New data needed (all cheap):** promises-kept % across the portfolio (already in the cached ledgers), sector per company (static map), upcoming results/calls (NSE event calendar / board-meeting intimations).

## 11. v3 — Thesis-first Push (drawn 15 Nov; current direction, awaiting sign-off)

> **Canvas page "v3 · Thesis-first Push (current)"** (v2 and v1 kept as saved pages; v2 files also copied to `docs/design-v2/`).

| Board | What it shows |
|---|---|
| **Today · full scroll** | Header "Since you last looked · Fri 18:40" (+ ⓘ, ⚙). **Thesis board**: "1 challenged · 2 worth a look · 15 unchanged", one row per company with a one-line reason, "15 unchanged — every filing checked". **What happened**: alert card ("Your volume rule fired", rule shown, *Market moved, business didn't*), governance card with facts (pledged now / before / lender), results card with **Against their word** block. Then "38 routine filings · Show" and **"You're caught up · next brief Mon 08:30"** |
| **Ask about this** | Sheet with 3 preset questions; cited answer from filings only; cost line; **Go deeper (flash · ~₹0.12)** |
| **The push moment** | Lock screen: scheduled morning brief + "Your rule fired" alert |
| **Company page** | "‹ Today" back, In-portfolio switch, **no price**, "Followed for 214 days", state banner, **governance strip** (pledge, auditor, senior exits, insider selling), sections, **Go deeper** |
| **Track record** | Scorecard + **Questions to ask management** generated from Target changed / Went silent / Missed |
| **Companies · long-press** | Menu: Open · Build track record · **Remove from portfolio**; Undo toast |
| **Settings** | Appearance (System/Light/Dark) · **Daily brief** 08:30 / 16:15, weekdays only, send to In app / Telegram · Default window · How FINN thinks & cost · Reset demo |

Interaction rules: opening an item marks it seen (no Seen button, no counter); "Go deeper" only on company level and from Ask; price lives only inside Updates.

## 10. Push v3 plan (15 Nov feedback: "push feels broken"; Pull and Alerts OK)

### 10.1 "Will Titan's results show up every day?" — No, but the design must make that obvious
- **Today lists events, not states.** An item exists because a *filing* happened (results filed 14 Nov). Tomorrow's window has no new results filing, so the card does not come back. "Profit doubled vs last year" is a fact *about that event*.
- **Every item has a lifecycle:** New → Seen (tap ✓ or open it) → moves to "Earlier · seen" and never re-enters Today. Only a *new* event (next quarter's results, a revision) creates a new card.
- **Default window = "Since you last looked"** (shown in the header: "Since Thu 18:40"), not a rolling 24 h. Rolling windows stay available in the window sheet.
- **Time anchor on every card:** "Results filed yesterday, 18:40" instead of a bare "5h".

### 10.2 Asking questions inside Push (was only a stretch idea on the Track record; now part of Push)
- On an opened Today item: 3 preset chips, answered **only from that company's filings/transcripts**, e.g. *Why does this matter?* · *What did management say about this before?* · *Has this happened before?* Governance items get *Who is this person?* (management change) or *How much is pledged in total?*
- Presets, not a free chat box: predictable, cheap, cacheable, easy to cite.

### 10.3 "Go deeper" — user-chosen depth = visible model routing
- Default answers/summaries use **flash-lite** (fast, ~₹0.01).
- **Go deeper** button on an item or a company → **flash** writes a structured brief (what happened · why it matters · what management said before · what to watch), with a cost receipt ("Deeper brief · flash · ₹0.12 · cached for everyone").
- Why: matches the brief's "cheap model for bulk, stronger only where reasoning demands it", and lets the user, not us, decide when depth is worth it.

### 10.4 Making Today feel finished
- **Progress you can see:** "3 of 5 left" counter that falls as items are marked seen → ends in a proper **"You're caught up"** screen with tomorrow's brief time.
- **Visible actions on every card** (not hidden swipes): ✓ Seen · Ask · Open ›. Swipes stay as shortcuts.
- **Two clearly different kinds of item:** *Alerts* (a threshold you set was crossed — bell icon, shows the rule: "Volume 3.1× · your rule 2×") and *Digest* (filings ranked by importance).
- **The real "push" moment drawn:** a lock-screen notification (and the in-app alert history) — what actually reaches the phone, and where tapping it lands.
- **Brief schedule:** morning (before 9:15 open) and evening (after close) briefs, set in Settings.
- **Consistent card anatomy:** company · time anchor → one-sentence headline → why it matters → actions.

### 10.5 Settings (new, from a gear icon in every tab header)
Appearance (System / Light / Dark) · **Schedule daily brief** (pick times, e.g. 08:30 before the open and 16:15 after the close; weekdays only toggle) · Default window (since last look / 24 h / 7 d) · Notifications on/off · Data & cost (today's tokens and ₹, cache hits) · Reset demo portfolio · How FINN thinks · About & sources.

### 10.6 Removing a company
- **Long-press a row in Companies** → action sheet: *Remove from portfolio* · *Mute alerts for this company* · *Open*.
- Swipe left on a row → *Remove*. The **In portfolio** switch on the company page stays.
- Every removal shows an **Undo** toast for 5 s.

### 10.7 Independent review (fresh reviewer agent, 15 Nov) — merged fix list
The reviewer agreed Push is the weak spot and found concrete faults in the v2 mockups. Merged with §10.1–10.6, in priority order:

| # | Fix | Why | Effort |
|---|---|---|---|
| 1 | **Every card opens its own company** (company page takes the ticker + section; back says "‹ Today" when you came from Today) | In v2 every card lands on Titan — the #1 "broken" feeling | M |
| 2 | **One source of truth for every count** (promises kept/due, filings 2 + 2 + N routine, window total) | Track said "3 of 5" while its legend summed to 6 due — fatal for a promised-vs-delivered product | S |
| 3 | **Finished ending to Today:** "38 routine filings · show" (grouped by type) · "15 companies quiet" · "You're caught up · next brief Mon 08:00" | Makes the digest finite; silence reads as *checked* | S |
| 4 | **Real time anchors:** default "Since you last looked", age + source on every card, weekend-aware ("Fri close") | Saturday mock showed a same-day price move — markets are shut | S |
| 5 | **Alerts obey your rules visibly:** a fired rule goes to the top as an Alert with "Volume 3.1× · your rule 2.0×"; tier = materiality, not good/bad news | v2 demoted a move that matched the user's own rule | S |
| 6 | **Inbox mechanics:** ✓ Seen / Ask / Open, read state, "1 of 3 handled" | Turns a static list into a working queue | M |
| 7 | **Draw the push moment:** lock-screen notification + (stretch) daily email digest | There was no actual "push" in Push | M |
| 8 | **Designed states:** empty day, loading, stale data, track record building | Feels finished | S |
| 9 | **Denser, factual cards:** drop "Open ›"; replace explainer lines with facts (prior pledge %, lender); add a margin row to Results | Pros want facts, not explanations | S |
| 10 | **Sheets return where you came from** (no exits into v1 screens) | No dead ends | S (in code: automatic) |
| 11 | Preset questions + **Go deeper** (§10.2–10.3), **Settings** (§10.5), **long-press / swipe to remove** (§10.6) | User requests | M |

**Also caught:** EBITDA must be computed consistently — the mock used Screener's "operating profit" (2,983) next to PBT (3,000), which looks wrong because PBT includes other income. Rule for the build: **EBITDA = PBT + finance cost + depreciation − other income**, labelled "computed", formula in the evidence sheet (supersedes 02 doc §I1).

**Note:** #1, #2 and #10 are wireframe limitations (static mockups hard-code Titan); in the real app they come for free from one data model — but they must be right on the canvas too, or the deck screenshots will show the same faults.

### 10.8 Product-level review (second reviewer, briefed to ignore wireframe details) — 15 Nov
**Verdict:** concept is strong (primary sources, governance first, promise ledger with "Went silent / Target changed"). **Biggest weakness: Push reports *filings*, but the partner's question is about the *thesis*** — Today reads as a cleaner NSE feed and barely uses the promise memory Pull builds.

**Reviewer's top 5 (impact ÷ effort):**
1. **Thesis board on top of Today** — unit = company, not filing: "18 companies · 15 unchanged · 2 worth a look · 1 challenged", each with a one-line reason; event cards below for analysts. Silence reads as "checked". (S–M)
2. **"Against their word" on cards** — every event framed against what management said before (results lead with promise vs actual). The Push↔Pull bridge; the one idea no other submission will have. (M)
3. **Contrarian framing + demote price** — unexplained move: "Market moved, business didn't — no filing; last 3 promises kept". Remove price from the company header (contradicts thesis-centric). (S)
4. **A finite, honest day** — "Since you last looked", "38 routine · show", "15 companies checked, nothing changed", "Next brief Mon 08:30". (S)
5. **Preset questions per card + "Questions to ask management"** on Track record (partner meeting prep, P10). (M)
Runners-up: governance strip on the company page (pledge trend, auditor changes, senior-exec churn, related-party deals); real push via a free Telegram bot (else draw the lock-screen notification).

**Reviewer's cuts:** explicit ✓ Seen button and "X of Y left" counter (email thinking — make "seen" implicit on open); full Settings page; brief-schedule picker with nothing actually sending; long-press/swipe remove (In-portfolio switch covers it); "Go deeper" only at company level, not every card.

**Our position (Claude):**
- **Adopt 1–5 fully.** #1 and #2 turn Push from a feed into FINN. #2 was already our planned "Results vs Promises" spice — now it becomes the core of Push.
- **#3 with care:** never say "thesis intact" (that's advice); state facts: "No filing explains this move · management kept its last 3 promises". Price stays only inside Updates, small.
- **Keep, but lean:** Settings stays because you asked for it — just Appearance, Schedule daily brief, Default window, Reset demo; cost moves to "How FINN thinks". Schedule only ships if a real delivery exists (Telegram/email); otherwise labelled "coming soon" or cut.
- **Keep long-press remove** (you asked; cheap) + Undo; drop swipe and mute.
- **Agree:** "seen" becomes implicit on open; drop the counter; "Go deeper" at company level only.
- **Add governance strip** to the company page if time allows.

## 9. Navigation v2 — company-first (drawn 15 Nov; awaiting sign-off; supersedes §6 once approved)

> **Where to see it:** canvas page **"v2 · Company-first (current)"** — Today, Companies, Company · Updates / Results / Track record, Alerts, and the v2 navigation map (all clickable in Play).
> **v1 is preserved:** canvas page **"v1 · Mode-based (saved)"**, plus a local copy of every v1 file and a snapshot of this doc in `docs/design-v1/`.
> Colours, type and motion are unchanged from v1 (§2–§5).

**Feedback:** finance terms are fine; the real problem is *finding things*. The Promise ledger living under a "Research" tab feels unintuitive.

**Root cause:** v1 is organised by our internal modes from the brief (Push / Pull / Settings). Investors think in **companies**: "what happened at Titan?", "can I trust Titan's management?". In v1 one company's information is scattered across three tabs (results in Brief, ledger in Research, ticker in Watch), and there is **no page for a company**.

**Fix: make the company the centre of the app.**

| Tab | What it is | Replaces |
|---|---|---|
| **Today** | What changed across your companies, ranked; finite; ends "You're caught up" | Brief |
| **Companies** | Your portfolio list (each row: new-items badge + promise-score dots) and a search box for **any NSE company** | Research + the portfolio half of Watch |
| **Alerts** | Thresholds and categories that decide what reaches Today | The settings half of Watch |

**Company page — the hub** (`/c/<TICKER>`, works for any NSE ticker):
- Header always visible: name, ticker, last price + day move, **In portfolio** toggle (add/remove lives here).
- Three segments: **Updates** (this company's filings, ranked; explained/unexplained moves) · **Results** (latest quarter vs last quarter / last year) · **Track record** (the promise ledger; built on first open with the step list, cached after).
- Evidence sheet opens from any number or quote.

**Every path leads to the same place:**
- Today card → Company page, opened on the matching segment (results card → Results; governance card → Updates).
- Results "See their track record" → same page, Track record segment.
- Companies list or search → Company page.
- Research on a company outside the portfolio = search → Company page → "Add to portfolio" if wanted.

**Why this is easier:** one familiar pattern (list → company → section), the same mental model as any stock app; you always know which company you're in; every screen is ≤ 2 taps from a tab. It also simplifies the build: 4 routes (Today, Companies, Company, Alerts) instead of ~9 screens.

**Check:** 3-person tree test — "Where would you see whether Titan kept its promises?" Pass = Companies → Titan → Track record without hesitation.

**Point of view (for the deck):** *Today is the inbox; Companies is the library.*

## 8. Clarity pass (planned — makes the app easier to understand)
> **Update 15 Nov:** user says finance terms are not the problem. Keep only the cheap wins (sentence-first card headlines, "vs last quarter / vs last year" labels, labelled back buttons); glossary taps become optional stretch. Tab names are now decided by §9.

**Feedback (15 Nov):** looks good, but feels generic, and it is hard to understand what things mean and where to go without a finance background.

### 8.1 Why it feels hard (diagnosis)
1. **Headlines are data, not meaning.** "PAT +113.7%" asks the reader to work out what happened.
2. **Jargon with no way out:** PAT, PBT, EBITDA, QoQ, YoY, pledge, "goalposts moved", "not yet due" — no tap-to-explain.
3. **Tab names describe our concepts, not the user's goal.** "Brief / Research / Watch" doesn't say what you'll find there.
4. **No orientation:** the app never says in one line what it found today, or what each screen is for; no first-run explanation.
5. **Why it feels generic:** cards, chips and lists are standard; the app has no voice and no visual that is only FINN's.
6. **The first users are the judges**, and the brief itself says they don't expect finance knowledge. Pros lose nothing from plainer wording; non-experts gain a lot.

### 8.2 Principles
- **Sentence first, numbers second.** Every card opens with a plain sentence saying what happened, then why it matters, then the numbers.
- **Every term explainable in one tap.** No mode switch, no "simple version" — the same screen serves pros and newcomers.
- **Name things by what they do for you.**
- **One obvious next step per screen.**

### 8.3 Changes
| Area | Now | Change |
|---|---|---|
| Tab names | Brief · Research · Watch | **Today · Track record · Portfolio** |
| Top of Today | Title + counts | **FINN's one-line take** in the highlighter style: "2 things need you today. Everything else is routine." |
| Card anatomy | Chip + data headline + numbers | **What happened** (plain sentence) → **Why it matters** (one line) → numbers → **one next-step button** |
| Results card | "PAT +113.7%" | "Titan's profit more than doubled from a year ago" · "Margins are above what management promised for the year" · numbers · [See their track record →] |
| Column labels | QoQ · YoY | **vs last quarter · vs last year** (QoQ/YoY as small subtitles) |
| Jargon | Unexplained | **Dotted-underlined terms → glossary sheet**: plain definition + what it means *for this company right now*. Definitions taken from ENAM's own reference document. |
| Verdict labels | Delivered · Missed · Goalposts moved · Quietly dropped · Not yet due | **Kept · Missed · Target changed · Went silent · Too early to tell** |
| Track-record headline | "Kept 3 of 5" text | **Promise scorecard**: a row of dots, one per promise, coloured by verdict with the word under each (●●●○◐) — readable in one glance, and a visual unique to FINN |
| Back buttons | Bare arrow | **Labelled back** ("‹ Today", "‹ Track record") so you always know where you came from |
| First open | Planned 3-step tour | Three cards: **Today** = only what changed and matters · **Track record** = did management do what they said · **Portfolio** = your companies and alert rules. Skippable, re-openable from ⓘ |
| End of Today | "You're caught up" | Same, plus "38 routine filings hidden — show them" so nothing feels lost |
| Voice | Neutral labels | Short, confident sentences, like a sharp analyst colleague; never hype |

### 8.4 How we check it worked (10-minute hallway test)
3 people without a finance background (plus 1 with one, if possible). Tasks: (1) what needs your attention today? (2) did Titan's profit go up or down vs last year? (3) did Titan's management keep its promises? (4) add a company to your portfolio. **Pass:** each task under 30 seconds with no help. Every word someone asks about goes into the glossary. Results go into the deck as evidence.

### 8.5 Cost
Mostly wording, labels and one glossary sheet → cheap to build directly in code. The promise scorecard and the one-line take are the only new UI pieces.

---

*Sample data: Titan's Q2 FY27 figures and both margin quotes are real (from the data spike). All other events, numbers and verdicts on the canvas are illustrative layout data.*
