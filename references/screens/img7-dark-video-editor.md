# Image 7 - Dark single-accent video editor (three phone screens)

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/e88a7a9a-image.jpg` (1199x906 JPEG).
Method: visual inspection at 4-10x zoom, PIL/numpy pixel sampling (medians of flat areas, mode of the accent circle), WCAG 2.x relative-luminance contrast computed from measured hexes. "Logical px" below = image px scaled to a 390px-wide phone. Left and right phones are 259px wide in the image (x1.506 to 390); centre phone is 305px wide (x1.279). All phones are 9:19.5 (259x561, 305x661). JPEG noise is about +/-8 per channel on small flat areas; thin strokes (1-2 image px) are anti-aliased and read darker than their true colour, so text/icon hexes below are marked as measured-peak or estimated.

## 1. Inventory

Page: #373737 backdrop, three black phone screens with large soft drop shadows (the backdrop and shadow are presentation only).

Screen "Filter" (left)
- Header overlaid on full-bleed photo: X close (left, bare glyph), title "Filter" (centre, bold white), round check button (right, black 50% scrim circle with white check).
- Preview video (photo) fading to black at bottom.
- Scrubber row: "00:12" - 2px white progress line over a near-black track (#1b1b1b) - "00:25".
- Clip strip: one dimmed neighbour clip (cropped at left) and one SELECTED clip (violet outline, violet trim handles at both ends, violet colour wash over thumbnails).
- Filter carousel: square tiles with small captions (None [circle-slash glyph], Cinematic [SELECTED: white 2px ring], Film, SL Kodak, SL Bl... cropped at right edge = scroll affordance).
- Fine tick ruler (intensity dial): dim short ticks, brighter major ticks, a white dot above the ruler (neutral/default mark) and one taller violet tick (current value).
- Bottom icon toolbar (5 slots): video camera, scissors, overlapping-circles (ACTIVE: violet + dot below), flame, tiny dot (unfinished or "more").

Screen "Edit" (centre, largest)
- Header: share icon (left), title "Edit", round check (right).
- Preview (about 61% of screen height) with a bottom fade; gear (left), play glyph (centre), fullscreen brackets (right); timecode "00:15 (white) 01:24 (dim)" above play.
- Timeline ruler: "0s 1s 5s 10s" with dim dot ticks. NOTE the labels are equally spaced although the values are not linear (mockup shortcut).
- White 2px playhead line from ruler down through all tracks.
- Text-clip row (pills, 30px image height): "T Lighthouse" SELECTED (violet 2px outline + violet trim handles), "sparkle + T Emotions" (unselected, lighter tail section).
- Video track (thumbnails, rounded), round violet "+" (add clip) at track start, white round split/transition handle (bow-tie glyph) between clips.
- Audio track: lighter violet-tinted grey bar, mirrored white waveform that fades to transparent rightwards, with a baseline.
- Bottom toolbar, 7 outline icons: scissors, flame, volume, crop, speed gauge, layers, trash. No labels, no active state shown.

Screen "Speed" (right)
- Header: X, "Speed", check. Here the photo is pale grey, so white controls nearly vanish.
- Preview with bottom fade, play glyph, fullscreen brackets.
- Action row: Delete (trash, caption dim), Add (violet filled circle with black "+", caption dim), Preset (wave glyph, caption bright).
- Preset strip: six small rounded buttons (#272729) with curve glyphs; first is active (violet glyph).
- Curve editor panel (#272729, rounded): faint horizontal grid lines, axis labels "8x" (top-left) and "1/8x" (bottom-left), a violet-to-pink gradient Bezier line, 5 round nodes (violet on the left half, pink on the right half), a white glowing current node on the white playhead line (which extends the full panel height).
- Filmstrip thumbnails below the graph (playhead continues through it).

## 2. Measured palette

| Role | Hex | Source / how measured |
|---|---|---|
| Page backdrop (mock only) | #373737 | flat page corners, std 0 (measured) |
| Device drop shadow | darkens backdrop to about #282828 right next to the phone, fading over ~55-60px below; about `0 30px 60px rgba(0,0,0,.35)` | profile scans (measured; shadow params estimated) |
| Screen base / "bg" | #000000 | right-phone bottom, std 0.5 (measured). Pure black (OLED style) |
| Surface 1 (button / panel / graph) | #272729 (39,39,41) | preset buttons, curve panel, std <=2 (measured). 1.41:1 vs black |
| Surface 2 (audio track) | #403d48 at left end; gradient fades to #242426 at right edge | track scan along x (measured). Violet-tinted neutral; right fade is an overflow mask |
| Text-clip pill body | #25242c | Lighthouse/Emotions interior (measured) |
| Text-clip lighter tail | #433f4d | Emotions right section (measured) |
| Accent (only accent) | #7c78f4 = hsl(242, 85%, 71%) | mode/median of the Add circle interior, 338 px after excluding the "+" (measured) |
| Accent 2 (gradient end / right nodes) | #c75eab = hsl(316, 48%, 57%) | last curve node core (measured) |
| Curve gradient | hue runs 246 -> 260 -> 278 -> 292 -> 308/317 deg left to right | column scans along the curve (measured, strokes thin so luminance under-read) |
| Icon / primary text | #ffffff | toolbar icon peaks #f6-#ff, titles #fff (measured) |
| Scrubber track remaining | #1b1b1b | x=248-335 (measured) |
| Scrubber progress | #fdfdfd 2px | measured |
| Playhead | #ffffff, 2px wide (about 2.6 logical px on centre phone), glow on the node | measured |
| Check-button scrim | rgba(0,0,0,0.5) | circle vs surrounding photo ratio 0.49/0.50/0.50 on all three phones (measured by blend ratio) |
| Waveform fill | peak #d6d3db, mid #96959a, fades to transparent | measured peaks |
| Curve grid lines | #2d2b2e on #282629 (1.07:1, decorative) | measured |
| Caption text (filter names, Delete, Add) | visible peak #5d5d5d (true fill unknown) | estimated true fill about #787878-#888888 (measured=false) |
| Time labels 00:12/00:25 | visible peak #939393 | estimated true about #b0b0b0-#d0d0d0 |
| Ruler labels 0s/1s/5s/10s | visible peak #e0e0e0 | about 85-100% white |
| Chip labels (Lighthouse, Emotions) | visible peak #8d8c94 | estimated true about #9c9ba4 |
| Inactive preset glyph | visible peak #868688 on surface 1 | about 55% white |
| Selected filter ring | #ffffff, about 2 logical px | measured |

The design is achromatic except for ONE hue family: neutral greys/blacks (with a faint cool-violet tint, +2 to +8 in B) plus accent #7c78f4. The pink #c75eab only appears in the curve gradient (decorative) and is not a second brand colour.

## 3. Contrast (WCAG 2.x, computed from measured hexes)

Key: pass = meets AA for its category (4.5 normal text, 3 large text / non-text).

Accent system
- Accent #7c78f4 on black: 5.85:1 pass (text and non-text).
- Accent on surface 1 #272729: 4.15:1, non-text pass, small text FAIL (needs lighter accent-300 #a29ff8 = 6.28:1).
- Accent on audio track #403d48: 2.96:1 fail for non-text (marginal; selection outline on the audio track needs a white/lighter stroke).
- Accent outline on pill body #25242c: 4.28:1 pass non-text.
- Black "+" on accent circle: 5.85:1 pass. (White "+" would be 3.59:1: only acceptable for glyphs/large text, FAIL for text.)
- Pink #c75eab on black 5.62:1, on #272729 3.99:1 (non-text pass).

Text on black
- White 21:1.
- Filter captions (None/Cinematic/Film/SL Kodak): visible peak #5d5d5d = 3.19:1 FAIL; top-2% mean #494949 = 2.33:1 FAIL; if the true fill is #808080 it is 5.32:1 (pass but marginal and at about 10-11 px).
- "Delete"/"Add" captions: peak #565656 = 2.86:1 FAIL, and they look disabled although Add is the primary action.
- "Preset" caption peak #b0b0b0 = 9.68:1 pass.
- Time labels peak #939393 = 6.84:1 pass on paper, but glyph height is 5 image px (about 9-10 logical px): too small.
- Ruler labels peak #e0e0e0 = 15.9:1 pass.
- Dim timecode total "01:24": #5e5653 on photo #0b0b05 = 2.75:1 FAIL.
- Current timecode "00:15": #a8a89e on #151309 = 7.76:1 pass.

Text on surfaces
- Chip labels #8d8c94 on #222128: 4.80:1 pass but barely (estimated true #a0a0a8 gives 5.92:1).
- "8x" / "1/8x" axis labels #555557 on #272729: 2.00:1 FAIL (and ~10px).
- Inactive preset glyph #868688 on #272729: 4.10:1 (non-text pass); #7e7e80 = 3.68:1.
- Waveform light #d6d3db on track #403d48: 7.17:1; mid #96959a on #302d34: 4.55:1.

Non-text boundaries
- Scrubber remaining track #1b1b1b vs black: 1.22:1 FAIL 1.4.11 (track boundary invisible; only the white progress and time labels carry meaning).
- Ruler dim ticks (about #444): 2.16:1 fail if they convey information.
- Surface 1 vs black 1.41:1, chip vs black 1.37:1, audio track vs black 1.98:1, none reaches 3:1, so these containers are identified only by content (glyph/text), not boundary. The glyph inside passes (white, or >=3.7:1), so AA is arguably met, but the hit area is invisible.
- Playhead white vs audio track 10.6:1 pass.

White overlays on photos (no scrim = unsafe)
- Right phone header (X, "Speed"): white on #cbcac8 = 1.64:1 **hard FAIL** (text and icon).
- Left phone header: white on #a06c98 = 4.12:1 (icons pass 3:1, 14px bold title fails 4.5:1).
- Centre header: white on #306674 = 6.41:1 pass (luck of the photo).
- Check glyph on 50% scrim: 10.0 / 13.2 / 5.82:1 pass on the three phones (scrim works; against a pure-white photo it would be 3.95:1, still pass for an icon).
- Bottom preview controls (play, fullscreen, gear, timecode): sit on a fade-to-black gradient, measured bg #0f0e0b-#242218 = 15.9-19.3:1 pass.
- Selected filter ring (white) against the tile interior varies 2.1-6.7:1 (inside a light sky it is 2.1:1), but the outer side is black (21:1), so the ring is clearly visible against the screen.

Scrim requirement derived: white text needs backing luminance <= 0.183 (sRGB about #757575) for 4.5:1; a black scrim over worst-case white media needs alpha >= 0.55 (0.5 gives 3.95:1, 0.6 gives 5.74:1). For icons only (3:1) alpha 0.4 suffices over white (bg luminance <= 0.30). Recommendation: top gradient `linear-gradient(to bottom, rgba(0,0,0,.6), rgba(0,0,0,0))` over 96-120px plus a 0.5-0.6 scrim on any circular overlay button; or use a solid header on unknown media.

Accent ramp proposals (hue 242, verified)
| Step | Hex | on black | on #272729 | white on it | black on it |
|---|---|---|---|---|---|
| 200 | #c4c2fb | 12.46 | 8.84 | 1.69 | 12.46 |
| 300 (accent text on dark surfaces) | #a29ff8 | 8.85 | 6.28 | 2.37 | 8.85 |
| 500 (brand fill, measured) | #7c78f4 | 5.85 | 4.15 | 3.59 | 5.85 |
| 600 (fill that carries white text) | #5a55e6 | 3.88 | 2.75 | 5.42 | 3.88 |
| 700 | #4540c8 | 2.82 | 2.00 | 7.45 | - |
| 900 (tint surface) | #1d1a6b | 1.41 | 1.00 | 14.87 | - |
Filled accent controls in the dark theme: use near-black content (#0b0a2a = 5.36:1, #000 = 5.85:1) on 500, not white. For a light theme use 600/700 fills with white text (5.42 / 7.45).

## 4. Shape, size, spacing

Device frame (mock only): corner radius about 28-30 image px on the 259px phone (11-12% of width, roughly 45-50px at 390). Not a UI token.

Radii (image px -> ratio -> logical px at 390):
- Filter tile 49px square, radius about 6 (12% of tile) -> about 9px on a 74px tile. Selected ring follows same radius.
- Selected clip strip: 144x28 image px (217x42 logical), radius about 7-9 (28% of height) -> about 11-13px; trim handles about 5 image px (7-8px) wide, full height, protruding pill ends.
- Text-clip pill (centre): 30 image px tall (38 logical), radius about 8 (27% of height) -> about 10px. Not a full pill, it is a soft-rounded rectangle.
- Video track clip: 52 image px tall (66 logical), radius about 7 (13% of height) -> about 9-10px. Audio track 43 tall (55 logical), radius about 8-9 -> about 11px.
- Preset button: 30x19 image px (45x29 logical), radius about 5-6 (about 30% of height) -> about 8px. Curve panel: 223x88 image px (336x132 logical), radius about 4-5 -> about 7-8px.
- Round: check button 22.5 image px (about 34 logical, 8.7% of phone width); Add 25 image px (about 38 logical); timeline "+" about 17 image px (about 22 logical); split handle about 18 (about 23 logical); curve node 7 (about 10-11 logical); active dot 2.5-3 (about 4 logical).
- Overall: one family of radii: 8 (small), 12 (clip/tile), full (round). Consistent "soft but not bubbly" language.

Borders: no hairline borders on surfaces. The only strokes are state strokes: 2px accent outline (selected clip) and 2px white ring (selected tile). Dark UI uses lightness steps (#000 -> #272729 -> #403d48) for elevation, no shadows on UI elements. Shadow exists only under the device frames.

Spacing rhythm (logical px, +/-2): 4px base with 8px steps.
- Screen side margin about 24-28 (preset strip starts 25.6 from edge; filter tiles 28; timeline starts 28). Treat as 24 (with 16 min).
- Track gaps: text-row to video 6-8, video to audio 8-10 (centre phone scale): 8px.
- Track heights: 38 / 66 / 55: 40 / 64 / 56 in 8px multiples.
- Preset buttons: 6 across 337px with about 13px gaps (12 at 8pt).
- Bottom toolbar: 7 icons on a 50px pitch (39.5 image px x1.279 = 50.5), so 7x50 + 2x20 = 390; first icon centre is 44px from the left edge. Icon glyph about 19px.
- Vertical rhythm left phone: scrubber -> clip strip 35; clip strip -> tiles 16; caption -> ruler 36; ruler -> toolbar 30.
- Header: title centre about 46px from top (status bar not drawn); header controls about 24px from side edges.

Icons: outline, round caps/joins, about 1.5px stroke at about 19-20px glyph (24px frame) measured as about 1.1-1.3 image px strokes on glyphs 12-15 image px (stroke/glyph about 0.08-0.09). Mostly outline with a few filled marks (play triangle, Add disc, nodes). Closest open sets: Lucide (ISC) at stroke-width 1.5, Phosphor Regular (MIT), Tabler (MIT) at 1.5, Iconoir (MIT). Needed glyphs: scissors, flame, volume, crop, gauge, layers, trash, video, blend circles, share, X, check, gear, play, maximize, plus, type (T), sparkles, slash-circle, activity/wave (preset), split.

Touch targets (hit area not drawn; sizes of the visible mark at 390 width): check 34px, Add 38px, "+" 22px, split handle 23px, curve nodes 10-11px, preset buttons 45x29, toolbar slot 50x? (icon 19px), play glyph 13x15px bare, gear/fullscreen 18-20px bare, trim handles 7-8px wide. Anything <24px violates WCAG 2.2 SC 2.5.8 unless spaced; anything <44 is under best practice. The system must draw a minimum 44x44 hit area with transparent padding.

## 5. Typography

Likely Inter (or SF Pro in the original iOS shot): double-storey a, flat terminals, tabular-looking digits, "t" with slanted cut. OFL equivalents: Inter (first choice; has tnum, cv11, variable), Figtree, DM Sans, Manrope, Geist, Plus Jakarta Sans. Self-host Inter variable (woff2, subset latin).

Scale (cap-height to size, estimated at 390px): screen title 14-15px / 600-700 centred, no caps, no tracking; clip/tool labels 13-14px / 500; ruler labels 12-13px / 400-500; captions 10-11px / 400-500; time labels and axis labels about 9-10px / 400. There are really only 3-4 sizes (ratio about 1.15-1.2). Case: sentence case everywhere ("Delete", "Add", "Preset", "None"). No uppercase, no letter-spacing tokens visible (a slight +0.01em at 10px would help).
Numerals: times as "00:12" and ruler "0s 1s 5s 10s" in the same sans with tabular figures; current time brighter than total time (primary vs tertiary emphasis in one string). No large numeral display in this image.

## 6. Components (anatomy, states, a11y)

Header (overlay on media)
- Anatomy: 3-column grid (left action | centred title | right confirm). Left: X close or share; right: 34px round translucent confirm.
- States: default, pressed (scrim .65), disabled (not shown), focus (needs ring).
- A11y: `<header>` with `<h1>`; buttons need `aria-label` ("Close", "Apply filter"); confirm is commit, X is cancel: announce unsaved-change warning; scrim per section 3.

Preview + transport
- Anatomy: media (16:9-ish, full-bleed), bottom fade, settings / play / fullscreen / timecode overlay, scrubber.
- A11y: play = `button` with label toggle Play/Pause and 44px hit area; fullscreen button `aria-label="Full screen"`; video `aria-label`; time text `<output>` or live region updated only on pause/seek; scrubber = `<input type=range>` (or role=slider) with `aria-valuetext="00:12 of 00:25"`; arrows 1s, Shift 5s, PageUp/Down 10s, Home/End. Reduced motion: no autoplay; playhead follow-scroll jumps instead of smooth when `prefers-reduced-motion`.

Scrubber (thin)
- Anatomy: start time, 2px track (#1b1b1b), 2px progress (white), end time. No thumb drawn.
- Fixes: visible thumb (>=16px, 44px hit area), track colour >=3:1 vs bg (#6b6b70), time labels >=12px.

Clip strip / timeline track items (clips, pills)
- States: default, selected (2px accent outline + 7px accent trim handles + accent 35-50% wash on thumbnails), unselected neighbours dimmed, dragging (implied), disabled.
- Selection semantic = outline + handles (shape) + wash (colour), so not colour-only.
- A11y: group `role="listbox"` horizontal with clips as `role="option"` + `aria-selected`; roving tabindex; arrows move focus, Enter/Space select; trim handles = two `role="slider"` (Start, End) with `aria-valuetext="00:03.2"`, arrows +/-1 frame (0.1s), Shift +/-1s, PageUp/Down 5s, Home/End to clip bounds; non-drag alternative: "Trim" sheet with number inputs and nudge buttons; split button "Split at playhead"; reorder via Move left/right buttons (WCAG 2.2 SC 2.5.7 Dragging Movements).

Playhead
- Anatomy: 2px white vertical line full height of tracks, small notch at ruler top, optional glow.
- A11y: `role="slider"` aria-label "Playhead", `aria-valuemin/max/now` in ms and `aria-valuetext="00:15 of 01:24"`; arrows 1 frame (or 100ms), Shift 1s, PageUp/Down 10s, Home/End; keep one in tab order; announce via polite live region only when seek commits (never during playback, do not announce each tick).

Ruler
- Anatomy: labels at major ticks, dim dot ticks at minor. Must be linear; mock labels (0,1,5,10 equal spacing) are misleading.
- A11y: `aria-hidden` decorative; zoom buttons (+/-) and Ctrl +/- alternative to pinch.

Waveform track
- Anatomy: rounded track #403d48 with mirrored bars (2px bars, 1px gap), baseline, fade mask at overflow edge.
- A11y: SVG/canvas `role="img"` with label "Audio waveform for clip, 1:24", volume in a real control (slider 0-200%).

Tool toolbar
- Anatomy: 7 slots, icon 19-20px, active = accent icon + 4px accent dot below (shape redundancy) + scroll if more than fits.
- States: default (white), active (accent + dot), pressed, disabled (needs >=3:1 grey #6b6b70 or so), focus ring.
- A11y: `role="toolbar"` `aria-label="Edit tools"`, roving tabindex, Left/Right/Home/End, each item labelled (visible text preferred; icons alone ambiguous e.g. flame, layers, gauge). Active: `aria-pressed="true"` if toggle, or use tablist if it swaps a panel.

Filter carousel
- Anatomy: 74px square tiles (radius 9), caption below, selected white 2px ring; partial next tile peeks at the edge (scroll affordance); "None" uses slash-circle glyph.
- A11y: `role="radiogroup"` label "Filters"; tiles `role="radio"` with `aria-checked`; thumbnails `alt=""` (name is caption); arrows move selection, Home/End; `scroll-snap-type:x mandatory`, `scroll-padding`; selected state should also change caption weight/colour and optionally show a check badge.

Intensity dial (fine tick ruler)
- Anatomy: 27 ticks per 230px, major ticks brighter, neutral white dot, current value = taller accent tick. No numeric readout (problem).
- A11y: native `<input type=range>` restyled, label "Filter intensity", show value; step 1, PageUp/Down 10, Home/End; ticks decorative.

Action row (Delete / Add / Preset)
- Anatomy: icon over caption; Add = 38px accent disc with black plus; Delete/Preset bare glyph 18px.
- Fixes: captions >=12px and >=4.5:1 (#a1a1a6), consistent state style; disabled must be distinguishable by more than dimness (aria-disabled, tooltip).

Preset buttons
- Anatomy: six 45x29 surface-1 chips with a 16x9 curve glyph; active = accent glyph (only colour difference!).
- Fixes: add fill/outline to active (2px accent ring or accent 15% fill), `role="radiogroup"` + `aria-checked` with labels "Ease in/out", etc.; height >=44.

Curve editor
- Anatomy: surface-1 panel 336x132, faint grid, axis labels, gradient curve (violet -> pink), nodes 10-11px, current node white with glow, playhead line.
- A11y: nodes as focusable `role="slider"` pairs or a `grid` of controls; each node label "Keyframe 2 of 5, 2.0x at 00:03"; arrows change time (left/right) and speed (up/down), Shift = coarse, Delete removes, `Enter` opens numeric Time/Speed fields; "Show as table" alternative (`<table>` of keyframes); node hit area >=44px; dragging must not be the only way (2.5.7). Gradient decorative.

Badges/markers
- Sparkle (AI/effect) icon on clip = status icon in accent; needs `aria-label="Effect applied"`.
- Split/transition handle: white disc with bow-tie glyph; needs "Transition between clips" label, 44px hit area.

## 7. Accent system (single-accent dark pro-tool)

One accent (#7c78f4) does four jobs: (1) primary action fill (Add), (2) selection stroke + handles (clip), (3) active tool (icon colour + dot), (4) value/position marker (intensity tick, first preset glyph, curve nodes). White does a fifth job: the playhead / current-time / selected-tile ring (white = "where you are right now", accent = "what you have selected/primary"). Text and default icons are white/grey. Elevation via lightness: #000 -> #272729 -> #403d48. A gradient (accent -> pink) is used only for data visualisation, never for chrome.

Recommended tokens (keep the look, fix the contrast)
- `--bg:#000`, `--surface-1:#1c1c1e` to `#272729` (keep #272729 but add a 1px #3a3a3c hairline if the boundary matters), `--surface-2:#403d48`.
- `--text:#fff`, `--text-2:#a1a1a6` (8.16:1 on black, 5.80 on surface-1), `--text-3:#8a8a8f` (6.11 on black, 4.34 on surface-1, use only for >=14px or non-essential), `--disabled:#6b6b70` (3.96:1, plus aria-disabled and no pointer).
- `--accent-500:#7c78f4`, `--accent-300:#a29ff8` (accent text on surfaces), `--accent-600:#5a55e6` (white-text fills), on-accent `#0b0a2a`.
- `--scrim:rgba(0,0,0,.6)` overlay text, `rgba(0,0,0,.5)` icon buttons.
- Focus ring: 2px `--accent-300` + 2px offset against dark, or white; both >=3:1 on black.

## 8. Generic vs one-off

Generic (keep): pure-black screen + two lifted surfaces; single accent for selection, primary and active; state via shape redundancy (outline + handles, ring, dot); edge-to-edge media with gradient fades into UI; rounded 8/12/full radii; icon-over-caption action rows; centred title with cancel/confirm pair; horizontal scroll rows with a peeking last item; white-line playhead crossing all tracks; round check "commit" buttons; segmented radio-like preset chips; tabular timecode with current bright / total dim; toolbar with 50px pitch.

One-off / decorative: device frames, drop shadows, the pink gradient, glow on node, violet wash over thumbnails, photography, specific icons (flame, layers), mirrored waveform art, bow-tie glyph.

## 9. Problems to fix

1. Hard contrast fail: white header on pale photo (1.64:1); left header marginal (4.12).
2. Caption greys too dim/small (peak 3.2:1, 2.9:1 for Delete/Add, about 10-11px); "8x/1/8x" labels 2.0:1; "01:24" 2.75:1; time labels 9-10px.
3. Bare icon-only toolbar: flame/layers/gauge/tiny dot ambiguous; add labels or tooltips.
4. Active preset differs only by glyph colour: colour-only.
5. Drag-only affordances (trim handles, playhead, curve nodes, dial, reorder) need keyboard and single-pointer alternatives (WCAG 2.2 SC 2.5.7).
6. Targets far below 44px: play glyph 13x15, nodes 10-11, handles 7-8, "+" 22, split 23.
7. Scrubber track 1.22:1 and thumbless, ruler ticks 2.2:1, timeline labels non-linear (0,1,5,10 equally spaced).
8. Selection styling only on the tile ring (filter caption unchanged); make caption + badge change.
9. "Add" (primary) caption dimmer than "Preset" (secondary): inverted hierarchy; disabled vs inactive indistinguishable.
10. The unlabeled tiny dot in the left toolbar looks like a bug; overflow should be an explicit "More" button.
11. No focus, hover or pressed states are drawn; no status/home-indicator safe-area accounted for.
12. Waveform and thumbnails have no text alternative.

## 10. Uncertainty notes

- Text greys and thin accent strokes are under-measured due to anti-aliasing at 5-8 image px; "estimated true" values are marked measured=false.
- Logical px are scaled from image px by phone width (x1.506 left/right, x1.279 centre); +/-2px.
- Accent hue 242 deg periwinkle; pink #c75eab only measured at one node.
- Spacing base 4px (8px steps) is inferred from ratios, not from source.
