# CLAUDE.md: how to work on this style guide

This repo is one reusable UI system for the owner's progressive web apps and mobile apps. It is **brand-agnostic**, **accessible by construction**, vanilla HTML/CSS/JS with **no build step for consumers**, and it grows as new example screens arrive. Read this file fully before changing anything.

**Quality bar:** clean, professional, repeatable, flexible, minimalist, friendly, communicative. The UI must guide the user clearly. Accessibility is WCAG 2.2 AA as a hard floor, with 7:1 text and 44 px targets as the default, and it must hold in every theme, palette, surface style, contrast mode and motion setting.

## Map

```
src/tokens/    00 primitives · 10 colour roles · 20 tones · 30 surface styles · 40 palettes · 50 type · 60 motion
src/base/      reset, element defaults, type-role classes, focus ring, sr-only, skip-link, hit-area
src/layout/    app shell, stack/cluster/split/grid, scroller, safe areas
src/components/*.css   one file per component (00-keyframes.css is shared)
src/js/        plain scripts on window.SG (NN-name.js, loaded in filename order)
src/icons/     24x24 stroke SVGs (Lucide, ISC licence). id = filename
src/fonts/     Manrope Variable (OFL)
docs-src/      page fragments → docs/ (generated). _layout.html, assets/docs.{css,js}
dist/          GENERATED: styleguide.css, .min.css, .js, icons.svg, fonts/   (what apps copy)
docs/          GENERATED site (GitHub Pages serves it; works from file:// too)
tests/         lint, contrast matrix, a11y gate, component specs, screenshots
pwa-starter/   minimal installable app shell using the guide
references/    distilled design notes from the reference screens
```

Never edit `dist/` or `docs/` by hand. Edit `src/` and `docs-src/`, then `npm run build`.

## Commands

| | |
|---|---|
| `npm run build` | generate `dist/` and `docs/` (`--allow-broken-links` while pages are unfinished) |
| `npm run lint` | static rules (no literal colours, no px font sizes, no `outline:none`, every `var()` declared, …) |
| `npm run test:contrast` | every colour role pair × 2 themes × 2 contrast modes × 6 palettes, resolved by a real browser |
| `npm run test:components` | keyboard / ARIA / focus interaction specs in `tests/components/` |
| `npm run test:a11y -- --pages a.html,b.html` | axe + focus walk + target sizes + reflow + forced colours on those docs pages (`--quick` for 2 appearances) |
| `node tests/screenshots.mjs components/x.html --theme dark --palette mint --surface pop --width 390` | look at it. Add `--matrix` for the full grid, `--selector '#examples'` to crop |
| `npm run new:component -- name --order 45` | scaffold CSS + docs page + test spec |
| `npm test` | everything above, in order |

**You must look at screenshots.** Green tests do not prove it looks right. Review at 320, 390 and 1024 px wide, in light and dark, with at least ink/mint/mono palettes and soft/pop/hard surfaces. Fix what looks wrong, not only what fails.

## The system in 60 seconds

Five independent switches, all `data-*` attributes on `<html>` (or on any element to make an "island"):

| attribute | values | changes |
|---|---|---|
| `data-theme` | light · dark (absent = OS) | colours |
| `data-contrast` | more (absent = OS) | lightness gaps, border weight |
| `data-palette` | ink (default) · periwinkle · mint · sand · cream · mono | hue, canvas tint, accent |
| `data-surface` | soft (default) · pop · hard | radius, borders, shadows, label case |
| `data-motion` | reduced · full (absent = OS) | travel, scale, springs |

Colour is built in three steps: **knobs** (`--k-*`, plain numbers: OKLCH lightness/chroma/hue) → **roles** (`--color-*`, derived with `light-dark(oklch(...))`) → **components** (read roles only). **Tones** (`data-tone="amber"`, `data-status="danger"`, `data-emphasis="bold"`) give a card five guaranteed-contrast roles (`--tone-surface|ink|ink-2|fill|on-fill|line`) from one hue. Components never know which palette, surface or theme is active.

Cascade layers, lowest to highest: `sg.reset, sg.tokens, sg.base, sg.layout, sg.components, sg.utilities`. Every source file opens its own `@layer sg.x { }`. An app's unlayered CSS always wins, so apps override without `!important`.

## Golden rules

1. **Roles, not literals.** In `src/components`, `src/layout`, `src/base`: no hex/rgb/oklch literals, no `px` font sizes. Colours from `--color-*` / `--tone-*`; radii from `--radius-*`; borders `--border-w`, `--card-border-*`, `--control-border-c`, `--fill-border-c`; shadows `--shadow-*`; space `--space-*`; type `--type-*`/`--text-*`. Missing a role? Add it to `src/tokens` with a comment and a line in `tests/contrast.mjs`; do not inline a colour.
2. **State comes from ARIA and native attributes**, never classes: `aria-selected|pressed|current|expanded|checked|busy|disabled`, `:disabled`, `[hidden]`. CSS that styles state the screen reader is not told about is a bug.
3. **Never colour-only.** Selected/on/error/status always has a second cue: shape, weight, border, icon or text. Status = icon + words. Charts need text and patterns too.
4. **Text contrast**: body and secondary text ≥ 7:1 (`--color-ink`, `--color-ink-2`); `--color-ink-3` ≥ 4.5:1 is the floor. Text on a tone uses `--tone-ink*`/`--tone-on-fill`; on the accent `--color-on-accent`. Never `opacity` on text. Never text on a photo without a scrim (`--color-scrim`, ≥ 0.55) or a solid plate.
5. **Non-text contrast ≥ 3:1**: control boundaries use `--color-line` (soft) or ink (pop/hard). Decorative hairlines use `--color-line-soft`.
6. **Targets**: every tappable thing has a 44×44 px hit area (`--target`), even if it looks smaller (use the `::after` pattern from `button.css`). ≥ 8 px between targets. Icon-only controls have `aria-label`.
7. **Every gesture has a tap/click equivalent** (WCAG 2.5.7): swipe, drag, slider dials, reorder, pull. Provide buttons or arrow keys. Gestures are an enhancement.
8. **Keyboard**: follow the WAI-ARIA Authoring Practices pattern for the widget. Roving tabindex for tabs/radiogroups/toolbars/menus; Esc closes overlays and returns focus to the trigger; no keyboard traps. Write a `tests/components/<name>.mjs` spec.
9. **Focus**: the global two-tone ring shows on every background. A component that sets its own `box-shadow` must keep it: `box-shadow: var(--focus-shadow), <own>` in its `:focus-visible` rule. Sticky chrome sets `--appbar-h` / `--dock-h` so focus is never hidden (2.4.11). Do not put `overflow: hidden` between a focusable element and its ring.
10. **Motion** is `transform` + `opacity`. Multiply travel by `--move` and press scale by `--press-scale-style`, so reduced motion becomes a fade. Never zero durations. Loading uses `var(--anim-spin)`. Nothing flashes > 3×/s. Anything that moves > 5 s (marquee, carousel autoplay) has a visible pause control.
11. **Forced colours**: keep a real (possibly transparent) border on every control and card; shadows and backgrounds vanish. Selected state needs a structural cue (border weight, check icon).
12. **Text size**: everything in `rem`; no `html { font-size: … }` hacks; layouts survive 200 % text and 320 px width (use `.cq` container queries + `minmax()` grids; em-based media queries only for the app shell). Long words wrap (`overflow-wrap`).
13. **Symbols are SVG**: inline `<svg class="icon" aria-hidden="true"><use href="#i-name"/></svg>`. Never text arrows/checks/emoji for UI (the bundled font lacks them, emoji render differently per device). Emoji as content need `role="img"` + `aria-label` or `aria-hidden`.
14. **Case is CSS, not HTML.** Write natural-case text; `text-transform: var(--label-case)` does the rest. Uppercase tracking is always positive.
15. **Hover is gated** with `@media (hover: hover)`; press feedback is visible within 100 ms.
16. **Logical properties** (`margin-inline`, `inset-block-start`, …) so RTL works.
17. **Tabular numerals** for money, time, counters: `.num` / `font-variant-numeric: tabular-nums`. Format with `Intl`; use the true minus `−` (U+2212).
18. **Native first**: `<button>`, `<a>`, `<dialog>`, `popover`, `<details>`, `<input type=range>`, `<progress>`, `<meter>`. Custom roles only where no native element exists, following the ARIA pattern exactly.
19. **Comments explain why**, name the bug a rule prevents, and cite the WCAG SC. Keep the header of each file true when code changes.

## Adding a component

1. `npm run new:component -- <name> --order <n>`. Orders: actions 10–19 · forms 20–39 · selection & navigation 40–59 · surfaces 60–79 · overlays & feedback 80–99 · data 100–119 · media & tools 120–139.
2. Copy the **structure** of `src/components/button.css` (private `--_*` properties, variants via `data-*`, states via ARIA, `@layer sg.components`, hit area, focus, hover gate, forced-colors, reduced motion).
3. Write real HTML in the docs page demos (auto-generated "Code" blocks come from the demo markup, so the docs cannot drift). Include: when to use (do/don't), every variant and size, every state, in-context example, anatomy, API table, keyboard + screen-reader table, tokens used.
4. JS only if HTML+CSS cannot do it. `src/js/NN-name.js`: an IIFE on `window.SG`, event delegation, data-attribute hooks, progressive enhancement, `SG.announce()` for changes with no focus move, `SG.motion.reduced()` before animating from JS.
5. Add `tests/components/<name>.mjs`. Keyboard, ARIA state flips, focus return.
6. `npm run build && npm run lint && node tests/components.mjs <name> && npm run test:a11y -- --pages components/<name>.html`, then **look at screenshots** across the matrix. Fix, repeat.
7. Done = the checklist below is all true.

### Definition of done (per component)

- [ ] Roles only; `npm run lint` clean (warnings justified in the docs page or PR)
- [ ] Looks right in soft, pop and hard with no style-specific code in the component
- [ ] Looks right in light, dark, `mono` palette and high contrast; 320 px and 200 % text do not clip or scroll sideways
- [ ] Keyboard pattern per APG; focus ring visible in pop (hard shadow) and on tonal cards; Esc/return-focus for overlays
- [ ] Names, roles, states exposed; icon-only controls labelled; live region for async changes
- [ ] Targets ≥ 44 px with ≥ 8 px gaps; gestures have tap equivalents
- [ ] State not colour-only; forced-colours border present; selected has a structural cue
- [ ] Reduced motion: travel → fade, nothing instant, nothing bouncing
- [ ] Docs page complete, all links/anchors resolve, demos are real markup
- [ ] `tests/components/<name>.mjs` passes; a11y gate passes for the page in all appearances
- [ ] Screenshots reviewed (and any visual flaw fixed, not waived)

## Docs page format

First line is metadata: `<!--{"title":"Card","group":"Components","order":60,"summary":"One sentence."}-->`. Groups: Start, Foundations, Components, Patterns, Accessibility, Project. Use `<h2 id="…">` for sections (they build the "On this page" list). Demo: `<div class="demo" data-layout="row|stack" data-bg="surface|inverse|media"><div class="demo__stage">…live markup…</div></div>`; add `data-nocode` only for demos that are not copy-paste-able. Tables go in `.table-wrap` with a `<caption class="sr-only">`. Links inside docs: `href="@/components/button.html"` (the build resolves `@/` to the docs root). Phone-sized screens: `<div class="phone"><div class="phone__screen">…</div></div>`. Live colour swatches: `<div data-swatches="--color-canvas --color-surface" data-on="--color-ink" data-min="7"></div>`. Callouts: `.note` with `data-kind="do|dont|a11y|warn"` (always include an icon and a label word).

## JS conventions

Plain scripts, no modules (they must work from `file://`). One IIFE per file attaching to `window.SG`. Hooks are `data-sg-*` attributes or component classes, bound by delegation on `document`. Wrap storage in try/catch (`SG.storage`). Announce with `SG.announce(msg)`. Respect `SG.motion.reduced()`. The build fails on `import`/`export`.

## Adding things

- **Palette**: copy a block in `src/tokens/40-palettes.css`, set hue/chroma knobs; add the name to `PALETTES` in `tests/contrast.mjs` and the docs switcher. Light accents must set `--fill-border-c` and a dark `--k-on-accent-*`. Run `npm run test:contrast`.
- **Tone**: add a hue in `00-primitives.css` and a selector in `20-tones.css`; add it to `TONES` in `tests/contrast.mjs`.
- **Icon**: drop a 24×24 stroke SVG in `src/icons/<id>.svg` (Lucide is ISC; keep `LICENSE-lucide.txt`). Use as `#i-<id>`.
- **Token/role**: declare it in `src/tokens`, document it on the matching Foundations page, cover it in `tests/contrast.mjs` if it is a colour pair.
- **Surface style**: a block in `30-surfaces.css` setting the same role names as the others. Components must not change.

## Do not

- Do not edit `dist/` or `docs/` by hand, and do not commit them from a feature branch except by running `npm run build`.
- Do not add runtime dependencies or a bundler. `package.json` has dev-only tooling.
- Do not use `!important` (except `[hidden]` and `.sr-only`), `transition: all`, `outline: none` without a replacement, `tabindex > 0`, `user-scalable=no`, or `div role=button`.
- Do not copy CSS from the reference designs: they fail contrast. Copy the *idea*; build it from roles. Reference notes: `docs/project/references.html`.
- Do not silence a failing check. Fix the cause, or change the rule with the reason written down.

## Known limits (be honest in reports)

Tests run in Chromium only. **Not verified**: Safari/WebKit and iOS (especially standalone safe areas, Dynamic Type via `-apple-system-body`, `overflow-clip-margin`-style gaps), Firefox, screen readers (VoiceOver/TalkBack/NVDA), Android font scale. `docs/accessibility/manual.html` lists the manual pass to do on a real iPhone. Contrast numbers are from 8-bit sRGB renderings and ignore display colour profiles.
