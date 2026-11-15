# Deep Cuts

Daily EPL rare-answer trivia game (formerly "Top Bins" — renamed, see
DECISIONS.md). Static site, no backend, no database, no paid services.

## Rules

- $0: no paid APIs, no paid hosting, no backend.
- Scoring: pre-computed tiers only — Tap-In 10, Placed Finish 25, Curler 50, Volley 70, Screamer 85, Top Bins 100. Never score by live community answers.
- Matching is on **last name only** (last whitespace token of the `name` field), fuzzy-matched with edit distance ≤ 2. No two answers in the same prompt may share a last name — it's the whole match target, so a collision makes the prompt unsolvable.
- Verify every answer against Premier League official stats or Wikipedia before it ships. Never scrape FBref, Transfermarkt, or any stats site.
- No accounts, no paywall. Mobile-first.
- This repo is NOT hvac-radar. Never import HVAC code, data, or .env values here.

## Scope

One mode only: the daily game, 7 prompts from `prompts/deep-cut.json`
(50 prompts), date-seeded, same for everyone. Club Editions and Transfer
Window were cut in the rework — don't reintroduce them without being asked.

## Build spec

`docs/build-spec.md` is the *original* three-mode spec — kept as a historical
record of what v1 was built from. It no longer reflects current scope;
DECISIONS.md explains the pivot. Don't follow its Club Editions / Transfer
Window sections.
