# Toast

Element 24 · v1.0 · gates 0–5 done (brief, wireframe, states, colour, motion, freeze) · page: `elements/toast.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Toast's own spec.

## Brief

*It's done, with Undo.*

- **Variants:** done ("Deck deleted." Undo); done with no action ("Saved on this device.");
  failed with a retry ("Couldn't sync." Try again).
- **Notes:** `role="status"` (polite), one at a time, above the tab bar and clear of the bottom
  safe area. Stays at least 6 seconds, pauses while hovered or focused, and is never the only
  way to undo or retry (WCAG 2.2.1). A keyboard shortcut reaches its action on the Mac. Needs
  `js/components/toast.js`: queue, timer, pause.
- **Shared (wave 4):** words before chrome, polite unless a failure blocks you, no motion until
  gate 4 (now: Motion, below).

## House rules

- **A container, so square:** a 2px `--line` frame on `--paper`, `--radius-card`. No shadow: a
  shadow means "press this", and the frame already parts the toast from the content under it.
- **The region places, the toast draws.** The region is always in the markup, empty until it's
  needed, because a live region announces a change to itself, not its own arrival. The script
  puts one toast into it at a time; that insertion is the one thing a screen reader hears.
- **It sits over the content, never over a bar.** In a frame the region shares the scroll
  region's grid cell, so the bars are out of its reach and nothing is measured.
- **Time is the user's.** The clock stops while a pointer is on it, focus is in it, or the app
  is in the background, and it is never the only way to do what its action does.
- **It rises in and fades out.** In, it rises 12px as it fades in; closing, it fades where it is
  before the script takes it out. Focus goes back at once, and the announcement is the insertion,
  as before (Motion, below).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Region | `.toasts` + `role="status"` | One per frame, after the scroll region, before the bottom bar (that is its place in the Tab order). In a frame: `grid-row: 2; grid-column: -2; align-self: end`, so it sits at the foot of the scroll region's cell, in the content column, `z-index: 2`. Padding `12px` above and below, and the frame's side padding (`max(var(--gutter), var(--safe-left))` and its mirror). With no bottom bar (`.frame:not(:has(> .frame__bottom))`), and in a wide frame whose bottom bar is hidden, `12px + var(--safe-bottom)` below. Outside a frame: `position: fixed` at the foot of the viewport, the same padding plus `--safe-bottom`. A grid that centres its toast. In a frame it is never taller than the room between the bars (`max-block-size: 100%`): a toast taller than that scrolls inside it rather than cover the top bar. `pointer-events: none`: taps go through to the content round the toast. Never `display: none`. |
| Surface | `.toast` | Flex, wrapping, items at the start. `inline-size: min(100%, 32rem)`. Padding `8px`, `16px` at the start and `8px` at the end. `--type-body`, ink on paper, `2px` `--line` frame, `--radius-card`, no shadow. Sets `--card-ink` and `--card-bg`, so its Buttons read its surface. `pointer-events: auto`. |
| Glyph | `.toast__icon` on an `.ic` | `ic--check` (done) or `ic--warning` (failed). 20px, centred on a 44px row (`margin-block: (var(--hit) - 20px) / 2`). `aria-hidden`. |
| Words | `.toast__text` | A `<p>`. `flex: 1 1 min(6rem, 100% - 20px - 12px)`: 6rem beside the buttons before they move under it, and never so wide it leaves the glyph. Padded so its first line centres on the 44px row. Wraps (`text-wrap: pretty`, `overflow-wrap: break-word`); never truncated. |
| Actions | `.toast__actions` | Flex, `8px` apart, `margin-inline-start: auto`: at the trailing end, or on a line of their own under the words, at the end. |
| Action | `.toast__action` on a `.btn` | At most one. Button's secondary (a frame), `12px` a side as in a bar. A verb: Undo, Try again. Carries `aria-keyshortcuts="Alt+T"`. |
| Dismiss | `.btn--quiet.btn--icon` | Last. Button, quiet and icon-only, `ic--close`, `aria-label="Dismiss"`. On every toast. Carries `aria-keyshortcuts="Alt+T"` when there is no action. |

```html
<div class="frame">
  <header class="frame__top topbar">…</header>
  <div class="frame__scroll">…</div>
  <div class="toasts" role="status"></div>
  <nav class="frame__bottom tabbar" aria-label="Places">…</nav>
</div>
```

```html
<div class="toast">
  <span class="ic ic--check toast__icon" aria-hidden="true"></span>
  <p class="toast__text">Deck deleted.</p>
  <div class="toast__actions">
    <button class="btn toast__action" type="button" aria-keyshortcuts="Alt+T">Undo</button>
    <button class="btn btn--quiet btn--icon" type="button" aria-label="Dismiss">
      <span class="ic ic--close" aria-hidden="true"></span>
    </button>
  </div>
</div>
```

The script builds the toast; the page prints the same markup for each variant.

**Why the region shares the scroll region's cell.** A toast must clear the tab bar whatever its
height (it grows at large text) and the home indicator when there is no bar. Fixed positioning
would need the bar's height measured; the frame's grid already knows it. The scroll region is
placed in its row but not its column, so a second item in that row would push it into a new
column: `toast.css` pins it (`.frame:has(> .toasts) > .frame__scroll { grid-column: -2 }`, the
column the frame's status band already uses). See Known limits.

## Script

`js/components/toast.js`, bundled into `dist/flashcards.js`. Vanilla, no dependencies. Its one
global is `window.Flashcards`.

```js
const t = Flashcards.toast({
  text: "Deck deleted.",          // what happened: one short sentence
  action: "Undo",                 // optional: one verb
  onAction: () => restore(deck),  // optional: runs, then the toast closes
  failed: false,                  // optional: true swaps the check for the warning glyph
  region: el,                     // optional: a .toasts[role="status"]; default, the first on the page
  duration: 8000,                 // optional, and only longer: 6 s is the floor, 10 s with an action
});
t.dismiss();                      // withdraw it, shown or still queued (the sync came back)
```

Or with no script of the app's own, a trigger in the markup:

```html
<button class="btn" type="button" data-toast="Couldn't sync."
        data-toast-action="Try again" data-toast-failed>Sync now</button>
```

`data-toast` is the words, `data-toast-action` the action, `data-toast-failed` the warning
glyph. The toast goes into the trigger's own frame's region. Its action fires a bubbling
`toastaction` event on the trigger. A trigger that does nothing but raise a toast (a demo, a
test) can carry `hidden`: the script shows it, so without script nothing is on screen that
can't work. (`[data-toast][hidden]` is `display: none` in `toast.css`, because Button's `display`
would otherwise beat the attribute.)

| Behaviour | What it does |
| --- | --- |
| Queue | One at a time, page-wide. The next comes in 0.3 s after one has gone (a hover and a half: `--dur-hover`, read from the token), so new words read as a new toast. Each is announced as it goes in. Nothing is merged: two deletions are two toasts, each with its own Undo. |
| Clock | 6 s, or 10 s with an action (time to reach it). It stops while a pointer is on the toast (`pointerenter`), while focus is in it (`focusin`) and while the page is hidden (`visibilitychange`), and resumes with whatever was left, but at least 2 s. |
| Action | Runs `onAction`, then closes the toast. |
| Dismiss, Escape | Close it. Escape works while focus is in the toast. |
| Closing | Focus goes back first (below). Then the toast gets `inert` (no more taps, out of the Tab order and the accessibility tree), fades (`toast.css`), and is taken out when its `transitionend` comes, or after its own computed `transition-duration` if none does (no transition, cut short): then the next one's beat starts. |
| Alt+T (⌥T) | From anywhere on the page, moves focus to the toast's first button, which stops its clock. Matched on the key's position (`KeyT`), so it works whatever ⌥T would type. |
| Focus back | When a toast that has focus closes, focus goes back to where it was before it went in, unless `onAction` already moved it. At once, as the fade begins, never after it. |
| No region | The script makes one on `<body>` (fixed at the foot of the viewport) and waits 150ms before the first toast, so the new region is in the accessibility tree before it speaks. |

## Variants

Each is shown, with its markup, in `elements/toast.html` under Variants (2.1–2.3).

| Variant | Recipe | Use | Notes |
| --- | --- | --- | --- |
| Done, with Undo | `ic--check`, words, `.toast__action` "Undo", Dismiss | Something happened that can be taken back: "Deck deleted." | 10 s. Undo must also exist somewhere that doesn't run out: on the Mac, Edit › Undo (⌘Z). |
| Done | `ic--check`, words, Dismiss | It worked and there's nothing to do: "Saved on this device." | 6 s. If the words say nothing the screen doesn't already show, leave the toast out. |
| Failed, with a retry | `ic--warning`, words, `.toast__action` "Try again", Dismiss | Something in the background didn't work and nothing is lost: "Couldn't sync." | Polite: it doesn't stop you. Try again is also wherever sync lives in the app, and the app retries by itself. A failure that stops you is a Banner (`role="alert"`) or a Dialog. |

## States

The surface doesn't press, lift or fill; the buttons are Button's.

| State | Trigger | Look | Also |
| --- | --- | --- | --- |
| Waiting | the region, empty | Nothing: the region draws nothing and takes no taps. | It is in the accessibility tree, ready. |
| Showing | inserted by the script | The toast at the foot of the scroll region; it rises 12px into place as it fades in. | Announced once, politely. Its clock runs. |
| Held | pointer on it, focus in it, page hidden | No change: a countdown would be motion. | The clock stops; it resumes with at least 2 s. |
| Action hover, focus, pressed | Button's | Secondary hover lifts and fills; focus adds the ring (it fits inside the region's 12px); press drops the lift, keeps the fill. | Pressed runs the action and closes it. |
| Leaving | closed (timer, Dismiss, Escape, its action) | It fades where it is, `inert`. | Focus is already back; taken out when the fade ends. Nothing is announced. |
| Next in line | raised while another shows | Not shown yet. | Comes in 0.3 s after the current one has gone. |
| Narrow, large text | the words need the row | The buttons move under the words, at the end; the toast grows taller, never wider. | The glyph never leaves the words. |
| Forced colours | `(forced-colors: active)` | The frame is `CanvasText` (the page under it is `Canvas` too, so the frame is what parts them); glyphs are icons.css's `CanvasText`; the buttons are Button's. | |

`.is-hover`, `.is-focus` and `.is-active` on the buttons force a state for the page.

## Motion

Gate 4. Only `transform` and `opacity`, and only on a toast inside a live region
(`.toasts[role="status"] > .toast`), which is only ever one the script put there: the page's
pictures and anything on load stand still.

| Moment | What moves | Timing | Reduced motion |
| --- | --- | --- | --- |
| In | From `opacity: 0` and `translateY(var(--space-3))` to its place, from a first frame in `@starting-style`. | `--dur-hover`, `--ease-out`. | A fade only, `--dur-fade`. |
| Out | `opacity` to 0 on the `inert` toast; then the script removes it. | `--dur-hover`. | `--dur-fade`. |

- **12px is the region's own padding below the toast,** so a rising toast never reaches past the
  region: not over the tab bar, and never into a scrollbar on the region (which scrolls at large
  text).
- **No literal time in the script.** The wait for the fade is the toast's computed
  `transition-duration`; the beat is `--dur-hover` read from the root, times one and a half. The
  reading times (6 s, 10 s, at least 2 s on resume) and the 150ms a new region waits before it
  speaks are about reading and screen readers, not motion, and stay as they were.
- **The announcement is unchanged.** One insertion per toast, nothing else changes inside the
  region while it shows, and going `inert` takes it out of the accessibility tree, which isn't
  announced (checked in Chromium's tree: the toast's parts become ignored, "inertElement").
- **Where it isn't supported,** it appears in place (no `@starting-style`), and with no transition
  at all the script's timer is 0 and it goes at once, as before.

## Checked

In Chromium (Playwright), on `elements/toast.html` and in the joined `dist/style-sheet.html`:
untouched, a toast without an action stayed 6.00 s and one with Undo 10.00 s. A pointer resting on
it from 1 s to 9 s held it: it went 4.98 s after the pointer left (14.0 s in all). Focus in it held
it past 11 s. A page hidden for 8 s held it; it went 5.99 s after the page came back. Three raised at
once showed one at a time, 0.30 s apart, in order. Each was one insertion into the region and
nothing else changed in it while it showed. Alt+T put focus on Undo; Enter fired `toastaction`
once, closed it and put focus back on the trigger; Escape did the same without the action. Tab
from the last trigger went to Undo, then Dismiss, then the tab bar.

Gate 4, in Chromium 141 on the same page, with motion and with `prefers-reduced-motion: reduce`:
the entrance and the exit sampled at 0, 50 and 100% (Web Animations API, screenshots); ⌥T then
Escape put focus back on the trigger at once, with the toast `inert` and fading; three raised at
once showed one at a time, never two in the region, each one insertion (a MutationObserver counted
three insertions for three toasts, and one `inert` per close), the next going in 0.3 s after the
last went out; no sideways scroll at 320, 390 or 1440px during or after either.

## Accessibility

- **Announced once.** The region is `role="status"` (polite, atomic) and exists before any toast.
  The script inserts the whole toast in one step; while it shows nothing inside the region
  changes (holding the clock touches no markup), and taking it out isn't announced. Measured on
  the page: one change to the region per toast, and none while it was held.
- **Never steals focus.** Focus stays where you were. Tab reaches the toast in its place in the
  frame (after the content, before the tab bar); Alt+T (⌥T) gets there from anywhere; Escape
  leaves and puts focus back.
- **Timing (WCAG 2.2.1).** At least 6 s, 10 s with an action, held while you're on it, and its
  action is never the only route: the app keeps another way to undo or retry that doesn't run
  out. So the time limit never takes anything away.
- **Words carry it.** "Deck deleted." says what happened; the glyph repeats done or failed for
  sighted readers in a palette with no red; buttons say the action ("Undo", "Try again") and
  Dismiss is named. Every target is 44px.
- **Polite only.** A toast is never `role="alert"`: anything urgent enough to interrupt is a
  Banner or a Dialog.

## Platforms

- **Installed PWA:** above the tab bar, and clear of the home indicator when a screen has no
  bar. Its clock stops while the app is in the background, so a toast raised as you switch away
  is still there when you come back. The page behind a modal `<dialog>` is inert, the region
  with it: raise a toast after a dialog or sheet closes ("Deck deleted." after the confirm).
- **Mac:** the action is a command first. In SwiftUI and in a web shell's native menu it is in
  the menu bar with its shortcut (Edit › Undo Delete Deck, ⌘Z); the toast mirrors it and is
  never the only route. In the web shell, ⌥T reaches the toast from the keyboard.
- **SwiftUI:** no system toast, so a custom view: `.overlay(alignment: .bottom) { ToastView() }`
  on the content inside the `TabView`'s tab, so it sits above the tab bar, `.padding(12)`; the
  surface is `Rectangle().fill(.paper).overlay(Rectangle().strokeBorder(.line, lineWidth: 2))`,
  no `.shadow(radius:)`. Announce with `AccessibilityNotification.Announcement("Deck deleted").post()`. The
  clock is a `Task.sleep` cancelled by `.onHover(perform:)` and `@FocusState`, and while
  `scenePhase != .active`. With VoiceOver on, keep a toast with an action until it is dismissed.
  Undo goes through the window's `UndoManager`, so ⌘Z and the Edit menu work without it.

## Do and don't

- **Do** say what happened in a few words, in the past tense, and offer the one thing worth doing.
- **Do** keep another way to undo or retry that doesn't time out.
- **Do** raise it after the work is done and any dialog has closed.
- **Don't** put a question, a choice or a form in a toast; that's a Dialog.
- **Don't** use it for a failure that stops you, or make it `role="alert"`.
- **Don't** give it a shadow, round corners or an entrance of its own beyond the rise. No
  stacking: one at a time.
- **Don't** raise one for something the screen already shows.

## Known limits

- **A line that belongs in Frame.** `toast.css` pins the scroll region to the content column
  when a frame holds a region (`.frame:has(> .toasts) > .frame__scroll`). Frame should own it:
  `grid-column: -2` on `.frame__scroll` in `frame.css`, after which the rule here can go.
- While a modal dialog or sheet is open the region is behind it and inert; the script doesn't
  wait for it to close.
- ⌥T is taken only while a toast shows, and not in a field where it types a character (a Mac's
  †): there, Tab reaches the toast. Behind an open modal the toast can't take focus, so the key is
  left alone.
- With the on-screen keyboard up the tab bar hides and the toast sits on the frame's bottom edge.
  On Android (`interactive-widget=resizes-content`) that edge is the keyboard's top; on iOS the
  keyboard lies over it, since the page doesn't shrink there (`elements/frame.md`), so a toast
  raised while typing can be under the keyboard. Needs a device.
- While it shows, the toast covers the foot of the scroll region: about 64px, 88px on a 320pt
  phone where the words wrap beside Undo, more at large text. `toast.js` publishes the region's
  height as `--toasts-h` and the scroll region pads its foot by it, so the end of the content
  scrolls clear and a control that takes focus is scrolled out from under it (WCAG 2.4.11).
- At 200% text on a small phone the bars leave little room, and a long toast scrolls inside its
  region, words first. On a full 390 by 844 phone at 200%, "Couldn't sync." with Try again fills
  most of the room between the bars (about 316 of 357px). On a 320 by 568 phone at 200% the room
  is about 80px and a toast fills all of it, so it covers whatever has focus until it goes: Tab or
  ⌥T reaches it and Escape closes it. On the sheet's narrowed phones (a phone squeezed into a 320px
  window) the room is almost nothing (`elements/frame.md`, Known limits).
- Announcements were checked in Chromium (its accessibility tree and a count of changes to the
  region), not with VoiceOver, NVDA or TalkBack.
