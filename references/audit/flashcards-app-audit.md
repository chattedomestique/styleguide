# Audit: chattedomestique/flashcards ("Shapes") as a de-facto style guide

Auditor: read-only analyst. Nothing under /home/user/styleguide was touched.
Repo: `.../scratchpad/refs/flashcards` (34 commits, 5 tracked files, 987 lines: styles.css 354, app.js 389, decks.js 115, README 80, index.html 49).
HEAD `styles.css` is byte-identical to `906258f` (diff empty).
Raw probe output and screenshots: `.../scratchpad/analysis/flashcards-work/` (probe.js, probe.json, contrast.py, cvd.py, shot-*.png).

---

## 1. Verdict in six lines

1. **HEAD is an app stylesheet, not a style guide.** The one moment this repo held a real design system was `c792cff` (styles.css 1,296 lines: type scale, 4px spacing, 4-step elevation, press physics, focus ring, skip link, toast, forced-colors, aria-disabled states). Commit `8b86da1` ("Strip it back to the shapes", -2,808 lines) deleted almost all of it. **Use `c792cff:styles.css` as the baseline for components and HEAD for tokens and motion.**
2. **The visual tokens are good** (palette, 4px border, 26px radius, hard offset shadow, dotted canvas, tone slots, motion tokens). Colour pairs I computed all clear AA for text. Keep them nearly verbatim (section 4).
3. **The accessibility model at HEAD is broken in ways axe cannot see.** axe-core 4.x reports 0 violations in light/dark and front/back (25 rules pass), yet nothing on the page is focusable, there is no `:focus-visible` rule, swipe has no tap alternative (WCAG 2.5.7 AA), and the front face is an empty `article` in the accessibility tree.
4. **The stated design principles are contradicted by the code** in four places (press invariant, "only transform/opacity", reduced-motion flip, "clip margin clears the shadow"). The generic guide must not copy the comments without copying working code.
5. **Cross-browser risk is concentrated on iOS** (the developer's probable platform, since the commits say "Reduce Motion"): `overflow-clip-margin` is unsupported in Safari/iOS Safari per MDN BCD, so the deck likely clips its own 10px hard shadow. I could not test WebKit (only Chromium is installed); this is inferred, not measured.
6. **No PWA pieces exist** (no manifest, service worker, apple-touch-icon, maskable icons). The "reusable PWA style guide" must ship a shell/manifest/icon recipe of its own; this repo gives nothing to generalise there.

---

## 2. Method and caveats

| What | How |
|---|---|
| Contrast | Python, WCAG formula exactly as specified (`contrast.py`). Rendered dot colours pixel-sampled from 2x screenshots to confirm computed values (light `#cbc1ae`, dark `#4d4a42`, match computed `#cbc1af`/`#4e4b43` within 1 LSB). |
| Runtime | Playwright 1.56.1 + Chromium 1194 (headless), 390x844, 360x640, 667x375; `file://` load. |
| axe-core | `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice` tag sets; light + dark, front + back. |
| AX tree | CDP `Accessibility.getFullAXTree`. |
| Fonts | CDP `CSS.getPlatformFontsForNode`. The machine has no Space Grotesk, no system-ui equivalent beyond DejaVu Sans / Liberation Sans. Text-overflow numbers therefore use **Liberation Sans (Arial metrics, close to Roboto/SF)** as the representative case and DejaVu Sans as a worst case. Treat them as indicative, not device-exact. |
| Motion | Computed `transform` sampled every 90 ms for the flip; per-frame `getBoundingClientRect` for the carousel move. |
| Forced colors | Playwright `forcedColors: 'active'` emulation (Canvas white, CanvasText black). |
| Not testable here | WebKit/iOS behaviour, `env(safe-area-inset-*)`, real screen readers (VoiceOver/NVDA/TalkBack), Dynamic Type. Flagged "unverified" where relevant. |

---

## 3. Measured contrast

Formula: L = 0.2126R + 0.7152G + 0.0722B on linearised sRGB; ratio = (L1+0.05)/(L2+0.05).

### 3.1 Text and structure

| Pair | Light | Dark | Needed | Result |
|---|---|---|---|---|
| `--ink` on `--paper` | `#14120e` / `#fffdf7` = **18.39** | `#fbf7ec` / `#2b271d` = **13.91** | 4.5 (text) | pass |
| `--ink` on `--canvas` | `#fff2dc` = **16.91** | `#1d1a13` = **16.22** | 4.5 | pass |
| `--ink-soft` on `--canvas` | `#5d5648` = **6.57** | `#b0a892` = **7.33** | 4.5 | pass (AA; AAA only in dark) |
| `--ink-soft` on `--paper` | **7.14** | **6.28** | 4.5 | pass |
| 4px `--ink` border vs `--canvas` (non-text) | 16.91 | 16.22 | 3.0 | pass |
| `--paper` vs `--canvas` (no border) | 1.087 | 1.166 | n/a | the border, not the fill, separates the card |
| `--dot` pattern vs `--canvas` | `#e4d7bb` = **1.29** | `#332e22` = **1.29** | none (decorative) | intentionally faint; `--ink` on `--dot` = 13.13 / 12.62, so text over the pattern stays safe |
| `--shadow` vs `--canvas` | `#14120e` = 16.91 | `#000` = **1.21** | none (decorative) | **dark-mode hard shadow is nearly invisible** (see D22) |

### 3.2 Ink on each tone (this is the table the generic guide needs)

`--on-tone` is `#14120e` in both schemes (styles.css:27, not overridden in dark).

| Slot | Light fill | `--ink`(light) on fill | Dark fill | `--ink`(dark, `#fbf7ec`) on fill | **`--on-tone` (`#14120e`) on dark fill** |
|---|---|---|---|---|---|
| t1 yellow | `#ffd400` | 13.07 | `#e8c200` | **1.61 FAIL** | 10.82 |
| t2 blue | `#6f9bff` | 6.96 | `#5a86f0` | **3.21 FAIL (text)** | 5.44 |
| t3 red | `#ff7a7a` | 7.41 | `#ef6a6a` | **2.83 FAIL** | 6.18 |
| t4 green | `#4fe0ae` | 11.23 | `#3fcb9b` | **1.92 FAIL** | 9.11 |
| t5 violet | `#c39bff` | 8.42 | `#ab85ec` | **2.69 FAIL** | 6.50 |
| t6 orange | `#ffab5e` | 10.01 | `#ec9750` | **2.15 FAIL** | 8.11 |

Reading: light `--ink` on tones is 6.96 to 13.07 (all pass). **In dark mode the theme `--ink` on tones fails on every slot (1.61 to 3.21)**; the fixed `--on-tone` passes on every slot (5.44 to 10.82). White on any tone fails everywhere (1.43 to 3.44). So the rule is: *text on a tone must use `--on-tone`, never `--ink`, never white*. HEAD defines `--on-tone` but no rule uses it (D17), which leaves the trap armed.

Tone fill vs surface (graphics, 1.4.11): light tone vs `--paper` is 1.41 to 2.64 (fails 3:1 alone) and dark tone vs `--paper` is 4.33 to 8.61. Shapes pass only because of the 3.5-unit `--ink` outline. **Rule: a tone fill never identifies a thing without an ink outline, label or icon.**

### 3.3 The position dots

| | Light | Dark |
|---|---|---|
| Inactive dot, `--ink` at `opacity: .22` over canvas | `#cbc1af`, **1.61:1** | `#4e4b43`, **1.99:1** |
| Active dot vs canvas | 16.91 | 16.22 |
| Opacity needed for 3:1 | >= 0.454 (0.45 gives 2.97) | >= 0.342 (0.30 gives 2.61, 0.40 gives 3.63) |
| `opacity: 0.5` would give | 3.43 | 4.92 |
| `--ink-soft` instead (no opacity) | 6.57 | 7.33 |

### 3.4 Can six tones carry meaning? No.

CIE76 dE between tones (Machado 2009 CVD matrices, severity 1.0; `cvd.py`):

| Condition | Worst pair, light | Worst pair, dark |
|---|---|---|
| normal vision | t2-t5 = 23.8 | t2-t5 = 21.9 |
| protanopia | **t2-t5 = 6.1** | **t2-t5 = 6.9** |
| deuteranopia | t2-t5 = 15.8 | t2-t5 = 16.6 |
| tritanopia | t1-t6 = 20.3 | t3-t6 = 21.9 |
| **lightness only (L\*)** | **t2-t3 = 2.0** | **t3-t5 = 1.5** |

All six tones sit at almost the same lightness, so they are purely categorical decoration. `c792cff` aliased `--good: var(--t4)` and `--bad: var(--t3)` (c792cff:styles.css:40-41); that pairing is distinguishable by hue for most viewers but not by lightness. **Status colours must always be paired with an icon or word.**

---

## 4. Design decisions worth generalising (mapped to generic names)

### 4.1 Colour tokens

| Current (file:line) | Value L / D | Generic name | Note |
|---|---|---|---|
| `--canvas` (21, 72) | `#fff2dc` / `#1d1a13` | `--color-canvas` | page background |
| `--paper` (22, 73) | `#fffdf7` / `#2b271d` | `--color-surface` | raised surface (cards, sheets) |
| `--ink` (23, 74) | `#14120e` / `#fbf7ec` | `--color-ink` | primary text, borders, focus ring |
| `--ink-soft` (24, 75) | `#5d5648` / `#b0a892` | `--color-ink-soft` | secondary text (>= 6.28:1 everywhere) |
| `--shadow` (25, 76) | `#14120e` / `#000` | `--color-shadow` | hard shadow; needs a dark-mode rethink (D22) |
| `--dot` (26, 77) | `#e4d7bb` / `#332e22` | `--color-dot` | canvas pattern, decorative only |
| `--on-tone` (27) | `#14120e` both | `--color-on-tone` | the only legal text colour on `--tone-*` |
| `--t1`..`--t6` (29-34, 78-83) | see 3.2 | `--tone-1`..`--tone-6` + semantic aliases | aliases (accent, info, danger, success, ...) defined one level up; slot numbers stay stable |
| `color-scheme: light dark` (19) + `<meta name=color-scheme>` (index.html:24) | | keep both | prevents white flash, themes scrollbars/form controls |

Suggested tone roles (proposal, not in repo): t1 accent/primary, t2 info, t3 danger, t4 success, t5 highlight, t6 warning. Keep the numeric slots as the stable API so an app can re-hue without renaming.

### 4.2 Form tokens

| Current | Generic | Value |
|---|---|---|
| `--bw` (36) | `--border-width` | 4px. `c792cff` also had 2px/3px steps (`--bw-1..3`); keep 2/3/4 as a scale |
| `--radius` (37) | `--radius-lg` | 26px. `c792cff` had 8/14/22 (`--r-sm/md/lg`). Pick one scale: proposal 8 / 14 / 26 / 999 |
| `box-shadow: 10px 10px 0` (237) | `--elevation-4` | and `c792cff` steps e1 2px, e2 4px, e3 6px, e4 10px |
| `4px 4px 0` pressed (242) | `--elevation-4-pressed` | see D18 before copying |
| radial dot pattern (104-106) | `--pattern-dot` (size 22px, radius 1.3/1.7px, offset -11px) | offset of half the tile centres the dot on the tile edge so seams never show |

### 4.3 Motion tokens

| Current | Value | Generic | Verdict |
|---|---|---|---|
| `--dur-press` (42) | 130ms | `--dur-instant` | keep |
| `--dur-move` (41) | 520ms | `--dur-travel` | keep, but see D21 (JS duplicates it as 700) |
| `--dur-flip` (40) | 640ms | `--dur-flip` | component-level choreography token |
| (old) `--dur-1..4` | 110/200/320/440 | `--dur-quick/base/slow` | restore; HEAD has 320ms and 380ms hard-coded (308, 346) |
| `--ease-enter` (44) | `cubic-bezier(.22,1,.36,1)` | `--ease-out` | keep |
| `--ease-exit` (45) | `cubic-bezier(.4,0,.7,.2)` | `--ease-in` | unused at HEAD; keep as token, add a use |
| `--ease-settle` (46, 54-66) | spring `linear()` with cubic-bezier fallback | `--ease-spring` | keep the `@supports (transition-timing-function: linear(0,1))` pattern. `linear()` support: Chrome 113, Firefox 112, Safari 17.2 (MDN BCD), so the fallback is nearly academic in 2026 but costs nothing |
| `--ease-flip` (47) | `cubic-bezier(.83,0,.17,1)` | `--ease-in-out-strong` | keep; never use a spring on rotation |
| `--gap` (43) | 28px | `--strip-gap` | rename: `--gap` is too generic a name to own |
| `--offset`, `--dx` | JS-set | `--_offset`, `--_dx` | private component props |

### 4.4 Layout / platform primitives

| Current | Generic |
|---|---|
| `height:100vh; height:100svh` (132-133) | `--app-height` pair; fallback first, `svh` second. Correct pattern |
| `padding: max(24px, env(safe-area-inset-top)) 22px max(24px, env(...bottom))` (136-137) | `--safe-top/right/bottom/left` tokens at `:root`, applied to **all four** sides (D12) |
| `max-width: 520px; margin-inline:auto` (134-135) | `--container-sm` |
| `@media (max-height: 620px)` (319) | "short viewport" rule; document as `--bp-short` |
| `.sr-only` via `clip-path: inset(50%)` (115-123) | `.sr-only` / `.visually-hidden`, keep |
| `touch-action`, `overscroll-behavior: none`, `-webkit-tap-highlight-color: transparent`, `user-select:none` | "gesture surface" recipe (with the D10 fix) |
| `text-wrap: balance` (280) | utility for display text |
| `clamp(2.2rem, 11vw, 3.4rem)` (275) | `--fs-display` (fix per D11) |
| `.app` / `.deck` / `.card` / `.card-inner` / `.card-face` / `.dots` | `.app-shell` / `.carousel` / `.flip-card` / `.flip-card__inner` / `.flip-card__face` / `.pager-dots` |
| `data-face`, `data-far`, `data-near`, `data-on`, `.is-pressed`, `.is-dragging`, `.is-booting` | state vocabulary: data-attributes for state, `is-*` for transient interaction. Keep |

### 4.5 Patterns that generalise beyond this app

* **Render once, move by attribute.** Every card built once; navigation only rewrites `--offset`. Generic rule: never re-render a node that is mid-transition.
* **Strip layout**: card N at `calc(N*100% + N*gap + dx)`, one transform for both directions. Wrap via `offsetOf()` shortest signed distance; `data-far` turns the transition off before long-way-round jumps; `is-booting` suppresses first-paint fly-in.
* **3D flip recipe**: `perspective` on the flip's *direct parent*; `transform-style: preserve-3d` on the inner; `backface-visibility: hidden` on both faces; shadow on a pseudo-element of the parent (not the faces) so the light does not swing 180 degrees. Hand-over at exactly 90 degrees (verified by the author by pixel count; I confirmed monotone rotation 0 to 180 in both motion modes).
* **Inert as a state**: off-screen cards and the hidden face get `inert`, so the answer cannot be read before the flip.
* **Optical correction for illustration sets**: per-shape `scale/dx/dy` measured by raster area, with stroke divided by scale so outline weight is constant. Generic idea: illustration/icon sets declare an `optical` adjustment, not the drawing.
* **Tone by data, not by JS string**: app.js:65 does `"var(--t" + shape.tone + ")"`; generic version should be `data-tone="3"` with `[data-tone="3"]{--tone: var(--tone-3)}` so tokens stay greppable and themeable in CSS.
* **Live region announce**: clear then set on next frame so identical strings re-announce (app.js:161-166). Keep.
* **Comments that record the failure they prevent** (e.g. styles.css:148-161, 185-188, 262-265). This is the best documentation habit in the repo. Keep the habit; fix the comments that no longer match code (D18, D19).

### 4.6 What `c792cff` had that the generic guide should reinstate

(References are to `git show c792cff:styles.css`.)

* Type scale 1.25 on 16px: `--fs-xs .75rem` ... `--fs-3xl 2.441rem` (lines 44-50); `--font-display`, `--font-mono`; body `line-height: 1.5`.
* 4px spacing rhythm `--s1..--s6` = 4/8/12/16/24/32 (lines 57-62).
* Elevation `--e1..--e4` = 2/4/6/10px and the two rules in its header: *elevation scales with weight*; *the light source never moves* (rest 4+0, hover 6-2, press 1+3, far edge constant at 4).
* `.press` base with `@media (hover:hover)` gating, `:disabled` 0.45 opacity, `.is-pressed` mirror class.
* **Focus ring**: `:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px }` = 16.9 / 16.2:1 against canvas, 3px >= the 2px of SC 2.4.13 (AAA, cheap to meet). Plus `[tabindex="-1"]:focus{outline:none}` for script-moved focus.
* **Skip link** with safe-area offset.
* `[hidden]{display:none!important}` (so `display:flex` on a class cannot defeat `hidden`).
* `aria-disabled` + `pointer-events:none` for locked-but-readable options instead of `:disabled`.
* Touch targets: icon-btn 44x44, btn 52, btn-lg 60, pill 40; the `max-height:430px` block shrinks to 38/46 "while keeping every target above the 24px minimum" (WCAG 2.5.8).
* Toast with `transform` entrance, `meter`, `score-ring`, `kbd`, `.notice`, chips: component ideas, not tokens.

---

## 5. Defect register

Severity: **critical** = blocks a WCAG 2.2 A/AA criterion or makes the control unusable for a class of user; **major** = real user-facing failure or likely cross-browser break; **minor** = hygiene/drift.
"Measured" = observed in Chromium; "inferred" = from spec/BCD/code reading.

### 5.1 Accessibility and interaction

**D1 critical. Nothing is focusable; the flip has no role, name or keyboard path for assistive tech.**
* Evidence (measured): `Tab` x4 leaves `document.activeElement` on `BODY`; `querySelectorAll('a[href],button,input,select,textarea,[tabindex]')` returns `[]`. AX tree of the front face: `main`, `status`, `heading "Shapes"`, `article name=""`; the drawing is `aria-hidden` (app.js:40). Live region is empty until the first navigation (index.html:44), so on load a screen-reader user hears only "Shapes".
* Where: app.js:73 (`document.createElement("article")`), app.js:302-331 and :374 (`document.addEventListener("keydown")`), index.html:39.
* Why it matters: WCAG 2.1.1 Keyboard and 4.1.2 Name, Role, Value (both A). Activation depends on a document-level key listener that NVDA/JAWS browse mode consumes (arrows and Space) and that VoiceOver's rotor/swipe model never targets. **axe-core cannot detect this (0 violations)**.
* Fix: make the flip surface a real control, e.g. `<button type="button" class="flip-card__face" aria-pressed|aria-expanded>` (or `role="button" tabindex="0"`) with an accessible name that does not leak the answer ("Shape 3 of 12. Activate to reveal the name."); put the pointer handlers on it; `role="region" aria-roledescription="carousel" aria-label="Shapes"` on the deck and `role="group" aria-roledescription="slide" aria-label="3 of 12"` per slide (WAI-ARIA APG carousel pattern); announce the current slide on load.

**D2 critical. Swipe has no single-pointer alternative (WCAG 2.5.7 AA, 2.5.1 A).**
* Evidence: commit `5555c91` "The on-screen arrows are gone"; README:17 "Touch only, and there is nothing on screen but the card". The only non-drag route is the keyboard. W3C Understanding 2.5.7: keyboard equivalence "does not automatically meet this success criterion, unless that equivalent keyboard operation also provides controls that can be clicked or tapped"; its own carousel example pairs dragging with forward/back buttons. 2.5.1 names swiping/flicking as a path-based gesture.
* Where: app.js:222-298 (drag is the only pointer navigation).
* Fix: visible Previous/Next buttons, >= 44x44 (WCAG minimum is 24, Apple 44pt, Material 48dp), in the `.app` flow; keep swipe as an enhancement. The generic guide should make this a rule: **every gesture ships with a tappable equivalent.**

**D3 major. Global key handler steals activation from other controls; no `event.repeat` guard on flip.**
* Evidence (measured): added a `<button>`, focused it, pressed Enter then Space: `clicks = 0`, card flipped twice (front to back to front). The handler calls `event.preventDefault()` on Enter/Space for anything (app.js:319-323). Held Space/Enter: there is no `event.repeat` check anywhere in app.js (code reading, not exercised), so a held key should flip at the OS auto-repeat rate (typically 30 ms or so) against a 640 ms transition. Held-arrow scrubbing was intentional in `c792cff` ("Arrows may repeat — scrubbing is harmless", c792cff:app.js:1217-1219) but the Space/Enter guard was dropped in the rewrite. (I also confirmed 25 synthetic repeat ArrowRight events advance 25 cards, each announced.)
* Fix: listen on the widget (focused element), not `document`; early-return when `event.target.closest('button, a, input, select, textarea, [contenteditable]')` is a different control; `if (event.repeat) return` for flip/activate keys; debounce live announcements while scrubbing.

**D4 major. No state styles at all: no `:focus-visible`, `:hover`, `:disabled`, loading, empty or error.**
* Evidence: grep for `focus|:hover|hover:|tabindex|disabled` in styles.css/index.html finds only `.card:active` (styles.css:192) and `focusable="false"` (app.js:41). The earlier build had a full set (c792cff:styles.css lines 164-211 for `[hidden]`, `:focus-visible`, skip link; 295-345 for `.press`/`.icon-btn`); `8b86da1` removed them with the components.
* Fix: restore the focus ring (ink, 3px, offset 3px, plus a forced-colors `Highlight` variant), gated hover (`@media (hover:hover)`), disabled/aria-disabled, and an error/empty pattern (app.js:355-356 writes an unstyled string into `.deck` with no `role="alert"`).

**D5 major. Position dots fail non-text contrast and disappear in landscape.**
* Evidence (measured + pixel-verified): inactive dots 1.61:1 light, 1.99:1 dark (styles.css:306 `opacity: 0.22`), below the 3:1 of SC 1.4.11 if they are treated as information (they are the only visible position cue). `aria-hidden="true"` (index.html:41) is correct only if the live region supplies the same information, but the live region speaks only after a navigation. At `max-height: 620px` the dots are `display:none` (styles.css:326-328), so landscape phones lose position entirely.
* Fix: replace opacity with `--color-ink-soft` (6.57 / 7.33) for inactive and keep size + fill for active (so state is not colour-only: 7px vs 11.9px, measured); keep them visible in short viewports (move beside the card) or show "3 / 12" text; do not make them interactive unless the target is >= 24x24 (SC 2.5.8; 7px + 7px gap fails).

**D6 major. Forced-colors / high-contrast coverage is wrong.**
* Evidence (measured, Playwright forced-colors): both dots compute `background-color: rgb(255,255,255)` on a `rgb(255,255,255)` Canvas, so **the dots vanish** (shot-forced.png shows none); hard shadow is gone (expected, `box-shadow` is stripped); SVG `fill rgb(255,212,0)` and `stroke rgb(20,18,14)` are **not** forced, so on a dark forced palette the `#14120e` outline would sit on a black Canvas face. The only forced-colors rule (styles.css:350-354, `.card-face{border-color:CanvasText}`) is redundant: the UA already forces `border-color` (computed `rgb(0,0,0)` versus authored `#14120e`).
* No `prefers-contrast` block exists.
* Fix: in `@media (forced-colors:active)`: dots get `border:1px solid CanvasText`, inactive `background:Canvas`, active `background:Highlight` (or `forced-color-adjust:none` with system colours); shape art `stroke: CanvasText`; focus ring `outline-color: Highlight`; keep borders real (not shadows) so components keep an edge. Add `@media (prefers-contrast: more)` token overrides (ink-soft becomes ink; drop the dot pattern; shadow pure black/white).

**D7 major (inferred). `overflow-clip-margin` is unsupported in Safari and iOS Safari, so the deck probably clips its own hard shadow there.**
* Evidence: MDN BCD `css/properties/overflow-clip-margin`: Chrome 90, Firefox 102, **Safari: not supported, Safari iOS: not supported**; "not Baseline". styles.css:159-160 relies on `overflow: clip; overflow-clip-margin: 12px` to show the card's 10px shadow. The `padding-bottom: 14px` at :154 is described as "room for the hard shadow" but does nothing: measured `.deck` rect == `.card` rect (22, 156.3, 346 x 484.4), because the absolutely positioned card uses `inset:0` against the padding box.
* Impact: on iOS the signature offset shadow is likely cut off on the right and bottom. I could not run WebKit; the authors' own verification was Chromium-only.
* Fix: `clip-path: inset(0 var(--clip-bleed) var(--clip-bleed) 0)` on the deck (widely supported; `.deck` is an ancestor of `.card`, not between `.card` and `.card-inner`, so it cannot flatten the 3D context), or clip at the viewport (`overflow-x: clip` on `.app` with real padding). Remove the dead `padding-bottom`. Add WebKit to the test matrix.

**D8 major. Spring overshoot exceeds the clip window, cutting the incoming card.**
* Evidence (measured, 390x844): during a move the incoming card's left edge reaches **-29.7 px** relative to the deck's left edge (sampled per frame; the trough is around t = 240 ms), but the clip margin is -12 px, so ~18 px of its border/corner is sliced for ~150 ms. Cause: `--ease-settle` peaks at 1.082 (styles.css:56, `linear(... 1.082 40% ...)`) over a travel of `100% + 28px` = 374 px, i.e. 30 px overshoot. Under reduced motion the easing has no overshoot (styles.css:346), so only full-motion users see it.
* Fix: cap overshoot so `peak - 1 <= clip-bleed / travel` (<= 1.03 here), or clip at the viewport edge. Derive `--clip-bleed` from tokens (`calc(var(--elevation-offset) + 2px)`) and document the coupling `gap > bleed`.

**D9 major (policy). The 3D flip and the full-width slide both run under `prefers-reduced-motion: reduce`.**
* Evidence (measured): with `reducedMotion: 'reduce'`, `.card-inner` still passes through `matrix3d(... -0.877 ... 0.481)` to `matrix3d(-1 ...)` (probe.json `flip_reduce`), identical in shape to no-preference; the slide still travels `100%+28px`, only faster and without overshoot (styles.css:345-347: 380 ms).
* Standards: WCAG 2.3.3 Animation from Interactions is **AAA** ("can be disabled, unless essential"), so this is not an AA failure; but the flip is not "essential" (the information is identical without rotation). Apple's Reduced Motion evaluation criteria list spinning, multi-axis motion and scaling as things to "disable or change", and say that when motion carries meaning you should keep an alternative "such as a dissolve, highlight fade, or color shift", not remove it. web.dev frames the query as "reduce", and the MDN/CSS definition is "minimize movement ... preferably to the point where all non-essential movement is removed".
* The author's philosophy ("gentler, not instant", styles.css:12-15; README:41-45) is right and the `0.01ms !important` snippet really did cause jump cuts (commit `9c9f5af`). But the failure was the *implementation of the alternative* (both faces cross-fading simultaneously gave front 0.40 / back 0.60 at mid-flip), and `9c9f5af` had already fixed it with a **sequenced dissolve** ("zero frames with both above 0.15"). `2c02220` then deleted that working answer and kept the vestibular-provoking rotation because "it is the point of the app".
* Fix for the generic guide: (a) default under `reduce`: sequenced dissolve (outgoing face to 0 over ~120 ms, then incoming to 1), carousel slide replaced by a short fade or a travel of <= ~24 px; (b) honour the developer's explicit preference with an **in-app motion setting** (`:root[data-motion="full"]`, persisted in localStorage with try/catch, default = follow the OS). That satisfies 2.3.3 (user can disable) and lets a person who has Reduce Motion on still opt in deliberately. Expose as tokens: `--motion-scale`, per-component `reduced` variants.

**D10 medium. `touch-action: none` disables pinch-zoom over half the screen.**
* Evidence (measured): computed `touch-action: none` on `.card` (styles.css:182), `auto` on `.deck`/`body`. The card is 346x484 of a 390x844 viewport (51%). The viewport meta itself is fine (no `user-scalable=no`).
* History: `5555c91` moved `pan-y` to `none` to remove the browser's "wait to decide" delay. `pinch-zoom` (value, not `manipulation`) removes the wait too, because it leaves the browser nothing to arbitrate except zoom.
* Fix: `touch-action: pinch-zoom` on the gesture container (`.deck`), not on every card (touches that land on the 28px gap or `pointer-events:none` cards currently get `auto`). Test on iOS Safari (inferred, not verified).

**D11 medium. Text can overflow the face at large text sizes.**
* Evidence (measured, 360x640, root font 32px = 200%): with Liberation Sans, "Rectangle" is **317 px** wide in a **256 px** content box (face 316 px); Diamond 286, Pentagon 304, Hexagon 283, Octagon 271, Crescent 284 also exceed it. With the wider DejaVu Sans, 8 of 12 words overflow (up to 378 px). At 100% all fit (max 178 px Liberation, 213 DejaVu). Under the WCAG 1.4.12 spacing override (line-height 1.5, letter-spacing .12em, word-spacing .16em) Liberation fits (232 px), DejaVu overflows once (Rectangle 266 px). Cause: styles.css:275 `clamp(2.2rem, 11vw, 3.4rem)` has a 2.2rem floor that doubles at 200% while the box does not; no `overflow-wrap`, no `hyphens`, `.card-face` has no overflow handling.
* SC: 1.4.4 Resize Text, 1.4.10 Reflow.
* Fix: `overflow-wrap:anywhere; hyphens:auto` on display text; size by container (`container-type:inline-size` on `.card-face`, font-size in `cqi`; `.card-face` is a leaf under the preserve-3d parent so it does not break the flip, but re-run the README's flatness test); back face `overflow-y:auto` as in `c792cff` (`.card-back`). Note `clamp(min, vw, max)` passes zoom only if max >= ~2.5x min when vw dominates; here max/min = 1.55 and it passes browser zoom only because of the cap, so document the rule.

**D12 medium (inferred). Safe-area insets handled only top/bottom.**
* Evidence: index.html:7 `viewport-fit=cover`, but styles.css:136-137 uses a constant `22px` for left/right, and the 620px block (321-323) also only touches top/bottom. In landscape on a notched iPhone, side insets are ~47-59px and the card would sit under the notch/rounded corner. `c792cff` padded all four sides.
* Fix: `padding-inline: max(var(--space-5), env(safe-area-inset-left) , ...)` per side; expose `--safe-*` tokens. (Cannot be emulated in Chromium; unverified on device.)

**D13 minor. Semantics of slides and feedback.**
* 12 `<article>` elements used as slides (app.js:73); APG says `role="group" aria-roledescription="slide"`. `aria-hidden` + `inert` are both set (app.js:141-142); `inert` alone is enough in 2026 engines (Chrome 102, Safari 15.5, Firefox 112). The front face has no text alternative by design, but nothing records that decision; for a generic system require either a description that does not leak the answer or an explicit "visual-only" flag.

### 5.2 Design-system hygiene

**D14 medium. A font that is never loaded.**
* styles.css:100-101 names "Space Grotesk"; there is no `@font-face` and no `<link>` (the `c792cff` index.html had a Google Fonts link; `8b86da1` removed it). CDP `getPlatformFontsForNode`: rendered family `DejaVu Sans`, `isCustomFont:false`. In the wild the stack resolves inconsistently: iOS `ui-rounded` (SF Rounded), Android falls through "Avenir Next" to `system-ui` (Roboto).
* Gotcha: `document.fonts.check('16px "Space Grotesk"')` returned `true` with `document.fonts.size === 0`; `check()` is true when nothing needs loading, so it is not a load test.
* Fix: self-host a variable woff2 subset (no third-party request from a PWA), `font-display: swap`, `size-adjust` fallback metrics, and define `--font-sans`, `--font-mono` tokens. The scratchpad already contains candidate woff2 files from other agents (archivo-latin, intertight-latin).

**D15 medium. No PWA layer.** `git ls-files` = README, app.js, decks.js, index.html, styles.css. Missing: `manifest.webmanifest` (name, short_name, id, start_url, scope, display, orientation, theme_color, background_color, icons 192/512 + maskable), service worker/offline, `apple-touch-icon` (180x180 PNG; iOS ignores the SVG data-URI favicon at index.html:25-28 for the home-screen icon), `apple-mobile-web-app-capable`/`mobile-web-app-capable`, status-bar style, splash. `theme-color` is hard-coded twice in HTML (index.html:16, 21) and in CSS (styles.css:21, 72); those will drift. The favicon hard-codes `#ffd400`/`#14120e`. Fix: generate all of these from tokens in the guide's build/check script.

**D16 minor. Magic numbers that should be tokens** (outside `:root`, ~20 literals):
| Line | Literal | Should be |
|---|---|---|
| 131 | `clamp(20px, 5vh, 40px)` | `--space-*` fluid step (uses `vh`, everything else uses `svh`) |
| 134 | `520px` | `--container-sm` |
| 136-137 | `24px`, `22px` | `--space-5`, `--space-4`+ (and all four safe-area sides) |
| 154 | `14px` | delete (dead, D7) |
| 160 | `12px` | `--clip-bleed = elevation offset + 2px` |
| 172 | `0px` default of `--dx` | `--_dx` |
| 189 | `perspective: 1400px` | `--perspective` (~2.8x card width; document ratio) |
| 237 / 242 | `10px 10px 0` / `4px 4px 0` | `--elevation-4` / `--elevation-4-pressed` |
| 250 | `padding: 26px` (same number as `--radius`, coincidence) | `--space-*` |
| 267 | `min(78%, 300px)` | `--media-max` |
| 275 | `clamp(2.2rem, 11vw, 3.4rem)` | `--fs-display` |
| 294-303 | `7px` dots, gap | `--dot-size` |
| 306 / 314 | `0.22`, `scale(1.7)` | `--dot-idle-color` / `--dot-active-scale` |
| 308-309 | `320ms` | `--dur-base` |
| 319 | `620px` | `--bp-short` |
| 346 | `380ms` | `--dur-travel-reduced` |
| app.js:17-22 | SLOP 4, COMMIT_RATIO .13, COMMIT_MAX 48, FLICK .15, FLICK_MIN 10, FACE_RESET_MS 700, 320 fallback width, .6 diagonal ratio | `data-*` attrs or a config object at top of a module; FACE_RESET_MS must derive from `--dur-move` |

**D17 minor. Dead or orphaned tokens.** Never referenced by a rule: `--ink-soft` (24, 75; only defined), `--on-tone` (27), `--ease-exit` (45). `--t1..--t6` are consumed only by JS string concatenation (app.js:65), invisible to grep and to any token linter. The two that matter for accessibility (`--on-tone`, `--ink-soft`) are exactly the ones that lost their consumers in the strip, leaving `--ink` as the only text colour, which fails on every dark-mode tone (section 3.2).

**D18 minor. The stated physics contradict the code.**
* styles.css:285-286 (orphan comment under a "controls" banner with no controls below it): "Rest 5+0, hover 7-2, press 1+4 — the shadow's far edge never moves". There is no `.btn`/`.press` any more, and the numbers differ from the original ("Rest 4+0, hover 6-2, press 1+3").
* The flagship card breaks the rule it claims: `.card.is-pressed::after` shrinks the shadow 10px to 4px (styles.css:241-243) while the card does not translate, so the far edge moves 6px and the press reads as "the shadow retreats" rather than "the card sinks". The previous build also translated `.card-inner` by 3px (c792cff) but that composes badly with `rotateY(180deg)`, which is why it needed two rules.
* Header rule 1 (styles.css:6): "ONLY TRANSFORM AND OPACITY ANIMATE" but styles.css:238 transitions `box-shadow` (paint, not composited).
* Fix: use the individual `translate` property (Baseline 2022) for press so it never composes with `transform: rotateY()`, and express the invariant as a calc: `translate = pressed-offset`, `shadow offset = rest - pressed`. Either allow `box-shadow` transitions in the rule or animate a transform on the shadow layer.

**D19 minor. Docs disagree with each other.** CSS header lists "two rules" (only transform/opacity; reduced = gentler) while README lists a different pair (one horizontal strip; reduced = gentler). README:17 "Touch only" vs README:25 keyboard support. Commit body claims "105 checks across five suites" and "fifteen viewports"; **no test file exists in any of the 34 commits** (`git log --all --name-only` = only the 5 files), so the verification is unreproducible. No LICENSE, package.json, CI.

**D20 minor. Dead code.**
* styles.css:154 `padding-bottom:14px` (measured no effect).
* app.js:333-348 `bindPress()` targets `.btn`, which exists nowhere in HTML/CSS.
* app.js:212/236/250 `drag.moved` written, never read.
* app.js:180 `return true` in `go()` unused.
* app.js:379-381 the `reduceMotion` change listener calls `place()`, which does not depend on the motion setting; the comment ("a card mid-flight ... should land under the new rules") describes behaviour that does not happen.
* app.js:227 `closest(".deck")` guard is always true for a listener bound to `.deck`.
* styles.css:350-354 forced-colors rule (redundant, D6).

**D21 minor. JS and CSS share timing by coincidence.** `FACE_RESET_MS = 700` (app.js:22) must exceed `--dur-move` 520 ms (styles.css:41) and the 380 ms reduced value, but nothing enforces it; changing the token silently breaks the "reset only when off-screen" guarantee. Read `getComputedStyle(root).getPropertyValue('--dur-move')` (or listen for `transitionend` with a timer fallback). Unscoped custom properties `--gap`, `--offset`, `--dx` could collide in a larger system.

**D22 minor. Dark-mode hard shadow is barely visible.** `--shadow:#000` on `--canvas:#1d1a13` = 1.21:1 (styles.css:76); in `shot-dark-front.png` the 10px offset reads as a faint darker edge. Decorative, so not a WCAG issue, but the neo-brutalist identity depends on it. Candidate dark tokens, measured against canvas: `#000` 1.21; `--ink-soft` `#b0a892` 7.33; `--ink` `#fbf7ec` 16.22 (an inverted "1-bit" shadow). Decide by eye; keep the light-mode shadow as is.

**D23 minor. Theming structure.** Dark mode duplicates the whole token block (styles.css:70-85) and offers no manual override. `light-dark()` is Baseline (Chrome 123, Firefox 120, Safari 17.5) and lets each token be declared once (`--color-canvas: light-dark(#fff2dc, #1d1a13)`) with `color-scheme` switched by `:root[data-theme]`. Note it cannot hold the `@supports linear()` override, so motion tokens stay separate.

**D24 minor. Landscape.** With `width:100%` and `max-height:100%`, `aspect-ratio:5/7` is silently dropped: at 667x375 the card is 476x347 (1.37:1) and the dots are hidden (measured). Acceptable, but undocumented; say so in the guide and decide whether landscape keeps the card ratio.

**D25 minor. Small UX/CSS notes.** `cursor:grab` on a tap-to-flip surface (178) sends a drag signal for a tap action. `user-select:none` is applied to the whole card (183-184), which blocks selecting the shape name; limit it to the drag handle. `-webkit-tap-highlight-color: transparent` (108) is acceptable only because `.is-pressed` exists. No unprefixed `text-size-adjust` (94). No `line-height` on body (HEAD has none; `c792cff` had 1.5). Error state writes plain text (app.js:355-356) and there is no `<noscript>`.

### 5.3 Process findings that affect how the generic guide should be built

* The design-system layer was built (`3cc4ec5`, +2,492/-356) and then deleted (`8b86da1`, -2,808) when the app's scope shrank. **A reusable guide must live outside any one app and must not be edited down to whatever the current app uses.**
* 25 of the 34 commits (11 on 2026-02-07, 14 on 2026-02-08) iterated on loader/flip easing by eye, before the September rebuild (8 commits on 09-20, 1 on 09-21); the flip was "working" only in the sense of a CSS transform that squashed horizontally (perspective on the wrong element, fixed in `2c02220`). The README's flatness rule (no overflow/filter/mask/opacity/containment between `.card` and `.card-inner`) and the 90-degree hand-over are hard-won knowledge. Put them in a component doc and enforce with a test.
* The last eight commits are four duplicated pairs (branch commit + squash merge `(#n)`): cosmetic.
* The audit-era commit message (`c792cff`) itemises seven accessibility fixes (aria-label overriding contents, both faces in the tree at once, aria-disabled vs disabled, focus-ring halo overridden by box-shadow, tabindex=-1 on a real button, swipe-badge contrast 1.56:1 in dark, speech priming) plus five correctness and six layout fixes. Those are a ready-made **component a11y checklist**; most of the fixed code no longer exists at HEAD.

---

## 6. What is genuinely good (preserve)

Copy these verbatim or near-verbatim into the generic guide.

1. **Token values** for canvas/paper/ink/ink-soft/dot in both schemes (section 3: 13.9 to 18.4 primary, 6.3 to 7.3 secondary).
2. **`--on-tone` does not invert** and the mid-bright dark tones (`#e8c200 #5a86f0 #ef6a6a #3fcb9b #ab85ec #ec9750`), giving 5.44 to 10.82:1 with `#14120e`. The comment at c792cff:styles.css:28-30 states the rule correctly ("white on mint is 1.8:1"; I measure 2.05 in dark, 1.67 light).
3. **4px border, 26px radius, hard offset shadow on a pseudo-element of the parent.** The reasoning at styles.css:229-230 ("on a face it rotates away ... light source swings 180 degrees") is correct and non-obvious.
4. **Dotted canvas**: `radial-gradient(var(--dot) 1.3px, transparent 1.7px)` on 22px with -11px offset. 1.29:1 against canvas so it cannot hurt text; automatically disappears in forced-colors.
5. **Motion vocabulary**: out-quint enter, sharp exit, strong in-out flip, spring via `linear()` with an `@supports` cubic-bezier fallback (styles.css:50-68). Pair with the bound on overshoot (D8).
6. **Transform/opacity discipline and render-once strips**: `data-far` flush before wrap, `is-booting` first-paint guard, `void deck.offsetWidth` flush (app.js:134). Also `.deck.is-dragging .card{transition:none}` so the drag tracks 1:1.
7. **The 3D flip recipe** (perspective on the direct parent; preserve-3d on the inner; backface-visibility hidden; no spring on rotation; 640 ms; hand-over at 90 degrees). I confirmed smooth monotone 0 to 180 degrees in both motion modes.
8. **"Reduced motion means gentler, not instant"** as a written principle, with the diagnosis of the `0.01ms !important` jump-cut failure. Keep the principle; fix the flip policy (D9).
9. **`inert` on the hidden face and off-screen cards** so the answer is not readable early; live region with clear-then-set on the next frame.
10. **Platform basics done right**: `viewport-fit=cover` with no zoom lock; `100vh` then `100svh`; `max(24px, env(safe-area-inset-*))`; `overscroll-behavior: none`; dual `theme-color` with `media`; `color-scheme` in both meta and CSS; `lang="en"`; `text-wrap: balance`; `.sr-only` with `clip-path: inset(50%)`.
11. **Gesture handling**: primary-pointer only, left-button only, slop 4px, 0.6 diagonal tolerance, pointer capture with try/catch, commit by distance (13% of width, cap 48px) or flick (0.15 px/ms over >= 10px), cancel handling. Well tuned.
12. **Wrap-around via shortest signed offset** (`offsetOf`, app.js:117-122).
13. **Optical correction of drawings** (scale/dx/dy measured by raster area; stroke divided by scale; decks.js header comment) as a convention for icon/illustration sets.
14. **The "why" comments**: nearly every non-obvious rule names the bug it prevents. Keep the habit.
15. **From `c792cff`**: type scale, spacing rhythm, elevation e1-e4 with the fixed far-edge invariant, `.press` physics gated by `(hover:hover)`, the one-ring `:focus-visible`, skip link, `[hidden]` override, `aria-disabled` pattern, 44/52/60 touch targets, `.icon-btn[aria-pressed]` toggle styling, toast, forced-colors button borders. Audit commit's "no target below 24px even on 430px-high viewports" rule.

---

## 7. Recommendations for the generic style guide (derived from this audit)

**Must-have rules (each traceable to a defect above)**
1. Every interactive surface is a real `<button>`/`<a>`/input; nothing relies on a document-level key listener (D1, D3).
2. Every gesture ships with a visible tap/click equivalent >= 44x44 (D2). Enforce a `--target-min: 44px` token; 24px is the absolute floor.
3. One focus ring token: 3px `--color-ink`, offset 3px, forced-colors `Highlight`; never `outline:none` without replacement (D4).
4. Text on `--tone-*` uses `--color-on-tone`; a build-time check computes every (text, surface) pair for light and dark and fails under 4.5:1 (text) or 3:1 (non-text) (section 3.2).
5. Status and categories are never colour-only (section 3.4); dots/indicators use `--color-ink-soft` or borders, never a raw opacity (D5).
6. Motion: tokens + `--motion-scale`; `prefers-reduced-motion` swaps rotation/travel for a sequenced dissolve, never zero duration; in-app override `data-motion="full"`; bound spring overshoot to the clip bleed (D8, D9).
7. Clip the strip with `clip-path`/viewport `overflow-x: clip`, not `overflow-clip-margin` (D7).
8. All four safe-area insets via `--safe-*` tokens (D12).
9. Fonts self-hosted and declared; system stack as explicit fallback (D14).
10. Forced-colors and `prefers-contrast: more` are first-class blocks in the base layer, each with a screenshot fixture (D6).
11. PWA shell: manifest, icons (180 apple-touch, 192/512, maskable), theme-color generated from tokens, SW offline template (D15).
12. Component docs carry the failure each rule prevents, and a test per rule; comments and tests must be updated together (D18, D19).

**Tests the guide should ship (none exist here)**: contrast matrix (Python/JS), axe-core in light/dark/forced-colors, keyboard tab-order probe, text-scale probe (200% root, 1.4.12 spacing), reduced-motion probe asserting no rotation matrix, 3D-flatness guard, WebKit run for clip/shadow.

**Architecture note.** For the *default* carousel, consider native `scroll-snap` (no custom pointer code, keeps pinch-zoom, momentum and assistive-tech scrolling; add prev/next buttons). Keep the custom strip/drag implementation only for components that need wrap-around or physics. This is a design judgement, not something measured here.

---

## 8. Evidence index

* `probe.json`: axe results, tab sequence, AX tree, platform font, touch-action, geometry, dots, key-repeat, button hijack, flip matrices (both motion modes), forced-colors computed styles, text overflow tables, landscape geometry.
* `probe2.js` output: incoming card left edge over time (min -29.7px at 242 ms).
* `contrast.py`, `cvd.py`: all ratios and CVD separations above.
* Screenshots: `shot-light-front.png`, `shot-dark-front.png`, `shot-*-back.png`, `shot-forced.png` (dots absent), `shot-landscape.png`.
* Git: `c792cff` (audit commit and last full design system), `8b86da1` (strip), `5555c91` (arrows removed, `touch-action:none`), `2c02220` (flip kept under reduce), `9c9f5af` (sequenced dissolve, `0.01ms` diagnosis).

## 9. Sources

* W3C, Understanding SC 2.5.7 Dragging Movements (AA): https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
* W3C, Understanding SC 2.5.1 Pointer Gestures (A): https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html
* W3C, Understanding SC 2.3.3 Animation from Interactions (AAA): https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
* Apple, Reduced Motion evaluation criteria (App Store Connect Help): https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria
* web.dev, prefers-reduced-motion: https://web.dev/articles/prefers-reduced-motion
* MDN BCD, overflow-clip-margin (Safari/iOS Safari not supported): https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/overflow-clip-margin.json
* MDN BCD, light-dark() (Chrome 123, Firefox 120, Safari 17.5): https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/types/color.json
* MDN BCD, linear() easing (Chrome 113, Firefox 112, Safari 17.2): https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/types/easing-function.json
* Other criteria cited from knowledge, not re-fetched: WCAG 1.4.4, 1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.4.7, 2.4.13, 2.5.8, 4.1.2; WAI-ARIA APG carousel pattern.
