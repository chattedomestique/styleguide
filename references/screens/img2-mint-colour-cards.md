# Image 2 - Mint canvas / colour-card fintech mockup: design DNA

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/814cbc5d-image.webp` (1600 x 1200 px, RGB, converted to `analysis/img2.png` for sampling).
Style family (my name for it): **Outlined Mint Sticker UI** - flat pastel/vivid fills, one tinted canvas, white outlined surfaces with a 1.5 px near-black outline, no shadows, pill/circle controls, one near-black ink used for everything.

---

## 0. How to read the numbers

* All colours are **sampled with PIL/numpy** (median of a flat crop; sd shown when it matters). `measured: true` = read from pixels. Anything eyeballed is labelled `~`/`guess`.
* **Only the centre phone is un-tilted**, so all dimensions come from it. Left phone is rotated ~8 deg CCW, right phone ~8 deg CW (both fitted by maximising row-projection sharpness of text), and both carry a **mock-lighting gradient** (right edge of left phone, left edge of right phone darkens mint, keys and cards). I sampled the un-shaded side of each and treat the shaded values as *not* design tokens.
* Centre phone screen = x 592-1008 = **416 image px** wide. Conversion to a 390 px-wide phone: **px@390 = image px / 1.067** (if the source frame was 393 px the numbers are ~1% smaller; well inside measurement error).
* The picture is a downscaled, sharpened, lossy WebP (ringing overshoot; black text reads as `#000000` though true ink may be `#0A0A0A`). Thin-stroke text/icons are antialiased toward the background, so **the "true" colour of thin glyphs is uncertain**; where that matters I say so.
* Radii: three methods (arc extent, circle fit, 45-degree diagonal intercept) agree to about +/-3 image px. Treat radii as "about".

---

## 1. Inventory (every screen / element)

Backdrop (presentation only, NOT part of the UI): near-black starfield `#1A1C20`-`#23262E` (sampled `#23262E`, `#232428`, `#1F2123`, `#1A1C20`) with light-grey dots (`#D2D3D6`), black phone bezel `#000`, Dynamic-Island pill. Exclude from every token.

### Left phone - "Money Transfer" (send-money entry)
1. Top-left **avatar stack**: two overlapping circular photos (~31 px, ~35% overlap) + dark-green circular `+` (add recipient).
2. Top-right **2x2 dot glyph** (icon-only, ~12 px) - presumably a menu/apps.
3. **Screen title** "Money Transfer", 2 lines, ~38 px.
4. **Funding-source row**: round brand logo (Mastercard, `#FD5E00`) + grey label "Mastercard" + balance "106,547,30"; at right a **circular orange "+" button** (~54 px, dimmed by mock lighting).
5. **Amount display** "$2,568.00" (~46 px, bold).
6. **Keypad**: 12 round white keys with black outline, 4 columns x 3 rows in a staggered honeycomb offset; order is `1 2 3 4 / 5 6 7 8 / (reset) 9 0 (x)` - i.e. reading order 1-8 then 9, 0, not the phone-standard 3x4. Keys ~79 px diameter and almost touching.
7. **Slide-to-confirm**: black rounded track, orange pill knob labelled "Transfer" with outline, four fading grey chevrons (`>>>>`) to the right.

### Centre phone - Home
1. **Greeting header**: "Hi Richards, / Welcome back" (2 lines, ~17 px) + 45 px circular photo avatar with light ring.
2. **Balance card** (white, outlined, ~356 x 234) with a **notched top-right corner** holding a **"With draw" pill button** (arrow glyph + label; sits in a concave cut-out). Contents: label "Your Balance is", hero amount "$45,934.00", **trend row** (teal up-arrow chart glyph + "8,82% (+$876)"), and a **4-up quick-action tile row**.
3. **Quick-action tiles** (x4): Send (green), Bill (yellow), Mobile (purple), All (orange); each an outlined rounded square with a line icon over a ~11 px label.
4. **Stat card A**: brand glyph + "Notion", black **sparkline** with end-dot, "$283.72", delta "+1.7%" with diagonal arrow.
5. **Stat card B**: "Goals Achieved", "68%", **progress bar** (black fill on `#EBECEF` track).
6. **Section heading** "Transactions" (~20 px).
7. **Transaction rows** (x2): coloured rounded-square icon chip (purple w/ up-right arrow; green w/ down-left arrow), title, date-time, right-aligned amount, and a **trend delta** (green up-graph + "2.5%" / red down-graph + "2.5%").
8. **Bottom dock**: black pill container; active item is a wide **green pill with label "Home"**; three inactive items are **round icon-only buttons** (purple card icon, orange calendar icon, lilac gear icon), white glyphs.

### Right phone - All Transactions
1. Avatar stack + `+` (dark grey circle here, deep green on the left phone), 2x2 dot glyph.
2. **Segmented toggle** "Bank account | Transactions": white pill track, selected option = black pill with white text.
3. Heading "All Transactions" (~24 px) + icon-only **filter glyph** (three lines).
4. **Stack of five overlapping full-width coloured cards** (yellow, orange, purple, green, blue): each has a **black circular icon chip** (white glyph, ~38 px), title (~20 px), date top-right (DD.MM.YYYY, ~14 px), signed amount (~25 px), and a **black circular direction-arrow button** bottom-right (~36 px). Each card only shows its top ~115 px because the next card overlaps it; large (~35 px) top corner radius; no stroke, no shadow.

---

## 2. Measured palette

| Role | Hex | Where sampled | Measured |
|---|---|---|---|
| Canvas (screen bg) | **`#C5F2E5`** (HSL 163 / 63% / 86%) | centre-phone bg gaps, left phone unshaded area, right phone (sd 0.0-0.4) | yes |
| Surface (cards, rows, keys, toggle track) | **`#FFFFFF`** | balance card, stat cards, rows, toggle track, keys | yes |
| Ink (text, icons, outlines) | **`#000000`** measured text ink; fills/tracks `#070806`-`#080808` (dock, toggle-selected, progress fill, slide track, arrow buttons) -> treat as one ink ~`#0A0A0A` | all headings/body; dock `#070806`; progress fill `#080808`; slide track `#070707` | yes (true ink 000-0A0A0A uncertain, sharpening) |
| Outline | same ink, **~1.4 px @390** (cards/rows/keys), **~1.8-2 px** (colour tiles) | integrated stroke darkness across edges | yes |
| Progress track | `#EBECEF` | stat card B | yes |
| Accent - Green (saturated) | **`#11B071`** (H156 S82 L38); Home pill `#17AE72` | Send tile (sd 1.7), row icon chip `#11AF71`, dock Home pill (sd 0.8) | yes |
| Accent - Yellow (saturated) | **`#F6DF37`** (H53 S91 L59) | Bill tile (sd 1.6) | yes |
| Accent - Purple (saturated) | **`#8C6EFA`** (H253 S93 L71) | Mobile tile, Google row chip `#8B6EFA` | yes |
| Accent - Orange (saturated) | **`#FEA340`** (H31 S99 L62); Transfer pill `#FEA43E` | All tile (sd 2.1), slide-to-confirm knob | yes |
| Stack card - Yellow (soft) | **`#FBEB6F`** (H53 S95 L71) | right phone, unshaded side | yes |
| Stack card - Orange (soft) | **`#FFAF54`** (H32 S100 L66) | right phone | yes |
| Stack card - Purple (soft) | **`#967AFE`** (H253 S99 L74) | right phone | yes |
| Stack card - Green (soft) | **`#48D19C`** (H157 S60 L55) | right phone | yes |
| Stack card - Blue (soft) | **`#9AD0F0`** (H202 S74 L77) | right phone (only place blue appears) | yes |
| Dock - purple circle | `#6241EC` (H252 S82 L59) | centre dock | yes |
| Dock - orange circle | `#F2A854` | centre dock | yes |
| Dock - lilac circle | `#906BCD` (H263 S49 L61) | centre dock | yes |
| Trend positive (glyph) | `~#2D9882` core (thickest arrow px `#2A957F`-`#4BA792`); rendered thin text `#5B9586` | balance trend arrow, row "2.5%" | yes, but thin-stroke uncertain |
| Trend negative (glyph) | `~#8A2026` core (arrow px median `#923234`, darkest `#7A1A22`); rendered thin text `#763A3C` | Apple row | yes, thin-stroke uncertain |
| Secondary text | `#4D6A63`-`#576F69` (darkest px of "Mastercard" label) on mint; probably ink at ~65% alpha | left phone | yes (thin) |
| Brand orange (Mastercard) | `#FD5E00` | logo disc | yes |
| Avatar "+" (left) | `#1C4E44` deep green | left phone (sd 1.7) | yes |
| Avatar "+" (right) | `#2F2F2F` dark grey | right phone | yes (maybe shaded) |
| Slide-track chevrons | `#525152` brightest px on `#070707` | left phone | yes |
| Orange "+" button (as seen) | `#C08031` | left phone | yes - **shaded**; base is the orange `#FEA340`. Not a token |
| Grey keys 4, 8, x | `#B2B2B2`, `#9B9B9B`, `#9A9A9A` | left phone right edge | yes - **lighting gradient, NOT a disabled state**; keys 1-3 read `#FDFFFF` |

Hue relationships worth generalising: five categorical hues at H ~ 156 (green), 53 (yellow), 32 (orange), 253 (purple), 202 (blue); the "soft" set is the "vivid" set lifted ~5-25 L points; canvas is a tint of the green hue (163). The reference has **two purples, two oranges, two greens** that drift by a few points between components (e.g. tile `#FEA340` vs dock `#F2A854` vs stack `#FFAF54`; purple `#8C6EFA` vs `#6241EC` vs `#967AFE` vs `#906BCD`) - accidental inconsistency, should collapse to one vivid + one soft per hue.

---

## 3. WCAG contrast (computed from the measured hexes)

Formula: relative luminance on linearised sRGB, ratio = (L1+0.05)/(L2+0.05). AA thresholds: 4.5 body, 3.0 large (>=24 px or >=18.66 px bold) and 3.0 non-text.

### Text and glyphs on colour
| Pair | Ratio | Verdict |
|---|---|---|
| ink `#000` on mint `#C5F2E5` | **17.21** | pass (AAA) |
| ink `#0A0A0A` on white | 19.80 | pass |
| ink on Send green `#11B071` | 7.47 | pass |
| ink on Bill yellow `#F6DF37` | 15.53 | pass |
| ink on Mobile purple `#8C6EFA` | 5.73 | pass |
| ink on All orange `#FEA340` | 10.53 | pass |
| ink on stack yellow `#FBEB6F` / orange `#FFAF54` / purple `#967AFE` / green `#48D19C` / blue `#9AD0F0` | 17.21 / 11.51 / 6.51 / 10.88 / 12.65 | all pass |
| ink on Transfer orange `#FEA43E` | 10.59 | pass |
| white on toggle-selected black `#080808` | 20.03 | pass |
| white on left avatar-plus `#1C4E44` | 9.45 | pass |
| white on stack arrow-button black | 18.36 | pass |
| white on dock purple circle `#6241EC` | 6.02 | pass |
| **white "Home" label on green pill `#17AE72`** (~20 px, weight 400-500, so not "large") | **2.83** | **FAIL** (needs 4.5) |
| **white icon on dock orange circle `#F2A854`** | **2.00** | **FAIL** (needs 3.0 non-text) |
| white icon on dock lilac `#906BCD` | 4.06 | passes 3.0 icon; would fail as text |
| white on Send green tile (hypothetical) | 2.81 | fail - shows why the tiles use black ink |
| white on Mobile purple `#8C6EFA` (hypothetical) | 3.67 | fails text |
| **green trend glyph `~#2D9882` on white** (12-13 px) | **3.54** | **FAIL as text**; passes as 3:1 graphic |
| **green "2.5%" as rendered `#5B9586` on white** | **3.45** | **FAIL** |
| red trend glyph `~#8A2026` on white | 9.07 | pass (colour is uncertain; thin text renders lighter) |
| "Mastercard" label `#4D6A63`-`#576F69` on mint | 4.84 / 4.43 | **borderline** (~15 px light weight) |
| **slide-track chevrons `#525152` on `#070707`** | **2.55** | **FAIL 3:1 non-text** (this is the only affordance cue) |

### Non-text / boundary contrast
| Pair | Ratio | Note |
|---|---|---|
| white card vs mint (no outline) | 1.22 | would fail - **the 1.4 px ink outline carries the boundary (17:1)** |
| Send tile green vs white | 2.81; Bill yellow vs white 1.35 | outline again saves them |
| progress track `#EBECEF` vs white | 1.18 | decorative; fill vs track = 16.95 and carries the meaning |
| dock purple circle vs dock black | 3.33 | pass (marginal) |
| dock orange vs black 10.04; lilac vs black 4.94; Home green vs black 7.01 | pass |
| **adjacent stack cards, no outline or shadow**: orange/yellow 1.50, purple/orange 1.77, green/purple 1.67, blue/green 1.16 | | **FAIL 3:1 for component boundaries** if each card is an interactive component; separation relies on overlap only |
| stack yellow vs mint 1.00, blue vs mint 1.36, green vs mint 1.58 | | same issue against canvas |
| shaded orange "+" `#C08031` vs mint 2.70; unshaded `#FEA340` vs mint 1.63 | | the "+" button has no outline in the reference -> fails 3:1 |
| Mastercard orange `#FD5E00` vs mint | 2.54 | logo, exempt |

### Lessons for the generic system
* **Rule that makes the whole palette accessible: put near-black ink on every mid/light brand colour.** Black clears 5.7:1 on the *worst* of the ten categorical fills. The reference already does this on tiles, stack cards and the Transfer pill, and breaks it only on the dock (white on green/orange).
* Luminance crossover for black-vs-white text is L ~= 0.179. `#6241EC` (L 0.124) is the one fill in this set where white beats ink (6.02 vs 3.29). The token build should **pick the on-colour automatically** by luminance instead of hard-coding it.
* Trend colours must be *darkened for text* (see fix candidates): `#17755D` = 5.62 on white / 4.60 on mint; `#0F6B53` = 6.46 on white; `#B3261E` = 6.54 on white / 5.36 on mint. Keep `~#2D9882` for large graphics only.
* Chevron / hint colour on a black track: `#8C8C8C` = 5.99, `#9A9A9A` = 7.16.
* Secondary text on mint: `#4A5A56` = 5.96, `#3D4F4A` = 7.12.
* Focus ring candidates: `#6241EC` on white 6.02, on mint 4.93 (>=3:1 both).
* White with ink-on-green fixes: white on `#0B7A4B` 5.39, on `#0E7C52` 5.22 - or just use ink on the existing green (7.04 with `#0A0A0A`).

---

## 4. Shape language (measured on centre phone, image px -> px@390)

### Radii
| Element | Size (img) | Radius (img) | px@390 | Ratio |
|---|---|---|---|---|
| Transaction row | 380 x 81 | ~20 (fit 17-18, extent 20, diag 20-24) | ~19 | 0.25 of height |
| Balance card / stat cards | 380 x 250; 184 x 193 | ~22 (fit 18-20, extent 22, diag up to 27) | ~21 (range 19-25) | ~5.5% of screen width |
| Quick-action tile | 78 x 82 outer (75 x 77 fill) | ~17 outer / 14 fill | ~16 | ~0.21 of side |
| Row icon chip | 51 x 50 | ~16 | ~15 | ~0.31 of side (squircle-ish) |
| Dock container, Home pill, Withdraw pill, slide track, toggle | pill | = h/2 | full | 0.5 |
| Dock circles, keys, avatars, direction buttons | circle | = d/2 | full | 0.5 |
| Progress bar | 130 x 13 (@390) | pill | full | 0.5 |
| Stack card top corners (right phone, tilted -> estimate, `guess`) | ~350 wide | ~35-40 | ~33-37 | ~10% of width |

Pattern: **concentric family** - container ~21, inner tile ~16, chips ~15, everything interactive-and-small = full pill/circle. A generic scale of `sm 8 / md 16 / lg 24 / xl 32-36 / full` reproduces it.

### Borders and shadows
* Outline on white cards/rows/keys: near-black, **~1.4 px @390** (integrated 1.27-1.58 img px). Outline on colour tiles: **~1.8-2 px**. Icons: ~1.5 px line, round caps/joins on a ~24 px grid (Iconsax/Phosphor-Light look).
* **Shadows: none.** Mint gaps beside every card are flat `#C5F2E5`. Depth = outline + colour + overlap. The stack cards overlap with a **hard edge, no stroke, no shadow** (edge transitions in 3-6 px).
* Focus / pressed / disabled: **not drawn anywhere.**

### Spacing rhythm (px@390; image px in brackets)
* Screen gutter: 16 (17). Same on both sides.
* Card gaps: balance->stat cards 13 (14); stat-card pair gap 9 (10); row gap 9 (9-10); row->dock 13 (14).
* Inner padding: balance card ~19 (20); stat card ~22 (24); row ~13 (14); dock inner padding ~7 (8); tile gap ~13 (14).
* Estimated base unit **4 px** (values 8/12/16/20/24 recur), 8 px preferred for section gaps. Padding is inconsistent (13 / 19 / 22) - the generic system should snap these to 12 / 16 / 20.
* Card heights: balance 234, stat 181, row 76, dock 76, tile 77.

### Sizes / touch targets (px@390; guideline 44 pt Apple, 48 dp Material, 24 px WCAG 2.5.8 AA)
| Control | Size | Verdict |
|---|---|---|
| Quick tile | 73 x 77 | ok |
| Dock Home pill / circles | 143 x 60 / 61 | ok |
| Transaction row (whole row) | 356 x 76 | ok |
| Keypad key | 79 dia, ~0-3 px gap | big but mis-tap risk at the seams |
| Withdraw pill | 111 x **39** | passes 24, misses 44 |
| Avatar (if tappable) | 45 | ok |
| Orange "+" | ~54 | ok |
| Avatar-stack "+" | ~31 | misses 44 |
| Stack direction button | ~36-38 | misses 44 |
| 2x2 dot glyph / filter glyph | ~12 / ~25 glyph, no visible chrome | fails unless padded to >=44 |
| Toggle option | ~49 tall | ok |
| Progress bar | 13 tall, not interactive | n/a |

Icons: tile glyphs ~26 px in a 73 px tile (~36%); dock glyphs ~21-22 px in a 61 px circle (~36%); row arrow ~14-16 px in a 48 px chip (~30%). Icon size is inconsistent (the "All" 2x2 glyph is 12 px vs 26 px siblings).

---

## 5. Typography

### Identification (moderate confidence)
Geometric grotesque, double-storey `a`, single-storey `g`, straight-tailed `y`, slanted-cut `t`, closed `4`, flagged `1`, round `0`; tight tracking. I rendered Manrope, Plus Jakarta Sans, DM Sans, Figtree, Urbanist, Outfit and Sora (downloaded OFL files) at the measured cap heights and solved for the letter-spacing each would need to match measured ink widths of five strings. **Manrope** gave the most consistent answer (-0.010 to -0.035 em across all five strings at weight 400; mean about -0.027 em). Plus Jakarta Sans was less consistent (-0.014 to -0.055 em), DM Sans much tighter (-0.03 to -0.06 em). Conclusion: reference is Manrope-like set with about **-0.02 to -0.03 em** tracking on text and about **-0.04 to -0.07 em** on the hero numerals.

Self-hostable OFL equivalents (verified downloadable from google/fonts): **Manrope** (variable, wght 200-800, ~165 KB TTF full; GSUB has `tnum`, `pnum`, `case`, `frac`), **Plus Jakarta Sans** (variable, `tnum`, `ss01-03`), **Figtree** (`tnum`, 63 KB - lightest). DM Sans has **no `tnum`** (unsuitable for money). Recommendation: default `Manrope` (wght 400/500/600/700), fallback stack `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`, subset to Latin + tabular figures and ship as woff2 (~30-40 KB est).

### Scale (px@390, from cap-height / digit-height / 0.72, +/-1 px)
| Role in reference | Size | Weight | Line height | Notes |
|---|---|---|---|---|
| Amount entry "$2,568.00" | ~46 | 600-700 | 1.1 | digits 37 img px tall |
| Hero balance "$45,934.00" | ~40 | 700 | 1.1 | digits 31 img px; ~-0.05 em |
| Screen title "Money Transfer" | ~38 | 600 | 1.3 (pitch ~49) | 2 lines |
| Screen heading "All Transactions" | ~24-25 | 500 | ~1.2 | |
| Stack amount | ~25 | 500 | | tabular-looking |
| Stat value "$283.72" | ~21 | 500 | | |
| Section heading "Transactions", stack title, Home label | 19-20 | 400-500 | 1.2 | |
| Row title "Google", row amount | 18-20 | 500 | | |
| Greeting, "Your Balance is" | ~17 | 400 | 1.35 (pitch 22.5) | |
| Toggle label, Withdraw, Goals, "68%" | 15-16 | 400 | | |
| Stat label "Notion", dates in stack | 14 | 400 | | |
| Row date "Nov 8, 16:32", trend "8,82% (+$876)" | ~13 | 400 | | |
| "+1.7%" delta | ~12 | 400 | | thin |
| **Tile labels "Send/Bill/Mobile/All"** | **~11** | 500 | | **too small** |

Weights: mostly Regular-Medium (400-500); Bold (600-700) reserved for the two hero numerals and the screen title. Scale is roughly x1.2 in the middle with a big jump to a ~40 px hero (hero:body about 2.4:1). Sentence case, no all-caps, no italics. Numerals are lining, and money is right-aligned in rows.

**Number formatting is inconsistent in the reference and must not be copied:** "8,82%" (comma decimal) vs "$190.54" (dot decimal) vs "-$160,000,32" and "106,547,30" (comma used as *decimal* after a thousands comma) vs "22.11.2022" dates vs "Nov 8, 16:32". Typos ("With draw", "Interprise").

---

## 6. Components: anatomy, states, accessibility needs

| # | Component | Anatomy | States seen / implied | Accessibility needs |
|---|---|---|---|---|
| 1 | **App bar / greeting** | 2-line text + 45 px avatar (ring) | none | `<header>`, greeting is a heading or `p`; avatar as `<button>` with accessible name ("Account menu") if interactive; image `alt` meaningful or `""` |
| 2 | **Outlined card (surface)** | white fill, 1.4 px ink outline, r ~21, padding 16-20 | none; would need pressed/hover/focus if clickable | landmark/`section` with heading; if clickable, single stretched link/button, not nested controls |
| 3 | **Card with notch action tab** | card + concave cut-out + pill button | button states | notch is decorative (`clip-path`/SVG); button ~39 px tall -> 44; label "Withdraw" (typo "With draw" would be read as two words) |
| 4 | **Hero figure + trend** | label, 40 px tabular number, icon + delta | positive/negative implied by colour+arrow | `font-variant-numeric: tabular-nums`; trend needs text ("up 8.82%") not colour only; wrap value in an element with `aria-label` or sr-only "increase"; announce live updates with `aria-live="polite"` (SC 4.1.3) |
| 5 | **Quick-action tile** | outlined r16 square, colour fill, 26 px line icon, 11 px label | none shown | `<a>`/`<button>` in a `<ul>`/toolbar; visible label >=12 px, name = label (SC 2.5.3); focus ring 3:1; ink on fill always |
| 6 | **Stat card + sparkline** | logo + name, black SVG line, end-dot, value, delta | none | sparkline is `role="img"` with text alternative ("Notion up 1.7% this week"); values as text |
| 7 | **Progress bar** | 13 px pill track `#EBECEF`, black fill | empty/partial/full | `role="progressbar"` `aria-valuenow/min/max` + visible "68%" (present); fill is 3:1 vs track (16.9) |
| 8 | **List row (transaction)** | 48 px coloured icon chip (r15), title, date, right amount, trend delta; outlined r19; 76 px tall | none | `<li>` with one link; chip colour must not carry meaning alone; direction (in/out) conveyed as text/sign; date in `<time datetime>` |
| 9 | **Bottom dock / tab bar** | black pill; active = wide colour pill + label; inactive = 61 px coloured circles, icon only | active vs inactive | `<nav aria-label>` list, `aria-current="page"`, **every item needs a visible or programmatic label** (inactive ones are unlabeled circles); roving focus optional; safe-area padding |
| 10 | **Segmented toggle** | white pill track, black pill selected, label swap | selected/unselected | `role="tablist"`/`tab` or radio group with `aria-checked`; arrow-key nav; selected state is inverted fill (not colour only) - good |
| 11 | **Stacked colour card list** | overlapped full-width cards, 5 soft hues, black icon chip, title, date, amount, corner arrow button | none; expand/collapse implied | visual overlap via negative margin only, DOM stays a plain `<ul>`; card = one interactive element; arrow button must have name ("Open Interprise System"); ink on colour 6.5-17:1 ok; add 3 px ring or outline so adjacent cards separate at 3:1 |
| 12 | **Numeric keypad** | 12 round keys, r=full, 79 px, outline, glyphs 24 px | pressed (implied), disabled not shown (grey keys are lighting) | `<button>` per key with `aria-label` ("backspace", "reset"), hardware keyboard digits, `inputmode="decimal"` on real input, live amount readout `aria-live`; use standard 3x4 order; press feedback (scale 0.96 + fill invert) |
| 13 | **Amount display** | 46 px tabular number | empty, error implied | `<output>`/`role="status"`, currency in text, error text not colour only |
| 14 | **Slide-to-confirm** | black track, orange pill knob, grey chevrons | idle, dragging, success implied | **WCAG 2.5.7 Dragging Movements (AA, new in 2.2)** requires a non-drag alternative: provide a real "Transfer" `<button>` (optionally followed by a confirm step), or `role="slider"` with arrow keys + Enter; chevron contrast 2.55 -> >=3:1; announce success |
| 15 | **Avatar stack + add** | overlapped 31 px photos + `+` | none | group `role="group"` "Recipients", each avatar `alt`; `+` button "Add recipient" 44 px target |
| 16 | **Icon-only buttons** (2x2 dots, filter, orange "+", dock circles) | glyph on transparent or colour disc | none | **every one needs `aria-label`, >=44 px hit area, visible focus**; a tooltip/text label for ambiguous glyphs |
| 17 | **Source row** | logo disc, grey label, balance, add button | none | secondary label >=4.5:1 |
| 18 | **Section heading** | 20 px medium text | none | real `<h2>` |

---

## 7. Generic (transferable) vs one-off

### Generic - keep and tokenise
1. **One tinted canvas + white outlined surfaces + a single ink.** Boundaries come from a 1.5 px ink outline, so surface/canvas contrast never has to be 3:1 by fill alone. Swap 3 tokens (`canvas`, `surface`, `ink`) to rebrand or go dark.
2. **Categorical accent set** (green, yellow, orange, purple, blue) with a **vivid** and a **soft** step per hue, plus auto-computed on-colour (ink almost always).
3. **Concentric radius family** (8 / 16 / 24 / 32-36 / full) and rounded-square icon chips.
4. **Type**: one geometric grotesque, hero numerals 40-48 px bold + tabular, 400/500 for everything else, slightly negative tracking on large sizes only.
5. **List-row pattern**: leading colour chip, title/subtitle, trailing amount + delta - reusable for any list (messages, tasks, files).
6. **Stat card** (label, value, sparkline or progress, delta) and **hero figure block**.
7. **Segmented control** with inverted selected state.
8. **Bottom dock where the active item expands to icon + label** (a neat, communicative pattern) - but every item keeps a label.
9. **Round keypad** for numeric input (with standard layout and keyboard support).
10. **Stacked/overlapping card list** as a "wallet" pattern for a small, ordered set (not long lists).
11. **Direction arrows in a circular chip** as a "go to detail" affordance (with a name).
12. **Avatar stack** for multi-party context.

### One-off decoration - do not generalise
* Starfield/dark backdrop, device bezel, Dynamic Island, tilt and mock lighting (all shaded greys).
* Mint as a *brand* colour (generalise as `canvas` token; mint is just the default).
* Notched balance card with concave cut-out (custom SVG; hard to make responsive/accessible - offer as optional "tab card").
* Staggered honeycomb key offsets and non-standard digit order.
* Black dock with arbitrary purple/orange/lilac circles (colour has no meaning).
* Mastercard logo, Notion glyph, sample names/typos, date formats, "trend chip" as bare icon + text.
* Slide-to-confirm gesture itself (keep the *idea* of intentional confirmation).

---

## 8. Problems to fix (for the generic system)

Contrast
1. White "Home" label on green pill: **2.83:1** fail. White icon on orange dock circle: **2.00:1** fail. White on lilac 4.06 (icon ok, text not).
2. Green trend text/arrow `~#2D9882` on white: **3.5:1** at 12-13 px thin weight; rendered text 3.45. Red is fine only if the true colour is the dark crimson we measured.
3. Slide-track chevrons **2.55:1**.
4. Adjacent stack cards have **1.16-1.77:1** separation with no outline/shadow (component-boundary 3:1 fail).
5. Orange "+" has no outline: **1.63:1** vs canvas (unshaded).
6. "Mastercard" grey label **4.4-4.8:1** at light weight - borderline.

Size / touch
7. Tile labels **~11 px**, "+1.7%" ~12 px, dates 13 px: below a 12 px floor (prefer 13-14 min).
8. Targets under 44: Withdraw 39 px tall, avatar-stack `+` ~31 px, stack arrow buttons ~36-38 px, 2x2/filter glyphs (no chrome).
9. Keypad keys touch each other (0-3 px gap) despite 79 px size.

Meaning / semantics
10. **Colour-only meaning**: chip colours (purple vs green) and card colours (5 hues) do not map to a stable category; positive/negative delta is colour + tiny arrow only.
11. **Direction arrows are inconsistent**: outgoing `-$389.00` uses an up-left arrow, `-$150.00` uses a down-left arrow, `+$1,200.12` down-left, and the Google row uses an up-right arrow with a positive trend. Two different "up" arrows are used for the same concept.
12. **Icon-only controls with no label**: dock circles, 2x2 dots, filter, orange `+`, avatar `+`, arrow buttons.
13. **Slide-to-confirm is drag-only** (fails 2.5.7 AA).
14. Nonstandard keypad order (1-8, 9, 0) breaks muscle memory.
15. **Inconsistent number/date formatting** ("8,82%", "-$160,000,32", "22.11.2022" vs "Nov 8") and typos.
16. **Overlapped cards hide the lower part of each card**; fine for a short wallet stack but data loss for long lists.
17. Inconsistent tokens: 3 oranges, 4 purples, 2 greens, two different "+" circle colours, three inner-padding values, mixed border widths.
18. No focus, pressed, disabled, loading, error or empty states shown; the "grey keys" look like disabled but are lighting.
19. No dark mode; canvas `#C5F2E5` with white cards would need re-mapping.
20. Motion cues (slide, expanding dock) have no reduced-motion story.

---

## 9. Strengths worth keeping
* Ink-on-colour everywhere gives 5.7-17:1 on all vivid and soft fills; boundaries via outline.
* Very legible hierarchy: one hero number per screen, a single heading per section, 76 px rows with clear left/right alignment.
* Minimal palette of one canvas, one surface, one ink, five hues; consistent pill/circle language; clear iconography.
* Large touch targets on primary actions (tiles 73x77, rows 76 px, dock 61 px, keys 79 px).
* Active-state affordance: the selected tab/segment becomes a filled, labelled pill, i.e. not colour alone.
* Friendly tone (greeting copy, round shapes) without clutter.

---

## 10. Implied motion (to specify in the system, with `prefers-reduced-motion` fallbacks)
* Slide-to-confirm: knob follows pointer, chevrons shimmer left-to-right, snap-back or confirm at ~80% threshold.
* Dock: active pill expands/contracts (width + label fade, ~200-250 ms ease-out), inactive circles shrink.
* Segmented toggle: black thumb slides between options (~200 ms).
* Stack cards: scroll-linked slide-over / sticky stacking, tap expands a card.
* Sparkline draw-on (stroke-dashoffset) and pulsing end-dot; progress bar fill 0 -> value; balance count-up.
* Keypad: press scale to ~0.96 + fill inversion, haptic tick.

Reduced-motion rule for the generic system: replace slide/expand/draw-on with instant state change or a <=100 ms opacity fade; never rely on motion alone to convey state.

---

## 11. Recommended token starting point (derived from measurements, contrast-corrected)

```
--canvas:  #C5F2E5   --surface: #FFFFFF   --ink: #0A0A0A   --ink-2: #3D4F4A (7.1:1 on canvas)
--line: 1.5px solid var(--ink)
accent (vivid / soft): green #11B071 / #48D19C   yellow #F6DF37 / #FBEB6F   orange #FEA340 / #FFAF54
                       purple #8C6EFA / #967AFE  blue (add vivid, e.g. #4FA8E0?) / #9AD0F0
on-accent: ink for all of the above (5.7-17.2:1); auto-select white only if L < 0.179
positive-text #17755D (5.62 white, 4.60 canvas)   negative-text #B3261E (6.54 white, 5.36 canvas)
focus ring: 3px #6241EC + 2px offset (6.02 white / 4.93 canvas)
radius: 8 / 16 / 24 / 36 / 999      space: 4-based (4 8 12 16 20 24 32)     gutter 16
type: Manrope 400/500/600/700, tracking -0.02em >=18px, -0.04em >=36px; min text 12 px, meta 13-14; hero 40-48
touch target: 44 (min 24 by WCAG 2.5.8)
```
(`blue vivid` is not in the reference - it only appears as a soft card; needs a designer decision, flagged.)

---

## 12. Reproducibility / caveats
* Sampling helpers live in `analysis/h.py` (median crops, colour-mask bounding boxes, subpixel stroke centroids, diagonal-intercept radii).
* Uncertain: true ink (000 vs 0A0A0A), true trend green/red (thin strokes), stack-card radius and heights (tilt + perspective), whether Manrope is the actual face (moderate; letter-spacing solution was consistent but that could also be a narrower face), exact source frame width (390 vs 393).
* Not present in the image (cannot be derived): focus, pressed, disabled, error, loading, dark mode, motion timing, real breakpoints, content beyond one 390 px column.
