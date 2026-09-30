# Image 8 - BINSOO film-photo app (type-driven editorial, hard-edged)

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/a0471c29-image.jpg` (1200 x 900 JPEG, two iPhone mock-ups on a flat cream page).
Scratch work (measurement scripts, font comparison renders): `/tmp/claude-0/-home-user-styleguide/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/scratchpad/b8/`.

How to read the numbers
- "img px" = pixels in the 1200x900 source. "CSS px" = converted to a 390-wide phone.
- Screen interior measured at 307 img px wide (x 247.5..553 left phone, 646..952 right phone); 390 / 307 = **1.27**. Screen height 663 img px = 842 CSS px, consistent with a 393x852 iPhone canvas (so 1.27-1.28; all CSS px values carry about +/-3 percent).
- Colours are medians/means of flat regions unless noted. JPEG noise is +/-2-3 levels. "rendered" = anti-aliased thin stroke, so the true stroke colour is darker than what is measurable.
- Anything marked GUESS is an inference, not a measurement.

---

## 1. Inventory

Two screens, one flat cream page (#e3e3d7, std 0 - a perfectly flat fill). Only chrome on the page: wordmark "BINSOO" (top, presentation) and "[HOME_SCREEN]" mono caption (bottom, presentation). Phone bezels (6 img px, #040202) and Dynamic Island are mock-up, not UI.

**Screen A - Home (library)**
1. Status bar (OS chrome, ignore).
2. Hamburger menu icon, top-right (three hairline strokes).
3. Decorative hand-drawn contour/ridge line crossing behind the headline (1 px, dark grey).
4. Display headline "BINSOO / STUDIOO" (two lines, extended black uppercase).
5. Masonry grid, 2 columns, 4 tiles. Each tile = photo (full-bleed to tile edge, square corners) + attached solid-black caption bar containing (a) mono date in white, two lines "MAR 29 / 2024." and (b) a 3-cell palette chip with 1 px light outline.
6. Floating dock (dark rounded rectangle, bottom-centre, overlapping grid) with three icon-only items: photo thumbnail (rounded square), frame-with-plus (add/crop), document-with-star.
7. Home indicator (OS).

**Screen B - Detail ("recipe")**
1. Back arrow, top-left.
2. Display headline "APR 07 / 2024." (date as page title, extended black uppercase, trailing full stop).
3. Full-bleed hero photo, 4:3, no radius.
4. Palette strip: 6 flush square swatches, no gaps.
5. Entry row: square thumbnail + eyebrow label "NATURE" (bold mono caps) + value "SAIGON / Black & White" (regular mono, mixed case).
6. Key/value grid in mono: label (bold caps) over value (regular), column-major, 2 rows; third column clipped by the screen edge ("TEMPE", "27.").
7. 1 px hairline divider.
8. Bottom action bar: round "..." icon button, outlined SHARE (secondary), solid black USE RECIPE (primary).

Data revealed by the grid order: BRIGHTNESS, CLARITY, HIGHLIGHTS, SHARPEN, TEMPERATURE in column-major order is exactly alphabetical (col 1 = BRIGHTNESS/CLARITY, col 2 = HIGHLIGHTS/SHARPEN, col 3 = TEMPERATURE/empty). So this is a 2-row, column-flow grid that overflows horizontally, not a wrapped 3-column grid.

---

## 2. Measured colour (real pixels)

| Role | Hex | Where sampled | Notes |
|---|---|---|---|
| Page / paper (only surface) | **#e3e3d7** | 5 separate regions, std 0 | warm pale olive; in-screen "empty" areas are identical (no second surface tone) |
| Ink / black | **#000000** | caption bars (#000000, #000100), USE RECIPE fill (#000000), headline glyph interior (#020202), date stems (#010104), Dynamic Island | one black for text, fills, icons, bars; no grey ramp |
| Text on black | **#ffffff** | caption date lightest 30 px = #fcfcfc, USE RECIPE = #ffffff | |
| Floating layer (dock) | **#222221** | dock interior (std 3) | only other UI neutral; ~#222 |
| Hairline rule | #d3d3c7 | 1 px row at y=692 above action bar | 1.17:1 vs paper - decorative only |
| Outline stroke (SHARE, rendered) | #4a4a40 | SHARE border, 1 px | true stroke almost certainly #000 at ~1 CSS px, dimmed by AA |
| Contour line (decor, rendered) | #5f5f53 | ridge line behind headline | 1 px, likely #000 at reduced opacity or grey stroke |
| Icon strokes (rendered) | #1c1c13 hamburger, #010100 back arrow, #060600 ellipsis ring | | black 1-1.5 px strokes |
| Chip outline | observed #bacbc3 / #9b9fa2 / #b3b3b1 (AA-dimmed) | 1 px frame around every 3-cell chip | GUESS: #ffffff at 1 CSS px |
| Phone bezel (mock-up only) | #040202 | 6 img px | ignore |

**No accent colour exists.** All colour in the UI comes from photo content and the palette swatches derived from it. UI chrome = paper + ink + white + one dark grey.

Swatch values (content-derived, medians of flat cells):
- Detail palette strip (6 cells, y 516..534, x 659..771): #67a1a9, #b8b099, #80a8aa, #193829, #507047, #40583f (cell about 19 x 19 img px = 24 x 24 CSS px, squares).
- Home chips (3 cells, each about 11 img px = 14-15 CSS px): tile 1 about #759a82 / #245a4e / #6e915b; tile 2 about #383f4f / #d3ae5e / #180d1b; tile 3 about #5a5a5f / #a5aaae / #4e5357; tile 4 greys about #7a7a7a / #686868 / #323232.

---

## 3. Contrast (WCAG 2.x ratios from measured hex)

Text and UI pairs:

| Pair | Ratio | Verdict |
|---|---|---|
| Ink #000 on paper #e3e3d7 - display headline (large) | **16.24:1** | passes AAA (large needs 3) |
| Ink on paper - 12 px bold mono labels (BRIGHTNESS, NATURE) | **16.24:1** | passes AAA; the risk is size, not contrast |
| Ink on paper - 16 px regular mono values / SAIGON line | 16.24:1 nominal (thin strokes render as low as #29291e = 11.35:1) | passes |
| Ink on paper - SHARE label (16 px bold) | 16.24:1 | passes |
| White #fff on black - caption date (14.5 px) | **21.00:1** | passes; by construction independent of photo |
| White on black - USE RECIPE | 21.00:1 | passes |
| White on dock #222221 - dock icons | 15.92:1 | passes (non-text needs 3) |
| Dock #222221 vs paper | 12.31:1 | passes |
| **Dock #222221 vs black caption bar (where they overlap)** | **1.32:1** | **FAIL** non-text 3:1 - the dock dissolves into the tile captions and has no outline or shadow |
| Hairline #d3d3c7 vs paper | 1.17:1 | fails 3:1 but is decorative; nothing depends on it |
| Contour line #5f5f53 vs paper | 5.00:1 | passes; but it runs behind/through "BINSOO" glyphs |
| SHARE border (rendered #4a4a40) vs paper | 6.92:1 (true stroke likely 16:1) | passes |
| Hamburger/back/ellipsis strokes vs paper | >13:1 | contrast fine; 1-1.5 px strokes are visually weak |

Swatches vs paper (non-text, only relevant if swatches must be perceivable as objects):

| Swatch | vs paper #e3e3d7 | verdict |
|---|---|---|
| #67a1a9 | 2.24 | fail 3:1 |
| #b8b099 | 1.67 | fail |
| #80a8aa | 2.00 | fail |
| #193829 | 9.91 | pass |
| #507047 | 4.33 | pass |
| #40583f | 6.05 | pass |
Adjacent swatch boundaries: 1.34, 1.20, 4.94, 2.29, 1.40 (teal/tan, tan/lt-teal, lt-teal/dk-green, dk-green/mid-green, mid-green/olive) - mostly below 3:1, and there is no outline or gap. The strip has no border, so its overall silhouette also fails 3:1 at three of six cells.

Chips vs black caption bar: #759a82 6.70, #245a4e **2.65**, #6e915b 5.86, #383f4f **1.99**, #d3ae5e 9.99, #180d1b **1.11**, #5a5a5f 3.06, #a5aaae 8.96, #4e5357 **2.70**. Near-black cells would be invisible; the **1 px white-ish outline (21:1 on black) is what makes them perceivable** - a good, reusable device (see section 10).

Tiny-label quantification: the brief calls the mono labels "9-10 px". Measured: in the source picture the label em is about 9.4 img px; at the design's 390-px canvas it is **12 CSS px** (cap height 7 img px = 8.9 CSS px, advance 5.8 img px = 7.4 CSS px = 0.612 em x 12). Contrast is 16.24:1, so even very small text passes by a wide margin. What fails at this size is **legibility of bold uppercase monospace with zero tracking**, not ratio. If a generic system ever softens these labels to a "muted ink", thresholds on #e3e3d7: #6b6b5f = 4.17 (FAIL), #767668 = 3.56 (FAIL), **#5c5c50 = 5.23 (pass)**, **#55554a = 5.83 (pass)**. Recommendation: keep labels in full ink, or mute no lighter than about #5c5c50.

---

## 4. Shape language

Radii (the point of the style):
- Tiles, photos, caption bars, swatches, chips, thumbnails (detail), SHARE, USE RECIPE: **radius 0**. All hard edges.
- Dock: **rounded rectangle, radius about 14 img px = 18 CSS px**, height 45 img px = 57 CSS px, so radius/height = 0.31 - not a full pill (the brief says pill; fitting r=14 to the top-left arc gives insets 8.8/6.8/4.2 px at 1/2/4 px down, matching measured 9/6/4). Width about 181 img px = 230 CSS px, centred horizontally (centre x 400.0 vs screen centre 400.25).
- Dock photo thumbnail: rounded square, r about 7 img px = 9 CSS px on a 30 px box (0.30).
- Ellipsis button: full circle, diameter 22 img px = 28 CSS px, about 1.5 px ring.
- So the system has exactly one "soft" rule: **floating/overlay = rounded, everything else = square**. That is a transferable semantic (rounded means "sits above the page").

Borders: SHARE 1 px ink outline; chips 1 px light outline; hero/tiles no border; the rest flat. Shadows: **none anywhere** (checked under and beside the dock: straight from #222 to paper, no halo). Depth is conveyed by value (black bars, dark dock), not elevation.

Spacing rhythm (CSS px @390; base unit 4, working step 8, structural step 16):
- Home: side margin about 10-11 (nearest 4-grid token: 12); column gutter about 7 (token: 8); tile width 183; row gap about 7.
- Detail: side margin **16** (headline x=659 and button right edge 940 both 13 img px = 16.5 CSS px from the screen edge).
- Caption bar: height about 63.5 (16 x 4); inner padding 16 left, 16 top, 15 bottom; line pitch 21.6 (14.5 px font at 1.5 leading).
- Vertical rhythm on detail: hero to swatches 16; swatches to entry row 16; entry row to grid 16; grid row pitch 65; divider to buttons 16; blocks are consistently **16 apart**.
- Headline block: back arrow to headline top about 23; headline to hero only about 11 (tight, headline hugs the image).
- Palette cell 24 x 24; thumbnail 49.5 (token 48 or 52); chip cell 14-15; dock icons 30.
- Key/value column pitch 171 CSS px = 10.7 rem (3 columns = 513 CSS px inside a 358 px content width, hence the clip).

Touch targets (CSS px @390):
- USE RECIPE 180 x 51, SHARE 122 x 51: pass (>= 44). Gap between them 13; ellipsis to SHARE 16.5.
- Ellipsis ring **28 x 28**: passes WCAG 2.5.8 (24) but below the 44 recommended; needs padding to 44.
- Hamburger glyph **18 x 15**, back arrow **20 x 14** (strokes 1.3-1.5 px): glyphs are far below 24; hit area must be padded to >= 44 x 44 (their intended hit box is unknown - GUESS: padded).
- Dock items: pitch 86 CSS px x 57 tall if the whole cell is tappable (passes); the drawn icon is 30.
- Tiles: 183 x (about 190-330): pass.

Icons: stroke about 1.3-2.5 CSS px, outline style, geometric; sizes 18-30. Stroke weights are inconsistent (hairline hamburger/back vs 2.5 px dock glyphs) and too light next to 900-weight display type.

Photos: hero 4:3 (307 x 230 img). Tile photo aspects: 1.36, 1.45 (landscape), about 0.81, about 0.68 (portrait) - genuine masonry. All flush, no radius, no border.

---

## 5. Typography

### Display face (extended, black, uppercase)
Measured on "BINSOO / STUDIOO" (home) and "APR 07 / 2024." (detail):
- Flat cap height **25.2 img px = 32 CSS px** (home), **27 img px = 34 CSS px** (detail).
- Line pitch 34 img = 43 CSS (home) -> about **0.93 x font size**; detail 37 img = 47 CSS -> about 0.94.
- Implied font size (for cap-height ratio 0.686): about **46-47 px** home, **50 px** detail (about 12 vw / 12.8 vw at 390).
- Stem thickness / cap height: I-stem 9.5-10 px on 25.2 cap = **0.377** (Black/Ultra weight, about 900).
- Glyph widths / cap: B 1.31, N 1.35, S 1.19, O 1.35 (a normal grotesk bold is about 1.0) - roughly **130 percent of normal width** ("Extended"). Gaps between glyphs about 2 img px (tight; letter-spacing about -0.02 em).
- String ink width / cap: BINSOO **7.26**, STUDIOO **8.30**, "APR 07" about 6.96, "2024." about 5.6.
- Treatments: uppercase; 2 lines max; lines stack with almost no leading; trailing full stop on dates ("2024.") used as a brand mark; numerals share the wide round "0" with the letter "O" (07 reads as O7); the home headline is left-aligned at the grid margin, widths fill about 60-68 percent of the screen (BINSOO 232 CSS, STUDIOO 265 CSS px).
- Likely original (GUESS, low confidence): Monument Extended Ultrabold / Druk Wide class.

Candidate test (I rendered each at cap-height-matched size; ratios are ink-width / cap-height, tracking 0). Target row first.

| Font (OFL) | stem/cap | B | N | S | O | BINSOO | STUDIOO | APR 07 | 2024. | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| **TARGET** | .377 | 1.31 | 1.35 | 1.19 | 1.35 | 7.26 | 8.30 | ~6.96 | ~5.6 | |
| **Archivo, wdth 125, wght 900** | .360 | 1.19 | 1.25 | 1.17 | 1.33 | 7.43 | 8.73 | 6.69 | 5.12 | **best overall**; with -0.02 em tracking BINSOO -> about 7.26; real `wdth` axis 62-125, `wght` 100-900; pinned latin instance **13.6 KB woff2** (25 KB for wght 700-900); Google latin var file 90 KB |
| **Anybody, wdth 120, wght 900** | .367 | 1.14 | 1.34 | 1.18 | 1.24 | 7.29 | 8.33 | 6.57 | 5.09 | strings match almost exactly; wdth 130 overshoots (7.88/9.02); axis wdth 50-150, wght 100-900; 57 KB var |
| Unbounded 900 | .343 | 1.12 | 1.17 | 1.07 | 1.22 | 6.71 | 7.71 | 6.19 | 5.13 | about 8 percent narrow, rounder "tech" forms; single axis; 51 KB |
| Dela Gothic One (400 only) | n/m | 1.12 | 1.15 | 1.16 | 1.22 | 7.23 | 8.46 | 6.25 | 5.10 | strings OK, only one weight, quirky; 14 KB |
| Syne 800 | .391 | 1.62 | 1.81 | 1.54 | 1.89 | 10.07 | 12.08 | 9.38 | 6.93 | far too wide (+39 percent); not a match |
| Krona One | .203 | 0.99 | 1.03 | 1.14 | 1.14 | 6.64 | 7.67 | 6.15 | 4.89 | too light |
| Bricolage Grotesque | .25 | 0.83 | 0.93 | 0.83 | 0.92 | 5.13 | 5.84 | 4.72 | 3.79 | **`wdth` axis is 75-100 only (condensed to normal) - cannot go extended**; 29 percent too narrow; drop it for this role |
| Syncopate 700 / Michroma | .27 / .12 | | | | | 7.62 / 7.24 | | | | too light |

Recommendation for the generic system: a single `--font-display` token resolved to **Archivo at `font-stretch:125%; font-weight:900`** (one variable family also serves normal-width UI if needed; a pinned static instance keeps the editorial theme's cost to about 14 KB). Anybody is the alternate if a wonkier feel is wanted. Both are OFL and self-hostable.

### Data / UI face (monospace)
- Identified as **Space Mono** (GUESS, medium-high confidence: distinctive N, &, k, W shapes; measured advance = 0.603-0.614 em at every size vs Space Mono 0.612 - letter-spacing is therefore 0).
- Measured sizes (from advance pitch / 0.612): 
  - micro label (BRIGHTNESS, NATURE): pitch 5.6-5.8 img px = 7.1-7.4 CSS -> **12 px**, **bold**, uppercase, cap-height 8.9 px;
  - caption date (MAR 29 / 2024.): pitch 7.0 img = 8.9 CSS -> **14-14.5 px**, bold-ish (GUESS), uppercase, line pitch 21.6;
  - value / entry line (-24.0, SAIGON / Black & White): pitch 7.6-8.0 img -> **16 px**, regular, mixed case for names, digits with ".0" precision;
  - button label (SHARE, USE RECIPE): pitch 7.7-7.75 img -> **16 px**, bold, uppercase.
- So the whole type scale is **12 / 14.5 / 16 / 47-50** - four sizes, two families, two weights per family at most.
- Weight is the main hierarchy device in the data face: bold caps label over regular value.
- OFL mono alternatives: JetBrains Mono (advance 0.600, variable 100-800, **dotted zero**, bigger x-height 0.55 - best for 12 px labels; 40 KB var), IBM Plex Mono (0.600, 400/500/600/700; 14.7 KB each), DM Mono (0.600, 300/400/500, **slashed zero**; 15 KB), Space Mono (400/700 only; 16.5 KB each; plain oval zero, distinctive "1"). If the editorial theme should be a faithful reproduction, Space Mono; if legibility of tiny data matters more, JetBrains Mono (and use `font-feature-settings:"zero"` where supported).
- Numerals: values show one decimal with tabular (monospace) alignment; negatives use hyphen-minus, which is not read as "minus" - use U+2212.

### Case, tracking and assistive tech
- Author text in normal case and apply `text-transform:uppercase` via a token (`--label-transform`); never type the capitals in the source. Reason: transform is presentational, the DOM keeps "Brightness", search/copy/translation keep working, and screen readers are less likely to spell short all-caps words letter by letter. (Exact SR behaviour varies by engine - test VoiceOver and NVDA; do not assume.)
- Dates: use `<time datetime="2024-03-29">Mar 29 2024</time>`; the trailing "." is decoration, render it with CSS `::after { content:"." / "" }` so it is not announced as "period".
- Dyslexia/readability: all-caps single words and short date strings are fine; do not use all-caps for running text or strings over about 3 words. Monospace helps with uniform spacing but costs width (16 px mono holds about 36 characters in a 358 px column). Add **+0.04 to +0.08 em tracking** to 12 px uppercase labels (the source has 0) - this also helps WCAG 1.4.12 (users may override to 0.12 em, layouts must survive it).
- Headline has -0.02 em tracking and 0.93 leading; layouts must not clip when users force line-height 1.5 and letter-spacing 0.12 em: no fixed heights, no overflow hidden on the title block; size with `clamp()` so the longest word (STUDIOO at about 5.9 em) fits 288 px (320 px viewport minus gutters): 288/5.9 = 48 px max, and 11.9 vw (46 px @390) is safe.
- The display face's "0" and "O" are the same shape, and Space Mono's zero is an undotted oval; in any context where ids or codes can contain both, pick a face with a dotted/slashed zero or enable `zero`.

---

## 6. Components (anatomy, states, accessibility)

**6.1 Display heading / page title**
Anatomy: uppercase extended black text, 1-2 lines, tight leading, optional decorative full stop. States: static. Variants: title (home) and date-title (detail, `<h1><time>`). A11y: a real `<h1>`; do not clip or fix height; decorative contour line is `aria-hidden` and sits behind text.

**6.2 Icon button (hamburger, back, ellipsis)**
Anatomy: bare outline glyph 18-28 px, no container (ellipsis has a 28 px ring). States implied: default, hover, pressed (invert to a black square with paper glyph would be consistent), focus, disabled. A11y: `<button>` with `aria-label` ("Menu", "Back", "More actions"); ellipsis needs `aria-haspopup="menu"` + `aria-expanded`; hit area >= 44 x 44; use 2 px strokes so it matches the heavy type; hamburger: expanded state communicated (`aria-expanded`), not colour.

**6.3 Media card (tile with inverse caption bar)**
Anatomy: photo (object-fit:cover, natural aspect) + attached caption bar (solid ink, 16 px padding) with mono date (left) and swatch chip (right, top-aligned with the first text line). States implied: default, hover/pressed (caption inverts to paper/ink, or a 2 px ink outline), focus (outline >= 2 px with offset), selected (for multi-select: check mark + outline, not colour), loading (skeleton), missing image. A11y: the whole tile is one `<a>`/`<button>` with an accessible name built from title + date (`aria-labelledby` pointing at the caption); `<img alt>` describes the photo or is `alt=""` if the name already carries it; chip is `role="img"` with a text alternative ("Palette: sage green, dark teal, olive") or hidden text hex list; caption text white on black 21:1 - keep it.

**6.4 Masonry grid**
Anatomy: 2 columns, 7 px gutter, 10-12 px margins, tiles of differing heights. Implementation notes: CSS `columns:2` with `break-inside:avoid` (DOM order = visual order per column), or a 2-column flex/grid with items distributed at render time; ensure tab order follows the visual reading order. Responsive: 2 columns at 320-599, 3-4 above. A11y: `role="list"` with `<li>` per tile; announce the count; provide a non-masonry fallback (single column) for `prefers-reduced-motion`/reflow is unnecessary but ensure no horizontal scroll at 320 px.

**6.5 Floating dock**
Anatomy: dark rounded rectangle (230 x 57, r 18, #222221) with three icon-only items (30 px, white) on an 86 px pitch; sits 50 CSS px above the bottom edge, centred, overlapping content; no shadow, no outline, no labels, no visible active state. States implied: default, active/current, pressed, focus, disabled. A11y: `<nav aria-label="Primary">` with a `<ul>` of links/buttons, each with a text label (visible label or `aria-label`), `aria-current="page"` on the active one plus a **non-colour** active indicator (underline bar, filled icon, or label); give the dock an outline (1 px white-ish, 3:1 vs neighbours) because #222 on #000 is 1.32:1; reserve space so it never covers content (`padding-bottom = dock height + bottom offset + safe-area`, `scroll-padding-bottom`), required by WCAG 2.2 2.4.11 Focus Not Obscured; respect `env(safe-area-inset-bottom)`; consider auto-hide on scroll down with `prefers-reduced-motion` fallback.

**6.6 Swatch strip / palette chip**
Anatomy: row of flush square cells (strip: 6 x 24 px; chip: 3 x 14-15 px with 1 px light outline); colours derived from the photo. States: static; optionally interactive (tap to copy hex). A11y: colour is the data, so **it must not be colour-only**: expose each cell as a list item with a text colour name + hex (visually hidden, or shown on focus/tap, or in an expandable list); group `role="list"` + `aria-label="Colour palette"`; if purely decorative redundancy, `aria-hidden` but then the info is lost - do not hide unless hex list exists elsewhere. Add a 1 px ink outline on paper (strip has none: three cells fail 3:1) and keep the white outline on inverse (chips).

**6.7 List row (thumbnail + eyebrow + value)**
Anatomy: 49.5 px square thumbnail, 8 px gap, eyebrow label (12 px bold caps) above value (16 px regular). States: default, pressed, focus; a chevron or affordance is absent (the row may not be interactive - ambiguous). A11y: if interactive, one `<a>`; if not, render as plain text with the thumbnail `alt=""`.

**6.8 Key/value grid (description list)**
Anatomy: label (12 px bold caps, ink) over value (16 px regular), 171 px column pitch, 65 px row pitch, column-major 2 rows, overflow to the right. States: static. A11y: `<dl>` with `<div><dt>Brightness</dt><dd>-24.0</dd></div>` groups (HTML allows div wrappers). Scrollable overflow: `<div role="region" aria-label="Adjustments" tabindex="0">` so keyboard users can scroll, plus `scroll-snap-type:x proximity` and visible edge cue (fade mask or peek, which the source already does). Reflow: WCAG 1.4.10 flags two-axis scrolling at 320 px; a horizontal strip of key/value pairs is not a data table, so the safe default is a **wrapping grid** (`repeat(auto-fill,minmax(9rem,1fr))`, 2 columns at 390) and the scroller only as an opt-in variant. Use U+2212 for negative numbers. Keep label text in the DOM in natural case.

**6.9 Action bar**
Anatomy: bottom bar (16 px padding, 16 px gap): tertiary icon button (28 ring) + secondary outline button (flex about 2) + primary solid button (flex about 3; width ratio 96:142 img px). Divider hairline above. States: default/hover/pressed/focus/disabled/loading. Hierarchy = fill (primary), outline (secondary), glyph (tertiary). Buttons: radius 0, 51 px tall, 16 px bold mono uppercase labels, no icon, no shadow. A11y: `<button>`s with visible labels; ring focus (2 px, 3 px offset) must contrast 3:1 against both paper and black neighbours (use ink ring on paper, white ring on ink fills); sticky bar must not obscure focused content (2.4.11); disabled state via `aria-disabled` + `opacity` is exempt from contrast but must not be the only cue; safe-area padding.

**6.10 Hairline divider, status decoration**
Decorative 1 px rule; contour line is pure decoration.

---

## 7. Token-level alternate ("Editorial" theme over the same component set)

Everything above can be the **same component set with different tokens** - no extra components:

| Token | Friendly default (suggested) | Editorial (this image) |
|---|---|---|
| `--radius-surface` (card, media, tile) | 12-16 px | **0** |
| `--radius-control` (button, input, chip) | 10-12 px | **0** |
| `--radius-float` (dock, sheet, toast) | 24 px / pill | **18 px** (0.31 x height) |
| `--radius-thumb` | 8 px | 9 px (dock only) / 0 (rows) |
| `--border-control` | 0 (filled) | **1 px ink** (outlined secondary) |
| `--border-swatch` | 0 | 1 px light on inverse, 1 px ink on paper |
| `--shadow-*` | soft elevation | **none** |
| `--font-display` | friendly sans 700 | **Archivo 125 / 900** |
| `--display-transform` | none | **uppercase** |
| `--display-leading` / `--display-tracking` | 1.1 / -0.01 em | **0.93 / -0.02 em** |
| `--font-data`, `--font-label`, `--font-button` | same sans | **Space Mono** (bold for label/button) |
| `--label-transform` / `--label-size` / `--label-tracking` | none / 13 / 0 | **uppercase / 12 / +0.04 em (fix; source 0)** |
| `--button-label-size` | 15-16 | 16 bold mono caps |
| `--caption-style` | scrim gradient + text | **solid inverse bar** (#000, 16 px padding) |
| `--space-page` | 16 | 12 (grid) / 16 (detail) |
| `--color-surface` | white / tinted | **#e3e3d7** |
| `--color-ink` | near-black | **#000000** |
| `--color-float` | white / tinted | **#222221** |

Transferable mechanics: (1) "rounded means floating" is a one-token semantic; (2) caption-on-image is solved structurally (a solid bar), so contrast never depends on the photo; (3) inverse pairs (ink/paper) make pressed/selected states a pure swap; (4) type scale is 4 sizes, which keeps the system small.

Dark variant (proposal, not in image): swap to `#0b0b0a` page / `#e3e3d7` ink / white bars inverted; chips keep a 1 px outline in ink colour.

---

## 8. Motion implied (none shown, all inferred)

- Tile -> detail shared-element transition: photo expands to the full-bleed hero and the mono caption date morphs into the extended headline date ("MAR 29 2024." -> "APR 07 2024."). Use View Transitions (`view-transition-name` on photo and date), 250-350 ms, ease-out; fallback cross-fade under `prefers-reduced-motion`.
- Dock hides on scroll down, returns on scroll up; 150-200 ms translateY + opacity; no motion for reduced-motion users.
- Pressed state: instant or 80-100 ms ink/paper invert on buttons and caption bars.
- Horizontal key/value scroller with snap; palette strip may fade in left to right.
- Masonry tiles reveal with short fade; no parallax.

---

## 9. Generic vs one-off

Generic (keep):
- Two-surface + one-ink palette; all other colour comes from content.
- Four-step type scale, two families (display + data), weight as hierarchy.
- Solid inverse caption bar under media; chip outline device; label-over-value pattern; column-major key/value list; three-tier action bar (icon / outline / solid); 16 px structural rhythm; floating element = the only rounded element; no shadows; 51 px buttons.
- Date/title as big orienting heading; trailing full stop motif (optional flourish).

One-off (BINSOO brand, do not generalise): the exact cream hue as a brand colour (it is a token), the contour-line illustration, the 3-icon dock contents, the wordmark, the photo-derived palette feature itself (swatches are a component, but the colour extraction is app logic), the "USE RECIPE" language.

---

## 10. Problems to fix (keep the look, fix these)

1. **Dock overlaps content and is nearly invisible on black**: covers caption text of tiles 3 and 4 (date cut off) and is 1.32:1 against the black caption bars. Fix: reserve bottom space, add a 1 px light outline or solid paper border, respect focus-not-obscured.
2. **Dock is icon-only with no active state**: three glyphs (one is a dynamic photo) with no labels or selected indicator. Fix: visible labels (12 px caps) or at least `aria-label`s, plus a non-colour active indicator.
3. **Hamburger (18 x 15) and back arrow (20 x 14) at 1.3-1.5 px strokes**: visually weak next to 900-weight type and below target size; ellipsis ring is 28 px. Fix: 44 x 44 hit areas, 2 px strokes, consistent icon weights.
4. **Clipped third key/value column (TEMPE / 27.)**: text is cut mid-word with no scroll cue or keyboard access; two-axis scroll would fail reflow at 320 px. Fix: wrapping grid by default, scroller variant with region/tabindex and a visible affordance.
5. **Swatches are colour-only** (strip: six unlabeled cells; chips: 14 px cells) and low-contrast at boundaries (cell vs paper 1.67-2.24 for three; adjacent cells 1.2-1.4). Fix: text alternatives with colour names/hex, 1 px outline on paper, optional hex reveal.
6. **Tiny bold-caps mono labels at 12 px** (9.4 px in the picture) with zero tracking: contrast is 16.24:1, but legibility and WCAG 1.4.12 tolerance need attention. Fix: >= 12 px, +0.04-0.08 em tracking, never mute below 5:1 (#5c5c50).
7. **Uppercase source and trailing period**: use CSS transform; render dates in `<time>`; make the "." decorative.
8. **Display face "0" = "O"** and negative numbers with hyphen: use a dotted/slashed zero for data fonts, U+2212 for minus.
9. **Decorative contour line crosses the headline letters** (passes through B/I): reduces local clarity. Fix: place behind, lighten, `aria-hidden`, or end before the text block.
10. **No focus, pressed, selected, disabled or error states shown anywhere**: need a designed focus ring that works on both paper and ink (2 px, 3 px offset, 3:1), and inverse hover/pressed.
11. **Hairline divider 1.17:1** and the SHARE 1 px border being the only outlines: fine as long as nothing depends on them; add 2 px borders on inputs/toggles if the set grows.
12. **Headline hugs hero (about 11 px gap) and fills 60-68 percent of width**: safe at 390 but STUDIOO at 320 px leaves little margin; clamp font size and allow wrap only between words, never mid-word.
13. **Alt text, link names and masonry order** are unspecified; photo tiles need accessible names (title + date), `alt` decisions, and DOM order equal to visual order.
14. **Header spacing**: about 112 CSS px empty band between hamburger and headline on the home screen is decorative space for the contour line; make it a token so apps without the illustration can collapse it.

---

## 11. Quick CSS for the editorial theme (reference only)

```css
:root[data-theme="editorial"] {
  --color-surface: #e3e3d7;
  --color-ink: #000;
  --color-on-ink: #fff;
  --color-float: #222221;
  --radius-surface: 0; --radius-control: 0; --radius-float: 18px;
  --font-display: "Archivo", "Arial Black", system-ui, sans-serif;
  --font-data: "Space Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --display-stretch: 125%; --display-weight: 900;
  --display-leading: .93; --display-tracking: -.02em;
  --label-size: 12px; --label-tracking: .04em; --label-transform: uppercase;
  --shadow-1: none; --shadow-2: none;
}
.display { font: var(--display-weight) clamp(2.25rem, 11.9vw, 3.25rem)/var(--display-leading) var(--font-display);
  font-stretch: var(--display-stretch); letter-spacing: var(--display-tracking); text-transform: uppercase; }
```
