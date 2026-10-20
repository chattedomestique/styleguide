# Card

Element 01 · gates 0–3 done (wireframe, states, colour) · page: `elements/card.html`

The rules, tokens and platforms that every element follows are in `../STYLE.md`. This file is
the Card's own spec.

A card holds one idea. It is a frame with slots; what goes in a slot is another element's
business. The slots `.card__ctl` and `.card__action` are where the Button element will land.

## House rules

- Reads roles only. No colour literals.
- A hard shadow means "you can press this". The lift is that shadow alone: the card never
  moves.
- **Never put `cqi` on `.card` itself.** A card is a container, but a container's own
  `cqi` resolves against *its parent*. Sizes that use `cqi` live on the parts, where the
  container is the card.
- **A card needs a width from its parent** (a grid cell, a block). `container-type:
  inline-size` means it has no intrinsic width, so it will collapse inside a shrink-wrapping
  flex row.
- States change instantly (gate 4 owns transitions).

## Anatomy

Nine parts, all optional except the frame. A card is whichever of them it needs.

| # | Part | Class | Spec |
| --- | --- | --- | --- |
| 1 | Frame | `.card` | `display: flex; flex-direction: column`; `border: 2px solid var(--card-line)`; `border-radius: var(--card-radius)`; `overflow: clip`; `container: card / inline-size`. |
| 2 | Bar | `.card__bar` | The frame made thicker. `min-block-size: 44px`; ink fill, paper text; label left, control right. Wraps when the text grows; the control stays at the end. Flips to paper-on-ink for `data-tone="ink"`. |
| | Label | `.card__label` | `--type-label`, uppercase, 1–4 words. A `<p>` or `<span>`, not a heading, when the card has a title. |
| | Control | `.card__ctl` | 44×44 hit area around a 20×20 box (`2px currentColor`, `--radius-ctl`); glyph 12px. The box fills while pressed. |
| 3 | Media | `.card__media` | `aspect-ratio: var(--ratio, 4 / 3)`; edge to edge; closed by a 2px rule; `img`/`video` are `object-fit: cover`; fill is the element's tone or `--tone-1`. |
| 4 | Body | `.card__body` | `padding: clamp(1rem, 5cqi, 1.5rem)`; flex column, `gap: 8px`; grows to fill. |
| | Head | `.card__head` | Same padding as the body. The study card's top strip. |
| 5 | Eyebrow | `.card__eyebrow` | `--type-meta`, soft ink. What kind of thing this is. |
| 6 | Title | `.card__title` | `--type-title` at `clamp(1.375rem, 8cqi, 2rem)` (22–32px); 20px (`--text-lg`) in a row or ghost card; balanced; breaks long words. |
| 7 | Text | `.card__text` | `--type-body`, 40ch max, pretty-wrapped. |
| | Meta | `.card__meta` | `--type-meta`, tabular, soft ink. |
| | Figure | `.card__figure` | `--type-figure` at `clamp(3rem, 27cqi, 6.5rem)`; tabular. A `<small>` inside is 0.42em, weight 500, soft ink. |
| 8 | Foot | `.card__foot` | `min-block-size: 44px`; `padding: 8px var(--card-pad)`; 1px rule above; `margin-block-start: auto`, so cards in a row end on one line. Its links and buttons are 44px tall; negative margins keep the foot at 44px. |
| 9 | Action | `.card__action` | 44px circle, `2px var(--card-ink)`. A `<button>` with an `aria-label`, except in a ghost, where the whole card is the control and the circle is `aria-hidden`. Fills with `--accent` when `--fill` is 1. |

Helpers: `.card__row` (flex, space-between, top-aligned, wraps), `.card__group` (flex column,
4px gap), `.card__list` (ruled rows, 44px each, 1px rules). In a list the whole row is the
link, with the padding on the link, not the `li`:
`<li><a href="…"><span>Shapes</span><span>12</span></a></li>`.

**The bar in dark** stays ink, so on a dark page it is a light strip. Wave 6 compared it, on the
panel specimens at 390 and 1440, with a `--tone-6` bar and with a paper bar closed by a rule, and
kept ink. The bar is the frame made thicker, and the frame is ink in both schemes. A grey bar
reads as a fill instead: a third surface that only dark would have, and the same grey as a
tone 6 card. A paper bar loses the panel altogether. Kept ink, the plain panel and the ink panel
still invert each other, as in light. It is the loudest thing on a dark card, but it is 44px, one
per panel, and dark ink stops short of white. Its smoothing follows the fill: antialiased where
its words are light (in light; in dark, on an ink card), not where they are dark (`--smooth`,
`--smooth-inverse` in `base.css`).

## Variants

Eight. Class names are the API. Each is shown live, with its markup, in `elements/card.html`
under Variants (2.1–2.8).

| Variant | Modifier / recipe | Use | Notes |
| --- | --- | --- | --- |
| Plain | `.card` + `.card__body` (+ `.card__foot`) | The default. | |
| Panel | `.card__bar` (+ `.card__list`) | A titled card that folds away: lists, settings. | `data-tone="ink"` flips the bar to paper. |
| Media | `.card__media` | Picture first. | `--ratio` overrides 4 / 3. |
| Stat | recipe: eyebrow, `.card__figure`, optional meter, meta; `.card--square` in a grid | One number. | `.card--square` works on any card: `aspect-ratio: 1 / 1`, and the body spaces its first and last children apart. |
| Row | `.card--row` + `.card__tile`, `.card__main`, `.card__trail` | A thing in a list. | Below 18rem the trail drops under the title (children move between grid cells; the card can't re-template itself). |
| Link | `.card--link` + `.card__link` in the title | The whole card goes somewhere. | Eyebrow at the top, title group at the bottom. See below. |
| Ghost | `.card--ghost` (the card is the `<a>` or `<button>`) | An empty slot that asks to be filled. | Dashed; firms up on hover and focus; its circle fills on press. |
| Study | `.card--study` + `.card__head`, `.card__stage`, `.card__answer` | The flashcard. 5 / 7. | Static faces; the flip is gate 4. Fits a phone: `max-inline-size: min(22rem, (100svh - var(--chrome, 0px)) * 5 / 7)`, where Frame publishes `--chrome` (outside a Frame, set it). An 8rem floor (`min-inline-size: min(100%, 8rem)`) keeps it wide enough for its answer; below that the stage scrolls. |

**Link card.** One anchor, inside the title; its `::after` is stretched over the whole card
(`inset: -2px`, so it covers the border too), so there is exactly one tab stop, one
accessible name, and the whole card is the target. No glyph or circle says "go": the card is
the target, and the title's underline on hover and focus is the cue. The card wears the focus
ring, not the anchor (`:has(.card__link:focus-visible)`; the anchor keeps its own ring where
`:has` is unsupported). Anything else clickable inside the card must sit above the link
(`position: relative; z-index: 1`).

## States

Two registered numbers drive the interaction: `--lift` (0 flat, 1 raised) and `--fill`
(0 outline, 1 filled). Every state just sets them, so hover, focus and pressed share one
definition, and gate 4 can animate both with a single `transition`. Lift is drawn by
`--shadow-lift`, a hard shadow of `calc(var(--lift) * var(--bw) * 2)` (4px) down and right in
`--card-line`, behind `--shadow-select`.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | Flat. No shadow. |
| Hover | `:hover`, only inside `@media (hover: hover)` | 1 | 1 | `4px 4px 0` hard shadow; the card does not move. `z-index: 1`; title underlines; a ghost goes solid. |
| Focus | `.card--link:has(.card__link:focus-visible)`, or `:focus-visible` on a ghost | 1 | 1 | `3px solid var(--focus)`, offset 3px, plus the hover look, so keyboard and pointer match. |
| Pressed | `:active` | 0 | 1 | A lifted card (link or ghost) goes back onto the surface; the fill stays. |
| Selected | `aria-selected="true"` on an option card, or `aria-current` on its `.card__link` | | | `--shadow-select: 0 0 0 2px var(--card-line)`: a ring that doubles the frame, so nothing shifts. |
| Disabled | `.card--disabled` (+ `aria-disabled="true"` on an option card) | | | Dashed frame, `--ink-faint`, hatch (from `wire.css`), `pointer-events: none`. No `href`. Says why in `.card__meta`. |
| Forced colours | `(forced-colors: active)` | | | Shadows and fills vanish there, so hover and focus get a 4px `Highlight` outline, selected a 4px border, and disabled is drawn in `GrayText`. |

- **Hover only where hover exists.** Every `:hover` rule sits inside `@media (hover: hover)`,
  so a tap never leaves a control stuck in its hover look. `.is-hover` and `:focus-visible`
  stay outside it.
- **Every control has a pressed look.** The action and the ghost fill; the bar control's box
  fills; list rows and foot links swap ink and paper. That replaces the browser's tap flash,
  which is translucent and off-palette, so `base.css` turns it off
  (`-webkit-tap-highlight-color: transparent`).
- **Selected, in full:** `.card:is([aria-selected="true"], .is-selected), .card:has(.card__link[aria-current]:not([aria-current="false"]))`.
- **The hand cursor is for links only**, as on the Mac. Buttons, the bar control and the
  action keep the arrow. No `not-allowed` cursor: a disabled card takes no pointer events.

The `.is-hover`, `.is-focus`, `.is-active` and `.is-selected` classes force a state for
documentation and tests. They are not API.

## Collections

A grid of cards is a list, so it announces "list, 4 items":
`<ul class="card-grid" role="list"><li><article class="card">…</article></li>…</ul>`.
Each `li` is a grid cell that stretches its card.

A collection is **navigable or selectable, never both.**

- **Navigable:** link cards, one tab stop each. The current one carries `aria-current` on
  its `<a class="card__link">`, never on the `<article>`.
- **Selectable:** a `role="listbox"` whose cards are `role="option"` with `aria-selected`.
  One tab stop for the whole list (roving `tabindex`): arrows and Home/End move, Space
  selects, ⌘-click and ⇧-click extend. An option's children are presentational, so an option
  card holds no link. Native: `List(selection:)`.
- **Drag only where it means something.** If cards don't reorder, set `draggable="false"` on
  `.card__link`, or a click-drag picks up a URL. If they do, drag gets a keyboard path and
  Undo.

## Layout

| Class | Does |
| --- | --- |
| `.card-grid` | `--card-min: 16rem`, set on the grid itself; `grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--card-min)), 1fr))`; `gap: var(--gutter)`. Places cards; never styles them. |
| `.card-grid--tiled` | `gap: 0`. Negative start margins on each item (`> :is(.card, li)`) overlap each frame onto its neighbour's, so two frames read as one 2px line, and a short last row still closes. |

## Responsive behaviour

Cards answer to their own width, not the window:

- Padding: `clamp(1rem, 5cqi, 1.5rem)`.
- Title: `clamp(1.375rem, 8cqi, 2rem)`. Figure: `clamp(3rem, 27cqi, 6.5rem)`. Answer:
  `min(17cqi, 3.75rem)`, with no rem floor: it follows the card's width, not the text size, so
  at large text sizes a long word stays whole where it can. Where it can't, `hyphens: auto`
  breaks it at a syllable ("Hexa-gon"), so the page needs its `lang`.
- Row: `@container card (max-width: 18rem)` moves the trail to row 2, column 2, and below
  `12em` (em, so it grows with the text: a phone at large text sizes) the tile goes on top and the title takes the full width.
- The bar, `.card__row`, the foot and the ghost wrap (`flex-wrap: wrap`) when text grows.
- Holds from 320px up with no horizontal scroll. At 320px with 200% text, no card clips a
  control or a title.

## Accessibility

- One tab stop per link card. Its accessible name is the title text.
- Every touch target is at least 44px: the action circle, the bar control, list rows, and the
  links and buttons in the foot.
- The focus ring is always visible: outside the frame on the card itself; inset on the bar
  and on list rows, in the ink of the surface it lands on.
- Contrast is at least 8.4 : 1 for ink on any tone (7.4 : 1 in dark, where the tones are dark
  greys) and at least 4.5 : 1 for soft ink in both. Under `prefers-contrast: more`, soft ink
  becomes ink.
- A card title sits one heading level below its section's heading: an `h2` section takes
  `h3` titles. One heading per card; the bar label is the heading only when there is no
  `.card__title`.
- Meters use `role="meter"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and an
  `aria-valuetext` in the card's own words ("5 of 12 learned").
- Decorative icons are `aria-hidden="true"`. A control whose only content is an icon gets an
  `aria-label`.
- Reset lists keep `role="list"` so Safari keeps the semantics that `list-style: none`
  would drop.
- A disabled card is not a link (no `href`) and says why in visible text: "Unlocks after
  Colours".
- Every gesture (swipe, long-press) also has a visible button. Hints name the action, not the
  input: "Turn over", not "Tap to flip".
- Forced-colours mode is handled (see States).

## Do and don't

- **Do** give each card one idea and one place to go.
- **Do** use tones for rhythm across a grid, never to carry meaning. Colour is not state.
- **Do** let the grid place cards and the card style itself.
- **Don't** nest cards, or put two competing actions in one link card.
- **Don't** add a shadow at rest, a stripe down one edge, or a gradient.
- **Don't** fake "disabled" with opacity. Use the state.
- **Don't** centre-align body text. Titles and answers may centre; paragraphs don't.
- **Don't** pad `.card` itself. Padding goes on the parts.

## Known limits

- The stretched link reaches over the border only through `overflow-clip-margin`, because
  the card clips at its padding box. Safari ignores it, leaving a 2px band at the very edge
  of a link card where a click does nothing.
- Text inside a link card can't be selected by dragging, because the stretched link sits on top.
- The study card has static faces only. The flip is gate 4.
- Needs a 2024-era browser: container queries, `:has()`, `@property`, `color-mix()`, cascade
  layers. Chrome/Edge 114+, Safari 16.4+, Firefox 128+. `text-wrap: balance | pretty` and
  `overflow-clip-margin` degrade gracefully.
