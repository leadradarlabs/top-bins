# Top Bins

**The EPL rare-answer game. Name the obscure one.**

A daily Premier League trivia game: 7 prompts, 25 seconds each, scored by
rarity — naming the obvious superstar barely moves the needle, naming the
forgotten journeyman is worth big points. Perfect day = 700.

Static site, no backend, no accounts, no paid services. Deployed free.

## Modes

- **Deep Cut (Daily)** — 7 EPL prompts a day, same for everyone, seeded by date.
- **Club Editions** — Big Six clubs, 7 prompts from that club's history.
- **Transfer Window** — live Jan 1–31 and Jun 10–Sep 1; a countdown otherwise.

## Scoring

Every prompt ships with a fixed, pre-tiered answer list — scores never depend
on what other people type later (no cold-start problem).

| Tier | Points |
|---|---|
| Tap-In | 10 |
| Placed Finish | 25 |
| Curler | 50 |
| Volley | 70 |
| Screamer | 85 |
| Top Bins | 100 |

Typed answers are matched with fuzzy matching (accents/diacritics stripped,
edit distance ≤ 2) so typos are forgiven but wrong players aren't.

## Running locally

It's a static site — no build step. Serve the directory with anything:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Content status (v1)

Every answer below is checked against the Premier League's official records
or Wikipedia — see `prompts/*.json`. This v1 ships a smaller, fully-verified
seed set rather than the full target pack sizes, so packs rotate through
fewer unique prompts per mode until expanded:

- `deep-cut.json` — 10 prompts (target: 50)
- `transfer.json` — 5 prompts (target: 30)
- `club-*.json` — 1–2 prompts per Big Six club (target: 15 each)

To add more: append objects to the relevant JSON file following the existing
shape (`id`, `text`, `answers: [{name, tier}]`), with exactly one `tier: 100`
answer, 3–8 answers total, verified against an official source before
shipping.

## Stack

Vanilla HTML/CSS/JS. No framework, no build step, no database. Daily
rotation is a deterministic seed derived from the date (and club, for Club
Editions) — same prompts for everyone on a given day. Streaks and best
scores live in `localStorage` only; there are no accounts.
