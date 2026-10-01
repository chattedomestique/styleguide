# Audit: what was wrong with the Flashcards style sheet v0.1, and what happened to it

You asked for the existing guide to be audited: what has gone wrong, what the issues are, and a double-check of the work. This file is that audit, and what was done about each finding.

## How it was done

The sheet you attached (`style-sheet-cards-v0.1.zip`) was audited by four independent reviewers who could not see each other's work, each in a real browser (Chromium 141, Playwright, axe-core) against the files exactly as shipped:

| Reviewer | Looked at | Main method |
| --- | --- | --- |
| CSS and tokens | every shipped CSS file, line by line | ~26 browser probes (forced colours, RTL, 100–300% text, 320–1280px), mutation tests of `check.mjs` |
| Rendering and accessibility | the live page and the card as an app receives it | keyboard walk with pixel-diffing of every focus ring, axe, zoom, text spacing, forced colours, hover-none, reduced motion |
| Tooling and process | `check.mjs`, `bundle.mjs`, `dist/`, README vs STYLE vs CSS vs page | 183 fuzz cases fed to the checker (146 deliberate violations, 36 legitimate snippets), bundle failure modes |
| Genericisation | what is Flashcards-specific, what is generic, and what will not scale to 40 elements | token-by-token decisions, rule-by-rule stress tests |

Their raw findings were 125 entries, which collapse to about 45 distinct issues. The full reports are in `references/audit/`. Everything below is evidence-backed: each was reproduced, not guessed.

## The short version

1. **The foundation is good and most of it is kept as you wrote it**: the role names, the tone API, `--lift` / `--fill`, the type, space, line, shape and hit-target tokens, the stretched-link card, cascade layers, the pipeline idea, and the habit of writing comments that name the bug a rule prevents. The numbers in STYLE.md are accurate to 0.05 almost everywhere; `dist/` is byte-identical to a fresh build; the page reflows at 320px and 400% zoom.
2. **It was not accessibility-clean**, and your own `check.mjs` could not see why: it never renders. There was a hard WCAG 2.4.7 failure in the shipped CSS (the collapse control on an ink panel had a white focus ring on a white bar, 1.00:1), a selected state invisible on the inverted tone, `aria-selected` used on elements that do not allow it, secondary text below 7:1 on every tone, and real text clipped silently by the card's frame at large text sizes.
3. **The gate was a useful linter but not yet a gate.** Of 146 deliberate violations it caught 44%; of 19 accessibility-hygiene rules it caught none; and it wrongly flagged 11 of 36 legitimate snippets. Its contrast check *passed* whenever it could not parse a colour, so following the README's own dark-mode steps printed "All 9 checks pass" on a 1.28:1 palette. Dark mode could not actually be switched on, because `base.css` pinned `color-scheme: light` above the tokens layer.
4. **Some of the rules were written for one app and one element.** Seven of the seven rules break at the first new elements (a Tag is a static pill; a Toast floats; a modal needs a scrim; a dock needs a fourth radius). They are kept, with their exceptions written down rather than left to be discovered.
5. **The pipeline is the best idea in the zip and the thing most likely to fail at 40 elements**: one global `motion` flag, a hard-coded colour pair list, one page, and a hand-ticked status table.

## Findings and what was done

Status: **Fixed** = changed here and covered by a test that fails without the change. **Documented** = a real limit that is written down, not removed. **Open** = not done; see the list at the end. **n/a** = does not apply to this repo.

### Accessibility and behaviour (rendered)

| # | Finding | Evidence | Status |
| --- | --- | --- | --- |
| D01 | Focus ring invisible on the ink panel's bar control (WCAG 2.4.7, 2.4.11) | white ring on white bar, 1.00:1; focused vs blurred pixel diff 0 | **Fixed.** Rings follow the surface (tone ink over tone fill; the bar uses the bar's colours). `test:a11y` now measures the ring against what it is drawn on for every focusable, every appearance |
| D02 | Secondary text below 7:1 on every tone (27 nodes) | 4.80–6.76:1; two different soft inks, one a runtime `color-mix` | **Fixed.** `--tone-ink-soft` is an explicit role, ≥ 7:1 on all 11 tones, pastel and bold, in every theme, contrast mode and palette |
| D03 | `aria-selected` documented as the selected trigger on roles that do not allow it | axe `aria-allowed-attr` on `<article>` and `<a>` | **Fixed.** Selection is keyed to what is valid per role (`aria-current`, `aria-pressed`, `role=option/tab` + `aria-selected`), documented as a table |
| D04 | Selected state invisible on the inverted tone | ink ring on ink fill | **Fixed.** A gap of canvas between card and ring |
| D05 | Opening a "Markup" disclosure breaks reflow at ≤ 768px | `scrollWidth` went from 390 to 669 | **n/a** for this site's own markup panels; the accessibility gate now opens every `<details>` before testing 320px and 200% text, so it cannot come back |
| D06 | "Show boxes" replaced every focus ring | docs chrome, `@layer sheet` outranking the system | **n/a** (not ported). Lesson kept: docs CSS is linted like shipped CSS |
| D07 | Text at 200% clips content; list counts and the ghost title cut off | 7 cards clipped at 360px / 200% | **Fixed.** Every text slot wraps; rows and the foot wrap. The gate detects text cut off by a clipping frame at 320px and at 200% text |
| D08 | Real copy clipped: "Parallelogram", "Quadrilateral", `12,480` in narrow cards | cut by 22–92px | **Fixed.** Wrapping, hyphenation, a condensed hero, smaller figures in narrow cards; a "Real copy" specimen on the Card page, rendered by the gate |
| D09 | `.t-display` only fits one short word; overflows at 320px | "Settings" 485px in 358px | **Fixed.** The width axis steps condensed on phones, and a long word wraps. Measured at 320 / 390 / 768 |
| D10 | `<button class="card card--ghost">` collapses to 36px | a container has no intrinsic width | **Fixed.** Full width; plus a `min-inline-size` floor on every card |
| D11 | The study (now portrait) card has no accessibility contract | subject is `aria-hidden`; no control; "Tap to flip" is pointer-only | **Fixed.** A reveal pattern: a named subject, one button with a constant name and `aria-expanded`, the answer announced politely (`SG.toggle`) |
| D12 | "Gate 2 done", but most parts have no hover or pressed state | bar control, list rows, foot links, ghost | **Fixed.** Every pressable part answers to `--lift` / `--fill`; a parts × states table is in the docs; specs drive them |
| D13 | The States specimen makes fake states real tab stops; Collapse buttons do nothing | five duplicate "Shapes" links; no handler | **Fixed.** Specimens are `inert`; the collapse control is a working disclosure |
| D14 | Page chrome loses its checked state in forced colours | fill-only selection | **Fixed** for this site's controls (pressed = filled **and** a doubled frame; forced-colours outlines) |
| D15 | Forced-colours hover, focus and selected look alike; selected shifts layout | same 4px outline; border-width change | **Fixed.** Hover 2px outline, focus 4px with a gap, selected an inner frame line; nothing moves |
| D16 | Foot links are 30×24px against a 44px rule | measured | **Fixed.** 44px targets, negative margin keeps the foot height |
| D17 | Link card flickers on its right and bottom edge | the card moves away from a pointer resting 1px inside the edge | **Documented.** Interior positions are stable |
| D18 | Two hover rules not gated by `(hover: hover)`: sticky hover on touch | ghost flips, notch action fills | **Fixed**, and the lint now checks every `:hover` |
| D19 | Heading order, landmarks, skip target | axe | **Fixed** in these docs: axe is clean on every page in five appearances |
| D21 | The copy-paste Markup teaches patterns the docs forbid (icons without `aria-hidden`) | | **Fixed.** The lint fails a decorative icon without `aria-hidden` |
| D22 | Right-to-left breaks the notch and the stack; nothing mentions RTL | button on the wrong side; sheets spill the wrong way | **Fixed** (mirrored, with a spec). The wireframe meter's fill direction (`left: 0`) is to be checked when the real Meter lands |
| D23 | In soft corners the inset focus ring is partly clipped by the radius | | **Documented** |
| D24 | No `prefers-contrast`, `prefers-color-scheme` or forced-colour work beyond cards | a render with `prefers-contrast: more` was pixel-identical | **Fixed.** Dark, higher-contrast (OS and attribute, identical blocks, linted), reduced motion, forced colours |
| D25 | The sheet breaks its own rules | stack has rest shadows; the bar control is a square that acts | **Documented** as explicit exceptions in STYLE.md §1 |
| D26 | Disabled legibility; a dead `cursor: not-allowed` | | **Fixed** (dead declaration removed); disabled text stays exempt, placeholders use `--ink-mute` (4.5:1) |

### The card and the foundations

| # | Finding | Status |
| --- | --- | --- |
| C3 / DEF-1 | Dark mode cannot be switched on by changing `tokens/`: `base.css` pinned `color-scheme: light` in a higher layer | **Fixed.** `color-scheme: light dark` lives in the tokens; `data-theme` and the OS both work; tested in both |
| C4 / DEF-2 | The contrast gate passes vacuously: a colour it cannot parse is "skipped", and skipped is not failed | **Fixed.** `test:contrast` resolves every pair in a real browser; nothing is skipped; 5,400 checks |
| M1 | Fluid sizes built on `vw` do not fully scale with text-only zoom | **Documented.** Body sizes are rem-dominant and scale; the display sizes grow less than 2× at very wide viewports |
| M4 / DEF-5 | A card is a container, so it has no intrinsic width and collapses to its borders in a flex row, dialog or table cell | **Mitigated and documented.** A `min(10rem, 100%)` floor; it still wants a real width from its parent |
| M7 / DEF-13 | Forced colours delete the stack's sheets; the notch becomes a rectangle | **Fixed** for the stack (one outline says "a deck"); notch rectangle **documented** |
| M8 / DEF-11 | The `wire` layer sat above `components` and erased a disabled notch's silhouette | **Fixed.** `wire` sits below components; the disabled hatch is a card rule |
| M9 / DEF-14 | The notch mixes physical geometry and logical placement | **Fixed** (RTL mirror, spec) |
| M11 / DEF-17 | Archivo subset is Western-European Latin only; currency signs and Central-European names fall back to Helvetica | **Fixed** for latin-ext (₹ ₩ ₺ ₽ ₴, Polish, Turkish …) and Vietnamese, loaded only when used. Cyrillic, Greek, Arabic and CJK are not in the font: **documented** |
| M12 | Unprefixed global names (`--text-xs`, `--radius-1`, `.card`) collide with Tailwind v4 and other systems | **Documented** (a decision in STYLE.md). The layering recipe for adopting the guide in an app that already has a `.card` is on the Start page |
| M13 | Descendant-wide focus rules in the component layer outrank future components | **Fixed.** `:where()` keeps them at zero specificity |
| M14 | `--lift` / `--fill` inherit, so a button inside a hovered card would render pressed | **Fixed where it bites** (each pressable declares `--lift: 0; --fill: 0`) and written into CLAUDE.md. **Open**: no lint yet for a pressable that forgets |
| M15 / DEF-8 | The tone contract does not reach descendants (`--tone-*` are non-inheriting), so a tag or meter on a toned card cannot adapt | **Fixed.** A public `--surface-bg` / `--surface-ink` / `--surface-ink-soft` contract; focus and selection follow it |
| M16 | No platform-preference foundations | **Fixed** (see D24) plus `touch-action: manipulation` and text-size-adjust |
| m1 | "Below 18rem" is actually the card's content box (about 318px) | **Fixed** in the docs; container queries use range syntax |
| m2 | Row and ghost pad the `.card` itself, against "don't pad .card" | **Documented** as the exception |
| m3 | Ghost keyboard focus does not lift, though the docs say it does | **Fixed** |
| m4 / DEF-15 | Icon stroke is baked into masks, so it is not the frame weight (1px at 12px) | **Documented**: 2 units on a 24 grid, scales with size |
| m5 | A 5:7 card is 493px tall on a landscape phone | **Fixed** (capped to the viewport height) |
| m6 | Safari ignores `overflow-clip-margin`: a 2px dead band on link cards | **Documented; not verifiable here** |
| m13 | `::selection` is invisible on ink surfaces | **Fixed** (inverse of the surface) |
| m16 | The focus ring and the lift shadow merge into one band on a link card | **Fixed** (the ring sits a shadow's width further out) |
| DEF-4 | `hidden` ignored by every component (`display: flex` wins) | **Fixed.** `[hidden]` lives in the reset layer with `!important` |
| DEF-27 | No utilities layer; `.sr-only` loses to a component's `position` | **Fixed.** `sg.utilities` last |
| DEF-20 | Dashed means both "fill me" (ghost) and "can't press" (disabled) | **Documented**: disabled is dashed **and** hatched **and** faint; ghost is dashed at full ink |
| DEF-26 | Flashcards names in the shared foundation | **Fixed.** `study` renamed `portrait` (old names kept as aliases), product name out of files, `--ratio-portrait` |

### The gate and the process

| # | Finding | Status |
| --- | --- | --- |
| T05–T10 / DEF-3 | Regexes needed a trailing `;`; missed named colours, colours in `url()` and custom properties, blur behind a token, `filter: drop-shadow`, `font:` shorthand, rem borders, `50%` radii, radius outside components, motion outside components, phantom tokens from selector fragments | **Fixed.** The lint is rebuilt on a real CSS tokenizer. The tooling audit's own 146 violations and 36 legitimate snippets are replayed on every run (`npm run test:lint`): **82% of violations caught (was 44%), 33 of 33 legitimate snippets pass**. The 24 not covered are colour-contrast cases, which the browser test judges, and prose numbers |
| T12 | 0 of 19 accessibility-hygiene rules enforced | **Fixed** (outline removal, px fonts, blocked zoom, small targets, `overflow: hidden`, opacity on text, unlabeled icon buttons …) |
| T13 / T14 | The pair list is Card-specific and the gate cannot see render defects | **Fixed.** Pairs cover every role; tones are discovered from the CSS; `test:a11y` is the render gate |
| T04 | The gate silently depends on the app's `../styles.css` | **Fixed.** No reference outside the repo |
| T16 | The bundle is not self-contained: copying one CSS file alone loses the font | **Documented** on the Install page (keep `fonts/` beside the CSS) |
| T18 | `dist/` freshness unchecked | **Fixed.** `npm run build:check` |
| T19 | README, STYLE and the CSS disagree | **Fixed for names** (drift lint) and the version (one source). Prose numbers are **not** machine-checked |
| T23 | Version and status typed by hand in several places | **Partly.** The version has one source; the status table is still hand-kept in STYLE.md §6 |
| T15 / T24 / T25 | One global motion flag; STYLE.md does not scale with 40 elements; element dependencies and "freeze" are not modelled | **Partly.** `checkCss({ gates })` makes the flag a parameter; per-element detail lives in docs pages, not STYLE.md. **Open**: per-element gate headers, a generated status table, freeze as a content hash |
| T28 | Enforcement is voluntary | **Fixed.** `.github/workflows/ci.yml` runs the lint, the generated-files check, contrast, component specs and the accessibility gate on every pull request |

## What held up

Recorded so nobody re-litigates it: one font family with a real width axis (keywords compute exactly to 75 / 112.5 / 125%); the ink-on-tone contrast table (18.4 … 8.4) is accurate; the stretched link gives one tab stop and one name; 400% zoom and 320px reflow hold with the markup panels closed; WCAG 1.4.12 text spacing causes no clipping; every state was instant, as claimed; the four-layer notch draws exactly `--bw`; `dist/` is deterministic; the page works offline from `file://`.

## Unzip artefacts (not defects)

`check.mjs` failing on `.card-inner` / `.card-face` is caused by the app's `../styles.css` being absent (the dependency itself was the defect, fixed above). The README's "Migrating the app" section and commands written as `design/tools/check.mjs` belong to the app repo.

## Open, and needing a decision from you

1. **Square or soft corners.** Both work; the default is **square**, because your committed CSS is square. One line in `src/tokens/30-corners.css` changes it.
2. **Motion (gate 4) is open** for the guide so that hover, focus and the reveal can be real. Your sheet kept it closed to stay "wireframe". Closing it again is one flag.
3. **The scrim is the one translucency.** A modal backdrop and text over a photo cannot be flat. It is allowed, named, and contrast-tested.
4. **Names.** Your short names are canonical. No class prefix was added; `@layer` makes an app's own CSS win, and the Start page has the recipe for adopting the guide in an app that already has a `.card`.
5. **Not verified anywhere**: Safari / WebKit, Firefox, VoiceOver, TalkBack, NVDA, Windows High Contrast on a real machine, Android font scale, iOS Dynamic Type. Everything here is Chromium. The Accessibility, Manual testing page lists the pass to do on a real phone.
6. **Still open** (small): a lint for a pressable that forgets to reset `--lift` / `--fill`; per-element gate headers with a generated status table; prose numbers in docs are not checked against the CSS; magic numbers such as the 4.5rem notch are not tokenised; CI runs the quick accessibility pass on pull requests and the full one on main.

## An earlier draft

The first version of this repo was built before your original files were attached, from the reference screens alone. It used different names, Manrope as the typeface (which is on your own banned-default list), soft blurred shadows and three "surface styles". It was replaced rather than patched. The behaviours and keyboard specs that the first builders wrote were kept as reference and are being ported to your vocabulary; their styling was not.
