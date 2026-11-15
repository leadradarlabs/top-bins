# Top Bins

Daily EPL rare-answer trivia game. Static site, no backend, no database, no paid services.

## Rules

- $0: no paid APIs, no paid hosting, no backend.
- Scoring: pre-computed tiers only — Tap-In 10, Placed Finish 25, Curler 50, Volley 70, Screamer 85, Top Bins 100. Never score by live community answers.
- Verify every answer against Premier League official stats or Wikipedia before it ships. Never scrape FBref, Transfermarkt, or any stats site.
- No accounts, no paywall in v1. Mobile-first.
- This repo is NOT hvac-radar. Never import HVAC code, data, or .env values here.

## Modes

- Deep Cut (daily EPL), Club Editions (Big Six first, then all 20), Transfer Window (seasonal: Jan + summer windows).

## Build spec

`docs/build-spec.md` is the full spec — starter prompt bank, data model, verification rules, build order. Follow it.
