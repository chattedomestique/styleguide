# Sheet

Element 23 · v1.0 · gates 0–5 done (brief, wireframe, states, colour, motion, freeze) · page: `elements/sheet.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Sheet's own spec.

## Brief

*A task on top of a screen.*

- **Variants:**
  - *bottom sheet* on a phone: full width, up to about 90dvh, a visible close button (never
    drag-only), the top bar's layout inside;
  - *side sheet* on a wide screen;
  - *action sheet*: the phone's version of Menu.
- **Notes:**
  - Modal (`showModal`, `--scrim`). The bottom safe area is the sheet's.
  - Drag to dismiss and detents wait for gate 4; until then the close button is the way out.
    (Gate 4: a bottom sheet drags down to close, the close button stays, and there are no
    detents: Motion, below.)
  - Copy: Add a card (a form), Deck options (an action sheet).
- **Wave 4's shared notes:** as Dialog's (native, focus in and back, Escape, inert page, the
  scrim, its frame under forced colours; motion from wave 7, below).

## House rules

- **A sheet is a Dialog in another shape.** The same native `<dialog>` and `showModal()`, the
  same opener (`commandfor` + `command="show-modal"`, with Dialog's `js/components/dialog.js` for
  browsers without it and for focus return), the same `<form method="dialog">` closing with a
  `returnValue`. Its one script of its own, `js/components/sheet.js`, adds the drag, and nothing
  needs it.
- **The surface holds, so it's a container:** square, `--paper`, a 2px `--line` frame on the one
  edge that faces the page, no shadow. Behind it, `--scrim`.
- **Bottom or side is the window's call,** at 45rem, where Frame swaps the tab bar for the
  sidebar: an open `.sheet` comes from the bottom below it and from the side from it. Only a
  `<dialog class="sheet">` follows the window, open or on its way out: the rule names the element,
  `dialog.sheet`, not `:modal`, which a closing sheet loses at once (a side sheet would turn into a
  bottom sheet halfway out of the window). A `.sheet` that isn't one (the page's pictures) is
  drawn as the bottom sheet, and `.sheet--side` pins the side sheet.
- **Inside, Top bar's standard layout:** the task as the title, centred, and a close button in
  the actions slot. The close button is always there: a bottom sheet can also be dragged down by
  its top bar, but the drag is never the only way out.
- **It owns its safe areas, as a bar does.** A bottom sheet runs edge to edge, pads the home
  indicator and stops short of the status bar; a side sheet runs top to bottom and pads the top
  one. Content inside never reads `--safe-*`.
- **One scroller:** the body. The top bar stays; the page never scrolls sideways.
- **The action sheet is Menu on a phone:** Menu's items, order and rule, and Menu's no-anchor
  geometry.
- **It moves from its own edge and goes back to it.** A bottom sheet rises, a side sheet slides in
  from the end edge, the scrim fades; under reduced motion it fades where it stands (Motion,
  below).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Scrim | `::backdrop` | `background: var(--scrim)`. A tap on it closes an action sheet (`closedby="any"`), never a form. |
| Surface | `.sheet` on `<dialog>` | Flex column. Bottom sheet: `inset: auto 0 0`, edge to edge, `block-size: auto` up to `min(90%, 90dvh)`, `margin: 0`, `padding: 0`, a `--sheet-bw` (`--bw`) `--line` frame on the top edge only, `--radius-card`, `--type-body`, ink on `--paper`. Sets `--safe-top` to 0px (it never reaches the status bar) and resets `--card-ink`, `--card-bg` and `--card-ink-soft`, so its buttons read its paper. `dialog.sheet:not([open])` keeps `display: none`. |
| Top bar | `.topbar` | Top bar's element, standard layout, unchanged: an `h2.topbar__title` that names the sheet (`aria-labelledby`), centred; `flex: none`, so the body gives way first. On a `<dialog>` it is also the drag handle: `touch-action: pinch-zoom`, so a one-finger drag on it is the script's and a pinch is still the reader's. |
| Close | `.btn.btn--quiet.btn--icon` in a `form.topbar__actions` | `ic--close`, `aria-label="Close"`, `value="close"`. The `<form method="dialog">` is the bar's actions slot, so it closes with no script. |
| Body | `.sheet__body` | The task. Grid, 24px gap; `flex: 1 1 auto; min-block-size: 0; overflow-y: auto; overscroll-behavior: contain; scroll-padding-block: 16px`. Padding 24px above; below, `max(24px, --safe-bottom + 8px)`; at the sides `max(16px, --safe-left)` and `max(16px, --safe-right)`. |

```html
<button class="btn" type="button" commandfor="add-card" command="show-modal">
  <span class="ic ic--plus" aria-hidden="true"></span>Add a card
</button>

<dialog class="sheet" id="add-card" aria-labelledby="add-card-title">
  <header class="topbar">
    <h2 class="topbar__title" id="add-card-title">Add a card</h2>
    <form class="topbar__actions" method="dialog">
      <button class="btn btn--quiet btn--icon" value="close" aria-label="Close">
        <span class="ic ic--close" aria-hidden="true"></span>
      </button>
    </form>
  </header>
  <div class="sheet__body">
    <form class="form" method="dialog">
      … Front, Back (Field) …
      <div class="form__actions">
        <button class="btn btn--primary" value="add">Add card</button>
      </div>
    </form>
  </div>
</dialog>
```

## Variants

Shown drawn and live, with markup, in `elements/sheet.html` (2.1–2.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Bottom sheet | `.sheet` | A short task over the screen it belongs to, on a phone: Add a card. | As above. Focus starts in the first field (`autofocus`): the task is typing. No `closedby`: Escape and Close close it, a stray tap on the scrim doesn't throw away what you typed. The form ends with its own submit row (Form's), so there's no Cancel beside Close. |
| Side sheet | an open `.sheet` from `(width >= 45rem)`; `.sheet--side` at any width | The same task on a wide screen, the deck in view beside it. | `inset-block: 0; inset-inline: auto 0`, top to bottom, `inline-size: min(28rem, 100% - min(48px, 15%))`: a sliver of the page always shows. The frame moves to the start edge. `--safe-top` comes back (`inherit`), so its top bar pads the status bar; `--safe-left` is 0px. Not for the action sheet. |
| Action sheet | `.sheet.sheet--action` | A thing's actions on a phone: Deck options (Rename, Duplicate, Export, Delete deck…). | The body is a `<form method="dialog">` of Menu's `.menu__item` buttons (quiet, block, words at the start), each with a `value`; a `.menu__rule` before the destructive item, last. Flex column, 4px gap, 8px in and `max(8px, --safe-bottom)` below: Menu's spacing. `closedby="any"`: a tap on the scrim closes it, as a click outside closes a menu. Always from the bottom; on a window wider than 30rem it stops at 30rem, centred, framed on three sides: Menu's no-anchor sheet. |

```html
<button class="btn btn--quiet btn--icon" type="button" commandfor="deck-options"
        command="show-modal" aria-label="More for Shapes">
  <span class="ic ic--more" aria-hidden="true"></span>
</button>

<dialog class="sheet sheet--action" id="deck-options" aria-labelledby="deck-options-title" closedby="any">
  <header class="topbar">
    <h2 class="topbar__title" id="deck-options-title">Deck options</h2>
    <form class="topbar__actions" method="dialog">…Close…</form>
  </header>
  <form class="sheet__body" method="dialog">
    <button class="btn btn--quiet btn--block menu__item" value="rename">Rename</button>
    <button class="btn btn--quiet btn--block menu__item" value="duplicate">Duplicate</button>
    <button class="btn btn--quiet btn--block menu__item" value="export">Export</button>
    <hr class="menu__rule">
    <button class="btn btn--quiet btn--block menu__item" value="delete">Delete deck…</button>
  </form>
</dialog>
```

**Menu or action sheet.** The same items, in the same order, with the same rule, for the same
button. On a phone (an installed PWA under 45rem) the More button opens the action sheet: a
bigger list in reach of a thumb, with a title that says whose actions they are. On a wide window
it opens Menu, anchored to the button. One button never opens both. Delete deck… then asks with
Dialog's confirm once the sheet has closed.

## States

| State | Trigger | Look |
| --- | --- | --- |
| Closed | no `open` | Nothing but the opener. |
| Open, with a form | `showModal()` | Focus in the first field (`autofocus`); Tab goes through the form and round to Close. |
| Open, no field | `showModal()` | Focus on Close, the first control and the safe way out: Button's quiet focus, filled and ringed. |
| Close, items | Button's, Menu's | Hover fills and lifts (pointers only); press drops the lift and keeps the fill with the inner ring; then the sheet closes with that button's `value`. |
| Taller than the room | content past 90% of the screen | The top bar stays, the body scrolls inside; the page never scrolls sideways. At 320px and 200% text the bottom sheet reaches 84px from the top and scrolls. |
| Forced colours | `(forced-colors: active)` | `--sheet-bw` becomes `--bw-heavy`, `CanvasText`: the edge that faces the page is 4px. The top bar's rule is Top bar's. Chromium draws the scrim as a 60% wash of `Canvas`; elsewhere it may vanish, and the frame is enough alone. |
| Dark | the scheme | The scrim stays near-black (Dialog's), and only the edge that faces the page is framed, so on a dark page that 2px ink edge is what says "on top". |

The pictures on the page are `<div class="sheet">` inside `inert` device frames: not modal, so
drawn as the bottom sheet whatever the window, with `.sheet--side` for the side one. The
`.is-*` classes force Button's states there only.

## Motion

Gate 4. Only `transform` and `opacity` move, and only on a real `<dialog>`: the page's pictures
stand still, and nothing moves on load.

| Moment | What moves | Timing | Reduced motion |
| --- | --- | --- | --- |
| Opening | The sheet from `--sheet-off` to its place: `translateY(100%)` for a bottom sheet and the action sheet (it rises from the bottom edge); `translateX(var(--sheet-end))` for a side sheet, where `--sheet-end` is 100%, or -100% under `:dir(rtl)`, so it slides in from the end edge either way. The scrim fades in. The first frame is `@starting-style`. | `--dur-move`, `--ease-out`: fast, then settling. | It doesn't travel: a fade where it stands, `--dur-fade` (transform takes 0s). |
| Closing | Back the way it came; the scrim fades. `display` and `overlay` change at the end (`allow-discrete`), so it stays in the top layer until it is out of sight. | `--dur-hover`. | A fade where it stands, `--dur-fade`. |
| Dragged | The sheet follows the finger (`transform`), down only, with its transition off. | The finger's. | The same: it is the hand moving it. |
| Let go short | It settles back through the open state's transition. | `--dur-move`. | It is back at once and fades in there (`--dur-fade`). |
| Let go far enough | It closes through Close, and the exit takes it on from where the finger left it. | `--dur-hover`. | It fades out where it was dropped. |

**Drag to dismiss** (`js/components/sheet.js`, about 100 lines, in `dist/flashcards.js`):

- **Where it starts:** a pointer down on the top bar of an open `dialog.sheet`, anywhere but a
  control in it (Close, a button, a link, a field). So it never takes a scroll in the body, and a
  press on Close is a press.
- **Bottom sheets only:** a sheet that touches the top edge runs top to bottom, which is a side
  sheet, and doesn't drag.
- **Release:** past a third of the sheet's height, or a flick down (faster than 0.5px per
  millisecond over the last few moves, and at least 24px), it closes; anything less settles back.
  An upward drag stops at the sheet's place; a cancelled pointer settles back.
- **Closing is Close:** the script presses the sheet's Close button (`click()`), so the dialog
  closes with Close's `value` as its `returnValue`, the app's `close` handler runs as for a tap,
  and focus goes back to the opener (natively, or through `dialog.js`). With no Close it calls
  `close()`.
- **Escape mid-drag** closes it as usual; the drag is dropped and the sheet opens in its place
  next time.
- **Why no detents.** A sheet is as tall as its task (up to 90%), so there is one place for it to
  be, open, and one way to go, closed. A half-height stop would hide part of a form and need a
  second gesture to reach the rest; a task that needs more room than that is a screen.
- **Without script, or without pointer events,** nothing drags, and Close is the way out, as it
  always is.

**Where it isn't supported, it appears in place, as before.** No `@starting-style`: it comes in
place. No `overlay` (Safari and Firefox, for now): a closing sheet would leave the top layer at
once and show in the page's flow while it moved, so the way out sits inside
`@supports (overlay: auto)` and elsewhere it goes in place.

**Checked** in Chromium 141, frame by frame (Web Animations API, screenshots at 0, 50 and 100%):
the bottom sheet rising at 390px, the side sheet at 1440px from the right and, with `dir="rtl"`,
from the left, each closing, with motion and reduced; no sideways scroll at 320, 390 or 1440px
during or after any of them. The drag with touch emulation (CDP touch events): 60px settles back;
45% of the sheet closes it with `returnValue` "close" and focus on Add a card; a 90px flick
closes it; a quick 40px then a pause settles; a drag that starts on Close moves nothing and doesn't
close; a scroll in the body (at 390 by 420) scrolls it both ways and never moves the sheet; a side
sheet doesn't drag; under reduced motion a drop fades out where it is and reopens in place.

## Accessibility

- A modal `<dialog>`, named by its top bar's title (`aria-labelledby`); the page behind is inert.
  Not an `alertdialog`: a sheet is a task, not a warning.
- Focus moves in on open (the first field, or Close), stays in with Tab, leaves only to the
  browser's own toolbar; Escape closes; focus goes back to the opener (Dialog's `dialog.js` where
  the browser can't).
- Close is a real button with a name, "Close", and a 44px circle; every item is a 44px pill. The
  action sheet's items are plain buttons in reading order, with an `<hr>` separator: no
  `role="menu"`, for Menu's reasons.
- Nothing relies on colour or on a gesture: the destructive item is its words, and every way out
  is a button or a key. The drag is a shortcut for Close, never instead of it.

**Right to left.** The side sheet sits on the left edge and slides in from it (`--sheet-end` is
-100% under `:dir(rtl)`), framed on its right, which faces the page. It pads the left safe area and
zeroes the right one. The bottom sheet, the action sheet and the drag are vertical, so they don't
change. On the page: 2.4.

## Platforms

- **Installed PWA:** from the bottom, edge to edge, owning the home indicator's safe area; at
  most 90% of the screen, so the deck still shows above it. Landscape on a phone is usually
  45rem or wider, so a sheet comes from the side there. It rises in, and drags down by its top bar
  to close; no detents. The on-screen keyboard doesn't resize a fixed sheet on iOS; the focused field is
  scrolled into view, and the keyboard inset (`interactive-widget`, `visualViewport`) is wave 5's.
- **Mac:** sheets are system chrome natively (`STYLE.md` §4). In the web shell a window of 45rem
  or wider gets the side sheet; a narrower one behaves as a phone. Escape closes; ⌘. is the
  system's cancel in native sheets.
- **SwiftUI:** `.sheet(isPresented:)`, which drags down to dismiss natively, with one stop like
  ours (`.presentationSizing(.fitted)`, iOS 18 and macOS 15, not a list of
  `.presentationDetents(_:)`), and a
  toolbar `Button("Close", systemImage: "xmark")` at `ToolbarItemPlacement.cancellationAction`
  (iOS); `.inspector(isPresented:content:)` for the side sheet (macOS 14, iOS 17); `.confirmationDialog("Deck options",
  isPresented:titleVisibility: .visible)` for the action sheet, with `Button("Delete deck…",
  role: .destructive)`. All system chrome: the system's look, not ours.

## Do and don't

- **Do** use a sheet for a short task that belongs to the screen under it, titled with the task.
- **Do** keep Close in view and end a form with its own button.
- **Do** give the action sheet Menu's items, in Menu's order, with the destructive one last.
- **Don't** open a sheet from a sheet, or make a drag the only way out.
- **Don't** let a tap on the scrim close a sheet with a form in it.
- **Don't** use a sheet for a question (Dialog), for news (Toast, Banner), or for a task with
  screens of its own (a screen with a back link).

## Known limits

- Bottom or side follows the window (`@media`), not the frame: a sheet opened inside a narrow
  pane of a wide window still comes from the side, across the window.
- The scrim needs `::backdrop` to inherit custom properties (Chrome 122, Firefox 120, Safari
  17.4); older engines draw none (Dialog's limit).
- `closedby="any"` (light dismiss) is new; where it's missing the action sheet closes with Close,
  an item or Escape only. With the motion, a tap on the scrim still closes it (checked).
- The window's switch is on `dialog.sheet`, not `:modal`, so the shape holds through the exit. A
  `<dialog class="sheet">` opened with `show()` (not modal) would follow the window too; sheets
  are always modal, and `show()` isn't supported.
- The drag's numbers (a third, the flick) were tuned on emulated touch, not a finger on a device.
  A drag only starts on the top bar; one that starts in the body when it is scrolled to the top
  (as iOS sheets do) would have to share the gesture with the scroll, and isn't done.
- The way out needs `overlay`, which only Chromium has: in Safari and Firefox a sheet moves in and
  goes in place (Motion). The drag works there, and its close is in place too.
- The page behind can scroll under a wheel on these long style-sheet pages; in an app inside
  Frame the document doesn't scroll (Dialog's limit).
- At 320px and 200% text a pinned side sheet is 272px wide and the page sliver 48px; the page's
  own pictures of it, squeezed inside the stage, wrap the title hard.
- Checked in Chromium 141 only (keyboard, touch emulation, forced colours, invoker commands on
  and removed, motion frame by frame, the drag), not in Safari, Firefox or on a device.
