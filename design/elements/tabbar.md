# Tab bar

Element 16 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/tabbar.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Tab bar's own spec.

## Brief

*The three to five places at the root of a phone app.*

- **Parts:** items with an icon and a label always, never icon-only; `aria-current="page"` on
  the current one; room for a Badge.
- **At 200% text,** which screens found wraps, the labels may go to two lines but the bar grows
  in height, never sideways. Write down why we don't copy iOS's fixed bar with a long-press
  preview: the web has no large-content viewer.
- **Notes:** owns the bottom safe area; hidden when the on-screen keyboard is up, if that can be
  done without script, otherwise noted for wave 5; copy: Today, Decks, Settings (`ic--today`,
  `ic--decks`, `ic--settings`).

## House rules

- **Places, as links.** Each item is an `<a href>` in a list in a `<nav>`; here wears
  `aria-current="page"`. Nothing in the bar is an action.
- **Icon and word, always.** The label is a bar label, so `--type-label`, uppercase (rule 4).
- **The indicator acts.** The icon sits in a pill (`.tabbar__icon`), and that pill is what fills,
  lifts, rings and is marked: it's the thing you act on, so it's round (rule 3). The target is
  the whole item, at least 44px each way.
- **Here is a doubled frame,** as on a selected card: a 2px frame and a 2px ring. Never a fill
  alone, which reads as pressed. In forced colours it becomes a 4px frame.
- **It grows taller, never wider.** An item that no longer fits beside the others takes a second
  row.
- **Edge to edge, and it owns the bottom safe area.** Paper, a 2px rule on top, bottom padding
  `max(8px, var(--safe-bottom))`.
- Hover only inside `@media (hover: hover)`.
- Motion (gate 4): the indicator's two numbers ease, as Button's do. Nothing slides between
  items (Motion, below).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Bar | `.tabbar` | A `<nav aria-label="Places">`. Padding `4px max(8px, var(--safe-right)) max(8px, var(--safe-bottom)) max(8px, var(--safe-left))`. Paper; `border-block-start: 2px` in `--line`. In a frame it also wears `.frame__bottom`. |
| List | `.tabbar__list` | `<ul role="list">`. Flex, wrapping, 4px between rows. Each `li` is `flex: 1 1 0` (equal shares) with `min-inline-size: fit-content`: never narrower than its label, never wider than the bar. |
| Item | `.tabbar__link` | `<a href>`. A column: indicator, then label, 8px apart (room for the indicator's ring and lift). Padding 4px 8px, `min-block-size: 44px`. Owns `--lift`, `--fill` and the three shadows the indicator draws. `touch-action: manipulation`. |
| Indicator | `.tabbar__icon` | A pill, `3.5rem × 2rem`, 2px frame (transparent until here or filled). Colour, fill and frame are each a `color-mix()` of rest and filled by `--fill`; `box-shadow` is press, select, lift, as on Button. `position: relative`, so a badge pins to it. The icon inside is `--ic-size: 1.5rem`. |
| Label | `.tabbar__label` | `--type-label`: 13px, 700, condensed, uppercase, +0.08em. Centred. `overflow-wrap: anywhere` only for a single word wider than the whole bar. |
| Badge | `.badge` (Tag and Badge) | Pinned to the indicator's top end, `aria-hidden`. The count goes in the link's name through a `.sr-only` span: "Decks, 7 due". |

## Variants

Each is shown live, with its markup, in `elements/tabbar.html` under Variants (1.1–1.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Three places | `.tabbar` | The app's places. | Today, Decks, Settings. |
| With a badge | `.badge` in `.tabbar__icon` | A count worth a look. | One place at a time; "99+" past 99. |
| Four or five places | `.tabbar` | More places. | Four fit a 320-point phone at 100% text. Five is the most: past that, the places are a list on their own screen. |

## States

`--lift` (0 flat, 1 raised) draws `--shadow-lift`, a hard 4px shadow; `--fill` (0 rest, 1 filled)
turns the indicator ink and its icon paper. Filled and not lifted draws `--shadow-press`, a 2px
paper ring inside. Here draws `--shadow-select`, a 2px ring outside a 2px frame.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | No frame on the indicator; icon and label in ink. |
| Hover | `:hover`, only inside `@media (hover: hover)` | 1 | 1 | The indicator fills and lifts. |
| Focus | `:focus-visible` | 1 | 1 | The hover look and the ring round the indicator, 3px out. Round the indicator, not the item: round the item it would run off a bar with no safe area below it. |
| Pressed | `:active` | 0 | 1 | Down, filled, the inner ring. On a phone, the only feedback. |
| Here | `aria-current="page"` | | | The indicator's frame shows and doubles (`--shadow-select: 0 0 0 2px`). Lift and fill still work on top. |
| Here, focused | both | 1 | 1 | Frame, fill, and the ring with a 3px gap: focus never looks like here. |
| Large text | an item won't fit beside the others | | | It wraps to a second row; the bar grows taller. |
| Keyboard up | `.frame[data-keyboard]`, set by `frame.js` | | | `display: none` (below). |
| Forced colours | `(forced-colors: active)` | | | The rule is `CanvasText`. Here: the indicator's frame goes to 4px in `CanvasText`. Hover and focus: a 4px `Highlight` outline. Pressed: `Highlight` fill, the icon in `HighlightText`. |

`.is-hover`, `.is-focus` and `.is-active` force a state for the page and for tests. They are not
API.

**Large text, decided.** At 200% text three labels don't fit across a phone ("SETTINGS" alone is
about 140px). The bar keeps every label whole and readable and lets an item take a second row,
so the bar grows taller and never scrolls sideways or cuts a word. On `screens.html` that's
Today and Decks on one row and Settings on the next, 306px with the home indicator. We don't
copy iOS, which keeps its tab bar one row high at every text size and shows a large copy of an
item when it's pressed and held: that large-content viewer is the system's, and the web has
nothing like it, so a label that didn't grow would simply be unreadable to the people who
asked for large text.

**The keyboard, decided (wave 5).** While the on-screen keyboard is up the bar hides, so the
field has the room. Frame does it: `frame.js` sees the keyboard as lost viewport height
(`visualViewport`) while a text field has focus and sets `data-keyboard` on the frame, and
`frame.css` hides the bar under it (`elements/frame.md`, Keyboard). Without script, or where the
browser shows nothing, the bar stays. An iPad with a hardware keyboard keeps it: its shortcut bar
takes too little height to count. The wave 3 rule that guessed from focus alone is gone.

**Motion.** `.tabbar__link` transitions `--lift` and `--fill` over `--dur-hover` with
`--ease-out`, and a press lands over `--dur-press`, as Button's does; the indicator draws both.
Here (the doubled frame) and the ring are instant, and nothing travels from one item to the
next: a sliding indicator would be a moving fill, and here is a frame, not a fill. Under reduced
motion the lift appears at once and the fill fades over `--dur-fade`. The bar hiding for the
keyboard is instant: the keyboard is already moving.

## Accessibility

- A `<nav aria-label="Places">` with a list of links: the count is announced ("list, 3 items")
  and here is announced by `aria-current="page"` ("current page").
- Every item has a visible word; the icon is `aria-hidden`. A badge's count is in the link's
  name, not read from the badge.
- Tab moves through the items in order, after the content (the bar is last in the frame).
- Each item is at least 44 × 44px; at 100% text on a 390-point phone each is about 123 × 64.
- Here never relies on colour: a doubled frame, a 4px frame in forced colours.

## Platforms

- **Installed PWA:** it owns `--safe-bottom`, so it sits above the home indicator with its paper
  running behind it. It hides while the keyboard is up, where the browser shows it. It never
  hides on scroll.
- **Mac:** not used. Places on a Mac are the system sidebar (§4); in a web shell, Sidebar.
- **SwiftUI:** `TabView { … .tabItem { Label("Decks", image: "decks") } .badge(7) }`. The system
  draws it, with its own selection tint; at accessibility sizes it uses the large-content viewer
  that the web doesn't have.

## Do and don't

- **Do** keep the same places, in the same order, on every root screen.
- **Do** use one word per label, and the place's own name.
- **Don't** put an action ("Add", "Search now") in the bar, or drop the labels.
- **Don't** badge more than one place at once.
- **Don't** mark here with a fill, a colour, or the icon alone.
- **Don't** hide the bar on scroll.

## Known limits

- At 200% text on an 844-point phone the bar is 306px tall: over a third of the screen. That's the
  cost of readable labels.
- The keyboard is seen as lost height, emulated in Chromium and not yet checked on a device
  (`elements/frame.md`).
- Five places with long labels on a 320-point phone wrap to a second row even at 100% text.
