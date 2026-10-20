# Frame

Element 14 · gates 0–2 done (wireframe, states) · page: `elements/frame.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Frame's own spec.

## Brief

*The app shell: bars, the scroll region, safe areas.*

- **Parts:** `.frame`, `.frame__top`, `.frame__scroll`, `.frame__bottom`, from what
  `screens.css`'s old app layout learned: grid rows; `block-size: 100dvh`; with no top bar the frame
  still keeps clear of the status bar; `overscroll-behavior: contain`; scroll padding for focus
  rings and the on-screen keyboard; `safe center` for a centred stage.
- **Publishes `--chrome`,** the bars' real height, so the study card stops guessing: measured,
  not estimated; CSS-only if possible, a tiny `frame.js` with a `ResizeObserver` if not.
- **Variants:** phone (top bar + scroll + tab bar), root screen (scroll + tab bar), focused task
  (top bar + scroll + action row), wide (sidebar + content column, at most `--measure`-ish wide
  for reading screens).
- **Also:** re-points `--gutter` to the frame's own width, so a pane gets the right gutter.

## House rules

- **The slots only place.** A bar wears the slot class itself (`<header class="frame__top
  topbar">`, `<nav class="frame__bottom tabbar">`) and pads its own safe-area inset. The frame
  pads only the edges no bar covers: the status bar on a root screen, the home indicator when
  there's no bottom bar, the sides of the scroll region. Content never reads `--safe-top` and
  its kin.
- **One scroller.** The scroll region scrolls; the page never does. So a phone browser's own
  bars never collapse, `dvh` doesn't jump, and `overscroll-behavior: contain` keeps a fling
  from scrolling anything behind.
- **Edge to edge.** Bars are paper with a 2px rule against the content, which is clipped at the
  rule. Nothing floats over content, so nothing needs blur or a shadow to separate it (§7).
- **The frame is a container** (`container: frame / inline-size`). It re-points `--gutter` to
  `clamp(1rem, 0.6rem + 1.6cqi, 1.75rem)`, the same formula as the root's with `cqi` for `vw`,
  so wherever it's used inside, the gutter follows the frame's width, not the window's.
- **No motion.** Bars don't hide on scroll, a large title doesn't collapse, nothing slides
  (gate 4).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Frame | `.frame` | Grid: one column, rows `auto minmax(0, 1fr) auto`. `block-size: 100dvh`, with `min-block-size` and `max-block-size` at 100%: when the parent has a set height (a device frame on the sheet, a pane, a test box) the percentages resolve and pin the frame to it; otherwise they don't, and it is the dynamic viewport. `--canvas` behind. A container named `frame`. |
| Top slot | `.frame__top` | Row 1. `position: relative; z-index: 1`, so a ring or a badge in the bar paints over the scroll region's edge. The Top bar wears it. |
| Status band | `.frame::before` | Only when there's no `.frame__top`: an empty row-1 item `--safe-top` tall, in the content column. It doesn't scroll, so nothing slides under the clock. 0px on a desktop. |
| Scroll region | `.frame__scroll` | Row 2, the app's `<main>`. A one-column grid, children 32px apart (`--space-6`), `align-content: start`. Padding: 24px top, 48px bottom; inline `max(var(--gutter), var(--safe-left))` and its mirror, or wider to centre a capped column (`--frame-column`). `overflow-y: auto; overscroll-behavior: contain; scroll-padding-block: 16px 48px`. A browser may make it a tab stop when nothing inside is focusable: its ring is inset (`outline-offset: -3px`). With no bottom slot, its bottom padding adds `--safe-bottom`. |
| Bottom slot | `.frame__bottom` | Row 3, same stacking as the top. The Tab bar wears it; in a focused task it holds the action row and the frame pads it (below). |
| Side slot | `.frame__side` | Wide only: column 1, spanning every row. The Sidebar wears it. |

**`--chrome`.** `js/components/frame.js` (bundled into `dist/flashcards.js`) watches every
`.frame` and its direct children with one `ResizeObserver` and writes, in px, on the frame:

    --chrome = the frame's height − the scroll region's content box

That is the bars (with their safe areas) and the scroll region's own block padding: everything
that isn't room for content. It's re-measured whenever anything changes size (text size, a bar
wrapping, a rotation, a hidden tab bar). The study card's `max-inline-size` reads it
(`(100svh - var(--chrome)) * 5 / 7`), so the card is exactly the room left. Measured on
`screens.html`: 277px on the study screen at 100% text (top bar 109, action row 96, padding
72), leaving 563px of room for a 493px card; 515px at 150%, where the card is exactly the room.

**Why script.** CSS can measure the room, by making the scroll region a size container
(`100cqb`), but then it is the query container for everything inside (the device frames' own
`cqb` re-pointing breaks) and it gains layout containment, so `position: fixed` inside scrolls
with it. And CSS has no way to put a content-sized bar's height into a property
(`anchor-size()` only sizes absolutely positioned boxes, and isn't in Firefox). The script is
under 50 lines, comments included.

**`--frame-column`.** A hook, unset by default (the content fills the frame). Set it on the
scroll region, or anything above it, to cap the content column and centre it: `var(--measure)`
for a reading screen. The scroll region's inline padding becomes
`max(var(--gutter), (100% - var(--frame-column)) / 2)`.

## Variants

Each is shown live, with its markup, in `elements/frame.html` under Variants (2.1–2.4).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Phone | `.frame` with all three slots | A screen past the root. | Top bar, scroll region, Tab bar. |
| Root screen | `.frame` without `.frame__top` | A place at the root, with no way back. | The status band keeps the heading clear of the clock; the heading is a `.t-heading` in the content. |
| Focused task | `.frame--task` | One thing to do: studying a deck. | The scroll region centres its content with `align-content: safe center` (when it's taller than the room it starts at the top, where it can be scrolled to). The bottom slot is the frame's own bar: paper, a 2px rule, padding 16px and `max(16px, var(--safe-bottom))`, inline to the gutter or safe area. It holds a `.btn-row`. |
| Wide | `.frame--wide` | A tablet or a desktop browser. | Columns `auto minmax(0, 1fr)`: `.frame__side` in the first, spanning every row; top, scroll and bottom in the second. Under `45rem` of frame (a container query in `rem`, so large text folds it sooner) the side slot is `display: none` and the bottom slot (a Tab bar with the same links) shows; from 45rem the bottom slot is hidden. While the sidebar shows, the content column's `--safe-left` is 0 (the sidebar owns that edge) and the sidebar's `--safe-right` is 0. |

## States

A frame doesn't press, lift or fill. Its states are about room.

| State | Trigger | Also |
| --- | --- | --- |
| Measured | `frame.js` has run | `--chrome` is set in px on `.frame`. The page's States section prints it live. |
| No script | `frame.js` absent | `--chrome` is unset; the study card falls back to `100svh` and the stage scrolls a little (`safe center` keeps its top in view). Nothing else reads it. |
| Focus at an edge | Tab moves focus into the scroll region | The browser scrolls the focused element into view, stopping 16px short of the top bar and 48px short of the bottom one (`scroll-padding-block`), so its ring shows. Bars sit above the region (`z-index: 1`); their own rings are never cut. |
| Large text | Text at 150–200% | Bars grow taller, never wider (Top bar puts its title on its own row; Tab bar wraps an item to a second row). `--chrome` is measured again, the card shrinks to fit. |
| Narrow | Frame under 45rem, wide variant | Sidebar folded away, Tab bar shown. |
| Keyboard up | A text field focused on a touch screen | The Tab bar hides (`tabbar.md`); the frame's room grows by its height. |
| Forced colours | `(forced-colors: active)` | The bars' rules are system `CanvasText` (each bar sets its own). The frame draws nothing that needs a fill. |

## Accessibility

- Order in the DOM is the order on screen and the order Tab takes: an app's skip link first
  (targeting the scroll region, an `id` and `tabindex="-1"` on its `<main>`), then the top bar,
  the content, the bottom bar. On a wide frame the sidebar comes first, as it sits first.
- The scroll region is the `<main>` landmark; the top bar is a `<header>` and the tab bar a
  `<nav>` labelled "Places". On the sheet's pages the frames are inside the page's own `<main>`,
  so their scroll regions are `<div>`s.
- Scroll padding keeps a focused thing clear of the bars by its ring and more, and the bars sit
  above the region, so no bar ever covers a ring. A tall link card is the exception (Known
  limits).
- Nothing in the frame is sized in `vw` or `vh` but the frame itself; text follows the reader's
  size, and the bars grow with it.

## Platforms

- **Installed PWA:** the viewport meta needs `viewport-fit=cover`, or every safe area is 0. The
  frame is the one thing in `dvh` (§4). Standalone has no browser back, so every screen past the
  root has a top bar with a back link. The on-screen keyboard: the Tab bar hides while a field
  has focus; keeping the focused field above the keyboard with `interactive-widget` and
  `visualViewport` is wave 5's. A landscape phone at large text has little room left under its
  bars; orientation is wave 5's too.
- **Mac:** the toolbar and sidebar are system chrome (§4). In a web shell the window's content is
  a frame with no bars: just the scroll region (`screens.html` shows it). Resizing the window
  resizes the frame and its gutter; no text changes size.
- **SwiftUI:** the frame is the scene's root. Phone and root screen: a `TabView` of
  `NavigationStack`s; the top bar is the navigation bar (`.navigationTitle(_:)`, `.toolbar { }`).
  Focused task: a `NavigationStack` with `.safeAreaInset(edge: .bottom) { actionRow }`, which is
  also how the card learns its room (`containerRelativeFrame(_:)` on the card). Wide:
  `NavigationSplitView`. The system owns safe areas; `--chrome` has no native twin.

## Do and don't

- **Do** use one frame per screen, first in `<body>` after the skip link, with the scroll region
  as `<main>`.
- **Do** load `dist/flashcards.js` wherever a screen reads `--chrome`.
- **Do** set `--frame-column: var(--measure)` on a reading screen in a wide frame.
- **Don't** let the page scroll behind the frame, or put a second scroller inside it unless it's
  a pane.
- **Don't** read `--safe-top`, `--safe-bottom` or their kin in content; the frame and the bars
  have already taken them.
- **Don't** float a bar over content, or make it translucent.
- **Don't** use `position: fixed` inside the frame for overlays; dialogs, sheets and menus go in
  the top layer (`<dialog>`, `popover`).

## Known limits

- `--chrome` needs script. Without it the study card is sized to the whole viewport and the stage
  scrolls.
- The study card subtracts `--chrome` from `100svh`, which assumes the frame is the viewport. In a
  frame with a set height (a pane, a test box) the card is too big unless something re-points
  `svh`, as the sheet's `.sg-phone` does with `cqb`. A card that read the frame's own height
  would need Card to change.
- Tab scrolls a card's link into view, not the card that wears the ring, and Chrome centres it.
  A link card taller than about half the region (a deck tile at 200% text, or any tile in a short
  frame) loses its top edge. Measured: nothing is cut on `screens.html` at 100%; at 200% the
  Today tiles lose 24–102px. Scroll padding can't reach it; Card would have to make the link the
  box that's scrolled to.
- At 200% text on an 844-point phone the bars take a lot: on `screens.html` 497px of 840 on Today
  and 658px on Study, where the study card no longer fits and the stage scrolls. The bars grow
  because their text must stay readable (see `tabbar.md`); the trade-off for landscape and small
  phones is wave 5's.
- `--safe-left` and `--safe-right` are physical. In a right-to-left wide frame the sidebar is on
  the right, and the frame zeroes the wrong one.
