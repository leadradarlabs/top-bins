# Deep Cuts

**The EPL rare-answer game. Name the obscure one.**

A daily Premier League trivia game: 7 prompts, 25 seconds each, scored by
rarity — naming the obvious superstar barely moves the needle, naming the
forgotten journeyman is worth big points. Perfect day = 700.

One mode: the same 7 prompts for everyone, every day, deterministically
seeded from the date.

Static site, no backend, no accounts, no paid services. Deployed free.

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

## Playing

Type a player's **last name only**. As you type, a dropdown suggests
matching names from the current prompt's answer list (arrow keys + Enter to
pick, or click). Typos are forgiven via fuzzy matching on the last name
(accents/diacritics stripped, edit distance ≤ 2), but a wrong player isn't.
Each answer reveals its tier, a rarity bar showing where it sits on the
10→100 scale, and the full matched name.

## Running locally

It's a static site — no build step. Serve the directory with anything:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Content status

Every answer in `prompts/deep-cut.json` is checked against the Premier
League's official records or Wikipedia, never scraped from FBref or
Transfermarkt. 50 prompts, 3–8 answers each, exactly one `tier: 100` answer
per prompt, and no two answers in the same prompt share a last name (last
names are the whole match target, so a collision would make a prompt
unsolvable by name alone).

To add more: append objects to `prompts/deep-cut.json` following the
existing shape (`id`, `text`, `answers: [{name, tier}]`), verified against
an official source before shipping, and checked for last-name collisions
against the other answers in that same prompt.

## Stack

Vanilla HTML/CSS/JS. No framework, no build step, no database. Daily
rotation is a deterministic seed derived from the date — same 7 prompts for
everyone on a given day. Streaks and best scores live in `localStorage`
only; there are no accounts.
