# Genericisation map: Flashcards style sheet v0.1 -> reusable guide

Read-only adversarial audit of `.../scratchpad/userzip/design` (nothing there was modified).
Everything measured is reproducible from `.../scratchpad/audit-work/exp/*.mjs` (Playwright + Chromium; scripts print JSON) and `.../audit-work/mut/run-mut.sh` (gate mutation tests). Screenshots are in `.../audit-work/shots/`.
Paths below are relative to `design/` unless they start with `v2:` (= `/home/user/styleguide`, read only, commit 0340a41, used only to say what is already done).

## 0. Verdict

1. **The foundation is good and mostly generic.** Tokens, role names, tone API, the `--lift`/`--fill` interaction pair, cascade layers, the stretched-link card, the `var(--x)` discipline and the "comments say which bug a rule prevents" habit are worth keeping nearly verbatim (section A). No `!important`, no `opacity`, no `filter` were found in shipped CSS (grep); layout is logical throughout (the exceptions are the notch's painted backgrounds, card.css:445-459, and `.wf-meter::before { inset: 0 auto 0 0 }`, wire.css:72); and `dist/` is byte-identical to a fresh `bundle.mjs` run.
2. **The rules were written for one app and one element.** Seven of the owner's rules break at the first new elements: `Tag` (static pill vs "pills act"), `Toast`/`Sheet` (raised vs "shadow = pressable"), modal scrim and text over photos (vs "no translucency"), list icon chips (vs "no tinted circles"), `Meter`/skeleton/marquee (vs "motion waits for gate 4"), sheet/dock/toast radii (vs "exactly three radii"), focus ring on ink surfaces (single-colour ring). Section F gives wording for minimal exceptions.
3. **The gate is an honest linter but not yet a gate.** 15 hostile one-line mutations passed it unchanged (named colours, blurred `filter: drop-shadow`, 3-token blurred `box-shadow`, literal `3px` shadow ring, `--card-radius: 14px`, `font:` shorthand with Inter, rem border widths, `opacity` on text, `!important`, px font size, `transition: all` in `base.css`, `scroll-behavior`, a colour inside a `url()`, selector fragments such as `--link` counted as defined tokens, a class defined only in the unshipped `sheet.css`); 7 others were caught. The contrast check **passes vacuously**: any colour it cannot parse (`light-dark()`, `color-mix()`, `oklch(from ...)`) is *skipped*, and skipped is not failed (check.mjs:293). See DEF-2/DEF-3.
4. **Gate 3 (colour/dark) cannot close as written.** `html { color-scheme: light }` lives in `base.css:14`, a later layer than `tokens`, so `color-scheme: light dark` in the new colour file loses. Measured with OS dark emulated: computed `color-scheme: light`, body `rgb(255,255,255)`. README.md:49 says "the diff touches `tokens/` only". It cannot. See DEF-1.
5. **Components are not yet independent of `card`.** The "current surface" contract (`--card-bg/ink/line/ink-soft`) is the only way a Tag, Meter or Button placed on a toned card can adapt, and `wire.css:65-66` already reaches for it with fallbacks. `--tone-bg/--tone-ink` are registered non-inheriting, so any child that is not the `[data-tone]` element never sees them: measured, `.wf-shape path` paints tone-3 whatever the tone (wire.css:53). Rename the contract to `--surface-*` and make it inherit (section C2).
6. **Four layout decisions must be made before element 2:** container on the component root (card collapses to 4 px in flex, dialog, popover, scroller, table cell), `[hidden]` (ignored by every component), the missing `utilities` layer, and where `wire` sits relative to `components` (it currently beats them: a disabled notch card loses its whole silhouette).
7. **The card splits cleanly.** Of ten variants only four are really card (plain, link, notch, stack); panel = bar + disclosure, media = frame, stat = metric, row = list row, ghost = empty slot, study = app layer (section D).
8. **The pipeline is the best idea in the zip and the thing most likely to fail at 40 elements.** One boolean `GATES.motion`, a hard-coded role list, a hard-coded tone loop 1..6, one `index.html`, one hand-ticked table in two places. Section E ports it to per-element machine-readable status with evidence files.

### Zip artefacts vs defects in the sheet

| Observation | Kind |
| --- | --- |
| `node tools/check.mjs` exits 1: `README.md: class .card-inner / .card-face is not in the CSS` (README.md:104). The gate reads `../styles.css` (check.mjs:226) which only exists in the flashcards repo. | **Unzip artefact** (plus a design smell: a shared gate that depends on a sibling app file, silently, via `try/catch`). |
| README "Migrating the app" (README.md:102-111), STYLE.md:205-207 ("the app's existing motion rules"), README.md:110 ("the root README"), index.html:1213-1222 ("Class prefix"). They cite files outside the zip. | **Unzip artefact**; content belongs in the flashcards app (section B). |
| `dist/flashcards.css:31` fonts at `url("../fonts/archivo-latin-var.woff2")` | Correct in tree, **wrong if `dist/flashcards.css` is copied alone** ("what apps copy"). Real, small. |
| Everything else in the defect register below | Defects in the sheet or the gate (reproduced with the zip's own files). |

## 1. Defect register (full evidence also in the structured output)

| id | sev | where | one line | evidence |
| --- | --- | --- | --- | --- |
| DEF-1 | critical | base.css:14, README.md:49,95 | dark mode cannot be added by changing `tokens/` only | emulated dark: computed `color-scheme: light`, body bg white (exp/e6.mjs) |
| DEF-2 | critical | check.mjs:290-296 | contrast gate passes when it cannot parse a colour | mutated colour file with `light-dark(...)`: `ok contrast (skipped 15 pair(s))`, white-on-yellow tones |
| DEF-3 | major | check.mjs (rules 1,2,3,4,5,8) | 15 hostile mutations pass, 1 false positive | `mut/run-mut.sh`; cases in I1 |
| DEF-4 | major | card.css (all `display:` rules) | `hidden` is ignored | `.card[hidden]` `display:flex`, `.card__body[hidden]` `flex`, `.card__ctl[hidden]` `grid` |
| DEF-5 | major | card.css:53 | card collapses to 4 px where it is not stretched | width 4 px in flex row, inline-flex, `flex:none`, `dialog{fit-content}`, abs-pos, inline-block, table cell; 300/900 px in block/grid |
| DEF-6 | major | card.css:76-83 | focus ring invisible on the inverted panel bar | ring `rgb(255,255,255)` on bar `rgb(255,255,255)` (shots/ink-panel-focus.png) |
| DEF-7 | major | card.css:34 | soft ink is below 7:1 on all six tones and is colour logic in a component | 6.76, 6.34, 6.01, 5.58, 5.15, 4.80 on tone-1..6 |
| DEF-8 | major | base.css tone switch, foundation.css:97-105, wire.css:53,65-66 | tone/surface contract does not reach descendants | `svg[data-tone=5] path` fill = `rgb(211,211,211)` = tone-3 fallback, same for tone 1 |
| DEF-9 | major | foundation.css:23 | display type overflows at 320 px | `.t-display` 68 px: "Cards" 302 px in a 288 px box, "Navigation" 543 px |
| DEF-10 | major | card.css:482-508 | study card clips its answer at 200 % text | 6 descendants outside the clipped frame, "Rectangl" (shots/zoom200.png) |
| DEF-11 | major | wire.css:104-110 | layer `wire` beats `components`: disabled notch loses its silhouette | notch `background-image` 4 layers -> 1 hatch layer, border transparent (shots/notch-disabled.png). Still present in `v2:src/wire/wire.css:105` |
| DEF-12 | major | card.css:296-298, 538-542 | two hover rules are not gated by `(hover: hover)` | under `(hover: none)` emulation hover flips ghost to solid/white |
| DEF-13 | major | card.css:419-428, 598-617 | stack sheets vanish in forced colours | shots/forced-stack.png |
| DEF-14 | major | card.css:445-476, wire.css:72 | notch is physical, its button is logical: RTL breaks it (also the meter fill starts at `left`) | button at x 38-82 of a card 24-384, cut at right (shots/rtl.png) |
| DEF-15 | major | icons.css:3-5,22-29 | icon stroke is not the frame weight | stroke 0.92 / 1.50 / 1.84 / 3.34 px at 12 / 20 / 24 / 44 px (exp/e4-e5) |
| DEF-16 | minor | icons.css:22-29 | `.ic` on an `<svg>` paints a solid square | bg `rgb(20,20,20)`, mask `none` |
| DEF-17 | major | fonts.css:13-16 | Archivo subset is Western-European Latin only | missing ł ż ś č ř ş ğ İ ș ț ạ ế, Cyrillic, Greek, ₹ ₩ ₺ ₽, U+202F, → ✓; fvar wght 100-900, wdth 62-125; no `lnum`/`zero` |
| DEF-18 | minor | card.css:222-226, STYLE.md:341 | foot links are 30x24, default is 44 | measured 30x24 in a 44 px foot (v2 fixed: 30x44) |
| DEF-19 | minor | card.css:551, STYLE.md:314 | `aria-selected` / `aria-pressed` are not valid on the card's `article`; disabled anchor stays focusable | axe `aria-allowed-attr` on both; `a[aria-disabled]` focusable, `pointer-events:none` |
| DEF-20 | minor | STYLE.md:281,315,396; wire.css:11 | dashed means "press me" (ghost) and "you can't" (disabled) | spec text |
| DEF-21 | minor | base.css:76-79 | `::selection` invisible on ink surfaces | sel bg `rgb(20,20,20)` = card bg |
| DEF-22 | minor | card.css:419-428, wire.css:92-100, STYLE.md:35,56 | owner's own rules 2 and 3 are already broken | stack has rest shadows; `.wf-pill`/`.sg-tag` are static pills |
| DEF-23 | minor | README.md:47, STYLE.md:335 | 360 px vs 320 px; status table lives in two places | text |
| DEF-24 | minor | check.mjs:31,167,308,55 | gate does not scale: global motion flag, hard-coded roles, tones 1..6, one HTML page | code |
| DEF-25 | minor | sheet.css `.sg-scroll`, index.html | axe at 320 px: `scrollable-region-focusable` (serious), `heading-order` x3, `region` | exp/e1.mjs (docs chrome, not the system) |
| DEF-26 | note | foundation.css:85; card.css:482-508; wire.css:45 | flashcards names live in the shared foundation | see section B |
| DEF-27 | note | flashcards.css:17 | no `utilities` layer, `.sr-only` sits in `base` | a component `position`/`overflow` outranks it |
| DEF-28 | note | dist/flashcards.css:31 | font URL relative to `dist/`, not to the CSS file's new home | unzip-adjacent |

Sheet-page contrast of its own tokens is honest: measured ink-on-tone 15.45, 13.82, 12.31, 10.90, 9.60, 8.40 (matches STYLE.md:185-194), `ink-soft` 8.06 on paper and 7.33 on canvas, focus ring (ink) on every tone >= 8.4, `ink-faint` 3.45 on paper.

---

## A. KEEP VERBATIM

"Verbatim" = same name, same value, same comment. Anything with a caveat says what changes and why.

### A1. Tokens and roles (`css/tokens/*`)

| file:line | what | note |
| --- | --- | --- |
| foundation.css:13-14 | `--font-sans`, `--font-mono` | names stay; the *face* (Archivo) is a palette-level swap (section C3) |
| foundation.css:16-23 | `--text-xs ... --text-4xl` | keep names and clamp formulas **except** `--text-4xl` minimum (DEF-9). `--text-lg` 20 px, `--text-xl` 24-32 px |
| foundation.css:25-33 | `--lh-*`, `--ls-*` | keep |
| foundation.css:37-42 | `--type-display/title/label/body/meta/figure` as whole `font` shorthands | keep. Trap to document: a `font:` shorthand **resets** `font-variant-*`, so `tabular-nums` must come after it (the zip does this correctly at card.css:190, 198) |
| foundation.css:45-56 | `--space-0..9`, `--gutter`, `--measure` | keep; `--measure` is unused today (card.css:183 hard-codes `40ch`): wire it in |
| foundation.css:60-62 | `--bw`, `--bw-thin`, `--bw-heavy` | keep; px on purpose (correct) |
| foundation.css:68-74 | `--radius-1/2/3`, `--radius-pill`, `--radius-card/tile/ctl` | keep; roles set per corner mode (sheet.css:29-33 moves to tokens, C5) |
| foundation.css:78-81 | `--hit`, `--ring`, `--ring-offset`, `--ring-offset-in` | keep |
| foundation.css:84, 88-92 | `--ratio-media`; `--dur-press/hover/move`, `--ease-out`, `--ease-flip` | keep (declared, unused: fine until gate 4). `--ratio-study` -> B |
| foundation.css:97-105 | `@property --tone-bg/--tone-ink` (`inherits:false`) | keep the *idea*; it is the reason a toned card does not paint its children. Extend (C2) |
| color.wire.css:16-26 | `--grey-0..10` | keep as the `wire` palette. The only hex in the system |
| color.wire.css:29-38 | `--canvas --paper --ink --ink-soft --ink-faint --line --line-soft --focus --accent --on-accent` | **the public role API. Keep every name** (README.md:89-91 already promises it) |
| color.wire.css:41-55 | `--tone-1..6`, `--on-tone-1..6` | keep as slot inputs |

### A2. Base (`css/base.css`)

| line | what | note |
| --- | --- | --- |
| 5-9 | `box-sizing` | keep |
| 17-25 | body defaults | keep except `-webkit-font-smoothing: antialiased` (macOS thins 14 px text; contradicts the 7:1 intent): drop or justify |
| 27-46 | margin resets; `ul, ol { list-style: none }` + the `role="list"` comment | keep, the Safari note is correct and useful |
| 55-61 | form controls inherit font | keep (add 16 px minimum for fields, C3) |
| 71-74 | global `:focus-visible` ring | keep as the base; make it two-tone (F12) |
| 81-89 | `.sr-only` via `clip-path` | keep, move to `utilities` layer (DEF-27) |
| 95-127 | `.t-display/title/label/body/meta/figure` | keep |
| 134-167 | `[data-tone="1".."6","ink"]` switch | keep the API; generate the block |

### A3. Card (`css/components/card.css`): the parts that are already the generic pattern

| line | what |
| --- | --- |
| 8-15 | the "house rules" header (incl. "never put `cqi` on `.card` itself", explained by the bug it prevents). This is the model for every component header |
| 17-27, 41-47, 514-548 | `--lift` / `--fill` as registered numbers that every state sets; one definition for hover, focus and press. Move the `@property` pair to tokens |
| 29-60 | the frame: flex column, `overflow: clip`, `container`, private roles (`--card-bg` etc.), composed `box-shadow` of three named layers |
| 138-207 | media, head, body, eyebrow, title, text, meta, figure (with `cqi` on the parts) |
| 210-220 | foot with `margin-block-start: auto` (cards in a row end on one line) |
| 357-392 | **stretched link**: anchor in the title, `::after { inset: calc(var(--bw) * -1) }`, ring worn by the card via `:has(.card__link:focus-visible)`, `overflow-clip-margin: border-box`. This is the best reusable pattern in the zip; it becomes the shared "whole surface is one link" behaviour (D) |
| 437-476 | notch painted by four flat layers (keep, fix RTL) |
| 551-554 | selected = a second ring that doubles the frame, nothing shifts (structural cue, survives forced colours via 598-617) |
| 574-592 | `.card-grid` / `--tiled` shared-border trick (moves to layout) |
| 598-617 | forced-colours block: states get a line when shadows vanish (extend to stack, DEF-13) |

### A4. Icons, fonts, tools, docs

| where | keep |
| --- | --- |
| icons.css:51-61 | the forced-colours paragraph and `.ic { forced-color-adjust: none; background-color: CanvasText }`: correct and rare |
| fonts.css:6-17 | one variable file, `font-display: swap`, `unicode-range`; add subsets, keep the pattern |
| flashcards.css:4-25 | "one file an app links", layer order as architecture, `@import ... layer()` list |
| tools/bundle.mjs:27-43 | `inlineImports` (wraps in layers) and `inlineFonts` |
| tools/check.mjs:43-55, 105-126 | comment stripping, `balanced`/`splitTop`; the **ideas** of rules 1-9 (keep all nine, fix the holes listed in DEF-2/DEF-3) |
| STYLE.md:19-57 | the rule table with "how it's enforced" and **The test** (squint, cover the logo, count, read aloud) |
| STYLE.md:230-241, 247-262, 355-378 | house rules, anatomy table, do/don't, known limits: use as the template for every element's section |
| README.md:44-51, 68-81 | gate table (name / decides / not yet / exit), "Adding an element" |
| index.html:1245-1311, 1313-1340 | `data-sg-code` (markup printed from the live element: specimen and code cannot drift) and the live contrast read-out (`getComputedStyle` -> canvas -> luminance) |
| index.html §06, sheet.css `.sg-bad` | the "Not this" comparison: make one per element |
| sheet.css:205-244 | `.sg-seg` (radio-backed segmented control with `:has(input:checked)` and an inset ring): the seed of the `Segmented` element |
| sheet.css:60-79 | skip link |

---

## B. FLASHCARDS-SPECIFIC: remove or isolate

"Guide" = stays in the reusable repo in neutral form. "App layer" = moves to `apps/flashcards/` (or the flashcards repo) and is built *from* the guide.

| what | where (file:line) | goes to | neutral replacement in the guide |
| --- | --- | --- | --- |
| product name in file, title, brand, footer | css/flashcards.css (file name; README.md:20,72,96,99; bundle.mjs:9,50,52,58,66); STYLE.md:1; README.md:3; index.html:6,9,18,1228 | guide | `styleguide.css` (v2 already). Title "Cards . Style guide" |
| `--ratio-study: 5 / 7` | foundation.css:85 | **app layer** | `--ratio-portrait: 5 / 7` (v2 has it). App sets `--ratio-study` if it wants the old name |
| `.card--study`, `.card__answer` | card.css:478-508; STYLE.md:282,373; index.html §3.10 | **app layer** (`apps/flashcards/flashcard.css`) | none. The pieces it uses stay generic: `aspect-ratio: var(--ratio)`, a three-row grid, centred stage |
| `.card__stage` | card.css:489-494; STYLE.md:255 | guide, keep | generic "centre stage" of a tall card; keep the name |
| the flip (perspective on parent, backfaces, `--ease-flip`) | STYLE.md:205-207; README.md:110 | **app layer** | generic recipe page "Flip card (optional motion)" at gate 4; keep `--ease-flip` as a token named for the curve (`--ease-in-out-strong`, alias the old name) |
| `.wf-shape` "the app's own shapes, drawn from decks.js" | wire.css:45-57; STYLE.md:390; index.html:804 | **app layer** | `.wf-art` (generic illustration placeholder); fix the tone bug (DEF-8) |
| sample copy: Shapes x15, "Deck . 12 cards", Colours, Numbers to twenty, Farm animals, Triangle, Diamond, Crescent, Hexagon, "Circle to crescent. Swipe through them and tap to see the name.", "Tap to flip", "Known since Tuesday", "Deck 01", "5 of 12 known" | index.html (counts by grep), STYLE.md:42,282; README.md:46,71 | **app layer** for the flashcards page | a **copy bank** (`docs-src/copy.md`): three neutral domains (a household budget, a task list, a photo editor), each with 10 titles, amounts, dates, statuses, so agents stop inventing and rule 5 ("say something real") stays enforceable |
| rule 5 wording "Copy comes from the app: shapes, decks, cards known, streaks" | STYLE.md:41-42; index.html:106 | guide, reword | "Copy is specific to a kind of app (a budget, a to-do list, a photo editor). No lorem ipsum, no 'John Doe', no 'seamless'. Draw from the copy bank." |
| "Migrating the app" (`../styles.css` owns `.card`, `.card-inner`, `.card-face`; `--t1..--t6` -> `--tone-N`) | README.md:102-111; STYLE.md:378; check.mjs:223-227; index.html §07 "Class prefix" | **app layer** (`apps/flashcards/MIGRATION.md`) | guide page "Adopting in an existing app" (below) |
| `check.mjs` reading `../styles.css` | check.mjs:224-227 | remove | pass extra allowed class names via `--allow-app-classes path` |
| `.is-*` state-forcing classes | card.css (is-hover/focus/active/selected/disabled) | guide, keep, label "test hooks, not API" | lint: forbidden outside `docs-src/` and `tests/` |
| `.sg-*` docs chrome (64 classes) | sheet.css | guide docs | rename `.dx-*` so `sg` stays free as the library namespace (`@layer sg.*`, `window.SG`, `data-sg-*`) |

**"Adopting in an existing app" (replaces README.md:102-111).** The real cause of the `.card` collision is the cascade, not the names: *unlayered app CSS beats every layered rule, whatever the specificity*, including a bare `button { background: none }` from the app. Recipe: `@layer legacy, sg.reset, sg.tokens, sg.base, sg.layout, sg.components, sg.wire, sg.utilities; @import url("styles.css") layer(legacy);` then move rules out of `legacy` one element at a time. (Layering the old CSS makes the guide win where both set a property, but properties only the old `.card` sets still merge in: the owner's README is right that the old `.card*` rules have to be renamed or deleted as each element is adopted.) Class prefix stays an open decision, but make it a **build flag**, not a source rename: `bundle.mjs --prefix sg-` rewrites class selectors in a second output (`styleguide.prefixed.css`); the source keeps the owner's short names.

---

## C. TOKEN CONTRACT

Inventory (script: `audit-work/exp/inv.mjs`): **119 custom properties are defined** (121 by the gate's own regex, which also counts `--ghost` and `--link` out of the selectors `.card--ghost:is(` and `.card--link:is(`: DEF-3) and **119 classes** exist (64 are `.sg-*` page chrome). Every one is covered below with a decision; a range such as `--grey-0..10`, `--space-0..9`, `--text-xs..4xl`, `--tone-1..6`, `--on-tone-1..6`, `--radius-1/2/3`, `--icon-*`, `--card-bg/ink/line/ink-soft`, `--card-bar-bg/-ink` or `--dur-*` stands for each member, and `--ratio-study` is decided in B.

Decisions use four verbs: **keep** (name and meaning frozen), **rename** (old name stays as an alias for one minor version), **split** (one token becomes two with different jobs), **add** (new sibling, no existing name changes).

Naming policy for additions (so the new tokens look like the owner wrote them): short nouns; numeric siblings `-2`, `-3` (as `--tone-N`, `--grey-N`, `--space-N`); `--_x` for component-private properties (as `v2:src/components/button.css`); a component's documented hooks keep the `--card-*` style; nothing new is unprefixed if it is generic English (`--value`, `--ratio`, `--stack`, `--col`: see C12).

### C1. Colour roles

| token(s) | decision | notes / siblings to add |
| --- | --- | --- |
| `--grey-0..10` | keep | the `wire` palette. Nothing outside `tokens/color*` and `tokens/palettes` may read them (check rule 6) |
| `--canvas`, `--paper`, `--ink` | keep | add the depth ladder below; flat depth = tone steps (img1/4/6: surface-0..3) |
| `--ink-soft` | keep | must be >= 7:1 on canvas, paper **and every surface sibling** (measured today: 8.06 paper, 7.33 canvas) |
| `--ink-faint` | **split** | today it is both "disabled text" and "quiet decoration". Text at 3.45:1 (measured) is never enough for words (DEF-7/F14). Keep `--ink-faint` = quiet decoration/disabled *lines* (>= 3:1), add `--ink-off` = disabled *text*, >= 4.5:1 |
| `--line` | keep | control boundary, >= 3:1 |
| `--line-soft` | keep | decorative hairline only (today = `--grey-8` = 3.45:1, which is *more* than hairlines need). Document "never the only boundary of a control" |
| `--focus` | keep, **add** `--focus-2` | `--focus` = ring colour, `--focus-2` = halo colour (opposite polarity), `--focus-shadow` = the two-tone composite. A component with its own `box-shadow` must keep it: `box-shadow: var(--focus-shadow), <own>` |
| `--accent`, `--on-accent` | keep | the one "press this" colour. Add `--accent-line` only if an accent fill fails 3:1 against its surface |
| **add** `--paper-2`, `--paper-3` | add | alt row / hover row / pressed fill (one and two steps from paper toward ink). Dark themes need the same ramp (img6 measured 4 steps) |
| **add** `--well` | add | sunken: input, track, segmented track, code block. Boundary still `--line` (a fill difference alone is never a boundary) |
| **add** `--off-fill` | add | fill of a disabled control; the *cue* stays dashed frame + words, never fill alone |
| **add** `--scrim`, `--on-scrim` | add | the single allowed translucent value (F1). Alpha >= 0.65 (6.98:1 for white text over a white photo; 0.55 is only the AA floor at 4.76:1), flat. Declare on `:root, ::backdrop` (older engines do not inherit custom properties into `::backdrop`) |
| **add** `--select-bg`, `--select-ink` | add | replaces the `::selection` line at base.css:76-79 (invisible on ink surfaces, DEF-21); set per surface |
| **add** `--ok`, `--warn`, `--bad`, `--info` | add | *line/text-safe on canvas and paper* (>= 7:1 text, >= 3:1 line) for form errors and inline status text. Status on a **surface** goes through `data-tone` (C2), never through these. Status always = icon + words |

### C2. Tone and surface contract (how six numbered slots reach 40 elements)

Today: `data-tone="1..6|ink"` sets `--tone-bg` and `--tone-ink` **on that element only** (registered `inherits:false`, foundation.css:97-105). A component decides what to do with them. That is right for the *paint* and wrong for everything that has to sit *on* the paint.

**Proposal: two layers of names.**

1. `--tone-N` / `--on-tone-N` (palette inputs, **keep**) -> picked by `[data-tone]` into six element-scoped roles (non-inheriting, **keep the mechanism, add roles**):

| role (set by `[data-tone]`, non-inheriting) | job | min contrast (default) | status |
| --- | --- | --- | --- |
| `--tone-bg` | the fill | n/a | keep |
| `--tone-ink` | text on the fill | 7:1 | keep |
| `--tone-ink-soft` | secondary text on the fill | 7:1 (today 4.8-6.8, DEF-7) | **add**; replaces `color-mix(72%)` at card.css:34 |
| `--tone-line` | border/rule on the fill | 3:1 | add |
| `--tone-fill` | a solid that sits **on** the tone (meter bar, pill, toggle on) | 3:1 vs `--tone-bg` | add |
| `--tone-on-fill` | text on `--tone-fill` | 7:1 | add |

2. **The surface contract** (inheriting; this is what lets a Tag, Meter or Button adapt to where it is placed). Rename `--card-bg/-ink/-ink-soft/-line` to `--surface-bg/-ink/-ink-soft/-line` and **make them inherit** (plain, unregistered custom properties already do). Any element that paints a background sets all four from its tone or from paper; `[data-tone]` itself sets them too. Every other element reads `--surface-*` for anything that must contrast with "what am I on". Evidence that the contract already exists: wire.css:65-66 reads `var(--card-bg, var(--paper))` and `var(--card-ink, var(--ink))`; the ring patches at card.css:76-83 exist because the ring cannot know the surface. Keep `--card-bg...` as aliases: `.card { --card-bg: var(--surface-bg) }`.

   Rule that makes it safe: *anything that paints a background must redefine `--surface-*`*, because a descendant otherwise reads the wrong surface (a button inside a toned tile inside a card). Lint: a component rule that sets `background`/`background-color` on a container class must also set `--surface-bg`.

3. **Scaling the vocabulary** (all on the **same element** as `data-tone`; components never branch on any of them):

| attribute | values | meaning | contract |
| --- | --- | --- | --- |
| `data-tone` | `1`..`6`, `ink` (owner's) | rhythm and grouping. **Never meaning** (STYLE.md:358) | apps may define `7..9` by supplying `--tone-7`, `--on-tone-7`; the gate must discover slots from the CSS, not loop 1..6 (check.mjs:308) |
| `data-tone` | `ok`, `warn`, `bad`, `info` | status. Always with icon + words | same six roles, hue from `--hue-*`; ok to share one formula (v2 does) |
| `data-emphasis` | `soft` (default, pastel), `bold` | *soft*: light fill, dark ink. *bold*: mid-dark fill, near-white ink. Same six roles, different numbers | one formula per emphasis; the contrast matrix loops tone x emphasis x theme x contrast x palette |
| `data-tone="paper" / "well"` | optional | neutral surfaces in the ladder (C1) | lets a sheet or input be "a tone" without a hue |

   Why not just more tones? Because 6 pastel surfaces cannot carry marks: a pastel fill (L >= 0.92) is ~1.2:1 against paper, so **chart marks, toggle tracks and meter bars use `--tone-fill`**, not `--tone-N`. For >6 series use patterns (C8 patterns) plus direct labels, not more hues.

4. **Dark, high contrast, palettes** change only numbers behind the same names (C10).

### C3. Type

| token(s) | decision | notes |
| --- | --- | --- |
| `--font-sans`, `--font-mono` | keep | Tailwind v4 uses the same names (C12). Face is a palette swap; fallback stack has no `wdth` axis (see DEF-17) so add a metric-adjusted fallback `@font-face` (`size-adjust`) |
| `--text-xs..4xl` | keep | `--text-4xl` min 4.25 rem -> 2.5 rem (DEF-9). Do **not** add `--text-base`/`--text-2xs` |
| `--lh-*`, `--ls-*` | keep | |
| `--type-display/title/label/body/meta/figure` | keep | |
| **add** `--type-ctl` | add | what you read on a button/control: 600, 1rem, line-height 1 (v2 has it) |
| **add** `--type-field` | add | **>= 16 px** (`--text-md`), 400. Below 16 px iOS Safari zooms the page on focus, so `--type-meta` (14 px) must never style an input |
| **add** `--type-caption` | add | 12-13 px floor for non-essential text only; `--type-label` is the structural caps role |
| **add** `--type-code` | add | `--font-mono`, tabular |
| **add** `--label-case` | add | `uppercase` (default) or `none`; consumed by `.t-label`, `.card__label`, `.wf-tag`, `.sg-tag` -- today `text-transform: uppercase` is repeated at base.css:98,110, card.css:102, wire.css:39. One switch makes "sentence-case labels" an accessibility preference (F5) |
| `.t-*` | keep | add `.t-ctl`, `.t-field`, `.num` (tabular), `.t-label--plain` |

### C4. Space

| token | decision | notes |
| --- | --- | --- |
| `--space-0..9` | keep | **4, 8, 12, 16, 24, 32, 48, 64, 96 px.** It is an *index*, not a multiplier: `--space-5` is 24 px, where Tailwind's `p-5` is 20 px; `--space-8` is 64 px, `p-8` is 32 px. Lint: forbid `calc(var(--space-N) * k)` |
| `--gutter`, `--measure` | keep | `--measure` should style `.t-body` and `.card__text` (card.css:183 has `40ch`) |
| **add** half steps only when an element needs them: `--space-2h` 10 px, `--space-4h` 20 px, `--space-6h` 40 px | add (sparse) | the 20 and 40 px steps are missing and list rows, sheets and keypads want them (img1 rows 76 pt, img4 padding 18-20). A lint lists which elements may use half steps |
| **add** `--page-x` | add | `max(var(--gutter), var(--safe-left))` (and right); the app-edge padding |

### C5. Line, shape, corners

| token | decision | notes |
| --- | --- | --- |
| `--bw`, `--bw-thin`, `--bw-heavy` | keep | "two line weights" = structure. `--ring` and `--bw-heavy` are the only other widths (F8) |
| `--radius-1/2/3`, `--radius-pill` | keep | primitives (6, 12, 24 px, 999 px) |
| `--radius-card`, `--radius-tile`, `--radius-ctl` | keep | roles, set per corner mode |
| **add** `--radius-float` | add | sheet top corners, dock, toast, popover, dialog: "rounded means floating" (img8). Square mode = 0 |
| **add** `--radius-avatar` | add | default `var(--radius-tile)`; the app may set `var(--radius-pill)`. One line decides the avatar question (F3) |
| **add** concentric helper | add | inner radius = `max(0px, calc(var(--radius-outer) - var(--pad)))`, never larger than its container's (img1/2/9 all measure concentric radii) |
| corner switch | **move** | sheet.css:29-33 (`:root:has(#shape-soft:checked)`, docs only) -> `tokens/corners.css`: `:root, [data-corners="square"] {...}` and `[data-corners="soft"] {...}`. Islands work; the page's radio only sets the attribute |
| gate rule 4 role list | **make data-driven** | check.mjs:167 hard-codes `card|tile|ctl|pill`; parse `--radius-*` role declarations from tokens instead |

### C6. Hit area, focus, control and icon sizes

| token | decision | notes |
| --- | --- | --- |
| `--hit` (2.75 rem) | keep | drawn size may be smaller, the hit area never; neighbours' hit areas must not overlap (F11) |
| `--ring`, `--ring-offset`, `--ring-offset-in` | keep | add `--ring-halo` (1-2 px) for the two-tone ring |
| **add** `--ctl-sm` 2.25 rem (36), `--ctl` = `--hit`, `--ctl-lg` 3.5 rem (56) | add | drawn heights; hit area stays 44 via `::after` (the `v2:src/components/button.css` pattern). Primary targets 56 (img1/6/7 measured 52-58) |
| `--ic-size` (1.25 rem default) | keep, **add** `--ic-sm` 1 rem, `--ic-md` 1.25 rem, `--ic-lg` 1.5 rem, `--ic-xl` 2 rem | `--ic-size` stays the per-use override hook |
| **add** `--safe-top/right/bottom/left` | add | `env(safe-area-inset-*, 0px)`, all four sides (landscape phones have side insets) |
| **add** `--appbar-h`, `--dock-h` | add | set by sticky chrome; `scroll-padding` reads them so focus is never hidden (WCAG 2.4.11). The zip has this only as `scroll-padding-block-start: 3.5rem` in the docs page (sheet.css:12) |

### C7. Layers, z-index, containers

Zip: `@layer tokens, base, components, wire, sheet;` (flashcards.css:17).

| layer | decision |
| --- | --- |
| `sg.reset` | **add** first. `[hidden] { display: none !important }` lives here (DEF-4), the one place `!important` is allowed besides `.sr-only` |
| `sg.tokens`, `sg.base` | keep order. Move `color-scheme` out of `base` into `tokens` (DEF-1) |
| `sg.layout` | **add** between base and components: stack/cluster/split/grid/scroller/app shell. `.card-grid` becomes `grid` here |
| `sg.components` | keep |
| `sg.wire` | keep, but **move below components** (DEF-11). Wire may never style a component class; the hatch moves to a token (`--pattern-hatch`) used by the component's own disabled rule |
| `sg.utilities` | **add last**: `.sr-only`, `.num`, `.t-*` helpers, `[data-ratio]`. Needed because components' `font:`, `position`, `overflow` outrank base (DEF-27) |
| `docs` (was `sheet`) | docs site only, never in `dist/` |

| token | decision |
| --- | --- |
| **add** `--z-raised` 10, `--z-sticky` 20, `--z-dock` 30, `--z-overlay` 40 | in-flow layers only; dialogs, popovers and toasts use the browser top layer. The card's three `z-index: 1` (card.css:518,525,553) are component-local and stay `1` |
| **add** `--container-sm/md/lg/xl` | page max widths. Caution: Tailwind v4 defines `--container-sm` as 24 rem (C12) |
| container decision | see section D.5: containers belong to layout **slots**, not to shrink-wrappable components |

### C8. Motion and patterns

| token | decision | notes |
| --- | --- | --- |
| `--dur-press` 130, `--dur-hover` 200, `--dur-move` 520, `--ease-out`, `--ease-flip` | keep | unused until gate 4 (per element, E). `--dur-flip` is app layer |
| **add** `--move` (1 -> 0 when reduced), `--press-scale`, `--anim-spin` | add | travel = `transform` x `--move`, so reduced motion becomes a fade, never an instant jump (WCAG 2.3.3) |
| **add** `--pattern-hatch`, `--pattern-dots`, `--pattern-check` | add | hard-stop `repeating-linear-gradient` tokens (not smooth gradients) for disabled, chart series, skeleton. Gate exemption: equal adjacent stops are already exempt for flat fills (check.mjs:137); extend to "all stops are hard" (F15) |

### C9. Interaction numbers and component hooks

| token | decision | notes |
| --- | --- | --- |
| `--lift`, `--fill` (`@property <number>`, `inherits:true`) | keep names; move the `@property` pair to tokens; **fix inheritance** | `inherits:true` makes a hovered card's `--lift:1 --fill:1` flow into every descendant that does not reset them: measured, a `span` inside `.card--link.is-hover` reads `--fill: 1` (exp/e13.mjs), so a future Chip or Button placed in a hovered card would render pressed/filled. The card resets at card.css:43-44; `.card__action` intentionally does not. Rule: every pressable root declares `--lift:0; --fill:0`; "follow the host" parts use a different name (`--host-fill`) |
| `--shadow-lift` | rename `--_press` (private) | it is the hard press shadow; formula repeated per pressable root (one line, lint compares text) |
| `--shadow-select` | rename `--_select-ring` | it is a **spread ring, not a shadow**. The gate's regex treats every `--shadow-*` as a shadow (check.mjs:143) |
| `--shadow-stack` / `--stack` | rename `--_stack` / `--stack-offset` | drawing, not elevation (F2) |
| `--card-bg/ink/line/ink-soft` | rename -> `--surface-*` (C2) | alias kept |
| `--card-bar-bg/-ink` | rename `--bar-bg/-ink` | belongs to the `bar` element (D) |
| `--card-pad`, `--card-gap`, `--card-radius`, `--card-min` | keep | documented card hooks. `--card-pad` holds `cqi`: it only resolves correctly on the **parts** (card.css:8-15, keep the comment) |
| `--notch-w`, `--notch-h` | keep | |
| `--ratio` (`var(--ratio, var(--ratio-media))`, card.css:139) | keep, document | the universal aspect hook for any frame |
| `--value` (wire.css:61) | keep as the public `0%-100%` hook of Meter | generic English; v2-style prefix not needed if documented |
| `--ghost`, `--link`, `--w`, `--r`, `--col` | drop / docs-only | `--ghost`, `--link` are gate false positives; `--w --r --col` are inline hooks on the docs page |
| `--sg-pad` | docs | rename `--dx-pad` |

### C10. Where each switch attaches (existing names, layer order)

All switches are attributes on `<html>` **or any element** (island). Everything lives in `sg.tokens`, in this file order, because later blocks of equal specificity win:

```
00-foundation  type, space, line, hit, sizes, z, safe, containers, ratios        + all @property registrations
10-color       roles from knobs; color-scheme; surface ladder; status; scrim; select; focus halo
20-tones       slots, [data-tone], [data-emphasis], status tones, ink
30-corners     [data-corners="square|soft"] -> --radius-card/tile/ctl/float/avatar
40-palettes    [data-palette] (wire = the owner's greys, default) -> hue/chroma knobs, accent, canvas tint, ink hue, font (optional)
50-fonts       @font-face
60-motion      durations, easing, --move, --press-scale; [data-motion="reduced|full"] + prefers-reduced-motion
70-patterns    hard-stop pattern tokens
```

| switch | attribute | mechanism | changes | never changes |
| --- | --- | --- | --- | --- |
| theme | `data-theme="light\|dark"` (absent = OS) | `:root { color-scheme: light dark }`, `[data-theme="dark"] { color-scheme: dark }`; roles written once as `light-dark(a, b)`. **No** duplicated dark block | colour roles | shapes, sizes |
| contrast | `data-contrast="more"` (absent = `@media (prefers-contrast: more)`) | knobs only: lightness gaps up, `--line-soft` -> `--line`, `--ink-faint` -> `--ink-soft`, `--ring` 3 -> 4 px. Identical blocks for the media query and the attribute (lint compares them) | colour knobs, ring width | layout |
| palette | `data-palette="wire\|..."` | sets the **knobs** (`--tone-h-N`, `--tone-c-N`, accent hue, canvas tint). Must also re-declare the *derived* roles on the same selector (`:root, [data-palette] { --tone-1: ... }`), otherwise an island inherits the parent's already-substituted values | hue, chroma | contrast floors |
| corners | `data-corners="square\|soft"` | four radius roles | radii | everything else |
| motion | `data-motion="reduced\|full"` | `--move`, `--press-scale`, duration multiplier | travel, scale | durations never become 0 |
| (not in the owner's sheet) surface look | -- | the owner has **one** surface grammar (hard shadow, 2 px frame). A soft look changes rules 2 and 3, so it would be a separate `data-look`, not part of this guide unless the owner decides so | | |

The island pattern is the main technical trap: custom properties that use `var()` are substituted at the element that declares them. Derived roles must be re-declared wherever a knob can change.

### C11. Classes: decisions

| group | classes | decision |
| --- | --- | --- |
| type | `.t-display .t-title .t-label .t-body .t-meta .t-figure` | keep; add `.t-ctl .t-field .num` |
| a11y util | `.sr-only` | keep; move to `utilities`; add `.visually-hidden` alias |
| icon | `.ic`, `.ic--arrow .ic--plus .ic--minus .ic--close .ic--check` | keep as the **mask** API. Generate the rest from `src/icons/*.svg`. Guard against `<svg class="ic">` (DEF-16). Sprite API uses a different class (`.icon`) |
| card core | `.card .card__bar .card__label .card__ctl .card__media .card__head .card__body .card__eyebrow .card__title .card__text .card__meta .card__figure .card__foot .card__row .card__group .card__list .card__action .card__tile .card__main .card__trail .card__link .card__stage` | keep `.card`, `__head/body/foot/eyebrow/title/text/meta/row/group/link/stage`; the rest move to their own elements (section D); keep the old class names as aliases during migration |
| card variants | `.card--square .card--row .card--link .card--ghost .card--stack .card--notch .card--study` | `--square`, `--link`, `--notch`, `--stack` stay on card; `--row`, `--ghost` graduate (D); `--study` -> app |
| layout | `.card-grid .card-grid--tiled` | -> `grid`, `grid--tiled` in `sg.layout` (`--card-min` -> `--grid-min`, old name alias) |
| answer | `.card__answer` | app |
| state hooks | `.is-hover .is-focus .is-active .is-selected .is-disabled` | keep as test hooks only |
| wire | `.wf-media .wf-tag .wf-shape .wf-meter .wf-pill` | keep dev-only; `.wf-shape` -> `.wf-art`; `.wf-meter`, `.wf-pill`, `.wf-tag` die when Meter and Tag ship (their *real* versions follow the contract in C2) |
| docs | `.sg-*` (64) | rename `.dx-*` |
| variants axis | data attributes | **structure variant = modifier class (owner's)**; presentation axes (tone, emphasis, size, shape, corners) = `data-*`. Matches the owner's `data-tone` and `v2:src/components/button.css` |

State hooks come from ARIA and native attributes (STYLE.md:311-316), but **`aria-selected` and `aria-pressed` are not allowed on an `article`** (axe `aria-allowed-attr`, exp/e12.mjs), so the card's `[aria-selected]` state hook (card.css:551) is only valid on a card that has `role="option"`, `row`, `tab` or `gridcell`. Add a state -> allowed-roles table to STYLE.md:

| state | attribute | valid on |
| --- | --- | --- |
| current | `aria-current` | any (card, row, nav item) |
| selected | `aria-selected` | `option`, `tab`, `row`, `gridcell` |
| pressed / on | `aria-pressed` | `button` |
| checked | `aria-checked` / `:checked` | `checkbox`, `radio`, `switch`, `menuitemcheckbox` |
| expanded | `aria-expanded` | `button`, `link`, `combobox`, `summary` |
| disabled | `disabled` / `aria-disabled` | native controls; `aria-disabled` also `link` (still focusable: add a click guard, DEF-19) |
| busy | `aria-busy` | any |

### C12. Collisions to avoid

| the zip's name | collides with | consequence | do |
| --- | --- | --- | --- |
| `--space-1..9` = 4, 8, 12, 16, 24, 32, 48, 64, 96 | Tailwind-like `N x 4 px` (`p-5` = 20, `p-8` = 32) | silent 20-50 % spacing errors when an agent or contributor assumes the multiplier | document as an index; lint `calc(var(--space-N) * k)`; publish the table in STYLE.md (done in C4); half steps named `-2h` not `-2.5` |
| `--text-xs..4xl` | Tailwind v4 theme variables of the same names (`--text-xl` = 1.25 rem there, 24-32 px here) | whichever `:root` declaration comes later wins (layer order only arbitrates between layered rules) | namespace stays (owner's), add a one-line note and a `--sg-` export only if a Tailwind app adopts it |
| `--font-sans`, `--font-mono`, `--ease-out` | Tailwind v4 theme variables, same names | font or easing silently replaced | same |
| `--ring` (a 3 px **width**) | shadcn/ui and Radix themes use `--ring` as a **colour** | `border: 1px solid var(--ring)` in a shadcn component becomes a width | keep the owner's name; do not co-install shadcn tokens; alias `--ring-w` for new code |
| `--container-sm` (v2: 30 rem) | Tailwind v4 `--container-sm` = 24 rem | same name, different meaning | call them `--page-sm..xl` |
| `--accent`, `--canvas`, `--line`, `--focus`, `--fill`, `--lift`, `--value`, `--ratio`, `--stack`, `--col` | generic English; any app may already define them | silent override | public ones documented; private ones `--_x` |
| `.t-*` | none in Tailwind/Bootstrap (they use `text-*`); but the flashcards app has `--t1..--t6` for **tones** | reader confusion `t-` = type vs tone | keep `.t-*`; the app alias `--t1..6` lives in the app layer |
| `.ic` (mask) vs an SVG sprite | `<svg class="ic"><use/></svg>` gets `background: currentColor` and `mask: none` = a solid square (measured: bg `rgb(20,20,20)`, mask `none`) | broken icons | sprite class `.icon`, plus `svg.ic { background: none; mask: none }` |
| `.ic` masks: inline `data:` URIs in CSS | 5 icons ~ 0.3 KB each; 100 icons ~ 30-100 KB of render-blocking CSS, no per-icon cache, one colour, stroke baked | CSS bloat, DEF-15 | generate `icons.css` (masks, for `::before` and CSS-only contexts) **and** `icons.svg` (sprite, for inline) from the same `src/icons/*.svg`; ship masks only for icons the guide itself uses |
| `.card`, `.row`, `.btn`, `.tag`, `.badge`, `.modal`, `.toast`, `.stat` | Bootstrap / DaisyUI / the owner's own `styles.css` | unlayered app CSS always wins over layered guide CSS | layers + `legacy` recipe (B); optional prefixed build |

---

## D. HOW THE CARD SCALES

### D.1. The ten variants are not ten cards

`card.css` is 617 lines for one element. Extrapolated (each of ~45 elements with 6-10 variants) that is the 2,000-line file the question fears, and the next agent will copy the pattern of "one more `--modifier` on `.card`". The test for splitting: *does the variant add its own slot, its own container behaviour, its own ARIA role or its own reason to exist outside a card?* If yes it is an element.

| variant (card.css) | what it really is | target | how it relates to elements not built yet |
| --- | --- | --- | --- |
| Plain `.card` + body + foot | **the card** | `card` | container for everything below; the only one with no other home |
| Panel (`__bar`, `__ctl`, `__list`) | titled container that folds away | `panel` = card + `bar` + disclosure (`<details>`/`aria-expanded`, `hidden`: needs DEF-4) | `dialog` and `sheet` are the same anatomy in the top layer; `popover`/`menu`; img3 "window"; img6/7 tool tray header (cancel / title / apply) = `bar` |
| `.card__bar`, `.card__label` | title bar | `bar` (own file) | app bar (img5/7), tray header, dialog header, sheet header |
| `.card__ctl` (square) and `.card__action` (round) | **buttons** | `button` with `data-shape="square\|circle"` | every icon button in img2/4/5/6/7/9; both need `aria-label` and a 44 px `::after` |
| Media `.card__media` | aspect-ratio frame | `frame` | media tile with caption bar (img8), photo/video stage (img6/7), thumbnail tiles, colour-field tiles (img3), avatar/illustration slot; overlays on it need the scrim rule (F1) |
| Stat (`__figure`, meter, `--square`) | metric | `stat` (+ `meter`, `delta`) | bento stat (img9), balance card (img1/2), chart card header, hero numeral |
| Row `.card--row`, `__tile`, `__main`, `__trail` | list row | `row` (+ `tile` for the lead visual) | transaction rows (img1/2), task rows with date chip and actions (img9), day rows (img5), settings rows (img3), nav-drawer rows; swipe actions **must** also exist as buttons (WCAG 2.5.7) |
| `.card__list` | ruled list | `list` | menu, link list, key/value `dl` (img8), month list |
| `.card__tile` | framed square lead visual | `tile` | icon tile, date chip (img9), thumbnail, swatch cell, avatar (via `--radius-avatar`) |
| Link `.card--link` + `.card__link` | **behaviour**: whole surface is one link | shared pattern "stretch", applied to `card`, `row`, `frame`, `tile`, nav item | media card, list row, dock item; one tab stop, name = link text; keep the `:has()` ring delegation |
| Notch | shape gesture + round action in the cut | `card.shapes.css` | img2 notched balance card (flagged there as one-off, hard to make responsive) |
| Stack | shape gesture (deck) | `card.shapes.css` | wallet stack (img2; hides the lower part of each card: only for short ordered sets). **Needs a forced-colours fallback** (DEF-13) |
| Ghost `.card--ghost` | empty slot that asks to be filled | `slot` (pressable, dashed) | empty state, add tile, drop zone, image placeholder. Fix the dashed overload (DEF-20) |
| Study | flashcard | **app layer** | flip recipe at gate 4 |
| Square `.card--square` | aspect modifier | `[data-ratio="square"]` utility (keep `.card--square` alias) | stat tiles, bento squares, swatches, avatars |
| `.card-grid`, `--tiled` | layout | `grid` in `sg.layout` | bento (img9: 4 px gutter), keyline grid (img3: gutter is colour + real borders, or forced colours loses it), masonry columns (img8) |

### D.2. Elements this anticipates (41 rows, about 54 distinct elements; waves 1-5 are the core ~44; from the nine reference screens; wave = build order)

Wave 0 is foundation and is frozen first (C, E1). `uses` are hard dependencies: an element cannot close gate N before what it `uses` has closed gate N-1.

| wave | element | source | uses | notes |
| --- | --- | --- | --- | --- |
| 1 | button (text, icon, circle, square, tool+label) | all | -- | circle/pill; primary/secondary/tone; busy state; replaces `__ctl`, `__action` |
| 1 | link | -- | -- | inline, standalone, external glyph |
| 1 | tag / badge (status, count, NEW) | 4, 6, 9 | -- | **rectangular** (F3); count badge needs text, not a colour dot |
| 1 | chip (filter, toggle; icon + label) | 1, 4, 6, 9 | -- | the pill that *acts*; `aria-pressed` |
| 1 | avatar, avatar stack | 2, 4, 5, 9 | -- | `--radius-avatar`; `+N` overflow; group label |
| 1 | meter, progress (bar, ring) | 9, wire | -- | native `<meter>`/`<progress>` first; `--tone-fill` |
| 1 | tile (icon tile, date chip, thumbnail, swatch) | 1, 8, 9 | -- | from `__tile` |
| 1 | divider, skeleton, spinner | -- | -- | busy = static label first, motion at gate 4 |
| 2 | field (text, textarea, search w/ clear, number) | 5 | -- | `--type-field` >= 16 px; error text `--bad` + icon + words |
| 2 | check / radio / switch | -- | -- | native inputs restyled; 44 px labels |
| 2 | select, combobox | -- | field | native `<select>` first |
| 2 | slider, dial (tick scrubber) | 6, 7 | button | `<input type=range>`; +/- buttons and numeric readout are **required** (2.5.7) |
| 2 | stepper, keypad | 2 | button | standard 3x4 order; keys must not touch (0-3 px gaps in img2) |
| 2 | segmented control | 4, 6, 9 | -- | from `.sg-seg`; radiogroup vs tablist decided by "does it swap a panel" |
| 2 | form layout (label, help, error, group) | -- | field | |
| 3 | tabs | 6 | -- | roving tabindex; Home/End |
| 3 | bar (app bar, tray header) | 5, 6, 7 | button | from `__bar`; cancel left, title centre, apply right |
| 3 | nav bar / dock (active expands to icon + label) | 1, 2, 8, 9 | -- | every item keeps a label; `--dock-h`; `aria-current` + shape |
| 3 | pager / month switcher | 4, 5 | button | live region announces the new month |
| 3 | list (ruled rows, group header) | 1, 3, 9 | -- | from `__list`; `role="list"` kept |
| 3 | menu / link list | 3 | list | ruled rows, `aria-current` + non-colour marker |
| 4 | card (done) | -- | -- | |
| 4 | row (+ group header) | 1, 2, 9 | tile, tag, list | amounts tabular, true minus `U+2212`, sign never colour-only |
| 4 | panel / disclosure | 3 | bar | `<details>` first |
| 4 | frame (media, caption bar, overlays) | 6, 7, 8, 9 | -- | text on photo only on a solid plate or `--scrim` |
| 4 | stat / metric, delta | 1, 2, 9 | meter | |
| 4 | key/value grid (`<dl>`) | 8 | -- | wrapping grid, not a two-axis scroller (1.4.10) |
| 4 | empty state / slot | 3 | button | from ghost |
| 4 | banner / notice / status strip | 9 | tag | `role="status"` when it appears |
| 5 | dialog | -- | bar, button | native `<dialog>`; Esc returns focus; scrim |
| 5 | sheet (bottom sheet; grabber + close button + drag alternative) | 1, 4 | bar | grabber is decoration; a Close button is required |
| 5 | popover, tooltip | -- | -- | Popover API where supported |
| 5 | toast / snackbar | 6 | button | live region; does not steal focus; pause on hover/focus |
| 6 | bar chart (+ data-table fallback), sparkline | 1, 2 | stat | marks use `--tone-fill`, patterns + direct labels, never hue alone |
| 6 | calendar (month grid, year grid) | 5 | pager | 7 columns x 44 px = 308 px: fits at 320 with 6 px to spare (computed) |
| 6 | day timeline / schedule | 4, 5 | row | scroll region needs `tabindex="0"` + name (axe failed this on the docs page, DEF-25) |
| 7 | media transport (play, scrubber, time) | 7 | slider, button | keyboard steps 1 s / 5 s / 10 s |
| 7 | tool tray (stage + tray, tool row, options row) | 6 | bar, chip, slider | |
| 7 | thumbnail / filter carousel (radio strip) | 6, 7 | tile | prev/next buttons for non-touch |
| 7 | clip strip / trim handles | 7 | slider | only if the owner's apps need it; reorder by buttons |
| 7 | marquee / ticker | 3 | button | static by default, pause control, `aria-hidden` duplicate (2.2.2) |
| 7 | masonry / tiled grid | 8 | -- | layout |

### D.3. Proposed file and class organisation

```
src/components/
  card.css            frame, head/body/foot, eyebrow/title/text/meta/row/group, tone + states, selected, disabled, stretched link       (<= 300 lines)
  card.shapes.css     .card--notch, .card--stack   (one shape gesture per card; RTL and forced-colours live with the shape)
  bar.css             .bar, .bar__label             (was .card__bar / .card__label)
  button.css          .btn (+ data-shape square|circle, data-size, data-variant)            (was .card__ctl / .card__action)
  row.css             .row, .row__lead, .row__main, .row__trail                                (was .card--row)
  list.css            .list (ruled rows)                                                        (was .card__list)
  tile.css            .tile                                                                     (was .card__tile)
  frame.css           .frame                                                                    (was .card__media)
  stat.css            .stat, .stat__figure                                                      (was .card__figure recipe)
  slot.css            .slot                                                                     (was .card--ghost)
  panel.css           .panel                                                                    (card + bar + disclosure)
src/layout/
  grid.css            .grid, .grid--tiled, .grid--keyline                                     (was .card-grid)
  stack.css scroller.css shell.css
src/tokens/           (C10)
apps/flashcards/
  flashcard.css       .card--study, .card__answer  (+ the flip at gate 4)
  MIGRATION.md
```

Rules that keep any one file small and the elements independent:

1. **Split test** (above). A new `--modifier` on `.card` must be a pure restyle of card parts (no new slot, no new role).
2. **A component styles only its own BEM parts.** card.css:222 (`.card__foot :is(a, button)`) and :259 (`.card__list a`) style arbitrary descendants; a `Button` placed in a card foot that declares its height with `min-block-size` would be forced to `1.5rem` (specificity (0,1,1) beats `.btn` at (0,1,0)). Elements talk to each other only through the **surface contract** (C2) and through slots, never through descendant selectors.
3. **Slots are classes, not positions.** `.card__action` is "the round slot" today; after the split the slot is filled by `<button class="btn" data-shape="circle">` and `.card__action` stays only as a positioning wrapper.
4. **Shared behaviour is a pattern page, not a mixin**: stretched link, hit-area `::after`, focus ring with halo, pressed (`--lift`/`--fill`), forced-colours border. Each is 3-6 lines, repeated per element, and a lint compares their text.
5. **No file over ~300 lines; no element over ~4 variants in one file.** Lint warns.
6. **Variant axes**: structure = modifier class; presentation = `data-*` (C11).
7. **Aliases** for one minor version: `.card__media` = `.frame`, `.card--row` = `.row`, `.card--ghost` = `.slot`, `.card__bar` = `.bar`, `.card-grid` = `.grid`.

### D.4. What the card contract must guarantee to the rest

- `[hidden]` hides (reset layer, DEF-4 above).
- The card paints `--surface-*` (C2) so a Tag/Meter/Button inside adapts, including `ink`.
- Every part with `cqi` lives on a part of the card (keep the house rule), and the card's own inline size comes from its slot.
- Focus ring: the card never clips a child's ring (2.4.11): the ring of a child at negative offset is inside, at positive offset inside `--ring-offset-in` and the card `overflow: clip` (card.css:58) is the only clipper; the exception list is in the test. Measured: a keyboard walk of the sheet (36 focusables, exp/e7.mjs) found **no ring clipped by an ancestor** (the flags it raised were the scrolled docs nav and the visually-hidden radios, both false positives) and **one ring invisible on its own surface** (DEF-6). The risk is structural, not present: any new wrapper with `overflow: hidden|auto` between a focusable and its ring (scroller, sheet body) will clip it, so the gate-2 check measures the ring box against every clipping ancestor.
- Hit areas of children do not overlap each other (F11).

### D.5. The container decision (measured)

`container: card / inline-size` (card.css:53) is size containment on the inline axis. A contained box has no intrinsic inline size. Measured card width:

| context | width |
| --- | --- |
| block in a 300 px box | 300 |
| grid track (measured with `grid-auto-columns: auto` in a 900 px page) | fills (900) |
| flex row item, `inline-flex`, flex item with `flex: none` (carousel), `dialog { inline-size: fit-content }`, absolutely positioned popover, `inline-block`, table cell | **4 px** (two borders) |

STYLE.md:238-241 documents this, but a guide with dialogs, popovers, toasts, carousels and chip rows will meet it constantly. Recommendation (in order of preference):

1. Keep containers on elements that are **always block-level in a definite slot**: card, row, stat, panel, frame. Elements that can shrink-wrap (button, chip, tag, toast, popover, tooltip) never become containers.
2. Overlay surfaces give their contents a width: `dialog, [popover], .toast { inline-size: min(100% - 2 * var(--gutter), var(--page-sm)) }`.
3. Layout slots size their children: `.scroller > * { inline-size: var(--item-w, 16rem); flex: none }`, `.cluster > .card { flex: 1 1 var(--card-min) }`.
4. Container queries measure the **content box**, so the row's `18rem` threshold fires below roughly 316 px of outer width when the row has 12 px padding and a 2 px border (seen in the 390 px screenshot). Express such thresholds from a wrapper without padding, or document the arithmetic.

---

## E. PIPELINE PORT: gates 0-5 and the status table at 40 elements with agents

### E1. What has to be true before parallel work starts

The owner's pipeline is one person, one element, serial. In parallel, the things agents *share* are where it breaks. Freeze these first (**wave 0**, one builder, reviewed by the owner):

| shared thing | today | problem at 40 elements | fix |
| --- | --- | --- | --- |
| import list | hand-edited `@import` lines in `flashcards.css:19-25` | every element PR edits the same 7 lines | build globs `src/components/*.css`; no list |
| gate `GATES.motion` | one boolean, check.mjs:31 | cannot say "button at gate 4, tabs at gate 1" | per-element status file (E3) read by the checker |
| role and slot lists in the gate | regex `card\|tile\|ctl\|pill` (check.mjs:167), `for n = 1..6` (check.mjs:308) | each new role or tone edits the gate | derive from `tokens/` |
| docs page | one `index.html` (1,344 lines for one element), gate 8 scans only it (check.mjs:55) | merge conflicts; unscanned pages | one page per element, every page scanned |
| spec | one `STYLE.md` | same | one `docs-src/<el>.html` fragment; `STYLE.md` sections generated |
| status | README.md:55-63 **and** index.html:1146-1211, ticked by hand, nothing checks them | two truths | generated from `status/*.json` |
| contrast | hand-listed pairs (check.mjs:298-313) | skipped pairs pass (DEF-2); new pairs forgotten | rendered-contrast walker (E2, gate 3) |
| `tests/` | none in the zip (the gate is static text) | no keyboard, no target size, no reflow, no axe | component specs + harness (v2 has the start) |

### E2. The gates, unchanged in intent, with artefacts and proof

Keep the six gates, their order, and the rule that each names what it may **not** touch. Two structural amendments:

- **Gate 2 becomes "States and behaviour".** Keyboard, ARIA and JS cannot wait for colour: focus ring, hit area and name/role/state are structure. The zip already puts keyboard in gate 2 ("Keyboard-only pass"); it just has no machine behind it.
- **Gate 3 becomes "Appearance"** (theme x contrast x palette x corners), and its exit check "the diff touches `tokens/` only" is replaced by something enforceable: *the diff touches `src/tokens/**` and `@media (forced-colors)` blocks; any other component line changed needs an entry in `status/<el>.json` under `colourLeaks` saying which colour logic leaked and where it moved* (the 72 % `color-mix` in card.css:34 is the model case, DEF-7).

Each gate produces files, and an agent closes it by running one command that writes the evidence.

| gate | decides / may not touch | produces | machine proof (`npm run gate -- <el> <n>`) | human / reviewer proof | who closes |
| --- | --- | --- | --- | --- | --- |
| **0 Brief** | job, slots, variants, states that apply (with reasons for n/a), real copy, `uses`, reference screens. No CSS | `docs-src/<el>.brief.md` with front-matter: `job` (one sentence), `slots`, `variants`, `states`, `uses`, `sources`, `apg` (pattern link), `js` (yes/no) | schema valid; slots/variants named in `STYLE` fragment; `uses` exist; class names do not collide with existing elements (scan); copy strings found in the copy bank | -- | builder |
| **1 Wireframe** | structure, type, space, line, shape. Greys only, no motion | `src/components/<el>.css`, docs fragment with every variant, `.wf-*` placeholders if needed | lint clean (incl. the new rules, F); build; **reflow**: no horizontal scroll at 320 px and no clipped descendants at 200 % text (the exp/e3 method); **container contexts**: width > 0 in flex/dialog/scroller or documented "needs a slot"; target size report; axe 0 serious in `wire` palette; screenshots at 320, 390, 1024, 1440 -> `status/<el>/g1/*.png` + sha256 in JSON | squint: a *different* reviewer agent opens the screenshots and writes one line per item (structure survives, one idea, copy real) | builder + reviewer |
| **2 States and behaviour** | rest, hover, focus, pressed, selected, disabled (+ busy, error where they apply); still grey | states matrix in the docs fragment, `tests/components/<el>.mjs`, `src/js/NN-<el>.js` only if HTML+CSS cannot | APG keys; ARIA state flips (and `aria-*` valid for the role, C11); focus return; **focus ring measured on every surface the element can sit on** (paper, canvas, each tone, ink, bar) >= 3:1 against both sides; hit area >= 44 and non-overlapping neighbours; hover gated (touch emulation); **state-diff**: render each state in the `wire` palette and in `forced-colors`; every pair of states must differ by more than a threshold (this is how "every state legible in grey" becomes a number); axe | keyboard-only pass attested with the recorded key sequence; screen-reader notes marked *unverified* unless a real SR was used | builder + reviewer |
| **3 Appearance** | tones, accent, dark, contrast, palettes, corners. No new structure | none in `components/` (see above) | **contrast walker**: for every text node and control boundary in the element's specimens, in every appearance (2 themes x 2 contrast x every palette x tones x emphasis x corners), resolve real rendered colours and assert 7:1 text / 4.5:1 floor / 3:1 non-text. No pair can be skipped: an unresolved colour is a failure. Colour-leak check (above). Forced-colours screenshots | reviewer looks at the matrix sheet (one image per palette) | builder + reviewer |
| **4 Motion** | transitions, press, reduced motion. Only `transform` and `opacity` move | transitions using tokens from 60-motion | `prefers-reduced-motion` emulation: travel x `--move`, no duration is 0, property whitelist (`transform`, `opacity`), nothing > 5 s without a pause control, flash rate; `transitionrun` log per state | -- | builder |
| **5 Freeze** | nothing new | baseline screenshots in `tests/baselines/`, generated API/token/class tables, version bump, changelog line | docs/markup drift zero (every class and token named in the page exists and vice versa); `status` row complete; any later edit to the element's files fails the checker unless the gate is reopened in `status` | owner sign-off | **owner / orchestrator only** |

### E3. The status table and where evidence lives

```
status/<element>.json
{ "element": "button", "version": "0.1.0", "uses": ["icon"],
  "gate": 2,                                   // highest closed
  "gates": { "0": {"closed":"2026-10-02","commit":"abc123","by":"agent-7"},
             "1": {"closed":"...","checks":[{"id":"reflow-320","pass":true},{"id":"axe","pass":true,"violations":0}],
                   "artefacts":["status/button/g1/320.png","..."],"sha256":{"...":"..."},
                   "review":{"by":"agent-9","notes":"status/button/g1.review.md"}},
             "2": {...} },
  "manual": [{"item":"keyboard-only pass","gate":2,"by":"agent-9","attested":true}],
  "colourLeaks": [], "reopened": [] }
```

- `npm run status` renders the README table and the docs index from these files (so there is no hand tick and no second copy). Cells distinguish **machine-closed** from **human-attested** from **n/a with reason**.
- `check` reads the file to decide per element whether `transition`/`animation` is allowed (gate >= 4 open), whether colour logic may change, whether the element is frozen. This replaces `GATES.motion`.
- Screenshots live in the PR or a build artefact; the JSON commits only paths and hashes. Freeze commits the baselines.

### E4. Running ~40 in parallel with agents

1. **Waves** (D.2): an element starts gate 1 when everything it `uses` has closed gate 1, and closes gate N only when its `uses` have closed gate N. Independent elements in a wave run concurrently, one git worktree each.
2. **Ownership**: a PR touches only `src/components/<el>*.css`, `docs-src/<el>.html`, `tests/components/<el>.mjs`, `status/<el>*`, optionally `src/js/NN-<el>.js` and `src/icons/*.svg` (new icons only, with a unique id). Anything else is a **foundation request**: the agent writes `requests/<el>-<what>.md` ("I need a token `--x` because ...") and stops, exactly as STYLE.md:11-15 says ("say so instead of improvising it"). The orchestrator batches requests into foundation PRs.
3. **The builder never reviews itself.** Gate 1, 2, 3 need a second agent that opens the screenshots and runs the keyboard sequence. Green tests do not prove it looks right (the repo's CLAUDE.md already says so); the reviewer's output is a file, not a chat line.
4. **Shared failure modes get fixed once**: a defect class found in one element (for example a ring that vanishes on ink) becomes a lint or a harness check in the next foundation PR, and every element re-runs it.
5. **Brief quality is the leverage.** An agent with a good brief and the copy bank produces the same element as the owner would; one without produces 'any product' copy. Gate 0 must fail on lorem, names from the flashcards page, and untagged colours.
6. **What stays human**: squint, cover-the-logo, read-aloud (STYLE.md:47-57), real-device safe areas, screen-reader runs, and gate 5. They are listed, never silently skipped.

---

## F. RISKS: where the owner's rules, applied strictly, make new elements worse

Format: the rule (with where it is written), where it backfires (element + evidence), the **smallest principled exception** as wording the owner could paste into STYLE.md, and how a machine keeps it honest. None of these loosens an accessibility floor; each trades a *look* rule for a *usability* or *a11y* outcome.

### F1. "Flat. No gradients, no blur, no translucency" (STYLE.md:35-36; check.mjs:134-141) vs modal scrims and text over photos

- **Backfires**: dialog and sheet need the page to stay visible but recede (opaque backdrop removes orientation); every reference with media has text or controls on photos (img6 white floating button edge 1.5:1 on a pale photo, img7 header 1.64:1, img9 "2.8k" chip); a pure flat system has no answer except a solid plate.
- **Numbers** (computed, worst case = pure white photo under a black scrim): alpha 0.50 -> white text 3.98:1; **0.55 -> 4.76:1 (AA)**; 0.60 -> 5.74; **0.65 -> 6.98:1 (7:1 default)**; 0.70 -> 8.52. A scrim of `ink` (#141414) instead of black needs about 0.05 more.
- **Exception wording**: *"One flat translucent value exists: `--scrim`, a uniform-alpha plate of at least 0.65, behind a modal or under text that sits on a photo. It never blurs, never has a gradient edge, and is used only by `dialog`, `sheet` and `frame`. Prefer a solid caption bar (ink fill, paper text) under media; use the scrim only when a bar cannot be used. Controls that float on media are solid discs with a `--bw` ring, never frosted."*
- **Enforce**: `rgba()`/alpha only in `tokens/` and only as `--scrim`; `backdrop-filter`/`blur()` stay banned; contrast walker tests text over a white and a black image fixture. Declare `--scrim` on `:root, ::backdrop`.
- Loading skeletons: no shimmer gradient. Flat blocks that pulse `opacity` (gate 4) or static `--pattern-hatch` blocks.

### F2. "A hard shadow means you can press this. Nothing else gets one" (STYLE.md:35-36, 56) vs raised sheets, toasts, menus, popovers, drag previews

- **Already broken by the owner**: `.card--stack` draws two offset sheets with `box-shadow` at rest (card.css:419-428) on a card that is not pressable unless it is also a link; the count "Shadows on things you can't press: zero" (STYLE.md:56) and the don't "add a shadow at rest" (STYLE.md:361) both fail on the Stack specimen. The selected ring is also a `box-shadow` (card.css:551-554).
- **Backfires**: a toast or menu with no elevation cue and a similar tone to the page is hard to separate; a shadow on it would read as "press the toast".
- **Exception wording**: *"A hard shadow means 'you can press this or pick this up'. Things that float (sheet, menu, popover, toast, dialog) get a full `--bw` frame and, if modal, the scrim; never a shadow. A drawn offset (stack sheets, the selected ring) is line work: it is named `--draw-*`, is outline-only, and is not a shadow."* Dragging a row lifts it with the press shadow (it is being picked up).
- **Enforce**: `--shadow-*` names only for true shadows; `--draw-*`/`--_select-ring` are allowed to be spreads; overlay files may not declare `box-shadow` except `var(--focus-shadow)`.

### F3. "Rectangles hold, circles act" / "circles and pills for everything you can act on" (STYLE.md:37-38) vs Tag, Avatar, Badge, Meter ring

- **Already broken**: the next element on the owner's list, Tag, exists today as `.wf-pill` (wire.css:92-100) and `.sg-tag` (sheet.css, "Done / Open" in the pipeline table): static, non-interactive pills. The bar control is a *square* that acts (card.css:125-131, `--radius-ctl`). The whole link card is a rectangle that acts.
- **Backfires**: a static pill tells the user it is pressable; avatars are the world's most recognisable circle and every reference (img2/4/5/9) has them; a count badge and a meter ring are round for other reasons.
- **Exception wording**: *"Round means 'you can act on it'. A Tag (static status) is a rectangle (`--radius-ctl`); a Chip (filter, toggle) is a pill. An Avatar holds a picture, so it follows `--radius-avatar` (default `--radius-tile`; an app may set `--radius-pill`). A count badge is a rectangle with a minimum width. A meter ring is a measurement, not a control, and never takes hover, shadow or focus."*
- **Enforce**: `.tag`/`.badge` may not read `--radius-pill` (lint); `--radius-avatar` is a declared role.

### F4. "No icons in tinted circles" (STYLE.md:44-45; index.html "Not this" tell 3) vs list-row lead icons and status icons

- **Backfires**: img1/2 list rows use a leading category icon as the main scanning anchor; an unframed icon is weaker, and status icons (ok/warn/bad) need a container to reach 3:1 against pastel tones. The owner's own Row already has `.card__tile` (card.css:301-309): a **tinted framed square holding a glyph**, so the rule as written contradicts the element it ships.
- **Exception wording**: *"A leading icon sits in a `tile`: a square (`--radius-tile`), framed with `--bw`, filled with a tone. Never in a borderless tinted circle: the circle means 'press me' and the missing frame is the AI tell. The glyph carries the meaning; the tint never does."*
- **Enforce**: `.tile` requires a border; the "Not this" specimen per element.

### F5. "Uppercase is structure" (STYLE.md:39-40; base.css:98,110) vs long labels, dock labels, other scripts, dyslexia

- **Backfires**: a 13 px condensed 700 uppercase label (`--type-label`) is fine for 1-3 words; a dock with five items at 320 px ("Notifications" = 13 caps) truncates; uppercase transform is locale-dependent (`tr`, `lt`, German `ss`), cased only in Latin/Greek/Cyrillic; positive letter-spacing (`+0.08em`) is wrong for cursive scripts (Arabic joining) and looks wrong in Indic scripts; Archivo falls back per glyph outside Western Latin and the fallbacks have no width axis (DEF-17); reading long caps is slower for some users. Screen readers read the DOM text, so a CSS transform is safe for them (how copy/paste and find-in-page treat transformed text differs by browser: not verified here).
- **Exception wording**: *"Uppercase is set in CSS on a role (`--label-case`), never typed. It is for labels of up to three words: bar titles, index numbers, the display line. Never for user content, sentences or error text. Scripts without case ignore it, and `letter-spacing` resets to 0 for `:lang(ar, he, hi, th, bn)`. A `data-labels="plain"` switch sets `--label-case: none` for people who want sentence-case labels."*
- **Enforce**: `text-transform` only via `var(--label-case)`; `.t-label` length guidance in docs; i18n fixture (Turkish `i`, Polish `ł`, Arabic) in the harness.

### F6. "Motion waits for gate 4" (README.md:50; check.mjs:190) vs functional motion and WCAG 2.2.2

- **Backfires**: busy/indeterminate progress needs *something* perceivable; a marquee (img3) or carousel defaults must be **static** and pausable from the first release; `scroll-behavior` and focus-related scroll are behaviour; reduced-motion design (`--move`) is a structural decision, not decoration; a single global flag cannot say which elements are at gate 4.
- **Exception wording**: *"Decorative motion and transitions wait for gate 4. Motion that **is** the function (busy, indeterminate progress, marquee, auto-advance) is specified at gate 1 **static-first**: a text state, `aria-busy`/`role="status"`, and a pause control if anything moves for more than 5 s. Animation is added at gate 4 on top of that, multiplied by `--move`."*
- **Enforce**: per-element gate in `status/` (E3); checker flags `animation` with `infinite` unless a pause control is declared in the brief.

### F7. "Everything else reads exactly three radius roles" (STYLE.md:122-131) vs nested radii and floating surfaces

- **Backfires**: sheet top corners, dock, toast, popover and dialog are the *only* rounded things in the editorial reference (img8: rounded = floating); img1/2/9 all measure concentric radii (outer = inner + padding); in `soft` mode a tile inside a card body with 16 px padding is 12 px inside a 24 px card (concentric would be 8); three roles cannot express "float".
- **Exception wording**: *"Four roles: `--radius-card`, `--radius-tile`, `--radius-ctl`, and `--radius-float` (surfaces that sit above the page). A child inside a rounded parent uses `max(0px, parent radius - gap)` when it touches the parent's corner. Square mode sets all four to 0."*
- **Enforce**: the allowed list is parsed from `tokens/` (C5), not hard-coded at check.mjs:167; `--card-radius: <literal>` is flagged (DEF-3).

### F8. "Two line weights" (STYLE.md:26, 33-34) vs focus ring, charts, tick marks, icons

- Real values are 1 px, 2 px, 3 px (`--ring`) and 4 px (`--bw-heavy`); icon strokes are 0.9-3.3 px depending on size (DEF-15). Charts need hairline axes and 2 px series; ticks on a dial are 1 px.
- **Wording**: *"Two line weights build structure: `--bw` frames, `--bw-thin` divides. Two more exist for a reason: `--ring` (focus) and `--bw-heavy` (forced-colours emphasis). Icon strokes equal `--bw` at every size (non-scaling stroke). Data marks use `--bw`; gridlines and ticks use `--bw-thin`."*

### F9. "Colour is a swap: only `tokens/color*.css` contains a hex" (STYLE.md:43) vs data that *is* colour

- **Backfires**: a swatch strip shows colours extracted from a photo (img8), charts need per-series colours, avatars and album art are images. None can be a token.
- **Wording**: *"A colour that is *data* (a swatch's value, a chart series) is set inline as a custom property (`style="--swatch: #7aa"`) and read by the component as `var(--swatch)`. No stylesheet contains a literal. The swatch always shows its name or hex as text."*
- **Enforce**: HTML inline `--swatch`/`--series-N` whitelisted; stylesheets still scanned.

### F10. "Say something real. Copy comes from the app" (STYLE.md:41-42) vs a brand-agnostic guide

- **Backfires**: forty elements built by agents with "flashcards" copy, or with none. See the copy bank (B). **Wording**: rule 5 reworded as in section B.

### F11. "The drawn thing may be smaller; the target is not" (STYLE.md:142-143) vs dense UIs

- **Backfires**: two 36 px buttons 8 px apart with 44 px hit areas overlap by 4 px each; the foot links are 30x24 today (DEF-18), below the 44 px default and only just above WCAG 2.5.8's 24 px; a calendar cell, tick handle (7 px in img7) or chip row is where "smaller than the target" goes wrong.
- **Wording**: *"Hit areas never overlap. Where the drawn size is smaller than 44 px, the gap is at least `44 - drawn`, or the hit area is the cell (a calendar cell is 44 x 44: seven columns are 308 px, which fits 320). Inline links inside running text are the only 24 px targets."*
- **Enforce**: gate 2 measures pairwise hit-area overlap in every specimen.

### F12. One-colour focus ring (`--focus: var(--ink)`, base.css:71-74) vs ink surfaces, media and dark themes

- **Backfires**: the owner already patched it five times (card.css:76-83; sheet.css:77, 137, 242), and the patch for the ink card **broke** the bar control: white ring on a white bar (DEF-6). Every ink-filled element to come (dock, toast, tray, bar, dark sheet) needs its own patch; on photos no single colour works.
- **Wording**: *"The focus ring is the one thing allowed two colours: `--focus` (ink) with a `--focus-2` (paper) halo, so it is visible on any surface, including ink and photos. A component that draws its own `box-shadow` keeps it: `box-shadow: var(--focus-shadow), <own>`."*
- **Enforce**: gate 2 measures the ring against every surface the element can sit on (E2).

### F13. "Don't nest cards" (STYLE.md:360) and "don't pad `.card`" vs sheets, dialogs, bento

- A card inside a sheet or dialog is normal; a tile or row inside a card is normal. **Wording**: *"Surfaces nest; cards do not. A card may sit on the canvas, in a sheet, in a dialog or in a grid cell. A card may not contain a card: use a tile, a row or a panel."*

### F14. Disabled = dashed + hatch + `pointer-events: none` (STYLE.md:315; card.css:557-567; wire.css:104-110) vs legibility and discoverability

- **Measured**: disabled text `--ink-faint` (#8a8a8a) is 3.45:1 on paper, 2.90:1 on tone-1, **2.04:1 on a hatch stripe** (tone-4). WCAG exempts inactive components, but the disabled *card* carries content the user needs (why, which, when). `pointer-events: none` removes the reason tooltip; an `a[aria-disabled]` stays focusable (measured: focusable, `pointer-events: none`), and a focused anchor with an `href` is activated by Enter, which `aria-disabled` does not prevent.
- **Wording**: *"Disabled dims the frame, never the words: text stays at `--ink-soft` (>= 7:1); the state is carried by a dashed frame, the pattern and the words 'Unavailable' or the reason. Use `aria-disabled` (focusable, with a click guard) when the reason matters, `disabled`/`inert` when it does not."*

### F15. Gradients only in `wire.css` (README.md:135; check.mjs:138) vs real patterns

- The hatch that signals disabled lives in the disposable wire layer (DEF-11), yet disabled needs a non-colour cue forever; charts need patterns (WCAG 1.4.1); skeletons need a flat texture. **Wording**: *"A hard-stop pattern (hatch, dots, check) is not a gradient. It is allowed from `tokens/patterns` only, as `--pattern-*`, and only for disabled, chart series and skeletons."* The gate already exempts two identical stops (check.mjs:137); extend to "every stop pair has equal positions".

### F16. Dashed means two opposite things

- Ghost (press to fill, STYLE.md:281) and disabled (cannot press, STYLE.md:315) are both dashed; the wire legend says "dashed: empty, or unavailable" (STYLE.md:396). **Wording**: *"Dashed means an empty place that asks to be filled (slot, ghost, drop zone). Disabled is a solid `--ink-faint` frame, the `--pattern-hatch` fill and the words 'Unavailable' or the reason."* Change card.css:557-563 (`border-style: dashed`) and the legend at wire.css:11 / STYLE.md:396 accordingly; the ghost keeps the dashed frame because that is the widely understood drop-zone cue.

### F17. "State comes from ARIA and native attributes" vs roles that do not support them

- Table in C11. **Wording**: *"State attributes are chosen by role. A card that is a choice gets `role="option"` (in a `listbox`) or is a link with `aria-current`; `aria-selected` and `aria-pressed` are never put on a bare `article`."*
- **Enforce**: axe `aria-allowed-attr` is part of the gate-2 run (it found both cases in exp/e12.mjs).

---

## G. DECISIONS ONLY THE OWNER CAN MAKE (each blocks something)

| # | decision | blocks | recommendation |
| --- | --- | --- | --- |
| 1 | Corners: square or soft (STYLE.md:133-138) | nothing, if kept as `data-corners` | **keep both** as a switch; it is 4 role lines and the whole guide is tested in both. Commit per app, not in the guide |
| 2 | Class prefix / namespace (README.md:111) | first adoption into an app with its own `.card` | short names in source; prefixed build output as a bundle flag; legacy CSS into `@layer legacy` (B) |
| 3 | Avatar shape (F3) | Avatar | `--radius-avatar` defaulting to `--radius-tile` |
| 4 | Tag is rectangular, Chip is a pill (F3) | Tag, Chip, Badge | yes: it keeps "round = acts" true |
| 5 | Does the guide ever get a non-hard look (soft shadows, rounded floating) | `data-look` | not now; it breaks rules 2 and 3, and the guide's identity is the point |
| 6 | Scripts beyond Western Latin (DEF-17) | Field, any user-generated text | ship `latin-ext` subset now, others on demand, and a metric-adjusted fallback face |
| 7 | Gate renumbering: behaviour in gate 2, appearance in gate 3 (E2) | status table shape | yes; names of gates 0, 1, 4, 5 unchanged |
| 8 | Which reference-screen elements are in scope (calendar, timeline editor, media trimmer) | waves 6-7 | waves 1-5 cover every screen's chrome; 6-7 only if an app needs them |

---

## H. WHAT THE CURRENT REPO (v2, commit 0340a41) ALREADY DOES WITH THIS

Snapshot probes against `/home/user/styleguide/dist/styleguide.css` (copied, then tested: `exp/e11.mjs`) and greps of `v2:src`. The repo is moving while this is written (tasks 12, 13); treat as a snapshot.

| zip defect | v2 today |
| --- | --- |
| DEF-4 `[hidden]` | fixed: `v2:src/base/00-reset.css:89-90` (`:where([hidden]...)`); measured `display: none` on `.card[hidden]` and `.card__body[hidden]` |
| DEF-5 container collapse | **persists** (4 px in flex and in a `fit-content` dialog). Decide per D.5 |
| DEF-6 ink bar ring | fixed: ring is ink on the paper bar |
| DEF-9 display at 320 | not reproduced (68 px, no overflow for "Cards", "Navigation") |
| DEF-10 study at 200 % | not reproduced |
| DEF-11 wire hatch beats notch | **persists in source**: `v2:src/wire/wire.css:105`; layer order `v2:scripts/build.mjs:35` still puts `sg.wire` above `sg.components`. Only bites when `dist/wire.css` is loaded (dev) |
| DEF-12 hover gating | card action/foot/list hover now inside `@media (hover: hover)` (`v2:src/components/card.css:173, 282, 367, 408`); ghost not re-checked |
| DEF-14 RTL notch/stack | `:dir(rtl)` blocks exist (`card.css:599, 607`); not visually verified by this audit |
| DEF-16 `.ic` on `<svg>` | **persists** (bg `oklch(0.2 0 95)`, mask `none`) |
| DEF-18 foot link | fixed (30 x 44) |
| C7 `utilities` layer | declared in `LAYER_ORDER`, `src/utilities/` empty |
| C12 `--container-*` | v2 uses `--container-sm: 30rem`; Tailwind v4 uses 24 rem for the same name |
| DEF-1 `color-scheme` in `base` | fixed: `color-scheme` now lives only in `v2:src/tokens/10-color.css:37,169,173` |
| C1 `--scrim` | present at alpha 0.6 (`10-color.css:161`) = 5.74:1 for white text over a white photo (AA, not the 7:1 default; 0.65 gives 6.98:1, F1) |

Not checked in v2 (inherited from the owner's sheet, so assume open until looked at): DEF-2/3 (task 13 is on it), DEF-7, DEF-8, DEF-13, DEF-15, DEF-17, DEF-19 to DEF-22.

---

## I. APPENDIX

### I1. Fuzz cases for the gate (for task "auditor fuzz cases as regression tests")

Runner: `audit-work/mut/run-mut.sh <name> '<css>' [file]`. Appended to `css/components/card.css` unless a file is given. "zip" = what `tools/check.mjs` did. Rule 7 (docs drift) fails in every run because of the unzip artefact; it is ignored.

| case | css appended | should | zip |
| --- | --- | --- | --- |
| named colours | `.card { color: red; background: white; border-color: black; }` | fail (colour literal) | **pass** |
| filter shadow | `.card { filter: drop-shadow(4px 4px 12px var(--ink)); }` | fail (blur) | **pass** |
| 3-token blurred shadow | `.card { box-shadow: 4px 4px 12px; }` | fail | **pass** (needs >= 4 tokens, check.mjs:146) |
| literal shadow ring | `.card:hover { box-shadow: 0 0 0 3px var(--ink), 6px 6px 0 0 var(--ink); }` | fail (third line weight) | **pass** |
| radius via private prop | `.card { --card-radius: 14px; }` | fail (radius not a role) | **pass** |
| font shorthand | `.card__title { font: 700 1.5rem/1.2 Inter, sans-serif; }` | fail (default face, not a token) | **pass** |
| rem border | `.card { border: 0.1875rem solid var(--ink); }` | fail | **pass** (only `px` is scanned) |
| opacity on text | `.card__meta { opacity: .5; }` | fail (STYLE.md:362 "don't fake disabled with opacity") | **pass** |
| motion elsewhere | `.card { scroll-behavior: smooth; view-transition-name: x; }` | fail while gate 4 closed | **pass** |
| transition in base | `* { transition: all .3s; }` in `css/base.css` | fail | **pass** (only components and wire scanned, check.mjs:192) |
| `!important` | `.card { background: var(--paper) !important; }` | fail (CLAUDE rule, not the owner's) | **pass** |
| px font size | `.card__meta { font-size: 11px; }` | fail (STYLE.md:63 "sizes are rem") | **pass** |
| colour inside url | `.card { background: url("data:image/svg+xml,%3Csvg fill=%27%23ff0000%27/%3E"); }` | fail | **pass** (`stripUrls`, check.mjs:44) |
| selector fragment as token | `.card__x { color: var(--link); margin: var(--ghost); }` | fail (undefined) | **pass** (`--link:` matched in `.card--link:is(`, check.mjs:69) |
| phantom class | `@layer sheet { .card__phantom { color: red } }` in `sheet.css` + `class="card__phantom"` in `index.html` | fail (not shipped) | **pass** (check.mjs:220) |
| typo with fallback | `.card { color: var(--ink-sofft, inherit); }` | (by design a "hook") | pass; typos hide here |
| contrast vacuity | colour file with `light-dark(#ffffff, #ffffff)` on `light-dark(#ffff00, #333300)` for all tones | fail | **pass**: `ok contrast (skipped 15 pair(s))` |
| hard shadow, colour first | `.card:hover { box-shadow: var(--ink) 4px 4px 0; }` | pass | **false positive** ("blur 4px", check.mjs:146) |
| logical radius | `.card { border-start-start-radius: 14px; }` | fail | caught, wrong message ("use --bw") |
| caught correctly | hex inside `light-dark()`; `hsl(` in icons.css; 4-token blur; `.wf-` leak via `:not()`; gradient in a token; `var(--nonexistent)` | fail | fail |

### I2. Evidence index (all under `.../scratchpad/audit-work/`)

| claim | file |
| --- | --- |
| axe at 1280 and 320 | `exp/e1.mjs` |
| `[hidden]`, card width in 9 contexts, `.wf-shape path` fill, target sizes | `exp/e2.mjs` |
| disabled notch, display type at 320, 100 % vs 200 % text on five cards | `exp/e3.mjs`, `shots/notch-disabled.png`, `shots/display-320.png`, `shots/zoom200.png` |
| RTL notch, icon stroke thickness | `exp/e4.mjs`, `shots/rtl.png`, `shots/icons-stroke.png` |
| non-scaling stroke in a mask | `exp/e5.mjs`, `shots/icons-nss.png` |
| `color-scheme` cascade, touch hover, `.ic` on `<svg>` | `exp/e6.mjs` |
| keyboard walk of the sheet | `exp/e7.mjs` |
| inverted panel ring, `::selection` | `exp/e8.mjs`, `shots/ink-panel-focus.png` |
| forced colours | `exp/e9.mjs`, `shots/forced-states.png`, `forced-stack.png`, `forced-notch.png` |
| ARIA attributes on `article`, disabled anchor focus | `exp/e12.mjs` |
| `--fill` inheritance | `exp/e13.mjs` |
| token and class inventory | `exp/inv.mjs` |
| gate mutations | `mut/run-mut.sh`, `mut/m_*` |
| v2 snapshot probes | `exp/e11.mjs` |
| font coverage | fontTools on `fonts/archivo-latin-var.woff2` (command in this session; cmap 230 entries, 302 glyphs, axes wght 100-900, wdth 62-125, GSUB: `tnum`, `pnum`, `frac`, no `lnum`, no `zero`) |
| bundle drift | `bundlecheck/` (fresh `bundle.mjs` output is byte-identical to shipped `dist/`) |

### I3. Not verified (be honest in reports)

- **Safari / WebKit / iOS / Firefox**: nothing here was run outside Chromium. Candidates that need a real device: `overflow-clip-margin` (owner already notes the 2 px dead band), `text-wrap: pretty`, `vector-effect: non-scaling-stroke` inside a `mask` image (measured in Chromium only), `light-dark()` (Safari 17.5+), `::backdrop` inheriting custom properties on older engines, standalone-PWA safe areas, Dynamic Type, `aspect-ratio` on size-contained boxes.
- **Screen readers** (VoiceOver, TalkBack, NVDA): none. State-attribute validity was checked by axe only.
- **Forced colours and touch hover** are Chromium emulation (`forcedColors: 'active'`, `hasTouch` + `isMobile`), not devices.
- **Tailwind v4 / shadcn variable names** (C12) are from memory of their documentation; not re-fetched. Treat as "check before relying".
- **Font coverage** is from the font's `cmap`, not from rendering every string.
- **Contrast** numbers are WCAG formula on 8-bit sRGB; no display profiles.
- **200 % text** is emulated with `html { font-size: 200% }` (equivalent for rem layouts; not the browser's own zoom UI).
- The reference-screen notes (`img1`..`img9`) were read as the owner's current understanding; none of their measurements were re-derived.
