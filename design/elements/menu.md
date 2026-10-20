# Menu

Element 21 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/menu.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Menu's own spec.

## Brief

*A short list of actions behind one control.*

- **Markup:** the native `popover` attribute with `popovertarget` on a Button (icon-only
  `ic--more` or "Sort"). Inside, a list of Buttons, quiet and full width. A destructive item is
  last, separated by a rule, and says what it does ("Delete deck…").
- **Behaviour:** Escape and light dismiss come native. No ARIA menu pattern (arrow keys) unless
  the page proves it's needed; the spec says why. Anchor it with CSS anchor positioning where
  supported, and fall back to a fixed sheet at the bottom of a phone.
- **Copy:** Rename, Duplicate, Export, Delete deck….
- **Mac:** menus are system chrome natively (`STYLE.md` §4); this is the phone's and the web's.

## House rules

- **No script.** `popovertarget` opens and closes it; the browser gives Escape, light dismiss
  (a click or tap outside), one open menu at a time, focus back to the button, and the button's
  expanded state for screen readers. Items close it with `popovertargetaction="hide"`; the app's
  own click handler does the action. There is no `menu.js`.
- **The surface holds, so it's a container:** square (`--radius-card`), a 2px `--line` frame on
  `--paper`, and no shadow: a shadow means "press this".
- **The items act, so they're pills:** Button's quiet block buttons, words at the start.
- **A destructive item is last, after a rule,** and its words carry it ("Delete deck…"). The
  palette is monochrome: no red, ever. The ellipsis promises a question (Dialog, wave 4) or an
  Undo before anything goes.
- **The button stays down while its menu is open** (`--lift: 0; --fill: 1`), so you can see
  which button owns it.
- **It fades in at its anchor and fades out.** Only opacity; the button goes down, and focus moves,
  at once (Motion, below).

## Why not the ARIA menu pattern

`role="menu"` promises arrow keys, type-ahead, Home and End, and focus moved into the menu on
open; without them it's worse than nothing, because screen readers switch into a mode where Tab
does nothing useful. A popover of plain buttons needs no script and makes no promise it can't
keep: Tab and Shift-Tab move through the items (the browser puts an open popover right after its
button in the tab order), Enter or Space presses one, Escape closes and puts focus back on the
button. Four or five items are as quick to Tab through as to arrow through. The pattern would be
needed only for long menus or nested submenus, and we have neither: past seven items it's a
screen, and we don't nest. So the items are buttons, the popover has no role, and the spec says
so instead of the markup claiming otherwise.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Button | `.btn` with `popovertarget` | Button: icon-only quiet (`.btn--quiet.btn--icon`, `ic--more`) with a name saying whose actions ("More for Shapes"), or with words ("Sort"). `type="button"`. The menu comes right after it in the markup. |
| Surface | `.menu` with `popover` | Flex column, 4px between items, 8px padding. `inline-size: fit-content`, at least 12rem (or all the room beside the button, if less), at most the screen less 16px a side; at most the screen's height less 16px a side, scrolling inside (`overscroll-behavior: contain`). `--type-body`, ink on `--paper`, a 2px `--line` frame, `--radius-card`, no shadow. Resets `--card-ink` and `--card-bg`, so its buttons read its surface even when the menu's button sits on an ink card. |
| Item | `.menu__item` on `.btn.btn--quiet.btn--block` | Words at the start (`justify-content: flex-start`, `text-align: start`), 16px a side, wraps. `popovertarget` + `popovertargetaction="hide"` closes the menu. One to three words, a verb first. |
| Rule | `.menu__rule` | An `<hr>`: no border but a 1px `--line` top, the menu's full width (negative 8px inline margins), 4px above and below. Exposed as a separator. |
| Destructive item | `.menu__item`, last | After the rule. "Delete deck…": the words say what goes. |

```html
<button class="btn btn--quiet btn--icon" type="button"
        popovertarget="shapes-menu" aria-label="More for Shapes">
  <span class="ic ic--more" aria-hidden="true"></span>
</button>
<div class="menu" id="shapes-menu" popover>
  <button class="btn btn--quiet btn--block menu__item" type="button"
          popovertarget="shapes-menu" popovertargetaction="hide">Rename</button>
  <button class="btn btn--quiet btn--block menu__item" type="button"
          popovertarget="shapes-menu" popovertargetaction="hide">Duplicate</button>
  <button class="btn btn--quiet btn--block menu__item" type="button"
          popovertarget="shapes-menu" popovertargetaction="hide">Export</button>
  <hr class="menu__rule">
  <button class="btn btn--quiet btn--block menu__item" type="button"
          popovertarget="shapes-menu" popovertargetaction="hide">Delete deck…</button>
</div>
```

## Placement

The browser centres a popover on the screen; `.menu[popover]` places it instead, by its implicit
anchor (the button that opened it), inside `@supports (position-area: block-end)`:

1. **Under the button,** its end edge on the button's end edge, 4px off
   (`position-area: block-end span-inline-start`).
2. **Over it,** if there's no room under it (`flip-block`).
3. **The other way along,** from the button's start edge, if the button is near the start of
   the screen (`flip-inline`, and both flips together).
4. **The screen's height, centred, over the button,** scrolling inside, if it fits on neither
   side: only at very large text sizes on a phone (`@position-try --menu-tall`, and its
   `flip-inline`).

**Without anchor positioning** (`@supports not (position-area: block-end)`) it is a sheet across
the bottom of the screen: edge to edge on a phone, at most 30rem and centred on a wide one, no
bottom frame, and it owns the bottom safe area (`--safe-bottom`), as a bar does.

Why not the bottom sheet as the last anchored fallback too: in Chromium 141 a `@position-try`
option that doesn't use the anchor (`position-area: none` and insets) stopped being chosen once
the page had scrolled. The centred option still uses the anchor in the inline axis, and works.

Checked by opening every menu on the List and Menu pages with its button near the top, the
middle and the bottom of the screen, at 320, 390 and 1440px, 100% and 200% text: 90 openings,
all fully on screen, no sideways scroll.

## Variants

Shown live, with markup, in `elements/menu.html` (2.1–2.2).

| Variant | Button | Use | Notes |
| --- | --- | --- | --- |
| More | `.btn--quiet.btn--icon` with `ic--more` | A thing's other actions: Rename, Duplicate, Export, Delete deck…. | The name says whose ("More for Shapes"). A list row's More button is List's `.list__actions`. |
| Sort | `.btn` with words | A choice of order for a list: Name, Most due, Recently studied. | The items are Button's toggles (`aria-pressed`): the current order has the check and the selected ring; the others keep the check's empty slot so the words line up. The app moves the check. No destructive item, no rule. |

## States

| State | Trigger | Look |
| --- | --- | --- |
| Closed | none | Just the button, as Button draws it (quiet: no frame until hover or focus). |
| Open | `:popover-open` | The menu, placed as above; the button down: `--lift: 0; --fill: 1`, through `.btn:has(+ .menu:popover-open)`. |
| Item hover, focus, pressed | Button's | Quiet hover fills and lifts; focus adds the 3px ring; press drops the lift and keeps the fill with the inner ring. |
| Current choice | `aria-pressed="true"` on an item | Button's toggle: the check and the selected ring, never a fill. |
| Forced colours | `(forced-colors: active)` | The frame and rule are borders, so the system paints them; the open button paints `Highlight` with `HighlightText`; items are Button's (framed in `ButtonText`). |

`.is-hover`, `.is-focus` and `.is-active` on items and on the button force a state for the page.
Without the `popover` attribute a `.menu` simply sits in place, as an open one looks: the page
uses that for its anatomy and states.

## Motion

Gate 4. The menu fades: in over `--dur-hover` (`--ease-out`), from a first frame in
`@starting-style`; out over `--dur-press`, with `display` and `overlay` changing at the end
(`transition-behavior: allow-discrete`), so a closing menu stays in the top layer, at its anchor,
until it has faded. Under reduced motion both are `--dur-fade`.

- **Why only a fade, not a slide from the button.** The browser picks the placement (under, over,
  the other way along, or the full height), and CSS can't tell which it picked, so a move could
  point away from the button. A fade comes from wherever the menu is: "from its anchor" is where
  it appears, not a direction.
- **Nothing waits for it.** The button's down look is instant (it's the open state, not the
  fade); Escape, a click outside, an item and a second press close it at once and focus goes back
  to the button as before. Escape works mid-entrance.
- **Only a real popover moves:** a `.menu` without `popover` (the page's pictures) stands still,
  and nothing moves on load.
- **Where it isn't supported, it appears in place.** No `@starting-style`: in place. No
  `overlay` (Safari and Firefox, for now): a closing menu would leave the top layer at once, so the
  way out sits inside `@supports (overlay: auto)` and elsewhere it goes in place.
- **Checked** in Chromium 141: the More menu sampled at 0, 50 and 100% of its entrance and exit,
  with motion and reduced; its box didn't move during the exit (the anchor holds); keyboard open,
  Tab in, Escape mid-entrance, focus back on the button; no sideways scroll at 320, 390 or 1440px.

## Accessibility

- The button's name says what it opens ("More for Shapes", "Sort"); the browser exposes it as
  expanded or collapsed. Don't add `aria-haspopup`: it would announce a menu role that isn't
  there.
- Focus stays on the button when the menu opens; the next Tab goes into it, item by item, then
  on to whatever follows the button. Escape closes it and puts focus back on the button; so does
  pressing an item.
- The rule is an `<hr>`, a separator; the items are plain buttons in reading order.
- Every item is a 44px pill, the menu's frame stays visible in forced colours, and nothing leans
  on colour: the destructive item is its words.
- Tabbing past the last item leaves the menu open until a click elsewhere or Escape (native
  behaviour); a menu that should close on focus loss would need script, and this one doesn't.

## Platforms

- **Installed PWA:** anchored to its button on a phone too; a tap outside closes it. On browsers
  without anchor positioning it becomes the bottom sheet, which owns the home indicator's safe
  area. Items say what they do; destructive ones ask or offer Undo.
- **Mac:** menus are system chrome. In SwiftUI and in a web shell's native menu, each item is in
  the menu bar with a shortcut, and the More menu is also a context menu
  (`.contextMenu(forSelectionType:)`). This element is for the web and the phone.
- **SwiftUI:** `Menu { Button("Rename") {…}; Button("Duplicate") {…}; Button("Export") {…};
  Divider(); Button("Delete deck…", role: .destructive) {…} } label: { Image(systemName:
  "ellipsis") }` with `.accessibilityLabel("More for Shapes")`. Sort is a `Picker` in a `Menu`,
  which draws the check. Both are system chrome, so the system's look and its destructive colour
  are the system's, not ours.

## Do and don't

- **Do** keep it short and verbs first; put a destructive item last, after the rule.
- **Do** name an icon-only button for what it acts on.
- **Don't** make a menu the only way to an action: a list row's swipe and its More menu offer the
  same, and the Mac puts it in the menu bar.
- **Don't** nest menus, add a shadow or round the corners.
- **Don't** add `role="menu"` without the keyboard it promises.

## Known limits

- The open button's "down" look and its forced-colours highlight use `:has()` and need the menu
  right after the button.
- The implicit anchor (the button that opened it) is newer than anchor positioning itself; a
  browser with anchor positioning but without implicit popover anchors places the menu at its
  default. Checked in Chromium 141, where both work.
- Chromium supports anchor positioning, so the no-anchor sheet never shows there; it was
  checked by applying its declarations by hand (390 and 1440px): edge to edge on the phone,
  30rem and centred on the wide screen.
- The fade out needs `overlay`, which only Chromium has; in Safari and Firefox a menu fades in and
  goes in place (Motion).
- Checked in Chromium only (keyboard, touch, forced colours, script off, motion frame by frame),
  not on an iPhone, in Safari or in Firefox.
