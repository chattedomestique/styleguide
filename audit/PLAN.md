# Fix plan, v0.1 → v0.2

Built from `audit/A1.md`, `audit/A2.md` and `audit/A3.md` plus the owner's answers. Read
`BRIEF.md` first. The audit reports have the evidence and line numbers for every item; this
plan is what we are actually doing. Anything not listed here is out of scope.

## Owner decisions (final)

- **Corners: square.** The radius roles stay as tokens, all `0`. Pills and circles stay round. The soft mode goes.
- **Cut:** the Notch variant, the Stack variant, the decorative ↗ circle on link cards, and the
  sheet sections "06 Not this" and "07 Pipeline".
- **Gates: keep all six** (Brief, Wireframe, States, Colour, Motion, Freeze). No change to the pipeline.
- **iOS text size: follow it** (Dynamic Type opt-in in installed PWAs).
- **Still open, don't decide:** class prefix and the system's name, which includes the
  `flashcards.css` filename. Keep the names as they are.

## Contract: names both fixers must use exactly

| Change | Exact names |
| --- | --- |
| New heading style for app screens | token `--type-heading: 600 var(--text-2xl) / var(--lh-tight) var(--font-sans)`, class `.t-heading` (letter-spacing `var(--ls-title)`) |
| Poster style leaves the shipped system | `--type-display`, `--text-4xl` and `.t-display` are removed from `tokens/` and `base.css`. The sheet hero keeps a sheet-only `.sg-display` in `sheet.css`, size `min(<its own clamp>, 19vw)` |
| No `vw` in app tokens | `--text-xl: 1.5rem; --text-2xl: 2rem; --text-3xl: 3rem` (fixed). Sheet-only fluid sizes live in `sheet.css` under `--sg-*` names |
| Label line-height | `--type-label` uses `/ 1.2` |
| Removed tokens | `--space-0`, `--space-9`, `--radius-1`, `--radius-2`, `--radius-3`, `--notch-w`, `--notch-h`, `--stack`, `--shadow-stack` |
| New tokens | `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` = `env(safe-area-inset-*, 0px)` (in `foundation.css`; for future bars and the app frame, never cards) |
| Lift is a shadow only | no `transform` anywhere on cards. `--shadow-lift: calc(var(--lift) * var(--bw) * 2) calc(var(--lift) * var(--bw) * 2) 0 0 var(--card-line)`; `box-shadow: var(--shadow-select), var(--shadow-lift)` |
| `@property --lift` / `--fill` | move from `card.css` to `tokens/foundation.css` |
| Selected | `.card:is([aria-selected="true"], .is-selected), .card:has(.card__link[aria-current]:not([aria-current="false"]))`. `aria-selected` only on a card that is `role="option"` in a `role="listbox"`. In navigable collections `aria-current` goes on the `<a class="card__link">` |
| Disabled | API is the modifier `.card--disabled` (plus `[aria-disabled="true"]` for role=option cards). `.is-disabled` is removed. A disabled card is not a link (no `href`) and shows its reason in `.card__meta` |
| Collections | markup `<ul class="card-grid" role="list"><li><article class="card">…</article></li>…</ul>`. CSS: `.card-grid > li { display: grid }`; tiled negative margins apply to `.card-grid--tiled > :is(.card, li)` |
| List rows | the whole row is the link: `<li><a href="#"><span>Shapes</span><span>12</span></a></li>`, with padding on the link, not the `li` |
| Layer order | `@layer tokens, base, components, wire, app, sheet;` and app CSS goes in `@layer app` |
| Soft ink | `.card { --card-ink-soft: var(--ink-soft) }`. The 72% mix moves to `.card[data-tone]`. `.t-meta` gets `color: var(--ink-soft)` |
| Variant list after cuts (8) | Plain, Panel, Media, Stat (a recipe + `.card--square`), Row, Link, Ghost, Study |

## F1, code: owns `design/css/**`, `design/index.html`, `design/tools/check.mjs`, `design/dist/`

Must
1. **Hover never moves the hit box** (A2-01, A3-03): remove the `transform` from `.card--link` and lift with the shadow only, per the contract.
2. **Sticky hover on touch** (A1-02, A3-12): every `:hover` selector goes inside `@media (hover: hover)`, including `.card__action:hover` and the ghost's. `.is-hover` and `:focus-visible` stay outside.
3. **Ghost: keyboard and pointer match** (A2-07, A3-04): `.card--ghost` gets `--lift: 1; --fill: 1` for hover (in the media query), `:focus-visible`, `.is-hover` and `.is-focus`.
4. **Ink-panel bar focus ring** (A1-01): the bar ring rule becomes `.card .card__bar :focus-visible { outline-color: var(--card-bar-ink); outline-offset: calc(var(--ring) * -1) }`, placed after the `[data-tone="ink"]` ring rule.
5. **200% text** (A1-03): `flex-wrap: wrap` on `.card__bar`, `.card__row`, `.card__foot`, `.card--ghost`; `.card__bar > .card__ctl { margin-inline-start: auto }`. Gate: at 390px and 320px with `html { font-size: 200% }`, no card clips a control or a title.
6. **Foot links get a 44px target** (A1-04): `.card__foot :is(a, button)` gets `min-block-size: var(--hit)` plus the negative margins from A1-04 so the foot stays 44px.
7. **Selection and collections** (A3-02): use the Selected and Collections rows of the contract. In the States specimen, `aria-current="true"` moves from the `<article>` onto its `<a>`.
8. **The gate runs standalone** (A3-01): delete the `appClasses` block and its use in `check.mjs`.
9. **Display style** (A2-02, A1-11): per the contract. The Tokens › Type box shows `.t-heading` in place of the display row.

Should
10. **Apply the cuts.** Remove the Notch and Stack CSS, including the notch's forced-colours branch, and their specimens. Remove the ↗ circle and its `.card__row` wrapper from every link card (Link and States sections): the eyebrow sits at the top and the title group at the bottom. Remove sections 06 and 07 and every sheet rule only they used (`.sg-compare`, `.sg-bad*`, `.sg-tells`, `.sg-table`, `.sg-tag`, `.sg-next`, `.sg-scroll`, …). Renumber variants 3.1–3.8 and the nav. Remove the Corners switch, its hint and the `:root:has(#shape-soft:checked)` block. The Tokens › Shape box shows square only ("decided"). Keep the Show boxes switch.
11. **The gate covers `sheet.css` too:** checks 2–5 now apply to it. Remove the flat-gradient exception that only the notch used (`wire.css` keeps its gradient allowance). Make `sheet.css` pass, e.g. `outline: 1px dashed` → `var(--bw-thin)`.
12. **Anatomy foot action is a real button:** `<button type="button" class="card__action" aria-label="Mark as known"><span class="ic ic--check"></span></button>` (keep its badge 9). The anatomy bar label becomes `<p class="card__label">` (A1-09).
13. **Heading levels** (A1-09): the card titles inside #anatomy and #states are h3 (directly under their h2). Everywhere else h4 under an h3 entry stays as it is.
14. **Disabled** (A1-07, A1-10, A3-11): `.card--disabled` per the contract. The specimen gets `<p class="card__meta">Unlocks after Colours</p>`. In forced colours, the frame and text use `GrayText` and the `.ic` uses `background-color: GrayText`. Delete `cursor: not-allowed`.
15. **Cursor** (A3-11): delete `cursor: pointer` from `button` (base), `.card__ctl`, `.card__action`, `.card--link` and `.card--ghost`. Links keep the hand natively. The sheet's own radio labels can keep theirs.
16. **Pressed feedback** (A1-06): `.card__action:active, .card--ghost:active { --fill: 1 }`. `.card__ctl:active::before { background: currentColor }`. `.card__list a:active` and `.card__foot :is(a, button):active` swap ink and paper (`color: var(--card-bg); background: var(--card-ink)`). base.css: `a, button, summary, label { -webkit-tap-highlight-color: transparent }`.
17. **List rows** (A1-05): per the contract (markup and CSS).
18. **Grids as lists** (A1-08): per the contract. The Loose and Tiled specimens use `<ul role="list">`/`<li>`.
19. **Soft ink** (A2-06): per the contract.
20. **Type tidy-up** (A2-08, A2-12, A2 conflict 3):
    - Label line-height 1.2. Delete `lining-nums` and `text-rendering: optimizeLegibility`.
    - Apply `max-inline-size: var(--measure)` on `.t-body`.
    - Scope `-webkit-font-smoothing: antialiased` plus `-moz-osx-font-smoothing: grayscale` to `.card__bar`, `[data-tone="ink"]` and `.sg-top` instead of `body`.
    - Sheet: no text under 13px (`.sg-spec`, `.sg-n` and badges go to 0.8125rem).
21. **iOS Dynamic Type** (owner yes): base.css `@supports (-webkit-touch-callout: none) { html { font: -apple-system-body; } }`. The `-webkit-touch-callout` guard keeps it iOS-only; `-apple-system-body` is 13px on a Mac and must not apply there.
22. **Inputs don't zoom on iOS:** base.css `:is(input, select, textarea) { font-size: max(1rem, 1em) }`.
23. **Prefers more contrast** (A1): in `tokens/color.wire.css`: `@media (prefers-contrast: more) { :root { --ink-soft: var(--ink); --line-soft: var(--ink); } }`. In card.css: `@media (prefers-contrast: more) { .card { --card-ink-soft: var(--card-ink) } }`.
24. **Study card fits a phone** (A1): `.card--study { max-inline-size: min(22rem, (100svh - var(--chrome, 0px)) * 5 / 7) }`. Hint text "Tap to flip" → "Turn over".
25. **Sheet on a phone** (A1-12, A2-10): below 52rem, hide `.sg-top__brand` and let the nav wrap with no hidden scroll. Nav labels lose their numbers. Replace the 5.3 resize box with the same two cards at three fixed widths (14, 18, 24rem), each captioned.
26. **De-flashcard the code** (A3-05):
    - `wire.css`: "drawn from decks.js paths" → "the product's own illustrations".
    - `foundation.css`: drop "same as the app".
    - index.html: inline the flip rules where it says "the rules in the app's README" (perspective on the parent, backfaces hidden, `cubic-bezier(.83, 0, .17, 1)`, reduced motion becomes a short crossfade). "Copy comes from the app" → "from the product".
    - Version text: v0.1 → v0.2.
27. **Layer order** gets `app` per the contract.
28. **Regenerate** `dist/` with `node design/tools/bundle.mjs` as the very last step.

Done when: `node design/tools/check.mjs` passes 9/9 (STYLE.md may lag while F2 works; re-run at the end), `qa/shot.cjs` is clean at 390 mobile and 1440 desktop with no horizontal overflow, and `git diff --stat` touches only your files.

## F2, docs: owns `design/STYLE.md`, `design/README.md`

STYLE.md, ≤ 600 lines in total, voice unchanged (short, plain, reasons given):
1. Header v0.2. A **"Start here"** box of at most 12 lines at the top: the 6 roles, the 5 classes you need first, the 2 house rules, and "run `node design/tools/check.mjs`" (A3-10).
2. **Delete duplicates** (A3-07): the file tree (README owns it), the grey hex primitives table, and the static contrast table. Keep the floors: ink is at least 8.4:1 and soft ink at least 4.5:1 on any tone, and the live swatches are the source.
3. **Rules and the type section**:
    - Square is decided, which removes "one shape gesture".
    - Add to rule 2: hover and press never move the hit box.
    - Type table: `--type-heading`/`.t-heading` replaces display. Fixed `rem` sizes, no `vw` in app UI. Floors are 16/14/13px. A label is 1–4 words at line-height 1.2. Document `.card__answer` (700, 36–60px by card width).
    - Font loading (A2-04): apps link `dist/flashcards.css`, preload the woff2 with `crossorigin` in a served shell, and a PWA precaches it.
    - Font smoothing only on dark surfaces. Dark-mode weight drop as gate 3 guidance.
4. **Foundations additions**:
    - Hit targets by input: 44px on touch for every control, foot links included. Mac pointer floor 24px web / 28pt native, as one future density switch, not now.
    - Focus ring by platform: web keeps ours, native uses the system ring. A ring takes the ink of the surface it lands on.
    - Motion guidance for gate 4: reduced motion is gentler, not instant. The flip becomes a crossfade of 150ms or less. SwiftUI timing curve per A3. No `.bouncy`.
    - Layer `app`. Safe-area tokens.
5. **Card section**:
    - Variants table with 8 entries (contract).
    - States table: lift is a shadow; hover only on hover-capable devices; every control has `:active`; Selected and Disabled per the contract.
    - Collections: navigable or selectable, never both; ul/li markup; roving tabindex for a selectable listbox; `draggable="false"` on `.card__link` when cards aren't draggable.
    - Accessibility additions: a title is one heading level below its section; a disabled card says why; meters carry `aria-valuetext`; every gesture has a visible button; prefers-contrast.
    - Responsive: 320px at 200% text with no clipping.
    - Known limits: delete the notch, stack and `.card` collision bullets. Delete the Safari `overflow-clip-margin` bullet, because the band came from the translate, which is gone (check that `overflow-clip-margin` is still needed before deleting).
5b. Remove every mention of the cut items as backticked names. The changelog names them in plain words ("the Notch and Stack variants"), because check 7 fails on backticked names that aren't in the CSS.
6. **New section "Platforms"**, about 60 lines in total:
    - PWA: the A1 rules (viewport-fit and safe areas, theme-color = `--canvas`, `dvh` for the app frame and `svh` for size-once, inputs at 16px or more, `overscroll-behavior: contain`, a back control on every screen past the root, empty = ghost card, offline/error = plain card with "Try again", Dynamic Type on).
    - macOS: the A3 rules (menu-bar commands with shortcuts; keys; don't depend on Tab; context menus as shortcuts; live window resize; glass only as the system's own chrome; system font and colours for native chrome only), plus the A3 SwiftUI mapping table, trimmed to about 12 rows.
7. **New section "Skills we build with"**: the seven skills (ui-ux-pro-max, neobrutalist-web-designer, retro-css-architecture, typography, web-design-guidelines, interaction-design, swiftui-expert-skill), each with when to load it, what we take and what we ignore, in 3 lines, from the auditors' section 4. Precedence: usability facts, then this file, then the skills.
8. **"Where we differ from the skills"**: one compact table, at most 8 rows, from the auditors' conflicts. Neobrutalist shadows at rest and 3–4px borders; global reduced-motion kill switch; opacity for disabled; floating navbar; glass on content; system type and colour (native chrome only); `.spring`/`.bouncy`; Archivo + Space Grotesk pairing.
9. **De-flashcard** (A3-05): "copy comes from the product", motion rules stated in our own words with no "the app's", no references to the app's README or `styles.css`. Open decisions: class prefix and the system name.
10. **Changelog 0.2.0 · 2026-10-19**: the cuts, square, the a11y and touch fixes, platforms, skills.

README.md:
- Delete "Migrating the app".
- "The gate": no exemption for `sheet.css` any more, and no "app's own classes" clause. Still nine checks.
- Keep the file tree here as the single copy; update it if files changed (they didn't).
- Pipeline: six gates unchanged. Cards are still at gates 0–2.
- Add one line pointing to STYLE.md "Skills we build with".

Done when: line budget held, every backticked token and class exists in the CSS (`node design/tools/check.mjs`, check 7; names F1 is adding per the contract may lag until F1 finishes), and nothing contradicts the contract.
