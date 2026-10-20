# V1: technical verification of F1 (v0.1 → v0.2)

Verifier V1. I compared HEAD `49bd27e` with the baseline `5f96882`, which I extracted with `git archive` into `qa/v1/baseline/`. I made no changes under `design/`, and `git status design` is clean. All probes are my own Playwright scripts in `qa/v1/` (Chromium, `NODE_PATH=/opt/node22/lib/node_modules`). Logs are in `qa/v1/*.log` and screenshots in `qa/v1/shots/`. Every behavioural probe was also run against the baseline, so I know each one can catch the original defect.

**Result: 43 PASS, 0 FAIL** (28 F1 items and 15 contract rows). I found 6 new problems: 1 must and 5 should (below).

What I couldn't test here: real iOS/WebKit (Dynamic Type, `:active` on touch), and real Windows High Contrast. Forced colours were tested with Chromium's `forcedColors: 'active'` emulation.

## F1 items 1–28

| # | Item | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Hover never moves the hit box | PASS | `probe-pointer.cjs` at 1440: I swept 1px and 0.5px inside the bottom and right edges of 3 link cards and the ghost, one step per px. That is 0 `:hover` toggles, 0 rect changes and 0 transforms (`pointer1440.log`). The baseline flickered on every step: `1010…`, 233 toggles, `matrix(1,0,0,1,-2,-2)` (`pointer1440-baseline.log`). Hover gives a `4px 4px 0 0` shadow with `transform: none`. The only transform in any card is the static SVG `transform` attribute on the study triangle. `card.css:34,48` match the contract. |
| 2 | `:hover` only in `@media (hover: hover)` | PASS | Every `:hover` is inside the media query: `card.css:461-477`, `:595-600` (forced colours) and `sheet.css:134-139`. At 390 with touch, `(hover: hover)` is false. I tapped all 18 interactive card parts with the touchscreen. Chromium leaves `:hover` set on them, but no computed style differs from rest (`touch390.log`, "stuck: none"). The ghost stays dashed after a tap (`shots/touch390-ghost-after-tap.png`). |
| 3 | Ghost: keyboard = pointer | PASS | Computed values for real hover and keyboard `:focus-visible` are identical: `--lift` 1, `--fill` 1, shadow `4px 4px 0 0`, solid border, paper fill, filled mark. `.is-hover` gives the same lift and shadow (`misc.log`, `ghost.same=true`). Rules are at `card.css:461-497`. |
| 4 | Ink-panel bar focus ring | PASS | The rule at `card.css:76-79` is exactly as specified and comes after the ink rule at :70. The keyboard probe counts changed pixels on all 4 sides of the ink panel's control (T84 B84 L84 R84). In the baseline, the same stop changed 0 pixels. Ring: `rgb(20,20,20)` on the paper bar (`shots/focus-ink-bar-ctl-head.png`). |
| 5 | 200% text: wrap, no clipping | PASS (see N1) | All four rows wrap (`card.css:87,219,245,407`) and `.card__bar > .card__ctl` gets `margin-inline-start: auto`. `probe-text200.cjs` checks every control box and every glyph run in all 41 cards against the card's padding box at 320 and 390 with 200% text: 0 clipped, and `scrollWidth` equals the viewport. The baseline had 37 clipped parts. As worded ("clips"), the gate passes. The study card's answer now gets *overlapped* instead (N1). Judgement call: one-word titles break mid-word at 200% (`Circ\|le` in Row cards at 390). They are legible and nothing is lost (`probe-wordbreak.cjs`: 0 broken words at 100%). |
| 6 | Foot links get a 44px target | PASS (see N2) | Measured link is 46×44 and the foot stays 44 at 390 (`misc.log`). Rule at `card.css:233-240`. |
| 7 | Selection and collections | PASS | The selected card's shadow is `0 0 0 2px`. With `aria-current="page"` it is still selected; with `"false"` it is not. `article[aria-current]` is gone (index.html:812, `misc.log`). |
| 8 | Gate runs standalone | PASS | The `appClasses` block is deleted (`check.mjs:207-224`). `node design/tools/check.mjs` gives 9/9 and exit 0. The baseline gate fails check 7 out of the box. |
| 9 | Display style | PASS | `.t-display`, `--type-display`, `--text-4xl` and `--ls-display` appear 0 times in css, html and dist. `.sg-display` is `min(var(--sg-text-display), 19vw)` (`sheet.css:178-182`): 74.1px at 390 and 232px at 1440. The Type box shows `.t-heading` "Settings" (600, 32/35.2px, ls −0.48px). |
| 10 | Apply the cuts | PASS | No notch, stack, ↗, `sg-compare/bad/tells/table/tag/next/scroll`, `#shape-soft` or Corners switch remains. Link cards contain 0 `.card__action` and 0 `.card__row`. Variants are numbered `3.1 … 3.8`, sections `00 … 05`, and nav labels have no numbers. Every `.sg-*` class in `sheet.css` is used by the page, so no dead sheet rules are left. Shape box says "decided" and shows square only. |
| 11 | Gate covers `sheet.css` | PASS (see N5) | In a copy (`qa/v1/copy/`) I planted one violation at a time in `sheet.css`. Each failed the expected check: `#ff0000` and `rgb(` (2); `linear-gradient(var(--ink), var(--ink))`, a `4px` blur, `text-shadow` and `font-family: Inter` (3); `border: 3px` and `outline: 1px` (4); `transition`, `animation` and `@keyframes` (5). The flat-gradient exception is gone: the same flat gradient planted in `card.css` now fails check 3. The baseline gate missed all of these. Gap: check 4's radius half still skips `sheet.css` (N5). |
| 12 | Anatomy action is a real button | PASS | `button type=button aria-label="Mark as known" data-n=9` holding `.ic ic--check`. The bar label is a `<p>` (index.html:277, 301). |
| 13 | Heading levels | PASS | #anatomy goes h2 → h3, and #states goes h2 → 6×h3. The whole page has no skipped level (`misc.log`). |
| 14 | Disabled | PASS | `.card--disabled` has no `href`, `pointer-events: none`, a dashed frame and the meta "Unlocks after Colours". `.is-disabled` is gone, and so is `cursor: not-allowed`. In forced colours the frame and text change from CanvasText to the GrayText system colour (`media.log`, `shots/forced-states-sg-states.png`). The `.ic` rule is at `card.css:613`. |
| 15 | Cursor | PASS | Computed `cursor`: `default` on the control and the action, `pointer` on the card link and on the ghost (both native links), `auto` on the disabled card. Only the sheet's radio labels keep `pointer`. |
| 16 | Pressed feedback | PASS (see N3) | Pressing each of the 18 parts at 390 changed something: the control box fills, the action fills, foot links and list rows swap ink and paper, the link card gets `--fill: 1`, and the ghost's mark fills (`touch390.log`). The tap highlight computes to `rgba(0,0,0,0)` on a, button, summary and label. |
| 17 | List rows | PASS | `li` padding is 0 and the `a` has 16px. Taps 2px and 12px from both ends of every row land on the link (`1111`; the baseline gave `0000`). |
| 18 | Grids as lists | PASS | Both grids are `ul[role=list] > li`. Tiled frames overlap by exactly 2px, rows are 86/86 px, and the loose grid's heights are all 113. |
| 19 | Soft ink | PASS | Eyebrow on a plain card is `rgb(80,80,80)` (`--ink-soft`); on a toned card it is the 72% mix. `.t-meta` is `rgb(80,80,80)`. |
| 20 | Type tidy-up | PASS | Label is 13/15.6px (1.2). `.t-body` max is 558px (62ch). `lining-nums` and `optimizeLegibility` are gone. Smoothing is `auto` on body and on plain cards, and `antialiased` on the bar, the ink tone and `.sg-top`. Text under 13px: none at 390 or 1440. |
| 21 | iOS Dynamic Type | PASS (source) | `base.css:20-24` is exactly as specified. In Chromium the guard is false (`CSS.supports` false) and html stays 16px. iOS was not testable here. |
| 22 | Inputs don't zoom | PASS | `base.css:71-73`; the radio input computes to 16px. |
| 23 | Prefers more contrast | PASS | Under `contrast: more`, `--ink-soft` and `--line-soft` resolve to `#141414`, and every soft text I sampled (plain and toned eyebrows, meta, `.t-meta`, section notes, ghost, figure `small`) becomes `rgb(20,20,20)` (`media.log`). |
| 24 | Study fits a phone | PASS (see N1) | `card.css:431` is exactly as specified, and the hint reads "Turn over". On an 844×390 landscape phone the card is 232×325, which fits under the 390px `svh`. |
| 25 | Sheet on a phone | PASS | At 390 the brand and status are `display: none`, the bar is static, and the nav wraps (358/358, `overflow-x: visible`) with all 6 links in view (`shots/d390-sg-top.png`). Section 5.3 shows 14, 18 and 24rem, each captioned. |
| 26 | De-flashcard the code | PASS | `wire.css:45` and `foundation.css:85` are reworded. The flip rules are inline at index.html:713-716, and the copy rule says "from the product". v0.2 appears in the bar and the footer. No "the app's", `decks.js` or `styles.css` remains in css or html. |
| 27 | Layer order | PASS | `flashcards.css:19` reads `@layer tokens, base, components, wire, app, sheet;`. |
| 28 | Regenerate `dist/` | PASS | `bundle.mjs` run on an identical copy of the sources gives a byte-identical `dist/flashcards.css` and `dist/style-sheet.html`. |

## Contract rows

| Row | Verdict | Evidence |
| --- | --- | --- |
| `--type-heading` / `.t-heading` | PASS | `foundation.css:36`; `base.css:113-117` (`letter-spacing: var(--ls-title)`). |
| Poster style leaves the system | PASS | See item 9. |
| No `vw` in app tokens | PASS (judgement) | Text sizes are fixed at 1.5, 2 and 3rem (`foundation.css:21-23`), and the fluid sizes are `--sg-*` in `sheet.css:12-16`. `--gutter` (`foundation.css:52`) still uses vw. It is spacing, and every name in the row is a type size, so I read the row as type-only. |
| Label line-height 1.2 | PASS | `foundation.css:38`. |
| Removed tokens | PASS | All 9 names appear 0 times in css, html and dist. |
| `--safe-*` tokens | PASS | `foundation.css:78-81`; cards read none. |
| Lift is a shadow only | PASS | Exact `--shadow-lift` and `box-shadow` (`card.css:34,48`); no transform (item 1). |
| `@property` moved | PASS | `foundation.css:98-108`; 0 in `card.css`. |
| Selected | PASS | Exact selector at `card.css:523-524`, mirrored in forced colours (:602-603). |
| Disabled | PASS | Item 14. |
| Collections | PASS | Item 18; `card.css:566-579`. |
| List rows | PASS | Item 17. |
| Layer order | PASS | Item 27. |
| Soft ink | PASS | Item 19. |
| Variants (8) | PASS | Item 10. |

## Other checks the brief asked for

- **Keyboard, 1440** (`probe-keys.cjs`, forward and Shift+Tab): 37 stops, all matching `:focus-visible`. The order is skip link, 6 nav links, Show boxes, anatomy control and action, Plain foot links, Panel controls and 4 list rows, link cards, ghost, the 5 States links, then the Markup summaries in reading order. No stop lands under the sticky bar. Every stop changes pixels on all 4 sides except the Plain foot links (N2) and the forced `.is-focus` specimen, which is drawn focused already. The skip link sits on top (z 30), and Enter jumps to `#rules` (top 56px). The next Tab lands on the anatomy control.
- **Targets, 390:** every touch control is at least 44×44. The `.card__link` anchors are 85×27, but their hit box is the whole card: taps land on the link from every edge, 0.5px inside.
- **Reduced motion:** 0 elements with a transition or animation in either mode. `scroll-behavior` is `smooth` only under `no-preference`.
- **Forced colours:** link cards get a 4px Highlight ring on hover and focus. The ghost goes from dashed to solid on hover. Selected gets a 4px frame. Icons and the meter stay visible. Rings on the ink control, list rows and foot links are drawn in Highlight.
- **Markup blocks:** all 10 render. Re-parsing each printed block gives the same node signature as the live specimen, and no `data-sg`, `data-n` or `sg-` leaks into it (`markup.log`). See N4 for a layout problem.
- **`dist/style-sheet.html` vs `index.html`:** identical full-page SHA-256 at 390 (`b701518f…`) and at 1440 (`3144cc68…`). `qa/shot.cjs` is clean at 390, 1440 and 320 with no horizontal overflow.
- **Regressions against the baseline:** only N2. N1 is a different failure at the same size: the baseline scrolled sideways there instead.

## New problems

**N1 · must · The study card's answer is overlapped by its foot at 320px with 200% text.**
- Evidence: `shots/study-back-320-t200-overlap.png`. `probe-study.cjs`: "Triangle" runs 104px into "Three sides, three corners". `probe-study2.cjs`: 141px at 390@250% and 380px at 390@300%. Those are iOS accessibility text sizes, which item 21 now opts into.
- Cause: `.card--study` is a strict 5:7 grid with a `minmax(0, 1fr)` stage, so the box can't grow and the stage collapses (`card.css:427-432`).
- This is the plan's own 320px/200% gate. Nothing is clipped, but the core element's answer becomes unreadable.
- Smallest fix: in `.card--study`, delete `display: grid` and `grid-template-rows` (the card is already a flex column), and add `.card--study .card__stage { flex: 1 0 auto }`.
- Verified: still exactly 1.400 (5:7) at 100% at 320, 390 and 1440. The card grows only when content needs it, and there is no overlap from 320 to 430px at 200–300% (`shots/study-back-320-t200-withfix.png`).

**N2 · should · Regression: the foot link's focus ring lost its bottom edge.**
- Item 6's negative margins put the link's bottom edge on the card's clip edge. The ring (offset 2px, outside) is clipped there and merges with the card frame.
- Evidence: the keyboard probe changes 0 pixels on the bottom side, against 45 in the baseline. Compare `shots/focus-foot-link-head.png` with `shots/focus-foot-link-baseline.png`.
- Smallest fix: `.card__foot :is(a, button):not(.card__action):focus-visible { outline-offset: calc(var(--ring) * -1) }` (an inset ring, like list rows). Verified: all 4 sides changed (T60 B90 L84 R84).

**N3 · should (judgement, unverified) · On iPhone a tap may show no feedback at all.**
- iOS Safari applies `:active` only when a `touchstart` listener exists on the element or an ancestor (WebKit behaviour, noted on MDN's `:active` page). `base.css:81-86` now also removes the tap highlight.
- Chromium can't show this; it needs one check on a device.
- Smallest fix: add `document.addEventListener("touchstart", () => {}, { passive: true })` to the sheet's script, and give STYLE's PWA rules the same line for app shells.

**N4 · should · Opening a Markup block below 62rem widens the whole entry and scrolls the page sideways.** This was already there in the baseline.
- At 390, opening the Ghost block makes `scrollWidth` 1396. The stage stretches too, so the specimens grow wider than the screen (`probe-markup-open.cjs`, every block affected).
- Cause: the single implicit grid column of `.sg-entry` sizes to the `pre`'s longest line (`sheet.css:483-494`, `:587-590`).
- Smallest fix: `.sg-markup { min-inline-size: 0 }`. Verified: 390 = 390, and the `pre` scrolls on its own.

**N5 · should · Check 4 still ignores radii in `sheet.css`.**
- A planted `border-radius: 6px` passes. The radius test runs only for `components/` and `wire.css` (`check.mjs:167`), so the sheet could bring back soft corners after the owner chose square.
- Smallest fix: `if (isComponent(p) || isWire(p) || isSheet(p))`. Verified on the copy: the real sheet still passes 9/9 and the planted 6px fails.

**N6 · should · At 200% text, wrapped list rows touch their dividers.**
- At 320@200%, a row that wraps ("Shapes" / "12") has 0 vertical padding, so the text sits against the rule above (`shots/t200-320-panel-sg-stage.png`).
- Smallest fix: `.card__list a { padding-block: var(--space-2) }`. Verified: single-line rows stay 44px at 390 and 1440, and wrapped rows get 16px or more of clearance.

Not raised as problems (judgement or sheet-only cosmetics):
- At 320@200% the anatomy badges 8 and 9 overlap, and badge 3 covers the end of "IMAGE 4:3". This is sheet furniture at an extreme size.
- In forced colours the bar's ink fill and the media X disappear. This was true in the baseline as well.
- Row titles break mid-word at 390@200% (see item 5).
