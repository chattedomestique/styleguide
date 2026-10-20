# Frame

Element 14 · v1.0 · gates 0–5 done (brief, wireframe, states, colour, motion, freeze) · page: `elements/frame.html`

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
- **The keyboard takes the Tab bar's room.** While the on-screen keyboard is up, the Tab bar
  hides so the field has the room; nothing else hides, and without script nothing does
  (Keyboard, below).
- **The frame doesn't move.** Bars don't hide on scroll, a large title doesn't collapse, nothing
  slides. Two motions lean on it (gate 4): a top bar with a large heading fades its title in as the
  heading scrolls under it, on a view timeline whose scroller is the scroll region (the frame
  carries its `timeline-scope`, from `topbar.css`); and an app's view transitions name the tab bar
  and the sidebar, so they stay put while the screen crossfades (the starter's `pwa/app.css`,
  `elements/pwa.md`). Frame itself adds no motion and needs no reduced-motion rule.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Frame | `.frame` | Grid: one column, rows `auto minmax(0, 1fr) auto`. `block-size: 100dvh`, with `min-block-size` and `max-block-size` at 100%: when the parent has a set height (a device frame on the sheet, a pane, a test box) the percentages resolve and pin the frame to it; otherwise they don't, and it is the dynamic viewport. `--canvas` behind. A container named `frame`. |
| Top slot | `.frame__top` | Row 1. `position: relative; z-index: 1`, so a ring or a badge in the bar paints over the scroll region's edge. The Top bar wears it. |
| Status band | `.frame::before` | Only when there's no `.frame__top`: an empty row-1 item `--safe-top` tall, in the content column. It doesn't scroll, so nothing slides under the clock. 0px on a desktop. |
| Scroll region | `.frame__scroll` | Row 2, the app's `<main>`. A one-column grid, children 32px apart (`--space-6`), `align-content: start`. Padding: 24px top, 48px bottom; inline `max(var(--gutter), var(--safe-left))` and its mirror, or wider to centre a capped column (`--frame-column`). `overflow-y: auto; overscroll-behavior: contain; scroll-padding-block: 16px 48px`. A scroll region that may hold nothing focusable takes `tabindex="0"` and `aria-labelledby` pointing at the screen's heading, so the keyboard can scroll it everywhere: Chromium makes such a region a tab stop by itself, Safari doesn't. An app's `<main>` does the same; the specimens on this page, inside the page's own `<main>`, add `role="region"`. Its ring is inset (`outline-offset: -3px`). With no bottom slot, its bottom padding adds `--safe-bottom`. |
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
(`anchor-size()` only sizes absolutely positioned boxes, and isn't in Firefox). The script,
keyboard included, is about 70 lines, comments included.

**Keyboard.** The same script puts `data-keyboard` on the frame that holds the focused field while
the on-screen keyboard is up, and `frame.css` hides the Tab bar under it:

    .frame[data-keyboard] > .frame__bottom.tabbar { display: none; }

No browser says the keyboard is up, but each shows it as lost height: iOS shrinks the visual
viewport over the page; Android Chrome, with `interactive-widget=resizes-content` in the viewport
meta, shrinks the page itself. So "up" is: a field that brings up the keyboard has focus (an
`input` of type text, search, email, url, tel, password or number, a `textarea`, or
`contenteditable`; not read-only, disabled or `inputmode="none"`), and the viewport
(`visualViewport.height × scale`, else `innerHeight`) is more than 150px shorter than the tallest
it has been at the current width. The width is the key, so a rotation never counts; the scale
means a pinch zoom doesn't either. It's checked on focus moving in or out and on every resize;
the bar is back on blur or when the height returns. A focused task's action row stays: it holds
what the typing is for. The scroll padding needs nothing more: where the page shrinks, the region
ends at the keyboard and a field scrolled into view stops 48px short of it.
`navigator.virtualKeyboard` isn't used: its geometry only arrives with `overlaysContent` on,
which lays the keyboard over the page, the opposite of `resizes-content`. The patterns page
(`elements/pwa.md`, Keyboard) has the measurements.

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
| Keyboard up | `data-keyboard`, set by `frame.js`: a text field focused and the viewport 150px or more shorter | The Tab bar hides; the region gets its room, and `--chrome` is measured again. Back on blur, or when the height returns. Without script, nothing changes. |
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

**Right to left.** The frame mirrors, so the sidebar is on the right. A side safe area is an edge
of the screen, not of the line: the bars pad `--safe-left` and `--safe-right` physically (each
declaration opted out of check 10, with the reason), the scroll region's `--frame-pad-start` reads
the right one under `:dir(rtl)`, and on a wide frame the sidebar zeroes whichever one it covers.

## Platforms

- **Installed PWA:** the viewport meta needs `viewport-fit=cover`, or every safe area is 0. The
  frame is the one thing in `dvh` (§4). Standalone has no browser back, so every screen past the
  root has a top bar with a back link. The on-screen keyboard: the viewport meta adds
  `interactive-widget=resizes-content`, so on Android the frame ends at the keyboard and the
  scroll padding keeps the field above it; the Tab bar hides while the keyboard is up (Keyboard,
  above). On iOS the keyboard lies over the page and Safari pans to the field. Both need a device
  to confirm. Any orientation: the bars and the region pad by the side safe areas when a phone is
  on its side, and a landscape phone at large text has little room under its bars, so the content
  scrolls (`elements/pwa.md`, Orientation and tablets).
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
- **Do** load `dist/flashcards.js` wherever a screen reads `--chrome`, or should lose its Tab bar
  to the keyboard.
- **Do** add `interactive-widget=resizes-content` to the viewport meta.
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
- At 200% text on an 844-point phone the bars take a lot: on `screens.html`'s Study screen,
  514px of 840 (658px with the scroll region's padding), so the study card no longer fits and
  the stage scrolls. The bars grow
  because their text must stay readable (see `tabbar.md`). On a landscape or small phone the
  trade-off stands: the content scrolls, the bars never do (`elements/pwa.md`, Orientation and
  tablets).
- The keyboard is seen only as lost height, emulated in Chromium and not yet checked on a device.
  On iOS the frame keeps its full height under the keyboard, so the hidden bar was under it anyway
  and a field low on a long form relies on Safari's panning; sizing the frame to
  `visualViewport.height` while the keyboard is up would fix that, and needs a device to prove.
  Rotating with the keyboard already up takes the new width's first height as its full height, so
  the bar stays until the keyboard goes down and comes back.
