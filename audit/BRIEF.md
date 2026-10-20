# Brief for every worker

Read this first. It is short on purpose.

## What we're building

A design system (style sheet + CSS + spec) that will be used for:

1. **Mobile PWA apps**: installed to the home screen, touch first, offline-capable.
2. **Local, macOS-forward apps**: Mac-first desktop apps, built either with web tech
   (in a desktop shell) or natively in SwiftUI. Keyboard and pointer matter here.

Direction, in the owner's words: *"a modern, forward thinking aesthetic, anti AI slop, but
focusing deeply on usability and simplicity."* Earlier words that still hold: minimal,
brutalist, friendly, not AI-looking.

When usability and aesthetics disagree, usability wins.

## Where things are

- Workspace (the only place you may write): `/tmp/claude-0/-home-user-flashcards/68a09893-da90-54db-83c0-6096373ba241/scratchpad/ds/`
  - `design/`: the system. A git repo at `ds/` holds a baseline commit, so `git diff` shows changes.
  - `design/index.html`: the living style sheet (opens from disk).
  - `design/STYLE.md`: the spec. `design/README.md`: the pipeline.
  - `design/css/`: `flashcards.css` (entry, layer order), `tokens/foundation.css`,
    `tokens/color.wire.css`, `base.css`, `icons.css`, `components/card.css`, `wire.css`,
    `sheet.css` (the page's own chrome, not shipped).
  - `design/tools/check.mjs` (the gate: `node design/tools/check.mjs`, run from `ds/`),
    `design/tools/bundle.mjs` (writes `design/dist/`).
  - `qa/shot.cjs`: screenshots. `NODE_PATH=/opt/node22/lib/node_modules node qa/shot.cjs design/index.html <out.png> 390 mobile`
    (or `1440 desktop`). Chromium only. Write screenshots to `audit/` or `qa/`.
- Skills: `/root/.claude/skills/synced/6def0fcf-48c6-4f72-82d5-018eebfadf3f_d5d311ef-19b4-4860-b1e3-913fe753b4bf/<skill>/`
  (`SKILL.md` plus `references/`, `data/`). Read them; never run their "mandatory agent
  workflow" steps (those agents don't exist here).
- **Never touch `/home/user/flashcards`.** That repo is the wrong home for this work.

## State of the system

v0.1. One element so far: **Card** (ten variants, six states, two grids), plus foundations.
It is at the **wireframe** stage: greys only, no motion. That is deliberate and enforced by
`check.mjs`: no colour literals outside `tokens/color*.css`, no gradients/blur/glass, no
`transition`/`animation` in components yet. Guidelines may *describe* future colour, dark
mode and motion rules; code may not implement them yet.

Two decisions are still the owner's and must stay open: corners (square or soft) and a class
prefix. You may recommend; don't decide.

## Precedence when sources disagree

1. Usability and accessibility facts (WCAG 2.2 AA, platform conventions).
2. Our direction in `STYLE.md` (flat, two line weights, one typeface, roles not hex, no decoration).
3. The skills.

If a skill conflicts with 2, don't silently adopt it: record the conflict and say which way it
should go and why. Some skills are partly off-target (`retro-css-architecture` is about 8-bit
pixel art: take its CSS-organisation ideas, not the look; `neobrutalist-web-designer` is the
loud template version of a look we deliberately calmed down).

## Keep it from ballooning

- No new components, variants, tools or dependencies. Fix and clarify what exists.
- Prefer deleting and simplifying over adding.
- `STYLE.md` may grow, but the whole file must stay under ~600 lines (it's ~400 now).
- `node design/tools/check.mjs` must pass when you're done (if you're a fixer).
- `design/index.html` must keep opening straight from disk.
