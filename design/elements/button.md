# Button

Element 02 · gates 0–2 done (wireframe, states) · page: `elements/button.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Button's own spec.

## Brief

*Starts an action.*

- **Parts:** the label, an optional leading icon.
- **Variants:** primary (filled with `--accent` and `--on-accent`, at most one per region);
  secondary (a 2px ink frame on paper); quiet (no frame until hover or focus, for bars and card
  feet); destructive (never primary, the words carry it, it always confirms or offers Undo, no
  red, ever); icon-only (a 44px circle with an `aria-label`); toggle (`aria-pressed`, for an
  on/off action such as Shuffle); block (full width, for phone forms); busy (`aria-busy`, a
  spinner and the label kept, no separate loading text); a row of buttons.
- **States:** the six, through `--lift` and `--fill`. Rest is flat (a shadow means pressable,
  and a pill already says so). Hover lifts. Press takes the lift away and keeps the fill.
  Disabled: prefer not disabling; when you must, `aria-disabled` and say why nearby.
- **Copy:** Start, Turn over, Got it, Not yet, Add a shape, Delete deck, Shuffle.
- **Notes:** one size, the target always 44px, the label `--text-sm` or larger. The card's
  `.card__action` and `.card__ctl` stay the card's for now; this spec says how they line up.
  On the Mac, system chrome keeps system buttons and ours are for content; in SwiftUI, a custom
  `ButtonStyle`.

## House rules

- **The class is `.btn`, not a spelled-out "button".** It sits on every action in every screen's markup,
  so it stays short. Modifiers follow the system's pattern: `.btn--primary`, `.btn--quiet`.
- A pill, always `--radius-pill`: it acts (rule 3). Never a square button, never a second size.
- Reads roles only. It reads the surface it sits on through `--card-ink` and `--card-bg`, so
  inside an ink card it inverts with no extra class; outside a card those fall back to `--ink`
  and `--paper`.
- Two numbers draw every state, exactly as on the card: `--lift` and `--fill`. The shadow is
  the lift alone; nothing moves the hit box.
- `:hover` only inside `@media (hover: hover)`. No transitions until gate 4.

## Anatomy

Two parts and the frame. One `<button>` (or an `<a>` when it navigates).

| Part | Class | Spec |
| --- | --- | --- |
| Frame | `.btn` | `inline-flex`, centred, `gap: 8px`. `min-block-size` and `min-inline-size` are `--hit` (44px). Padding 8px block, `min(24px, 8vw)` inline: 24px at every normal text size, capped on a phone at very large text so the label keeps its room. `border: 2px`, `--radius-pill`. `position: relative`, so a badge can pin to it. |
| Label | text | `--type-body` at weight 600, line-height 1.3: 16px, above the brief's `--text-sm` floor. Sentence case. Wraps between words (`text-wrap: balance`) at very large text; breaks a word only when it can't fit at all. |
| Leading icon | `.ic` (optional) | 20px (`--ic-size`), `aria-hidden`, before the label. Pulled 8px towards the curve so the label still looks centred. The busy spinner takes this slot. |

Component roles (set on `.btn`; a variant overrides them, never the colours directly):
`--btn-ink`, `--btn-bg`, `--btn-line` (the surface), `--btn-rest-ink`, `--btn-rest-bg`,
`--btn-rest-line` (the look at rest), `--btn-fill-ink`, `--btn-fill-bg` (the look when
filled). Colour, background and border are each a `color-mix()` of rest and fill by `--fill`.

## Variants

Each is shown live, with its markup, in `elements/button.html` under Variants (1.1–1.9).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Primary | `.btn--primary` | The one thing to press in a region. | `--accent` fill, `--on-accent` label, `--btn-line` frame. Already filled at rest, so `--fill` changes nothing and a press shows as the inner ring. |
| Secondary | `.btn` | Everything else that deserves a frame. | The default: no modifier. 2px frame on the surface. |
| Quiet | `.btn--quiet` | Bars, card feet, the way out next to a primary. | Transparent fill and frame at rest; the frame appears with the fill on hover, focus and press. Same padding as a framed button. |
| Destructive | recipe: `.btn` or `.btn--quiet` | Something that can't be taken back. | No class: the words carry it ("Delete deck": a verb and the thing). Never `.btn--primary`, never a colour. It asks first (the page shows the question card) or does it and offers Undo. |
| Icon-only | `.btn--icon` | When the glyph says it all. | A 44px circle, `padding: 0`. The button has the `aria-label`; the icon is `aria-hidden`. Combines with `.btn--quiet` for bars. |
| Toggle | `aria-pressed` | An on/off action: Shuffle. | The label never changes. On: the frame doubles (`--shadow-select`, as a selected card) and a check (`--icon-check`) leads the label, so on never reads as focus or as a primary. The button widens by the check. |
| Block | `.btn--block` | Phone forms. | `display: flex; inline-size: 100%` of its column. |
| Busy | `aria-busy="true"` | The press was heard; the work takes a moment. | The label stays. An empty `.spinner` (Meter) replaces the leading icon, so the width doesn't change. Lift and fill are held at 0 and the cursor is `progress`; the app ignores another press. |
| Row | `.btn-row` | Two or three choices side by side. | Flex, wraps, `gap: 12px`. Primary last, at the trailing end (Mac and iOS order). `.btn--block` buttons in a row share it (`flex: 1 1` three targets wide) and stack when narrower. |

**In a card.** A `.btn` in a card body takes the card's ink and fill: on paper it is ink on
paper, on a tone the tone shows through, on `data-tone="ink"` frame, label and shadow turn
paper. The card's ring rules apply too (`--ring-offset-in` inside the clipping frame). How it
lines up with the card's own slots:

- **`.card__action`** is the same geometry as `.btn btn--icon`: a 44px circle with a 2px frame
  in the card's ink. It differs in two ways: it doesn't lift (it sits at the clipping edge of a
  foot, where a shadow would be cut), and it fills with `--accent` rather than swapping ink and
  paper. When cards adopt Button, `.card__action` becomes `.btn btn--icon` and the card keeps
  only its placement; until then it stays the card's.
- **`.card__ctl`** is not a button style. It is the bar's square control, a 20px box in a 44px
  target that belongs to the frame (rule 3's one exception). It stays the card's.
- **`.card__foot`** today styles every `a` and `button` in it as a bare 44px foot link
  (negative margins, 8px padding), and that rule outranks `.btn`. A quiet `.btn` there gets
  squeezed against the foot's rule and the card's clipping edge. Until the card excludes
  `.btn` from that rule (lines in the wave report), put buttons in the body in a `.btn-row`.

## States

`--lift` (0 flat, 1 raised) draws `--shadow-lift`, a hard 4px shadow down and right in
`--btn-line`. `--fill` (0 rest, 1 filled) swaps ink and paper. Filled and not lifted is the
pressed state, and it draws `--shadow-press`: a 2px ring inside the frame,
`inset 0 0 0 calc((1 - lift) × fill × 2px)`. That ring is why a primary, already filled at
rest, still answers a tap on a touch screen where nothing hovers. Box-shadow order:
`--shadow-press`, `--shadow-select`, `--shadow-lift`.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | Flat. The pill says "pressable"; no shadow at rest. |
| Hover | `:hover`, only inside `@media (hover: hover)` | 1 | 1 | Filled, 4px hard shadow. Quiet gains its frame. Nothing moves. |
| Focus | `:focus-visible` | 1 | 1 | The hover look plus the ring: `3px solid var(--focus)`, offset 3px (2px inside a card). |
| Pressed | `:active` | 0 | 1 | Back down; the fill stays; the inner ring shows. After hover and focus, so it wins. |
| Selected | `aria-pressed="true"` | | | `--shadow-select: 0 0 0 2px var(--btn-line)` (the frame doubles, nothing shifts) and a leading check. Lift and fill still work on top. |
| Busy | `aria-busy="true"` | 0 | 0 | Held flat: a second press does nothing, so nothing promises one. `cursor: progress`. |
| Disabled | `aria-disabled="true"` (or `:disabled`) | 0 | 0 | Dashed frame, `--ink-faint` label and frame, no fill (a disabled primary isn't filled). Still focusable with `aria-disabled`, and `aria-describedby` points at the reason. Last in the file, so it beats every state. |
| Forced colours | `(forced-colors: active)` | | | Frames in `ButtonText`. Hover and focus: a 4px `Highlight` outline. Pressed: `Highlight` fill, `HighlightText` label. On: a 4px frame (the padding pays for it) and the check in `ButtonText`. Disabled: `GrayText`. |

`.is-hover`, `.is-focus` and `.is-active` force a state for the page and for tests. They are
not API.

## Accessibility

- A real `<button type="button">` (or `type="submit"` in a form). An `<a class="btn">` only
  when it goes somewhere; it keeps the hand cursor, buttons keep the arrow.
- Every button is at least 44 × 44px, measured on every page at 100% and 200% text.
- Icon-only: the `aria-label` is on the button and names the action ("Add a shape"), the icon
  is `aria-hidden`. A visible label is always better when there is room.
- Toggle: the name stays "Shuffle"; `aria-pressed` carries on and off. Space and Enter both
  toggle (native button behaviour).
- Busy: `aria-busy="true"` while the work runs. The label isn't replaced, so the name doesn't
  change under a screen reader's cursor. If the outcome matters, announce it elsewhere
  (`role="status"`), not in the button.
- Disabled: `aria-disabled="true"`, not `disabled`, so it stays in the tab order and its
  reason (`aria-describedby`) can be found. The app ignores its activation; CSS can't stop
  Enter.
- A badge inside: the count is in the button's name ("Decks, 7 due"); the badge is
  `aria-hidden` (Tag and Badge).
- The ring is never clipped: 3px out by default, 2px out inside a card. Focus never looks
  like on: focus fills and rings, on doubles the frame and shows a check.

## Platforms

- **Installed PWA:** touch has no hover, so pressed (fill and inner ring) is the only
  feedback, and every variant has one. The shell's `touchstart` listener turns `:active` on in
  iOS Safari. `touch-action: manipulation` drops the double-tap wait. Block buttons for phone
  forms; the study screen's Not yet and Got it are a `.btn-row` of two block buttons.
- **Mac:** system chrome (toolbar, alerts, sheets, menus) keeps system buttons; ours are for
  content. Every command a button runs is also in the menu bar with a shortcut. Return
  triggers the primary in a form or dialog; Escape the way out. Pointer density (24px) waits
  for the root density switch.
- **SwiftUI:** one custom `ButtonStyle` with an emphasis parameter (primary, secondary,
  quiet). It draws `Capsule()` fill and `strokeBorder(lineWidth: 2)`, reads
  `configuration.isPressed` for the inner ring, `.onHover(perform:)` for the lift (a capsule offset
  4pt behind, never `.shadow(radius:)`), and `@Environment(\.isFocused)`. Icon-only:
  `.labelStyle(.iconOnly)` with a 44pt `Circle()`. Toggle: `Toggle(isOn:)` with a
  `ToggleStyle` drawing the same capsule. Busy: a `ProgressView()` in the label's leading
  slot and `.disabled(true)` on the action only.

## Do and don't

- **Do** start the label with a verb and name the thing: "Add a shape", "Delete deck".
- **Do** keep one primary per region, last in its row.
- **Do** leave a button enabled and explain on press, rather than disabling it.
- **Don't** colour a destructive button. Say what it destroys and ask first, or offer Undo.
- **Don't** put a shadow on a button at rest, or move it on hover or press.
- **Don't** make a filter chip from a tag. A filter is a toggle button (or a segmented
  control, wave 2).
- **Don't** add a second size. If a button doesn't fit, the layout is wrong.

## Known limits

- In the wireframe `--accent` is ink, so on an ink card a primary and a secondary look alike at
  rest. Gate 3 gives the accent its own colour.
- A toggle widens by its check when it turns on, so neighbours in a row shift by about 28px.
- `.card__foot` styles every button in it (see In a card), until the card excludes `.btn`.
- Button reads the card's roles (`--card-ink`, `--card-bg`) as its surface. A wider set of
  surface roles (top bar, sheet) would replace those hooks.
- `color-mix()` with `transparent` (quiet) mixes through alpha while gate 4 animates `--fill`:
  brief translucency mid-transition.
