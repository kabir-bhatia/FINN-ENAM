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

## 9. Navigation v2 — company-first (proposed 15 Nov, supersedes §6 once approved)

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
