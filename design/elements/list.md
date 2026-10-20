# List

Element 18 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/list.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
List's own spec.

## Brief

*Rows of things.*

- **Parts:** a row with a leading icon or tile (optional), a title, meta, and a trailing slot
  (a value, a chevron `ic--forward`, a Switch, a Tag).
- **Variants:** plain (rules between rows, edge to edge); inset (in a card-like frame,
  Panel-style); with section headers; a row as a link (the whole row is the target, like the
  card's list rows); a row with a switch (the settings row); a row with actions.
- **Swipe** to reveal actions is allowed only if a visible "More" (`ic--more`) button offers the
  same actions. Without script, the More button is all there is; the swipe is gate 4 or an app's
  own. *Gate 4 (wave 7) decided: not built; an app's own (States, Swipe to reveal).*
- **Relation to Card:** `.card__list` stays the card's; List is the full-width, screen-level
  version.

## House rules

- **A row is a rectangle: it holds.** What you act on inside it keeps its own shape: the More
  button is a circle, the switch a pill (rule 3).
- **A link row is one target and one tab stop.** The `<a>` is the row, as in the card's list
  rows, so a tap anywhere on it lands. Anything else you can press (the More button) sits
  *after* the link, never inside it.
- **Two line weights.** Rows are divided by 1px rules (`--bw-thin`); only the inset frame is 2px
  (`--bw`), because it contains.
- **No lift.** Rows touch, so a hard shadow would fall across the next one. Hover underlines the
  title; press fills the row with ink (`--fill`), as the card's list rows do.
- **The trail keeps to the end,** on its own line if it has to. A chevron means "goes
  somewhere", so only a link row gets one.
- **Swipe is not built, decided at gate 4.** It is an app's own; the More button is the action.
- Reads roles only. `:hover` only inside `@media (hover: hover)`.
- Motion (gate 4): a link row's fill eases; nothing else moves (Motion, below).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| List | `.list` | The block: a flex column, `min-inline-size: 0`, ink. Sets `--list-pad`, the rows' side padding: `--gutter` when plain, 16px when inset. Sections are more `.list` blocks, 24px apart (`.list + .list`). |
| Head | `.list__head` | Optional: an `h2`–`h4` naming the section. `--type-label`, uppercase, ink, padded by `--list-pad`, 8px above the rule. Inset, it becomes the Panel's bar: ink ground, paper label, `min-block-size: 44px`, antialiased. |
| Rows | `.list__rows` | A `<ul role="list">`. Plain, a 1px `--line` rule closes it top and bottom. Each `li` is a wrapping flex row (`justify-content: flex-end`), and `li + li` draws the 1px rule between rows. |
| Row | `.list__row` | A `<div>` (static) or the `<a>` (link). Flex, wraps, `align-items: center`, `gap: 4px 12px`, `min-block-size: 44px`, padding 8px by `--list-pad`. Ink on nothing; with `--fill: 1`, paper on ink. |
| Lead | `.list__tile` or `.ic` | Optional, first in the row. A 44px square tile (2px `--line` frame, `--radius-tile`, the tone's ground or `--tone-1`) or a 24px glyph. Never the same glyph on every row (rule 7). |
| Main | `.list__main` | A flex column, `flex: 1 1 7em`: the title and the meta under it. |
| Title | `.list__title` | `--type-body` at weight 500. Its underline (2px, 0.18em off) is the hover. Wraps. |
| Meta | `.list__meta` | `--type-meta`, `--ink-soft`, tabular figures. Wraps. |
| Trail | `.list__trail` | `--type-meta`, `--ink-soft`, tabular. A value, a `.tag`, and `ic--forward` in ink on a link row. `margin-inline-start: auto`, so it keeps to the end, also when it wraps onto its own line. |
| Actions | `.list__actions` | After the row, in the same `li`: a More button (Button, `.btn--quiet.btn--icon`, `ic--more`) and its Menu. Its own target; 8px from the edge at least, or lined up with a wider gutter. |

Markup, a link row with actions:

```html
<div class="list">
  <ul class="list__rows" role="list">
    <li>
      <a class="list__row" href="/decks/shapes">
        <span class="list__tile" data-tone="1" aria-hidden="true"></span>
        <span class="list__main">
          <span class="list__title">Shapes</span>
          <span class="list__meta">12 cards · 7 due</span>
        </span>
      </a>
      <div class="list__actions">
        <button class="btn btn--quiet btn--icon" type="button"
                popovertarget="shapes-menu" aria-label="More for Shapes">
          <span class="ic ic--more" aria-hidden="true"></span>
        </button>
        <div class="menu" id="shapes-menu" popover>…</div>
      </div>
    </li>
  </ul>
</div>
```

## Variants

Each is shown live, with its markup, in `elements/list.html` (2.1–2.6).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Plain | `.list` | Rows straight on the screen: a deck's numbers, search results. | Edge to edge: put it straight in a Frame's scroll region and it reaches over the region's side padding, its rows taking that padding so their text lines up with the content above. Anywhere else its rows keep the screen's `--gutter`. Rules close it top and bottom, so its edges read without colour. |
| Inset | `.list--inset` | A group that belongs together: a deck's settings. | A square 2px `--line` frame on `--paper`, inside the screen's gutter; 16px in the rows. Its rules are the frame's top and bottom. |
| With section headers | `.list__head` | A long screen in named parts: decks by what's due, settings by topic. | One `.list` per section, heading inside. Plain: a label over the rule. Inset: the Panel's bar. Real headings, in order. |
| Row as a link | `a.list__row` | Each row opens something: a deck, a setting's screen. | One target, one tab stop; its accessible name is everything in it, so the title goes first. Ends in `ic--forward`. |
| Settings row | `.switch` in a `.list__rows` item | A setting that takes effect at once, among others. | Switch's own markup, whole; the list only pads it (`--list-pad`) and rules it. Its label is the row and the target. |
| Row with actions | `.list__actions` | Things you also rename, copy or delete. | A More button after the row opens a Menu. The row keeps its link and drops the chevron. Swipe, if an app adds it, offers the same actions; the button stays. |

## Layout at large text sizes

Rows wrap rather than squeeze. Lead, main and trail share a line while the main part has 7em;
below that the trail drops to its own line, still at the end, and on a narrow phone at 200% text
the tile, the words and the trail stack. Beside a More button the row keeps 12em before the
button drops under it, at the end of the `li`. Checked at 320 and 390px at 100% and 200% text,
and at 1440px: no sideways scroll.

## States

Only a link row has states; a static row has none and no hand.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | No underline. |
| Hover | `a.list__row:hover`, only inside `@media (hover: hover)` | 0 | 0 | The title takes a 2px underline. No shadow: rows touch. |
| Focus | `:focus-visible` | 0 | 0 | The underline, and the 3px `--focus` ring inside the row (`outline-offset: -3px`): rows touch, and a plain list touches the screen's edge. |
| Pressed | `:active` | 0 | 1 | Ink ground, paper words; meta, trail and chevron follow. The row sets `--card-ink` and `--card-bg` to paper and ink, so a Tag or Badge inside inverts with it. |
| Actions open | the More button's menu is open | | | The button stays down (Menu draws it); the row is unchanged. |
| Forced colours | `(forced-colors: active)` | | | Press paints `Highlight` with `HighlightText` (glyphs and a tag's words and frame too). Rules, frame and ring are system colours already. The inset bar opts out: `CanvasText` ground, `Canvas` label. |
| Dark | the scheme | | | The inset head is ink, so a light band with dark words, and it drops its antialiasing (`--smooth-inverse`, `base.css`); a pressed row fills light the same way. |

`.is-hover`, `.is-focus` and `.is-active` on `a.list__row` force a state for the page and for
tests. They are not API. A settings row's states are Switch's; the More button's are Button's.

**Motion.** A link row's `--fill` eases: in over `--dur-press` as a press lands, out over
`--dur-hover`, with `--ease-out`. The underline and the ring are instant; a Tag inside swaps at
once. Under reduced motion the fill fades over `--dur-fade`.

**Swipe to reveal, not built (decided at gate 4).** The More button is the accessible route and
the only one we draw. A swipe needs a device to tune (the distance, the speed that commits it,
how it fights the page's own scroll and the system's back gesture), and getting it wrong costs
more than a button: an accidental Delete. An app may add one on top, offering exactly the More
button's actions, and the button stays.

## Accessibility

- `<ul role="list">` keeps list semantics in Safari after `list-style: none`; screen readers
  say how many rows.
- A link row's name is its contents in order: "Shapes 12 cards · 5 known 7 due". Keep the title
  first and the meta short. Decorative leads are `aria-hidden`.
- The More button's name says whose actions it holds ("More for Shapes"); the browser exposes
  it as expanded while its menu is open.
- Tab order per row: the link, then its More button. One stop for a link row without actions.
- Section heads are real headings, in order, so the screen can be skimmed by heading.
- Every target is at least 44px: rows, the More button, the switch row (measured at 100% and
  200% text).

## Platforms

- **Installed PWA:** a plain list runs to both edges; the frame (wave 3, Frame) keeps clear of
  the notch, never the list. Press shows on iOS with the shell's `touchstart` listener. A swipe
  to reveal actions is an app's own, if it adds one, and the More button stays.
- **Mac:** a collection you select from is a `List` or `Table`, so ⌘ and ⇧ selection, arrows and
  type-select come free. The More menu's actions are also a context menu and menu bar items with
  shortcuts (`STYLE.md` §4). In a WebKit shell, turn on `tabFocusesLinks` or rows are skipped by
  Tab.
- **SwiftUI:** `List` with `.listStyle(.plain)` (plain) or `.listStyle(.insetGrouped)` on iOS (inset),
  `.listRowSeparatorTint(.line)`, and our row as a custom view (`HStack`: the tile, a `VStack` of
  title and meta, a `Spacer()`, the trail). A link row is a `NavigationLink`; actions are
  `.swipeActions { … }` *and* a `Menu` with `Image(systemName: "ellipsis")` labelled "More for Shapes";
  a section is `Section` with a `Text` header in the label style. For full control of the rules,
  a `LazyVStack` with 1pt `Rectangle()` dividers.

## Do and don't

- **Do** make the whole row the link when it goes somewhere, title first.
- **Do** put every action a row has behind a visible More button.
- **Don't** make swipe the only way to an action.
- **Don't** put a chevron on a row that doesn't go anywhere, or a glyph on every row.
- **Don't** nest a button or a link inside a link row.
- **Don't** use `.card__list` on a screen, or List inside a card: each has its own.

## Known limits

- The row-with-actions spacing (`.list__row:has(+ .list__actions)`) needs `:has()`; without it
  the row keeps its full end padding, which only costs space.
- Swipe is not built (decided at gate 4: Motion). Selection (a current row in a split view) is not part of this
  element: a list of places on a wide screen is the Sidebar.
- Checked in Chromium only (touch, forced colours, 200% text), not on an iPhone, in Safari or in
  Firefox.
