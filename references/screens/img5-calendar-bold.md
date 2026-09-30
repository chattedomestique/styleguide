# Image 5 design DNA: "Bold tonal calendar" (uiux.aditya, 3 iPhone screens)

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/a83e552a-image.jpg` (564 x 564 JPEG).
Analyst scripts (reproducible): `scratchpad/analysis/img5/{lib5,edge,ink,geom,oklch}.py`.
Status: read-only analysis. Nothing under `/home/user/styleguide` was touched.

---

## 0. TL;DR

* **Style family:** "Bold tonal cards on warm paper". A warm stone page (`#e7e7dd`) carries full-width rounded cards, each flooded with ONE muted-saturated colour (maroon, vermilion, periwinkle, sage, charcoal, navy, teal, slate, citron). Type is a single neo-grotesque (Inter / Helvetica-Now class) in big, confident sizes. Controls are plain black: 2 px outlined pills, one solid-black selected pill, round 2 px outlined icon buttons. Almost no shadow, no gradients.
* **What transfers:** one radius (about 20 px) for every card, fully-round controls, 4 px spacing grid, a neutral paper + near-black ink, and a *family of tonal fills* where colour is an identity/grouping device on a calm neutral canvas. Huge numerals as the hero element. Filled-vs-outlined pills as selection.
* **What must change:** the look is excellent but **the contrast is poor in exactly the places where the look is boldest**. White text on periwinkle is 2.42:1, on sage 1.94:1, on citron 1.78:1, on vermilion and teal 3.97:1. Secondary text is rendered as translucent white (measured about 1.4 to 3:1 on most fills). Chip text is about 10 px. The month neighbours DEC/FEB are 1.44:1. The fix is cheap: give every tonal fill an explicit, pre-verified "on-colour" (white on the dark ones, near-black on the pastel ones; the mockup itself already does this once, with dark "August" on citron), ban alpha text, and set a 12 px floor.
* **Scale caveat:** the image is tiny. Each phone screen is only **149.94 px wide**, so 1 image px = 2.60 CSS px on a 390 frame (2.62 on a 393 frame). Every size below is +/-1 image px (+/-2.6 CSS px); small-text colours are diluted by anti-aliasing and JPEG chroma subsampling. Where I could not measure, I say "estimate".

---

## 1. Calibration and measurement method

| Item | Result |
|---|---|
| Image | 564 x 564, RGB JPEG |
| Phone screen width (sub-pixel edge crossing, all 3 phones) | 149.94 / 149.93 / 149.95 px (very consistent) |
| Dynamic Island width | about 46 px, consistent with a 393 pt iPhone Pro frame (125 pt island) |
| Scale used | **1 image px = 2.60 CSS px** (390 frame). For 393: multiply by 1.008 |
| Screen aspect | 149.94 x 330.8 px = 1 : 2.206 (slightly taller than a true iPhone 15 Pro at 1 : 2.168; the mockup frame is not exact) |
| Colour sampling | Mode of quantised pixels (4-level bins) over flat regions, then median of the winning bin. Text ink = "peak ink" (most extreme 10 to 20 % of ink pixels inside a text cluster) |
| Edge / radius | Sub-pixel half-crossing of luminance between bezel/paper/fill; radius by least-squares circle fit to the first 16 rows of each corner |
| Text size | Ink bounding boxes (minus the 2 x dilation I used), converted with Arial/Inter advance widths and cap heights. Accuracy about +/-15 % |

**Important reading rule for thin text.** Anti-aliasing can only move a thin glyph's peak pixel toward the background, never away. So for text measurements, "measured peak contrast" is a **lower bound** on the designer's real ink contrast. For the big numerals (which reach true ink, e.g. `#010000`, `#ffffff`) the measurement is exact. I therefore report two numbers for small text: **nominal** (assuming the obvious intended ink: pure white, or near-black) and **measured** (what actually reached the eye in the image). Both matter: the nominal figure shows what the designer specified; the measured figure shows what a 1x viewer sees.

---

## 2. Inventory of every visible element

### Screen 1: "Today" home
1. iOS status bar (9:41, signal, wifi, battery) and Dynamic Island (mock chrome, not app UI).
2. Greeting block: "Good Morning, **Aditya**" + crown emoji, sub-line "Have a great day!" (grey).
3. Round avatar top-right (about 22 px = 57 CSS px).
4. Filter pills: `Today` (selected, solid near-black), `Tomorrow`, `All` (outlined), plus an outlined round "+" icon button.
5. Weekday label "Thursday".
6. **Hero date block**, split by a 1 px vertical hairline: left "25" (bold, about 78 px) over "JANUARY" (regular caps, about 40 px); right "08.00" over "Indonesia" (time + zone, grey).
7. Horizontal hairline rule.
8. **Event cards** (full width, tall): maroon "You Have A Meeting" (time 10.45, pin + "Lotte Lounge", avatar cluster of 4), vermilion "You Have A Lunch W/ Client" (12.10, pin + "Rodist Resto", 2 avatars), deeper periwinkle "Don't Forget Yours..." (19.45, cut off by the screen bottom; scroll affordance).
9. Home indicator bar overlapping the bottom content.

### Screen 2: "Month / day list"
1. Same filter pills (this time `All` is selected) + round "+".
2. **Month switcher**: `DEC` (faded) `<` **`JAN`** `>` `FEB` (faded).
3. Hairline rule.
4. **Day rows** (full width, about 126 px tall): charcoal SAT 27 JAN, vermilion SUN 28 JAN, periwinkle MON 29 JAN, maroon TUE 29 JAN (sic, content bug), sage WED 30 (cut off). Each row: left date rail (day name / big number / month), then 3 time columns separated by 1 px vertical rules, each with a time label ("10.00", "12.30", "20.00") and small translucent **event chips** ("Lunch W/meals", "Deadline", "Meetings", "Check Up", "Clients Lunch", "Meal", "Coaching", "Redesigning"). Bottom-right of every row: a circled "+".
5. Soft-edged bottom crop + home indicator.

### Screen 3: "Year / months grid"
1. **App bar**: round outlined back arrow, pill **search field** (magnifier + placeholder "Date, Month, or Event"), round outlined "+".
2. **2-column grid of month mini-calendars**, each its own colour: January sage, February lavender, March maroon, April charcoal, May navy, June teal, July slate (cut off), August citron (cut off, *dark* text).
3. Each mini-calendar: centred month name, S M T W T F S header, 7 x up-to-6 date grid. Sunday column (and some arbitrary days) is tinted a darker/dimmer variant of the card colour. **Today (25 Jan) is a filled blue disc with white digit**, the only blue in the whole system.
4. Home indicator drawn white over the "July/August" tiles.

### Mock chrome (ignore for the system)
Page canvas `#eeeeee`, title "UI Designer", black phone bezels with a soft shadow (`#dadada` between phones), footer pill `#f6f6f6` with handle "uiux.aditya" and a bookmark icon.

---

## 3. Measured palette

All measured unless marked. OKLCH computed from the measured hex.

| Role | Hex | Measured where | OKLCH (L / C / h) | Notes |
|---|---|---|---|---|
| Presentation canvas | `#eeeeee` | top-left 20x100 block, bottom strip (100 % of pixels) | 0.949 / 0.000 / - | Mock chrome only |
| Phone shadow zone | `#dadada` | gap between phones | - | Mock chrome only |
| **Paper / screen background** | **`#e7e7dd`** | mode of all 3 screens (21 % of screen 1) | 0.925 / 0.013 / 107 | Warm greige, slightly green. The calm neutral that makes the fills sing |
| Ink (primary text, outlines) | about `#111111` (measured extremes `#010000` on "25", `#000000` on "JAN") | numerals, title, outlines | - | Near-black, not pure. Estimate of the exact token (measured=false); selected-pill fill measured `#191815` |
| Selected pill fill | `#191815` | "Today" pill (mean of interior) | - | Warm near-black |
| Secondary ink (grey) | about `#8d8d85` or darker | "Have a great day!", "Indonesia" (peak ink, **lower bound**) | - | True token unknown, probably `#777` to `#8a8a8a`; measured=true as a bound, exact=false |
| Disabled neighbour month | `#c2c2b8` | DEC / FEB peak ink | - | About 1.44:1 |
| Hairline | `#cbcbc1` (horizontal), `#d4d4ca` (vertical), `#deded6` (P2 rule) | 1 px lines | - | Decoration only |
| Search field fill | `#cbcbc3` | interior of search pill | 0.840 / 0.011 / 107 | No border |
| Search icon/placeholder | `#7e7e76` (peak) | inside search | - | About 2.5:1 on its fill |
| **Maroon** | **`#885053`** | P1 card 1, P2 row 4, P3 March (3 independent samples: `#885053`, `#885053`, `#875053`) | 0.497 / 0.075 / 17 | Muted merlot |
| **Vermilion / coral** | **`#d5583c`** | P1 card 2, P2 row 2 (identical) | 0.617 / 0.164 / 34 | The hottest colour; only high-chroma accent |
| **Periwinkle** | **`#9ca3da`** | P2 row 3, P3 February | 0.730 / 0.080 / 279 | Pastel |
| Periwinkle (deep) | `#787ca6` (`#757ba9` to `#797ea5` by row) | P1 third card, constant from top to bottom of the card | 0.601 / 0.055 / 277 | About 0.77 x the pastel periwinkle: either a separate token or an overlay/scrim. Unknown, flag it |
| **Sage** | **`#9fc588`** | P2 row 5, P3 January (`#9fc687`) | 0.780 / 0.093 / 134 | Pastel green |
| **Charcoal** | **`#393939`** | P2 row 1, P3 April (`#393939`, 40 % of the card) | 0.345 / 0.000 | Neutral dark fill |
| **Navy (petrol)** | **`#1b2f3a`** | P3 May | 0.293 / 0.033 / 234 | |
| **Teal** | **`#348aa1`** | P3 June | 0.592 / 0.088 / 219 | |
| Slate | `#36495d` | P3 July (small region, 59 px) | 0.398 / 0.042 / 250 | |
| Citron (olive-yellow) | `#cac746` | P3 August (small region, 46 px) | 0.809 / 0.148 / 108 | Only card with dark text |
| Today marker blue | about `#0b66c4` | **estimate** (measured=false). Ring pixels `#1b6f8b` to `#287ba5` are blended with sage; interior is contaminated by the white digit | - | Deblending gives about (11, 100, 191) |
| On-colour (ink on fills) | `#ffffff` | "27" on charcoal reaches exactly `#ffffff`; other fills show `#fff3f5` to `#f0f7ff` (JPEG chroma bleed) | - | Assumed pure white |
| Dark ink on citron | about `#565400` extreme, true value not recoverable | "August" | - | Likely near-black, maybe translucent |
| Chip overlay on charcoal | `#646464` | P2 chips | - | = white at about 22 % over `#393939` |
| Chip overlay on periwinkle | `#797ea8` | P2 chips | - | = black at about 23 % over `#9ca3da` (x 0.775) |
| Chip overlay on maroon | `#5c3437` | P2 chips | - | = black at about 34 % over `#885053` (x 0.66). Three different overlay strengths = inconsistent |

**Palette logic.** The system is a *neutral paper + near-black ink* base with **about nine flat tonal fills**. Hue angles step around the wheel: maroon 17, vermilion 34, citron 108, sage 134, teal 219, navy 234, slate 250, periwinkle 279. Chroma is deliberately low to mid (0.03 to 0.16), lightness spans the full range (0.29 to 0.81). That span is what breaks contrast: the pastel half (L >= 0.73) can only carry dark ink and the dark half (L <= 0.50) can only carry white; the mockup uses white on both.

Luminance coincidence worth knowing: vermilion, teal and the deep periwinkle all have relative luminance **0.215**, so white on each is exactly 3.97:1 and `#111` on each is 4.76:1. They sit in the "dead zone" where neither ink passes comfortably.

---

## 4. Contrast audit (WCAG 2.x)

Thresholds: 4.5:1 body, 3:1 large (>= 24 px, or >= 18.66 px bold), 3:1 non-text UI.

### 4.1 Ink on each tonal fill (the core problem)

| Fill | Hex | White (#fff) | Near-black #111 | Verdict in the mockup (white ink) |
|---|---|---|---|---|
| Charcoal | `#393939` | **11.55** | 1.64 | PASS |
| Navy | `#1b2f3a` | **13.87** | 1.36 | PASS |
| Slate | `#36495d` | **9.26** | 2.04 | PASS |
| Maroon | `#885053` | **6.33** | 2.98 | PASS |
| Vermilion | `#d5583c` | 3.97 | **4.76** | FAIL body (passes large only) |
| Teal | `#348aa1` | 3.97 | **4.76** | FAIL body (passes large only) |
| Deep periwinkle | `#787ca6` | 4.01 | **4.70** | FAIL body (borderline) |
| Periwinkle | `#9ca3da` | 2.42 | **7.79** | **FAIL even large** |
| Sage | `#9fc588` | 1.94 | **9.73** | **FAIL even large** |
| Citron | `#cac746` | 1.78 | **10.58** | **FAIL even large** (mock swaps to dark text here: correct instinct) |
| Paper | `#e7e7dd` | 1.24 | **15.17** | n/a |

Rule of thumb that falls out: **white ink needs fill luminance <= 0.183; `#111` ink needs fill luminance >= 0.20**. Avoid fills whose luminance is 0.18 to 0.20.

### 4.2 Text the designer drew semi-transparent (white at reduced opacity)

The measured secondary text on dark fills sits around white 50 to 65 %. Composited white ink at alpha on each fill (all nominal):

| Fill | a = 1.0 | a = 0.8 | a = 0.7 | a = 0.6 | a = 0.5 |
|---|---|---|---|---|---|
| Maroon | 6.33 | 4.72 | 4.01 | 3.40 | 2.87 |
| Vermilion | 3.97 | 3.10 | 2.70 | 2.36 | 2.06 |
| Periwinkle | 2.42 | 2.08 | 1.90 | 1.75 | 1.61 |
| Sage | 1.94 | 1.71 | 1.62 | 1.52 | 1.42 |
| Charcoal | 11.55 | 8.02 | 6.62 | 5.33 | 4.21 |
| Navy | 13.87 | 9.39 | 7.62 | 6.01 | 4.65 |
| Teal | 3.97 | 3.14 | 2.76 | 2.42 | 2.11 |
| Slate | 9.26 | 6.65 | 5.50 | 4.52 | 3.66 |
| Citron | 1.78 | 1.60 | 1.51 | 1.43 | 1.34 |

Lesson: alpha text contrast depends on the fill. The same "60 % white" token is 6.0:1 on navy and 1.5:1 on sage. **Secondary text must be a solid, per-fill, pre-verified token, never an opacity.**

### 4.3 Every identified text pair (nominal vs measured)

"Measured" is a lower bound for thin text (see Section 1).

| Element | Approx. size | Ink / fill | Nominal | Measured | AA? |
|---|---|---|---|---|---|
| Greeting, date numerals, headings | 20 to 78 px | `#111` on `#e7e7dd` | 15.17 | 16+ | PASS |
| "Have a great day!" | about 16 px | grey on paper | about 3 to 4 (guess) | >= 2.69 (`#8d8d85`) | **FAIL** (most likely) |
| "Indonesia" | about 16 to 18 px | grey on paper | about 3 to 4 (guess) | >= 2.66 (`#8e8e84`) | **FAIL** |
| DEC / FEB neighbours | about 20 px | `#c2c2b8` on paper | 1.44 | 1.44 to 1.54 | **FAIL** (they are tappable, so not "inactive") |
| Search placeholder + icon | about 13 px | `#7e7e76` on `#cbcbc3` | - | 2.51 | **FAIL** |
| Selected pill label | about 15 px | `#fff` on `#191815` | 18.12 | - | PASS |
| P1 card title (maroon) | 24 px 600 | white on `#885053` | 6.33 | 5.8 to 6.0 | PASS |
| P1 card title (vermilion) | 24 px 600 (near-large) | white on `#d5583c` | 3.97 | 3.2 to 3.4 | FAIL body, borderline large |
| P1 card meta "Lotte Lounge", time | 15 to 20 px | white on maroon | 6.33 | 4.1 to 5.0 | PASS nominal, weak as rendered |
| P1 card meta on vermilion | 15 to 20 px | white on `#d5583c` | 3.97 | 2.6 to 3.0 | **FAIL** |
| P1 third card title | about 24 px | white on `#787ca6` | 4.01 | 3.9 | FAIL (borderline) |
| P2 date rail "SAT 27 JAN" on charcoal | 24 / 40 px | white | 11.55 | 9.2 to 11.6 | PASS |
| P2 date rail on vermilion | 24 / 40 px | white | 3.97 | 2.8 to 3.6 | FAIL small, pass large for "28" |
| P2 date rail on periwinkle | 24 / 40 px | white | 2.42 | 2.1 to 2.4 | **FAIL** |
| P2 date rail on maroon | 24 / 40 px | white | 6.33 | 5.0 to 5.8 | PASS |
| P2 time labels "10.00" (about 15 px, about 60 % white) | | charcoal | 5.33 | 4.05 | borderline |
| | | vermilion | 2.36 | 1.99 to 2.04 | **FAIL** |
| | | periwinkle | 1.75 | 1.65 | **FAIL** |
| | | maroon | 3.40 | 2.68 | **FAIL** |
| P2 chip text (about 10 px) | | white on chip `#646464` (charcoal row) | 5.92 | 2.08 to 2.24 | FAIL (size < 12 px) |
| | | white on chip `#797ea8` (periwinkle row) | **3.92** | **1.75 to 1.80** | **FAIL** |
| | | white on chip `#5c3437` (maroon row) | 10.49 | 2.88 to 3.25 | FAIL (size) |
| P3 month title (about 17 px, about 60 % white) | | sage | 1.52 | 1.34 | **FAIL** |
| | | lavender | 1.75 | 1.67 to 1.79 | **FAIL** |
| | | maroon | 3.40 | 2.95 to 3.16 | **FAIL** |
| | | charcoal | 5.33 | 4.5 to 4.75 | pass/borderline |
| | | navy | 6.01 | 6.3 to 7.1 | PASS |
| | | teal | 2.42 | 2.13 to 2.36 | **FAIL** |
| | | slate (opaque white) | 9.26 | 9.1 | PASS |
| | | citron (dark text) | 10.58 | 3.4 to 4.4 (dark ink measured `#565400` to `#696600`) | PASS nominal, weak as rendered |
| P3 date digits (about 11 px, white) | | sage | 1.94 | 1.5 to 1.7 | **FAIL** |
| | | lavender | 2.42 | 1.7 to 1.9 | **FAIL** |
| | | maroon | 6.33 | 3.5 to 4.6 | pass nominal |
| | | charcoal | 11.55 | 5.0 to 9.1 | PASS |
| | | navy | 13.87 | 5.9 to 9.7 | PASS |
| | | teal | 3.97 | 2.6 to 3.4 | **FAIL** |
| P3 "Sunday" column + tinted days (darker tint of the card colour) | about 11 px | sage `#5b844c`(measured), lavender `#827cc5`, maroon `#5a2628`, teal `#065569` | - | 1.5 to 2.3 | **FAIL**; meaning unexplained (colour-only) |
| P3 dim days (April 7 to 11) | about 11 px | `#646466` on `#393939` | - | about 2.0 to 2.3 | FAIL; looks disabled, but unexplained |

### 4.4 Non-text contrast (WCAG 1.4.11, 3:1)

| Item | Ratio | Verdict |
|---|---|---|
| Pill / circle-button outline `#161614` on paper | 14.56 | PASS |
| Search field fill `#cbcbc3` vs paper (no border) | **1.31** | **FAIL** (no boundary; relies on icon + placeholder) |
| Card colour vs paper: maroon 5.08, charcoal 9.28, vermilion / teal 3.19, periwinkle 1.95, sage 1.56, citron 1.43 | | Cards are containers of text, so edge contrast is not required, but the pastel cards have weak edges |
| Event chip fill vs card: 1.95 (charcoal), 1.62 (periwinkle), 1.66 (maroon) | | **FAIL** if chips are interactive (they look like buttons) |
| White ring/icon on vermilion / teal | 3.97 | PASS |
| White ring/icon on periwinkle / sage / citron | 2.42 / 1.94 / 1.78 | **FAIL** (per-row "+" ring, pin icon on periwinkle) |
| Today-marker blue (est `#0b66c4`) vs sage | 2.91 | borderline fail; vs lavender 2.33, vs teal 1.43, vs navy 2.45, vs vermilion 1.43 -> **only works on sage, by hue, not contrast** |
| White digit on today blue (est) | 5.66 | PASS |
| Hairline dividers `#cbcbc1` / `#d4d4ca` / `#deded6` vs paper | 1.31 / 1.2 / 1.09 | Decorative only; fine, but they carry structure invisibly |

### 4.5 Fixes that keep the look (computed, OKLCH lightness bisection, hue and chroma preserved)

| Token | Mockup fill | Problem | Keep-look fix | Ratio |
|---|---|---|---|---|
| Vermilion | `#d5583c` | white 3.97 | fill `#ca4e33` + white 4.52, **or** `#ba3e23` + white 5.52 (headroom for muted text); alternative: keep fill, use `#161616` ink 4.56 (no muted headroom) | 4.52 / 5.52 |
| Teal | `#348aa1` | white 3.97 | `#288097` + white 4.54, **or** `#137289` + white 5.53 | 4.54 / 5.53 |
| Deep periwinkle | `#787ca6` | white 4.01 | use pastel `#9ca3da` + `#161616` (7.47) instead | 7.47 |
| Periwinkle | `#9ca3da` | white 2.42 | keep pastel, ink `#161616` | 7.47 |
| Sage | `#9fc588` | white 1.94 | keep pastel, ink `#161616` | 9.32 |
| Citron | `#cac746` | white 1.78 | keep pastel, ink `#161616` | 10.14 |
| Maroon / Charcoal / Navy / Slate | - | ok | white | 6.33 / 11.55 / 13.87 / 9.26 |

Solid muted (secondary) inks that still clear 4.5:1 (replace alpha): maroon `#e4d7d7`, periwinkle `#393b49`, sage `#424e3a`, citron `#535226`, slate `#afb6be`, navy `#8b959b`, charcoal `#a2a2a2`, paper `#676763` (this last replaces the mock's roughly 2.7:1 grey; the lightest neutral grey on paper that passes 4.5 is `#676767`, 3:1 is `#848484`).

Two generic contrast rules fall out: (1) every tonal token ships with an `--on-*` token verified >= 4.5:1, plus `--on-*-muted` >= 4.5:1; (2) CI check: fill luminance <= 0.18 gets white, >= 0.20 gets dark, avoid the gap.

---

## 5. Shape language

Scale conversion: 1 px = 2.60 CSS px (390 frame). Uncertainty +/-1 px (+/-2.6 CSS px).

### 5.1 Corner radii (least-squares circle fit, both top corners)

| Element | Fit r (img px) | CSS px | As ratio |
|---|---|---|---|
| P1 event cards (63.9 x 139.7 px = **166 x 363 CSS**) | 7.0 to 7.25 | **18.2 to 18.9** | 11 % of height, 5 % of width |
| P2 day rows (48.5 x 139.8 px = **126 x 363 CSS**) | 7.0 to 7.25 | 18.2 to 18.9 | 14.8 % of height |
| P3 month cards (82.3 x 68.6 px = **214 x 178 CSS**) | 7.0 to 7.5 | 18.2 to 19.5 | 8.8 % of height, 10.5 % of width |

The bottom-corner fits came out smaller (about 5 px) only because a faint shadow darkens the paper under the card; the tops are reliable. **Conclusion: ONE card radius, about 19 to 20 CSS px.** Recommend a 20 px token.

| Other element | Radius |
|---|---|
| Filter pills, search field, avatars, "+" / back buttons | fully round (r = height / 2 = 50 %) |
| Event chips (P2) | about 8 px (estimate, too small to fit; about 0.3 x the 29 px chip height) |
| Phone bezel (mock) | n/a |

### 5.2 Borders and lines

| Item | Width (from ink integration) |
|---|---|
| Pill outline ("Tomorrow", "All"), circle button rings | 0.9 to 1.0 img px = **2.3 to 2.6 CSS px, call it 2 px** `#161614` |
| Per-row "+" ring | about 1.4 px img = about 2 px (light, on the fill) |
| Hairlines (date-block vertical rule, horizontal rule, row column dividers) | about 1 px CSS; colours above. Row dividers are a light translucent line (white about 30 to 50 %) |
| Cards and chips | **no border** (fill only) |

### 5.3 Shadows

* P1 event cards and P3 month cards: **no measurable shadow** (only a 1 to 2 px JPEG ring).
* P2 day rows: a very soft shadow, about 2 to 3 img px of darkening under the bottom edge (luminance dips from 228 to 191 at the edge and recovers within 3 px). Estimate: `0 2-4px 6-8px rgba(0,0,0,.10)`, measured=false.
* Conclusion: the style is essentially flat, separation by colour rather than elevation. Good for a cheap, consistent system.

### 5.4 Spacing rhythm (CSS px)

| Measure | Value |
|---|---|
| Screen gutter | P2: 13.1 / 13.3 (both sides; most reliable). P1 cards are off-centre (15.3 L / 11.5 R). Treat as **12 to 16 px; adopt 16** |
| Card vertical gap (P1, P2) | **about 24 px** (9.35 to 9.6 img px), P2 last gap 22.7 |
| P3 grid: column gap | about 10 px; row gap about 16 px; side margin about 11.5 px; card 178 x 214 px |
| Card inner padding | about 16 px (P1 text starts 14.5 px from the edge), about 24 px left in P2 day rows, about 12 px in month cards |
| Pill gap | about 15 to 17 px (Today->Tomorrow 17, Tomorrow->All 15, All->"+" 15.6) |
| Header block -> pills | about 39 px; pills -> weekday label about 21 px; "25" -> "JANUARY" about 18 px; date block -> rule about 44 px; rule -> first card about 30 px |
| App bar (P3) | back ring 39, gap about 14, search 38 tall, gap about 14, plus ring 38 |

Base unit: **4 px** (most values land on 4-multiples: 12, 16, 20, 24, 40; the "13" gutter is within error of 12). Major steps 8 / 16 / 24 / 40.

### 5.5 Sizes and touch targets (CSS px, 390 frame)

| Element | Size | vs 44 px (iOS/Material) | vs WCAG 2.2 min 24 px |
|---|---|---|---|
| Filter pills | **about 38.5 tall** x 89 to 117 wide | under 44 | pass |
| Round "+" / back buttons | **about 39 diameter** (15 img px) | under 44 | pass |
| Search field | about 38 tall | under 44 | pass |
| Avatar (header) | about 57 | pass | pass |
| Avatars in cards | about 28 diameter, step about 24 (overlap about 4 px) | n/a | decorative |
| Per-row "+" ring | about 32 | under 44 | pass |
| Event chips | about 28 tall x 50 to 78 wide | under 44 | pass |
| **Calendar day cells** | pitch **23.5 x 23.7**, today disc about 20 | **far under 44** | **borderline fail**: pitch 23.5 < 24, today disc 20 < 24 |
| Month cards (whole tile tappable, presumably) | 178 x 214 | pass | pass |
| Day rows (whole row) | 126 tall | pass | pass |
| Icons (pin, magnifier) | about 20 to 24 px glyph, about 1.5 to 2 px stroke | - | - |

Generic rule: visible control 40 px with 44 px hit area (padding or `::after`), calendar cells padded to 44 x 44 hit area even if the glyph stays small.

---

## 6. Typography

### 6.1 Likely typeface

A **neo-grotesque** in the Helvetica Now / Neue Montreal / Inter class. Evidence: single-storey `g`, double-storey `a`, straight-leg `R`, `J` with a short hook, flat-cut `2` and `5`, relatively wide caps.

Numeric fit: the ink width/cap-height of "JANUARY" is 6.09 (measured). Computed width/cap-height from font files: Inter Tight 6.00, DM Sans 6.12, Figtree 6.45, Onest 6.50, Arial metrics 6.78, Archivo 7.07. So the face is **Inter-class (or slightly narrower)**.

**OFL / Google Fonts equivalents that can be self-hosted (woff2):**
1. **Inter** (variable, opsz axis): closest match; `font-feature-settings: "tnum","cv11"` (single-storey a optional), `"ss01"` alternates.
2. **Inter Tight** for the hero numerals and big caps (tighter, same DNA).
3. Friendlier alternatives if a softer tone is wanted: **Figtree**, **Onest**, **DM Sans**, **Hanken Grotesk**, **Instrument Sans**. All OFL.

### 6.2 Observed type scale (CSS px, +/-15 %)

| Role | Sample | Est. size | Weight | Notes |
|---|---|---|---|---|
| Display numeral | "25" | **about 78** (digit height 21.5 img px = 56 px) | 700 | tight, about -0.02em, line-height about 0.9 |
| Display caps | "JANUARY" | **about 40** (cap 11.5 img px = 30 px) | 400 | caps, 0 tracking |
| Time display | "08.00" | about 30 | 500 | tabular, period separator |
| Month switcher current | "JAN" | about 28 | 400 | caps |
| Month switcher neighbours | "DEC" "FEB" | about 20 | 400 | grey, 1.44:1 |
| Day-row numeral | "27" | about 40 | 400 | |
| Day-row name / month | "SAT" "JAN" | about 24 to 26 | 400 | caps |
| Event card title | "You Have A Meeting" | about 24 | 600 | line pitch about 32.5 px (LH about 1.35) |
| Section / weekday label | "Thursday" | about 20 | 600 | |
| Greeting | "Good Morning, **Aditya**" | about 20 | 500 + 700 name | |
| Card time | "10.45" | about 19 to 20 | 500 | |
| Sub-line / zone | "Have a great day!", "Indonesia" | 16 to 18 | 400 | grey |
| Pill labels | "Tomorrow" | about 15 | 600 | |
| Card meta | "Lotte Lounge" | about 15 | 600 | |
| Row time labels | "10.00" | about 15 | 400 | about 60 % white |
| Search placeholder | "Date, Month, or Event" | about 13 | 400 | |
| Month title (mini-cal) | "February" | about 17 | 400 | about 60 % white |
| Mini-cal digits | "1 2 3 ..." | **about 11 to 12** | 500 | tabular; cell pitch 23.5 |
| Mini-cal weekday letters | "S M T W T F S" | **about 9 to 10** | 500 | low emphasis |
| Event chip text | "Clients Lunch" | **about 10** | 500 | |

So the real smallest sizes are **9 to 10 px**, three classes of text are below 12 px, and there are about 15 distinct sizes. The generic scale should compress to a modular set (see Section 10).

### 6.3 Numerals and treatment

* Hero numerals are the identity of the design: a giant bold day number stacked above a regular-weight, all-caps month name at about half the size. Contrast of weight (700 vs 400) and size (2:1) does the hierarchy, not colour.
* Times use a period separator "08.00" (locale-style). For a generic system render times via `Intl.DateTimeFormat` and set `font-variant-numeric: tabular-nums` so columns of times align.
* Caps are used for scan labels (day names, months); modest positive tracking (about +0.02em) would help small caps; the mock uses about 0.

---

## 7. Components: anatomy, states, accessibility

### 7.1 Filter pill group (Today / Tomorrow / All)
* **Anatomy:** horizontal row of fully-round pills, height about 38.5 px, padding about 16 px horizontal, label 15 px / 600. Unselected = 2 px `#161614` outline on paper; selected = solid `#191815` fill, white label. Row wraps a trailing "+" circle button.
* **States:** selected (filled) / unselected (outlined) visible. Hover, pressed, focus, disabled not shown.
* **Good:** the selected state is carried by *fill vs outline*, not by colour alone.
* **A11y needed:** `role="tablist"`/`tab` with `aria-selected`, or `role="radiogroup"` with `aria-checked`; roving tabindex + arrow keys; visible focus ring 2 px offset 2 px; 44 px hit area; `aria-controls` the list.

### 7.2 Round icon button ("+", back arrow, chevrons)
* **Anatomy:** about 39 px circle, 2 px ring, centred 24 px icon, stroke about 2 px.
* **States:** default only. Needs pressed (fill invert), focus, disabled.
* **Problem:** icon-only and ambiguous; the same "+" circle means *add event* in three different places. **A11y:** `<button aria-label="Add event">`, label varies by context ("Add event on Monday 29 January"), 44 px target.

### 7.3 Greeting header with avatar
* **Anatomy:** two-line text (20 px / 16 px grey) left, 57 px avatar right, optional emoji.
* **A11y:** avatar `alt` (or `aria-hidden` if decorative, or a button with `aria-label="Account"` if tappable); emoji `aria-hidden="true"`; greeting should be an `<h1>` or live text that updates with time of day.

### 7.4 Hero date block
* **Anatomy:** label (weekday) / huge numeral / month caps on the left, a 1 px vertical hairline, time + timezone on the right, 1 px horizontal rule below.
* **A11y:** one `<time datetime="...">` element with a full-text accessible name (`aria-label="Thursday 25 January"`); do not split the visual fragments into three reads; the zone line should be real text, >= 4.5:1.

### 7.5 Event card (full width)
* **Anatomy:** fill = identity colour; title 24 px / 600 (2 lines), time at top right (about 20 px), bottom row: pin icon (about 20 px, 1.5 px stroke) + location (15 px), avatar stack right (about 28 px circles, about 4 px overlap, ringed).
* **States:** default only. Needs pressed (scale 0.98 or overlay), focus ring, selected, past/cancelled. Third card is cut off (scroll cue).
* **A11y:** the whole card is one `<a>`/`<button>` with an accessible name that concatenates title, time, place ("Meeting, 10:45, Lotte Lounge, 4 attendees"); decorative avatars hidden, attendee count in text; on pastel fills use the dark `--on-*` ink.

### 7.6 Month switcher (DEC < JAN > FEB)
* **Anatomy:** three text tokens with two chevrons; current month dark 28 px, neighbours 20 px light grey.
* **States:** current / neighbour (faded). Implies swipe and arrow navigation.
* **A11y:** `<nav aria-label="Month">` with prev/next `<button aria-label="Previous month, December">`, `aria-live="polite"` announcement of the new month; keyboard left/right; neighbours must reach 4.5:1 *or* be omitted; the faded neighbours are real targets, so not "disabled".

### 7.7 Day row (date rail + time columns)
* **Anatomy:** 126 px tall, radius 20, fill by day; left rail (day name, 40 px numeral, month) then up to 3 time columns separated by 1 px rules; each column = time label + 0 to n chips; circled "+" bottom-right (32 px ring).
* **Problems:** column widths are content-driven and irregular (Sat 3 unequal columns, Sun 3 unequal, Mon equal); colour by weekday is arbitrary; Tue 29 Jan after Mon 29 Jan is a content bug; empty row (Sun) has no empty-state text.
* **A11y:** a `<section>`/`<li>` with an `<h3>` for the date, a list of events (`<ul>`), chips as links with names ("Clients Lunch, 12:00"), the "+" as `<button aria-label="Add event on Sunday 28 January">`.

### 7.8 Event chip
* **Anatomy:** about 28 px tall, 50 to 78 px wide, tonal overlay of the row colour (three different overlay strengths in the mock: white 22 %, black 23 %, black 34 %), 10 px text.
* **Problem:** 10 px text and 1.75 to 3.3:1 as rendered. **Fix:** min 12 px, solid per-fill chip colours with >= 4.5:1, or outlined chip with row-coloured ink.

### 7.9 Search field
* **Anatomy:** 38 px tall pill, `#cbcbc3` fill, magnifier 20 px, 13 px placeholder.
* **Problem:** 1.31:1 fill vs paper, 2.5:1 placeholder; no cancel/clear affordance shown.
* **A11y:** `<input type="search">` with a visible or `aria-label` name, `enterkeyhint="search"`; do not use the placeholder as the label.

### 7.10 Month mini-calendar tile
* **Anatomy:** 178 x 214 px, radius 20, title 17 px centred, weekday header row, 7-column grid (pitch 23.5 px), today = filled blue disc, Sunday column tinted darker; some days dimmed or tinted (meaning not explained).
* **Problems:** digits 11 px, tinted/dim days 1.5 to 2.3:1, today marker only separates from sage, pitch 23.5 px under the 24 px WCAG minimum.
* **A11y:** as a `role="grid"`/table with `<th scope="col" abbr="Sunday">`, day buttons with full date names (`aria-label="25 January 2024, today"`), `aria-current="date"` on today, arrow-key navigation, PageUp/PageDown months, event-presence exposed as text (`, 2 events`). The whole tile is a link to that month, with an accessible month name.

### 7.11 App bar (back + search + add)
* **Anatomy:** 39 px ring, 14 px gap, flexible 38 px search pill, 14 px gap, 39 px ring.
* **A11y:** `<header>` with `<nav>`; back is `<button aria-label="Back">` or `<a>`; add has a label.

### 7.12 Avatar stack
* 28 px circles overlapped about 4 px with a light ring. **A11y:** group with `role="img" aria-label="4 attendees: A, B, C, D"`.

---

## 8. Generic (transferable) vs one-off decoration

### Generic, carry into the reusable system
1. **Neutral paper + near-black ink** as the base; colour reserved for identity fills. Adopt a warm paper token, and a warm near-black ink.
2. **Tonal fill family** with a fixed number of slots (8 to 9), each **paired with its own `--on-*` ink** (the mock proves the need: the citron card swaps to dark text).
3. **One card radius** (20 px) and **fully-round controls**; fills without borders; essentially flat (optional `--shadow-1`).
4. **Pill segmented filter**: filled = selected, 2 px outline = available.
5. **Round outlined icon button** (40 visible, 44 hit).
6. **Hero number + small caps label** pattern as the "at a glance" header for any date/amount/count (not only dates): e.g. "12 tasks", "3 pm".
7. **Zoom hierarchy with a shared vocabulary:** day list -> month -> year grid uses the same radius, gutter, and colour-coding.
8. **4 px spacing grid**; 16 px gutter; 24 px card stack gap; 12 to 16 px inner padding.
9. **Card with title / time / place / people** as a generic "list item card".
10. **Top app bar** with back / search / primary action.
11. **Type pair by weight contrast** (700 numerals vs 400 caps) rather than by colour.
12. **Scroll-cut peeking card** as a scroll affordance.

### One-off decoration (do not generalise)
* The specific hue list (maroon, vermilion, ...) as a mandatory palette; the system should expose slots, not names like "maroon".
* Phone bezel / Dynamic Island / status bar / Instagram footer.
* Crown emoji, "Indonesia" timezone line, the "08.00" period separator.
* Colour-per-weekday or colour-per-month mapping (arbitrary; decide per app).
* Sunday-tint and dimmed-day rules (no stated meaning).
* The blue "today" disc hue (make it a semantic `--accent-today` token that adapts to the tile).
* The translucent chip overlays of three different strengths.

---

## 9. Problems to fix (usability, accessibility, consistency)

1. **White text on pastel/mid fills fails** (periwinkle 2.42, sage 1.94, citron 1.78; vermilion, teal and deep periwinkle 3.97 to 4.01 fail body). Use paired `--on-*` tokens; dark ink on pastels.
2. **Alpha (translucent white) text** for secondary info: 1.4 to 3.4:1 on most fills. Replace with solid pre-verified muted tokens.
3. **Text far below 12 px:** chips 10, mini-cal digits 11 to 12, weekday letters 9 to 10. Set a **12 px floor, 14 px for anything that carries meaning**; 16 px body.
4. **Grey secondary text on paper about 2.7:1** ("Have a great day!", "Indonesia", DEC/FEB 1.44, search placeholder 2.5). Neutral muted ink `#676763` gives 4.56:1.
5. **Colour-only meaning:** colour per weekday/month with no legend; tinted Sunday column and dim/teal days with no stated meaning; today marker distinguishable on sage only. Add text/icon/shape cues and a legend or drop the meaning.
6. **Icon-only controls without labels**, and the same "+" for different actions (global add vs add-on-this-day) in one screen. Add `aria-label`s and visible text where space allows.
7. **Touch targets under 44 px:** pills and circles about 38 to 39, row "+" 32, chips 28, calendar cells 23.5 (under WCAG 2.2 2.5.8 min 24 by 0.5 px).
8. **No focus, pressed, hover, disabled, loading, empty, error states** defined anywhere.
9. **Search field lacks a boundary** (1.31:1) and a clear/cancel control.
10. **Home indicator overlaps content** (white bar over "July / August" and card 3): needs `env(safe-area-inset-bottom)` padding.
11. **Hierarchy/consistency glitches:** card 3 colour is a different periwinkle (`#787ca6` vs `#9ca3da`); P2 column widths irregular; chip overlay strengths inconsistent; header gutter off-centre in P1 (15.3 / 11.5); "TUE 29 JAN" duplicate date.
12. **Information density:** four separate sizes of white text inside one 166 px card; three type classes under 12 px.
13. **Truncation:** "Don't Forget Yours" clipped; no defined overflow behaviour (ellipsis/wrap).
14. **Motion/reduced-motion** unspecified; month swipe and tile -> list transitions implied but not defined.
15. **No bottom/primary navigation**; screens connect via top controls only, which is fine for a mock but a PWA needs a clear "where am I / how do I go back / home" model.
16. Decorative emoji in a heading and avatar images without alt text.
17. Times use "." separator and are not locale-aware; use `Intl` and tabular numbers.

---

## 10. Suggested generic tokens distilled from this image (feed for the merge step)

```
/* neutrals (light) */
--paper:        #e7e7dd;   /* canvas (measured) */
--surface:      #f3f3ec;   /* optional raised neutral (new; not in the mock) */
--ink:          #111111;   /* primary text */
--ink-muted:    #676763;   /* secondary text, 4.56:1 on paper (replaces the 2.7:1 grey) */
--line:         #84847c;   /* 3:1 control borders (2 px) */
--hairline:     #cbcbc1;   /* decorative dividers */

/* tonal fill family: fill + guaranteed on-colour (+ muted on-colour) */
--tone-maroon:      #885053;  --on-maroon:      #ffffff;  /* 6.33 */
--tone-vermilion:   #ba3e23;  --on-vermilion:   #ffffff;  /* 5.52 (mock #d5583c is 3.97) */
--tone-periwinkle:  #9ca3da;  --on-periwinkle:  #161616;  /* 7.47 */
--tone-sage:        #9fc588;  --on-sage:        #161616;  /* 9.32 */
--tone-citron:      #cac746;  --on-citron:      #161616;  /* 10.14 */
--tone-teal:        #137289;  --on-teal:        #ffffff;  /* 5.53 (mock #348aa1 is 3.97) */
--tone-slate:       #36495d;  --on-slate:       #ffffff;  /* 9.26 */
--tone-navy:        #1b2f3a;  --on-navy:        #ffffff;  /* 13.87 */
--tone-charcoal:    #393939;  --on-charcoal:    #ffffff;  /* 11.55 */

/* shape */
--radius-card: 20px;  --radius-chip: 8px;  --radius-pill: 999px;
--border-control: 2px;  --gutter: 16px;  --stack-gap: 24px;  --grid-gap: 12px;
--space: 4px base; 8 / 12 / 16 / 20 / 24 / 40

/* type */
Inter (variable) / Inter Tight for display numerals
12 (floor) 14 16 20 24 32 40 56-80 (display) ; weights 400 500 600 700
line-height: 1.35 card titles, 0.9 to 1.0 display numerals
font-variant-numeric: tabular-nums for times and calendar digits

/* controls */
visible 40 px, hit area 44 px; focus ring 2 px ink + 2 px paper offset
```

---

## 11. Motion implied by the design

* Horizontal swipe / cross-fade on the month switcher (neighbours are faded previews).
* Tile -> list zoom: tapping a month tile on screen 3 opens screen 2 (shared-element transition of the tile's fill).
* Filter pills cross-fade the list (fill slides from one pill to another).
* Card press feedback and a peeking third card (vertical scroll).
* "+" likely opens a sheet or inline add row.
* Must have a `prefers-reduced-motion` alternative (instant cross-fade).

---

## 12. Uncertainties

* 564 px source: text below about 12 px CSS cannot be measured precisely; its measured colours are lower bounds (Section 1).
* Exact greys (secondary ink), the today-blue hex, the third card's periwinkle semantics, the citron dark-text hex, the chip radius and the P2 shadow are estimates (measured=false where tagged).
* The type scale is +/-15 %; the typeface identification is by metric fit (width/cap-height 6.09) and glyph shape, not by identification of the actual licensed font.
* JPEG 4:2:0 chroma subsampling shifts hues near saturated edges (e.g. white reading `#fff3f5` on maroon); I assumed pure white ink.
