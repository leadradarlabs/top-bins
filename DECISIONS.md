# Decisions

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

## Tier-count exception: some prompts legitimately have only 3 valid answers

The build spec asks for "at least 4 tiers" per prompt, but some true
answer sets are smaller than that in reality (e.g. only three players have
ever won the Premier League Golden Boot with two different clubs). Rather
than invent a fabricated answer to hit a tier-count target, those prompts
ship with however many tiers the real answer set supports (minimum 3),
each still fully verified.
