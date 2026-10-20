# Tag and Badge

Element 04 · gates 0–3 done (wireframe, states, colour) · page: `elements/tag.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Tag and Badge's own spec.

## Brief

*A status word on a thing; a count on a control.*

- **Tag:** static, never pressable. It doesn't act, so rule 3 makes it square, not a pill.
  Label type, one to two words. Variants: default, ink (emphasis), tone 1–6. Copy: Known, New,
  Due, Not yet. It replaced the wireframe kit's pill stand-in.
- **Badge:** a count pinned to a control, such as a tab or an icon button. At least 20px, ink
  fill, tabular figures, capped at "99+". The count lives in the control's accessible name
  ("Decks, 7 due"); the badge itself is `aria-hidden`.
- **Out of scope:** filter chips. Those are toggle buttons or a segmented control.

## House rules

- Neither one acts: square (`--radius-tile`, the role for small static shapes), no shadow, no
  hover, focus or pressed look, no `cursor`.
- Reads roles only. Inside a card both read `--card-ink` and `--card-bg`, so they invert on an
  ink card with no class.
- The badge is decoration of a name, never the name: `aria-hidden`, always.
- Badge lives in `tag.css` with the tag. Both are static status, and they share the rules.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Tag | `.tag` | `inline-flex`, `min-block-size: 24px`, 8px inline padding. `--type-label` (700, condensed, 13px, +0.08em, uppercase by CSS). `border: 2px solid currentColor`, `--radius-tile`. `white-space: nowrap`; `flex: none`, so it never squashes in a row. |
| Badge | `.badge` | `position: absolute`, 4px past the control's top-end corner. `min-inline-size` and `block-size` 20px (1.25rem), 4px inline padding. `--type-label` at normal width and no tracking (condensed figures are too thin at 13px), `tabular-nums`. Ink fill, paper figures. A 2px outline in the surface colour cuts it off the control's frame. `pointer-events: none`. |

## Variants

Shown live, with markup, in `elements/tag.html` (1.1–1.5).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Tag | `.tag` | Where a card stands. | No fill: the surface shows through. Frame and words in the surface's ink. |
| Ink | `.tag` + `data-tone="ink"` | The one status that must be seen first ("Due"). | The surface's ink and fill swap, so on an ink card it turns paper. Sparingly. |
| Tones | `.tag` + `data-tone="1"` … `"6"` | Rhythm across a list. | `--tone-bg` fill, `--tone-ink` words and frame. A tone never carries a status alone; the word does. |
| Badge | `.badge` | A count on an icon button, or after a text button's label. | Pinned to an icon button's corner; in a text button it sits after the label (button.css sets it `position: static`), or it would float off the end of the pill. |

The markup stays in sentence case ("Not yet"). The capitals come from `text-transform`, so a
screen reader reads words, not letters.

**Why square.** The kit's old stand-in was a round 1px pill. The tag is square and 2px,
because a tag doesn't act.

## States

Neither has states of its own. What changes:

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| On paper | none | | | Ink frame and words. |
| On a tone | inside a toned card | | | No fill: the tone shows through. |
| On ink | inside `data-tone="ink"` | | | Frame and words turn paper; an ink tag turns paper with ink words; a badge turns paper. |
| Badge count | its text | | | 1–2 figures in a 20px square; 3 ("99+") widens it. Zero: no badge, and no count in the name. |
| Badge on a pressed control | the control's state | | | The badge doesn't change; its 2px cut keeps it apart from a filled control. |
| Forced colours | `(forced-colors: active)` | | | Tags keep their frame in `CanvasText`; tone fills drop (they're rhythm). The ink tag and the badge opt out and paint `CanvasText` with `Canvas` text, so emphasis and count survive. |

## Accessibility

- A tag is text. It reads in place, after the thing it describes ("Hexagon, Shapes card 6,
  Not yet"). Don't make it the only label of anything.
- A tag is never focusable and never a link or button.
- The badge is `aria-hidden="true"`. The control's name carries the count: on an icon button,
  `aria-label="Decks, 7 due"`; on a text button, a visually hidden suffix after the label,
  `Decks<span class="sr-only">, 7 due</span>`, so the name still starts with the visible
  label (WCAG 2.5.3).
- Draw at most "99+"; put the real number in the name ("Due, 140 cards").
- Contrast: ink on paper, paper on ink, ink on every tone (at least 8.4 : 1 in light and 7.4 : 1
  in dark, see `STYLE.md`).
- Dark: the ink tag and the badge are light squares with dark words, the one place a tag is
  brighter than its card; the tones are dark greys, 1 still the quietest.

## Platforms

- **Installed PWA:** the home-screen icon badge is the system's, set with the Badging API
  (`navigator.setAppBadge`, wave 5). It shows the same number as the in-app badge.
- **Mac:** a sidebar row or a tab in system chrome uses the system badge. Ours is for controls
  we draw. A tag in a Mac list is the same square frame.
- **SwiftUI:** a tag is `Text(status)` with the label style
  (`.fontWidth(.condensed)`, `.textCase(.uppercase)`), `.padding(.horizontal, 8)`,
  `.frame(minHeight: 24)` and `.overlay(Rectangle().strokeBorder(lineWidth: 2))`; a tone is a
  `Tone` parameter for the fill. System lists and tab views take `.badge(_:)`; our own
  controls overlay a 20pt `Rectangle()` badge with `.accessibilityHidden(true)` and put the
  count in the control's `.accessibilityLabel(_:)`.

## Do and don't

- **Do** use the product's status words, one or two: Known, New, Due, Not yet.
- **Do** keep one ink tag per screen region, at most.
- **Don't** make a tag pressable, or round. A filter is a toggle button.
- **Don't** let a tone mean a status.
- **Don't** show a badge without the count in the control's name, or a badge at zero.

## Known limits

- A tag never wraps. In a very narrow row card at large text sizes the card stacks its parts,
  so the tag gets the full width.
- Badge placement assumes a 44px control. A larger control (a tab item) pins it the same way
  to its own corner; Tab bar (wave 3) decides where.
