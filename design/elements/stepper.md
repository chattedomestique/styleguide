# Stepper

Element 12 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/stepper.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Stepper's own spec.

## Brief

*A small whole number, one step at a time.*

- **Markup:** − and + icon-only buttons (Button's 44px circles) around a value that is an
  `<input inputmode="numeric">`, so it can also be typed.
- **Notes:** it has a minimum and a maximum. At a limit, that button is `aria-disabled`, says why,
  and stays focusable. Changes are announced through the input's value; the buttons say what they
  do ("Fewer cards", "More cards"). Copy: Cards per session (5–50, step 5).

## House rules

- **Nothing new to draw.** The buttons are `.btn` `.btn--icon` and keep Button's states (lift,
  fill, the inner ring, dashed when disabled). The value is `.field__input` and keeps Field's
  (frame, hover, ring, doubled frame when invalid, dashed when disabled). The label, help and
  error are Field's, in Field's order. `stepper.css` only lays them out and sizes the value.
- **The value holds text, so it is square; the buttons act, so they are round** (rule 3).
- **The script is the enhancement.** The buttons ship `hidden`; `js/components/stepper.js` shows
  them, steps the value, and marks a limit. Without it the stepper is a number field you type in,
  with no buttons that do nothing.
- **At a limit, unavailable but still there.** The button is `aria-disabled="true"`: dashed and
  faint, still in the tab order and still focused if it was, and a press reads out why (the help)
  instead of doing nothing.
- **Typing is never corrected under your fingers.** The script steps only on a button or an arrow
  key. A typed 70 stays 70 until the form checks it: the input's `pattern` (`5|[1-4][05]|50` for 5–50 in fives) makes it invalid, so native validation and Form's error both catch it. The next step brings it into range.
- `:hover` only inside `@media (hover: hover)`.
- Motion (gate 4): nothing of its own. The circles move as Button's do, the value's ground as
  Field's; the number changes at once.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Field | `.field` | Field's column: label, help, error, then the stepper. |
| Stepper | `.stepper` | Flex row, `gap: 8px`, centred, wraps. An inline-size container (`container: stepper / inline-size`), so it can reflow by its own width; `min-inline-size: min(100%, 10.5em)` keeps it from collapsing in a flex row. |
| Fewer | `.btn` `.btn--icon` `.stepper__down` | `<button type="button" aria-label="Fewer cards">` with `.ic--minus`. `aria-controls` the value, `aria-describedby` the help. Ships `hidden`. |
| Value | `.field__input` `.stepper__input` | `type="text" inputmode="numeric" pattern="[0-9]*"`, `autocomplete="off"`, `enterkeyhint="done"`. `data-min`, `data-max` and `data-step` hold the range. Three digits wide (`3ch` plus 12px padding a side and the frame), centred, tabular figures, `flex: none`. |
| More | `.btn` `.btn--icon` `.stepper__up` | "More cards", `.ic--plus`; otherwise as Fewer. |
| Status | made by the script | A visually hidden `<span role="status">` (`.sr-only`) appended to `.stepper`: it reads out each new value, and the reason at a limit. |

```html
<div class="field">
  <label class="field__label" for="per-session">Cards per session</label>
  <p class="field__help" id="per-session-help">From 5 to 50, in fives.</p>
  <div class="stepper">
    <button class="btn btn--icon stepper__down" type="button" aria-label="Fewer cards"
            aria-controls="per-session" aria-describedby="per-session-help" hidden>
      <span class="ic ic--minus" aria-hidden="true"></span>
    </button>
    <input class="field__input stepper__input" id="per-session" type="text" name="per-session"
           inputmode="numeric" pattern="[0-9]*" value="20" autocomplete="off" enterkeyhint="done"
           data-min="5" data-max="50" data-step="5" aria-describedby="per-session-help">
    <button class="btn btn--icon stepper__up" type="button" aria-label="More cards"
            aria-controls="per-session" aria-describedby="per-session-help" hidden>
      <span class="ic ic--plus" aria-hidden="true"></span>
    </button>
  </div>
</div>
<script src="…/js/components/stepper.js"></script> <!-- or dist/flashcards.js -->
```

Why `type="text"` and `data-*` rather than `type="number"` with `min`, `max` and `step`: Field
chose it for its number variant (no spinner arrows, no scroll wheel nudging the value, no "e" or
"-" accepted silently), and the stepper keeps one number input for the whole system. `min`,
`max` and `step` aren't valid on a text input, so the range lives in data attributes and in the
help, in words.

## Variants

One: the stepper. A stepper is for a small range in even steps (Cards per session, 5 to 50 in
fives). A wide range or an exact value is Field's number variant.

## Layout

The three sit in a row, about 10em wide: two 2.75em circles, two 0.5em gaps and three digits with
their padding. Below 10.5em, which is a small phone at large text (at 200% a 320px screen gives
it about 7em), the stepper reflows: the value takes the first row, the whole width, and the
buttons go under it, one at each end, so − stays left of +. The value moves visually with
`order`; the tab order stays −, value, +.

## Behaviour (`js/components/stepper.js`)

- Shows both buttons, adds the status line, and sets each button's `aria-disabled` from the value:
  − at or below `data-min`, + at or above `data-max`. It updates them on every `input`, so a
  typed 50 marks + too.
- A press (click, tap, Space or Enter) on an available button steps the value: from a value on a
  step, by one step; from a typed value between steps (37), to the next step that way (40 or 35);
  from an empty value, to the minimum. Always clamped to the range. It sets the value, fires
  `input` and `change` (bubbling), and puts the new value in the status line.
- A press on an `aria-disabled` button changes nothing and puts the text of its
  `aria-describedby` (the help: "From 5 to 50, in fives.") in the status line.
- Up and Down inside the value step the same way.
- Repeated identical messages are varied with an invisible no-break space, so a second press at
  the limit is read out again.
- About 70 lines, no dependencies, one IIFE; ships in `dist/flashcards.js`.

## States

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | Two flat 2px circles, a square value on paper. |
| Hover | button `:hover`, only inside `@media (hover: hover)` | 1 | 1 | Button's: filled, 4px hard shadow. The value's ground turns to `--canvas` (Field). |
| Focus | `:focus-visible` | 1 | 1 | On a button: Button's lift and fill plus the 3px ring. On the value: Field's ring (it shows on a click too, with the caret). |
| Pressed | button `:active` | 0 | 1 | Button's: down, filled, the 2px inner ring. The value has already moved on. |
| At a limit | `aria-disabled="true"`, set by the script | 0 | 0 | Button's disabled: dashed frame, `--ink-faint` glyph, no fill. Still focusable; a press reads out the help. |
| Invalid | `aria-invalid="true"` on the value (Form, on submit) | – | – | Field's doubled frame and `.field__error` above: "Pick a number from 5 to 50, in fives". A button beyond the limit is `aria-disabled` as usual. |
| Disabled | `disabled` on the value and both buttons | – | – | Field's and Button's disabled: all dashed and faint, out of the tab order. The label goes faint; the help says why ("Finish the current session to change this"). |
| Forced colours | `(forced-colors: active)` | | | Button's and Field's own: frames in `ButtonText`, hover and focus a 4px `Highlight` outline on the buttons, pressed a `Highlight` fill, disabled and at a limit `GrayText`; invalid a 4px frame. |

`.is-hover`, `.is-focus` and `.is-active` (Button's and Field's) force a state for the page and
for tests. They are not API.

## Accessibility

- The value is a textbox named by the label ("Cards per session, 20, edit text") and described by
  the help. The buttons are named for what they do, "Fewer cards" and "More cards", not "minus"
  and "plus"; the value is never in their names, so they don't change name under the cursor.
- Each step is announced through the status line ("25"), because a value changing in another
  control isn't read out on its own.
- At a limit the button stays focusable with `aria-disabled`, and its description is the range,
  so a screen reader reads it as unavailable, with "From 5 to 50, in fives." as its description. A press repeats the
  reason. Focus never jumps away.
- Tab order: Fewer, value, More. Every target is at least 44px (88px at 200% text).
- Keyboard: Space and Enter on the buttons; typing, Up and Down in the value. Checked in Chromium:
  20 → 25 → 30 by Enter and Space, stops at 50 with + `aria-disabled` and focused, down to 5 with
  − `aria-disabled`, a typed 37 steps to 40, then 35 and 30.
- Without script, the buttons stay hidden and the value is an ordinary typable field (checked with
  JavaScript off).

## Platforms

- **Installed PWA:** `inputmode="numeric"` brings up the number pad; `enterkeyhint="done"` labels
  its Return. Button's `touch-action: manipulation` means quick taps on More cards step instead of
  zooming the page. 16px text, so iOS doesn't zoom on focus.
- **Mac:** Up and Down step from inside the value, as in a Mac number field with a stepper beside
  it. Every target stays 44px until the pointer density switch arrives.
- **SwiftUI:** on iOS, our layout: an `HStack` of two 44pt `Button`s in `Circle()` strokes around
  a `TextField(value:format: .number)` with `.keyboardType(.numberPad)` and `.monospacedDigit()`,
  the buttons `.disabled(true)` only for the whole control and otherwise kept enabled at a limit
  with `.accessibilityHint("From 5 to 50, in fives")`; give the field
  `.accessibilityAdjustableAction(_:)` so VoiceOver's swipe up and down steps it. The system's
  `Stepper` is 32pt tall, under the 44pt target. On the Mac, the system's convention: a
  `TextField` with a native `Stepper` beside it (`Stepper(value:in:step:)`, label hidden), which
  brings the arrow keys and the system look.

## Do and don't

- **Do** put the range in the help, in words, before anyone hits it.
- **Do** name the buttons for what they do: "Fewer cards", "More cards".
- **Do** keep a button at its limit focusable and explain on press.
- **Don't** hide a button or truly disable it at a limit.
- **Don't** correct a typed value while someone is typing; the `pattern` and the form check it on submit.
- **Don't** use a stepper for a wide range or an exact value; that's a number field.
- **Don't** round the value's frame: it holds a number.

## Known limits

- The buttons need script. Without it they stay hidden, so the page's printed markup (read after
  the script ran) shows them without `hidden`; the source must carry it.
- The status line can double up with a screen reader that also reads the value's change when the
  arrow keys step inside it.
- There is no hold-to-repeat on the buttons; each press is one step.
- The reflow below 10.5em moves the value above the buttons with `order`, so on that one layout
  the visual order (value, then −, +) differs from the tab order (−, value, +).
- `.stepper` is an inline-size container: its width is its parent's, with a floor of 10.5em.
- Checked in Chromium only, with touch and forced-colours emulation. Not with VoiceOver or NVDA
  (the status line and `aria-disabled` announcements), not on an iPhone, in Safari or in
  Firefox.
