# Accessibility + UX standards baseline for a reusable PWA / mobile style guide

Prepared 2026-09-30. Read-only analysis: nothing under /home/user/styleguide was touched.
Scripts used for the measured numbers: `scratchpad/py/calc.py`, `scratchpad/py/oklch_gap.py`. Fetched spec copies are in `scratchpad/web/`.

Evidence tags used throughout:

* **[V]** read from a primary source during this session (W3C, MDN, Apple HIG JSON, Google/Android docs, Federal Register API, ada.gov, CSS WG draft).
* **[BCD]** MDN browser-compat-data v8.1.3 (timestamp 2026-09-24), queried locally. Version numbers are "first version with support"; partial support is noted.
* **[M]** measured by me with the scripts above (WCAG 2 relative luminance, `L = 0.2126R + 0.7152G + 0.0722B`, sRGB threshold 0.04045).
* **[S]** secondary source only (practitioner blog, law-firm summary). Treat as probable, not certain.
* **[U]** unverified, or my inference. Listed again in section 14.

Units: 1 CSS px = 1 dp on Android Chrome = 1 pt on iOS Safari for layout purposes [U: well established, not re-fetched]. WCAG "large text" = 18 pt (24 CSS px) or 14 pt bold (18.66 CSS px) [V: WCAG 2.2 definition of "large scale"].

---

## 1. What is current on 2026-09-30 (standards and law)

| Item | Status | Evidence |
|---|---|---|
| **WCAG 2.2** | W3C Recommendation. First published 5 Oct 2023; updated 12 Dec 2024 (the FAQ says the update "modified definitions of single pointer, used in an unusual or restricted way, motion animation, and programmatically determined" plus editorial changes; no success criterion text changed). 2.2 adds 9 SC and marks 4.1.1 Parsing obsolete/removed. Content that meets 2.2 also meets 2.1 and 2.0 (W3C encourages using the latest). | [V] https://www.w3.org/TR/WCAG22/ (subtitle "W3C Recommendation 12 December 2024"); https://www.w3.org/WAI/standards-guidelines/wcag/ |
| **WCAG 2.3** | Does not exist and is not planned: "AG WG is not planning to do another version of WCAG 2, that is, not do WCAG 2.3." | [V] https://www.w3.org/WAI/standards-guidelines/wcag/faq/ |
| **WCAG 3.0** | Still a Working Draft. Latest: **10 September 2026** (`/TR/2026/WD-wcag-3.0-20260910/`). Status text: "It is inappropriate to cite this document as other than a work in progress." Six reporting tiers (Bronze/Silver/Gold above "conformance"). FAQ: "WCAG 3 is years away from being completed." Timeline claims of CR 2027 / Rec 2028-2030 come from vendor blogs only. **Not usable for compliance; do not design to it.** | [V] https://www.w3.org/TR/wcag-3.0/ ; FAQ above ; timeline [S] |
| **Contrast algorithm in WCAG 3** | Undecided. The 10 Sep 2026 draft says: "The contrast algorithm used in WCAG 3 is yet to be determined" and the requirement text is `@@[contrast measure to be determined]`. The word "APCA" does not appear in the draft (0 matches in my search of the fetched HTML). | [V] wcag-3.0 draft, "Text contrast sufficient (minimum)" |
| **APCA** | Not normative anywhere. Removed from WCAG 3 drafts in 2023 as exploratory content [S: Adrian Roselli, 2026-04]; Myndex's own intro says "neither [APCA nor WCAG 3] is officially recommended by the W3C." Apple's HIG names "the Accessible Perceptual Contrast Algorithm (APCA)" as a popular second measure but then gives WCAG AA ratios as its numbers. Use APCA only as an extra sanity check on text; never as a substitute for the 4.5:1 / 3:1 gate. | [V] github.com/Myndex/apca-introduction ; [V] Apple HIG Accessibility ; [S] https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html |
| **ISO** | WCAG 2.2 is ISO/IEC 40500:2025 (identical to the Oct 2023 text). The Dec 2024 text is expected as ISO/IEC 40500:2026 "by late 2026". | [V] WAI WCAG overview page |
| **EN 301 549 (EU)** | **V4.1.1 published 2 Sep 2026** (formally adopted 24 Aug 2026); adopts WCAG 2.2 Level A+AA in place of 2.1; adds Annex ZB/A.2 mapping to the EAA. As of the EC's AccessibleEU article of 7 Sep 2026 it was **not yet cited in the Official Journal**, so EN 301 549 V3.2.1 (2021, WCAG 2.1) remained the formal presumption-of-conformity reference. I could not confirm whether OJEU citation happened between 7 and 30 Sep. | [V] https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en ; [S] https://www.dwt.com/insights/2026/09/european-accessibility-act-ict-standards-update ; WAI page says "The 2026 version of EN 301 549 uses WCAG 2.2." |
| **European Accessibility Act** (Directive (EU) 2019/882) | Applies from **28 June 2025**. Covers e-commerce, consumer banking, e-books, ticketing, telephony/transport booking, etc. Microenterprises (<10 staff and turnover/balance sheet <= EUR 2m) that provide *services* are exempt. Service contracts concluded before the date may run to 28 June 2030; self-service terminals get 20 years. EUR-Lex text could not be fetched (HTTP 202 bot challenge), so the exemption/transition details come from the Commission and Your Europe pages. | [V] https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en ; https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/accessibility/index_en.htm |
| **US ADA Title II web + mobile-app rule** (28 CFR part 35) | Final rule 24 Apr 2024 adopted **WCAG 2.1 AA**. DOJ **Interim Final Rule, 91 FR 20902, published and effective 20 Apr 2026**, moved the compliance dates: public entities with population >= 50,000 from 24 Apr 2026 to **26 Apr 2027**; population < 50,000 and special districts from 26 Apr 2027 to **26 Apr 2028**. Technical standard unchanged (WCAG 2.1 AA). Comments closed 22 Jun 2026. Applies to state/local governments only. | [V] https://www.federalregister.gov/api/v1/documents/2026-07663.json (abstract, dates, citation); https://www.ada.gov/resources/2024-03-08-web-rule/ |
| **UK public sector** | GOV.UK: public-sector sites and apps must meet WCAG 2.2 AA (guidance updated after WCAG 2.2). Applies to public-facing apps. | [V] https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps |
| US private sector (ADA Title III), Section 508 (WCAG 2.0 AA per secondary sources), HHS Section 504 rule (dates reportedly shifted to 2027-28) | Not verified at primary source. | [U] / [S] |

**What this means for one developer building personal PWAs:** none of these laws bind personal-use apps, so conformance is a quality bar, not a legal duty. The realistic target is **WCAG 2.2 Level AA as a hard floor** (it is a superset of the 2.1 AA that every current law cites, and it is what EN 301 549 V4.1.1 and GOV.UK now use), plus these cheap AAA/"better" items: 2.5.5 (44 px targets), 2.4.12 + 2.4.13 (unobscured, strong focus), 1.4.6 (7:1 for body text where the palette allows), 2.3.3 (reduced motion), 3.3.9, and 1.4.8-style measure/leading. If an app is ever shipped to EU customers for e-commerce or banking, the EAA applies from that point.

---

## 2. Numbers to bake into tokens (summary)

| Token idea | Value | Why / source |
|---|---|---|
| `--target-floor` | 24px | SC 2.5.8 AA hard minimum [V] |
| `--target` (default touch size) | 44px (2.75rem) | SC 2.5.5 AAA [V]; Apple HIG default control 44x44 pt [V] |
| `--target-comfort` (primary actions, `pointer: coarse`) | 48px (3rem) | Android/Material 48x48 dp (about 9 mm) [V] |
| `--target-gap` | >= 8px between adjacent targets | Android "separated by 8dp or more" [V]; Apple ~12 pt padding around bezeled controls, ~24 pt around bezel-less [V]; WCAG 2.5.8 spacing exception needs a 24px circle per undersized target to be clear of neighbours [V] |
| Text contrast | 4.5:1 normal, 3:1 large; aim 7:1 for body | 1.4.3 / 1.4.6 [V] |
| Non-text contrast | 3:1 | 1.4.11 [V] |
| Focus ring | 2 + 2 px two-tone, offset 2px, contrast >= 3:1 vs every surface | 2.4.7 / 2.4.11 / 2.4.13 [V], recipe in section 5 |
| Body text size | >= 1rem (16px) | Apple default 17 pt / min 11 pt [V]; iOS Safari zooms focused inputs < 16px [S] |
| Smallest text | 0.75rem (12px), non-essential only, still 4.5:1 | Apple min 11 pt iOS [V]; my floor (judgement) |
| Line height | body 1.5, headings 1.2-1.3 | 1.4.12 requires no loss at 1.5 [V] |
| Measure | 45-75ch, never > 80ch | 1.4.8 AAA "no more than 80 characters" [V] |
| Reflow floor | 320 CSS px wide (and 256 px tall for horizontal-scroll content) | 1.4.10 [V] |
| Text scaling | layouts must survive 200% (WCAG), Android 200% nonlinear, iOS Dynamic Type up to 3.1x body (AX5 53 pt vs 17 pt default) | [V] sections 7, 10 |
| Flash | <= 3 flashes in any 1 s, no large red flashes | 2.3.1 [V] |
| Pause control | anything that moves/blinks/scrolls/auto-updates for > 5 s in parallel with other content | 2.2.2 [V] |
| Toast minimum on screen | persistent unless purely informational; if timed, pausable and >= 6 s (judgement) | 2.2.1, HIG [V]; number is [U] |
| Scrim for text on photos | >= 0.55 black alpha for white text worst case (see 3.4) | [M] |

---

## 3. Contrast

### 3.1 Thresholds (all WCAG 2.2, exact normative text checked)

| Requirement | SC / level | Threshold | How to satisfy in tokens |
|---|---|---|---|
| Text and images of text | 1.4.3 AA | **4.5:1**; large-scale text (>= 18 pt / 24 px, or >= 14 pt bold / 18.66 px) **3:1**. No rounding: "4.499:1 would not meet the 4.5:1 threshold." | Every `--on-*` token is paired with its surface in a machine-checked table (3.2). Never pass text through `opacity`; use solid tokens. |
| Enhanced text | 1.4.6 AAA | 7:1 (large 4.5:1) | Use for body text and numerals on cards where the palette allows; see anchored ranges below. |
| Non-text: UI components and their states, meaningful graphics | 1.4.11 AA | **3:1 against adjacent colours** | Input borders, unchecked checkbox/radio outlines, switch track and thumb, selected-tab indicator, chart marks, icon-only control glyphs. A text-only button does not need a border (Understanding 1.4.11) but needs a visible focus indicator. |
| Placeholder text | 1.4.3 | Counts as text: 4.5:1. Also never a substitute for a label (3.3.2, GOV.UK). | `::placeholder { color: var(--text-secondary) }` where `--text-secondary` already passes; ideally do not use placeholders for required info. |
| Disabled controls | 1.4.3 / 1.4.11 | **Exempt** ("not available for user interaction"). | Still keep them legible (aim 3:1 incl. the label) and explain *why* disabled; prefer `aria-disabled="true"` + explanatory text for controls the user may need to understand, because `disabled` removes focusability. |
| Hover / pressed | 1.4.11 | Hover treatments that are only supplemental need no 3:1; focus and pressed indicators that are the *primary* cue do. | Give hover a fill shift, but never make it the only state cue. |
| Selected / on / current | 1.4.1 A + 1.4.11 | State must not be colour-only (shape, icon, text, weight, underline) and the cue must be 3:1. Apple: "Avoid relying solely on different colors to communicate state" [V HIG Toggles]. | Checkmark / "On" text / filled vs outlined / aria-current underline bar >= 2px. |
| Focus indicator | 2.4.7 AA; 1.4.11; 2.4.13 AAA | 3:1 against adjacent colours *and* 3:1 change between focused and unfocused pixels | Two-tone ring (section 5). |
| Text over images and gradients | 1.4.3 | Measured against "the specified background over which the text is rendered in normal usage" (worst region under the text). Text-shadow does not count. | Scrim table in 3.4; or text sits on a solid tonal plate. |
| Logotypes, pure decoration, inactive UI | 1.4.3 | No requirement | Mark decorative elements `aria-hidden`/`alt=""` so audits skip them. |

Apple's own contrast table mirrors WCAG: up to 17 pt 4.5:1; 18 pt 3:1; bold any size 3:1; if not met by default, supply a higher-contrast scheme when **Increase Contrast** is on; check both light and dark [V HIG Accessibility].

### 3.2 Guaranteeing contrast by construction (tonal cards, OKLCH)

The user's design language uses **tonal cards**: a coloured surface with darker same-hue text and pills. Hand-picking each pair is what produced the failures in the source images; the system should instead make failure impossible to express.

**Rule 1: author surfaces and inks as a ramp, not as independent colours.** For each hue `h`, define a surface tone `--card-{h}` and ink tones `--card-{h}-ink-strong`, `-ink`, `-line` as OKLCH `L` steps. Only the `L` values matter for contrast; hue and chroma carry the personality.

**Rule 2: use anchored lightness ranges, not a single delta.** A fixed OKLCH delta is *not* enough, because contrast depends on luminance `Y` (roughly `L^3` for neutrals), so the same delta buys much less near white than near black. I swept all hues at 5 degree steps, chroma 0 to 0.18 (in sRGB gamut), `L` in 0.01 steps, and took the worst case [M]. Results (worst case over every hue/chroma in range):

| Mode | Surface `L` range | Text/ink `L` for **3:1** (non-text) | for **4.5:1** | for **7:1** |
|---|---|---|---|---|
| Light | surface L >= 0.85 | <= 0.54 | <= 0.44 | <= 0.34 |
| Light | surface L >= 0.88 | <= 0.56 | <= 0.46 | <= 0.36 |
| Light | **surface L >= 0.90** | <= 0.57 | <= 0.48 | <= 0.38 |
| Light | surface L >= 0.92 | <= 0.59 | <= 0.49 | <= 0.39 |
| Light | surface L >= 0.95 | <= 0.61 | <= 0.51 | <= 0.41 |
| Dark | surface L <= 0.15 | >= 0.50 | >= 0.60 | >= 0.71 |
| Dark | surface L <= 0.20 | >= 0.52 | >= 0.62 | >= 0.73 |
| Dark | **surface L <= 0.25** | >= 0.55 | >= 0.65 | >= 0.76 |
| Dark | surface L <= 0.30 | >= 0.59 | >= 0.69 | >= 0.81 |
| Dark | surface L <= 0.35 | >= 0.63 | >= 0.74 | >= 0.86 |

Chroma made almost no difference (results for chroma caps of 0.04, 0.10 and 0.18 are identical at 0.01 resolution), so the table holds for pastel and vivid tonal cards alike, provided the colour stays inside sRGB (out-of-gamut values get clipped by the browser and the real `L` shifts).

Practical reading: light tonal card `L 0.92-0.97` + strong ink `L <= 0.39` gives >= 7:1; secondary ink `L <= 0.49` gives >= 4.5:1; card borders/icons `L <= 0.59` give >= 3:1. A dark pill inside a light card (dark fill + light label) follows the dark rows: pill fill `L <= 0.35` with label `L >= 0.74` gives >= 4.5:1.

**Rule 3: the mid-tone dead zone.** Saturated mid-tone fills (vermilion, maroon-ish, sage, periwinkle) are the risky case. Worst case over hue/chroma [M]:

| Fill `L` | white text worst CR | near-black ink (`L` 0.20, ~#111) worst CR | verdict |
|---|---|---|---|
| <= 0.50 | >= 5.6 | - | white text passes 4.5 |
| 0.55 | 4.54 | 3.37 | white only, barely |
| **0.60** | **3.67** | **4.16** | **neither passes 4.5** |
| 0.65 | 3.02 | 5.10 | dark ink passes |
| >= 0.70 | - | >= 6.2 | dark ink passes |

So a fill with `L` in about **0.56-0.62 must not carry small text**. The token build should reject it, or restrict that fill to large text (3:1) and non-text. For a neutral (achromatic) fill the dead zone is `L` 0.568-0.605 when using a #1A1A1A ink [M].

**Rule 4: HCT/tone alternative.** Material's HCT tone is CIE L* computed from luminance `Y`, which is why tone differences translate into contrast ratios exactly. The Material Color Utilities source states "A difference of 40 in HCT tone guarantees a contrast ratio >= 3.0, and a difference of 50 guarantees a contrast ratio >= 4.5" [V: material-color-utilities `typescript/hct/hct.ts` lines 30-31]. I checked that arithmetic [M]: a tone gap of 40 gives a worst-case 3.17:1 (ok), but a gap of **50 gives a worst-case 4.484:1** (white vs tone 50), i.e. just under 4.5. The exact minimums are **38.4 for 3:1, 50.2 for 4.5:1, 62.2 for 7:1**. Use gaps of 52 (4.82:1) and 63 (7:1) if tones are used. HCT is not available natively in CSS; OKLCH with the anchored table above plus a CI check is the practical equivalent.

**Rule 5: `contrast-color()` is a helper, not a guarantee.** CSS `contrast-color()` returns black or white, whichever contrasts more, and is now Baseline ("Since April 2026" on MDN; Chrome 147, Firefox 146, Safari 26 [BCD]). MDN warns: "WCAG AA (4.5:1) contrast is not capable of producing clearly readable text in all cases. Mid-tone background colors generally don't provide enough contrast with either black or white... `#2277d3` produces black text, which is not readable for small text." [V]. Because the best of pure black/white is only guaranteed 4.58:1 at its worst point [M: min over backgrounds of max(CR(black), CR(white)) = 4.583 at Y = 0.179], and near-black inks reach only ~4.2:1 at their worst point, `contrast-color()` cannot replace the explicit pair table above. Use it for user-supplied or dynamic colours only, and still run the gate.

**Rule 6: a CI gate makes the above enforceable.** The token build must: (1) compute the WCAG 2 ratio (exact formula, threshold 0.04045, no rounding) for every declared `(surface, on-surface)` pair, for light, dark, and `prefers-contrast: more` palettes; (2) fail the build below 4.5 (text), 3.0 (large text, UI, focus) and report the margin; (3) compose alpha colours against their real parent before measuring; (4) check the focus ring against every surface token; (5) check each chart series colour against the chart background (3:1) and against its neighbours when adjacency matters. Treat APCA output as advisory only.

### 3.3 Semi-transparent and "muted" text

Text drawn with reduced opacity (white at 60 percent, grey at 50 percent) is evaluated as the blended colour. Define muted text as its own solid token that passes 4.5:1 (for example a `--text-secondary` that is 4.5:1 on every surface it is used on), never as `opacity`. `opacity` on a parent also dims its children's non-text elements below 3:1 without any tool noticing.

### 3.4 Text over photographs and gradients

The worst case is the brightest (or darkest) pixel under the text. Black scrim over a pure-white pixel, then white text [M, blend in sRGB space as browsers do]:

| Scrim alpha (black) | composite grey | white text CR vs worst pixel |
|---|---|---|
| 0.35 | 0.65 | 2.44 |
| 0.45 | 0.55 | 3.35 |
| 0.50 | 0.50 | 3.98 |
| **0.55** | 0.45 | **4.76** (first step that passes 4.5) |
| 0.60 | 0.40 | 5.74 |
| 0.70 | 0.30 | 8.52 |

For dark text on a worst-case black photo with a white scrim: alpha 0.50 gives 5.28:1, 0.60 gives 7.37:1 [M].

Apple's HIG suggests "a dark dimming layer of 35% opacity" behind **clear** Liquid Glass over bright content [V]. That is a legibility aid for glass controls, not a WCAG guarantee: 35 percent over pure white gives only 2.44:1 for white text [M]. For text that must pass, use >= 0.55 (worst-case 4.5:1) or put the text on a solid or regular-glass plate.

Other rules: never rely on `text-shadow` for compliance; prefer a gradient scrim that reaches >= 0.55 at the text baseline; keep photo overlays out of body copy; in `forced-colors` the browser draws a "backplate" behind text automatically [V MDN forced-colors].

### 3.5 APCA, as a supplementary check only

APCA reports polarity-dependent `Lc` values (light-on-dark differs from dark-on-light). Myndex's published guidance: Lc 75 minimum for body text (>18 px), Lc 90 preferred for body text, Lc 60 for larger fluent text, Lc 30 for spot/sub-fluent text, non-backward-compatible with WCAG 2 [V: apca-introduction README]. If used, log it in the CI report next to the WCAG ratio and only ever *tighten* a decision (for example, prefer the pair with the higher Lc when two are both WCAG-compliant). Never loosen a WCAG failure because APCA likes it. Thin weights and small sizes are where WCAG 2 is weakest, so apply a manual rule: body weight >= 400, and do not use weights under 400 below 20 px.

---

## 4. Target size and spacing

| Item | Source | Threshold | Notes |
|---|---|---|---|
| Target Size (Minimum) | **2.5.8 AA** (new in 2.2) [V] | **24 x 24 CSS px** unless an exception applies | Exceptions: **Spacing** (an undersized target passes if a 24 px diameter circle centred on its bounding box does not intersect another target or another undersized target's circle), **Equivalent** (a compliant control for the same function exists on the page), **Inline** (target inside a sentence or constrained by line-height), **User agent** (unmodified native control), **Essential**. Worked example from Understanding: six 20x20 icon buttons pass with 4 px gaps and fail with none. Two 16x16 targets need an 8 px gap (centres 24 px apart) [M]. |
| Target Size (Enhanced) | **2.5.5 AAA** [V] | **44 x 44 CSS px**; exceptions: equivalent, inline, user agent, essential (no spacing exception) | Adopt as the default. |
| Apple HIG | [V] | Default control 44x44 pt, **minimum 28x28 pt** (iOS/iPadOS); visionOS default 60x60; macOS 28x28 default, 20x20 min. "a button needs a hit region of at least 44x44 pt". Padding: about 12 pt around controls with a bezel, about 24 pt around bezel-less controls. |
| Material / Android | [V] Google Accessibility Help | **48 x 48 dp** (about 9 mm) separated by **8 dp** or more. |
| Material navigation bar | [V] developer.android.com layout/nav patterns | "three to five navigation destinations across the same hierarchy level." |
| Apple tab bar | [V] | Keep tabs few; avoid overflow "More"; "Include tab labels"; badges only for critical info. |

**CSS recipe (token-driven):**

```css
:root { --target: 2.75rem; --target-comfort: 3rem; --target-gap: 0.5rem; }
.btn, .icon-btn, .chip, .tab, .switch, .check, .radio {
  min-inline-size: var(--target);
  min-block-size: var(--target);
}
@media (pointer: coarse) { .btn--primary, .dock a { min-block-size: var(--target-comfort); } }
/* Small visible glyph, large hit area: */
.icon-btn { position: relative; inline-size: 1.5rem; block-size: 1.5rem; }
.icon-btn::after { content: ""; position: absolute; inset: -0.625rem; }  /* 24 + 2*10 = 44 */
```

Pseudo-element hit areas count because the pseudo-element is part of the control's hit region; keep neighbouring hit areas from overlapping (overlap defeats the purpose and breaks the 2.5.8 spacing logic) [U for the overlap detail]. Native `<input type=checkbox|radio>` are about 13 px by default: enlarge the whole `<label>` row to 44 px tall and make the label the click target. Avatar stacks with overlapping circles are each a target only if interactive; if interactive, the visible overlap must not cover another avatar's 24 px circle, otherwise wrap the whole stack in a single button that opens a list.

`pointer: coarse`, `hover: none`, `any-pointer` are supported everywhere [BCD: Chrome 41 / Firefox 64 / Safari 9]. Use `@media (hover: hover)` for hover-only styling so sticky-hover does not stick on touch.

---

## 5. Focus

| Requirement | SC / level | Testable rule |
|---|---|---|
| Focus visible | **2.4.7 AA** [V] | Every keyboard-operable control has a visible focus indicator in at least one mode of operation. |
| Focus not obscured (minimum) | **2.4.11 AA** (new) [V] | The focused component is not **entirely** hidden by author-created content (sticky headers, docks, cookie banners). Partial obscuring is allowed at AA. Technique C43: CSS `scroll-padding` (Understanding names it the sufficient technique). |
| Focus not obscured (enhanced) | 2.4.12 AAA [V] | No part is hidden. Aim for this: it costs nothing once `scroll-padding` is set. |
| Focus appearance | **2.4.13 AAA** (new) [V] | Indicator area >= a 2 CSS px thick perimeter around the unfocused component, *and* 3:1 contrast between the same pixels focused vs unfocused. Exceptions: UA default not modified by the author. Rounded rect perimeter = `4h + 4w - (16 - 4pi) r` [V Understanding]. Technique C40 (two-colour indicator) "guarantees sufficient contrast across variations of background images or gradients." |
| Keyboard operable, no trap | 2.1.1 A, 2.1.2 A [V] | Dialogs/sheets must be exitable by keyboard (Esc, close button). |
| Focus order | 2.4.3 A [V] | DOM order = visual order (see stacked cards). |
| Character-key shortcuts | 2.1.4 A [V] | Single-key shortcuts must be turnable off, remappable, or active only on focus. |
| Content on hover/focus | 1.4.13 AA [V] | Tooltips: dismissible (Esc) without moving pointer/focus, hoverable, persistent. |
| Focus on load / on input | 3.2.1, 3.2.2 A [V] | Focus or input must not trigger a change of context (auto-submit, auto-navigate). |
| Concurrent input | 2.5.6 AAA [V] | Do not disable mouse/touch/keyboard on hybrid devices. |

**Why one-colour rings fail:** a single ring colour cannot be >= 3:1 against every surface in a multi-tone system (a white ring disappears on light cards, a dark ring on dark cards, and any single mid-grey disappears on mid-tone fills). A two-tone ring does not need to know the surface: for any background, whichever of pure black or pure white contrasts more is always >= 4.583:1 [M: minimum over all backgrounds of max(CR(black), CR(white)), reached at relative luminance 0.179]. With near-black/near-white tokens (#1a1a1a + #fff) that guarantee is >= 4.17:1 [M], and with #111 + #fff it is 4.35:1 [M]. The two tones contrast 17.4:1 with each other [M], so the ring also remains visible against itself when one half blends into the surface.

**Recommended two-tone ring (tokens + CSS):**

```css
:root { --focus-inner: #111111; --focus-outer: #ffffff; --focus-w: 2px; --focus-gap: 2px; }
:where(a, button, input, select, textarea, summary, [tabindex], [role=button], [role=switch]):focus-visible {
  outline: var(--focus-w) solid var(--focus-outer);
  outline-offset: var(--focus-gap);                        /* outer ring: 2px..4px from the edge */
  box-shadow: 0 0 0 var(--focus-gap) var(--focus-inner);   /* inner ring: 0..2px from the edge  */
  border-radius: inherit;                                  /* boxes keep their shape */
}
@media (forced-colors: active) {
  :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
    outline: 3px solid Highlight; outline-offset: 2px; box-shadow: none;   /* box-shadow is forced to none */
  }
}
```

* `:focus-visible` support: Chrome 86, Firefox 85, Safari 15.4 [BCD]. Text inputs always match `:focus-visible` (click or key); buttons only for keyboard/programmatic-after-keyboard. Never write `outline: none` without an equivalent; `:focus:not(:focus-visible) { outline: none }` is fine once the `:focus-visible` rule exists.
* Curved outlines follow `border-radius` in Chrome 94, Firefox 88, Safari 16.4 [BCD outline].
* **Clipping:** `overflow: hidden` ancestors and `clip-path` (for example a notched-corner card) clip outlines and box-shadows. Draw the ring on the clipped element's *unclipped wrapper*, or use `outline-offset: -4px` (inside) on such components. Put this in the component checklist. [U: CSS behaviour, well established, not re-fetched]
* Two-tone keeps working on the dark elevation ramp and on photos; adjust only the two tokens per theme (for example swap inner/outer in dark mode) and let the CI gate verify.
* In `forced-colors` mode `box-shadow` and `background-image` are forced to none and `outline-color` is forced to a system colour [V MDN forced-colors]; the media-query block above keeps a visible ring.
* To keep sticky UI from hiding focus:

```css
html { scroll-padding-block: calc(var(--header-h, 0px) + 0.5rem)
                              calc(var(--dock-h, 0px) + env(safe-area-inset-bottom) + 0.5rem); }
.scroller { scroll-padding-block-end: calc(var(--dock-h) + 0.5rem); }   /* inner scroll containers too */
```

  `scroll-padding` is supported in Chrome 69 / Firefox 68 / Safari 14.1 [BCD]. The bottom dock height should be a CSS variable set once (or measured with `ResizeObserver`) so the padding never drifts. Also keep `position: sticky/fixed` UI from covering focus when a *modal dialog* opens: modal dialogs take focus and pass (Understanding 2.4.11). Sticky cookie-like banners fail if they entirely cover a focused control.
* At high zoom, fixed headers/docks should become static: the Understanding for 1.4.10 advises "at smaller viewport sizes such components are modified to have static positioning, or their display can be toggled." [V]

---

## 6. Input, gestures, authentication, consistency

| Requirement | SC / level | Rule and how to satisfy it |
|---|---|---|
| **Dragging Movements** | **2.5.7 AA** (new) [V] | Any function that uses dragging must be achievable with a **single pointer without dragging** (tap/click), unless essential. Accepted alternatives: click-on-track for sliders, select-then-tap arrow buttons to reorder, a number input beside a slider, +/- stepper buttons. Native scrolling is excluded; custom scroll implementations are not. **Keyboard support alone does not satisfy 2.5.7** (it must be a pointer alternative), so always ship tap alternatives: scrubbers/dials get - / + buttons and a numeric field; sortable lists get "Move up / Move down" buttons; bottom-sheet grabbers get a tap-to-toggle and a close button; slide-to-confirm gets a plain Confirm button. |
| **Pointer Gestures** | **2.5.1 A** [V] | Multipoint (pinch, two-finger) and path-based gestures (swipe, flick, trace) need a single-pointer, non-path alternative (tap, long press is allowed as an alternative). Swipe-to-reveal rows and swipe-between-pages need visible buttons or a menu. Pinch-zoom on maps/charts needs +/- buttons. Taps and long presses themselves are not covered. |
| **Pointer Cancellation** | **2.5.2 A** [V] | Do not execute on `pointerdown`/`touchstart`; fire on `click`/`pointerup` so a drag-off cancels. Exceptions: "Up Reversal" (a hold-to-compare button that reverts on release complies) and keyboard/keypad emulation. |
| **Motion Actuation** | **2.5.4 A** [V] | Shake-to-undo, tilt, etc. also need an on-screen control *and* a setting to disable the motion trigger. Motion sensors on iOS need a permission prompt. |
| Label in Name | 2.5.3 A [V] | The accessible name must contain the visible label text (start with it). Do not `aria-label` a button "Send money" when it shows "Transfer". |
| Redundant Entry | **3.3.7 A** (new) [V] | Within one process, information already entered is auto-populated or selectable (shipping = billing pattern; carry amount/recipient across steps). Exceptions: essential, security, no longer valid. |
| Accessible Authentication (Minimum) | **3.3.8 AA** (new) [V] | No step may require a cognitive function test (remember/transcribe/puzzle) unless an alternative, a helping mechanism, object recognition, or personal content is offered. Allow **paste** and **password-manager autofill**; do not block paste in OTP fields; `autocomplete="one-time-code"` / `username` / `current-password` / `new-password`; passkeys (WebAuthn) and email magic link are listed sufficient techniques. Enhanced 3.3.9 is AAA. |
| Consistent Help | **3.2.6 A** (new) [V] | If help (contact, self-help, chatbot) repeats across pages/views it keeps the same relative order. In an app shell: put "Help" in the same settings/overflow slot on every screen. |
| Consistent Navigation / Identification | **3.2.3 AA, 3.2.4 AA** [V] | Repeated navigation keeps one order; same function = same icon + same accessible name everywhere (a "+" that means "Add task" on one screen and "New event" on another is a 3.2.4 issue unless names differ by function). The bottom dock keeps the same items in the same order on every screen. |
| Error handling | 3.3.1 A, 3.3.3 AA, 3.3.4 AA [V] | Errors described in text and tied to the field; suggestions offered; financial or destructive commits are reversible, checked, or confirmed (so use Undo instead of confirm where possible; HIG Assistive Access: confirm twice for hard-to-recover actions). |
| Labels or instructions | 3.3.2 A; 2.4.6 AA [V] | Every input has a visible persistent label; placeholder is a hint, not a label. |
| Input purpose | **1.3.5 AA** [V] | Use valid `autocomplete` tokens (`name`, `email`, `tel`, `bday`, `street-address`, `postal-code`, `cc-number`, ...) on fields collecting data about the user; also satisfies 3.3.8 and password managers. |
| Language | 3.1.1 A [V] | `<html lang>`; `lang` on foreign phrases. |
| Page titled / bypass | 2.4.2 A, 2.4.1 A [V] | In an SPA, update `document.title` and move focus/announce on route change; provide a "skip to content" link even in app shells. |

---

## 7. Layout, text, colour, status

| Requirement | SC / level | Threshold | Satisfy with |
|---|---|---|---|
| Reflow | **1.4.10 AA** [V] | No 2-D scrolling at **320 CSS px** wide (= 1280 px at 400% zoom) for vertical-scrolling content, **256 px** tall for horizontal-scrolling; exception for maps, diagrams, data tables (not cells), video, games, toolbars needed while manipulating content | Fluid grid, `min-width: 0` on flex/grid children, `overflow-wrap: anywhere` on user-generated strings, `flex-wrap`, no fixed widths, container queries. Phone viewport at 320 x 568 is a required QA size. A horizontally scrolling chip or tab row is a common pattern; whether it needs `flex-wrap` at 320 px is an interpretation question [U], so the safest default is to wrap. |
| Resize text | **1.4.4 AA** [V] | Up to **200%** without loss of content or function, no assistive tech | Type in `rem`/`em`; containers use `min-block-size`, never fixed `height`; **do not** set `maximum-scale` or `user-scalable=no` in the viewport meta (ACT rule "Meta viewport allows for zoom"); do not size text in `vw` alone (failure F94; use `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`-style with a rem term); do not set `text-size-adjust: none`. |
| Text spacing | **1.4.12 AA** [V] | Nothing is lost when a user sets line-height 1.5x, paragraph spacing 2x, letter-spacing 0.12em, word-spacing 0.16em | Unitless `line-height`; no fixed-height text boxes; buttons grow; avoid `text-overflow: ellipsis` hiding essential data without a reveal mechanism. Test with the W3C Text Adaptation bookmarklet. Do not use negative tracking on body text (a sibling analysis measured -0.03em). |
| Orientation | **1.3.4 AA** [V] | Do not lock to portrait or landscape unless essential | In `manifest.webmanifest` leave out `orientation` (or use `any`/`natural`); locking via `orientation: portrait` is a PWA-specific way to fail this. MDN notes the member has limited support [V]. |
| Use of colour | **1.4.1 A** [V] | Colour is never the only means of conveying information, an action, a response or a distinction | Add icon, text, pattern, underline, position. Links inside text need a non-colour cue (underline) or 3:1 against surrounding text plus an extra cue on hover/focus. Charts need direct labels or patterns. |
| Non-text content | **1.1.1 A** [V] | Every image/icon has an equivalent alt or is marked decorative; icon-only controls have a name | `alt=""` for decoration; `aria-hidden="true" focusable="false"` on decorative SVG; visible text beats `aria-label`; charts in section 12. |
| Sensory characteristics | 1.3.3 A [V] | Instructions can't rely solely on shape, colour, position or sound ("tap the green button at right") | Copy rule. |
| Images of text | 1.4.5 AA [V] | Use real text | Wordmarks are the only exception. |
| Info and relationships | 1.3.1 A | Headings, lists, tables, form groups in markup | Semantic HTML; heading levels follow structure, not size. |
| Meaningful sequence | 1.3.2 A [V] | CSS must not change meaning vs DOM order (failure F1); technique C27 "make the DOM order match the visual order" | No `order`/`row-reverse`/grid placement that re-sequences interactive content; `reading-flow` is Chrome-only (137) [BCD] so do not rely on it. |
| Status messages | **4.1.3 AA** [V] | Status messages are programmatically determinable through role/properties and announced without taking focus | `role="status"` (success, counts), `role="alert"` (errors), `role="log"`, `role="progressbar"`. The live region must exist in the initial DOM and be empty when the update happens ("Establish the live region before updating its content") [V MDN live regions]. `aria-live="assertive"` only for time-critical. No interactive content inside live regions. |
| Name, role, value | 4.1.2 A [V] | Custom controls expose name/role/state | Prefer native elements; see section 12. |

**Type and scaling facts to design around:**

* Apple Dynamic Type body sizes (points) for the twelve iOS categories, from the HIG tables [V]: xSmall 14, Small 15, Medium 16, **Large 17 (default)**, xLarge 19, xxLarge 21, xxxLarge 23, AX1 28, AX2 33, AX3 40, AX4 47, **AX5 53**. AX5 is **3.1x** the default body size; Large Title goes 34 to 60 pt. HIG: "give people the option to enlarge text by at least 200 percent" [V]. A layout that survives 53 pt body will stack columns, wrap dock labels, and never truncate essential data.
* Android 14+ scales fonts up to 200% with a **nonlinear** curve; "always specify text sizes in sp"; do not use sp for padding; define `lineHeight` in sp; test at maximum font size [V developer.android.com Android 14 features].
* **Web text scaling on mobile is not automatic in Chrome or Safari (2026):** see section 10.3.
* iOS Safari auto-zooms into a focused input whose computed font size is < 16 px [S], so make all form controls >= 16 px (`font-size: max(1rem, 16px)`), instead of blocking zoom.
* `-webkit-text-size-adjust: 100%` on `html` prevents landscape inflation; `none` disables the inflation algorithm and MDN flags it against 1.4.4 [V MDN text-size-adjust].

---

## 8. Motion

| Requirement | SC / level | Rule |
|---|---|---|
| Pause, Stop, Hide | **2.2.2 A** [V] | Moving/blinking/scrolling content that starts automatically, lasts **> 5 s** and is shown in parallel with other content needs a pause/stop/hide mechanism. Auto-updating content needs pause/stop/hide or a frequency control. A hover/focus-only pause does **not** count ("an animation [that] stops only so long as a user has focus on it... would not be considered a mechanism to pause"). Applies to tickers, marquees, carousels, looping video/Lottie, skeleton shimmer that never resolves. |
| Three Flashes | **2.3.1 A** [V] | <= 3 general/red flashes in any 1 s, or below the threshold (a general flash = a pair of opposing luminance changes >= 10 percent of max luminance with the darker state below 0.80; area threshold 0.006 sr / about 341x256 px at 1024x768). Practical rule: nothing flashes more than 3/s. |
| Animation from Interactions | **2.3.3 AAA** [V] | Interaction-triggered *motion animation* can be disabled. Motion = scale, position, parallax; "changes of color, blurring, or opacity which do not change the perceived size, shape, or position" are not motion. Technique C39 = `prefers-reduced-motion`. **Adopt** even though AAA. |
| Timing Adjustable | 2.2.1 A [V] | Time limits: turn off, adjust (>= 10x), or extend (20 s warning, >= 10 extensions); exempt if > 20 h or if the same information is available another way. |
| Audio Control | 1.4.2 A [V] | Audio that plays automatically > 3 s needs pause/stop or independent volume. HIG: never autoplay audio/video without discoverable controls [V]. |
| Interruptions | 2.2.4 AAA [V] | Interruptions can be postponed or suppressed. |

**`prefers-reduced-motion` best practice** (MDN: Baseline widely available since Jan 2020 [V]; Chrome 74, Firefox 63, Safari 10.1 [BCD]):

* Treat `reduce` as "remove or replace non-essential movement", **not** "disable everything": "preferably to the point where all non-essential movement is removed" [V web.dev]. WebKit: "only remove the animations you *know* to be vestibular triggers" and provide simpler replacements [V webkit.org]. Apple's list of what Reduce Motion should do [V HIG Accessibility]: tighten springs to reduce bounce, track animations directly to gestures, avoid animating depth/z-axis changes, **replace x/y/z transitions with fades**, avoid animating into and out of blurs, reduce zooming, scaling and peripheral motion. (HIG is stricter than WCAG on blur: follow HIG.)
* Safe under reduce: opacity cross-fade, colour change, border/outline change, static state swap, instant scroll position, progress bars that fill (they carry information).
* Not safe: parallax, large-scale zoom/scale, panning big surfaces, 3D rotation, spinning, multi-speed movement, peripheral horizontal motion, scroll-jacking, auto-advancing carousels, sliding full-screen page transitions, rubber-banding springs [V WebKit, web.dev, HIG].
* **Gentler, not instant:** replace a 300 ms slide with a 150-200 ms fade rather than 0 ms; removing all transition makes state changes harder to follow for some users [U: my judgement; HIG and WebKit both say replace, not delete]. A global `animation-duration: 1ms !important` reset is fragile: web.dev warns it cannot stop Web Animations API motion and breaks `animationend`-dependent logic [V].
* Token pattern:

```css
:root { --dur-1: 120ms; --dur-2: 200ms; --dur-3: 320ms; --ease: cubic-bezier(.2,0,0,1); --move: 1; }
@media (prefers-reduced-motion: reduce) { :root { --dur-3: 160ms; --move: 0; } }
.sheet { transition: transform calc(var(--dur-3)) var(--ease), opacity var(--dur-2) linear; }
@media (prefers-reduced-motion: reduce) { .sheet { transition: opacity var(--dur-2) linear; transform: none; } }
```

  Author motion as **opt-in** (`@media (prefers-reduced-motion: no-preference) { ... }`) for anything decorative [V web.dev recommends opt-in].
* JS: `matchMedia('(prefers-reduced-motion: reduce)')` plus a `change` listener; also gate Web Animations API, View Transitions (`::view-transition-group(*)` durations), scroll-driven animations (`animation-timeline`: Chrome 115, Safari 26, Firefox preview [BCD]) and Lottie/canvas loops.
* Ship an **in-app** "Reduce motion" switch that defaults from the OS value and stores the user's override (a `data-motion` attribute on `<html>`), since some users cannot set OS preferences on a locked-down device.
* Marquee/ticker: default to paused or static when reduce; a visible Pause/Play button (`aria-pressed` or a swapped label, not both) must exist regardless of preference, because 2.2.2 is not satisfied by the media query alone.
* Haptics: Apple says to complement other feedback and "Make haptics optional" [V]. `navigator.vibrate` is **not** supported in Safari/iOS [BCD: Chrome 32, Firefox 16, Safari none], so haptics are an Android-Chrome-only progressive enhancement and never a sole signal.

---

## 9. User-preference media queries and what to do with them

Support data is from BCD v8.1.3 unless noted.

| Feature | Values | Support (first version) | Design-system behaviour |
|---|---|---|---|
| `prefers-color-scheme` | light, dark | Chrome 76, Firefox 67, Safari 12.1, iOS 13 | Two complete palettes; also `color-scheme: light dark` on `:root` so native controls, scrollbars and form fields follow; `light-dark()` colour function: Chrome 123, Firefox 120, Safari 17.5. Provide an in-app override via `[data-theme]`. `<meta name="theme-color" media="(prefers-color-scheme: dark)">` for the status bar (meta support is partial in Chrome, Safari 15 [BCD]). |
| `prefers-contrast` | no-preference, more, less, custom | Chrome 96, Firefox 101, Safari 14.1, iOS 14.5. MDN: Baseline widely available since May 2022. `custom` matches users who have a forced palette (`forced-colors: active`). | Third palette tier "high contrast": text >= 7:1, UI >= 4.5:1, 2px borders on every card/input, no translucent surfaces, no hairline dividers. Apple requires custom colours to have an increased-contrast variant [V HIG Color]. Do not remove the design; thicken and darken it. Playwright can emulate `contrast: 'more'` [V]. |
| `forced-colors` | none, active | Chrome 89, Firefox 89, Safari 16. MDN: Baseline widely available since Sep 2022. | See 9.1. |
| `forced-color-adjust` | auto, none, preserve-parent-color | Chrome 89, Firefox 113, **Safari none** | Use `none` only on colour swatches, charts you re-colour with system colours, and canvas; nowhere else. |
| `prefers-reduced-motion` | no-preference, reduce | Chrome 74, Firefox 63, Safari 10.1 | Section 8. |
| `prefers-reduced-transparency` | no-preference, reduce | **Chrome 118, Firefox behind a flag, Safari none**; MDN marks it experimental / not Baseline | Use it to swap `backdrop-filter` glass for an opaque surface, but because Safari lacks it, **also** swap when `prefers-contrast: more` or `forced-colors: active`, and when `backdrop-filter` is unsupported (`@supports not (backdrop-filter: blur(1px))`). Liquid-Glass-style blur is a progressive enhancement over an opaque default, not the reverse. |
| `prefers-reduced-data` | no-preference, reduce | **Chrome behind a flag only; Firefox/Safari none.** MDN: "No Current Browser Support". | Do not depend on it. Use `navigator.connection.saveData`/`Save-Data` header (Chromium) if ever needed; for a personal PWA simply ship small assets and self-hosted subsetted fonts. |
| `inverted-colors` | none, inverted | **Safari only** (9.1); Firefox flag; Chrome none | Optional: when inverted, re-invert photos/video (`filter: invert(1)`) so they are not negatives. Low priority. |
| `dynamic-range` / `video-dynamic-range` | standard, high | Chrome 98, Firefox 100, Safari 13.1 | Only for HDR media. |
| `pointer`, `any-pointer`, `hover` | coarse/fine, hover/none | Safari 9, Chrome 38-41, Firefox 64 | Target sizing, hover styling (section 4). |
| `display-mode` | browser, standalone, minimal-ui, fullscreen | Chrome 42, Firefox 47, Safari 13 | PWA standalone has no browser back/reload: provide in-app back and refresh; adjust safe-area padding. |
| `update`, `scripting`, `overflow-block` | | Chrome 113/120/113, Safari 17 | Rarely needed. |
| `orientation` | portrait, landscape | everywhere | Adapt layout, never lock (1.3.4). |
| Zoom | browser/OS | - | Must not be blocked: no `user-scalable=no`/`maximum-scale`. |
| OS text size | see 10.3 | - | Keep all type/spacing in rem/em so any text-scale mechanism works. |
| `color-gamut` | srgb, p3, rec2020 | | Keep every token inside sRGB for the contrast guarantees; offer wide-gamut variants only as decoration. |

### 9.1 Forced colors (Windows High Contrast and similar)

[V MDN forced-colors, system-color]

* The browser forces `color`, `background-color`, `border-color`, `outline-color`, `text-decoration-color`, `column-rule-color`, SVG `fill`/`stroke` to the user's palette; forces `box-shadow`, `text-shadow` and non-URL `background-image` to `none`; forces `color-scheme` to `light dark` and `scrollbar-color` to `auto`. Text gets an automatic "backplate".
* Colour choice follows **native element semantics, not ARIA roles**: `<div role="button">` will not get `ButtonText`. Use real `<button>`, `<input>`, `<a>`.
* **Preserve:** real borders (draw card and control edges with `border: 1px solid transparent`, which becomes visible in forced colours; do not rely on background-colour or shadow to delineate), focus outlines (`outline`, not shadow), `currentColor` icons, selected-state indicators that are structural (border thickness, check glyph), text labels instead of colour-only chips. Use system colours for anything you must colour: `Canvas`, `CanvasText`, `LinkText`, `VisitedText`, `ActiveText`, `ButtonFace`, `ButtonText`, `ButtonBorder`, `Field`, `FieldText`, `Highlight`, `HighlightText`, `SelectedItem`, `SelectedItemText`, `Mark`, `MarkText`, `GrayText`, `AccentColor`, `AccentColorText`.
* Do not build a second design for forced colours; make small tweaks only [V MDN guidance]. A switch track drawn with `background` alone vanishes; give it `border: 2px solid ButtonText` under `@media (forced-colors: active)` and draw the "on" state with `SelectedItem` plus a check glyph.
* Test in Chrome/Edge DevTools "Emulate CSS media feature forced-colors: active" and with Playwright `emulateMedia({ forcedColors: 'active' })` [V Playwright docs].

---

## 10. Platform guidance for mobile

### 10.1 Apple (HIG, JSON pages read 2026-09-30)

* **Controls and type** [V Accessibility]: iOS/iPadOS default control 44x44 pt, minimum 28x28; padding ~12 pt (bezeled) / ~24 pt (bezel-less). Default text 17 pt, minimum 11 pt. Enlarge text by at least 200 percent via Dynamic Type or custom UI. "If you're using a custom font with a thin weight, aim for larger than the recommended sizes."
* **Gestures** [V]: "Offer alternatives to gestures... if you use a swipe gesture to dismiss a view, also make a button available." "Don't assume that people can use a specific gesture." Support Voice Control, Switch Control, Full Keyboard Access; label every control.
* **Colour** [V Color]: "If you define a custom color, make sure to supply light and dark variants, and an increased contrast option for each variant." Use consistent colour meaning; do not use one colour for two meanings. Test in sunlight and dim light.
* **Materials / Liquid Glass** (iOS 26, current) [V Materials]: Liquid Glass is for the **functional layer** (tab bars, sidebars, toolbars, floating controls), "Don't use Liquid Glass in the content layer"; "use it sparingly"; **regular** variant for text-heavy components (alerts, sidebars, popovers) because it "blurs and adjusts the luminosity of background content to maintain legibility"; **clear** variant only over visually rich media, with a **35 percent dark dimming layer** if the content beneath is bright (see 3.4: that is not a WCAG guarantee). The look "can differ in response to... accessibility settings that reduce transparency or increase contrast". For the web: glass is decoration behind a solid fallback and never the only thing separating text from content.
* **Reduce Motion** list and **Assistive Access** guidance [V]: single-purpose screens, confirm irreversible actions twice, avoid timers that auto-dismiss ("Prefer dismissing views with an explicit action").
* **Components** [V]: Tab bar labels (single words), limit tabs, avoid overflow; badges only for critical info; one or two prominent buttons per view; always give custom buttons a press state; toggles must not rely on colour; sheets support swipe to dismiss *and* Cancel/Done buttons, grabber "works with VoiceOver so people can resize the sheet without seeing the screen"; segmented control = single choice from a set, all segments equal width; charts need axis/mark labels and accessibility labels.
* **Haptics** [V]: complement audio/visual feedback, keep consistent meanings, "Make haptics optional."
* Dynamic Type sizes: section 7. Apple also runs "Accessibility Nutrition Labels" for App Store listings [V: named in HIG]; irrelevant to PWAs.

### 10.2 Material 3 / Android

* **Targets:** 48x48 dp, 8 dp separation [V Google Accessibility Help]. **Navigation bar:** three to five destinations [V]; per the M3 spec (summary from a third-party skill page, [S]) labels are always visible for 3 destinations and recommended for 4-5.
* **Type:** sp units; nonlinear scaling to 200 percent (Android 14+); `lineHeight` in sp; do not size padding in sp; test at the maximum setting [V].
* **Colour:** "use cues other than color to distinguish UI elements... different shapes or sizes, text or visual patterns, or haptic feedback" [V Android accessibility principles]. Material's tone-based colour roles are what makes pair guarantees possible (section 3.2).
* **Material 3 Expressive** (2025): Google says its 46-study, 18,000-participant research programme "in many cases... chose to exceed existing standards for tap target size, color contrast, and other important aspects" [V design.google research article]. No numeric thresholds are published in the text I could fetch, so do not cite M3 Expressive for specific numbers. Its expressive levers (colour, shape, size, motion, containment) all need the same gates as any other style: shape-morphing and springy motion must be gated by `prefers-reduced-motion` and large/expressive type by the 200 percent test.
* The M3 site (m3.material.io) is a JavaScript app and could not be fetched as text in this session, so component-level M3 accessibility text is **[U]**.

### 10.3 PWA / web-view specifics

* **OS text size reaching web content** (changed in 2026): [S Adrian Roselli, 6 Feb 2026; V BCD; V CSS Fonts 5 ED 13 Sep 2026]
  * Firefox for Android honours the OS font size automatically.
  * **iOS Safari does not** unless the page uses the system text styles: `body { font: -apple-system-body; }` and, to avoid desktop Safari shrinking the root, `@supports (font: -apple-system-body) and (not (-webkit-touch-callout: default)) { :root { font-size: 100%; } }`. Everything else must be in relative units. Because `rem` is measured from `html`, and Roselli's snippet sets the font on `body`, verify on-device that your rem-based tokens actually scale; if they do not, apply the `-apple-system-body` font to `html` instead [U].
  * **Chrome/Edge/Android WebView (version 146+)** support `<meta name="text-scale" content="scale">` [BCD]. The CSS WG's CSS Fonts 5 draft (13 Sep 2026) defines keywords `legacy` (default) and `scale`, plus `env(preferred-text-scale)`. With `scale`, text in `rem`/`em` follows the OS setting; px text does not. Author opt-in is required because enabling it by default "would break too many websites" [S]. The page must not set a fixed pixel base font size.
  * **Recommended baseline for every app built on this style guide:** include the meta tag, set type and type-linked spacing in `rem`, do not set `html { font-size: 62.5% }` or pixel bases, test at OS max font (Android 200 percent; iOS AX5).
  * Behaviour of installed iOS home-screen PWAs and `WKWebView` shells with respect to Dynamic Type: **[U]**.
* **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` with no `maximum-scale`/`user-scalable`. Safe areas: `padding-bottom: max(1rem, env(safe-area-inset-bottom))` on docks and sheets; `env()` supported Chrome 69 / Firefox 65 / Safari 11.1 [BCD]. Use `dvh`/`svh`/`lvh` units (Chrome 108, Firefox 101, Safari 15.4 [BCD]) for full-height layouts so the dynamic browser toolbar does not hide content.
* **Manifest:** do not lock `orientation`; set `theme_color`/`background_color` for light and dark; `display: standalone` means you must supply back navigation, a visible title and a refresh path.
* **Overscroll/gesture conflicts:** `overscroll-behavior: contain` on sheets and scrollers; edge-swipe gestures collide with the iOS back gesture and Android gesture navigation, so never hide the only route to an action behind an edge swipe [U].
* **Badging:** `navigator.setAppBadge` (Chrome 81, Safari 17/iOS 16.4) is a progressive enhancement.
* **Native `<dialog>`, `inert`, popover:** `<dialog>` Chrome 37 / Firefox 98 / Safari 15.4; `inert` Chrome 102 / Firefox 112 / Safari 15.5; `popover` Chrome 114 / Firefox 125 / Safari 17; `closedby` Chrome 134, Firefox 141, Safari only in preview; `HTMLDialogElement.requestClose()` Chrome 134 / Firefox 139 / Safari 18.4 [BCD]. All usable as primitives in 2026.

---

## 11. UX principles that "guide the user" (sourced)

* One clear primary action per view; Apple: "Keep the number of prominent buttons to one or two per view" [V HIG Buttons].
* Always visible text labels on navigation; single-word tab labels [V HIG Tab bars]; 3-5 destinations [V Android].
* Every custom control has default, hover, pressed, focus, selected, disabled and loading states; "Always include a press state for a custom button" [V HIG].
* Prefer Undo over confirm dialogs; confirm only for irreversible or financial commits; if confirming, say exactly what will happen on the button label (3.3.4).
* Keep flows short, one decision per screen where stakes are high (Assistive Access guidance) [V].
* Give timely text feedback for every action (status message), but do not auto-dismiss anything with an action, an error, or important data [V Understanding 2.2.1 + Roselli toast critique].
* Empty, loading, error and offline states are designed components, not afterthoughts (an empty state explains why content is unavailable: "If a section is empty, explain why its content is unavailable" [V HIG Tab bars]).
* Numbers use tabular figures; currency and units are in the accessible name.
* GOV.UK form rules worth adopting: visible labels above inputs, no placeholder-as-label, `inputmode` for numbers, don't use `type=number` [V].
* Offer in-app settings for theme, text size (if not relying solely on OS), reduced motion, haptics, and sound; default them from OS signals.

---

## 12. Screen-reader and ARIA patterns per component

Prefer native elements; add ARIA only to fill gaps. APG = WAI-ARIA Authoring Practices Guide.

| Component | Recommended markup | Keyboard | Must also | Sources |
|---|---|---|---|---|
| **Segmented control / pill switcher** | If it picks a **value or filter**: native radios inside `<fieldset><legend>` styled as segments (or `role="radiogroup"` + `role="radio"` + `aria-checked`). If it switches **which panel of content** is visible on the same screen: `role="tablist"` / `tab` / `tabpanel` with `aria-selected`, `aria-controls`, `aria-labelledby`. If it **navigates to a different route**: links in a `<nav>` with `aria-current="page"`. | Radio group: arrow keys move focus *and* check (roving tabindex); tabs: Left/Right (+Home/End), automatic or manual activation; selected item is the single tab stop | >= 44px segments of equal width; selected state is not colour-only; do not use `aria-selected` on a nav link, and do not use `aria-current` on `tab` [V MDN aria-current] | [V] APG radio, tabs; Apple segmented control |
| **Bottom dock / tab bar navigation** | `<nav aria-label="Main">` containing a list of `<a>` (or `<button>` if it swaps in-app views), icon + visible label, `aria-current="page"` on the active one; do not use `role=menu`/`tablist` for site navigation [U for the "do not"] | Tab order follows visual order | Keep dock height in `--dock-h`; `scroll-padding`; `padding-bottom: env(safe-area-inset-bottom)`; same items/order on every screen (3.2.3); icon-only items need a visible label or at minimum an accessible name; badge count in the accessible name ("Inbox, 3 unread") | [V] MDN aria-current; 2.4.11; Apple tab bars |
| **Bottom sheet / modal** | Native `<dialog>` opened with `showModal()`: background becomes inert, focus moves inside, Esc closes (last-opened only), focus returns to the opener, implicit `aria-modal="true"`. Label with `aria-labelledby` pointing at the visible title; `role="alertdialog"` for confirmations. Put `autofocus` on the best initial control (or the dialog/close button when in doubt). Do not add `tabindex` to the `<dialog>`. Non-modal sheets: `show()` or a `popover`, not `aria-modal`. | Tab cycles inside; Esc closes; `closedby="closerequest"` (default for modal) or `any` for light-dismiss | A visible **Close/Done** button (touch-only devices have no Esc); the drag handle is a `<button>` that expands/collapses on tap (2.5.7) and is never the only way; `overscroll-behavior: contain`; scroll lock with `body:has(dialog[open]) { overflow: hidden }`; `prefers-reduced-motion` gated slide-in | [V] MDN dialog; APG dialog-modal; HIG sheets |
| **Toast / snackbar** | A persistent, empty `role="status"` (polite) container rendered at load; inject text into it. Errors: `role="alert"` (rare). Optionally call `element.ariaNotify(text, {priority})` where supported: **Baseline "newly available" since Sep 2026 (Chrome 141, Firefox 150, Safari 27)**; `priority: "high"` ~ assertive, "normal" ~ polite; `aria-live` announcements outrank `ariaNotify`; combine multiple messages into one [V MDN]. Feature-detect and keep the live region as the fallback. | Toast itself is not focusable; if it has an action (Undo) it is **not a toast**: use a persistent banner or a dialog | Do not auto-dismiss messages that contain actions, errors or key data; if timed: pause on hover **and** focus, >= 6 s [U number], and log to a notification history. Purely informational messages whose info is available elsewhere are exempt from 2.2.1 [V]. No interactive content in a live region [V MDN]. One message at a time, queue the rest. | [V] 4.1.3 Understanding; MDN live regions; [S] adrianroselli.com/2020/01/defining-toast-messages.html |
| **Progress** | Determinate: `<progress value max>` with a `<label>` or `aria-label` (role=progressbar is implicit); indeterminate: remove `value`; region loading: `aria-busy="true"` on the region plus `aria-describedby` the progress. Scalar within a known range (budget used, battery, score): `<meter>`, not `<progress>`. | n/a | Show the number as text; announce milestones (25/50/75/100 percent or "Uploaded") via the status region, not every tick; completion is a status message; colour is not the only difference between done and pending; progress that never resolves needs a stop (2.2.2) | [V] MDN progress; 4.1.3 |
| **Switch** | `<input type="checkbox" role="switch">` with a real `<label>`; `aria-checked` is implied by `checked` on a native checkbox. Safari also has the `switch` attribute on checkbox (Safari 17.4; Chrome and Firefox none [BCD]), so use `role="switch"` for cross-browser. | Space toggles; Enter optional | **Label must not change when state changes**; visible On/Off text or a check glyph (not colour only); >= 44px; changes apply immediately (no hidden Save) | [V] APG switch; HIG toggles |
| **Chips** | Filter chips (multi-select): `<button type="button" aria-pressed="true|false">` or checkboxes styled as chips. Single-select chip set: radio group (as segmented). Chips that navigate: links. Input chips with remove: a chip (text) plus a separate "Remove {name}" button. | Space/Enter | Label stable when pressed changes [V APG button toggle]; the pressed state is not colour-only (check icon or fill + outline change); horizontally scrolling rows must be keyboard reachable (Chrome 130+ makes scrollers without focusable children focusable; otherwise `tabindex="0"`, `role="region"` and a label) and should wrap at narrow widths if possible | [V] APG button; Chrome blog keyboard-focusable scrollers |
| **Charts** | Wrap in `<figure>` with `<figcaption>`; give the chart `role="img"` and a short `aria-label` (the headline insight, not "bar chart"), and provide the same data as a real `<table>` (visible, in a `<details>`, or linked "View data table"). Longer descriptions via adjacent text or `aria-describedby` (text-only). Interactive marks: `<button>` per mark with names like "April: $1,240, highest month", roving tabindex, arrow keys. | For interactive charts: arrow keys, Esc to leave | Marks and axes >= 3:1 (1.4.11 graphical objects); never colour alone (direct labels, patterns, shape); the highlighted bar differs by more than colour (label/outline); pale series colours (for example 1.6:1 tints) fail and need outlines or darker fills; respect reduced motion for draw-in animation; Apple: label axes/marks, "accessibility labels that describe chart elements" | [V] W3C complex-images tutorial; 1.4.11; 1.4.1; HIG Charts |
| **Swipe-to-reveal (row actions)** | Row is a normal list item; actions are also reachable through a visible "More" (kebab) `<button aria-haspopup="menu">` or in the detail view; swipe is an enhancement only | Tab reaches the More button; Esc closes menu | Swipe is a path-based gesture (2.5.1 A); provide single-pointer alternative; do not depend on discoverability; keep the swipe from fighting OS edge-back gestures [U] | [V] 2.5.1; HIG "offer alternatives to gestures" |
| **Numeric keypad (custom)** | Prefer a native `<input inputmode="decimal|numeric" autocomplete=... enterkeyhint=...>` and the OS keypad. If a custom keypad is required (PIN, amount): a `role="group"` labelled "Number pad" containing real `<button type="button">` for 0-9, decimal and **Backspace ("Delete last digit")**, in **phone-standard 3x4 DOM order 1-2-3 / 4-5-6 / 7-8-9 / . 0 del**; visual stagger/honeycomb is decoration and must not reorder the DOM (a sibling analysis found the source image reads 1-8 then 9, 0). The value lives in a labelled `<output>` or readonly input (`inputmode="none"` if you must suppress the OS keyboard) with a debounced `role="status"` announcement of the full value. Also accept hardware digit/Backspace/Enter keys. | Tab through keys in order; digits and Backspace keys also work globally while focus is in the keypad | Keys >= 48px with gaps (a 79px key with "almost touching" neighbours is fine for size but keep >= 8px gap); visible text label equals accessible name (2.5.3); do not use `type="tel"` for amounts (phone keypad, has `+*#`, wrong semantics/autofill); do not use `type="number"` (spinner steals wheel/arrow input; GOV.UK: "there's a risk of users accidentally incrementing a number"); mask PINs with `type="password" inputmode="numeric"` and allow paste (3.3.8) | [V] GOV.UK text-input; 2.5.3; 3.3.8; [BCD] inputmode Chrome 66 / Firefox 95 / Safari 12.1 |
| **Stacked / overlapping cards** | DOM order = visual order top to bottom (1.3.2, 2.4.3); each card is a `<section>`/`<article>` with a heading. For the "stack" look use negative margins or sticky positioning **without** reordering. A card that is covered by another must not hide its focusable content: when focus enters a covered card, raise it (`:focus-within { z-index }` and `scrollIntoView({block:"nearest"})`) or place interactive content only in the exposed strip; use `inert` on cards that are fully occluded and non-interactive | Natural tab order | 2.4.11 (not entirely hidden), 2.4.12 ideal; `reading-flow` is Chrome-only [BCD], do not depend on it; reduced motion = no scale/stack-parallax, static stack | [V] Understanding 1.3.2 (F1, C27), 2.4.11 |
| **Marquee / ticker** | Not `<marquee>`. A static readable list is the default; animation is an enhancement. Duplicated loop content is `aria-hidden="true"` (and `inert`). `aria-live="off"` (never announce a scrolling ticker). | Visible **Pause/Play** button reachable by keyboard | 2.2.2: pause/stop/hide required for > 5 s auto motion; hover/focus pause does not satisfy it; `prefers-reduced-motion: reduce` = static; no information exists only in the ticker; pause via `animation-play-state` | [V] 2.2.2 Understanding; APG carousel (stop on focus/hover + explicit button) |
| **Slide-to-confirm** | A real `<button>` "Confirm transfer" is the accessible path; the slider is an optional pointer enhancement layered on it. If exposed as a slider, use `role="slider"` with `aria-valuetext` and arrow-key increments, Enter to confirm | Enter/Space on the button | 2.5.7 (drag needs a non-drag alternative) and 2.5.1; completion on release (2.5.2) with snap-back; do not use it for routine actions | [V] 2.5.7 |
| **Slider / scrubber / dial** | Native `<input type="range">` styled, or `role="slider"`: `aria-valuemin/max/now`, `aria-valuetext` (for example "+12 exposure"), label | Arrows step, Home/End, PageUp/PageDown | + / - buttons and a numeric field; tap on track sets the value (2.5.7); `touch-action` limited to the control; tick marks are decorative | [V] APG slider; 2.5.7 |
| **Carousel / auto-advancing banner** | APG carousel: container `aria-roledescription="carousel"`, slides `role="group" aria-roledescription="slide"`, prev/next buttons, a stop/start button; no autoplay by default; `aria-live="off"` while auto-rotating, `polite` when manual | Rotation stops on focus and hover, and there is an explicit button | 2.2.2; swipe is not the only way; peeking edges are a visual cue only | [V] APG carousel |
| **Hold-to-compare / press-and-hold** | `<button>` that applies on `pointerdown`/`keydown` and reverts on `pointerup`/`keyup`/`pointercancel` (Up Reversal, 2.5.2) | Hold Space/Enter | Offer a toggle alternative (`aria-pressed`) for people who cannot hold | [V] 2.5.2 |
| **Icon-only buttons, badges, avatars** | `aria-label`/visually hidden text naming the *action* ("Add task"), not the icon ("plus"); unique names when repeated ("Add event at 3 pm, Tuesday 13 December") | - | Decorative SVGs `aria-hidden`; "NEW" / count badges are text in the name; avatar stacks: names available as text or a "+N" disclosure | [V] 1.1.1, 2.5.3 |
| **Forms** | Visible `<label for>`, `aria-describedby` for hint and error, `aria-invalid="true"` on error, error summary linked to fields, `autocomplete` tokens, group with `<fieldset>/<legend>` | - | 3.3.1/3.3.2/3.3.3/3.3.4/1.3.5; `:user-invalid` (Chrome 119, Firefox 88, Safari 16.5 [BCD]) to avoid showing errors before interaction | [V] WCAG; GOV.UK |
| **Tooltips / hover content** | Keep to `aria-describedby`; do not hide essential info in them | Esc dismisses | 1.4.13: dismissible, hoverable, persistent; not available on touch, so no essential info | [V] 1.4.13 |

---

## 13. Test protocol the style guide should ship (CI + manual)

Automated (every build):

1. Token contrast gate (section 3.2 Rule 6), light, dark, and high-contrast palettes, including focus ring vs every surface.
2. axe-core (or equivalent) run on the component gallery in: light, dark, `contrast: more`, `forced-colors: active`, `reduced-motion: reduce`. Playwright `page.emulateMedia({ colorScheme, reducedMotion, forcedColors, contrast: 'more' })` supports all four [V Playwright docs].
3. Viewport tests: 320x568 (1.4.10), 390x844, 768x1024, landscape 844x390; 400% zoom equivalent (set width 320) and the Text Adaptation bookmarklet values (1.4.12) injected as CSS.
4. Target-size test: every interactive element's bounding box >= 24x24 (fail) and >= 44x44 (warn), spacing exception checked.
5. Keyboard test script: Tab through every component; assert `:focus-visible` ring present (computed outline width > 0 or box-shadow), and that the focused element is fully in the viewport above the dock/header.
6. Static lint: no `outline: none` without replacement, no `user-scalable=no`, no `px` font sizes, no `opacity` on text, no `<div onclick>`, every `img` has `alt`, every icon button has a name.

Manual (per release):

7. VoiceOver on iOS Safari and (if installed) standalone PWA; TalkBack on Android Chrome; NVDA + Firefox or Chrome on Windows; keyboard only on desktop; Switch Control/Voice Control spot checks.
8. iOS Larger Text at AX5, Android font 200 percent, desktop browser zoom 200 and 400 percent.
9. Reduce Motion, Increase Contrast, Reduce Transparency, Dark mode, Smart Invert on iOS; Windows contrast themes.
10. Thumb-reach and outdoor sunlight check for primary actions.

---

## 14. Not verified, could not fetch, or judgement

* EUR-Lex text of Directive 2019/882 (bot challenge): exemption/transition specifics rely on the Commission and Your Europe pages.
* Whether EN 301 549 V4.1.1 was cited in the OJEU between 7 and 30 Sep 2026.
* US ADA Title III position, Section 508 version, HHS Section 504 rule dates: secondary or unchecked.
* WCAG 3 timeline (CR 2027, Rec 2028+): vendor blogs only; W3C says only "years away".
* Material 3 component accessibility text (m3.material.io is JavaScript-rendered; fetch returned 404/empty). 48 dp / 8 dp / 3-5 destinations come from Google Accessibility Help and developer.android.com instead.
* Dynamic Type behaviour inside installed iOS home-screen PWAs and `WKWebView` shells.
* Safari's mapping of iOS "Increase Contrast" to `prefers-contrast: more` and of "Reduce Transparency" (Safari has no `prefers-reduced-transparency` per BCD).
* iOS focus-zoom below 16 px (well known, secondary sources only).
* The exact "6 s" toast floor, the 120-200 ms reduced-motion crossfade range, and the "wrap chips at 320 px" stance are my judgement, not standards.
* Overlap of pseudo-element hit areas, focus-ring clipping by `clip-path`, and 1 CSS px = 1 dp: CSS/browser behaviour I am confident of but did not re-fetch.
* The OKLCH ranges were computed on a 0.01 L grid and 5 degree hue grid over in-gamut sRGB colours with chroma <= 0.18; they are a construction aid and the CI gate is still the authority.
* Keyboard-focusable scrollers (Chrome 130) verified from the Chrome blog snippet only.

---

## 15. Sources

W3C and WAI
* WCAG 2.2: https://www.w3.org/TR/WCAG22/ ; overview + ISO + EN note: https://www.w3.org/WAI/standards-guidelines/wcag/ ; FAQ (no WCAG 2.3): https://www.w3.org/WAI/standards-guidelines/wcag/faq/ ; What's new in 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
* WCAG 3 Working Draft 10 Sep 2026: https://www.w3.org/TR/wcag-3.0/
* Understanding: contrast-minimum, non-text-contrast, target-size-minimum, focus-appearance, focus-not-obscured-minimum, resize-text, reflow, text-spacing, timing-adjustable, status-messages, dragging-movements, pointer-gestures, pause-stop-hide, animation-from-interactions, accessible-authentication-minimum, meaningful-sequence (all under https://www.w3.org/WAI/WCAG22/Understanding/<name>.html)
* APG patterns: tabs, radio, switch, button, dialog-modal, slider, carousel (https://www.w3.org/WAI/ARIA/apg/patterns/<name>/)
* Complex images tutorial: https://www.w3.org/WAI/tutorials/images/complex/
* CSS Fonts 5 (text-scale meta, env(preferred-text-scale)): https://drafts.csswg.org/css-fonts-5/

MDN / browser data
* https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion , prefers-contrast , forced-colors , prefers-reduced-transparency , prefers-reduced-data , inverted-colors
* https://developer.mozilla.org/en-US/docs/Web/CSS/system-color ; /color_value/contrast-color ; /text-size-adjust
* https://developer.mozilla.org/en-US/docs/Web/API/Element/ariaNotify ; /HTML/Reference/Elements/dialog ; /HTML/Reference/Elements/progress ; /Accessibility/ARIA/Guides/Live_regions ; /Accessibility/ARIA/Reference/Attributes/aria-current ; /Web/Manifest/orientation
* MDN browser-compat-data 8.1.3: https://cdn.jsdelivr.net/npm/@mdn/browser-compat-data/data.json
* web.dev prefers-reduced-motion: https://web.dev/articles/prefers-reduced-motion ; WebKit: https://webkit.org/blog/7551/responsive-design-for-motion/ ; Chrome keyboard focusable scrollers: https://developer.chrome.com/blog/keyboard-focusable-scrollers

Platform
* Apple HIG (JSON source pages): Accessibility, Color, Typography, Layout, Buttons, Materials, Toolbars, Tab bars, Sheets, Toggles, Segmented controls, Motion, Gestures, Charts, Playing haptics under https://developer.apple.com/design/human-interface-guidelines/
* Google Accessibility Help (touch targets 48dp/8dp): https://support.google.com/accessibility/android/answer/7101858
* Android 14 nonlinear font scaling: https://developer.android.com/about/versions/14/features ; layout and nav patterns: https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns ; accessibility principles: https://developer.android.com/guide/topics/ui/accessibility/principles
* Material 3 Expressive research: https://design.google/library/expressive-material-design-google-research
* Material Color Utilities (HCT tone/contrast claim): https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/hct.ts (lines 30-31)
* Text scaling on mobile web: https://adrianroselli.com/2026/02/honoring-mobile-os-text-size.html ; https://matuzo.at/blog/2026/text-scaling-meta-tag ; https://joshtumath.uk/posts/2026-01-27-try-text-scaling-support-in-chrome-canary
* APCA intro: https://github.com/Myndex/apca-introduction ; WCAG 3 contrast status: https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html
* Toast critique: https://adrianroselli.com/2020/01/defining-toast-messages.html
* GOV.UK text input: https://design-system.service.gov.uk/components/text-input/ ; GOV.UK accessibility requirements: https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps
* Playwright emulateMedia: https://playwright.dev/docs/api/class-page#page-emulate-media

Law
* ADA Title II IFR: https://www.federalregister.gov/api/v1/documents/2026-07663.json (91 FR 20902) ; https://www.ada.gov/resources/2024-03-08-web-rule/
* EAA: https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/european-accessibility-act-eaa_en ; https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/accessibility/index_en.htm
* EN 301 549 V4.1.1: https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-standard-en-301-549-has-been-updated-2026-09-07_en ; https://www.dwt.com/insights/2026/09/european-accessibility-act-ict-standards-update

---

## 16. Checklist (testable; prefix = SC or source)

Contrast and colour
1. 1.4.3 AA: normal text >= 4.5:1, large text (>= 24 px, or >= 18.66 px bold) >= 3:1, unrounded; every `--on-*` token has a declared surface pair checked in CI.
2. 1.4.6 AAA (adopt where palette allows): body and numerals >= 7:1.
3. 1.4.11 AA: input borders, unchecked controls, switch track/thumb, selected indicators, icon glyphs, chart marks >= 3:1 against adjacent colours.
4. 1.4.3: placeholder text >= 4.5:1; placeholder is never the only label.
5. 1.4.3/1.4.11: disabled controls are exempt but remain legible (aim 3:1) and the reason is stated.
6. 1.4.1 A: no state, error, link or chart series distinguished by colour alone (add icon, text, underline, pattern).
7. 1.4.3: text on images only over a scrim of >= 0.55 alpha (worst-case white-on-white, measured) or a solid plate; `text-shadow` never counted.
8. 1.4.3: muted text is a solid token, never `opacity`.
9. Tonal cards: light surface L >= 0.92 with ink L <= 0.39 (7:1) / <= 0.49 (4.5:1) / <= 0.59 (3:1); dark surface L <= 0.25 with ink L >= 0.76 / >= 0.65 / >= 0.55 (measured, hue-independent, chroma <= 0.18).
10. Measured: fills with OKLCH L about 0.56-0.62 carry no small text (dead zone between white and near-black ink).
11. HCT tone gaps: use >= 52 for 4.5:1 and >= 63 for 7:1 (gap 50 measures 4.484:1 worst case).
12. MDN contrast-color(): never the sole guarantee; mid-tones fail; keep the pair gate.
13. APCA: advisory only (not in WCAG 2.2 or the 10 Sep 2026 WCAG 3 draft); never loosens a WCAG failure.
14. Apple HIG: custom colours have light, dark and increased-contrast variants; check both appearances.

Target size and spacing
15. 2.5.8 AA: every pointer target >= 24x24 CSS px, or passes the 24 px circle spacing test, or has another listed exception.
16. 2.5.5 AAA / HIG: default interactive target >= 44x44 CSS px; primary actions on `pointer: coarse` >= 48 px.
17. Android/Material: >= 48 dp with >= 8 dp between adjacent targets; Apple ~12 pt around bezeled, ~24 pt around bezel-less controls.
18. Label rows and icon buttons expand their hit area with padding or a pseudo-element, without overlapping neighbours.

Focus and keyboard
19. 2.4.7 AA: every focusable control shows a visible focus indicator via `:focus-visible`; no `outline: none` without replacement.
20. 2.4.13 AAA (adopt): indicator >= 2 CSS px perimeter and >= 3:1 change focused vs unfocused.
21. C40 two-tone ring (2px #fff outer at offset 2px + 2px #111 inner via box-shadow) verified >= 3:1 on every surface token in CI (the better of the two rings is guaranteed >= 4.35:1 on any background with #111/#fff, 4.58:1 with pure black/white).
22. forced-colors: focus ring uses `outline` with `Highlight`, not box-shadow.
23. 2.4.11 AA / 2.4.12 AAA: `scroll-padding` accounts for sticky header, bottom dock and safe-area inset so a focused element is never covered.
24. Focus rings are not clipped by `overflow: hidden` or `clip-path` ancestors (notched cards).
25. 2.1.1/2.1.2: all functions keyboard-operable; dialogs/sheets exit with Esc and a visible Close button; no trap.
26. 2.4.3/1.3.2: DOM order equals visual order (keypad 3x4, stacked cards); no CSS `order` that re-sequences interactive content.
27. 1.4.13 AA: hover/focus popovers are dismissible (Esc), hoverable, persistent; no essential info only on hover.
28. 2.1.4 A: single-key shortcuts can be disabled, remapped or are focus-scoped.
29. 3.2.1/3.2.2: focus or input never auto-navigates or auto-submits.

Gestures and input
30. 2.5.1 A: every swipe, pinch or path gesture has a single-pointer, non-path alternative (visible button or menu).
31. 2.5.7 AA: every drag (slider, scrubber, reorder, sheet grabber, slide-to-confirm) has a tap alternative (track tap, stepper, move up/down, toggle, plain button); keyboard support alone does not satisfy it.
32. 2.5.2 A: actions fire on pointer up/click with cancel by dragging off; hold-to-act reverts on release and has a toggle alternative.
33. 2.5.4 A: motion-triggered actions (shake, tilt) also have a control and can be switched off.
34. 2.5.3 A: accessible name contains the visible label.
35. 3.3.7 A: information entered earlier in a flow is auto-filled or selectable.
36. 3.3.8 AA: no cognitive test without an alternative; paste and password-manager autofill allowed; OTP fields accept paste and `autocomplete="one-time-code"`.
37. 1.3.5 AA: `autocomplete` tokens on personal-data fields.
38. 3.3.1/3.3.3/3.3.4: errors in text tied to the field, with suggestions; prefer Undo; confirm irreversible or financial commits.
39. GOV.UK: numeric entry uses `inputmode="numeric|decimal"`, not `type="number"` or `type="tel"`; visible labels above inputs.

Consistency
40. 3.2.3 AA: bottom dock items keep the same order on every screen.
41. 3.2.4 AA: same function = same icon and accessible name on every screen.
42. 3.2.6 A: Help/contact sits in the same relative place across screens.
43. 2.4.2/2.4.1: route changes update `document.title`, move or announce focus, and a skip link exists.

Layout and text
44. 1.4.10 AA: no two-dimensional scrolling at 320 CSS px wide (256 px tall for horizontal content); fixed bars become static/collapsible at large zoom.
45. 1.4.4 AA: 200 percent text without loss; type in rem; containers use `min-block-size`; no `user-scalable=no` or `maximum-scale`; no `vw`-only font sizes (F94).
46. 1.4.12 AA: survives line-height 1.5, paragraph spacing 2x, letter-spacing 0.12em, word-spacing 0.16em with nothing clipped or overlapped.
47. 1.4.8 AAA (adopt): measure <= 80ch (target 45-75ch), left-aligned, body line-height 1.5.
48. 1.3.4 AA: no orientation lock in CSS, JS or the web manifest.
49. Inputs >= 16 px font size (iOS focus zoom) without disabling zoom; never `text-size-adjust: none`.
50. Apple: layouts survive Dynamic Type AX5 (body 53 pt, 3.1x default) by stacking and wrapping; Android: survives 200 percent nonlinear scaling; `<meta name="text-scale" content="scale">` present and `font: -apple-system-body` applied so OS text size reaches web content.
51. 1.4.5 AA: no images of text except wordmarks.

Status, names and semantics
52. 4.1.3 AA: toasts/results use a persistent empty `role="status"` container; errors `role="alert"`; `ariaNotify()` only as a feature-detected enhancement (Baseline Sep 2026).
53. 2.2.1 A / HIG: anything with an action, an error or important data is persistent; timed toasts pause on hover and focus and are logged.
54. 4.1.2 A: custom controls expose name, role, value; prefer native elements (`<dialog>`, `<progress>`, `<meter>`, `<input type=range>`, `<input type=checkbox role=switch>`).
55. APG switch/toggle: label does not change when state changes (switch, `aria-pressed`).
56. APG/MDN: `aria-current="page"` on the active nav link; `aria-selected` only on tabs/options.
57. Segmented control: radios/radiogroup for value selection, tabs only when swapping panels, links for routes.
58. MDN dialog: `showModal()` for sheets (inert background, focus return, Esc), labelled by its title, with a visible Close.
59. 1.1.1 A: informative icons named by action; decorative SVG `aria-hidden`; charts have a short `aria-label` plus a data table (W3C complex images).
60. MDN progress: `<progress>` has a label; indeterminate removes `value`; meter used for scalar ranges.

Motion and media
61. 2.2.2 A: anything auto-moving > 5 s (ticker, carousel, looping media) has a visible Pause/Stop control; hover/focus pause alone is not enough.
62. 2.3.1 A: nothing flashes more than 3 times per second.
63. 2.3.3 AAA (adopt): interaction-triggered motion disabled under `prefers-reduced-motion`; replace slide/scale/zoom/parallax with short fades (HIG Reduce Motion list); avoid animated blur.
64. web.dev: motion is opt-in (`no-preference`); no global `1ms !important` reset.
65. In-app motion, theme, text-size and haptics settings override and default from OS.
66. 1.4.2 A / HIG: no autoplaying audio or video without discoverable controls.
67. HIG haptics: optional, complementary, never the sole signal; `navigator.vibrate` is not available on iOS Safari.

User-preference queries
68. `prefers-color-scheme`: complete light and dark palettes plus `color-scheme`; `light-dark()` supported (Chrome 123, Firefox 120, Safari 17.5).
69. `prefers-contrast: more`: third palette with >= 7:1 text, >= 4.5:1 UI, 2px borders, opaque surfaces.
70. `forced-colors: active`: real borders (transparent border trick), `outline` focus, `currentColor` icons, system colours; `forced-color-adjust: none` only for swatches and canvas (Safari lacks the property).
71. `prefers-reduced-transparency` (Chrome 118 only) plus `prefers-contrast` plus `@supports not (backdrop-filter)` all resolve glass to opaque.
72. `prefers-reduced-data` (Chrome flag only) and `inverted-colors` (Safari only) are optional extras, never required.
73. Apple Materials: Liquid Glass on navigation/controls only, regular variant under text, never in the content layer; every use has a solid fallback.

PWA and platform
74. Viewport meta with `viewport-fit=cover`; docks and sheets pad with `env(safe-area-inset-*)`; `dvh`/`svh` for full height.
75. Standalone display: in-app back and refresh; nothing important only reachable by edge swipe.
76. Navigation bars hold 3-5 destinations with visible labels (Material, HIG).
77. Sheets: swipe-to-dismiss and a visible Cancel/Done; grabber works with assistive tech (HIG).
78. Charts, tickers, keypads, swipe rows and stacked cards follow section 12; slide-to-confirm is a button first.
79. CI matrix: light, dark, contrast more, forced colors, reduced motion at 320, 390 and 768 px wide; manual VoiceOver, TalkBack, NVDA, AX5 and Android 200 percent passes.
80. WCAG 2.2 AA is the gate; WCAG 3 and APCA are watched, not adopted (next review when WCAG 3 reaches Candidate Recommendation).
