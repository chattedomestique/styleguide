# Design DNA: "MEOWIOM" hard-edged window-panel landing page (img3)

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/aa4e260a-image.webp` (1600x1200 RGB; design frame occupies x167-1433, y112-1088 = 1266x976 px).
Analyst: read-only. Nothing under /home/user/styleguide was touched. Scratch crops/scripts live in the session scratchpad (`crops/`, `runs.py`, `wcag.py`).

Legend: **[M]** = measured from pixels (flat area, std ~0 unless noted); **[E]** = estimate/inference; **[G]** = guess.
The shot is a soft/resampled export (ringing around edges), so extreme-pixel values on text (e.g. `#000005`, `#FBFEFF`) are compression overshoot of `#101010` and `#FFFFFF`; I report the nominal value and flag it.

---

## 1. One-paragraph read

A "launcher / dashboard of windows" in a hard, zero-radius, two-polarity system: an **ink** (`#101010`) frame holding a grid of bordered panels, each with a **title bar** (uppercase bold title + one square control at the right). Panels come in three bodies: flat **colour field** with a cropped illustration (indigo / tan / green), **ink** body with a hairline-separated uppercase link list, and **tint** (lavender) body with text. The title-bar polarity is always the inverse of the body (ink bar on colour fields, lavender bar on ink body). A big clipped marquee sits above the grid; a giant fit-to-width wordmark plus a 3-up micro footer sit below. Everything is separated by a periwinkle keyline "gutter" colour. No radii, no shadows, no gradients inside the UI; elevation is carried purely by 2px ink borders and the keyline.

Text contrast is excellent everywhere (9.3:1 to 19:1). The weaknesses are **control affordance, the clipped marquee, tiny/tight all-caps micro-type, inconsistent insets, desktop-only scale, and zero visible interaction states**.

---

## 2. Element inventory (everything visible)

| # | Element | Where (shot px) | Notes |
|---|---|---|---|
| 1 | Page backdrop gradient | outside frame | Dribbble presentation backdrop, NOT UI. `#99C6FF` (TR/left-mid) to `#C9DFFE` (BR). Soft diagonal. |
| 2 | Outer frame | x167-1433, y112-1088 | ink, ~11px thick, sharp corners, **no shadow** (verified: bg just below frame is unchanged `#A7CDFE`). |
| 3 | Periwinkle keyline "U" | x179-183 (L), x1417-1420 (R), y1065-1073 (bottom), y181-185 (under ticker) | ~4-5px, `#C7D2FF`. Open at the top: side bars start at y~122, 10px below the outer top edge. |
| 4 | Marquee / ticker | y113-179 (66px band), text y136-160 visible | ink band, periwinkle uppercase text "...E ARE A DIVERSE TEAM OF ARTISTS BLOCKCHAIN DEVELO...". **Text is clipped at y160/161** (bottom arm of E removed: reads "ARF", "DIVFRSF"), and cut at left/right edges. |
| 5 | Panel COLLECTIONS | x186-487, y188-500 | colour field indigo, ink title bar, empty square control, pixel-art alien (cyan/violet), cropped at bottom. |
| 6 | Panel MEME COINS | x495-794, y188-818 (tall: spans both rows, 300x630) | tint `#A7B3E8`, no visible bar, black title, **ghost** square control, 11-line uppercase paragraph bottom-aligned (y634-786); ~412px empty above it. |
| 7 | Panel EXPLORE | x804-1105, y188-500 | ink body, lavender title bar with **X** control, 5-item link list (GALLERY, TRAITS, RARITY, WHITEPAPER, AIRDROPS). |
| 8 | Panel ROADMAP | x1115-1416, y188-500 | colour field tan `#D2A972`, ink bar, empty square control, alien illustration. |
| 9 | Panel COMMUNITY | x186-487, y507-818 | ink body, lavender bar with **hamburger** control, 5-item link list (DISCORD, TELEGRAM, HOLDERS, PARTNERS, FAQ) bottom-aligned. |
| 10 | Panel MINT | x804-1105, y507-818 | indigo field, ink bar, empty square control, alien seen from behind. Primary-sounding action but styled identically to its neighbours. |
| 11 | Panel SOCIALS | x1115-1416, y507-818 | green field `#A8CF77`, ink bar, empty square control, astronaut illustration. |
| 12 | Wordmark band | y826-1063 | ink band, "MEOWIOM" periwinkle, cap height 132px (y834-965), spans x194-1405 (1211px = 96% of inner width). Glyphs touch/overlap. |
| 13 | Footer micro row | y1042-1051 (cap 10px) | three items: SINCE 2025 (left) / ALL RIGHTS RESERVED (centre) / MADE BY NADNOVA (right); white on ink. |

Not present in the shot: any button, form, toast, modal, icon set, tab bar, or any hover/focus/pressed/disabled state.

---

## 3. Geometry (measured)

Frame layering, outside to inside (horizontal scan at y=600 and vertical at x=300):

| Layer | Thickness | Colour |
|---|---|---|
| outer ink frame | ~11px (x167-177) | `#101010` [M] |
| periwinkle keyline | ~5px (x179-183) | `#C7D2FF` [M] |
| ink hairline gap | ~2px (x184-185) | `#101010` |
| panel (2px ink border, then body) | panels start x186 | see below |

Grid: 4 columns x 2 rows + full-width ticker above and wordmark band below.
- Panel widths: 302 / 300 / 302 / 302 px. Row heights: 312 / 311 px. Cells are almost square (302x312, aspect 0.97).
- Gap between panel outer edges: 8px (487 to 495, 794 to 804, 1105 to 1115); of which ~5px is visible periwinkle and ~1.5-2px is each panel's ink border. Row gap: 500 to 507 (~7px).
- **Checkerboard rhythm:** col1 = [image, list], col3 = [list, image], col4 = [image, image], col2 = single tall text panel. Media/text alternate so adjacent cells never share polarity.
- Content box: wordmark, footer and ticker all span x193-1406 (same left/right edges), i.e. one consistent inner margin (~7px inside the keyline).

Title bar (COLLECTIONS): x192-479, y194-228 = 288x35px. Inset from panel edge: 6px left/right/top. Title cap centre y=211 = bar centre y=211 (vertically centred); left text inset 9-10px, right control inset 5px.
Square control: 26x26px (x449-474, y198-223). 26/35 = 0.74 of bar height; 4-5px top/bottom inset. 1px light top/left edge (`#CED0FA`), 1px darker bottom/right edge (`#9A9EBD`), 1px ink keyline outside. Fill = `#A7B3E8`.
Glyphs in control: X = 14x14px bbox, strokes ~1.3px; hamburger = 16px wide, 3 lines at 6px pitch. Glyph is **54% of control** and **hairline-weight** against 2px borders and 700-weight type.
Link list: row pitch 32px, hairline between rows (`#1D1D1D` to `#2A2A2A` resampled; nominal `#262626`, ~1px), hairline width 238px (EXPLORE, x837-1077) / 268px (COMMUNITY, x200-467).
Paragraph (MEME COINS): 11 lines, pitch 14.3px, cap 10px => **line-height ~1.04**, measure ~28-31 characters, width 232px.

### Shot-scale vs probable source-scale
Four independent values land on round numbers when divided by 0.879 (i.e. the design was probably authored on a ~1440px-wide frame and shown at ~88%): bar 35 to 39.8 (**40**), ticker ~42 to ~47-48 (**48**), link cap-fit ~13.7 to 15.6 (**16**), list pitch 32 to 36.4 (**36**), control 26 to 29.6 (**~30**), border 2 to 2.3 (**2**), keyline 5 to 5.7 (**~6**), outer frame 11 to 12.5 (**12**). [E: inference, not proof.] Useful for picking token values: 2 / 6 / 12 (frame), 40 (bar), 30 (control), 36 (row), 16 (micro text), ~29 (title), 48 (ticker).

### Translation to a 390px phone [E]
Proportional scaling (x0.308 of the 1266 frame) is unusable, so the layout MUST reflow rather than shrink:

| Element | shot px | % of frame width | naive at 390 | recommended at 390 |
|---|---|---|---|---|
| outer ink frame | 11 | 0.87% | 3.4 | 4-8 |
| keyline | 5 | 0.39% | 1.5 | 3-4 |
| panel border | 2 | 0.16% | 0.6 | **2 (never scale)** |
| gutter (visible) | 5 | 0.4% | 1.5 | 6-8 |
| title bar height | 35 | 2.8% | 10.8 | 44-48 |
| square control | 26 | 2.1% | 8.0 | **44x44** (AA floor 24x24) |
| list row pitch | 32 | 2.5% | 9.9 | 48 (min 44) |
| link text (cap 10) | ~14px | 1.1% | 4.3 | 14-16 |
| panel title | ~26px | 2.1% | 8.0 | 20-24 |
| ticker text | ~42px | 3.3% | 12.9 | 16-20 (no clipping) |
| wordmark font-size | ~192px | 15.2% | 59 | fit-to-width via container query |
| footer text | ~14px | 1.1% | 4.3 | 12-14 |

At 390px a 2-up tile grid gives ~183px panels ((390-16-8)/2); "COLLECTIONS" at 24px bold (~150px) does not fit beside a 44px control in a 183px panel, so list/bar panels should go single column (<~480px) and only pure image tiles stay 2-up.

---

## 4. Measured palette

Method: PIL/numpy; median of flat crops (std ~0), listed with crop. Gradient sampled at 10 positions.

| Role | Hex | Measured? | Source crop |
|---|---|---|---|
| ink (frame, list-panel body, title bar on colour fields, ticker band, wordmark band, dark text on light) | `#101010` | yes | (820-1000, 420-490) std 0.2; (200-440, 560-620) std 0; frame x169-176 `#101113`; bottom `#0F110F` |
| periwinkle / paper-200 (keyline, gutters, wordmark, title text on ink, ticker text) | `#C7D2FF` | yes | wordmark mode `#C7D2FF`; keyline `#C6D3FD`; gutter `#C9D1FE` |
| lavender / tint-300 (MEME COINS body, lavender title bars, control fill) | `#A7B3E8` | yes | (520-760, 300-600) std 0 |
| indigo field A | `#4F62BB` | yes | COLLECTIONS (200-260, 240-280) std 0; MINT same |
| tan field B | `#D2A972` | yes | ROADMAP (1125-1190, 240-280) |
| green field C | `#A8CF77` | yes | SOCIALS (1125-1190, 560-600) |
| text on ink (links, footer) | `#FFFFFF` (extreme samples `#FBFEFF` to `#FEFFFF`) | approx | overshoot-limited, nominal white |
| title text on ink bars | `#C7D2FF` (antialiased sample `#C8CDF4`) | inferred | matches wordmark |
| text on light surfaces (titles, paragraph) | `#101010` (samples `#000005`) | inferred | same as ink |
| ticker text | `#C7D2FF` (interior modes `#C9CFF9`/`#E1E7FF`, thin strokes) | inferred | thin glyphs never reach flat colour |
| list hairline on ink | `#262626` nominal (range `#1D1D1D`-`#2A2A2A`) | yes (range) | 1.2-1.3:1 against ink |
| control bevel light / dark | `#CED0FA` / `#9A9EBD` | yes | (449-475, 198-224) |
| page backdrop gradient | `#99C6FF` to `#C9DFFE` | yes | presentation only; do not tokenise |
| illustration accents (content, not tokens) | cyan `#25B1E2`/`#2DC7EC`, violet `#B694E6`/`#9A6BD5`, yellow glow `#F3FF8E`, gold `#D6A90B` | yes | pixel-art only |

Palette logic (transferable): **1 ink + 1 paper + 1 tint + up to 3 flat "field" colours**, all cool-periwinkle family except the two warm/green fields that add category variety. Fields are mid-tone (L ~ 0.17-0.45), so **no text sits directly on a field**; text always sits in an ink or lavender bar. That single decision is why contrast is safe.

---

## 5. WCAG 2.2 contrast (computed from measured hex)

L = 0.2126R+0.7152G+0.0722B on linearised sRGB; ratio = (L1+0.05)/(L2+0.05). Thresholds: 4.5 text, 3.0 large text (>=24px or >=18.66px bold) and non-text UI.

| Foreground | Background | Ratio | Use | AA |
|---|---|---|---|---|
| `#C7D2FF` | `#101010` | **12.77** | panel title (~26px bold, large), ticker, wordmark | pass |
| `#101010` | `#A7B3E8` | **9.29** | titles on lavender, paragraph (~14px caps), X/hamburger glyph | pass |
| `#FFFFFF` | `#101010` | **19.03** | link text ~14px, footer ~14px | pass |
| `#A7B3E8` | `#101010` | 9.29 | control fill vs ink bar (non-text) | pass |
| `#C7D2FF` | `#101010` | 12.77 | keyline vs ink (non-text) | pass |
| `#4F62BB` | `#101010` | 3.44 | indigo field vs ink bar (non-text) | pass (thin margin) |
| `#D2A972` | `#101010` | 8.75 | tan field vs ink | pass |
| `#A8CF77` | `#101010` | 10.74 | green field vs ink | pass |
| `#CED0FA` | `#A7B3E8` | **1.37** | control light bevel edge vs its own fill | **fail** (non-text) |
| `#9A9EBD` | `#A7B3E8` | **1.28** | control dark bevel edge vs fill | **fail** |
| `#C0CEF6` | `#A7B3E8` | **1.31** | MEME COINS ghost control edge vs lavender panel | **fail**: control effectively invisible |
| `#C7D2FF` | `#A7B3E8` | 1.37 | keyline vs lavender panel (separation comes from the 2px ink border instead) | fail as colour-only; saved by border |
| `#262626` | `#101010` | 1.26 | list hairline | fail, but decorative (rows also separated by spacing) |
| `#C7D2FF` | `#4F62BB` | 3.71 | HYPOTHETICAL periwinkle text on indigo | fail for body, pass large only |
| `#101010` | `#4F62BB` | 3.44 | HYPOTHETICAL ink text on indigo | fail for body |
| `#FFFFFF` | `#4F62BB` | 5.53 | HYPOTHETICAL white text on indigo | pass |
| `#101010` | `#D2A972` / `#A8CF77` / `#C7D2FF` | 8.75 / 10.74 / 12.77 | hypothetical ink text on tan / green / periwinkle | pass |
| `#A7B3E8` | `#4F62BB` | 2.70 | lavender next to indigo (if ever adjacent) | fail |

Adjacent field colours if ever placed touching (they are not in the shot; keyline separates them): indigo/tan 2.54, indigo/green 3.12, tan/green 1.23 => fields need a keyline or border between them (the 2px ink borders do this).

Two-tone focus ring sanity check (recommended, not in the shot): ring = 2px ink inside + 2px periwinkle outside. Best-of(ink, periwinkle) against each background: ink 12.77, periwinkle 12.77, lavender 9.29, indigo 3.71, tan 8.75, green 10.74, white 19.03 => always >= 3:1 on every palette background, satisfying WCAG 2.4.11/2.4.13 intent.

Bottom line: **every real text pair passes by a wide margin**. The only failing real pairs are the control bevels/ghost control and the decorative hairline.

---

## 6. Shape language

- **Radius: 0 everywhere** [M]. Outer frame corner pixel (168,112) is solid ink with no rounding; panels, bars, controls, keyline are all square. (Ratio vs size: 0/26 = 0%.)
- **Borders:** 2px ink (nominal) around every panel; 1px bevel (light top-left, dark bottom-right) on controls and lavender bars; 1px-ish hairlines in lists. Keyline 5px. Outer frame 11px. So stroke hierarchy: 11 > 5 > 2 > 1.
- **Shadows: none** [M]. Neither soft nor hard offset. Depth = border + polarity + the 1px bevel. The bevel is a faint Win95-style emboss (contrast ~1.3:1), effectively decorative.
- **Spacing rhythm:** observed values 2 / 5-6 / 8 / 10 / 26 / 32 / 35 / 302. Not a clean 4/8 grid at shot scale; at the inferred 0.879 source scale it becomes 2 / 6 / 9 / 12 / 30 / 36 / 40 / 344, close to a 6-based or 4/8 mix. Recommendation for tokens: base 4px, steps 2,4,6,8,12,16,24,32,48; control 32 (desktop)/44 (touch); bar 40/48; row 36/48.
- **Icon size / container:** glyph 14-16px in 26px square (0.54-0.62 ratio). Suggest glyph 16-20 in 32-44 container, 2px stroke.
- **Touch targets (shot):** control 26x26 (meets WCAG 2.5.8 AA 24x24 by 2px, fails 44pt/48dp), list row 32px high x full width (AA ok, below 44), link text 14px.

---

## 7. Typography

Fitting method: downloaded Archivo and Inter Tight variable fonts (Google Fonts, OFL), measured real text widths/cap heights in the shot, computed the letter-spacing each candidate would need to reproduce the measured width. A face is a good match when the required tracking is small and consistent.

| Role | Measured | Best fit (OFL, self-hostable) | Fit result |
|---|---|---|---|
| Panel title | cap 18.5px (incl. overshoot) => ~25-26px; widths COLLECTIONS 173, MEME COINS 157, EXPLORE 110, COMMUNITY 158 | **Inter Tight 700** | required tracking +0.001, +0.001, -0.001, 0.000 em: essentially zero, all four consistent. Archivo 700 @wdth100 would need -0.07 to -0.13em, so it is narrower than Archivo. Neo-grotesque (Helvetica Now/Inter Display-like). |
| Link / footer / micro caps | cap 10px => ~13.7px; GALLERY 56, WHITEPAPER 80, AIRDROPS 63, ALL RIGHTS RESERVED 137 | **Inter Tight 600** | tracking -0.029 to -0.033em consistent (so tight tracking is deliberate). Probably 16px source scale. |
| Paragraph | 13.7px caps, line pitch 14.3 (lh ~1.04) | Inter Tight 500-600 | |
| Ticker | cap ~30px (visible 25 + clipped ~5), ~41-44px; "ARE A DIVERSE TEAM" = 439px | Inter Tight 500-600 at +0.0 to +0.05em, or Archivo wdth100 w500 at 0 tracking | source probably 48px. [E] |
| Wordmark | cap 132px (font-size ~190px); M 191 / E 141 / I 50 / O ~170 px wide; total 1211px | **Archivo, wdth ~110-125, wght 700-900**, or a commercial extended grotesque (Monument Extended Ultrabold / Druk Wide class) | per-glyph widths match Archivo wdth110 w700 within ~4% but total width then needs +0.09em tracking while the real glyphs touch, so the original face is wider on O/W. Moderate confidence only [G]. |

Recommendation: **one variable family (Inter Tight or Inter) for UI + titles, one optional width-axis display face (Archivo, verified variable: wght 100-900, wdth 62-125, latin woff2 = 90,104 bytes)** for wordmark/ticker. Keep both self-hosted `font-display: swap`, subset to Latin. Offer a system-font fallback stack so the tokens still work with no webfont.

Scale (shot px, cap-height-derived; source scale in brackets):
- micro caps ~14 (16), title ~26 (29), ticker ~42 (48), wordmark ~190 (217). Ratios 1 : 1.86 : 3.0 : 13.6 relative to micro. **No mid-size body tier**: the system jumps from 14px caps to 26px titles, so real sentence-case body text and captions need tokens (16/18) added.
- Weights: 700 (titles), 600 (links/footer), 500 (paragraph/ticker), 800-900 (wordmark).
- Tracking: titles ~0; micro caps **-0.03em** (too tight; see problems); wordmark negative/zero with glyph collisions.
- Case: **everything is uppercase** including a 4-sentence paragraph.
- Numerals/dates: none in the shot except "2025" in the footer, same weight and size as surrounding caps (no special numeral treatment; no tabular figures shown). Add `font-variant-numeric: tabular-nums` for data later.

---

## 8. Components (anatomy, states, accessibility)

### 8.1 Frame / shell
Anatomy: ink outer frame (11) + periwinkle keyline U (5) + 2px ink gap + content; optional top ticker band; bottom wordmark band.
States: static. Needs: `<body>` landmarks (`header` ticker, `main` grid, `footer`), safe-area padding (`env(safe-area-inset-*)`) for PWA, reflows at 320 CSS px (WCAG 1.4.10).
A11y trap: the keyline is a background/gap colour => disappears in `forced-colors` mode. Use real `border`/`outline` for anything that conveys structure.

### 8.2 Panel ("window")
Anatomy: `.panel` (2px ink border) > `.panel__bar` (title + control) + `.panel__body` (media | links | prose). Variants by body: `field` (flat colour + media), `ink` (link list), `tint` (prose). Polarity rule: bar = inverse of body.
Observed states: default; open-with-X (EXPLORE); menu (COMMUNITY); ghost (MEME COINS). Implied, not shown: collapsed, hover, focus, pressed, disabled, loading/empty.
A11y: `<section aria-labelledby>` with real `<h2>`; bar control = `<button type="button" aria-expanded aria-controls aria-label="Collapse Explore">`; body `hidden` when collapsed; whole image tile optionally a single link with visible focus ring.

### 8.3 Title bar + square control
Anatomy: 35px bar, uppercase 700 title left, 26px bevelled square right, glyph inside.
States needed: default (raised bevel), hover (fill to periwinkle), pressed (bevel inverted + 1px nudge), focus-visible (ink+periwinkle double ring, offset 2px), disabled (`aria-disabled`, dashed border, still >=3:1), toggled (`aria-expanded` glyph change).
A11y fixes: never ship an empty square (5 of 7 are empty = look like unchecked checkboxes); one glyph per meaning with a visible/accessible name; 44x44 hit area (can be transparent padding around a smaller 32px visual); glyph stroke 2px.

### 8.4 Link list
Anatomy: `<nav><ul>` rows 32px pitch, uppercase 600 ~14px, 1px hairline between rows, left inset, optional bottom- or top-align.
States implied: hover, focus, pressed, current, visited not needed.
Needs: row = one `<a>` filling the width, min-height 44px, `aria-current="page"` plus a non-colour marker (leading square/arrow), hover = row inverts to periwinkle with ink text (12.77:1), focus ring drawn **inset** so `overflow:hidden` doesn't clip it, divider as `border-bottom` and optionally raised to >=3:1 (`#666` = 3.31) if rows otherwise lack boundaries. Consider external-link glyph + `rel`.

### 8.5 Colour-field media tile
Anatomy: flat field fill, illustration centred and cropped by the bottom edge (char ~70% of tile height), bar floating on top with 6px margin.
Needs: meaningful `alt` or `alt=""` if decorative, `object-fit`, reserved aspect-ratio to prevent layout shift, field colour from a token set (`--field-a/b/c`), image never carries text.

### 8.6 Tint prose panel
Anatomy: lavender body, ink text, bottom-aligned paragraph, lots of empty space.
Needs: sentence case, >=16px, line-height >=1.5, measure 45-75ch, top-aligned default; an **empty-state** pattern for when there is no content; fix the ghost control.

### 8.7 Marquee / ticker
Anatomy: ink band 66px, periwinkle uppercase text ~42px, continuous leftward scroll (implied), clipped by overflow.
A11y: WCAG 2.2.2 (auto-moving > 5s needs pause/stop/hide): add a pause button; pause on hover/focus-within; `prefers-reduced-motion: reduce` => static wrapped text; expose the text once to assistive tech and mark the looping duplicate `aria-hidden`; line-height >= 1.2 and padding so glyphs are never clipped; never put essential info only here.

### 8.8 Wordmark band + footer row
Anatomy: fit-to-width display word (cap ~132px, 96% of inner width), 3-up micro footer (start / centre / end).
Needs: `container-type:inline-size` with `font-size: calc(100cqi / n)` (or clamp) so it scales on phones; keep brand as real text (`aria-label`/`<h1>` or `<p>` per page design); footer with `justify-content: space-between` leaves the centre item 23px off-centre (text centre x=777 vs frame centre 800); use a 3-column grid (`1fr auto 1fr`) for true centring.

---

## 9. Making the hard style an alternate "surface style" (not a second design system)

The soft, rounded references and this hard one differ only in a small set of **shape/behaviour tokens**; colour ramps and components are shared. Put the shape layer behind an attribute so any container can opt in (islands work through the cascade):

```css
:root, [data-surface="soft"] {
  --shape-radius: 16px;          --shape-radius-control: 12px;
  --shape-border: 1px solid color-mix(in oklab, var(--ink) 14%, transparent);
  --shape-shadow: 0 1px 2px rgb(0 0 0 / .06), 0 8px 24px rgb(0 0 0 / .08);
  --shape-bevel: none;
  --shape-gutter: 12px;          --shape-gutter-fill: transparent;
  --bar-h: 48px;                 --bar-bg: transparent;   /* header, no chrome */
  --label-case: none;            --label-tracking: 0;
  --state-hover: tint;           --motion: 200ms cubic-bezier(.2,0,0,1);
}
[data-surface="hard"] {
  --shape-radius: 0;             --shape-radius-control: 0;
  --shape-border: 2px solid var(--ink);
  --shape-shadow: none;          /* or 4px 4px 0 var(--ink) for a neo-brutal variant */
  --shape-bevel: inset 1px 1px 0 rgb(255 255 255 / .55), inset -1px -1px 0 rgb(0 0 0 / .22);
  --shape-gutter: 6px;           --shape-gutter-fill: var(--paper-200);
  --bar-h: 40px;                 --bar-bg: var(--ink);     /* chrome visible */
  --label-case: uppercase;       --label-tracking: .04em;  /* NOT the reference's -0.03em */
  --state-hover: invert;         --motion: 0ms;            /* steps / instant */
}
```
Components consume only `--shape-*`, `--bar-*`, `--label-*` and semantic colours, so `<div class="panel" data-surface="hard">` and the soft card are the same markup. Rules that keep it one system:
1. Colour tokens stay semantic (`--surface`, `--on-surface`, `--bar`, `--on-bar`, `--field-a..c`, `--keyline`); the hard theme simply maps `--bar` to ink and `--keyline` to paper-200.
2. Focus ring, min target sizes, contrast floors, and reduced-motion behaviour are **surface-independent** (they live in base tokens), so switching style can never weaken accessibility.
3. Gutter-as-colour is implemented with `gap` + container background **plus** real borders so `forced-colors` still shows structure.
4. Dark mode swaps `--ink`/`--paper-*` only; shapes unchanged.

---

## 10. Generic (keep) vs one-off (drop)

Generic, transferable to any PWA/mobile app:
- Titled **panel/window** with bar + single control slot; polarity-inverse bar rule.
- **Field tile**: flat colour + media with text always in a high-contrast bar (launcher/home-screen grid, category tiles, settings hub).
- **Link list** with hairline rows (settings lists, nav drawers, "more" menus).
- **Keyline grid**: colour gutter + bordered cells; checkerboard alternation of media/text.
- **Ticker strip** (announcements, offline/sync status, what's new) once made accessible.
- **Wordmark + 3-up footer band** (about/version/legal).
- Hard surface grammar: 0 radius, 2px ink border, no shadow, optional bevel, caps micro-labels.
- Token palette structure: ink / paper / tint / 3 fields.

One-off decoration: MEOWIOM wordmark, NFT-style pixel aliens, the specific copy, the blue backdrop gradient, "SINCE 2025 / MADE BY NADNOVA", the exact periwinkle/indigo/tan/green hexes (brand; they are starter values), retro-OS bevel (optional), empty checkbox squares (decorative only).

---

## 11. Usability / accessibility problems to fix

1. **Marquee text is clipped** at y160 (glyph bottoms cut; "ARE" reads "ARF"); fixed-height overflow with line-height too small. Also no pause control (WCAG 2.2.2) and no reduced-motion fallback.
2. **Five of seven square controls are empty** and look like unchecked checkboxes; the three that differ (X, hamburger, ghost) mean nothing consistent (X on an already-open panel, hamburger on a panel that is showing its list).
3. **Ghost control on MEME COINS** has edge contrast 1.31:1 against its own fill => invisible; fails WCAG 1.4.11 if interactive.
4. **Control target 26x26px** (desktop-scale); only just above the 24px AA floor; needs 44x44.
5. **Icon glyphs are hairline (~1.3px)** and 54% of a small container; mismatch with 2px borders and 700 type.
6. **All-caps paragraph at ~14px, line-height ~1.04**, 28-31 characters per line: poor readability and fails the spirit of WCAG 1.4.12 (text spacing) and 1.4.8; do not set prose in caps.
7. **Micro caps tracked -0.03em** at 14px (measured) => tightly packed small caps; caps need positive tracking (+0.02 to +0.06em).
8. **No visible interaction states** (hover/focus/pressed/disabled/current) anywhere; keyboard users get nothing (WCAG 2.4.7, 2.4.11, 2.4.13).
9. **Flat hierarchy / no primary action:** MINT (the conversion action) is styled identically to seven other panels; nothing "guides" the user to the next step. Needs a single emphasised primary-panel variant.
10. **Inconsistent insets:** title text starts 9-10px into the bar on most panels but 30px on EXPLORE and 17px on MEME COINS; link list left inset from the panel edge 35px (EXPLORE, text x839 vs panel x804) vs 14px (COMMUNITY, x200 vs x186); hairline right margin 28px vs 20px; EXPLORE list is top-aligned while COMMUNITY is bottom-aligned.
11. **Footer centre item is 23px off-centre** (space-between with unequal item widths).
12. **Wordmark glyphs collide** (E-O 1px gap, O+W merged, W-I 2px) with uneven spacing (12/1/0/2/6/6px); fine as art, bad as the only brand text for dyslexic readers; keep >=0 tracking or give it a text equivalent.
13. **Semantics unclear:** brand (the only H1-level text) sits at the bottom; panel titles aren't obviously links; illustrations have no alt. Give panels real headings and a logical DOM order.
14. **Desktop-only scale:** 8px controls, 10px rows, 4px text if scaled to 390px. Needs rem-based tokens, single-column reflow, 320px reflow support.
15. **Gutter/keyline by background colour** vanishes under `forced-colors`; rely on borders.
16. **Large empty regions** (412px in MEME COINS, ~95px in COMMUNITY) read as unfinished; need an empty-state pattern or content-driven height.
17. **Thin contrast margin for indigo vs ink (3.44)**: passes 3:1 only barely; don't darken the ink or lighten the field further; put any text on indigo in white (5.53), not ink (3.44) or periwinkle (3.71).
18. **Hairline dividers 1.26:1** are decorative only; row boundaries must not rely on them to communicate tap areas.

---

## 12. Strengths to keep

- Extremely strong, consistent **polarity system** (bar inverse of body) that keeps text contrast safe regardless of field colour.
- Tiny palette (ink, paper, tint + 3 fields) with huge ink/paper contrast (12.8:1, 19:1).
- Unambiguous hard grammar (0 radius, 2px border, no shadow): cheap to implement, scales well, prints well, works in forced-colors if built on borders.
- Keyline-gutter grid with checkerboard alternation gives rhythm without decoration.
- Uppercase, bold, short labels that are scannable; single control slot keeps bars uncluttered.
- Fit-to-width wordmark band as a confident brand/footer anchor.
- Consistent content box (ticker, wordmark and footer share left/right edges).

---

## 13. Motion implied

- Marquee: continuous linear horizontal scroll (leftwards), clipped by its container; speed unknown [G ~40-80px/s]. Must have pause + reduced-motion fallback.
- Panel expand/collapse via the X / hamburger slot (implied by glyph change): hard-surface rule = instant or `steps()` <=100ms, no easing/bounce; respect `prefers-reduced-motion`.
- Hover on link rows: likely invert (implied by the polarity system); pressed control: bevel inversion + 1px nudge (Win95 convention).
- No parallax, no shadows animating, no radius morphing.

---

## 14. Confidence / what is a guess

- Hex values for flat fills: measured, high confidence.
- Text colours: nominal values inferred from antialiased/overshoot samples; white and ink are very likely `#FFFFFF`/`#101010`.
- Font identification: fitted by width/cap, not by glyph identification; titles/links to Inter Tight (good fit), wordmark to Archivo wdth110-125 (moderate), ticker (moderate).
- 0.879 source-scale inference: supported by 4-5 round-number coincidences but unproven.
- Interaction states and motion: entirely inferred; none are visible.
