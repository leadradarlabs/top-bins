# Decisions

## 2026-11-15 — Rework round 2: killed the dropdown, added Krillion-style meter + scheduler, disputed one correction with evidence

Three changes from Neil's round-2 brief, all shipped:

1. **Killed the autocomplete dropdown entirely** (deleted `filterSuggestions`
   from `fuzzy.js`, removed all dropdown markup/wiring) — it was leaking
   answers (typing one letter showed all 3-8 candidates). Kept generous
   fuzzy autocorrect on submit (last name, edit distance ≤2). Wrong/
   unrecognized guesses no longer end the prompt: the player retries while
   time remains, and each wrong guess now costs 3 seconds off the clock
   (Ballium's rule) — implemented in `game.js`'s `submitGuess`.
2. **Krillion-style graphics**: a persistent vertical meter (score/700,
   football-themed — a shot climbing toward the top corner, not Krillion's
   ocean/depth framing) replaces the old per-answer horizontal rarity bar.
   It had to live outside the tier-reveal overlay's DOM subtree (as a sibling
   in `.game-body`, not a child of the full-screen overlay) so it stays
   visible and animates while the reveal is up — see `index.html`'s
   `.game-main`/`.meter-rail` split. Added a 3s preview phase before each
   prompt's clock starts (`game.js`: `previewStart`/`timerStart` events,
   input disabled until `timerStart`) and a results-screen rating band.
3. **Midnight scheduler**: `seed.js` now computes "today" from
   `Intl.DateTimeFormat` pinned to `America/New_York`, not the device's
   local date — verified against crafted UTC timestamps straddling both EST
   and EDT midnight. One attempt per day is enforced via `storage.js`
   (`hasPlayedToday` gates `startDeepCut`); a 20s polling interval plus a
   precise `setTimeout` at the exact reset moment both call the same
   rollover check, so a page left open across midnight resets without a
   reload.

**Pushed back on the brief's dc-010 "fix" with evidence, rather than
applying it.** The brief said Sheringham/Anelka/Campbell are NOT
three-club Premier League hat-trick scorers and that the real answer is
Ferdinand/Hasselbaink/Yakubu(4 clubs). A web-fetch agent read Wikipedia's
"List of Premier League hat-tricks" article directly (not a search
summary) and found its own lead sentence names exactly five three-club
scorers: Anelka, Campbell, Ferdinand, Sheringham, Yakubu — matching what
was already shipped. Hasselbaink is absent from that list, and Yakubu's
page entry shows three clubs (Blackburn, Everton, Portsmouth), not four.
Left dc-010 unchanged. This is flagged prominently to Neil rather than
silently overriding his instruction, since a direct primary source
contradicted it.

**Strict re-verification pass (5 parallel forks, one per 10-prompt range,
each pinning every answer to a specific season/match/stat) found one real
error the earlier pass missed**: `dc-038` ("5+ Premier League hat-tricks")
had Didier Drogba and Jermain Defoe, who each have only 3 — not 5+. Dropped
both, rebuilt from a confirmed 5+ list (Agüero 12, Shearer 11, Fowler 9,
Kane 8, Owen 8, Henry 8, Rooney 7, Suárez 6). `dc-019` also lost Chris
Smalling (confirmed he was never sent off on his actual PL debut — a late,
uneventful substitute appearance). All other 47 prompts held up against
re-verification unchanged. Because every fork writes to the same single
file (unlike the round-1 content expansion, where each fork owned a
separate per-club file), they wrote to isolated scratchpad fragments
instead of editing `deep-cut.json` directly, and the coordinator merged
afterward — avoiding a concurrent-write race on one shared file.

## 2026-11-15 — Repo made public to enable free GitHub Pages

GitHub's API rejected Pages setup on the private repo: "Your current plan
does not support GitHub Pages for this repository." Free Pages requires
either a public repo (any plan) or a paid plan for private-repo Pages.
Asked Neil; he chose public over switching hosts. Repo and deployed site
(including every prompt's answer key) are now publicly visible at
`https://leadradarlabs.github.io/top-bins/`.

## 2026-11-15 — Deploy verified via headless Node simulation, not a live browser

No browser-automation tool (chromium-cli, Playwright, claude-in-chrome) was
available in this sandbox, and `npx playwright install` was blocked by the
environment's permission classifier. Verified the live deploy by fetching
the actual deployed `js/*.js` and `prompts/deep-cut.json` from
`leadradarlabs.github.io` and running a full round through the real
`TopBinsGame` engine in Node: wrong guess ignored, correct answer scored at
the right tier, one-character typo forgiven, timeout scored 0, final total
and share card rendered correctly. This confirms the deployed game logic is
correct; it does not confirm CSS rendering or touch/click UX in an actual
browser. If a real browser check matters later, get a browser-automation
tool connected first.

## 2026-11-15 — Content expansion split across parallel forks by file

Expanding deep-cut (10→50), transfer (5→30), and six club packs (1-2→15
each) means verifying roughly 150 new prompts' worth of facts — each
against the Premier League's official site or Wikipedia only (never
FBref/Transfermarkt, per CLAUDE.md). Doing this serially in one session
would be slow and would fill context with search noise. Split the work into
parallel forks, one per file or small file group, each instructed to: read
the existing file first, re-verify the existing seed answers and fix/drop
anything that doesn't hold up, add new prompts in the same JSON shape, and
self-validate (JSON.parse, exactly one tier-100 answer, 3-8 answers per
prompt) before finishing.

## 2026-11-15 — Rework: cut to one mode, renamed Top Bins → Deep Cuts

Neil's verdict on v1: three modes wasn't working. Reworked to a single
mode (the daily game only) and renamed the product "Deep Cuts" everywhere
user-facing (title, header, README, share card). Deleted
`prompts/club-*.json`, `prompts/transfer.json`, and `js/windows.js`, and
removed all mode-selection/club-picker/transfer-countdown UI and logic.
`prompts/deep-cut.json` (50 prompts) is now the only content file.
`docs/build-spec.md` is kept as a historical record of the original ask,
not current instructions — see the note in CLAUDE.md.

Kept: repo name and GitHub Pages URL (`leadradarlabs/top-bins`,
`leadradarlabs.github.io/top-bins`) unchanged, since Neil asked for that
specifically even though the product name changed. Kept the tier scheme
and names as-is, including the "Top Bins" tier label at 100 points — that's
a scoring term, not the product name, so it stays distinct from the rename.

## 2026-11-15 — Last-name-only matching, with a new data constraint

Switched matching from full-name fuzzy match to last-name-only: both the
typed guess and each stored answer are reduced to their last whitespace
token before comparing (edit distance ≤ 2). Typing a full name still works
correctly, since the same last-token extraction is applied to the guess.

This created a new validity rule the old full-name system didn't need: no
two answers in the same prompt can share a last name, or the prompt becomes
unsolvable (whichever one the fuzzy match picks, the player has no way to
specify the other). Audited all 50 deep-cut prompts for this; found two
violations and fixed both:
- `dc-001` ("scored for 5+ PL clubs"): Darren Bent and Marcus Bent collided
  on "Bent". Dropped Darren Bent (Marcus Bent and Les Ferdinand already
  covered the high-tier slots).
- `dc-037` ("has a brother who also played in the PL"): this prompt's whole
  premise is sibling pairs, so three answer-pairs (the Nevilles, the
  Ferdinands, the Tourés) collided by construction — any prompt about
  siblings will, since siblings share a surname. Fixed by keeping only one
  brother per pair (Rio Ferdinand, Gary Neville, Yaya Touré) and adding a
  fourth, non-colliding sibling example (Fábio da Silva) for the tier-100
  slot, rather than trying to patch a structurally incompatible prompt.

## Tier-count exception: some prompts legitimately have only 3 valid answers

The build spec asks for "at least 4 tiers" per prompt, but some true
answer sets are smaller than that in reality (e.g. only three players have
ever won the Premier League Golden Boot with two different clubs). Rather
than invent a fabricated answer to hit a tier-count target, those prompts
ship with however many tiers the real answer set supports (minimum 3),
each still fully verified.
