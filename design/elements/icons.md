# Icons

Element 06 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/icons.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
glyph set's own spec, with every glyph's path data so native apps can port it.

## Brief

*The glyph set.* Grown from 5 to 26, each on the 24 grid with a 2px square-cap stroke, as masks
in `css/icons.css`:

- navigation: back, forward, down, up;
- actions: more, search, edit, delete, share, undo, refresh, shuffle, flip, install, sidebar;
- status: info, warning, offline;
- places: settings, today, decks;
- kept from v0: arrow, plus, minus, close, check.

No filled glyphs, no duotone, no glyph that needs colour to read. ↗ still means "leaves the app".

## House rules

- Line work on the frame's weight: `stroke-width='2'`, `stroke-linecap='square'`, mitred
  corners (the SVG default), `fill='none'`, on `viewBox='0 0 24 24'`. One `<path>` per glyph.
- Masks, not images: a glyph paints `currentColor`, so it follows the text or control it sits in,
  through every state and tone.
- Decorative by default: `aria-hidden="true"` on the glyph. When a glyph is a control's only
  content, the control gets the `aria-label`.
- The data URIs write black as `%23000` inside `url()`. That is the mask's alpha, not a colour
  anyone sees; `check.mjs` strips `url()` before it looks for colour literals.
- No glyph repeated on every card in a grid, no glyph in a tinted circle (rule 7).
- **Glyphs don't move by themselves** (gate 4). `icons.css` has no motion; an element may turn
  its glyph with a transform, which forced colours keep: Disclosure turns `ic--down` half a turn
  to point up, instead of swapping it for `ic--up`. The spinner isn't a glyph: Meter turns it.

## Anatomy

How a glyph is drawn, so the next one matches.

| Part | Spec |
| --- | --- |
| Grid | 24 × 24 units. 1 unit is 1px at 24px. |
| Live area | 4–20. Straight strokes stop at 5 and 19 and the square caps carry them to 4 and 20, as in plus. |
| Optical size | Circles reach 3–21 (info) and the warning triangle, mitred points included, about 2–22, because round and pointed shapes look smaller than square ones of the same width. |
| Stroke | 2 units, square caps, mitred joins. Every corner is wider than 50°, so the miter limit (4 in SVG) never bevels one. |
| Gaps | At least 2 units between strokes where possible, so nothing closes up at 20px, where a stroke is 1.67px. The tight spots: the today rings (1 unit to the header line), the decks stack (1 unit between layers) and share's arrowhead over its tray (about 1 unit). |
| Dots | Strokes too. 2×2 when the dot belongs to a letter (the i of info, the ! of warning): `h.01` with square caps. 3×3 when it stands alone (more, today): a 1-unit square, stroked. |
| Direction | Chevrons move within the app (back, forward, down, up). ↗ (`.ic--arrow`) is the only arrow that leaves it. Straight arrows (share, install, flip, shuffle, undo, refresh) belong to their verb. |

**Size:** `--ic-size`, 1.25rem (20px) by default; 1.5rem (24px) for a glyph standing alone in a
bar. Both are rem, so they follow the reader's text size; on iOS at the default Dynamic Type size
they are 21 and 25.5px. Smaller only inside a drawn box, as in `.card__ctl` (0.75rem). Inline in
a sentence: `--ic-size: 1.25em; vertical-align: -0.25em`.

```html
<span class="ic ic--search" aria-hidden="true"></span>
<span class="ic ic--search" style="--ic-size: 1.5rem" aria-hidden="true"></span>
```

## Variants

Twenty-six glyphs. Each is a `--icon-<name>` token (the data URI) and an `.ic--<name>` class.
The path is the `d` attribute, on the 24 grid, stroked as in House rules.

### Navigation

| Glyph | Class | Path `d` | Use |
| --- | --- | --- | --- |
| back | `.ic--back` | `M15 6l-6 6 6 6` | The top bar's back control, beside the previous screen's name. |
| forward | `.ic--forward` | `M9 6l6 6-6 6` | The end of a row that opens another screen; next card. |
| down | `.ic--down` | `M6 9l6 6 6-6` | Opens: a select, a closed disclosure. |
| up | `.ic--up` | `M6 15l6-6 6 6` | Closes an open disclosure. |

### Actions

| Glyph | Class | Path `d` | Use |
| --- | --- | --- | --- |
| more | `.ic--more` | `M5.5 11.5h1v1h-1zM11.5 11.5h1v1h-1zM17.5 11.5h1v1h-1z` | More actions, in a menu. Also the visible twin of any swipe action. |
| search | `.ic--search` | `M16.5 10.5a6 6 0 1 1-12 0 6 6 0 0 1 12 0zM15 15l4 4` | Search decks; the search field's leading icon. |
| edit | `.ic--edit` | `M5 19v-4L15 5l4 4L9 19zM12 8l4 4` | Edit a deck or a card. |
| delete | `.ic--delete` | `M5 7h14M10 4h4M7 7l1 12h8l1-12M10 11v4M14 11v4` | Delete. Always with words beside it ("Delete deck"), never alone. |
| share | `.ic--share` | `M12 5v10M8.5 7.5 12 4l3.5 3.5M8 11H6v8h12v-8h-2` | Share a deck. Also iOS's route to Add to Home Screen. |
| undo | `.ic--undo` | `M9 5 5 9l4 4M6 9h8a5 5 0 0 1 0 10h-3` | Undo the last action. |
| refresh | `.ic--refresh` | `M18 13a6 6 0 1 1-6-6h1M11 4l3 3-3 3` | Try again; check for new cards. Refresh is a button, never a pull. |
| shuffle | `.ic--shuffle` | `M5 7h2l10 10h1M5 17h2l10-10h1M16.5 4.5 19 7l-2.5 2.5M16.5 14.5 19 17l-2.5 2.5` | Shuffle the deck (a toggle). |
| flip | `.ic--flip` | `M5 8h11M14 5l3 3-3 3M19 16H8M10 13l-3 3 3 3` | Turn the card over: front and back change places. |
| install | `.ic--install` | `M12 5v9M8 11l4 4 4-4M5 15v4h14v-4` | Install the app (Chromium's prompt). |
| sidebar | `.ic--sidebar` | `M5 6h14v12H5zM10 6v12` | Show or hide the sidebar. |

### Status

| Glyph | Class | Path `d` | Use |
| --- | --- | --- | --- |
| info | `.ic--info` | `M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0zM12 12v4M12 8h.01` | A note that needs no action. |
| warning | `.ic--warning` | `M12 4l8.5 16h-17zM12 10v4M12 17h.01` | Something to fix: a field's error, a failed sync. |
| offline | `.ic--offline` | `M7 18A4 4 0 0 1 6.53 10.03A6 6 0 0 1 17.83 11.1A3.5 3.5 0 0 1 17 18zM4 4l16 16` | No connection ("You're offline. Changes are saved on this device."). A cloud, not wifi: the phone may be on cellular. |

### Places

| Glyph | Class | Path `d` | Use |
| --- | --- | --- | --- |
| settings | `.ic--settings` | `M5 8h6M17 8h2M5 16h2M13 16h6M13 6h4v4h-4zM7 14h4v4H7z` | Settings. Two sliders, not a gear: see below. |
| today | `.ic--today` | `M5 7h14v12H5zM5 11h14M9 5v3M15 5v3M8.5 14.5h1v1h-1z` | Today: the day's study. A calendar page with one day marked. |
| decks | `.ic--decks` | `M5 11h14v8H5zM7 8h10M9 5h6` | Decks: a stack of cards. |

**Why sliders for settings.** A gear with 2-unit strokes has teeth and gaps about 2 units
wide. At 20px on a 1x screen they close up into a blob with a hole in it (checked in Chromium).
Two sliders with square knobs stay two clean lines at every size, and "adjust" is what the
place does. In a tab bar the label "Settings" always sits beside it.

### Kept from v0

Unchanged: same class names, same data URIs.

| Glyph | Class | Path `d` | Use |
| --- | --- | --- | --- |
| arrow | `.ic--arrow` | `M7 17L17 7M8 7h9v9` | ↗: leaves the app. Never on an in-app link. |
| plus | `.ic--plus` | `M12 5v14M5 12h14` | Add a shape, a card, a deck. |
| minus | `.ic--minus` | `M5 12h14` | Collapse a panel. |
| close | `.ic--close` | `M6 6l12 12M18 6L6 18` | Close; clear a field. |
| check | `.ic--check` | `M5 12.5l5 5L19 7.5` | Done; mark as known. |

### Right to left

A glyph that points along the line mirrors under `:dir(rtl)`: `scale: -1 1` in `icons.css`, a
transform, so it keeps any `rotate` an element gives it, and forced colours keep it. A glyph that
means a thing, or points up or down, stays as drawn. The paths don't change.

| Mirrors | Why |
| --- | --- |
| back, forward | The line's own way back and on. |
| arrow (↗) | Leaves towards the end of the line, so ↖ in right to left. |
| undo | Goes back along the line. |
| sidebar | The sidebar sits on the start edge. |

| Stays | Why |
| --- | --- |
| check, close, plus, minus, more | Marks and signs, not ways. |
| search, edit, delete, settings | Pictures of tools; mirrored they'd be held in the other hand, not go the other way. |
| share, install, down, up | They point up or down, never along the line. |
| refresh | A turn, clockwise in every script, as the platforms draw theirs. |
| shuffle | A judgement call. Its arrows run to the end, but it means "out of order", not "on", and playback controls keep their direction in right to left on every platform. |
| flip | Points both ways at once: mirrored, it's the same picture. |
| info, warning, offline, today, decks | Things and places. Today's marked day is a day, not the first one. |

Native: SF Symbols' localized names do the same (`chevron.backward`, `arrow.uturn.backward`,
`sidebar.leading`); a custom `Path` glyph from the five gets
`.flipsForRightToLeftLayoutDirection(true)`.

## States

A glyph has no states of its own. It paints `currentColor`, so the control or text around it
decides: ink on paper, paper on the inverted tone, `--on-accent` on a filled control.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Any | the parent's `color` | | | The mask is `background: currentColor`. |
| Disabled | the parent's disabled colour | | | Inside a disabled card, `GrayText` in forced colours (card.css). |
| Forced colours | `(forced-colors: active)` | | | Backgrounds are dropped there, and a mask glyph is a background, so `icons.css` sets `forced-color-adjust: none` and paints every glyph `CanvasText`, in every state. |

## Accessibility

- Every glyph is `aria-hidden="true"`. Its meaning is in visible words or in its control's
  `aria-label` ("Share Shapes", "Clear search", "Back to the deck").
- An icon-only control is a 44px target whatever the glyph's size (`--hit`).
- No glyph needs colour to read, and status glyphs always come with words, so the system holds
  in greyscale and in forced colours.
- ↗ marks a link that leaves the app, so a reader can tell before they tap.

## Platforms

- **Installed PWA:** standalone has no browser chrome, so back (`.ic--back`) is always on screen
  past the root. iOS keeps Add to Home Screen behind its Share sheet, so install instructions
  show the share glyph; Chromium's own prompt gets the install glyph. Refresh is a button, not
  pull-to-refresh.
- **Mac:** native toolbars, menus and the sidebar use SF Symbols, which follow the system's
  weight and Increase Contrast. These glyphs are for what we draw: cards, fields, content.
- **SwiftUI:** each glyph is a `Path` built on the 24 grid and scaled to its frame, stroked with
  `StrokeStyle(lineWidth: 2 * size / 24, lineCap: .square, lineJoin: .miter, miterLimit: 4)`.
  The stroke scales with the glyph, as the CSS mask does (1.67pt at 20pt). Tint with
  `foregroundStyle`. `Color.primary` follows Increase Contrast.

  ```swift
  struct Glyph: Shape {
      let draw: (inout Path) -> Void          // drawn on the 24 grid
      func path(in rect: CGRect) -> Path {
          var p = Path(); draw(&p)
          return p.applying(CGAffineTransform(scaleX: rect.width / 24, y: rect.height / 24))
      }
  }
  // plus: M12 5v14 M5 12h14
  Glyph { p in
      p.move(to: CGPoint(x: 12, y: 5)); p.addLine(to: CGPoint(x: 12, y: 19))
      p.move(to: CGPoint(x: 5, y: 12)); p.addLine(to: CGPoint(x: 19, y: 12))
  }
  .stroke(style: StrokeStyle(lineWidth: 2 * 20 / 24, lineCap: .square, lineJoin: .miter))
  .frame(width: 20, height: 20)
  .accessibilityHidden(true)
  ```

  The arcs, as centres for `addArc` (SwiftUI's y axis points down, as SVG's does, so pass
  `clockwise: false` for an arc that turns clockwise on screen):

  | Glyph | Arc |
  | --- | --- |
  | search | full circle, centre (10.5, 10.5), r 6 |
  | info | full circle, centre (12, 12), r 8 |
  | undo | centre (14, 14), r 5, from (14, 9) clockwise to (14, 19) |
  | refresh | centre (12, 13), r 6, from (18, 13) clockwise through the bottom to (12, 7) |
  | offline | three arcs, each clockwise: centre (7, 14) r 4 from (7, 18) to (6.53, 10.03); centre (12, 12.5) r 6 to (17.83, 11.1); centre (17, 14.5) r 3.5 to (17, 18) |

  The dots port as tiny lines: `h.01` is a 0.01pt line, and the square caps make it a 2×2
  square. Built with Xcode, the SVGs can instead go in the asset catalog as template images
  ("Preserve Vector Data"), but then the stroke no longer scales with the size you ask for.

## Do and don't

- **Do** name the control, not the glyph: `aria-label` on the button, `aria-hidden` on the span.
- **Do** put words beside status glyphs and beside delete.
- **Do** draw a new glyph on the same grid, live area, stroke and gaps, and check it at 20px on
  a 1x screen before it ships.
- **Don't** fill a glyph, tint it, or put it in a tinted circle.
- **Don't** use ↗ for an in-app link, or a chevron for a link that leaves.
- **Don't** repeat one glyph on every card in a grid.

## Known limits

- The `%23000` data URIs can't be edited as SVG files. The paths in this file are the source
  for any change.
- The 3×3 dots (more, today) sit on half units, so at 24px on a 1x screen their edges are soft.
  Moving them to whole units would push them off centre.
- The today rings, the decks stack and share keep 1-unit gaps, under the 2-unit rule; all read at
  20px on a 1x screen (checked in Chromium) but are the first to blur.
- Arcs port by hand (the table above); there is no SVG parser in SwiftUI.
- Checked in Chromium only, with forced-colours emulation. Not checked in Windows' real
  contrast themes, in Safari, or on a device.
