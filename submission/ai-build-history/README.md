# FINN — AI build history

FINN was built in about three days (13–15 Nov 2026) with **Claude Code** as the coding agent. This folder holds the full conversations and the artifacts they produced, so you can see how the tools were used and not only the finished code.

## The three chats

| File | What happens in it |
|---|---|
| `chats/01_Chat_1_—_Discovery,_scoping_and_design.md` | The main thread. Reading the brief, choosing the user (ENAM’s own team, not retail), the problem map and scoring, the scope lock, the build-decision log, the data spike, and design rounds v1 → v3 → the three v4 directions → the approved “Clear Day” hybrid. It started the other two sessions. |
| `chats/02_Chat_2_—_Build_(part_1).md` | The build session, started from Chat 1 with a written brief. Data layer (NSE, Yahoo, Screener, Blob), classification cascade, Home, company page, track-record pipeline, deploys, fixes found on the phone, the Clear Day rebuild, and the switch to GLM 5.3 flash with Gemini as fallback. |
| `chats/03_Chat_2_—_Build_(part_2,_after_context_compaction).md` | The same build session after the context window was summarised and carried forward (the summary is included). Repo and Vercel wiring, track records built, production checks, region fix, installable app and Web Push, then this submission. |
| `chats/04_Chat_3_—_Declutter_design_review.md` | A design-review session started from Chat 2. It collected phone screenshots and feedback (“too much text”), wrote a screen-by-screen declutter plan, built it after approval, and added pull to refresh. |

Each export lists user messages, Claude’s replies and every tool call (commands, file edits), with tool output folded and long output trimmed. **All API keys, tokens and secrets are replaced with `[REDACTED]`.** Times are IST.

## Artifacts

| Folder | Contents |
|---|---|
| `artifacts/01_planning_docs/` | `01_FINAL_SCOPE.md` (who, problems, scoring, scope), `02_BUILD_DECISIONS.md` (every decision with alternatives), `03_DATA_SPIKE.md` (what each source does from the cloud), `04_DESIGN.md` (design language and every review round) |
| `artifacts/02_design_canvases/` | Design canvas sources for every round: `v4_clear_day/` (the three directions A/B/C that led to the final design) and `earlier/` (v1–v3). These are canvas files; their inline styles show exact layouts and colours. |
| `artifacts/03_declutter_review/` | The user’s phone screenshots and the approved declutter plan |
| `artifacts/04_app_screenshots/` | Screens of the final app (15 Nov 2026) |

The finished product and its reasoning are in `../FINN_Product_and_Decisions.pdf`.
