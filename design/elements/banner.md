# Banner

Element 25 · v1.0 · gates 0–5 done (brief, wireframe, states, colour, motion, freeze) · page: `elements/banner.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Banner's own spec.

## Brief

*News about the whole screen.*

- **Variants:** offline ("You're offline. Changes are saved on this device." Status, no close
  while it's true); update ready ("A new version is ready." with Reload); failure ("Couldn't load
  your decks." with Try again; alert only when it blocks).
- **Notes:** inline, at the top of the scroll region under the top bar, full width, square, a 2px
  rule below; never floating. Icon (`ic--offline`, `ic--refresh`, `ic--warning`) plus words,
  never colour alone. It pairs with wave 5's service worker, which raises "update ready" and
  "offline" for real.
- **Shared (wave 4):** words before chrome; status (polite) unless a failure blocks you; no
  motion until gate 4 (and none after it: below).

## House rules

- **A band, so square:** `--paper`, the full width, a 2px `--line` rule below and no other frame.
  Under the top bar it reads as a second band of the bar; the content starts under its rule.
- **Part of the content.** First in the scroll region, so it scrolls away with the content. It
  never floats, pins or covers anything, so it needs no shadow and no blur to separate it.
- **A glyph and words, always.** The palette is monochrome, so nothing is said by colour: the
  glyph says which kind before you read, the words say what's true and what it means.
- **At most one action, no close.** A banner goes when it stops being true: online again,
  reloaded, loaded.
- **Appears in place, and goes the same way, at gate 4 too.** A band that arrives pushes the
  content under it down, and that push is layout; motion moves only `transform` and `opacity`. A
  slide would have to animate the band's height or move everything under it, and a fade would
  only delay the words after the content had already jumped. So it has no motion and no
  reduced-motion counterpart to need.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Band | `.banner` + `role="status"` (or `"alert"`) | Flex, wrapping, items at the start, `8px` × `12px` gaps. Padding `8px` and the `--gutter` a side. `--type-body`, ink on `--paper`, `border-block-end: 2px solid var(--line)`. Sets `--card-ink` and `--card-bg`, so its Button reads its surface. Straight in a frame's scroll region (`.frame__scroll > .banner`) it reaches over the region's side padding (negative `--frame-pad-start` and `--frame-pad-end`) and takes them as its own, as a plain List does; first in the region it also spends the region's 24px top padding (`margin-block-start: -24px`), so it meets the top bar's rule. |
| Glyph | `.banner__icon` on an `.ic` | `ic--offline`, `ic--refresh` or `ic--warning`. 20px, centred on a 44px row. `aria-hidden`. |
| Words | `.banner__text` | A `<p>`. The news first, in a `<strong>` at 600; then what it means, at 400. `flex: 1 1 min(10rem, 100% - 20px - 12px)`: 10rem beside an action before the action moves under it, and never so wide it leaves the glyph. At most `--measure` wide. Padded so the first line centres on the 44px row, so a band is as tall with or without an action. |
| Action | `.banner__action` on a `.btn` | At most one. Button's secondary. `margin-inline-start: auto`: at the trailing end, or under the words, at the end. Reload, Try again. |

```html
<div class="frame__scroll">
  <div class="banner" role="status">
    <span class="ic ic--offline banner__icon" aria-hidden="true"></span>
    <p class="banner__text"><strong>You're offline.</strong> Changes are saved on this device.</p>
  </div>
  …
</div>
```

**Raising one.** A live region announces a change to itself, not its own arrival. So the app keeps
the band in the markup, empty, and fills it to raise it, and empties it to take it down:

```html
<div class="banner" role="status"></div>
```

Empty (`.banner:empty`, so nothing inside, not even a space) it is `position: absolute` with no
padding and no rule: out of the flow and undrawn, it costs the screen nothing, not even the
scroll region's 32px gap, and it stays in the accessibility tree. A blocking failure is the
exception: an element with `role="alert"` is announced when it's inserted, so it can be put in
whole.

## Variants

Each is shown under a top bar, with its markup, in `elements/banner.html` under Variants
(2.1–2.3).

| Variant | Recipe | Use | Notes |
| --- | --- | --- | --- |
| Offline | `ic--offline`; "**You're offline.** Changes are saved on this device."; `role="status"` | No connection; everything still works from this device. | No action (nothing to do) and no close (closing it wouldn't make it untrue). Up while it's true. |
| Update ready | `ic--refresh`; "**A new version is ready.**"; `.banner__action` Reload; `role="status"` | A new version has downloaded and is waiting. | It can wait for the end of a session, so it never interrupts. An installed app has no reload button of its own: this is the way to the new version short of closing the app. |
| Failure | `ic--warning`; "**Couldn't load your decks.**"; `.banner__action` Try again; `role="status"`, or `"alert"` when it blocks | Something about the whole screen didn't work. | Status while the screen still shows something you can use (the decks from last time). `role="alert"` only when nothing on the screen works until it does. When there is nothing to show at all, the failed card in the content says it instead (`elements/states.md`), once, where the decks would be. |

## States

The band doesn't press, lift or fill; its action is Button's.

| State | Trigger | Look | Also |
| --- | --- | --- | --- |
| Waiting | `.banner:empty` | Nothing: no room, no rule. | In the accessibility tree, ready to speak. |
| Rest | filled | The band. | Announced once, politely (status) or at once (alert). Focus doesn't move. |
| Action hover, focus, pressed | Button's | Hover lifts and fills; focus adds the ring, which fits in the band's 8px; press drops the lift and keeps the fill. | |
| Narrow, large text | the words need the row | The words wrap beside the glyph; the action moves under them, at the end. Taller, never wider. | |
| Blocking | `role="alert"` | The same band. | Read out at once. The only assertive banner. |
| Forced colours | `(forced-colors: active)` | The rule is `CanvasText`; the glyph is drawn in `CanvasText` (icons.css); the paper becomes the system background, so the rule sets the band off. | |

`.is-hover`, `.is-focus` and `.is-active` on the button force a state for the page.

## Accessibility

- `role="status"` for offline, update ready and a failure that leaves the screen usable;
  `role="alert"` only for a failure that blocks it. Never both on one screen about one failure.
- It never takes focus. It comes first in the content, so it is the first thing read after the
  top bar and the first Tab stop after it when it has an action.
- The glyph is `aria-hidden`; the words carry everything. Nothing is said by colour, and the band
  keeps its rule and glyph in forced colours.
- The action is a 44px Button with a verb ("Reload", "Try again"). There is no close button to
  label, because nothing can be closed that's still true.
- One at a time: the one that changes what you can do now (a blocking failure, then offline,
  then update ready). The app decides; CSS doesn't stop two.

## Platforms

- **Installed PWA:** wave 5's service worker raises it for real: offline from the browser's
  `offline` and `online` events, update ready when a new worker is installed and waiting, Reload
  hands over to it and reloads. Keep the empty band in each screen's markup so it can speak.
  Edge to edge with the content, inside the safe areas the frame already pads.
- **Mac:** the same band at the top of the window's content, under the toolbar, scrolling with
  it. The toolbar is system chrome; the band is ours.
- **SwiftUI:** the first row of the screen's `ScrollView` (or a `List` row with no insets), not a
  `.safeAreaInset(edge: .top)`, which would pin it. `HStack(alignment: .firstTextBaseline)` of our
  glyph as a `Path` and `Text`, `.padding(.vertical, 8)`, `.background(.paper)` and a 2pt
  `Rectangle()` below. Announce it with `AccessibilityNotification.Announcement`; for a blocking
  failure, give the announcement high priority.

## Do and don't

- **Do** put it first in the scroll region, say what's true and what it means, and offer one way
  on.
- **Do** take it down the moment it stops being true.
- **Don't** float it, pin it or lay it over content.
- **Don't** give the offline banner a close, or any banner a tinted fill to say what kind it is.
- **Don't** use one for "it's done" (that's a Toast) or for a question (that's a Dialog).
- **Don't** say one failure twice: a banner and a failed card.

## Known limits

- First in a frame's scroll region it spends the region's 24px top padding by copying the value
  (`calc(var(--space-5) * -1)`); if Frame changes that padding, this has to follow. A token for
  it in `frame.css` would remove the copy.
- `:empty` doesn't match an element holding only whitespace, so the waiting band must be written
  with nothing between its tags.
- Whether a filled status band is announced was checked in Chromium's accessibility tree only, not
  with VoiceOver, NVDA or TalkBack. The starter's worker raises it in Chromium; a check on a device is carried (`STYLE.md` §1).
