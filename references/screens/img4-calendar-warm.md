# img4 - Warm calendar/tasks mockup (sajon.co) - design DNA

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/de7e4fdd-image.jpg` (1080x1350 JPEG, 2 iPhone screens on #F6F6F6).
Method: image viewed; flat areas sampled with PIL/numpy (median of 6-20 px boxes); text colour = median of the 20% most-extreme pixels in each text box (plus darkest/lightest samples for thin text); edges/radii from pixel profiles; contrast from the measured hexes with the WCAG formula. JPEG artefacts: fills are reliable (+/-2 per channel); thin 13-15 px text and 1 px lines are anti-aliased so their true ink is slightly darker/lighter than the "median" value (I give both where it matters).

## 0. Scale conventions

- Each screen is about 421 px wide x 919 px tall in the image (left screen x 77-498; right x 582-1001), aspect 2.18, which matches a 393x852 pt iPhone. So **1 image px = 0.934 pt**, and **1 image px = 0.926 CSS px on a 390 px viewport**. Tables below give "img px" then "@390" (CSS px on a 390 px phone).
- Font sizes are estimated from measured cap/digit height divided by 0.72 (typical neo-grotesk cap height). Treat them as +/-1 px.
- Device chrome (bezel #14161A, dynamic island #060606, status bar, "9:41"), the `#ux #ui` / `#design` hashtags, the sajon.co avatar and the orange bookmark icon (#F9795F) are **presentation, not UI** - exclude from tokens.

## 1. Inventory

Screen A "Today" (left):
1. Pill tab switcher: `Today` (active: black fill, white label) + `Calender` (inactive: transparent + 1 px outline) - typo for Calendar.
2. Round grey icon button "+" (53 px circle).
3. Hero date block: eyebrow "Tuesday", display numerals "13.12" / "DEC" (two lines, ~94 px type).
4. World-clock column: 2 px vertical rule + two entries (time 26 px, city 15 px): 1:20 PM New York, 6:20 PM United Kingdom.
5. White rounded "sheet" (top radius ~37 px) with header row: "Todays tasks" (typo, missing apostrophe) + "Reminders" chip (#F6F6F6 pill).
6. Task card, amber: title "You Have A Meeting", avatar stack (2), Start 3:00 PM / 30 Min duration pill / End 3:30 PM.
7. Task card, sage-grey: "Call Wiz For Update", avatar stack, 4:20 PM / 25 Min / 4:45 PM (clipped at the device edge = scroll affordance).

Screen B "Calender" (right):
8. Same pill switcher, states swapped (Today outlined white, Calender black), same "+" button (grey #E5E5E5), sitting inside a white sheet that runs from y=289 to the bottom.
9. Month switcher: inset #F6F6F6 container: `NOV` (grey) `<` `DEC` (black) `>` `JAN` (grey).
10. Day cards (full width, one hue each): lavender Tue 13 DEC, dusty rose Wed 14 DEC, aqua-teal Thu 15 DEC, olive Fri (clipped).
11. Inside each: weekday eyebrow, huge day number + month (two lines), then 3 hour columns: 1 px vertical rule, hour label, event pill(s) under the label, circled "+" at the bottom.
12. Event pills: Meeting, App Update, Meeting, Web Update (dark shade of card hue, light label).

## 2. Measured palette

All hexes measured unless noted. "Where" gives the sampling box (img px).

### Neutrals / scaffolding
| Role | Hex | Where | Measured |
|---|---|---|---|
| Page (outside phones) | #F6F6F6 | (10,600)-(40,700) | yes |
| Canvas ("Today" screen bg, warm grey) | #E5E6E1 | (300,640)-(480,660) | yes, C=0.007 H=116 (faint warm/green cast) |
| Raised sheet / cards' gutter | #FFFFFF | (90,672)-(330,690) | yes |
| Inset / chip surface (month switcher, Reminders chip) | #F6F6F6 | (600,395)-(620,455), (360,695)-(370,725) | yes |
| Round "+" button fill (on canvas) | #CECFCA | (432,350)-(440,392) | yes |
| Round "+" button fill (on white) | #E5E5E5 | (935,315)-(945,360) | yes |
| Active pill fill | #000000 (left) / #030305 (right) | pill interiors | yes |
| Ink - primary UI text | #000000 (labels, headings) | text cores | yes |
| Ink - soft display (date numerals, clock) | #2A2A28 numerals; clock/labels core ~#1E1F1A-#23241F | (100,470)-(290,540) | yes (numerals flat core) |
| World-clock divider | #2F302B (2 px wide, 111 px tall) | (338,486)-(339,596) | yes |
| Inactive pill outline | #B1B2AD on canvas; #AEAEAE on white (1 px) | pill edge rows | yes (AA line, true value slightly darker) |
| Inactive month label | #BBBBBB (range #B5-#BD) | NOV/JAN glyph cores | yes |
| Month chevrons | #8C8C8C (darkest #868686) | chevron strokes | yes |

### Tonal category cards (surface / ink / pill fill / pill label)
| Tone | Surface | Ink (big text core) | Ink small-text darkest px | Pill fill | Pill label (median / peak) | OKLCH surface -> ink |
|---|---|---|---|---|---|---|
| Amber | #E4B975 | #5F3905 (title), #5B3400 (times) | #4D2600 | #66461D | #EBC897 / #FFD8A7 | L.809 C.099 H78 -> L.364 C.081 H66 |
| Sage-grey | #B0BCBC | #2F3B3B | #1E2A2A | #3B4747 | #BAC5C6 / #D2DEDE | L.786 C.013 H197 -> L.341 C.016 H196 |
| Lavender | #BBB3CB | #3E3555 | #2D2345 | #463B63 | #C4B9DA / #D6CAEE | L.781 C.035 H301 -> L.353 C.056 H296 |
| Dusty rose | #CB9CA4 | #501C22 | #100000-#350209 (hour labels very dark) | #5E2329 | #D49FA4 / #EDB6BC | L.739 C.057 H7 -> L.308 C.078 H16 |
| Aqua-teal | #9DCBC9 | #125C5A (numerals), #13504E (weekday) | #023D39 | #136966 | #90D8D4 / #9DE9E5 | L.809 C.048 H193 -> L.432 C.068 H192 |
| Olive (clipped) | #BFCB9B | #38450F | #283309 | not visible | not visible | L.821 C.066 H119 -> L.367 C.078 H122 |

Hour dividers / ring strokes inside day cards are the card's ink at ~full strength: lav #4E465E (thin AA; true ~#3F374F), rose #602E37, teal #30625F. Small "+" ring: lav #403850 darkest.

Key structural finding: **every tone follows one recipe** - surface at OKLCH L about 0.74-0.82 with low chroma (0.013-0.10), ink = same hue (hue drifts 0-12 deg warmer) at L about 0.31-0.43, pill fill = ink slightly lighter (L about 0.35-0.47), pill label = a light tint of the surface (L about 0.85-0.92). Only teal's ink (L .432) is too light, which is the only place the recipe breaks AA at body sizes.

Elevation ladder (all flat, no shadow): page #F6F6F6 -> canvas #E5E6E1 -> sheet #FFFFFF -> inset #F6F6F6 -> tonal card. Luminance ratios between layers are tiny (white vs canvas 1.25; inset vs white 1.08), so the layering is tonal, not structural.

## 3. Contrast (WCAG 2.x, from measured hexes)

Thresholds: 4.5 body, 3.0 for large text (>=24 px, or >=18.66 px bold) and non-text UI (1.4.11).

### Pass
| Pair | Ratio | Note |
|---|---|---|
| #000 on #FFFFFF (Todays tasks) | 21.0 | |
| #FFFFFF on #000 (active pill) | 21.0 | |
| #000 on #F6F6F6 (Reminders, active month) | 19.4 / 19.3 | |
| #000 on #E5E6E1 (Calender label) | 16.7 | |
| #2A2A28 on #E5E6E1 (display numerals) | 11.5 | |
| #1E1F1A on #E5E6E1 (clock) | 13.2 | |
| #000 "+" glyph on #CECFCA / #E5E5E5 | 13.4 / 16.7 | |
| Amber ink #5B3400 on #E4B975 (times, 26 px) | 5.94 | |
| Amber ink #5F3905 on #E4B975 (title 31 px) | 5.54 | large anyway |
| Amber Start/End #653C01 on #E4B975 (14 px) | 5.22 | passes but small |
| 30 Min label #EBC897 on #66461D | 5.39 (peak 6.36) | |
| Sage ink #2F3B3B on #B0BCBC | 5.95 | |
| 25 Min label #BAC5C6 on #3B4747 | 5.46 (peak 7.0) | |
| Lav numerals #3E3555 on #BBB3CB | 5.65 | |
| Lav hour label #413852 on #BBB3CB | 5.45 (darkest 6.48) | |
| Lav Meeting label #C4B9DA on #463B63 | 5.47 (peak 6.55) | |
| Rose numerals #501C22 on #CB9CA4 | 5.77 | |
| Rose weekday #451319 on #CB9CA4 | 6.49 | |
| Rose App Update label #D49FA4 on #5E2329 | 5.32 (peak 6.87) | |
| Olive ink #38450F on #BFCB9B | 6.04 | |
| Teal weekday #13504E / hour #1B5452 on #9DCBC9 | 5.17 / 4.85 | marginal |
| Chevron #8C8C8C on #F6F6F6 | 3.11 (darkest 3.37) | marginal, 1.5 px stroke |
| Day-card ring/divider lines (ink) on tone | lav 4.41, rose 4.54, teal 3.89 | pass 3:1 |

### FAIL / marginal (these are what the generic system must fix)
| Pair | Ratio | Needed | Verdict |
|---|---|---|---|
| Inactive month NOV/JAN #BBBBBB on #F6F6F6 (31 px medium, tappable) | **1.78** | 3.0 (large) | FAIL. Invisible to low-vision users; these are controls, not disabled items |
| Inactive pill outline #B1B2AD on #E5E6E1 | **1.70** | 3.0 | FAIL (1.4.11) - the boundary is what makes it look tappable |
| Inactive pill outline #AEAEAE on #FFFFFF | **2.22** | 3.0 | FAIL |
| "+" button fill #CECFCA vs canvas #E5E6E1 | **1.25** | 3.0 | FAIL as a boundary, saved only because the black glyph (13.4) identifies it |
| "+" button fill #E5E5E5 vs white | **1.26** | 3.0 | same |
| Teal numerals #125C5A on #9DCBC9 | **4.37** | 4.5 body / 3.0 large | passes only as large text; fails if used smaller |
| Teal pill label #90D8D4 on #136966 (13 px) | **4.00** (peak 4.70) | 4.5 | FAIL on conservative read, borderline on peak |
| Tone surface vs white sheet (card boundary) | 1.72-2.38 | 3.0 only if card is the only affordance | containers, not controls - OK; but interactive cards need a label/chevron, not just the tint |
| Adjacent tone vs tone | 1.03-1.39 | n/a | hues are distinguishable only by colour; never encode meaning by tone alone |

### Proven fixes (computed)
- **Tonal recipe that yields >=7:1 (AAA) for every hue tested**: surface OKLCH L=0.80 (C per hue), ink L=0.30 same hue (C = min(1.3 x surface C, 0.08)), pill fill L=0.40, pill label L=0.92 C=0.03. Results: surface/ink 7.16-7.37 for all six hues; pill label/fill 7.16-7.37. Example generated: amber #E1B672 / ink #482300; sage #B5C0C0 / #243131; lavender #C1B9D1 / #302942; rose #DFAFB7 / #4C1B21; teal #9AC8C6 / #003736; olive #B9C494 / #273300.
- Teal ink alone: #0A4846 on #9DCBC9 = 5.83; or the recipe value #003736 = 7.4.
- Inactive month text: #6B6B6B on #F6F6F6 = 4.93 (or use the same ink at 100% but lighter weight); chevrons #5F5F5F = 5.91.
- Inactive pill outline: #767676 on #FFFFFF = 4.54; on canvas #E5E6E1 use about #6F706B = 3.98.
- Round "+" button: keep the glyph at 13:1 and do not rely on the grey fill for the boundary (a darker grey fill such as #BDBEB8 is still only 1.49 vs canvas). Add a 1 px ring at >=3:1 (for example #6F706B on #E5E6E1 = 3.98) or use an ink-filled/inverse button for the primary add action.

## 4. Shape language

Measured from edge profiles (img px; @390 = x0.926):

| Element | Size img px | @390 | Radius img px | @390 | Radius ratio |
|---|---|---|---|---|---|
| Screen gutter (pills/eyebrow to screen edge) | 19-20 | about 18 | | | |
| Switcher pill (Today/Calender) | 120 x 53 | 111 x 49 | full (26.5) | full | 50% of height |
| Pill gap | 12.5 | 11.6 | | | |
| Round "+" button | 53 x 53 | 49 x 49 | full | full | |
| "+" glyph | 15 x 15, stroke about 1.5-2 | 14 | | | 28% of button |
| Reminders chip | 126 x 49 | 117 x 45 | full | | |
| White sheet | full width 421 | 390 | **about 37** | about 34 | 8.8% of width |
| Sheet inner padding (left) | 23 | 21 | | | |
| Tonal card | 401-405 x about 204 | 371-375 x 189 | **about 22** | about 20 | 5.5% of width, 10.8% of height |
| Card margin to sheet/screen edge | 9-11 | about 9 | | | |
| Gap between cards | 5-6 (white) | about 5 | | | |
| Card inner padding | 19-22 | about 18-20 | | | |
| Month switcher container | 406 x 74 | 376 x 68 | about 26 | about 24 | 35% of height |
| Event pill | 69-94 x 34-37 | 64-87 x 32-34 | about 10 | about 9 | 28% of height (NOT a full pill) |
| Stacked event pill gap | 7 | 6.5 | | | |
| Duration pill (30 Min / 25 Min) | 86 x 38 | 80 x 35 | full | | |
| Tiny circled "+" | 23 x 23, 1 px ring, glyph 10 | 21 | full | | |
| Avatar | about 40 diameter, 2 px white ring, overlap about 5 | 37 | full | | |
| World-clock divider | 2 x 111 | 2 x 103 | | | |
| Hour-column divider | 1 px x 110 | | | | |

- **Radii are concentric**: sheet 37 -> card 22 (37 - 10 margin = 27, near 22) -> event pill 10. Shape vocabulary = "full pill/circle for controls and status, 20 px rounded rectangle for content containers, ~9 px for small chips".
- **Borders**: only 1 px outlines on inactive tab pills and 1 px rings/rules. No card borders.
- **Shadows**: none at all (verified by sampling the gap under cards and buttons: straight transitions, no gradient). Depth is purely tonal plus radius. Completely flat.
- **Spacing rhythm**: measured steps at @390 are about 4.6, 9, 11.6, 18-20, 24, 34 -> consistent with a **4 px base** (4/8/12/16-20/24/36) plus a 4-5 px "tight mosaic" gap between cards. Card paddings are generous (about 20) while inter-card gaps are very tight (about 5): the tension creates a patchwork/bento feel.
- **Touch targets** (@390): switcher pills 111 x 49, "+" 49 x 49, Reminders 117 x 45 - all >= 44. Event pills 64 x 33 (below 44, above 24), tiny circled "+" 21 x 21 (**below WCAG 2.5.8's 24 px minimum**; only compliant through the spacing exception because neighbours are >=50 px away), chevrons 13 x 15 px (below 24). Month labels have generous width but the hit area is undefined.

## 5. Typography

- **Face**: a Helvetica-descended neo-grotesque with a double-storey "a", single-storey "g", flag-and-foot-less "1" with a short diagonal flag, round "3", straight-legged "y". Looks like **Neue Montreal** (Pangram Pangram) - a guess, not a certainty; similar to Inter Display / Aeonik / Suisse. Titles ("You Have A Meeting") read slightly wider and warmer than the numerals, so the designer may have used two optical sizes of one family.
- **OFL / self-hostable equivalents** (recommend verifying each subset/feature before committing): **Instrument Sans** (variable wght+wdth), **Hanken Grotesk**, **Inter / Inter Tight** (best numerals and tnum support), **Geist**, **Figtree** (friendlier), **Onest**, **Host Grotesk**. Neue Montreal is not OFL (personal-use trial licence) so do not bundle it.
- **Scale** (estimated font-size @390; cap height in img px):
  | Role | Cap/digit h | Est. size @390 | Weight | Line height | Notes |
  |---|---|---|---|---|---|
  | Hero date numerals "13.12 / DEC" | 68 | about 87 px | 400 | about 0.95 (90 px baseline step at 94 px) | tight tracking (est. -0.02 to -0.04 em), two stacked lines, tone #2A2A28 |
  | Day-card numerals "13 / DEC" | 45 | about 57 px | 400 | about 0.92 | same treatment, in card ink |
  | Month switcher NOV DEC JAN | 24 | about 31 px | 500 | 1 | ALL CAPS, active black, inactive #BBB |
  | Task title | 24 | about 31 px | 500-600 | about 1.12 | sentence case, wraps to 2 lines, card ink |
  | Clock / times | 20 | about 26 px | 400 | 1 | "3:00 PM", "1:20 PM" |
  | Eyebrow (Tuesday) / section heading ("Todays tasks") | about 14.5 | about 18-19 px | 400 eyebrow / 600 heading | 1.2 | |
  | Pill labels (Today/Calender/Reminders) | about 12 | about 15 px | 500 | 1 | |
  | Secondary labels (New York, Start, End, 30 Min) | 11-12 | about 14-15 px | 400 | 1.2 | |
  | Hour labels / event-pill labels | about 10-11 | about 13 px | 400 | 1 | **smallest text in the design** |
- 9 distinct sizes from 13 to 87 px - ratio between steps is irregular (mixed ~1.15-1.5). A generic system should collapse this into a modular scale (see principles).
- **Numerals/dates**: huge, light-weight (regular), tightly tracked, stacked "DD.MM / MON" or "DD / MON" in caps; proportional figures in the hero, presumably tabular needed for the clock column. Hour labels are lower-case "3 pm" (mixed style vs "3:00 PM" elsewhere = inconsistency).
- Two weights carry the whole UI (regular + medium), which is why it feels calm.

## 6. Components (anatomy, states, a11y needs)

1. **Pill tab switcher (segmented nav)** - two full-round pills 111 x 49 @390, 12 px gap. Active = black fill, white 15 px/500 label; inactive = transparent + 1 px outline, black label. Implied: pressed (scale/darken), focus (none drawn). A11y: if it switches views use `<nav aria-label>` with links and `aria-current="page"`; if it swaps panels in place use `role="tablist"` + `role="tab" aria-selected` + roving tabindex + arrow keys + `aria-controls`. Needs visible focus ring (2 px, >=3:1, offset), outline colour >=3:1.
2. **Round icon button "+"** - 49 px circle, tonal grey fill, 14 px plus glyph, 1.5 px stroke. A11y: `<button aria-label="Add task">` (icon-only, no text), focus ring, pressed state; add a 1 px ring or darker fill to satisfy 1.4.11.
3. **Hero date block** - eyebrow weekday + stacked display numerals. A11y: `<time datetime="2022-12-13">`, or make the visual text `aria-hidden` and give one readable label ("Tuesday, 13 December"). Avoid ambiguous "13.12" without the word month (locale dd.mm vs mm.dd).
4. **World-clock column** - vertical 2 px rule + stacked (time 26 px, city 15 px) pairs. A11y: `<dl>`/list of `<time>` with timezone names; rule `aria-hidden`; define wrapping/ellipsis for long city names (already within 21 px of the screen edge).
5. **Sheet (raised surface)** - white, top radius about 34, full-bleed bottom, header row heading + chip, scroll body. Implied: draggable bottom sheet (snap peek/expanded). A11y: if draggable expose a button alternative ("Expand tasks"), `aria-expanded`, don't trap scroll; respect `env(safe-area-inset-bottom)`.
6. **Chip / filter button ("Reminders")** - 117 x 45 full pill on #F6F6F6, 15 px label. Unclear semantics (filter toggle or menu). A11y: `aria-pressed` for toggle or `aria-haspopup="menu"`; state must not be tone-only.
7. **Tonal task card** - radius 20, padding about 18-20, hue surface + hue ink; title 31 px/500 (2 lines), avatar stack top-right, footer of 3 slots (start | duration pill | end, each time 26 px + caption 15 px). States: default, pressed, selected/expanded, completed/overdue (none shown), long-title overflow (none shown). A11y: the whole card is one target: `<article>` with a single primary link/button; avatar stack needs `aria-label="2 attendees: A, B"`; "30 Min" -> "30 minutes"; times in `<time>`; status communicated by text/icon, not hue.
8. **Duration pill / badge** - 80 x 35 full pill, tone-dark fill, light tone label, non-interactive. A11y: plain text badge; don't use role=button.
9. **Avatar stack** - 37 px circles, 2 px white ring, about 12% overlap. A11y: decorative if the names appear elsewhere, otherwise `alt`; `+N` overflow pattern needed.
10. **Month switcher** - inset container (#F6F6F6, r 24, 68 px tall), three slots, active centred with chevrons. Implied: swipe/scroll-snap carousel; tap NOV/JAN jumps. A11y: `role="group" aria-label="Month"`, prev/next `<button aria-label="Previous month: November">`, live region announcing the new month, all slots >=44 px wide/tall, inactive contrast >=4.5 (they are controls).
11. **Day card** - tonal card 371 x 187 @390: left column (weekday eyebrow + numerals), right timeline of 2-3 hour columns (width driven by content: 54 px empty, 112 px with a pill). A11y: `<section aria-labelledby>` per day; hour columns as `<ol>`/`role="list"`; hour label to `<time>`; horizontal scroll region must be keyboard reachable (`tabindex="0"`, labelled) and show an overflow cue.
12. **Event pill** - 64-87 x 33 px, radius 9, hue-dark fill, light 13 px label. Interactive (opens event). A11y: `<button>` or link, accessible name "Meeting, 3 pm, Tuesday 13 December"; minimum 44 px hit area via padding/pseudo-element.
13. **Circled add (tiny "+")** - 21 px ring (1 px) with 10 px plus, repeated 3-6 times per card. A11y: every instance needs a unique accessible name ("Add event at 3 pm, Tuesday 13 December"); hit area to 44 px; ring >=3:1; focus ring.
14. **Hour-column rule** - 1 px ink line. Decorative (`aria-hidden`/CSS border).

## 7. Layout patterns

- Top control bar: switcher left, one round action button right (action is out of thumb reach at the top of a 852 pt screen).
- Hero + sheet: large typographic hero on the canvas, then a white sheet overlapping from y about 666 (78% of hero zone) carrying a list.
- Full-width tonal cards separated by about 5 px, inset about 9 px from the sheet edges; last card deliberately clipped by the bottom edge (scroll affordance).
- Card internal split: left = identity (title/date), right = data (avatars or timeline); footers use a 3-column `space-between` row (start | duration | end).
- Concentric radii (sheet > card > chip).
- No bottom navigation, no tab bar; navigation is entirely the top pill switcher.
- Timeline as content-width columns with 1 px rules and a per-column add affordance (time axis is implied by labels, not by position - events do not encode duration by width).

## 8. Motion implied (not shown)

- Pill switcher: fill morph black <-> outline, label colour crossfade, 150-250 ms.
- Sheet: drag/snap with spring; hero parallax or fade as it rises.
- Month switcher: horizontal scroll-snap carousel; inactive months slide to centre and change ink.
- Card press: scale about 0.98 + slightly darker tone; expand-to-detail shared-element transition (card grows into a detail page).
- "+" press: sheet/modal for new task; ring button ripple.
- All of it must honour `prefers-reduced-motion` (swap slide/scale for a fade or none).

## 9. GENERIC vs one-off

Transferable to any app (keep as tokens/components):
- Four-slot tonal ramp per hue (surface / ink / pill fill / pill label) generated from OKLCH recipe; six-plus hue slots usable as category, day, or project colours.
- Three-neutral scaffold (page, canvas, raised white) + single inverse fill (black) for the selected state.
- Pill/circle control language, 20 px container radius, concentric radii, 4 px spacing grid, 44-49 px control heights.
- Flat (shadowless) elevation via tonal steps.
- Huge-numeral hero + tiny label typographic contrast; two weights (400/500) only.
- Segmented pill switcher, round icon button, chip, duration/status badge, avatar stack, inset segmented month selector, sheet, tonal card, stackable event chips.
- Partial-reveal of the next card as scroll cue.

One-off decoration (do not generalise): the specific hues' names/hex, calendar domain content (clock column, hour columns), "13.12 DEC" date format, Dribbble photo avatars, device bezel/notch, hashtags/bookmark, the typos.

## 10. Problems to fix (priority order)

1. Inactive-but-interactive text at 1.78:1 (NOV/JAN) - fails even large-text 3:1.
2. Outlines of inactive pills 1.7-2.2:1 and round "+" fills at 1.25:1 - controls rely on near-invisible boundaries.
3. Teal tone under-inked (4.37 numerals, 4.0 conservative pill label) - recipe inconsistency.
4. Smallest text 13 px (hour labels, event pills) and 14-15 px secondary labels - below a comfortable 16 px body / 14 px caption floor; mock is fixed-size (no `rem`/text-scaling consideration).
5. Icon-only controls with no names: round "+", 3-6 tiny circled "+" per card (identical), chevrons; tiny ring 21 px and chevron 13 px targets (<24 px).
6. No focus, pressed, disabled, loading, empty or error states drawn; no visible focus ring.
7. Colour as the only differentiator between cards (tone = category?) - adjacent tones are 1.03-1.39:1 apart; must pair with text/icon.
8. Copy/data errors in the mock: "Calender", "Todays tasks", hour labels "3 pm / 4 pm / 5 am", date "13.12 DEC" (redundant/ambiguous), abbreviations "30 Min", mixed "3 pm" vs "3:00 PM".
9. Timeline shows 3 hours only with no overflow cue; events carry no visible duration; unequal column widths.
10. Primary action "+" is at the top-right, outside the one-handed thumb zone; no bottom nav; bottom card is clipped with no safe-area padding shown.
11. Nine type sizes with no modular rhythm; hero at 87 px will overflow on 320 px phones or large text settings unless `clamp()` is used.
12. No dark-mode/high-contrast variants: pastel surfaces with dark ink would have to be inverted (L 0.30 surface / L 0.90 ink) not filtered.

## 11. Recommended token contract derived from this image (for the generic system)

- Neutrals: `--bg-page #F6F6F6`, `--bg-canvas #E5E6E1`, `--surface #FFFFFF`, `--surface-inset #F6F6F6`, `--ink #111` (use #000 only for inverse fills), `--ink-soft #2A2A28`, `--ink-muted` >= 4.5:1 (for example #5F5F5F on #F6F6F6 = 5.9), `--line` >= 3:1 (for example #767676 on white = 4.54).
- Tones: `--tone-{amber,sage,lavender,rose,teal,olive}-{surface,ink,pill,pill-ink}` from the L .80 / .30 / .40 / .92 recipe (precomputed values in section 3; all 7.1+:1).
- Radii: `--r-sheet 34px`, `--r-card 20px`, `--r-inset 24px`, `--r-chip 9px`, `--r-pill 999px`.
- Space: 4 px base; gutters 16-18; card padding 18-20; tight list gap 4-6.
- Sizing: control height 48 (min 44), icon button 48, hit-area floor 44 even when the visual is 20-24.
- Type: modular scale roughly 13/14 (caption), 16 (body), 18, 24-26, 30-32, 56, 88 (hero, `clamp()`), weights 400/500(/600 heading), hero leading 0.95, negative tracking on display sizes only.
- Elevation: none; use tone steps; reserve shadow for true overlays (modal/sheet drag).
