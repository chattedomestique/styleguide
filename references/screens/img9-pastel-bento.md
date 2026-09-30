# Image 9 analysis: pastel bento / habits-productivity app (two phones on periwinkle)

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/2af10764-image.jpg` (994 x 1200 JPEG).
Method: every hex below was read from the file with PIL/numpy (median of flat regions, or darkest/most-different pixels for text). "measured=true" means sampled; anything eyeballed or inferred is labelled "est.". Small text is antialiased, so measured greys are an UPPER BOUND on real contrast (true glyph colour is at best as dark as the darkest pixel seen).

Scale note. The phone screen (inside the bezel) is 385 px wide in the image (x 84-468 left phone, x 527-911 right phone). A 390 pt phone is therefore ~1.013x; all px values below are image px and can be treated as CSS px at a ~390 px viewport (multiply by 1.013 if you want exact). Phone bodies: left 396 x 858 (x 78-473, y 100-957); right 396 x 858 (x 521-916, y 242-1099).

---

## 1. Inventory

### Left phone ("light" screen, dark canvas)
1. Top row (over hero card): hamburger/"menu" glyph (two short lines, ~17 px wide, no visible container) left; round white "layers" button (46 px) right; hardware dynamic island (mockup chrome, ignore).
2. Hero card (#f6f6f8, x 84-468, y 106-579, ~473 px tall, flexes to fill): big empty top, content anchored to bottom:
   - overline "Statistics" (13 px)
   - 4-line headline, 36/40 px, mixed weights: `Hello [wave emoji] Taylor! [36 px round avatar inline] your overall score` in Light, `exceeds the average.` in SemiBold
   - footer row: pill chip `[trophy emoji] Best result: 7/8 Tasks` (38 px tall, the "8" greyed), pill chip `[trend-up icon, red-ish] Growth`, round white arrow button (38 px, up-right arrow = "open")
3. Yellow card (#f8e297, y 584-763, 180 px): 32 px white round icon (trend line) top-left; dark pill segmented toggle `Weekly | Monthly` top-right (166 x 29 px); overline "Your progress"; light-weight title "You are doing greate [halo-smile emoji]" (29 px; note typo "greate"); huge light numeral "94%" (72 px) bottom-right.
4. Cyan card (#bbe7f0, y 768-836, 68 px): text "New updates from" (ink, Medium) + "1 friend" (grey), outline circular refresh button (46 px, 1 px ring) and a 46 px avatar.
5. Dark dock (#1a1a1a, y 837-944, ~107 px incl. safe area): 4 icon items on 100 px pitch (grid, lightning, gear, person); active item (lightning) = white pill 82 x 45 px with dark icon; inactive = bare white icons (~17-20 px glyphs). No labels.

### Right phone ("dark" screen, cards on dark)
1. Header on #1a1a1a (y 242-357): two-line greeting `Hi [wave emoji] Taylor!` / `Welcome back` in Light white 18 px; bell icon with small red dot; 52 px avatar.
2. Lavender card (#bbcaf1, y 358-588, 231 px): calendar icon + "12 Wed" (grey, 13 px) top-left; round white "layers" button + round black "+" button (46 px each, 6 px apart) top-right; overline "Current tasks"; 29 px Medium title "You have 5 tasks [High chip] for today" (inline chip: white pill with red text "High" + trend icon, 20 px tall); 1 px hairline divider; hashtag row `#work #planning #shopping` (grey, 13 px).
3. White list-row card (#ffffff, y 593-684, 92 px): black vertical pill date chip "13 / Thu" (45 x 66), title "Calling" (16 px Medium) + subtitle "International IT agency" (grey 13 px), outline circle button with "=" glyph and solid black circle button with refresh glyph.
4. Light media card (#f6f6f8, y 689-1093, 405 px): globe icon + "by Habits Journal"; outline eye circle button + solid black arrow circle button; overline "Community"; 29 px Medium title "Productive week"; underlined grey text link "Read now" + small outline arrow ring (22 px); rounded photo (358 x 216, radius 28, inset 13) with overlays: white domain chip "habiesjournal.com" (top-left), frosted dark circle with eye + "2.8k" (bottom-left, ~50 px), frosted "+" circle and three overlapping avatars (bottom-right).

Mockup chrome to ignore: phone bezels (#1b1c21), dynamic island, page background.

---

## 2. Measured palette

| Role | Hex | Where | measured |
|---|---|---|---|
| Page background (periwinkle) | #bbcaf1 | outside phones; IDENTICAL to lavender card | true (std 0) |
| Lavender tonal card | #bbcaf1 | "Current tasks" card | true |
| Yellow tonal card | #f8e297 | "Your progress" card | true |
| Cyan tonal card | #bbe7f0 | "New updates" card | true |
| Light surface | #f6f6f8 | left hero card, right media card | true (std 0) |
| White | #ffffff | chips, list-row card, white circle buttons, domain chip, dock active pill | true |
| Ink / canvas / shell | #1a1a1a | dock, dynamic island, solid buttons, date chip, toggle track, right-phone canvas, the 4 px gutters between cards | true (std 0.1-0.4) |
| Text ink (large, bold) | #1c1c1e core | bold headline, "Productive week" (interior of thick strokes) | true |
| On-dark text | #fafafa (near white) | greeting, dock icons, "Monthly" | true |
| Notification dot red | #d84a5a | bell dot (peak pixel of ~6 px dot) | true (dot is tiny; true fill may be slightly more saturated, e.g. ~#e5484d) |
| Priority "High" text red | ~#d84a5a | High chip (glyph is thin; darkest antialiased pixel #aa6d72) | est. (false) |
| Secondary grey on cyan ("1 friend") | #577d86 (darkest seen) | ~ink at 55-60% alpha | true (upper bound) |
| Secondary grey on lavender ("12 Wed", hashtags) | #7783a9 / #727f9f (darkest seen) | ~ink at 40-45% alpha | true (upper bound) |
| Secondary grey on white ("International IT agency") | #9c9c9c (darkest seen) | ~ink at 40% | true (upper bound) |
| Secondary grey on surface ("by", "Read now") | #b9b9bb / #a0a0a2 | ~ink at 30-40% | true (upper bound) |
| Muted "8" in "7/8" | #c0c0c0 | median of its strongest pixels on white | true |
| Outline-button ring on white | #e4e4e4 / #eaeaea (1 px) | ~ink at 10% | true |
| Outline-button ring on cyan | #abd7e0 (1 px) | ~ink at 8% | true |
| Hairline divider on lavender | #abb9e0 (1 px) | ~ink at 10% | true |
| Selected-segment ring (toggle) | ink #1a1a1a, ~1.5-2 px | the dark track visible around the yellow thumb | true |
| Frosted overlay on photo | ~#6b645a over photo (varies) | "2.8k" circle, "+" circle, avatar capsule | est. (translucent dark + blur; ~rgba(30,25,20,.45)) |
| Phone bezel (mockup) | #1b1c21 | device frame | true, ignore |

Observations
- Only SEVEN real colours drive the whole UI: ink, white, light surface, and three pastels (+ tiny red). The page periwinkle is simply the lavender token reused.
- The three pastels are all light (relative luminance: lavender 0.592, cyan 0.740, yellow 0.766); light surface 0.923; white 1.0; ink 0.010. Every pastel takes the same ink at 10.6-13.5:1.
- THE CANVAS IS ALWAYS INK (#1a1a1a). The left phone only looks "light" because the hero card is a huge #f6f6f8 card; the 4 px gaps between hero/yellow/cyan and the dock are the same #1a1a1a canvas showing through. The right phone shows the same canvas at full size. So "light vs dark" here is not a theme switch; it is how much canvas is visible. This is the single most reusable structural idea.
- No shadows, no gradients on UI (the only gradient is a photo scrim/frost). Page background is perfectly flat, so not even the phones have drop shadows.
- Pastel identity is decorative here (yellow = progress, cyan = social, lavender = tasks, white/light = lists/media) and carries no status meaning by itself.

---

## 3. Contrast (WCAG 2.x relative luminance, from MEASURED hexes)

Thresholds: text 4.5:1 (3:1 if >=24 px, or >=18.66 px bold), non-text UI 3:1.

### 3a. Primary text: all pass with huge headroom
| Pair | Ratio | Result |
|---|---|---|
| ink #1a1a1a on #f6f6f8 | 16.12 | pass |
| ink on white | 17.40 | pass |
| ink on yellow #f8e297 | 13.52 | pass |
| ink on cyan #bbe7f0 | 13.10 | pass |
| ink on lavender #bbcaf1 | 10.63 | pass |
| white/#fafafa on #1a1a1a | 17.40 / ~16.7 | pass |
| dock icons #f7f7f7 on #1a1a1a | 16.25 | pass |
| bolt icon #1e1e1e on white pill | 16.67 | pass |
| "Weekly" ink on yellow thumb | 13.52 | pass |
| "Monthly" white on #1a1a1a track | 17.40 | pass |

### 3b. Secondary/tertiary text: the failures (measured = darkest pixel seen, so real values are <= these)
| Text | fg | bg | Ratio | Needs | Result |
|---|---|---|---|---|---|
| "1 friend" (cyan card) | #577d86 | #bbe7f0 | 3.37 | 4.5 | FAIL (15 px Medium text) |
| "12 Wed" (lavender) | #7783a9 | #bbcaf1 | 2.29 | 4.5 | FAIL |
| hashtags #work #planning #shopping | #727f9f | #bbcaf1 | 2.44 | 4.5 | FAIL |
| "International IT agency" | #9c9c9c | #ffffff | 2.75 | 4.5 | FAIL |
| "by" (Habits Journal) | #b9b9bb | #f6f6f8 | 1.81 | 4.5 | FAIL, near invisible |
| "Read now" link | #a0a0a2 | #f6f6f8 | 2.42 | 4.5 | FAIL (and underline is fainter still) |
| "8" in "7/8" | #c0c0c0 | #ffffff | 1.82 | 4.5 | FAIL, the denominator effectively disappears |
| "High" chip text (if true red #d84a5a) | #d84a5a | #ffffff | 4.16 | 4.5 (12 px) | FAIL (marginal); antialiased #aa6d72 measures 4.09 |
| red #d84a5a on lavender (if chip were transparent) | | #bbcaf1 | 2.54 | | FAIL, which is why it sits on a white pill |
| "2.8k" white on frosted overlay (~#6b645a) | #fff | #6b645a | 5.84 | 4.5 | pass at this sample, but depends on the photo behind it |

The mockup's grey tiers are ink at roughly 55% (cyan), 40-45% (lavender), 40% (white), 30-40% (surface). All are below the AA line. Verdict: the grey secondary text pattern is the image's main accessibility failure.

### 3c. Non-text contrast (1.4.11)
| Element | Ratio | Result |
|---|---|---|
| white circle button on #f6f6f8 | 1.08 | FAIL as a visible boundary; icon (ink) carries identification but the hit area is invisible |
| white circle button on lavender | 1.64 | FAIL (boundary) |
| outline ring #e4e4e4 on white | 1.27 | FAIL (ring is decorative-only at this value) |
| outline ring #abd7e0 on cyan | ~1.2 | FAIL |
| lavender hairline divider | 1.29 | fine (decorative) |
| black circle button on lavender / white / surface | 10.63 / 17.40 / 16.12 | pass |
| selected yellow thumb vs dark track | 13.52 | pass |
| dock pill (white) vs dock | 17.40 | pass |
| red dot #d84a5a on #1a1a1a | 4.18 | pass (>=3) |
| card vs card: yellow vs surface 1.19, cyan vs yellow 1.03, white row vs surface 1.08 | | The fills alone do NOT separate; the 4 px ink gutter does (gutter vs cards = 10.6-16.1:1). This is a legitimate trick: gutter-as-border. |

### 3d. Guaranteed-accessible text/line colours for tonal cards
Ink #1a1a1a blended at alpha over each surface (minimum alpha for 4.5:1, then recommended alpha with margin):

| Surface | min alpha 3:1 | min alpha 4.5:1 | recommended secondary (ink @ 72%) | ratio | ring/outline @ 55% (>=3:1) |
|---|---|---|---|---|---|
| lavender #bbcaf1 | 0.51 | 0.67 | #474b56 | 5.33 | #62697b = 3.35 |
| yellow #f8e297 | 0.49 | 0.63 | #58523d | 6.07 | #7e7452 = 3.62 |
| cyan #bbe7f0 | 0.49 | 0.63 | #475356 | 5.99 | #62767a = 3.60 |
| surface #f6f6f8 | 0.48 | 0.61 | #585858 | 6.59 | #7d7d7e = 3.81 |
| white #ffffff | 0.47 | 0.60 | #5a5a5a | 6.90 | #818181 = 3.90 |

Rules derived:
- `--ink-2` (secondary text) = ink at 72% alpha (or pre-mixed per surface with the hexes above). Worst case (lavender) is 5.33:1. There should be NO `--ink-3` text colour; "tertiary" must be expressed with size/weight/position, not with lower contrast. Non-text decoration (dividers) may go as light as ~10-15% because they carry no information.
- Interactive outlines/rings: ink at >=55% alpha (3.35-3.9:1) or a solid 1.5 px ink ring at lower alpha is not allowed. Alternatively use solid fills (the white circle on a pastel is 1.6:1, so give it a ring or use ink-filled).
- On the ink canvas: secondary text = white at >=60% alpha (#a3a3a3 = 6.9:1); ring = white at >=40% (#767676 = 3.83:1).
- Red for text must be darker than the mockup's: #b42318 gives 6.57:1 on white, 5.98:1 on #fff1f2. Keep #d84a5a-ish only for the dot/fill (4.18:1 on ink, non-text).

---

## 4. Shape language (measured)

Corner radii were fit by matching per-row edge profiles to circles (9 corners across lavender, white-row, light-card, yellow, cyan, hero cards).
- Tonal card radius: R = 24 px. The profile fits a circle of radius 24 within ~1 px at every depth (e.g. first-row offset 19 observed vs 19.1 predicted; 13 vs 13.3 at 2.5 px; 10 vs 10.0 at 4.5; 6 vs 5.7 at 8.5). Ratio to screen width 385: 6.2%. Identical on all five cards. At 390 px: 24 px.
- Card height vs radius: cyan card 68 px tall, radius 24 (35%, not a pill); yellow 180; white row 92; lavender 231; light card 405.
- Media (photo) radius: R = 28 px (fit: 22.7/19/16.4/12.8 predicted vs ~21/18/16/12 observed). Inset 13 px from card edges (x 540-898 inside x 527-911; bottom inset 13). So inner radius (28) is LARGER than the outer card radius (24). Concentric math would give 24 - 13 = 11; the designer instead sits the photo inside the phone's own ~48-52 px screen radius (48 - 13 = 35; 28 is between). Rule: do not copy; in the generic system use inner = max(outer - inset, 8) unless the parent is full-bleed to the device edge.
- Device outer corner radius (mockup): ~52-56 px (13.5-14% of phone width). Ignore, but real PWAs must handle device/viewport corners via `env(safe-area-inset-*)`.
- Chips, toggle, dock pill, date chip, circle buttons, avatars: fully rounded (radius = half the short side). Date chip 45 x 66 is a vertical stadium.
- Borders: none on cards. 1 px hairline rings on the outline circle buttons (ink ~8-10% alpha); 1 px divider inside the lavender card; ~1.5-2 px ink ring around the selected toggle segment (it is the dark track showing through, so the thumb looks like a yellow cut-out); ~2 px light ring around stacked avatars.
- Shadows: NONE anywhere (flat). Depth comes from tonal steps and the 4 px ink gutter. Frosted glass (blur + dark alpha) is used only over photography.

Sizes (image px; ratio to 385 screen width):
| Element | Size | Ratio |
|---|---|---|
| Circle button (primary family) | 46 | 11.9% |
| Circle button (small, hero arrow) | 38 (matches chip height) | 9.9% |
| Circle icon holder (trend icon, yellow card) | 32 | 8.3% |
| Pill chip with icon (Best result/Growth) | h 38; w 181 / 91; gap between chips 12 | |
| Tag chip "High" | 56 x 20 | |
| Domain chip | ~113 x 21 | |
| Toggle | 166 x 29 (track), thumb ~79 wide | |
| Dock | 107 tall incl. safe area; pill 82 x 45; columns 100 pitch | |
| Date chip | 45 x 66 | |
| Avatars | 36 (inline in headline), 46-47 (cyan card), 52 (header), ~38 (stack) | |
| Icon glyphs | 17-20 px inside 46 px circles (~40%); line icons, stroke ~1.5 px, rounded caps | |
| "Read now" arrow ring | 22 | |
| Views pill / "+" frosted circles | ~50 / ~40 | |

Spacing rhythm:
- Base unit 4 px. Card-to-card gutter = 4 px (visible ink), card inner padding = 13 px (12-14; "12 + 1 measurement error" or 14 at 0.96x), chip gap = 12, paired circle buttons gap = 6, label-baseline to headline cap-top = ~14, headline-to-divider ~ 24, divider to hashtags ~12.
- The numeric sizes 46 / 38 / 29-32 / 45 are NOT multiples of 4 in this image (~1.0x of a 390 pt layout they read as 48 / 40 / 32 / 48 when the design artboard is ~402 wide, i.e. ~0.957x). Best-fit generic sizes: control-lg 48, control-md 40, control-sm 32, which also satisfy touch targets.
- Card stack is full-bleed (no side margin): cards run edge to edge, hero card flexes to fill remaining viewport height; content anchored bottom (controls top, text bottom). This is a "viewport-filling stack", not a scrolling feed.

Touch targets (vs 385 px): circle buttons 46 OK (>=44); hero arrow 38 (<44, >=24); chips 38 (if interactive, <44); toggle 29 tall (<44, >=24, passes 2.5.8 only); dock items ~45 tall pill but inactive items have no visible bounds (presumably ~100 x 45); "Read now" arrow ring 22 FAILS 2.5.8 (<24) unless spaced; hamburger 17 and bell 17 glyphs have no visible container, hit area unknown.

---

## 5. Typography

Likely face: a Helvetica-descended neo-grotesque display cut (Neue Haas Grotesk Display / Helvetica Now Display look): horizontal terminals on c/s/a, straight-cut "t" top, single-storey "g", Helvetica-style "y" tail and "1", tight fit. Commercial; do not use.

Closest OFL/self-hostable equivalents (ranked):
1. Inter (v4 variable, axes wght 100-900 + opsz 14-32; its opsz "Display" end is the closest OFL match to Neue Haas Display at 36-72 px). Use opsz auto / `font-optical-sizing: auto`.
2. Hanken Grotesk (variable wght 100-900): a little softer, smaller file, very Helvetica-adjacent.
3. Inter Tight (tighter default spacing, matches the tracked-in look at 72 px).
4. Instrument Sans / Geist / Albert Sans / Public Sans as alternates; Figtree if friendlier/geometric is preferred.
Weight axis needed: a continuous wght axis covering 300-700 is sufficient (used instances: 300 Light, 400 Regular, 500 Medium, 600 SemiBold). No width axis. opsz optional but nice (display cut for >=28 px). A static-subset fallback of 300 / 400 / 500 / 600 Latin woff2 is viable for zero-build consumers.

Measured type scale (cap heights measured; size = cap / 0.714 for Helvetica-like, line pitch measured):
| Role | Size / line-height | Weight | Notes |
|---|---|---|---|
| Hero numeral "94%" | 72 / 72 (digit height 51-53) | Light 300 (stems 4-5 px = 0.06-0.07em) | lining, proportional, tight tracking (~ -0.03em est.), ink on pastel |
| Hero headline | 36 / 40 (cap 26, pitch 40.5) | 300 + 600 mixed in one sentence (light stem ~2.7 px = 0.075em; bold stem ~4.5 px = 0.125em) | sentence case, tracking ~ -0.01 to -0.02em (est.), 4 lines, bottom-anchored |
| Card headline | 29-30 / 33 (cap 21) | Medium 500 (lavender/media) or Light 300 (yellow card) | weight varies per card: ink-on-pastel "Medium" vs "Light" |
| List title ("Calling") | 16 / 20 | Medium 500 | |
| Date numeral in chip ("13") | 16 (digit h 12) | Medium 500 | "Thu" under it 13 px Regular, leading ~1.1 |
| Greeting on dark | 18 / 21 (cap 13) | Light 300, white | |
| Strip text ("New updates from") | 15 | Medium 500 + grey Regular for "1 friend" | two tones in one sentence |
| Toggle labels | 14 | Regular 400 | |
| Overline/label ("Statistics", "Current tasks") | 13 | Regular 400 | sentence case, NOT uppercase, NOT tracked: "overline" here is just a small label above the headline |
| Chip text | 13 | Medium 500 | |
| Meta/captions ("12 Wed", hashtags, subtitle) | 12-13 | Regular | grey (failing contrast) |
| Micro ("High", domain, "2.8k") | 11-12 | Regular | |

Headline treatment: Light + SemiBold inside one paragraph creates emphasis without colour. Inline objects (36 px wave emoji, 36 px round avatar) replace words and sit on the text line at the headline's cap height. Numerals are very large and light: the eye lands on the number, with the sentence title to its left as the label. Ratios between steps: 13 -> 16 -> 18 -> 29 -> 36 -> 72 (~1.2-1.25 at the low end, then 1.6, 1.25, 2.0): a practical "display-jump" scale.

Legibility flags: Light 300 at 18 px white-on-ink and 13 px grey is thin; recommend weight floor 400 below 20 px and weight floor 400 for any text on a pastel below 24 px.

---

## 6. Components (anatomy, states, accessibility)

### 6.1 Tonal card (bento block)
- Anatomy: container (radius 24, padding 13, full-bleed width or inset), slots: `meta` (top-left: icon + small text), `actions` (top-right: 1-2 circle buttons), `overline` (13 px label), `headline`, optional `value` (big numeral), `footer` (chips/hashtags/link/media). Variants: surface (#f6f6f8), white, yellow, cyan, lavender; always ink text.
- States: default; pressed (implied: darken/overlay ink 6-8%); focus-visible (ring); selected/expanded (implied by arrow "open" buttons); disabled (n/a).
- A11y: use `<article>`/`<section>` with `aria-labelledby` pointing at the headline; if the whole card navigates, use ONE real link (stretched-link pattern) not nested buttons; avoid fixed heights (use `min-height`) so 200% text and 320 px reflow never clip; keep DOM order = visual order; set `lang` on emoji-bearing spans.

### 6.2 Circle button family (one shape, three treatments)
- Sizes 46 (default), 38 (inline/small), 32 (decorative holder).
- Treatments (hierarchy): SOLID INK (primary action, e.g. "+", "open arrow", "repeat"), WHITE FILLED (secondary, e.g. "layers"), OUTLINE/GHOST (tertiary, 1 px ring; e.g. "eye", "=", "refresh", small arrow ring). Icon 17-20 px, stroke 1.5, same optical centre.
- States: default / hover (+fill tone) / pressed (scale .96 + darker tone; implied) / focus-visible / disabled (implied: 40% opacity is NOT acceptable for contrast; use dashed ring + aria-disabled) / loading (refresh glyph spins).
- A11y: native `<button type="button">` with visible text alternative via `aria-label` (icon-only) and tooltip/title; >=44x44 target (46 ok); ring must reach 3:1 against its surface (mockup 1.1-1.3:1 fails) or the fill must differ by 3:1; outline ring = ink at >=55% alpha on pastels; `aria-pressed` for toggles (eye show/hide). Icon-only meaning must be unambiguous: the mockup uses the SAME layers glyph on two phones for unknown actions, and the same refresh glyph for "refresh updates" and "repeat call" - fix by labelling.

### 6.3 Pill chip (icon + label)
- Anatomy: stadium, h 38 (or 24-28 compact), padding 12-16, icon (emoji in mockup; use SVG) 16-19 px + 13 px Medium label; white fill on #f6f6f8 card (1.08:1, fill alone does not delimit it; the text does).
- Variants: info chip (non-interactive), tag/priority chip ("High": white pill, red text + trend icon, 20 px), domain chip (white pill over photo, 12 px, reads like a URL), frosted overlay chips (blur).
- States: static vs interactive (filter chip: default/selected/disabled). Mockup shows only static.
- A11y: interactive chips are `<button>`/`<a>` >=44 tall (increase hit area with padding/`::after`); priority chip is text + icon + colour (3 redundant cues, not colour-only, good); keep the "8" in "7/8" at full ink (mockup greys it to 1.8:1); provide text alternative "Best result: 7 of 8 tasks".

### 6.4 Segmented toggle (Weekly | Monthly)
- Anatomy: dark ink stadium track (166 x 29), selected thumb = surface-coloured pill inset ~2 px (inherits the card's yellow, so it reads as a cut-out) with ink text; unselected label white on ink.
- States: selected, unselected, hover, pressed, focus-visible, disabled; implied thumb slide animation (150-250 ms).
- A11y: `role="radiogroup"` with two radios (or `tablist` if it swaps a panel); roving tabindex + Arrow keys; selected = aria-checked + shape (not colour-only: fill vs dark, good); target height 29 -> make 44 via padding on the group/hit-area; announce updated value with `aria-live="polite"` on the panel.

### 6.5 Big stat numeral ("94%")
- Anatomy: 72 px Light numeral, label text to the left, both in one card. No progress bar; "94%" is bare text.
- A11y: pair with the label via `aria-labelledby`/visually-hidden text "94 percent of tasks complete"; if it represents progress use `<meter>` or `role="progressbar"` with `aria-valuenow`; use `font-variant-numeric: tabular-nums` only when the value animates; respect reduced-motion for count-up.

### 6.6 Bottom dock / tab bar
- Anatomy: ink bar fused to the canvas (same #1a1a1a), 4 equal columns; inactive = icon only; active = white pill (82 x 45, radius full) holding the dark icon; expands from icon width (implies morph/slide animation); pill is the only active cue (shape + fill, not colour only, good).
- States: active, inactive, hover/pressed (implied), focus-visible (needs ring that contrasts on ink: white 2 px), badge (none shown).
- A11y: `<nav aria-label="Main">` with `<a>`/`<button>` items and `aria-current="page"`; visible text labels strongly recommended (4 icon-only destinations with abstract glyphs such as a lightning bolt are ambiguous); min 44x44 per item; honour `env(safe-area-inset-bottom)`; ensure sticky dock does not obscure focused content (WCAG 2.4.11): `scroll-padding-bottom`.

### 6.7 List row card
- Anatomy: date chip (45 x 66 dark vertical stadium; day number Medium 16 + weekday 13) | text stack (title 16 Medium + subtitle grey 13) | action cluster (outline circle + solid ink circle, 46, gap 6).
- States: default, pressed (row), selected/completed (implied; none shown), overdue (implied).
- A11y: use `<li>` in `<ul>` with `<time datetime>` for the date chip (visible text "13 Thu" must be duplicated as full date for SR: "Thursday 13"); actions as labelled buttons ("Reorder"? "=" is unclear, "Repeat"); subtitle must be >=4.5:1; drag/reorder (the "=" glyph implies a drag handle) needs a non-drag alternative (move up/down buttons) per WCAG 2.5.7.

### 6.8 Header with greeting, bell, avatar
- Anatomy: two-line light greeting (18 px, white on ink); bell icon 17 px with a 6 px red dot; 52 px avatar button.
- A11y: bell = button with `aria-label="Notifications, N new"` (the red dot is colour-only and non-textual); avatar = button "Open profile"; greeting is text content (emoji aria-hidden).

### 6.9 Media card with overlays
- Anatomy: header row (globe icon + "by" + publisher), overline + title, text link "Read now" + small ring arrow, 358 x 216 rounded (28) photo with overlays: domain chip (top-left), view-count frosted circle (bottom-left), frosted "+" circle + avatar stack (bottom-right, avatars overlap by ~4 px with 2 px light ring).
- A11y: photo `alt` describing content or `alt=""` if decorative; overlays sit on a variable background -> add a guaranteed scrim (linear-gradient ink 0 -> 55%) under bottom overlays and a solid-enough frost (ink >= 45% alpha + blur) so white text stays >= 4.5:1; avatar stack = `role="group"` "Shared with 3 people, add another", each avatar `alt` name; "+" is a labelled button "Add person"; link text "Read now" needs a unique accessible name ("Read Productive week"), >=4.5:1, >=24 px target, and the decorative ring arrow should NOT be a second tab stop.

### 6.10 Hashtag row + hairline divider
- Anatomy: 1 px divider (ink ~10%) then inline "#work #planning #shopping" 13 px at 40-45% ink (2.4:1, fail).
- A11y: if they filter content, make them chips/links with >=4.5:1 text and 24+ px targets; if they're static metadata, render as a `<ul>` "Tags" list; keep `#` visible (it isn't decorative: it tells sighted users they are tags) but hide from SR with CSS `content` or aria-hidden to avoid "hash work".

### 6.11 Status strip card (cyan) and circular refresh
- Anatomy: a 68 px tall pastel row: sentence (one part ink Medium, one part muted), outline refresh ring button, avatar.
- A11y: announce as `role="status"` when it appears; "1 friend" segment needs >=4.5:1; ring button needs a label ("Refresh updates") and the ring must be >=3:1.

### 6.12 Avatar / avatar stack / inline avatar
- Sizes 36, 46, 52; circular; 2 px light ring where stacked; "+" frosted circle is the affordance for add.
- A11y: decorative inline avatar in a heading = `alt=""`; profile avatar button = name; stack = grouped list with count.

### Implied motion
Toggle thumb slide (180-250 ms ease-out), dock pill slide/morph, refresh glyph rotation, count-up of 94%, hover-lift of circle buttons, wave emoji nudge, card-expand on the up-right arrow, avatar stack spread on hover. Provide `prefers-reduced-motion: reduce` static equivalents for all of them.

---

## 7. What is GENERIC (keep) vs ONE-OFF decoration

Generic / transferable
1. Ink canvas + tonal card stack with a 4 px gutter (gutter-as-border gives 10-16:1 separation that pastel-on-pastel cannot).
2. Card token set: radius 24, padding 12-14, slots meta/actions/overline/headline/footer; 1 surface + 1 white + 3 swappable "tint" tokens (any brand supplies three pastels with L >= 0.55 so ink text clears 10:1).
3. Circle-button family, three treatments mapped to action hierarchy, one size ladder (48 / 40 / 32), consistent icon-in-circle ratio (~40%).
4. Pill chip anatomy (icon + 13 px Medium label), tag chip, overlay chip.
5. Two-weight headline (300 + 600) and giant-light-numeral pattern for "what matters here".
6. Segmented toggle with inverse thumb; dock with morphing light pill.
7. Date chip (vertical stadium) as a scannable anchor in lists.
8. Text-over-photo overlay system (frosted chips + avatar stack).
9. Single sentence-case, no-caps label style; 13 px labels above headlines.
10. Flat (no shadow) depth model; frosted only on photos.

One-off decoration (do not generalise)
- Specific pastel hues (yellow, cyan, lavender, periwinkle page).
- Phone bezel, dynamic island, page colour.
- Emoji in copy (wave, trophy, halo-smile), inline avatar-as-word, "greate" copy.
- "Growth" red trend-up icon; "High" red text as the status hue.
- The specific glyph choices (layers, lightning, "=").
- Photo content and stock avatars.

---

## 8. Problems to fix in the generic system (severity order)

1. Secondary text fails AA across the board (1.8-3.4:1 measured on six separate strings; see 3b). Fix: `--ink-2` = ink @ 72% (>= 5.3:1 on every pastel), no third text tier.
2. The muted "8" in "7/8" (1.82:1) makes the score unreadable as "7/" - information loss. Never de-emphasise part of a value with lower contrast; use weight or size.
3. Invisible control boundaries: white circle on #f6f6f8 = 1.08:1, on lavender 1.64:1; outline rings 1.2-1.27:1. Fix: ring >= 3:1 (ink @ 55%) or solid fill with >= 3:1 against its surface; never rely on white-on-near-white.
4. Icon-only and ambiguous controls: menu (no container), layers (used twice, meaning unknown), eye (toggle vs counter), "=" (drag handle? equals?), refresh/repeat (used for two different actions), lightning and grid nav with no labels, up-right arrow (open/share?). Fix: visible label or tooltip + `aria-label` for every icon-only control; one glyph = one meaning in the icon map.
5. Dock without labels (4 abstract icons). Fix: label under or inside pill on active; 44 px min targets.
6. Sub-44 px targets: toggle 29, chips 38, hero arrow 38, "Read now" ring 22 (<24 fails 2.5.8), 17 px hamburger/bell glyphs. Fix: min 44 (24 absolute floor), expand hit areas invisibly.
7. Emoji used as content and structure (details in section 9), plus copy quality ("greate").
8. Red used with conflicting meaning: "High" priority (danger/urgency) and "Growth" (positive) both red; notification dot is colour-only. Fix: semantic colour tokens (danger/success/warning/info) each with text + icon + shape redundancy; dot gets a number or sr-only text.
9. Tiny/light type: 11-13 px labels, Light 300 at 13-18 px. Fix: body >= 16, secondary >= 14, absolute floor 12 (only for non-essential), weight floor 400 below 20 px.
10. Headline semantics: sentence broken across inline avatar + emoji + weight change; "Taylor! your overall score" is ungrammatical and the emoji interrupts the heading for SR. Fix: heading text must read as a clean sentence; decorative objects aria-hidden; bold = `<strong>`.
11. Numeral "94%" has no accessible name/meaning and no non-text progress representation.
12. Overlays on photos rely on the photo for contrast (white "2.8k" on unknown background). Fix: guaranteed scrim.
13. No visible focus, pressed, disabled, loading or error states anywhere in the mockup. Fix: define them for every component; focus ring = 2 px ink + 2 px white halo (works on all pastels) and white 2 px ring on the ink canvas (17.4:1).
14. Full-bleed fixed-height stacking won't survive 200% text/320 px reflow or long content; needs min-heights and scrolling, plus safe-area padding.
15. Pastel colours used as category identity with no text/icon secondary cue would fail 1.4.1; always pair with label/icon.
16. Hashtags unclear whether interactive; "Read now" link is grey with an even fainter underline.
17. Mixed hero-card weights across cards (Light on yellow, Medium on lavender) - choose per role, not per card.

---

## 9. Emoji rule for the generic guide

Observed: wave emoji inline in an h1-level sentence (36 px) and in the greeting (22 px), trophy emoji as the icon of a chip (19 px), halo-smile emoji ending a headline (28 px, apparently Apple emoji set). Problems: screen readers announce "waving hand: light skin tone" mid-sentence; the set differs per OS so layout/tone varies; skin-tone/wording is unthemeable; emoji replacing icons breaks icon consistency; halo-smile has ambiguous tone; emoji can't meet a contrast requirement.

Rule (proposed):
1. UI chrome (buttons, nav, chips, status) never uses emoji; use the SVG icon set (single stroke weight). Emoji are only for user/content text and the occasional warm greeting.
2. Decorative emoji: wrap `<span class="emoji" aria-hidden="true">&#128075;</span>` (no `role="img"`), and never put emoji inside `<h1>`-`<h6>` text that must be unique/readable; if it must be there, it is aria-hidden and the sentence must stand alone without it.
3. Meaningful emoji (e.g. a reaction): `<span role="img" aria-label="trophy">`; never the only carrier of meaning, always paired with text.
4. Size in `em` with `font-family: "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif; line-height: 1; vertical-align: -0.12em`; do not colour or filter; cap at 1em to keep baseline stable.
5. Copy lint: no emoji at the end of a heading as punctuation; max one emoji per view; none in `aria-label`/`title`/`<title>`/notification text/toast text.
6. Provide a setting/class (`.no-emoji`) to hide decorative emoji for reduced-distraction mode.

---

## 10. Suggested token values (derived, brand-agnostic)

```css
:root{
  /* canvas + surfaces */
  --canvas:#1a1a1a;           /* also gutter colour, dock, solid buttons */
  --surface:#f6f6f8;          /* large neutral card */
  --surface-raised:#ffffff;   /* chips, list rows, circle buttons */
  --tint-a:#f8e297;           /* yellow  (swap per brand) */
  --tint-b:#bbe7f0;           /* cyan    */
  --tint-c:#bbcaf1;           /* lavender, also page bg */
  /* ink + guaranteed secondary */
  --ink:#1a1a1a;
  --ink-2:color-mix(in srgb,var(--ink) 72%,transparent);   /* >=5.3:1 on every tint */
  --ring:color-mix(in srgb,var(--ink) 55%,transparent);    /* >=3.3:1 controls */
  --hairline:color-mix(in srgb,var(--ink) 14%,transparent);/* decorative dividers only */
  --on-canvas:#ffffff; --on-canvas-2:rgba(255,255,255,.65); --ring-on-canvas:rgba(255,255,255,.4);
  /* semantic (text-safe on white) */
  --danger-text:#b42318; --danger-fill:#d84a5a;
  /* shape */
  --radius-card:24px; --radius-media:28px; --radius-pill:999px;
  --gutter:4px; --pad-card:12px; --gap-chip:12px; --gap-btn:6px;
  /* control sizes */
  --control-lg:48px; --control-md:40px; --control-sm:32px; --hit-min:44px;
  /* type */
  --fs-label:13px; --fs-body:16px; --fs-lead:18px; --fs-title:29px; --fs-display:36px; --fs-stat:72px;
  --fw-light:300; --fw-regular:400; --fw-medium:500; --fw-semibold:600;
}
```
Note: alpha-based text colours should be pre-mixed per surface for guaranteed ratios when printed/forced-colours; under `forced-colors: active` fall back to CanvasText/ButtonBorder.

---

## 11. Confidence / caveats

- Card radius 24, media radius 28, gutters 4, circle button 46, chip height 38, padding ~13: high confidence (direct geometry, 9 corner fits).
- Ink alpha estimates for greys: medium confidence (derived from darkest antialiased pixels; true values could be ~5-10% darker, but still far below AA except "1 friend" which could approach 3.7-4.1).
- True red hex and frosted overlay colour: low confidence (tiny dot, translucent over photo).
- Typeface identification: medium; the recommended substitutes are functional matches, not pixel matches.
- Line heights and letter-spacing: estimated from glyph pitch; tracking values are guesses.
- Hover/pressed/focus/disabled states are not shown in the image; everything listed for them is inferred.
