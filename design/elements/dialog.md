# Dialog

Element 22 · gates 0–2 done (wireframe, states) · page: `elements/dialog.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Dialog's own spec.

## Brief

*Stop and decide.*

- **Variants:**
  - *confirm*: a destructive choice ("Delete Shapes? Its 12 cards go too." with Delete deck /
    Keep it). The safe choice is focused first, and the destructive one is never primary.
  - *acknowledge*: one button ("Can't import that file. It isn't a deck export. OK").
  - *with a field*: Rename deck, which reuses Form's inline form.
- **Notes:**
  - Square, a 2px frame on paper, at most about 28rem wide, centred, `--scrim` behind.
  - The title is the question; the buttons say the action ("Delete deck"), never "Yes" or "No".
  - A small `dialog.js` only if returning focus needs it; `showModal` handles the rest.
  - Mac: alerts are system chrome natively; this is the web shell's.
- **Wave 4's shared notes:** overlays are native (`<dialog>` and `showModal()`); focus moves in
  and goes back; Escape closes; the page behind is inert; the scrim is a flat ink layer at 60%,
  invisible under forced colours, so the overlay keeps its frame; words before chrome; no motion.

## House rules

- **Native, nearly no script.** `<dialog>` opened with `showModal()`: the browser moves focus in
  (to the `autofocus` element, or the first control), keeps Tab inside, closes on Escape, makes
  the page inert, and gives focus back. Buttons close it from a `<form method="dialog">`, and the
  button's `value` becomes the dialog's `returnValue`, which the app reads on `close`.
- **The opener is declarative.** `commandfor="<id>" command="show-modal"` on a `type="button"`
  (invoker commands). Browsers that have them need no script. `js/components/dialog.js` (under
  40 lines) does the same where they're missing, and puts focus back on the opener when the
  browser can't (Safari doesn't focus a clicked button, so it has nothing to return to).
- **The surface holds, so it's a container:** square (`--radius-card`), a 2px `--line` frame on
  `--paper`, no shadow. The buttons act, so they're Button's pills.
- **The scrim** is `::backdrop` with `--scrim`: ink at 60%, the one translucency (rule 2).
- **Words carry the choice.** The title is the question; buttons are verbs that say what
  happens. A destructive button is a plain secondary button: never primary, never red.
- **The safe choice is primary, last and focused** (`autofocus`), so Return and a careless tap
  both keep things as they are.
- **Appears in place.** No transitions until gate 4.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Scrim | `::backdrop` | `background: var(--scrim)`. A tap on it does nothing: a decision needs a button. |
| Surface | `.dialog` on `<dialog>` | Flex column, 12px gap. `inline-size: min(28rem, 100% - 2 × --dialog-edge)`, `max-block-size: calc(100% - 2 × --dialog-edge)`, `margin: auto` (centred), `overflow: auto` with `overscroll-behavior: contain`. `--dialog-edge` is `min(16px, 5vw)`; padding `--dialog-pad`, `min(24px, 6vw)`, so both stay small on a phone at large text. `--type-body`, ink on `--paper`, a `--bw` `--line` frame, `--radius-card`. A container named `dialog`. Resets `--card-ink`, `--card-bg` and `--card-ink-soft`, so its buttons read the dialog's paper even when the opener sat on an ink card. |
| Title | `.dialog__title` | An `h2`, the dialog's name (`aria-labelledby`). `--type-title`, balanced, breaks a word only if it can't fit (`overflow-wrap: anywhere`). An optional leading glyph (`ic--warning`, 24px) for a failure, centred on the first line. |
| Text | `.dialog__text` | A `<p>`, the dialog's description (`aria-describedby`). `--type-body`, pretty-wrapped; the 28rem surface keeps the line short. |
| Actions | `.dialog__actions` | A `<form method="dialog">`: flex, 12px gap, 12px above (24px from the text). Under 17rem of dialog: a column, full width, the last button (the primary) on top. From 17rem: a row at the end, primary last; if the labels can't share it, the primary wraps to the top (`wrap-reverse`). Buttons in it are submit buttons by default; each has a `value`. |

```html
<button class="btn" type="button" commandfor="delete-shapes" command="show-modal">Delete deck…</button>

<dialog class="dialog" id="delete-shapes" role="alertdialog"
        aria-labelledby="delete-shapes-title" aria-describedby="delete-shapes-text">
  <h2 class="dialog__title" id="delete-shapes-title">Delete Shapes?</h2>
  <p class="dialog__text" id="delete-shapes-text">Its 12 cards go too.</p>
  <form class="dialog__actions" method="dialog">
    <button class="btn" value="delete">Delete deck</button>
    <button class="btn btn--primary" value="keep" autofocus>Keep it</button>
  </form>
</dialog>
```

```js
dialog.addEventListener("close", () => {
  if (dialog.returnValue === "delete") deleteDeck();
  dialog.returnValue = ""; // Escape leaves the last value in place
});
```

## Variants

Shown drawn and live, with markup, in `elements/dialog.html` (2.1–2.3).

| Variant | Recipe | Use | Notes |
| --- | --- | --- | --- |
| Confirm | `role="alertdialog"`, title + text, Delete deck (`.btn`) then Keep it (`.btn--primary`, `autofocus`) | A choice that can't be taken back: deleting a deck. | The opener says "Delete deck…": the ellipsis promises the question. Prefer Undo (Toast) when the action can be undone; confirm only what can't. |
| Acknowledge | `role="alertdialog"`, `ic--warning` in the title, one `.btn--primary` "OK" | Something failed and there's nothing to choose: "Can't import that file". | The title says what happened; the text why and what to do ("It isn't a deck export. Choose a file saved with Export."). Only for a failure that stops the task; news that doesn't is a Toast or a Banner. |
| With a field | `role` left as dialog; a `.form.form--inline` holds the `.field` and the `.dialog__actions` | One value before it goes on: Rename deck. | Form's inline form, with the actions as its last row (they never fit beside the field at 28rem). Focus starts in the field; Return renames. An empty name gets Field's error from `form.js` and the dialog stays open. Cancel is `form="<id>-cancel"`, a submit button of a second, empty `<form method="dialog" hidden>`: Return presses the first submit button of the field's own form, so Cancel can't be first in it, and `type="button"` couldn't close without script. |

```html
<dialog class="dialog" id="rename" aria-labelledby="rename-title">
  <h2 class="dialog__title" id="rename-title">Rename deck</h2>
  <form class="form form--inline" method="dialog">
    <div class="field">
      <label class="field__label" for="rename-name">Deck name</label>
      <p class="field__error" id="rename-name-error" hidden>…Give the deck a name</p>
      <input class="field__input" id="rename-name" name="name" type="text" value="Shapes"
             required autocomplete="off" autocapitalize="sentences" enterkeyhint="done">
    </div>
    <div class="dialog__actions">
      <button class="btn btn--quiet" form="rename-cancel" value="cancel">Cancel</button>
      <button class="btn btn--primary" value="rename">Rename</button>
    </div>
  </form>
  <form id="rename-cancel" method="dialog" hidden></form>
</dialog>
```

## States

| State | Trigger | Look |
| --- | --- | --- |
| Closed | no `open` | Nothing but the opener. `dialog.dialog:not([open])` keeps `display: none` against the surface's flex. |
| Open | `showModal()` | The surface centred over the scrim; the page inert. Focus on the `autofocus` button, else the first control (the field, or the one button). |
| Buttons | Button's | Hover lifts and fills (pointers only), focus adds the 3px ring, press drops the lift and keeps the fill with the inner ring. A destructive button looks like any secondary one. |
| Invalid | a submit with an empty required field | Field's error above the input (`aria-invalid`, the message tied by `aria-describedby`), focus back in the field, the dialog stays open. |
| Taller than the screen | content past `100% - 2 × --dialog-edge` | Scrolls inside; the page never scrolls sideways. |
| Forced colours | `(forced-colors: active)` | The frame goes to `--bw-heavy` in `CanvasText`. Chromium draws the scrim as a 60% wash of `Canvas`; other engines may drop it, and the 4px frame is enough alone. |

A `.dialog` that isn't a `<dialog>` sits in place, as an open one looks: the page uses that to
draw them (inside `inert` pictures). The `.is-*` classes on its buttons force Button's states for
the page only.

## Accessibility

- `<dialog>` with `showModal()` is exposed as a modal dialog; everything outside is inert. A
  confirm or a failure is `role="alertdialog"`, so screen readers read the text with the title.
  `aria-labelledby` names it with the title, `aria-describedby` with the text.
- Focus moves in on open: to the safe choice (`autofocus` on Keep it), the field, or the one
  button. Tab and Shift-Tab cycle through its controls; past the last one focus may go to the
  browser's own toolbar, never to the page. Escape closes it with no `returnValue`: treat that as
  the safe choice.
- Focus goes back to the opener on close: natively where a click focuses the button, through
  `dialog.js` where it doesn't (Safari). If the opener is gone (the deck was deleted), the app
  moves focus somewhere that makes sense, such as the list's heading.
- Every button is a 44px pill; nothing relies on colour: the destructive one is its words, a
  failure is its words plus `ic--warning`.
- Don't use `aria-modal` or a focus-trap library: the native modal does both.

## Platforms

- **Installed PWA:** centred on a phone too, 16px clear of the edges. The buttons share a row when
  both labels fit (most phones at default text) and stack full width with the primary on top on
  a 320pt phone or at larger text. A phone has no Escape key, so every
  dialog has a visible button that closes it. The scrim covers the status bar area with the page.
  No entrance until gate 4.
- **Mac:** alerts are system chrome natively (`STYLE.md` §4); this element is the web shell's.
  Return presses the focused button (the safe one); Escape cancels. A destructive command in the
  menu bar ends in "…" and opens the same dialog.
- **SwiftUI:** `.alert("Delete Shapes?", isPresented:) { Button("Delete deck", role:
  .destructive) {…}; Button("Keep it", role: .cancel) {} } message: { Text("Its 12 cards go
  too.") }`. The acknowledge is an `.alert` with one `Button("OK")`; with a field,
  `.alert(_:isPresented:actions:)` with a `TextField` in its actions (macOS 13, iOS 16). These
  are system chrome, so the system's look and its destructive red are the system's, not ours.

## Do and don't

- **Do** ask one question in the title and answer it with verbs: "Delete Shapes?" with Delete
  deck and Keep it.
- **Do** say what goes with it ("Its 12 cards go too"), and make the safe choice primary, last
  and focused.
- **Don't** ask "Are you sure?", label buttons Yes and No, or make the destructive button
  primary or red.
- **Don't** stop anyone for news that needs no answer: that's a Toast or a Banner. Prefer Undo
  to a question when the action can be undone.
- **Don't** open a dialog from a dialog, close it on a scrim tap, or put a page's worth of
  content in one: that's a Sheet or a screen.

## Known limits

- Invoker commands (`commandfor`, `command`) are new; without them and without `dialog.js` the
  opener does nothing. Apps that open dialogs from their own script call `showModal()` and need
  neither.
- The scrim doesn't stop the page behind from scrolling under a wheel or a swipe on browsers
  that chain the scroll to the document. In an app inside Frame the document doesn't scroll, so
  nothing moves; on these long style-sheet pages it can.
- The scrim needs `::backdrop` to inherit custom properties (Chrome 122, Firefox 120, Safari
  17.4). Older engines draw no scrim; the dialog keeps its frame, so it still reads as on top.
- `--scrim` is ink at 60%. In dark mode (gate 3) ink is light, so wave 6 points the scrim at a
  fixed dark value rather than ink.
- `returnValue` survives an Escape: the app clears it after reading it (above).
- After a failed submit the field keeps its error until it's fixed; reopening a cancelled Rename
  shows the old error unless the app resets the form on `close`.
- Selecting the name on open (so typing replaces it) is the app's: `input.select()` after
  `showModal()`.
- At the largest text sizes on the narrowest phones a long title word breaks inside the word
  rather than clipping. In the page's squeezed pictures (about 120px of content) a Button label
  can still overflow; the real dialog keeps at least 245px at 320px and 200% text.
- Checked in Chromium 141 only (keyboard, touch emulation, forced colours, invoker commands on
  and removed, a Safari-like click that doesn't focus), not in Safari, Firefox or on a device.
