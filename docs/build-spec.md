# TOP BINS — Claude Code build prompt (paste into a fresh Claude Code session)

Build a daily rare-answer football trivia game for the web. Working name: **Top Bins**. Tagline: "The EPL rare-answer game. Name the obscure one."

## What it is

A clone of the Krillion format, rebuilt for the Premier League. Krillion's rules (verified): 7 prompts a day, ~25 seconds per prompt, and points are weighted by RARITY — naming the obvious superstar scores almost nothing, naming the forgotten player scores big. Six tiers, perfect day is 700. The trending reels are people filming themselves playing it daily — the game IS the content.

Three modes, one site:

1. **Deep Cut (Daily)** — 7 EPL prompts a day, same for everyone, 25 seconds each.
2. **Club Editions** — pick a club; 7 prompts from that club's history only. V1 ships the Big Six (Arsenal, Chelsea, Liverpool, Man City, Man Utd, Tottenham), expand to all 20 later.
3. **Transfer Window** — seasonal mode, live during the January window (Jan 1–31) and the summer window (Jun 10–Sep 1). Prompts about transfers only. Off-season it shows a countdown to the next window.

## Scoring (pre-computed tiers — this is the key build decision)

Do NOT score by live community answers (cold-start problem: no players on day one means no rarity data). Copy the Long Shot model: every prompt ships with a fixed answer list, and every answer has a tier assigned BEFORE the day's game. Scores never depend on what other people type later.

Six tiers, shot-themed (more distinctive than Footbillion's distance-from-goal scoring):

| Tier | Points | Meaning |
|---|---|---|
| Tap-In | 10 | The obvious answer everyone names |
| Placed Finish | 25 | Well-known |
| Curler | 50 | Good knowledge |
| Volley | 70 | Deep cut |
| Screamer | 85 | Very obscure |
| Top Bins | 100 | The rarest valid answer (one per prompt) |

Perfect day = 700. Show the tier name + points after each answer, a running total, and a final score card.

## Gameplay

- Typed answers, full name required. Fuzzy match: lowercase, strip accents/diacritics, allow edit distance ≤ 2 (typos forgiven, wrong players not).
- 25-second countdown per prompt, visible. If the clock runs out, that prompt scores 0 and you cannot replay it.
- One answer per prompt. A wrong answer (not on the list) scores 0 — but let the player keep guessing while the clock runs, like Long Shot does.
- Daily rotation: deterministic seed from the date (YYYY-MM-DD), same 7 prompts for everyone that day. Club mode seeds on date + club. No account, no login — streaks and best score in localStorage only.
- End screen: final score, tier breakdown (how many of each tier), and a shareable score card copied to clipboard — Wordle-style emoji/text card with the score, the date, and the mode. The share card is the distribution; make it good.
- Mobile-first. People play on phones and film themselves. Verify at phone width first, then desktop.

## Tech ( $0 — no-pay rule )

- Static site, no backend, no database, no paid APIs. HTML/CSS/JS (or Next.js static export — your call, but it must deploy to free hosting: Vercel or Netlify free tier, or GitHub Pages).
- All prompt packs ship as static JSON files in the repo. Daily rotation is client-side from the date seed.
- No account system, no analytics that cost money, no paid fonts/assets.

## Data model

```json
// prompts/deep-cut.json — one file per pack
{
  "pack": "deep-cut",
  "prompts": [
    {
      "id": "dc-001",
      "text": "Name a player who has scored for 5 or more Premier League clubs",
      "answers": [
        { "name": "Craig Bellamy", "tier": 25 },
        { "name": "Nicolas Anelka", "tier": 25 },
        { "name": "Peter Crouch", "tier": 50 },
        { "name": "Darren Bent", "tier": 70 },
        { "name": "Marcus Bent", "tier": 85 },
        { "name": "Les Ferdinand", "tier": 100 }
      ]
    }
  ]
}
```

- Every prompt has 4–8 valid answers spread across at least 4 tiers, with exactly ONE "Top Bins" (100) answer.
- Tier assignment rule of thumb: tier by how many fans would name them — fame + recency = low tier; journeymen, one-season wonders, and pre-2000 names = high tier. If in doubt, tier it higher; the game should reward digging.
- V1 pack sizes: Deep Cut 50 prompts, each Big Six club 15 prompts, Transfer 30 prompts.

## Starter prompt bank (verify every answer before shipping — see Verification)

### Deep Cut (EPL, 1992–present)

1. Name a player who has scored for 5 or more Premier League clubs — Bellamy 25, Anelka 25, Crouch 50, Darren Bent 70, Marcus Bent 85, Les Ferdinand 100.
2. Name a player who won the Premier League with two different clubs — Anelka 25 (Arsenal, Chelsea), Tevez 25 (Man Utd, Man City), Kanté 50 (Leicester, Chelsea), Mahrez 50 (Leicester, Man City), Clichy 70 (Arsenal, Man City), Kolo Touré 70 (Arsenal, Man City), Robert Huth 85 (Chelsea, Leicester), Henning Berg 100 (Blackburn, Man Utd).
3. Name a goalkeeper who has scored in the Premier League — Alisson 25, Begović 50, Tim Howard 50, Paul Robinson 70, Brad Friedel 85, Peter Schmeichel 100. (Six keepers total — verified set.)
4. Name a player who has played for both Arsenal and Tottenham — Sol Campbell 10, Adebayor 25, Gallas 50, David Bentley 70, Pat Jennings 85, Rohan Ricketts 100.
5. Name a manager who has managed 3+ Premier League clubs — Allardyce 25, Redknapp 25, Mark Hughes 50, Steve Bruce 50, Roy Hodgson 70, Alan Pardew 85, David Moyes 100.
6. Name a player who scored on their Premier League debut — Agüero 25, Rashford 50, Martial 70, Macheda 100.
7. Name a player who won the Golden Boot with two different clubs — Shearer 25, van Persie 50, Hasselbaink 100.
8. Name a player who played Premier League football for a Welsh club — Ashley Williams 25, Michu 50, Gylfi Sigurðsson 50, Bony 70, Joe Allen 85, Garry Monk 100.
9. Name a club that finished in the top 4 the season after promotion — Newcastle 1993-94 (25), Nottingham Forest 1994-95 (70).
10. Name a club that has played in the Premier League but only for one season — Swindon 25, Barnsley 50, Blackpool 70. (Verify the full list; one-season clubs are the rare answers here.)
11. Name a player who was relegated from the Premier League with 3 different clubs — verify before shipping; drop the prompt if the answer list doesn't hold up.
12. Name a player who has made 100+ Premier League appearances for a single club without ever winning the league — verify before shipping.

### Club Editions (examples — expand to 15 prompts per Big Six club)

- Arsenal: "Name a player who played for Arsenal in the Invincibles season (2003-04)" — Henry 10, Vieira 25, Bergkamp 25, Pires 50, Ljungberg 50, Lauren 70, Edu 85, Aliadière 100.
- Man Utd: "Name a player who played for Man Utd in the 1998-99 treble season" — Beckham 10, Giggs 25, Scholes 25, Jordi Cruyff 70, Erik Nevland 85, Michael Clegg 100.
- Liverpool: "Name a player who played for Liverpool in the 2019-20 title season" — Salah 10, van Dijk 25, Mané 25, Curtis Jones 70, Neco Williams 85, Harvey Elliott 100.
- Chelsea: "Name a player who played for Chelsea in the 2004-05 title season" — Lampard 10, Terry 25, Drogba 50, Glen Johnson 70, Lenny Pidgeley 100.

### Transfer Window (examples — re-verify every window; fees move)

- "Name a player sold for £50m+ in a January window" — Coutinho 25 (£142m, Jan 2018), van Dijk 50 (£75m, Jan 2018), Aubameyang 70 (£56m, Jan 2018), Torres 85 (£50m, Jan 2011), Laporte 100 (£57m, Jan 2018).
- "Name a player who moved on a free transfer and then won the Premier League" — Milner 25, Matip 50, Sol Campbell 100.
- "Name a player sold by a Premier League club for a profit of £50m+" — Coutinho 25, Bale 50, Cristiano Ronaldo 70, Luis Suárez 85.
- "Name a club's record signing" — verify at build time; record fees change every window (e.g. Liverpool's is Isak £125m as of Sep 2025; City's Grealish £100m; Chelsea's Enzo £106.8m; Arsenal's Rice £105m).

## Verification (non-negotiable)

Every answer in every pack must be checked against Premier League official stats or Wikipedia before it ships. Unverified answers get dropped, not guessed. Never scrape FBref, Transfermarkt, or any stats site — use the official PL site and Wikipedia only. The build is not done until the verification pass is complete and every prompt has 4+ verified answers across 4+ tiers.

## Design

- Dark, floodlit-stadium feel: near-black background, floodlight-white type, one accent (electric green, like a pitch under lights). No purple-blue gradients, no generic AI-game look.
- Big type for prompts, huge countdown, satisfying tier reveal (the tier name slams in like a goal graphic — motion is the differentiator; test by tapping through on a real phone).
- The pixelated-player-run visual from Ballium is NOT ours to copy shot-for-shot — our visual identity is the shot-tier reveal + the share card.
- Sign-in: none. No account wall, no modal, nothing between the player and the first prompt.

## Build order

1. Scaffold the static site + design system (mobile-first).
2. Scoring engine + 25s timer + fuzzy matching + daily seed rotation.
3. Deep Cut pack (50 prompts) + daily mode.
4. Club packs (Big Six × 15) + club picker.
5. Transfer pack (30) + window logic + off-season countdown.
6. Share card + streaks (localStorage).
7. Verification pass on all answers.
8. Deploy to free hosting; report the live URL.

## What NOT to build in v1

- No live community rarity, no leaderboard, no percentile (needs a backend — v2).
- No user accounts, no paywall (Isenberg: paywall after first win — v2, if it takes off).
- No app-store app — web only for v1.
- No scraping of any stats site for data.

## Why this one

The format is trending right now (Krillion, Curryillion, Long Shot, Ballium, Footbillion — all Nov 2026), and the soccer version that exists (Footbillion) is general football, not EPL-deep. The distribution is built in: film yourself playing daily, post the score card. Validate by posting daily plays for two weeks; if it doesn't get shared, kill it — the build is cheap, the test is the content.
