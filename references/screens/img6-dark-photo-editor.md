# Image 6 - Dark, content-forward photo editor (3 phone screens)

Source: `/root/.claude/uploads/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/0879b710-image.jpg` (473x355 JPEG)
Analyst: read-only. Nothing under `/home/user/styleguide` was touched.

## 0. How reliable are the numbers?

- The image is tiny. Each phone is only about **107.5 px wide**, so **1 image px = 3.63 CSS px** at a 390 px phone. Every dimension below is `image px x 3.63`, good to about +/-1 image px (so +/-4 CSS px). Treat them as "about".
- **Flat fills are reliable.** These were sampled from 5x5 to 15x15 patches, as medians or quantised dominants: the black base, the #1a1a1a button fill, solid white fills, and the photo backgrounds.
- **Thin strokes and small text are not reliable.** Glyphs, ticks and outlines are 0.3-0.5 image px wide, so JPEG and downscale blur attenuate them. Their observed peaks (for example label peak #5f-#7c) sit well below the true colour. Where I estimate a "true" colour I mark it **measured=false** and show both the observed value and the estimate.
- No hue was found in the UI chrome: every chrome sample has R=G=B within JPEG noise.

## 1. Inventory

Three phones on a mid-charcoal page (a mock-up presentation surface, not app UI).

**Screen 1, "edit home / tool picker".**
- Full-bleed portrait photo (pale blue backdrop) with the device's rounded corners, about 79% of the phone height.
- Two floating white circular icon buttons on the photo: back arrow top-left, download top-right. Each is about 47 px and sits 16 px from the edge.
- Black bottom tray holding a row of 5 round tool buttons (icon in a #1a1a1a circle, tiny label underneath).
- A white "NEW" pill badge on the first tool.
- Two near-invisible white icons at the photo's bottom corners (undo and compare). They vanish against the pale photo.

**Screen 2, "Backdrop" tool mode.**
- Photo shrinks to an inset rectangle with black margins and square corners.
- Right-edge floating stack of 2 circular buttons (one white-filled and active, one scrim-filled).
- Undo and redo icons bottom-left of the photo (redo disabled) and a compare icon bottom-right.
- Centre-playhead tick-mark scrubber under the photo.
- Segmented chip row: PATTERN (active, white) | COLOR | GRADIENT | PHOTO.
- Horizontally scrolling carousel of 56 px circular thumbnails. The first has a selection ring. The last is clipped by the screen edge as a scroll affordance.
- Bottom action bar: X (cancel) circle, centred title "Backdrop" plus a white "?" help badge, check (apply) circle.

**Screen 3, "Fix Lighting" tool mode.**
- Same shell as screen 2.
- A 43 px translucent white circular drag handle floats on the photo (a point or brush position).
- Tick scrubber (ticks only up to the centre playhead).
- Tool row with labels ABOVE the circles (screen 1 has them below). The selected tool is a white-filled circle inside an outlined pill that also holds a sub-option icon. Unselected tools are dimmer. The 6th tool is clipped at the edge.
- The same X / title / check action bar.

There are no emoji and no colour accents anywhere. All chrome is greyscale.

## 2. Measured palette

| Role | Hex | Measured? | Where / how |
|---|---|---|---|
| Presentation page (mock only) | #494949 to #373737 | yes | Diagonal gradient, lighter top-left. 5x5 grid means. |
| Page shadow pool between/below phones | #282828 to #2a2a2a | yes | Large soft drop shadow of the phones. Not app UI. |
| **surface-0** (screen, tray, bezel) | **#000000** (range #000000-#020202) | yes | Tray median #020102, bezel #000000. Pure black, not #1a1a1a. |
| **surface-1** (circle buttons, inactive chips) | **#1a1a1a** (samples #181818-#1c1c1c) | yes | Tool circles, X/check circles, inactive chip fill. Only one lifted dark surface exists. |
| Solid "selected/active" fill | **#ffffff** (median #f4f5f3 on chip, #fff on circle) | yes | Active chip, selected tool circle, floating white buttons (#f1f6fb to #f4f9fd median). |
| Text on white chips | near-black, about #000-#111 | **no** | Observed darkest stroke pixel #626262 (attenuated). |
| Title text | #ffffff | yes | "Backdrop" and "Fix Lighting" peak pixels reach #fff. |
| Icon colour on dark (S1) | white; observed peaks #cdcdcd / #a5a5a5 | partly | 1.5-2 px strokes, attenuated. |
| Unselected icons in S3 | white at about 60-70% opacity | **no** | Observed peaks #6b-#96, against #a5-#cd in S1. |
| Tool label text (S1, below) | white, likely 70-100% | **no** | Observed peak #5b-#7c on #020102. |
| Tool label text (S3, above), unselected | very dim, about white at 35-45% | **no** | Observed peak #2f-#41. Selected label peaks #6a. |
| Inactive chip text | about #6a-#88 | **no** | Observed peak #434343 on #181818. |
| Disabled (redo) | white at about 31-35% | roughly | Observed #596154 over #0d1308. |
| Scrubber ticks, "covered" side | about #8a8a8a (white at 50-55%) | **no** | Observed peak #4e4e4e for 1 px ticks. |
| Scrubber playhead | white, observed #868485, 2x height | partly | Wider stroke, so less attenuated. |
| Scrubber ticks, "uncovered" side | white at 8-15% | roughly | Observed #171717 to #262626. Near-decorative. |
| Selection ring on thumbnail | pale grey, observed #8d8e88 | partly | About 2-3 CSS px, 1-2 px gap from the image. |
| Pill outline around selected tool | white, observed #636363-#757575 | partly | About 1.5-2 CSS px. |
| Scrim on floating secondary button | black at about 0.6-0.7 | roughly | #381b1d over rose #855e5f-#8a6263. |
| Drag handle | white at about 0.5 | roughly | #8a8f88 over #191f14 gives alpha of about 0.49. |
| Photo content (NOT UI): pale blue | #b4c8dc | yes | S1 sky. |
| Photo content (NOT UI): dusty rose | #b06e70 (top) to #a35c5c | yes | S2 backdrop. |
| Photo content (NOT UI): sage green | #3d503b | yes | S3 backdrop. |

**Key finding:** the design has **no accent colour at all**. Hierarchy comes only from luminance:
- black base
- one grey lift (#1a1a1a)
- pure white as the "active" colour

Because the chrome is achromatic, it never colour-casts the user's photo. The chrome also has almost no ambient light, so the image is the only bright region.

### Dark-surface elevation ramp (measured anchors plus proposed steps)

| Step | Value | Source | Use |
|---|---|---|---|
| surface-0 | #000000 | measured | Screen base, tray, bezel, letterbox around media |
| surface-1 | #1a1a1a | measured | Resting circular control, inactive chip (1.21:1 against surface-0) |
| surface-2 | #262626 | proposed | Hover or pressed control, raised sheet |
| surface-3 | #333333 | proposed | Strong pressed, menu |
| scrim | rgba(0,0,0,.65) | measured about 0.6-0.7 | Controls floating on media |
| glass-white | rgba(255,255,255,.5) | measured about 0.49 | Drag handle over media |

The ramp steps are tiny on purpose (1.2-1.7:1). This only works because **glyph and text carry the identification**. The control outline is not relied on. A focus ring must still be added, because 1.2:1 fill steps give no focus cue.

## 3. Contrast (WCAG 2.2; computed from measured or explicitly labelled hexes)

Text needs 4.5:1, or 3:1 if large (24px+, or 18.66px+ bold). Non-text UI needs 3:1.

| Pair | Ratio | AA verdict |
|---|---|---|
| White #fff on black #000 (title, icons) | 21.0 | pass |
| White on button fill #1a1a1a (icon on circle) | 17.4 | pass |
| Button fill #1a1a1a against screen #000 (boundary) | **1.21** | fail for boundary. Acceptable only because the glyph is the identifier (1.4.11 is met by the glyph). **Focus ring is mandatory.** |
| Inactive chip fill #181818 against #000 | 1.18 | boundary fails, same logic |
| Active chip fill #f4f5f3 against black | 19.2 | pass |
| Active chip text, observed #626262 on #f4f5f3 | 5.6 (lower bound) | pass even at the attenuated value. True text, estimated #111, is 17.3 |
| **Inactive chip text, observed peak #434343 on #181818** | **1.79** | **fail**. Even the most generous estimate fails (see next three rows) |
| Inactive chip text, estimated #6a6a6a on #181818 | 3.28 | fail for 10px text |
| Inactive chip text, estimated #888888 on #181818 | 5.01 | would pass if this were the real value |
| Inactive chip text, estimated #9a9a9a on #181818 | 6.31 | pass |
| S1 tool label, observed peak #5f5f5f on #020102 | 3.26 | fail as observed |
| S1 tool label, observed peak #7c7c7c on #020102 | 4.99 | marginal |
| S1 tool label if white at 60% (#999) on black | 7.37 | pass (estimate) |
| S3 label, observed unselected peak #333 on black | 1.66 | **fail** by a large margin |
| Selected tool: observed icon #757575 on white circle | 4.61 | pass for a graphic, but the icon looks weak |
| Unselected S3 icon, observed #6b6b6b on #181818 | 3.33 | passes 3:1 for a graphic, barely |
| S1 icon observed #cdcdcd on #1a1a1a | 10.95 | pass |
| Ticks, observed 1 px peak #4e4e4e on black | 2.52 | fail as observed. Likely about #8a if true (6.1). Uncertain |
| Playhead, observed #868485 on black | 5.65 | pass |
| Remaining ticks, observed #171717 on black | 1.17 | fail. Decorative only |
| Disabled redo, white at about 33% (#545454) on black | 2.77 | exempt (disabled), but too faint to read as a control |
| **White floating button #f4f9fd on pale-blue photo #b4c8dc** | **1.62** | **fail** for the boundary. The dark glyph inside is fine (16.4) |
| White undo/compare icon over pale photo #b4c8dc | **1.72** | **fail** (visible in S1: nearly invisible) |
| White undo icon over rose photo #86494b | 6.84 | pass here, but only by photo luck |
| Scrim button #381b1d against rose photo #8a6263 | 2.99 | about 3:1. White glyph on scrim is 15.6 (pass) |
| Drag handle #8a8f88 against dark green #191f14 | 5.10 | pass |
| Drag handle against jacket #30342b | 3.85 | pass |
| Drag handle against pale sky #b4c8dc | **1.92** | **fail** on light photos |
| Thumbnail selection ring, observed #8d8e88 on black | 6.36 | pass |
| Pill outline, observed #757575 on black | 4.56 | pass |
| Page charcoal #404040 against phone black | 2.03 | irrelevant (presentation surface) |

### Proposed fixes (keep the look, pass AA)

| Token | Value | Result |
|---|---|---|
| `--fg` | #ffffff | 21:1 on surface-0, 17.4:1 on surface-1 |
| `--fg-muted` (labels, inactive chip text) | #a8a8a8 | 8.83:1 on #000, 7.32:1 on #1a1a1a, 6.36:1 on #262626 |
| `--fg-subtle` (hints, only at 12px+ weight 500) | #8c8c8c | 6.1:1 on #000, 5.18:1 on #1a1a1a |
| Scale ticks (informative) | #8a8a8a covered, #5c5c5c uncovered | 6.08:1 and 3.14:1 on #000. Both pass 3:1 |
| Disabled | rgba(255,255,255,.38) = about #616161 | 3.39:1 on #000. Exempt, still legible |
| Inactive chip text | #a8a8a8 on #1a1a1a | 7.32:1 |
| Floating control over arbitrary media | scrim rgba(0,0,0,.65) plus white glyph, or white plus 1 px rgba(0,0,0,.25) ring | The scrim keeps glyph at 15:1 on any photo. The white variant needs an edge because its boundary is 1.5:1 on pale photos |
| Focus ring | `box-shadow: 0 0 0 2px #000, 0 0 0 4px #fff` | Two-tone ring: one of the two tones always reaches 3:1 against whatever sits behind it (black tray or any photo) |

Smallest greys that pass (for token tuning): on black, 3:1 is #5a5a5a, 4.5:1 is #757575, 7:1 is #959595. On #1a1a1a, 3:1 is #666666 and 4.5:1 is #828282.

## 4. Shape and spacing (CSS px at 390 wide, about +/-4)

| Item | Image px | CSS px | Notes |
|---|---|---|---|
| Phone width / height | 107.5 x 233 | 390 x 845 | 9:19.5 ratio; 1 image px = 3.63 CSS px |
| Media area S1 | 185 tall (79%) | about 670 | Full-bleed under status bar, device corner radius |
| Media area S2/S3 | 94 x 152 (65%) | about 340 x 552 | Inset 24-27 px each side, top gap about 44 px; **corners square, radius about 0-4 px** |
| Floating white button (S1) | 13 | **47** | 16 px from edges; glyph about 17 px |
| Floating stack buttons (S2) | 10-11 | 36-40; pitch about 51 | Straddle the photo's right edge |
| Tool button (S1/S3) | 15-16 | **54-58** | Icon about 20 px (ink ~18 px); ratio icon:circle about 0.35 |
| Tool row pitch | 20.9 | about 76 | Gap about 18 px; row is a horizontal scroller (S3 clips 6th item) |
| Selected tool pill (S3) | 34.4 x 17.2 | about 125 x 62 | Outline about 1.5-2 px; white circle 58 px inside |
| X / check buttons | 11-11.5 | **40-42** | Icon about 16 px; 16-20 px from edge |
| Chip | 22 x 6.5 (PATTERN) | height **24-26**, PATTERN width about 80 | Horizontal padding about 14; gap about 11; fully round |
| Thumbnail | 15.4 | **56** (63 with ring) | Pitch about 70, gap about 14; ring about 2-3 px with 1-2 px gap; 22 px first-item inset |
| Help badge "?" | 5 | about 18 | White disc, dark glyph, 5 px right of title |
| NEW badge | 8 x 4 | about 29 x 14 | White pill, dark 8 px text |
| Tick pitch | 2 | **about 7.3 (8 probable)** | 1-1.5 px wide ticks |
| Tick height / playhead height | 3.5-4 / 6.5-7 | 13-15 / 24-25 | Playhead at exact phone centre (x=236 of 182-289, x=376 of 323-430) |
| Drag handle | 12 | about 43 | White at 50%, no visible ring |

**Radii:** everything interactive is a full circle (r = 50%) or a full pill (r = h/2). The only square-ish element is the inset photo (about 0-4 px). The phone's own corner is about 13% of width (about 50 px). The system is **"circles plus pills, nothing in between"**: there is no 8 px or 12 px rounded-rectangle.

**Borders:** essentially none. The only strokes are the selected-tool pill outline (about 1.5-2 px white) and the thumbnail selection ring (about 2-3 px, pale, offset). Selection is shown with a **white fill** for buttons and chips, and with a **ring** for media thumbnails (so the image stays visible).

**Shadows:** none on any UI element. Separation is by fill only. (The page-level shadow under the phones belongs to the mock-up.)

**Vertical rhythm of the S2 tray** (edge to edge): photo to ticks about 11, ticks to chips about 18, chips to thumbnails about 16, thumbnails to action bar about 22. That reads as **4 px base, with 8/16/24 steps** (12-16-16-24). Side padding is 16-24.

**Media to chrome ratio:** S1 79:21, S2 and S3 65:35. The tray is about 240 px, so about 29% of the screen height, and is reserved for controls.

**Touch targets against a 390 px phone**

| Control | Size | WCAG 2.5.8 (24px) | 44px guidance |
|---|---|---|---|
| Tool buttons, thumbnails | 54-58 | pass | pass |
| Floating buttons | 36-47 | pass | pass at 47; stack at 36-40 is short |
| X / check | 40-42 | pass | just short |
| Chips | 24-26 tall | **borderline** | fail |
| Undo / redo / compare icons | about 16-18 glyph, no visible container | **probably fail** | fail |
| Help "?" badge | 18 | fail unless spacing exception applies | fail |
| Scrubber strip | full width, about 28 tall | pass | short |

## 5. Typography

The face could not be identified. The glyphs are too small. It reads as a neutral, humanist or geometric **grotesque sans** with open apertures, similar to SF Pro Text, Google Sans or Inter, used at medium weight.

**Closest OFL candidates** (self-hostable, variable): **Inter** (nearest to SF Pro, excellent at tiny sizes), **Figtree** (friendlier), **DM Sans**, **Manrope**, **Plus Jakarta Sans**. Google Sans/Product Sans feel: Outfit or Figtree. (I am not sure of the licence status of "Google Sans Flex"; verify before relying on it.)

| Role | Size estimate | Weight | Case / tracking | How derived |
|---|---|---|---|---|
| Screen title ("Backdrop", "Fix Lighting") | **15-16 px** | 500-600 | Sentence/title case, normal | Width of "Backdrop" = 65 CSS px, matching about 15.4 px Arial-width metrics |
| Chip label | **10-11 px** | 600 | UPPERCASE, tracking about +0.05-0.08em | "PATTERN" = 51 px wide, cap height 7-8 px |
| Tool label | **about 10 px** | 500 | Sentence case | Cap-ish height 2 image px (7 CSS), "Retouch" about 36 px wide |
| S3 tool label | 9-10 px | 500 | Sentence case, dim | Same scale as S1 |
| NEW badge | about 8 px | 700 | UPPERCASE | Badge 14 px tall |

**Hierarchy:** there is exactly one "large" level (the 15-16 px title) and one micro level (8-11 px). There is **no body text, no numerals, no dates** (nothing numeric is displayed, not even a slider value). Numeral treatment cannot be derived from this image.

## 6. Components (anatomy, states, accessibility)

### 6.1 Floating media button (two variants)
- **Anatomy:** 36-47 px circle, 16-17 px outline glyph, anchored 16 px inside the media corner.
- **Variant A (solid):** #fff fill, dark glyph (S1 back/download, S2 active stack item).
- **Variant B (scrim):** rgba(0,0,0,.65) fill, white glyph.
- **States seen:** default. Active is shown by white fill in the stack (first button white, second scrim). Implied: pressed (scale .96 or fill dim), focus, disabled.
- **Accessibility:**
  - `<button>` with `aria-label` ("Back", "Download"). Visible tooltip.
  - Hit area at least 44 px via `::before` padding.
  - Two-tone focus ring.
  - Variant B is the safe default, since variant A's edge fails on pale photos (1.5:1).
  - Keep it in a real `<header>` or toolbar landmark, not an unlabelled overlay.

### 6.2 Labelled circular tool button (tool tray item)
- **Anatomy:** 58 px #1a1a1a circle, 20 px white glyph, 10 px label 8-10 px below, optional NEW pill at top-left.
- **States:**
  - default (white glyph)
  - selected (S3: white circle plus dark glyph plus outline pill plus brighter label)
  - unselected-when-another-selected (S3: glyph and label dimmed)
  - implied: pressed, focus, disabled.
- **Accessibility:**
  - `<button>` with visible text (the label is the accessible name; do not rely on the icon).
  - Radio-like: `role="radiogroup"` / `aria-checked`, or `aria-pressed`, depending on whether tools are modes.
  - NEW badge needs text ("New") in the name or `aria-describedby`.
  - Labels must be at least 12 px, at least #a8a8a8.
  - Labels belong in **one consistent position** (below), not below in S1 and above in S3.

### 6.3 Expanding selected-tool pill (sub-mode toggle)
- **Anatomy:** outlined 125x62 pill (about 1.5-2 px white) containing a white selected circle and a second, unselected sub-option icon.
- It is a 2-state segmented control that appears only on the selected tool.
- **Accessibility:**
  - `role="radiogroup"` with two radios and an accessible name for each ("Brighten shadows", etc.).
  - Arrow-key movement.
  - Do not communicate by the icon alone; add a visible label.
  - The width animation must respect `prefers-reduced-motion`.

### 6.4 Bottom action bar (tray header: cancel / title / apply)
- **Anatomy:** 42 px X circle, left. Centred 15-16 px title plus an 18 px "?" badge. 42 px check circle, right. About 16-20 px side padding, about 22 px above.
- **States:**
  - default
  - pressed and focus (implied)
  - possibly disabled apply when no change (implied)
- **Accessibility:**
  - `<button aria-label="Cancel">` and `<button aria-label="Apply">` (or "Done"). Visible text in a wider layout.
  - Title is an `<h2>`, and focus moves to it on entering the mode.
  - Esc equals cancel.
  - Hit area at least 44 px.
  - "?" badge needs a real button, `aria-label="Help: Backdrop"`, and at least 24 px.
  - Unsaved changes: confirm on cancel if dirty.
  - Announce the result ("Backdrop applied") via a polite live region.

### 6.5 Segmented chip row (category switch)
- **Anatomy:** 24-26 px tall pills. Active: #fff fill, near-black text. Inactive: #181818 fill, dim text. 10-11 px UPPERCASE tracked text. Gap about 11.
- **States:** active, inactive, implied pressed/focus.
- **Accessibility:**
  - `role="tablist"` with `role="tab"` and `aria-selected`, plus `aria-controls` the carousel panel.
  - Arrow keys, Home and End.
  - Visual height 32 px, with hit area 44 px.
  - Inactive text must be at least #a8a8a8 (7.3:1 on #1a1a1a).
  - Horizontal overflow needs a clipped-edge affordance.

### 6.6 Thumbnail carousel (radio-like selection)
- **Anatomy:** row of 56 px circular previews, pitch 70, scrolls horizontally, last item clipped.
- **Selected:** thumbnail grows about 11% and gets a pale ring (2-3 px) separated by a 1-2 px gap.
- **Accessibility:**
  - `role="radiogroup"` with `aria-label`, each thumbnail a `role="radio"` with `aria-checked` and a human name ("Green marble").
  - Roving tabindex.
  - Arrow keys scroll the focused item into view.
  - `scroll-snap-type: x proximity`.
  - Include a "None" option.
  - Ring gets a non-colour cue (a small check) for robustness, and stays at least 3:1 against the tray.
  - Desktop gets previous/next buttons, since horizontal touch-scroll alone is not keyboard-friendly.
  - `prefers-reduced-motion` disables smooth scroll.

### 6.7 Tick-mark scrubber / dial
- **Anatomy:** full-width strip about 28 px tall. Ticks every about 8 px, 13-15 px tall. A 24 px playhead fixed at the centre. Ticks "covered" by the playhead are brighter. A small default-position dot sits beneath.
- **States:** at rest, dragging (implied), at bounds (ticks stop beyond the range; S3 shows nothing past the playhead).
- **Drag-only as drawn.** That fails WCAG 2.5.7 (dragging movements) unless there is an alternative.
- **Accessibility:**
  - `role="slider"` (or native `<input type="range">` styled with a repeating-gradient tick background and a custom thumb), with `aria-valuemin/max/now/valuetext` and a visible numeric readout (none is shown).
  - Keyboard: Left/Right (step), Shift+arrows or PageUp/PageDown (big step), Home/End, plus a reset action bound to the default-position dot.
  - A single-pointer alternative: a 44 px minus button and a 44 px plus button flanking the strip.
  - `touch-action: pan-y` so horizontal drag is captured.
  - Haptic or visual detent at each tick is decorative.
  - `aria-label` names the parameter ("Intensity").

### 6.8 Undo / redo pair
- **Anatomy:** two bare 16-18 px icons at the photo's bottom-left, no container. Redo is disabled at about 33% white.
- **Problem:** no container means no contrast guarantee on media (1.7:1 on pale photos), and hit areas are under 24 px.
- **Accessibility:**
  - `<button aria-label="Undo">` and `<button aria-label="Redo" disabled>` (real `disabled` or `aria-disabled` with a reason).
  - Place them in a scrim chip.
  - Shortcut Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z.
  - Announce "Undone: <step>" in a live region.

### 6.9 Compare / "hold to see original" button
- **Anatomy:** bare layered-squares icon at photo's bottom-right.
- **Likely hold-to-peek** behaviour. That needs a toggle alternative (`aria-pressed`), because holding fails single-pointer and dexterity users.

### 6.10 Overlay drag handle (S3)
- **Anatomy:** 43 px circle, white at 50%, no ring, placed on the photo as an on-image control (a sampling point or brush position).
- **Accessibility:**
  - Drag-only fails 2.5.7.
  - Provide arrow-key nudging (focusable `role="slider"` pair for X/Y, or an "Adjust position" mode with directional buttons).
  - A ring (two-tone) so it is visible on both dark and light photos (1.9:1 on pale sky as drawn).
  - Announce coordinates.

### 6.11 Badges ("?" help, "NEW")
- Both are tiny white discs or pills with dark text.
- "NEW" at about 8 px fails size-legibility guidance. Raise to at least 11 px, or render as a dot with visually-hidden text.
- "?" must be a real button at least 24 px, with a tooltip or popover.

## 7. Layout patterns

1. **Stage and tray.** Media is the hero (65-79% of the height). Everything else is squeezed into a black bottom tray. The tray holds up to 4 stacked rows (S2: scrubber, chips, thumbnails, action bar).
2. **Mode switch without navigation.** Choosing a tool turns the tray into a tool mode: the photo shrinks from full-bleed to inset, the tool row is replaced by options, and the tray gets the cancel / title / apply bar. The user is never lost, since cancel and apply are always in the same two corners.
3. **Tray stack order (S2):** scrubber (continuous value), then chips (category), then thumbnails (choice), then the action bar. Fine to coarse to decision, top to bottom.
4. **Horizontal scrollers with a clipped last item** (tools, thumbnails) to signal more.
5. **Controls overlay the media at the corners** (back, download, undo, redo, compare, right stack). Always 16 px from the edge.
6. **Centred title with a help affordance** in the bar, not at the top of the screen.
7. **Centre-fixed playhead** on a ruler, like a physical dial.

## 8. Motion implied

- Photo scale or inset transition between overview and tool mode (about 250-300 ms ease-out), with the tray content swapping.
- Horizontal momentum scroll with snap on the carousel and tool row; per-tick haptics on the scrubber.
- Pill expansion of the selected tool (width animation about 200 ms).
- Chip fill cross-fade; thumbnail ring scale-in; press states (scale .96, #262626).
- Everything must fall back to instant or a simple cross-fade under `prefers-reduced-motion`.

## 9. Distilled: generic vs one-off

**Generic (carry into the system):**
- A content-first dark theme. Achromatic, with surface-0 #000, surface-1 #1a1a1a, white as the "active" colour, and no accent (brand colour is an optional token that only appears in focus rings or rare emphasis).
- Circle and pill shape language only; no shadows; selection is fill (controls) or ring (media).
- Stage-and-tray layout and the cancel / title / apply bar.
- Floating media controls with two variants (solid and scrim).
- Chip tabs, thumbnail radio carousel, tick dial, tool button, undo/redo pair, help and NEW badges.
- A 4 px base, 8/16/24 steps; 56-58 px primary targets; 40-47 px secondary.

**One-off decoration (leave out):**
- The specific portraits and pattern thumbnails, the tool names, the device bezel and home indicator, and the charcoal gradient page with its soft shadow.
- Exact icon artwork. Use a neutral stroke icon set at 1.5-2 px stroke.

## 10. Strengths to keep

- Chrome recedes; media is the hero. The two-step surface ramp plus pure white as the only "on" colour is an easy rule to reuse.
- Consistent placement: cancel left, apply right, title centre. Users learn it once.
- Progressive disclosure: one control type per tray row.
- Large round primary targets (54-58 px) with generous spacing (18 px).
- Clipped-edge scroll affordance and a selection ring that keeps the image visible.
- Fully round geometry makes the UI look friendly without decoration.

## 11. Problems to fix (what the generic system must do differently)

1. Inactive chip text is nearly invisible (observed 1.8:1). Fix with `--fg-muted` at least #a8a8a8 (7.3:1 on #1a1a1a).
2. Tool labels (10 px, observed 3.3-5:1, and S3's observed 1.7:1) are too small and too dim. Minimum 12 px and 7:1.
3. Icon-only controls with no accessible names: back, download, X, check, undo, redo, compare, stack buttons, "?" badge. Every one needs a visible label or `aria-label`, plus a tooltip.
4. Bare icons on media (undo, redo, compare) vanish on pale photos (1.7:1). Always put media overlays in a scrim or ring.
5. White floating buttons have a 1.5:1 edge on pale photos. Use the scrim variant by default.
6. Drag-only interaction on the scrubber and the overlay handle fails 2.5.7. Add plus/minus buttons, arrow keys, a numeric readout, and a reset.
7. The scrubber shows no numeric value, so its state is invisible to screen readers and to users who cannot judge tick position. Add `aria-valuenow`/`valuetext` and a visible value.
8. Touch targets: chips (24-26 px), undo/redo (under 24 px), "?" badge (18 px), X/check (40-42 px). Extend hit areas to 44 px.
9. Label position is inconsistent (below in S1, above in S3). Choose one.
10. Disabled redo at about 33% opacity reads as "missing", not "unavailable". Use a real `disabled` state with a tooltip.
11. The 1.2:1 fill steps give no focus cue. A focus ring is mandatory (not shown anywhere).
12. The selected ring on thumbnails is thin (2-3 px, low res). Add a check or a stronger cue, and use `aria-checked`.
13. NEW badge text (about 8 px) and the drag handle (1.9:1 on pale photos) need larger text and a ring.
14. The tool-pill sub-option has no visible label. Add text.
15. No empty, loading or error states are shown for the carousel or the photo.

No emoji are used as content. No meaning depends on hue (the UI is greyscale), but selection depends on luminance alone in the chips, so pair it with a non-colour cue (weight, check, `aria-selected`).

## 12. Suggested token sketch (derived; not measured)

```css
:root[data-surface="media"] {
  --surface-0:#000;  --surface-1:#1a1a1a; --surface-2:#262626; --surface-3:#333;
  --fg:#fff; --fg-muted:#a8a8a8; --fg-subtle:#8c8c8c; --fg-disabled:rgba(255,255,255,.38);
  --selected-bg:#fff; --selected-fg:#111;
  --scrim:rgba(0,0,0,.65); --glass:rgba(255,255,255,.5);
  --tick:#8a8a8a; --tick-dim:#5c5c5c; --playhead:#fff;
  --r-full:999px; --r-media:4px;
  --size-hit:44px; --size-tool:56px; --size-thumb:56px; --size-icon-btn:40px; --size-chip-h:32px;
  --space:4px; /* steps 4/8/12/16/24/32 */
  --focus:0 0 0 2px #000, 0 0 0 4px #fff; /* two-tone ring, works on any media */
}
```

## 13. Files

- This report: `/tmp/claude-0/-home-user-styleguide/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/scratchpad/analysis/img6-dark-photo-editor.md`
- Working crops and helper (scratch only): `/tmp/claude-0/-home-user-styleguide/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/scratchpad/` (`lib.py`, `s1.png`, `s2.png`, `s3.png`, `t1-t3.png`, `thumbs.png`)
