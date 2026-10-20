# Dialog

Element 22 · v1.0 · gates 0–5 done (brief, wireframe, states, colour, motion, freeze) · page: `elements/dialog.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Dialog's own spec.

## Brief

*Stop and decide.*

- **Variants:**
  - *confirm*: a destructive choice ("Delete Shapes? Its 12 cards go too." with Delete deck /
    Keep it). The safe choice is focused first, and the destructive one is never primary.
  - *acknowledge*: one button ("Couldn't import that file. It isn't a deck export. Close").
  - *with a field*: Rename deck, which reuses Form's inline form.
- **Notes:**
  - Square, a 2px frame on paper, at most about 28rem wide, centred, `--scrim` behind.
  - The title is the question; the buttons say the action ("Delete deck"), never "Yes" or "No".
  - A small `dialog.js` only if returning focus needs it; `showModal` handles the rest.
  - Mac: alerts are system chrome natively; this is the web shell's.
- **Wave 4's shared notes:** overlays are native (`<dialog>` and `showModal()`); focus moves in
  and goes back; Escape closes; the page behind is inert; the scrim is a flat near-black layer at 60%,
  invisible under forced colours, so the overlay keeps its frame; words before chrome; no motion
  until gate 4 (now: Motion, below).

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
- **The scrim** is `::backdrop` with `--scrim`: near-black at 60% in both schemes, the one
  translucency (rule 2). Never ink: in dark, ink is light and would lighten the page.
- **Words carry the choice.** The title is the question; buttons are verbs that say what
  happens. A destructive button is a plain secondary button: never primary, never red.
- **The safe choice is primary, last and focused** (`autofocus`), so Return and a careless tap
  both keep things as they are.
- **Fades and settles in, fades out.** Opacity and a 12px settle, nothing that moves the page;
  the scrim fades with it. Focus, Escape and `returnValue` never wait for it (Motion, below).

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
| Acknowledge | `role="alertdialog"`, `ic--warning` in the title, one `.btn--primary` named for what it does: "Close", or the next step when it takes one ("Choose another file") | Something failed and there's nothing to choose: "Couldn't import that file". | The title says what happened; the text why and what to do ("It isn't a deck export. Choose a file saved with Export."). Only for a failure that stops the task; news that doesn't is a Toast or a Banner. |
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
| Invalid | a submit with an empty required field | Field's error above the input (`aria-invalid`, the message tied by `aria-describedby`), focus back in the field (or, with Return pressed in it, the error read as an alert), the dialog stays open. |
| Taller than the screen | content past `100% - 2 × --dialog-edge` | Scrolls inside; the page never scrolls sideways. |
| Forced colours | `(forced-colors: active)` | The frame goes to `--bw-heavy` in `CanvasText`. Chromium draws the scrim as a 60% wash of `Canvas`; other engines may drop it, and the 4px frame is enough alone. |
| Dark | the scheme | The scrim stays near-black, so it darkens a page that is already dark: the words behind drop to grey and the surface keeps its ink frame, which is what parts them. |

A `.dialog` that isn't a `<dialog>` sits in place, as an open one looks: the page uses that to
draw them (inside `inert` pictures). The `.is-*` classes on its buttons force Button's states for
the page only.

## Motion

Gate 4. Only `transform` and `opacity` move, and only on a real `<dialog>`: the page's pictures
(a `.dialog` that isn't one) stand still, and nothing moves on load, since no dialog is open then.

| Moment | What moves | Timing | Reduced motion |
| --- | --- | --- | --- |
| Opening (`showModal()`) | The dialog from `opacity: 0` and `translateY(var(--space-3))` (12px low) to its place; the scrim (`::backdrop`) from 0 to its 60%. The first frame is `@starting-style`. | `--dur-hover`, `--ease-out`: it arrives fast and settles. | A fade only (no settle), `--dur-fade`. |
| Closing (`close()`, a button, Escape) | Dialog and scrim fade to 0. `display` and `overlay` change at the end (`transition-behavior: allow-discrete`), so it stays drawn, in the top layer, until it has faded. | `--dur-press`: leaving is quicker than arriving. | The same fade, `--dur-fade`. |

- **Nothing waits for the motion.** `showModal()` moves focus in at once; Escape works
  mid-entrance and turns it round; `close()` sets `returnValue` and gives focus back at once, as
  the fade begins, so the `close` event and the app's handler run as before.
- **Where it isn't supported, it appears in place, as before.** No `@starting-style`: it comes in
  place. No `overlay` (Chromium has it; Safari and Firefox don't yet): a closing dialog leaves the
  top layer at once, and fading there it would show in the page's flow, so the way out, the
  `display` and `overlay` half, sits inside `@supports (overlay: auto)` and elsewhere it goes in
  place.
- **Checked** in Chromium 141 with the Web Animations API (each transition paused and stepped to
  0, 50 and 100%, with screenshots) on all three dialogs, with motion and with
  `prefers-reduced-motion: reduce`; keyboard open, Escape mid-entrance, reopen and close: focus in
  at once and back on the opener every time; `returnValue` read on `close` as before.

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

**Right to left.** The actions row ends at the end of the line, so on a wide dialog the primary is
last and leftmost. The dialog fades and settles vertically, so its motion doesn't change.

## Platforms

- **Installed PWA:** centred on a phone too, 16px clear of the edges. The buttons share a row when
  both labels fit (most phones at default text) and stack full width with the primary on top on
  a 320pt phone or at larger text. A phone has no Escape key, so every
  dialog has a visible button that closes it. The scrim covers the status bar area with the page.
  It fades and settles in and fades out (Motion); with Reduce Motion on, it only fades.
- **Mac:** alerts are system chrome natively (`STYLE.md` §4); this element is the web shell's.
  Return presses the focused button (the safe one); Escape cancels. A destructive command in the
  menu bar ends in "…" and opens the same dialog.
- **SwiftUI:** `.alert("Delete Shapes?", isPresented:) { Button("Delete deck", role:
  .destructive) {…}; Button("Keep it", role: .cancel) {} } message: { Text("Its 12 cards go
  too.") }`. The acknowledge is an `.alert` with one `Button("Close")`; with a field,
  `.alert(_:isPresented:actions:)` with a `TextField` in its actions (macOS 13, iOS 16). These
  are system chrome, so the system's look, its destructive red and its entrance are the system's,
  not ours.

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
- In dark the scrim says less than in light: it dims words, not a white page. The surface is
  `--paper`, one step above the dimmed page, so the frame does most of the parting.
- `returnValue` survives an Escape: the app clears it after reading it (above).
- After a failed submit the field keeps its error until it's fixed; reopening a cancelled Rename
  shows the old error unless the app resets the form on `close`.
- Selecting the name on open (so typing replaces it) is the app's: `input.select()` after
  `showModal()`.
- At the largest text sizes on the narrowest phones a long title word breaks inside the word
  rather than clipping. In the page's squeezed pictures (about 120px of content) a Button label
  can still overflow; the real dialog keeps at least 245px at 320px and 200% text.
- The way out needs `overlay`, which only Chromium has: in Safari and Firefox a dialog fades in
  and goes in place (Motion).
- Checked in Chromium 141 only (keyboard, touch emulation, forced colours, invoker commands on
  and removed, a Safari-like click that doesn't focus, motion frame by frame), not in Safari,
  Firefox or on a device.
