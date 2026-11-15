# FINN declutter plan (review only, nothing edited)

## The rule behind every cut
1. **No more than three text levels on a card or row:** a name line, one bold line, one optional context line. Everything else sits one tap away, either on the evidence sheet or on the company tab.
2. **The routine-filings list is the model** (the user likes it): one card, divided rows, a fixed left column, one line of content, no repeated "tap for source" hints.
3. **Say each fact once per screen.** Anything that repeats the ring, a chip, a bar or the section title gets cut.
4. **Explain how the screen works once, not on every visit.** "How it was made" text moves to the How page or behind an ⓘ.
5. **Hard rules stay:** every number and quote keeps a path to its source (a tap at most), and no data is invented.

---

## Home
**Main finding:** the brief, the Needs-your-attention cards and the routine card all say the same things. The brief's first two sentences are the first two attention cards word for word. "12 of 18 unchanged" is already in the ring, and "12 routine filings" is the routine card below.

| Item | Change | Why |
|---|---|---|
| **Brief + Needs your attention** | **Merge them into one section, "Needs you · 12"**, built as a routine-style list. Each row: a coloured dot, the company name, one short fact, and a time on the right. Example: `● One 97 Comms   3.0× volume, +7.3% · no filing   Thu`. Show 4 rows, then "See all 12". | This answers the user's "points, one line per company" request and removes the duplicate cards. |
| Brief footnote "Written from the filings by fixed rules…" | Move it to the How page and a small ⓘ next to the section title. | It's method, not news. It belongs in the writeup and the How page. |
| Alert card: rule line "20-day average × 3.0 · your rule × 2.0" | Cut it from Home. It already shows on the Company page under Updates → "Price and volume moves", and the row taps there. | This is the fourth text level the user flagged. The headline already has the 3.0×. |
| Alert card: "One 97 · Your volume and price rules · Thu close" | Keep the company name in the row and a short time on the right. Cut "Your … rules". | The dot colour and the fact already show it was a price/volume alert. |
| "Market moved, business didn't. No filing explains it." | Shorten to a highlighted **"no filing"** inside the row's fact. | Keeps FINN's signature point in two words. |
| Governance card: Red flag + 4-line summary + "Filed Fri 20:57 · source" | Row: name + **Red flag** chip + the headline on one line. The summary and source move to the tap, which opens the Governance tab with source per filing. | Same 3-level limit. The source stays one tap away. |
| Worth knowing | Use the same row style. Drop "· category · time" from line 1 (the time moves to the right). | Consistency with the routine list. |
| Stat tile "promises kept · 7 cos" | Shorten to "promises kept" (the company count goes in the tile's tooltip/sheet). | Wraps to 3 lines today. |
| Sector mix label "Sector mix · by number of companies" | Shorten to **"Sectors"**. Show the legend for the top 3 sectors plus "Other" on one line, with the full split on tap. | Cuts two lines of 11-px legend. |
| Coming up empty state (2 sentences) | "No dates announced yet · Calendar ›" | Same meaning, one line. |
| Routine card | **Keep it.** Two small fixes: hide the subtitle (the category list) when expanded, because the breakdown already shows it; clamp each headline to 2 lines (some run to 5). | This is the model; only trim what repeats. |
| Caught-up ending | Keep "You're caught up" and "data as of …". Drop "Next brief …" (it's in Settings). | "Data as of" is provenance and stays. |
| Footer disclaimer | Keep it on Home and the How page only. Remove it from the other tabs. | It repeats on every screen today. |
| Time-window sheet weekend note | Keep it (it's inside a sheet, so it costs nothing). | — |

## Companies
| Item | Change | Why |
|---|---|---|
| "Financials · YESBANK" line | **Cut it.** The ticker and sector stay on the Company hero and in Search. | These are the user's own holdings, known by name. The line doesn't help anyone decide whether to open the card. |
| "1 of 1 due promises kept" | "1/1 kept". The full sentence stays as the screen-reader label. | The bar already shows it. |
| Subtitle "13 in your portfolio · state over the last 7 days" | "13 companies · last 7 days" | Shorter. |
| "Long-press a company for options" | Show it once, then hide it. | A how-to hint on every visit. |
| "Nothing material this week" on unchanged cards | Keep it (it's the reason line). | — |

## Company page
| Item | Change | Why |
|---|---|---|
| Hero "Sector · SYM · data as of … IST" | Keep sector · ticker (the right place for them). Move "data as of" to the bottom of the page. | The hero should be name, state and ring. |
| Track teaser "Did they do what they said?" + description + CTA | Title + CTA. Drop the description. | The CTA says it already. |
| Updates rows: time, headline, 3-line summary, "NSE cat · tap for source" | Headline + time. Summary clamped to 1 line (full text on tap). Drop "tap for source" on every row; use a chevron. | A routine-style list. |
| Results footnotes ("Tap any figure…", lender note) | Replace them with one ⓘ line. | Method text. |
| Governance rows "tap for source" | Cut it. Shorten the empty state to "No governance filing in 45 days". | Repeated hint. |
| Track: ledger label "· tap a row for the quote", the "Said vs reported" footnote, the cost receipt | Drop the hint. Move the footnote to ⓘ. Collapse the cost receipt to a "Cost receipt · ₹0 ›" row. | The receipt stays for the writeup, one tap away. |

## Alerts
| Item | Change | Why |
|---|---|---|
| Subtitle | Keep it (it sets up the page). | — |
| Stepper notes ("× its 20-day average…") | Keep them. They define the rule the user is setting. | Needed. |
| "Split and bonus days never fire an alert…" | Move it to the How page. | Edge-case method. |
| "Dark = needs you. Unselected types still appear…" | "Selected types go to Needs you; the rest to Worth knowing." | Half the length. |

## Calendar (user flagged it)
| Item | Change | Why |
|---|---|---|
| Subtitle "Board meetings your companies have announced…" | Cut it. | The title and the date rows make it obvious. |
| One card per day with an "n companies" header | **One list with date headers**, routine-style rows: name + kind chip, all on one line. Drop the "n companies" count. | Today it's one card per day, each with a header and a count. |
| 2-line NSE purpose text per row | Move it behind the tap. | It mostly repeats the chip ("To consider and approve financial results…" next to **Results**). |
| "Last 45 days" section | Collapse it like the routine card: "14 past meetings · Show". | Past dates are for reference only. |
| Source footnote (2 sentences) | "Source: NSE event calendar" plus an ⓘ for the earnings-call caveat. | Keeps provenance, drops the paragraph. |

## Settings
| Item | Change | Why |
|---|---|---|
| Long footnote on the refresh schedule | "Next brief Mon 08:30". The schedule detail moves to the How page. | — |
| "Default window: X" | Cut it. | The selected segment already shows it. |

## Sheets
The evidence sheet **stays as it is**. It's where every number and quote resolves to its source, so it's the destination for everything moved behind a tap above. Only the time-window sheet's text is trimmed (see Home).

---

## New: pull to refresh
- **What:** on Home, Companies, Company and Calendar, pulling down at the top of the page shows a teal spinner. Past about 70 px, letting go refetches the data. A small toast follows: "Updated · data as of 09:40".
- **How:** one `PullToRefresh` wrapper in the app shell (touch events, only when the page is scrolled to the top and no sheet is open). Releasing past the threshold sends a refresh signal. `useBundles` and `useBundle` listen for it: they clear the cache entry in `getJSON` (memory and sessionStorage) and refetch with a cache-busting query, so the CDN copy (`s-maxage=120`) doesn't come back. Add `overscroll-behavior-y: contain` so Android Chrome's own pull-to-refresh doesn't fire as well.
- **Why:** an installed PWA has no browser reload button, so this is the only natural way to refresh there.
- **Honest limit:** the pull gets the latest **server** copy. NSE data is still fetched on the schedule (5 times a weekday), not on every pull, which keeps the app free-tier and polite to NSE. The toast's "data as of" time makes that visible.

## Suggested order
1. Home: merge brief + attention into a routine-style list (the biggest gain)
2. Calendar list
3. Companies card
4. Company page tabs
5. Alerts, Settings, footer
6. Pull to refresh
