# Sheet

Element 23 · gates 0–2 done (wireframe, states) · page: `elements/sheet.html`

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
  - Copy: Add a card (a form), Deck options (an action sheet).
- **Wave 4's shared notes:** as Dialog's (native, focus in and back, Escape, inert page, the
  scrim, its frame under forced colours, no motion).

## House rules

- **A sheet is a Dialog in another shape.** The same native `<dialog>` and `showModal()`, the
  same opener (`commandfor` + `command="show-modal"`, with Dialog's `js/components/dialog.js` for
  browsers without it and for focus return), the same `<form method="dialog">` closing with a
  `returnValue`. Sheet has no script of its own.
- **The surface holds, so it's a container:** square, `--paper`, a 2px `--line` frame on the one
  edge that faces the page, no shadow. Behind it, `--scrim`.
- **Bottom or side is the window's call,** at 45rem, where Frame swaps the tab bar for the
  sidebar: an open `.sheet` comes from the bottom below it and from the side from it. Only an
  open modal (`:modal`) follows the window; a `.sheet` that isn't one (the page's pictures) is
  drawn as the bottom sheet, and `.sheet--side` pins the side sheet.
- **Inside, Top bar's standard layout:** the task as the title, centred, and a close button in
  the actions slot. The close button is always there: drag to dismiss waits for gate 4 and is
  never the only way out.
- **It owns its safe areas, as a bar does.** A bottom sheet runs edge to edge, pads the home
  indicator and stops short of the status bar; a side sheet runs top to bottom and pads the top
  one. Content inside never reads `--safe-*`.
- **One scroller:** the body. The top bar stays; the page never scrolls sideways.
- **The action sheet is Menu on a phone:** Menu's items, order and rule, and Menu's no-anchor
  geometry.
- **Appears in place.** No transitions until gate 4.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Scrim | `::backdrop` | `background: var(--scrim)`. A tap on it closes an action sheet (`closedby="any"`), never a form. |
| Surface | `.sheet` on `<dialog>` | Flex column. Bottom sheet: `inset: auto 0 0`, edge to edge, `block-size: auto` up to `min(90%, 90dvh)`, `margin: 0`, `padding: 0`, a `--sheet-bw` (`--bw`) `--line` frame on the top edge only, `--radius-card`, `--type-body`, ink on `--paper`. Sets `--safe-top` to 0px (it never reaches the status bar) and resets `--card-ink`, `--card-bg` and `--card-ink-soft`, so its buttons read its paper. `dialog.sheet:not([open])` keeps `display: none`. |
| Top bar | `.topbar` | Top bar's element, standard layout, unchanged: an `h2.topbar__title` that names the sheet (`aria-labelledby`), centred; `flex: none`, so the body gives way first. |
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

The pictures on the page are `<div class="sheet">` inside `inert` device frames: not modal, so
drawn as the bottom sheet whatever the window, with `.sheet--side` for the side one. The
`.is-*` classes force Button's states there only.

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
  is a button or a key.

## Platforms

- **Installed PWA:** from the bottom, edge to edge, owning the home indicator's safe area; at
  most 90% of the screen, so the deck still shows above it. Landscape on a phone is usually
  45rem or wider, so a sheet comes from the side there. Drag to dismiss and detents wait for
  gate 4. The on-screen keyboard doesn't resize a fixed sheet on iOS; the focused field is
  scrolled into view, and the keyboard inset (`interactive-widget`, `visualViewport`) is wave 5's.
- **Mac:** sheets are system chrome natively (`STYLE.md` §4). In the web shell a window of 45rem
  or wider gets the side sheet; a narrower one behaves as a phone. Escape closes; ⌘. is the
  system's cancel in native sheets.
- **SwiftUI:** `.sheet(isPresented:)` with `.presentationDetents([.medium, .large])` and a
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
- `closedby="any"` (light dismiss) is new; where it's missing the action sheet closes with Close,
  an item or Escape only.
- `:modal` gates the window's switch, so a `<dialog class="sheet">` opened with `show()` (not
  modal) stays a bottom sheet. Sheets are always modal; `show()` isn't supported.
- The page behind can scroll under a wheel on these long style-sheet pages; in an app inside
  Frame the document doesn't scroll (Dialog's limit).
- At 320px and 200% text a pinned side sheet is 272px wide and the page sliver 48px; the page's
  own pictures of it, squeezed inside the stage, wrap the title hard.
- Checked in Chromium 141 only (keyboard, touch emulation, forced colours, invoker commands on
  and removed), not in Safari, Firefox or on a device.
