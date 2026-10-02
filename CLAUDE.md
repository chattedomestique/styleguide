# CLAUDE.md: how to work on this style guide

This repo is one reusable UI system for the owner's progressive web apps and mobile apps. It is **brand-agnostic**, **accessible by construction**, vanilla HTML/CSS/JS with **no build step for consumers**, and it grows one element at a time as the owner sends new examples. Read this file fully before changing anything. The exact values and the reasons are in `STYLE.md`.

**Where it comes from.** The base is the owner's *Flashcards style sheet v0.1*: its tokens, role names, tone API, `.card` element, gates and checker rules are theirs and stay canonical. On top of that this repo adds real colour (dark mode, higher contrast, six palettes, verified in a browser), an accessibility test gate, and elements that came from the reference screens. When you add something, it must look like the same hand drew it.

**Quality bar:** clean, professional, repeatable, flexible, minimalist, friendly, communicative. The UI guides the user clearly. WCAG 2.2 AA is a hard floor, with 7:1 text and 44 px targets as the default, in every theme, palette, corner style, contrast mode and motion setting.

## The look, in seven rules (from the owner's sheet; enforced where a machine can)

1. **Two line weights.** `--bw` 2px frames what you press or what contains. `--bw-thin` 1px only divides. `--bw-heavy` 4px exists for forced-colours mode and nothing else.
2. **Flat.** No gradients, no blur, no glass. A shadow is hard-edged (zero blur) and means "you can press this". Nothing else gets one. The one exception is a scrim behind a modal, or over a photo so text stays readable.
3. **Rectangles hold, circles act.** Containers are rectangles (square or soft per `data-corners`). Buttons, handles and action slots are circles or pills.
4. **Uppercase is structure.** Bar labels, index numbers, the display line. Everything you read is sentence case. Case is applied in CSS, never typed.
5. **Say something real.** No lorem ipsum, no "John Doe", no "seamless". Copy comes from an app: decks, wallets, tasks, streaks.
6. **Colour is a swap.** Components read roles. Only `src/tokens` contains a colour literal.
7. **No decoration.** If it carries no information and offers no action, it goes. No dotted backgrounds, no icons in tinted circles, no accent stripes.

**The test** (run it on every screen before calling it done): *squint* (does it survive with colour removed? flip to `data-palette="wire"`), *cover the logo* (could it be any product?), *count* (line weights: two; type families: one; gradients: zero; blurred shadows: zero; shadows on things you cannot press: zero), *read it aloud* (if it sounds like a landing page, rewrite it).

## Map

```
src/tokens/    00 foundation (type, space, line, shape, hit, focus, @property) · 10 colour roles ·
               20 tones · 30 corners · 40 palettes · 50 fonts · 60 motion
src/base/      reset, element defaults, .t-* type styles, focus ring, sr-only, skip-link, icons (.ic masks)
src/layout/    app shell, stack / cluster / split / grid, scroller, safe areas
src/components/*.css   one file per element (button.css is the reference; card.css is the owner's original)
src/wire/      wireframe placeholders (.wf-*). Dev-only: built to dist/wire.css, never required by a component
src/js/        plain scripts on window.SG (NN-name.js, loaded in filename order)
src/icons/     24x24 stroke SVGs (Lucide, ISC licence). id = filename; built into dist/icons.css as masks
src/fonts/     Archivo variable (OFL)
docs-src/      page fragments → docs/ (generated). _layout.html, assets/docs.{css,js}
dist/          GENERATED: styleguide.css, .min.css, .js, icons.css, wire.css, fonts/   (what apps copy)
docs/          GENERATED site (GitHub Pages serves it; also works from file://)
tests/         lint (the owner's gate + more), contrast matrix, a11y gate, component specs, screenshots
```

Never edit `dist/` or `docs/` by hand. Edit `src/` and `docs-src/`, then `npm run build`.

## Commands

| | |
|---|---|
| `npm run build` | generate `dist/` and `docs/` (`--allow-broken-links` while pages are unfinished) |
| `npm run lint` | the owner's gate, rebuilt on a CSS tokenizer and extended (see `STYLE.md` §5): undefined tokens, colour literals (incl. named colours and `data:` URIs) outside `src/tokens`, AI tells, literal line widths and radii, layering, unknown classes in docs and JS, a11y hygiene, ungated `:hover`, placeholder copy |
| `npm run test:lint` | replays the tooling audit's cases against the lint (`tests/lint-cases.json`): today 112 of 136 violations caught and 34 of 34 legitimate snippets passed (the 24 misses only a render can judge). Add a case whenever you add a rule |
| `npm run test:contrast` | every colour role pair × 2 themes × 2 contrast modes × 6 palettes (× 6 tone slots + ink + 4 status, pastel and bold), resolved by a real browser |
| `npm run test:components` | keyboard / ARIA / focus / state specs in `tests/components/` |
| `npm run test:a11y -- --pages a.html,b.html` | axe + focus walk + target sizes + reflow at 320 and 200 % text + forced colours on those docs pages (`--quick` for 2 appearances); `data-allow-clip` on a demo marks text that is cut on purpose (truncation, a failure shown as a warning) |
| `node tests/screenshots.mjs components/x.html --theme dark --palette mint --corners soft --width 390` | look at it. `--matrix` for the grid, `--selector '#examples'` to crop |
| `node tests/design.mjs --pages components/x.html --crops` | the design-integrity probe: ovals, wrapped labels, broken words, ragged bars, one row at two heights, icons far from labels. A report in `test-results/design.json` for a person to judge, not a gate (`--conditions phone,large` to narrow it) |
| `npm run new:component -- name --order 45` | scaffold CSS + docs page + test spec |
| `npm test` | everything above, in order |
| `npm run status` | regenerate `docs-src/project/status.html` (the Status page) from the gates: builds, runs the lint, the component specs and the a11y gate on every component page, and writes each element's findings into its row. Takes about an hour (all five appearances); `npm run status -- --quick` runs two, about 20 minutes, to look at, not to commit. Not part of `npm test`. Rendering from logs you already have is described in the header of `scripts/status.mjs` |

**You must look at screenshots.** Green tests do not prove it looks right. Review at 320, 390 and 1024 px, at 390 px with 200 % text, light and dark, `default` / `mint` / `wire` palettes, square and soft corners. The bar is "a careful product designer would ship this screen". Fix what looks wrong, not only what fails.

## The system in 60 seconds

Six independent switches, all `data-*` attributes on `<html>` (or on any element to make an "island"):

| attribute | values | changes |
|---|---|---|
| `data-theme` | light · dark (absent = OS) | colours |
| `data-contrast` | more (absent = OS) | lightness gaps: text ≥ 7:1 everywhere, accent collapses to ink |
| `data-palette` | default · mint · periwinkle · sand · cream · wire | hue, canvas tint, accent, tone hues |
| `data-corners` | square (default) · soft | the three radius roles |
| `data-motion` | reduced · full (absent = OS) | travel: `--move` 0 and shorter durations |
| `data-tone` | 1…6 · ink · ok · warn · bad · info (+ `data-emphasis="bold"`) | `--tone-bg --tone-ink --tone-ink-soft --tone-fill --tone-on-fill` **on that element only** |

Colour is built in three steps: **knobs** (`--k-*`, plain numbers: OKLCH lightness / chroma / hue) → **roles** (`--canvas --paper --paper-2 --paper-3 --ink --ink-soft --ink-mute --ink-faint --line --line-soft --focus --accent --on-accent --accent-ink --accent-soft --on-accent-soft --ok-ink --warn-ink --bad-ink --info-ink --scrim --on-media`, derived with `light-dark(oklch(…))`) → **components** (read roles only). Components never know which palette, corner style or theme is active.

Interaction is two registered numbers: `--lift` (0 flat, 1 raised: the hard shadow and the 2px move) and `--fill` (0 outline, 1 filled). Every state only sets them; one `transition` animates both. See `src/components/button.css`. An action fills on hover; a selection control keeps the fill for "selected" (golden rule 2).

Cascade layers, lowest to highest: `sg.reset, sg.tokens, sg.base, sg.layout, sg.wire, sg.components, sg.utilities` (the wireframe kit sits BELOW components so a placeholder can never override a real element; utilities sit last so `.sr-only` and `.num` win over a component's `position` and `font:`). Every source file opens its own `@layer sg.x { }`. An app's unlayered CSS always wins, so apps override without `!important`.

## Golden rules (beyond the seven above)

1. **Roles, not literals.** In `src/components`, `src/layout`, `src/base`, `src/wire`: no hex/rgb/oklch literals, no `px` font sizes; border widths from `--bw / --bw-thin / --bw-heavy / --ring`; radii only `--radius-card | -tile | -ctl | -pill`. Missing a role? Add it to `src/tokens` with a comment and a line in `tests/contrast.mjs`; do not inline a colour.
2. **State comes from ARIA and native attributes**, never classes: `aria-selected|pressed|current|expanded|checked|busy|disabled`, `:disabled`, `[hidden]`. The `.is-*` classes exist only to force a state for docs and tests. **Selection controls** (chip, tab, segmented option, toggle, dock item, tile, swatch, calendar day…) keep the solid fill for selected / on / current: hover and focus only lift (`--lift: 1; --fill: 0`), pressed tints (`--lift: 0; --fill: 0.15`), selected is `--fill: 1` plus its structural cue, selected + hover is 1 / 1. Actions (a `.btn` without `aria-pressed`) keep the owner's fill-on-hover. A hovered chip must never look selected.
3. **Never colour-only.** Selected / on / error / status always has a second cue: shape, weight, border, icon or text. Status = icon + words. Tones carry rhythm, never meaning.
4. **Text contrast**: `--ink` and `--ink-soft` ≥ 7:1; `--ink-mute` ≥ 4.5:1 is the floor; `--ink-faint` is 3:1 and never carries text that matters. On a tone use `--tone-ink`, `--tone-ink-soft`, `--tone-on-fill`; on the accent `--on-accent`. Never `opacity` on text. Never text on a photo without a scrim or a solid plate.
5. **Non-text contrast ≥ 3:1**: frames use `--line`; decoration that must stay quiet uses `--line-soft`.
6. **Targets**: every tappable thing has a 44×44 px hit area (`--hit`), even if it is drawn smaller (the `::after` pattern from `button.css`). ≥ 8 px between targets. Icon-only controls have `aria-label`.
7. **Every gesture has a tap/click equivalent** (WCAG 2.5.7): swipe, drag, slide-to-confirm, reorder. Gestures are an enhancement.
8. **Keyboard**: follow the WAI-ARIA Authoring Practices pattern. Roving tabindex for tabs / radiogroups / toolbars / menus; Esc closes overlays and returns focus to the trigger; no traps. Write a `tests/components/<name>.mjs` spec.
9. **Focus**: the ring is `var(--ring) solid var(--focus)` at `--ring-offset`, plus a paper halo so it shows on any background. Inside something that clips (a card), use `--ring-gap: var(--ring-offset-in)`. A component that sets its own `box-shadow` keeps it: `box-shadow: var(--focus-shadow), <own>`. Sticky chrome sets `--appbar-h` / `--dock-h` so focus is never hidden (2.4.11). On an ink surface the ring follows the surface (an ink ring on an ink card vanishes).
10. **Motion** is `transform` + `opacity` + the two registered numbers. Multiply travel by `--move`, so reduced motion becomes a plain fill change, never "instant" and never bouncing. Loading uses `var(--anim-spin)`. Nothing flashes > 3×/s. Anything that moves > 5 s (marquee, autoplay) has a visible pause control.
11. **Forced colours**: keep a real border on every control and card (shadows and fills vanish); hover / focus / selected get a `--bw-heavy` `Highlight` outline or border.
12. **Text size: words grow, chrome stops.** Words and the space between blocks are `rem` (`--space-*`) and grow with the reader's text; an icon inside a line of words grows with its label (`em`, e.g. `--ic-size: 1.15em`). The insets of controls and containers, icon-only controls and their 44 px targets, the slots that hold them, leading pictures, badges and picture frames stop at their 100 % size (`--chrome-*`, see the Space page). Layouts survive 200 % text and 320 px width (container queries inside components, `minmax(min(100%, …), 1fr)` grids, em-based media queries only for the app shell). Words wrap between words (`overflow-wrap: break-word`); never `overflow-wrap: anywhere`, which makes min-content one letter and shatters words in flex and grid rows (lint rule `wrap`). Numbers never break mid-number.
13. **Symbols are masks**: `<span class="ic ic--plus" aria-hidden="true"></span>`. Never text arrows / checks / emoji for UI. A control whose only content is an icon gets the `aria-label`.
14. **Hover is gated** with `@media (hover: hover)`; press feedback is visible within 100 ms.
15. **Logical properties** (`margin-inline`, `inset-block-start`, …) so RTL works.
16. **Tabular numerals** for money, time, counters (`.num`). Format with `Intl`; true minus `−` (U+2212).
17. **Native first**: `<button>`, `<a>`, `<dialog>`, `popover`, `<details>`, `<input type=range>`, `<progress>`, `<meter>`. Custom roles only where no native element exists, following the ARIA pattern exactly.
18. **Comments explain why**, name the bug a rule prevents, cite the WCAG SC. Keep each file's header true when code changes.
19. **A bar or control row never wraps raggedly.** One row at every size, `[lead] [text that may wrap] [actions]`, with chrome-capped icon controls, all one height. When it truly cannot fit it switches as a whole (icons only, the short form, one item per line, or a scroller with a clear cue), measured with `SG.fit` (`src/js/05-fit.js`) when CSS cannot know. Never 2 + 1, never a lonely item on a second row.

## Adding an element: the pipeline

The owner's sheet moves every element through gates, in order. Do not skip ahead: colour before structure hides layout problems.

| Gate | Question | Closed when |
|---|---|---|
| 0 Brief | What is it for, who presses it, what is the one idea? | one sentence in the docs page |
| 1 Wireframe | Does the structure work in `data-palette="wire"`? | squint test passes |
| 2 States | Rest, hover, focus, pressed, selected, disabled, busy, error: all defined? | `--lift` / `--fill` set by every state |
| 3 Colour | Roles only; tones; contrast verified | `npm run test:contrast` green |
| 4 Motion | One transition; reduced motion = gentler | spec passes with `reducedMotion` |
| 5 Freeze | Docs complete, a11y gate green, screenshots reviewed | definition of done below |

The status table lives in `STYLE.md` §6 (the owner's copy); the Status docs page is generated from the gates by `npm run status`, and its "Screenshots" field from `docs-src/project/visual-review.json`, which a person keeps by hand after looking. Passing checks are never "done" on their own. Update §6 when an element moves.

1. `npm run new:component -- <name> --order <n>`. Orders: actions 10–19 · forms 20–39 · selection & navigation 40–59 · surfaces 60–79 · overlays & feedback 80–99 · data 100–119 · media & tools 120–139.
2. Copy the **structure** of `src/components/button.css`: `--lift` / `--fill`, private `--_*` properties, variants via `data-*`, states via ARIA, `@layer sg.components`, hit area, focus, hover gate, forced colours, reduced motion.
3. Write real HTML in the docs demos (the "Markup" disclosure is read from the live demo, so the docs cannot drift). Include: when to use (do/don't), every variant and size, every state, an in-context example, anatomy, API table, keyboard + screen-reader table, tokens used.
4. JS only if HTML + CSS cannot do it: `src/js/NN-name.js`, an IIFE on `window.SG`, event delegation, `data-sg-*` hooks, progressive enhancement, `SG.announce()` for changes with no focus move, `SG.motion.reduced()` before animating from JS.
5. `tests/components/<name>.mjs`: keyboard, ARIA flips, focus return, the `--lift` / `--fill` states.
6. `npm run build && npm run lint && node tests/components.mjs <name> && npm run test:a11y -- --pages components/<name>.html`, then **look at screenshots** across the matrix. Fix, repeat.

### Definition of done (per element)

- [ ] Roles only; `npm run lint` clean (warnings justified)
- [ ] Looks right in square and soft corners with no corner-specific code in the element
- [ ] Looks right in light, dark, `wire` palette and high contrast; 320 px and 200 % text do not clip or scroll sideways
- [ ] Keyboard pattern per APG; focus ring visible on tones and ink; Esc / return-focus for overlays
- [ ] Names, roles, states exposed; icon-only controls labelled; live region for async changes
- [ ] Targets ≥ 44 px with ≥ 8 px gaps; gestures have tap equivalents
- [ ] State not colour-only; forced-colours border present; selected has a structural cue
- [ ] Reduced motion: no travel, nothing instant, nothing bouncing
- [ ] Docs page complete, links / anchors resolve, demos are real markup
- [ ] Spec passes; a11y gate passes for the page in all appearances
- [ ] Looks right at 390 px at 100 % AND 200 % text: equal heights in a row, no lonely item, no word broken inside, icons beside their labels
- [ ] Screenshots reviewed (any visual flaw fixed, not waived), and its entry in `docs-src/project/visual-review.json` updated

## Docs page format

First line is metadata: `<!--{"title":"Card","group":"Components","order":60,"summary":"One sentence."}-->`. Groups: Start, Foundations, Components, Patterns, Accessibility, Project. `<h2 id="…">` sections build the "On this page" list; keep heading levels in order (h2 → h3 → h4) or axe fails. Demo: `<div class="demo" data-layout="row|stack"><div class="demo__stage">…live markup…</div></div>`; add `data-nocode` only when the demo is not copy-paste-able. Tables go in `.table-wrap` with a `<caption class="sr-only">`. Links inside docs: `href="@/components/button.html"` (the build resolves `@/` to the docs root). Icons: `<span class="ic ic--name" aria-hidden="true"></span>`; the build fails if `ic--name` does not exist in `src/icons`. Callouts: `.note` with `data-kind="do|dont|a11y|warn"` (always an icon and a label word).

## JS conventions

Plain scripts, no modules (they must work from `file://`). One IIFE per file attaching to `window.SG`. Hooks are `data-sg-*` attributes or component classes, bound by delegation on `document`. Storage in try/catch (`SG.storage`). Announce with `SG.announce(msg)`. Respect `SG.motion.reduced()`. The build fails on `import` / `export`.

## Adding things

- **Palette**: a block in `src/tokens/40-palettes.css` setting knobs; add the name to `PALETTES` in `tests/contrast.mjs` and the docs switcher. Run `npm run test:contrast`.
- **Tone slot hue**: `--tone-h-N` / `--tone-c-N` in a palette. **Status tone**: a `--hue-*` and a selector in `20-tones.css`; the contrast matrix finds tones in the built CSS by itself, but the lint's list of valid `data-tone` values is `TONES` in `tests/lib/rules.mjs`.
- **Icon**: drop a 24×24 stroke SVG in `src/icons/<id>.svg` (Lucide is ISC; keep `LICENSE-lucide.txt`). Use as `ic--<id>`.
- **Token / role**: declare it in `src/tokens`, document it in `STYLE.md` §2, cover it in `tests/contrast.mjs` if it is a colour pair.
- **Corner style**: a block in `30-corners.css` setting the three radius roles. Components must not change.

## Do not

- Do not edit `dist/` or `docs/` by hand. Do not commit them from a feature branch except by running `npm run build`.
- Do not add runtime dependencies or a bundler. `package.json` has dev-only tooling.
- Do not use `!important` (except `[hidden]` and `.sr-only`), `transition: all`, `outline: none` without a replacement, `tabindex > 0`, `user-scalable=no`, `div role=button`, gradients, blur, `text-shadow`.
- Do not copy CSS from the reference designs: they fail contrast and many break rule 2. Copy the *idea*; build it from roles and the owner's vocabulary.
- Do not invent a second way to do something the owner's sheet already decided (a second type family, a third line weight, a fourth radius).
- Do not silence a failing check. Fix the cause, or change the rule with the reason written down.

## Known limits (be honest in reports)

Tests run in Chromium only. **Not verified**: Safari/WebKit and iOS (standalone safe areas, Dynamic Type via `-apple-system-body`, `overflow-clip-margin`), Firefox, screen readers (VoiceOver / TalkBack / NVDA), Android font scale. Contrast numbers come from 8-bit sRGB renderings and ignore display colour profiles. `light-dark()` needs a 2024+ browser (Baseline Newly available; Widely in late 2026).
