# Image 1 - "Nishar" mint fintech wallet: design DNA extraction

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/6e594420-image.webp` (1504 x 1128 px, RGB)
Analyst: read-only. Nothing under `/home/user/styleguide` was touched. Helper scripts, crops and font comparison sheets are in the scratchpad (`lib.py`, `crops/`, `fonts/`).

Style family (short name): **"Mint Ink" - flat two-tone monochrome (mint tint ramp + near-black ink), oversized radii, pill/circle controls, floating dock, light-weight display numerals.**

---

## 0. How to trust these numbers

- The image is a 1504 px Dribbble-style scene with two iPhone 14 Pro-class mockups that are yawed/tilted in 3D. Screens are about 294 px (phone 1) and 277 px (phone 2) wide in the image, so every UI element is heavily downsampled (roughly 0.75 image px per CSS px on phone 1, 0.70 on phone 2).
- Scale factors used to convert to phone points/CSS px (assuming a 393 pt wide iPhone screen; at 390 the numbers shrink 1%):
  - Phone 1: 1 image px is about 1.34 pt horizontally and 1.27 pt vertically (screen 294 x 670 px vs 393 x 852 pt).
  - Phone 2: 1 image px is about 1.42 pt horizontally and 1.37 pt vertically.
  - Perspective/yaw means any pt value below carries roughly +/-10% error. Ratios (radius / height etc.) are more reliable than absolutes.
- Colours were sampled from flat areas (`std` of the sample box below 2 unless stated) with numpy medians. **Flat fills = measured=true.** Text colours are only partly recoverable: antialiasing blends thin strokes with the background, so the darkest (or lightest) 0.5-1% of pixels is used as a best estimate of the true text colour. For text these are best-effort estimates (flagged "est.").
- Since a blended pixel is always lighter than the true dark text colour, **measured text contrast is a lower bound**; the true ratio is somewhat higher. Even so, several muted-text pairs stay under 4.5:1 with generous allowance (see section 4).
- The scene outside the phones (green wall/curtain, marble, purple bezels) is mockup dressing and is ignored except for the palette note. The pale `#dcfdf4` 2-3 px rim at the screen edge is glass/gloss, not a UI colour.

---

## 1. Inventory of screens and elements

### Screen A (phone 1, "Home / Wallet")
1. Greeting block: small muted "Hello" + very large light-weight "Nishar" (about 40 pt).
2. **Balance container**: a near-black rounded rectangle wrapping
   - a mint balance **card** (label row: wallet outline icon + "Subscription's wallet" + overlapping-rings outline icon top-right; hero amount "$324.25"; muted "Monthly expenses: $69"; eye outline icon bottom-right), and
   - an **action row on the dark rim** beneath the card: two icon-in-circle + label actions, "Add funds" (plus glyph) and "Withdraw" (download-arrow glyph), white text on ink.
3. **Grouped transaction list**: muted date-group headers ("Today", "08 April"); outlined rows (1 px hairline, no fill) with a round mint icon chip, title + category (left), amount + "Tax: $x" (right-aligned): Nike Store, Apple Store, Uber, Fuel (last row is clipped under the dock).
4. **Floating bottom dock**: a full-width mint-500 rounded band containing one **active pill** (ink pill, mint ring disc with compass glyph + "Discover" label) and three **icon-only circles** (ink circle, white glyph: document, bar-chart, person).

### Screen B (phone 2, "Category detail" presented as a sheet)
1. Sheet presentation: black backdrop, mint sheet with rounded top corners and a **grabber handle**.
2. Header: "-$734.00" display numeral (about 44 pt Light), "Food & Drink" title, "Tax: $60.35" and "April,2020" muted meta.
3. **Bar chart**: 9 rounded bars (Aug..Apr), all mint-300 except the current month (Apr) in mint-500; dashed horizontal guide line; only every second month labelled (Aug, Oct, Dec, Feb, Apr); no y-axis, no values.
4. **Filter chip row** (horizontal scroll, last chip truncated "Furni..."): active = ink pill with white text ("Food & Drink"); inactive = 1 px mint-300 outline pill with muted text ("Clothing & shoes").
5. **Dark panel** (ink, big top radius, full-bleed sheet-within-sheet): date headers in muted grey ("Today", "08 April"), filled dark-green (`#213730`) rows with mint icon chips, near-white title, muted category, right-aligned amount + "Tax".

---

## 2. Palette (MEASURED unless stated)

| Role | Hex | HSL | Where / how | measured |
|---|---|---|---|---|
| Canvas / page (mint-100) | `#c3f5e6` | 162 deg, 71%, 86% | flat sky of both screens (std < 1), median of 130x12 px box | yes |
| Raised tint / card / icon chip / unselected bar / hairlines (mint-300) | `#a3ddc9` | 159, 46%, 75% | balance card, list icon chips, 8 of 9 bars, chart guide line, row + chip 1 px borders (borders read as `#a9dbcb`-`#addfd0` because antialiased) | yes (fills), inferred (1 px lines) |
| Action-circle chip on ink (mint-400) | `#96cab9` | 160, 33%, 69% | "Add funds"/"Withdraw" circles, active dock ring disc (`#95cbb9`) | yes |
| Dock band / highlighted bar (mint-500) | `#72ab98` (dock) / `#73aa97` (Apr bar) | 160, 25%, 56% | dock band between items; Apr bar interior | yes |
| Grabber handle | `#95c3b6` | | sheet handle, 3 px tall (partly antialiased) | yes (approx) |
| Ink (container / pill / circles / active chip / panel) | `#181818` | 0, 0%, 9% | balance container rim, dock pill + circles (`#1a1a1a`), active chip (`#161815`), phone-2 dark panel; std 0-1 | yes |
| Ink-green row (raised surface on ink) | `#213730` | 161, 25%, 17% | phone-2 transaction rows (std 0-1.6) | yes |
| Text primary on mint | near-black; darkest px `#000000` (sharpening overshoot); token assumed = ink `#181818` | | "Nishar", "$324.25", titles, amounts | est. (darkest px measured, token inferred) |
| Text muted on mint - Screen A | `#568779`-`#609082` (darkest 0.5% px) | | "Hello", "Today", "08 April" (`#68978a` darkest single px), "Monthly expenses" `#5c917f` on card | est. |
| Text muted on mint - Screen B | `#457665`-`#4b796c` (darkest 0.5% px) | | "Tax:", "April,2020", "Clothing" | est. |
| Inactive chip label | `#609384` | | "Clothing & shoes" (darkest 0.5%) | est. |
| Text on ink primary | `#ffffff` | | "Add funds", "Withdraw", "Discover", active chip (17.76 max) | yes |
| Text on ink-green primary | `#ecfffd` (near white, mint-tinted) | | phone-2 titles + amounts (0.5% lightest px) | est. |
| Text muted on ink | `#95a09c`-`#8e9995` | | phone-2 "Today"/"08 April" headers | est. |
| Text muted on ink-green | `#768e86`-`#789088` | | phone-2 category + "Tax:" | est. |
| Icon glyph on mint chips | ink `#181b1a` | | Nike/Apple/Uber glyph fills (median in glyph box) | yes (approx) |
| Icon glyph on ink circles | `#ffffff` | | dock document/chart/person | yes |
| Icon glyph inside active dock disc | ink on `#95cbb9` | | compass | approx |
| Scene (ignore for tokens) | wall `#547869`-`#6b9987`, curtain `#345147`-`#466b5e`, marble `#d6d6d6`, bezel `#27212e` | | mockup background | yes |

Derived observations:
- The whole UI is **one hue (about 160 deg teal-mint) at four lightness steps plus one neutral ink**: L 86% / 75% / 69% / 56% mint, then ink 9%, and a dark tint of the hue at 17%. No red/green/amber semantic colours at all, no gradients, no shadows.
- The same `#a3ddc9` is reused for four jobs (card fill, icon-chip fill, bar fill, hairline). That single token reuse is what makes the look coherent.
- Relative luminance: canvas 0.826, mint-300 0.637, mint-400 0.522, mint-500 0.350, ink-green 0.033, ink 0.009. The big jump from mint-500 (0.35) to ink-green (0.03) is what creates the strong "light shell / dark island" figure-ground.

### Surface depth model (how depth is expressed without shadows)
- Light context: canvas (`#c3f5e6`) -> raised tint (`#a3ddc9`) -> ink island (`#181818`). Depth is communicated by **tone and containment (frame-in-frame)**, never by shadow.
- Dark context (island): ink (`#181818`) -> ink-green (`#213730`, only 1.40:1 apart, purely a surface hint) -> mint chips/text pop out.
- Row treatment differs by context: on light = **outline-only** (1 px mint-300, transparent fill); on dark = **filled** (`#213730`). Same shape, inverted fill logic.

---

## 3. Measured / estimated contrast (WCAG 2.x relative-luminance ratio)

Thresholds: 4.5:1 body text; 3:1 large text (>= 24 px, or >= 18.66 px bold); 3:1 non-text UI/graphics (WCAG 1.4.11). "est." = text colour estimated from darkest/lightest antialiased pixels (lower bound).

### Text
| # | fg on bg | Ratio | Use | AA? |
|---|---|---|---|---|
| 1 | `#181818` on `#c3f5e6` | 14.82 | primary text on canvas (token assumed; darkest px `#000` gives 17.4) | PASS |
| 2 | `#181818` on `#a3ddc9` | 11.62 | primary text/amount on balance card | PASS |
| 3 | `#ffffff` on `#181818` | 17.76 | labels on ink, active chip, dock label | PASS |
| 4 | `#ecfffd` on `#213730` | 12.27 | title/amount on ink-green row | PASS |
| 5 | `#95a09c` on `#181818` | 6.58 | muted date header on ink panel (est.) | PASS |
| 6 | `#568779` on `#c3f5e6` | 3.41 | "Today" / "08 April" on canvas (est., best case; darkest single px `#68978a` = 2.75) | **FAIL** (small text) |
| 7 | `#609082` on `#c3f5e6` | 3.02 | "Hello" (est.) | **FAIL** |
| 8 | `#5c917f` on `#a3ddc9` | 2.36 | "Monthly expenses: $69" on card, light weight (est.) | **FAIL** (worst pair) |
| 9 | `#4b796c` on `#c3f5e6` | 4.12 | "Clothing / Electronics / Transport" (est.) | **FAIL** (borderline) |
| 10 | `#457665` on `#c3f5e6` | 4.35 | "Tax: $60.35", "April,2020" on Screen B (est.) | **FAIL** (borderline; best case) |
| 11 | `#609384` on `#c3f5e6` | 2.92 | inactive chip label "Clothing & shoes" (est.) | **FAIL** |
| 12 | `#789088` on `#213730` | 3.71 | category + "Tax:" on ink-green rows (est.) | **FAIL** |
| 13 | `#181818` on `#96cab9` | 9.68 | plus/download glyph on action circle | PASS |

Notes: hero numerals (about 44 px Light) count as large text so item 1/2 pass with room to spare; the 300-weight display face at 40-44 px is fine. Failing items are all the *secondary* text tier, which is set at 11-14 px, weight 300-400, in a low-saturation mint-grey. The same muted role also uses **two different tones** across the two screens (`~#568779` on A vs `~#457665` on B), so the token is not even consistent.

### Non-text (icons, controls, chart marks, boundaries)
| # | Pair | Ratio | Use | 3:1? |
|---|---|---|---|---|
| 14 | `#a3ddc9` on `#c3f5e6` | 1.28 | unselected bars; 1 px row/chip borders; dashed guide | **FAIL** |
| 15 | `#73aa97` on `#c3f5e6` | 2.21 | highlighted (current-month) bar vs canvas | **FAIL** |
| 16 | `#73aa97` on `#a3ddc9` | 1.73 | highlighted vs unselected bar (state distinction) | **FAIL** (state is barely visible; colour-only) |
| 17 | `#95c3b6` on `#c3f5e6` | 1.63 | sheet grabber | **FAIL** (if it is the only drag affordance) |
| 18 | `#72ab98` on `#c3f5e6` | 2.19 | dock band edge vs canvas | FAIL as a boundary, but the items on it are fine (see 19) |
| 19 | `#181818` on `#72ab98` | 6.76 | dock circle/pill vs dock band | PASS |
| 20 | `#ffffff` on `#181818` | 17.76 | dock glyphs | PASS |
| 21 | `#a3ddc9` on `#181818` | 11.62 | card vs ink container; icon chip on ink | PASS |
| 22 | `#a3ddc9` on `#213730` | 8.31 | icon chip vs ink-green row | PASS |
| 23 | `#181818` on `#c3f5e6` | 14.82 | ink container vs canvas | PASS |
| 24 | `#213730` on `#181818` | 1.40 | ink-green row vs ink panel | n/a (surface hint only; content inside is high contrast) but the row boundary is not perceivable to low-vision users |

**Where the look works and where it fails:** everything on ink (dark island, dock, pills, circles) is excellent (6.8-17.8:1). Everything that relies on *mint-on-mint* (hairlines, unselected bars, muted text, inactive chips, grabber) is at 1.3-3.4:1 and fails. The generic system can keep the look by (a) deepening the mint "outline / mark / secondary text" tier to a darker green step and (b) keeping mint-300 as a *fill only* (never as the sole boundary or mark).

### Proposed AA-safe replacements (computed, hue held at ~160 deg)
| Role | Suggested | Result |
|---|---|---|
| text-secondary on canvas AND card | `#345a4d` | 6.45 on `#c3f5e6`, 5.06 on `#a3ddc9` (`#3a6154` is the lightest passing step, 5.81 / 4.55) |
| text-secondary on ink-green | `#a9b9b2` | 6.21 on `#213730`, 8.68 on `#181818` (`#909d99` is the minimum: 4.52) |
| control border / chart mark (3:1) vs canvas | `#57917e` | 3.04 (use `#4f8a76` = 3.35 for margin) |
| current/selected bar | ink `#181818` | 14.82 vs canvas, 4.87 vs `#57917e` bars: clear, and echoes the "active = ink" language |
| hairline (decorative only) | keep `#a3ddc9` | only where it is *not* the sole boundary (row text is still AA) |
| focus ring | 2 px ink with 2 px offset (on ink surfaces: 2 px `#c3f5e6`) | 14.8:1 on canvas; 11.6:1+ on dark |

---

## 4. Shape language (measured; pt at ~393 wide unless stated)

### Corner radii
| Element | Size (approx) | Radius | Ratio |
|---|---|---|---|
| Balance card (mint) | 358 x 192 pt (269 x 144 px) | about 19 pt (14 px) | about 10% of height |
| Ink balance container (wraps card) | about 376 x 278 pt | top about 16-20 pt, bottom about 28-30 pt (22 px traced) | bottom about 10-11% of height |
| List row | about 358 x 77 pt | about 22-26 pt | about 0.28-0.33 of height (squircle-ish, not a full pill) |
| Icon chip / action circle / dock circles / dock pill / chips | 48 / 34 / 52-56 pt | 50% / full | circles + stadium |
| Filter chips | about 135 x 50 pt (active), 48 pt tall | full (999) | stadium |
| Dock band | about 76 pt tall | full-round ends (clipped by device corner) | |
| Bars | 24 px wide = about 34 pt; radius about 6 px = about 8-10 pt | about 25-30% of width | all four corners rounded |
| Dark panel (Screen B) | full width | top corners about 28-32 pt | |
| Sheet (mint) top corners | | about 19-24 pt | |

**Radius logic = concentric nesting**: outer radius is about inner radius + padding (card 19-20 pt + 8-9 pt rim = about 28-30 pt container). Row radius is about 1/3 of row height. Everything interactive is a circle or a stadium. Generic scale suggestion: 8 (bars/small) / 16 (inputs) / 24 (rows, cards) / 32 (containers, sheets) / 999 (pills, chips).

### Borders
- No borders on filled shapes. **Only two border uses: 1 px `#a3ddc9` hairline** on outline rows (Screen A) and inactive chips (Screen B), plus a 1 px dashed guide line (about 6 px dash / 4 px gap at image scale, about 8 / 5 pt) in the same colour. All at about 1.28:1 - decorative in practice, not compliant as boundaries.
- Active dock icon carries a thick (about 4 pt) mint ring - ring is the same colour as the chip fill so it reads as a disc, not a stroke.

### Shadows / elevation
- **None.** Pixel columns immediately below the ink container (rows y=632-648) and above the dock band (y=925-941) return the flat canvas `#c3f5e6` - no soft or hard shadows, no blur, no gradient, no glass. Elevation is expressed only by tone and containment. (The dock overlaps the list with no scrim or fade - the "Fuel" row is hard-cut by the band.)

### Spacing rhythm
- Base unit looks like **4 pt with an 8 pt step**; recurring values: 8, 12, 16, 20, 24, 32.
- Page gutter **16 pt** (Hello/Nishar/Today text, card, and list rows all align at 16 pt: e.g. text x=417-421 vs screen edge 407-409 at about 1.34 pt/px).
- The ink container deliberately **bleeds to about 8 pt from the screen edge** and its inner card sits back at 16 pt: outer frame 8 pt from edge + 8-9 pt padding = content still on the 16 pt line ("frame-in-frame keeps the alignment column").
- Card padding about 20 pt; label -> amount about 20 pt; amount -> meta about 12 pt.
- List row: 48 pt chip + about 14 pt above/below = **about 76-78 pt row height**; chip inset 16 pt from row edge; chip -> text gap about 16 pt; row gap about 8-10 pt; group-header -> first row about 12-16 pt; group gap about 20-24 pt.
- Dock: items 52-56 pt with 10 pt padding in a band about 76 pt tall (plus safe-area).
- Screen B: chart bleeds to about 7 pt of the edge (9 bars x about 24 px + 8 gaps x about 4 px = 250 px = about 355 pt), while text stays on the 16 pt gutter.

### Icon size / container / touch targets (at ~393 pt width)
| Item | Glyph | Container | Notes |
|---|---|---|---|
| Category icon chip | about 20 pt solid glyph | 48 pt disc (glyph = about 40% of disc) | not a control by itself |
| Action circle (plus / download) | about 14 pt **thin-stroke** glyph | 34 pt disc + 80 pt label | disc alone < 44 pt; whole "circle + label" needs to be the hit area |
| Dock circles | about 20 pt solid white glyph | **52-56 pt** ink circle | meets 44 pt (WCAG 2.5.5 AAA-target 44; 2.5.8 AA min 24) |
| Dock active pill | 36 pt ring disc + 16 pt label | about 143 x 56 pt | expands to reveal label |
| Filter chips | text 16 pt | about 48-52 pt tall x 135 pt | OK |
| Eye (show/hide balance) | about 18-20 pt outline | no visible container | **tap area not defined; needs 44 x 44** |
| Wallet icon / overlapping-rings icon | 18 pt / 30 pt outline | none | decorative-looking |
| Grabber | 4 pt tall x about 65 pt wide (about 46 px at 1.42) | none | visual only |

Touch-target verdict: the *big* elements (dock circles, chips, rows) are 48-78 pt - generous. The small ones (eye, action-circle glyphs, rings icon) are visually under 24 pt and would need padded hit areas (`min 44 x 44`) to be usable.

---

## 5. Typography

### Likely typeface
- **Manrope (OFL, Google Fonts, variable 200-800)** - strongest match. Side-by-side render of "Nike Store", "Subscription's wallet", "Withdraw", "Discover" in Manrope matches the reference's double-storey `a`, single-storey `t`, open `e`, straight-legged `k`/`r`, and the round-cornered stadium `0` in the numerals. Confidence: medium-high for the text face, medium for numerals (reference digits are about 10-13% narrower than Manrope at the same height; either negative tracking of about -0.04em is applied, or a DIN-like numeric font such as Barlow/Bahnschrift is mixed in - "$734.00" zeros look like tall stadiums).
- Self-hostable OFL equivalents worth offering as token swaps: **Manrope** (primary), Plus Jakarta Sans, Figtree, Onest, Instrument Sans, Inter Tight (tabular figures), DM Sans; Sora is too wide, Outfit/Urbanist too geometric. For numerals: any face with `font-variant-numeric: tabular-nums` (Manrope has `tnum`).

### Scale (pt/CSS px at 393 wide - estimated from glyph widths and cap heights)
| Role | Size | Weight | Tracking | Notes |
|---|---|---|---|---|
| Display numeral (balance "$324.25", header "-$734.00") | about 44 | 300 Light | about -0.03 em | line-height about 1.0; currency symbol same size; decimals same size (no superscript cents) |
| Greeting name ("Nishar") | about 40 | 300-400 | about -0.03 em | very light, huge vs its "Hello" (14) |
| Section/title in card ("Subscription's wallet", "Food & Drink") | 15-16 | 500 | -0.02 em | tight |
| Row title / label ("Nike Store", "Add funds", "Discover", chip text) | 15-16 | 500-600 | 0 / -0.01 em | white on ink is 600 |
| Amount in row ("-$734.00") | about 15 | 500 | | right-aligned, tabular |
| Secondary/meta ("Clothing", "Tax: $60.35") | about 12 | 400 | 0 | muted; **too small and too pale** |
| Group header ("Today", "08 April") | about 14 | 400 | 0 | muted |
| Chart axis labels | about 13-14 | 500 | | ink, alternating months only |

Scale characteristics: a **very steep top step** (44 vs 15 = about 2.9x) and then a nearly flat 12-16 band; only about five sizes and two-three weights in total. Light 300 is reserved for display numbers/names only. Numerals are treated as the hero: oversize, light, tight-tracked, aligned left (card/header) or right (list). Currency amounts always carry the `$` and two decimals; negatives are a leading hyphen-minus (no colour); inconsistent sign handling between Screen A and B (see problems).

---

## 6. Components (anatomy, states, accessibility needs)

### 6.1 Greeting header
Anatomy: muted eyebrow ("Hello", 14 pt) + display name (40 pt Light). States: static. A11y: single `h1`; eyebrow inside it as visually-styled span or `aria-hidden`; text must reach 4.5:1 (currently 3.0:1).

### 6.2 Balance card in ink container ("stat card with action rail")
Anatomy: ink container (radius about 30, padding 8) -> mint card (radius about 20, padding 20): [leading icon + label] [trailing brand/ring icon]; display amount; muted sub-line; bottom-right visibility toggle. Below the card on the ink rim: 2-3 **icon-circle + label actions**. States implied: default; probably pressed (circle dims); "hidden balance" state via eye toggle (implied, not shown). Needs: card as `section` with `aria-labelledby`; amount in a `<data>`/`<span>` with tabular numerals; eye button `aria-pressed` + label "Hide balance" (icon-only); masking must not rely on colour; actions are real `<button>`/`<a>` with the visible label inside the target, min 44 pt target height (circle is only 34 pt); focus ring must show on ink.

### 6.3 Group header + list row ("transaction row")
Anatomy: date header (muted) then rows; row = leading 48 pt icon chip, 2-line text block (title 15/500; subtitle 12/400), trailing 2-line block right-aligned (amount 15/500; secondary "Tax: $x" 12/400). Variants: outline-on-light (1 px hairline, transparent) and filled-on-dark (`#213730`). States: default; pressed/hover (not shown; implied tone step); no disabled/loading/empty/error shown. Needs: `<ul>` with `<li>`, headers as `<h2>`/`role=heading`; if rows navigate, make the whole row one `<a>`/`<button>` with the accessible name synthesised (e.g. "Nike Store, Clothing, minus $734.00, tax $60.35"); category icon `aria-hidden`; amounts use real minus sign (U+2212) and `<span class="visually-hidden">spent</span>`; muted text >= 4.5:1; outline must be >= 3:1 if it is the only interactive boundary.

### 6.4 Floating dock (bottom navigation)
Anatomy: full-width mint-500 band (radius full, padding 10) with 3-4 items; **active item = expanded ink pill (icon disc + label)**, inactive = ink circle + white glyph, no label. States: active/inactive shown; pressed/focus/disabled implied. Needs: `<nav aria-label="Primary">` with `<ul>`; each item `<a aria-current="page">` on active; **visible text or tooltip for all icon-only items** (currently only the active one has text; document/chart/person are ambiguous); `padding-bottom: env(safe-area-inset-bottom)`; content needs `scroll-padding-bottom`/bottom padding equal to dock height so focused/last rows are not obscured (WCAG 2.4.11); optional scrim/fade above dock; keyboard order = visual order; respect `prefers-reduced-motion` for the expand animation.

### 6.5 Filter chips (single-select horizontal scroller)
Anatomy: stadium chip, text 16 pt, 48-50 pt tall, horizontal padding 16 pt; active = ink fill + white text; inactive = 1 px mint-300 outline + muted text; the row scrolls edge-to-edge and the last chip is deliberately cut off (peek = scroll affordance). States: active/inactive; hover/pressed/focus/disabled implied. Needs: `role="tablist"` (if it switches panels) or radio-group/`aria-pressed` toggles (if it filters); active state must not be colour-only (filled vs outline is already a shape cue - keep it); inactive text and border need 4.5:1 / 3:1; scroll region `tabindex=0` with label, scroll-snap, and a visible focus ring; scroll shadow/fade is missing.

### 6.6 Bar chart (categorical, one series over time)
Anatomy: 9 rounded bars, ~24 px wide, gap ~4 px; one highlighted (current) bar in a darker mint; dashed reference line at top; sparse x-labels (every 2nd month); no y-axis/values/legend. States: default, highlighted/selected (implied tap-to-select with tooltip). Needs: `role="img"` + `aria-label` summary, or a real `<table>` (visually hidden or toggle "show data table"); each bar focusable/selectable with value announced; label every bar or provide on-focus value tooltip; highlight must have >= 3:1 vs neighbours and vs background and a non-colour cue (label, outline, value badge); explain the dashed line (average? budget?) with a label; respect reduced motion for grow-in.

### 6.7 Bottom sheet / modal panel with grabber
Anatomy: black scaled-back backdrop, mint sheet radius about 22 pt top corners, 4 pt x 65 pt grabber at top center, content; second nested dark panel (radius about 30) full-bleed containing the list. States: presented/dragging (implied). Needs: `<dialog>` or `role="dialog" aria-modal`, visible close button (a grabber is not accessible), focus trap + return focus, Esc, `inert` behind; grabber >= 3:1 and purely decorative if a Close button exists.

### 6.8 Icon chip
Anatomy: 48 pt mint-300 disc + 20 pt solid dark glyph. Also used as 34 pt action disc (thin plus / download line glyph) and 36 pt ring disc inside the active dock pill. States: none. Needs: decorative -> `aria-hidden`, or labelled if it is the only carrier of meaning.

### 6.9 Visibility toggle, brand ring, wallet glyph
Small outline icons (eye, overlapping rings, wallet) on the card. Only the eye is interactive. Icon style here (2 px outline) does not match the solid glyphs elsewhere.

---

## 7. Layout patterns (transferable)
1. **Single-column mobile canvas** with a 16 pt gutter and 4/8 pt vertical rhythm; content stack: greeting -> hero card -> list.
2. **Frame-in-frame hero**: a dark rounded container holds a light card *and* its action row, so the card and its verbs read as one unit (cards + actions share one surface).
3. **Light shell with dark islands**: canvas is light mint, dark ink is used for the containers that need emphasis (actions, active states, panel, dock items) - the eye tracks the ink.
4. **Grouped list with sticky-style date headers**, right-aligned figures, two-line text on both sides.
5. **Floating pill dock** at the bottom, content scrolling under it.
6. **Header + chart + chips + list** master/detail scaffold in a sheet: display number, title/meta, visualisation, filter chips, then a dark list panel.
7. **Pill-only controls**: every interactive element is a circle or stadium; every container is a large-radius rect.

---

## 8. Motion implied (not visible in a still, inferred from the patterns)
- Dock: active pill expands/contracts (width + label fade) on item change - suggest 200-250 ms ease-out, reduced-motion -> instant.
- Chips: horizontal scroll with snap; active fill cross-fade.
- Sheet: drag from the grabber with rubber-banding; backdrop scale-back on presentation (iOS sheet stacking).
- Bars: grow from baseline on entry, highlighted bar tone transition on selection.
- Eye toggle: amount blur/fade or dot-mask swap.
- Press feedback on rows/circles (scale about 0.97 or tone step); none is shown so all are assumptions.

---

## 9. Generic (keep) vs one-off (drop)

**Generic and transferable**
- Tonal ramp built from one hue + one neutral ink; surface/on-surface token pairs (light canvas, raised tint, inverse ink, inverse-raised).
- Depth through tone and containment; **no shadows**; concentric radii (outer = inner + padding); radius scale with pill/circle for controls.
- Oversized light-weight display numerals with tabular alignment; steep hero step then a tight 12-16 band; right-aligned figures.
- Icon-in-circle chip as the universal leading visual; solid glyph on tinted disc.
- Active = inverted (ink fill, white text) and expanded (pill with label) - a state cue that is not colour-only.
- Floating pill dock with active-expands pattern; horizontal chip filter with peeking last chip; grouped list with muted headers; bottom sheet with grabber and nested dark panel.
- Filled-on-dark vs outline-on-light row variants.

**One-off decoration (do not carry into the system)**
- Specific mint hue values and "Nishar" fintech content (wallet, tax, Mastercard-style rings).
- The particular mixture of outline (eye, wallet, rings, plus) and solid (categories, dock) icon styles.
- Non-4-multiple oddities (chart bleeds beyond gutter; 8 pt container bleed) - keep the idea but tokenise it.
- Mockup scene, device chrome, glare.

---

## 10. Strengths to keep
- One-hue ramp + ink = instantly cohesive, calm, "friendly minimal".
- Strong figure/ground: ink islands (6.8-17.8:1) carry all primary actions and active states.
- Generous targets: dock circles 52-56 pt, chips about 48 pt, rows about 76 pt.
- Hero numeral typography (light, large, tight) gives instant hierarchy; only about five sizes.
- Active states use shape (filled pill vs outline, expanded with label) as well as tone.
- Concentric radius system and consistent 16 pt alignment column.
- Money sign carried by a "-" character, not by red/green colour.
- Flat, shadow-free rendering = cheap to build, fast to paint, easy to theme in vanilla CSS.

---

## 11. Problems to fix (usability + accessibility)
1. **Secondary text fails AA** almost everywhere: 2.3-4.35:1 at 11-14 px, weight 300-400 (items 6-12 above). Worst: "Monthly expenses" 2.36:1 on the card and inactive chip labels 2.92:1. Also two different muted tones across screens.
2. **Type too small/light**: 12 pt "Tax: $x" and "April,2020"; 300-weight small text; on a 393 pt screen 12 pt muted text is a legibility risk. Minimum body 14-16 px, minimum meta 12-13 px at >= 4.5:1, never Light below 18 px.
3. **Mint-on-mint marks below 3:1**: hairline row borders and chip outlines 1.28:1; bars 1.28:1; highlighted bar 2.21:1; highlighted-vs-normal 1.73:1; grabber 1.63:1. The only "selected month" cue is a slightly darker tint = effectively colour-only.
4. **Chart is inaccessible and under-informative**: no values, no y-axis, no legend, no text alternative, alternate months unlabelled, dashed guide unlabeled/unexplained, bars not focusable.
5. **Icon-only controls with no labels**: dock document/chart/person circles, eye toggle, overlapping-rings icon; the active item alone gets a label. Ambiguous "document" icon; no tooltip/`aria-label` shown.
6. **Small hit areas**: eye icon (about 18-20 pt, no container), action-circle discs 34 pt (target must include the label and reach 44 pt), thin 14 pt plus/download strokes.
7. **Content obscured by the dock**: the last row ("Fuel") is cut with no scrim/padding; violates focus-not-obscured (WCAG 2.4.11) and hides content; bottom safe-area not represented.
8. **No visible focus, hover, pressed, disabled, loading, empty, error states** anywhere; no focus ring on the dark surfaces; mockup is default-state only.
9. **Inconsistent icon language**: thin outline (wallet, eye, rings, plus, download) vs heavy solid (category, dock) vs 2 px rings; icon stroke/weight/size grid not unified.
10. **Inconsistent data semantics**: Screen B header "-$734.00" but its Nike row shows "$734.00" (positive) while Uber row shows "-$4.99"; Nike "Clothing" listed under a "Food & Drink" filter; "April,2020" missing space; "Tax:" percentages vary 8-18% with no explanation; mixed date formats ("Today", "08 April", "April,2020"). Sign must be consistent and machine-readable.
11. **Sheet affordance**: grabber-only dismiss (1.63:1, not keyboard reachable); no Close button; no scrim/background dimming semantics spelled out.
12. **Truncated chip peek has no scroll indicator** for non-touch/keyboard users; chip row needs `tabindex` + arrow-key support.
13. **Tone step between ink and ink-green rows is only 1.40:1**: row edges disappear for low-vision users; rely on text/icon, add subtle 3:1 divider or gap if rows are interactive.
14. **Light-weight display numerals at 300** are fine at 40+ px but the same face at 12 px is fragile on low-DPI; use weight >= 400 below 18 px.
15. **Dynamic type not considered**: fixed 76 pt rows with two-line text on each side will clip at 200% text zoom (WCAG 1.4.4/1.4.10 reflow); rows must grow.
16. **Colour-only meaning risks**: none of the categories use colour (good), but the chart highlight and inactive/active chip border rely on tone alone at low contrast.

---

## 12. Generic principles distilled (for the reusable system)
1. Build the palette as **one brand hue ramp (5 steps) + one ink**, defined as semantic tokens (canvas, surface, surface-strong, accent, ink, on-ink, text-secondary, border, focus) so any app swaps hue only.
2. Keep **depth flat**: surface tone + containment + concentric radii instead of shadows; optional single hairline token.
3. **Radius scale**: 8 / 16 / 24 / 32 / full; outer = inner + padding.
4. **4 pt base grid, 8 pt steps**, one 16 pt gutter, frame-in-frame may bleed by half a gutter.
5. **Hero numeral token** (display, Light 300, -0.03 em, tabular) + compact 12-16 px body band; never place 300 weight below 18 px.
6. **Two-tier text contrast**: primary >= 7:1, secondary >= 4.5:1 on *every* surface (light, raised, inverse, inverse-raised).
7. **Every non-text mark >= 3:1** (control borders, chart marks, selected state); tint-only outlines are decoration.
8. **Active/selected states use shape + tone + text/label** (filled pill, expanded label, `aria-current`/`aria-pressed`), never tone alone.
9. **Touch targets >= 44 px** (48 preferred) for anything interactive, with padded hit areas around small glyphs; 24 px absolute minimum.
10. **Bottom chrome (dock) is safe-area aware** and reserves scroll space; content and focus never sit beneath it.
11. **One icon family** with a fixed grid (24 px, 1.75-2 px stroke, rounded joins) - choose either outline or solid consistently, use solid only for "active".
12. **Every icon-only control needs a name** (visible label preferred; `aria-label` + tooltip at minimum).
13. **Charts ship with a data-table fallback and per-mark labels**; highlight through ink + label, not tint.
14. **Explicit state matrix** (default / hover / pressed / focus-visible / disabled / loading / error / empty) is part of each component spec.
15. Respect `prefers-reduced-motion`, `prefers-color-scheme` (the ink/mint inversion maps naturally to dark mode), `forced-colors`, and support 200% text without clipping (rows use min-height, not fixed height).

---

## 13. Uncertainties, stated plainly
- Muted text colours are estimates from antialiased pixels; the true token could be 10-15% darker than the darkest sampled pixel. Screen B's muted tone (about `#457665`, about 4.35:1) is close to AA; Screen A's (about `#568779`, about 3.4:1) is not.
- "Ink" text token is assumed equal to the container ink `#181818`; darkest text pixels reach `#000000` which may be sharpening overshoot or true black.
- Absolute pt sizes carry about +/-10% error because both phones are yawed; ratios are more trustworthy.
- Typeface identification is visual (side-by-side render); numerals may be a narrower/DIN-like face or heavily tracked Manrope.
- Hover/pressed/focus/disabled states are not visible in the image; anything stated about them is a recommendation, not an observation.
