# Radio

Element 08 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/radio.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Radio's own spec.

## Brief

*One choice from a short list (two to six).*

- **Variants:** a group (always a `fieldset` with a `legend`); a group with help on each option.
- **Look:** a 24px circle, a 2px frame, and a 10px ink dot when chosen.
- **Shared with every wave 2 control:** a native `<input>` restyled with `appearance: none`; the
  `<label>` around it carries the 44px target; help and errors use Field's parts and order;
  chosen never rests on colour, and keeps its mark (the dot) in forced colours.
- **Notes:** the native arrow keys move the choice; a group has one tab stop. Copy: Card order
  (In order, Shuffled, Hardest first).

## House rules

- **Round:** it acts (rule 3), and every platform draws a radio as a circle. `--radius-pill`.
- **Always a group.** A radio on its own can't be unchosen, so it is never alone: a
  `<fieldset>`, a `<legend>` that asks the question, and one `name` for its options. Past six
  options it's a select (Select, wave 2).
- **Native first.** Real radios, so one tab stop per group and the arrow keys come free.
- **The same two numbers as the checkbox.** `--lift` is a 2px hard shadow (hover, focus).
  `--fill` inks the circle only while it's pressed. Chosen is the dot: a shape, not a colour.
- **Same geometry as the checkbox** (`elements/checkbox.md`): the circle sits in the label's
  padding on the first line of the words, so a form's boxes and circles line up.
- Reads roles only. `:hover` only inside `@media (hover: hover)`.
- Motion (gate 4): the two numbers ease; the dot and the ring are instant (Motion, below).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Radio | `.radio` | One option: a flex column, `align-items: flex-start`. Sets `--radio-size` (1.5rem, 24px) and `--radio-gap` (12px). |
| Target | `.radio__label` | A `<label>` around the input and its words. `display: block`, `position: relative`, `min-block-size: 44px`, `padding-block: 10px`, `padding-inline-start: 36px`. `--type-body`, ink, `cursor: default`, `touch-action: manipulation`. |
| Circle | `.radio__input` | The input, `appearance: none`. Absolute, 10px from the top, at the start. 24×24px, `2px solid var(--line)`, `--radius-pill`. Ground: `color-mix()` of ink and paper by `--fill`, clipped to the padding box. `box-shadow: var(--shadow-invalid), var(--shadow-lift)`. |
| Dot | `.radio__input::before` | 10px (0.625rem) circle, centred, so 5px of ground shows round it. `currentColor`: ink, or paper on the pressed ink. Hidden unless `:checked`. |
| Option help | `.radio__help` | A `<p>` after the label: `--type-meta`, `--ink-soft`, indented 36px, 8px under it. Tied with `aria-describedby`. |
| Group | `.radio-group` | A `<fieldset>`, reset, a flex column with an 8px gap. The floated `<legend>` becomes a flex item. |
| Legend, help, error | `.field__label`, `.field__help`, `.field__error` | Field's parts on the group, in Field's order, before the options. The fieldset's `aria-describedby` lists the error first, then the help. |

Markup, in order:

```html
<fieldset class="radio-group" aria-describedby="order-help">
  <legend class="field__label">Card order</legend>
  <p class="field__help" id="order-help">You can change it any time.</p>
  <div class="radio">
    <label class="radio__label">
      <input class="radio__input" type="radio" name="order" value="in-order" checked>
      In order
    </label>
  </div>
  <div class="radio">
    <label class="radio__label">
      <input class="radio__input" type="radio" name="order" value="hardest"
             aria-describedby="hardest-help">
      Hardest first
    </label>
    <p class="radio__help" id="hardest-help">The cards you missed last time come up first.</p>
  </div>
</fieldset>
```

## Variants

Two, both groups. Shown live, with markup, in `elements/radio.html` (2.1–2.2).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Group | `.radio-group` + `.radio`, `.radio__label`, `.radio__input` | One answer to one question: Card order. | Choose a sensible default where there is one ("In order" on a deck's settings). Leave the group empty only when a guess would be worse, and then make it `required` (the New deck form, in `elements/form.md`). |
| With help on each option | `.radio__help` | When the names alone don't say what happens. | The name stays short ("Hardest first"); the line under it explains. |

## States

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | A 2px ink circle on paper. |
| Hover | `.radio__label:hover` on an enabled control, only inside `@media (hover: hover)` | 1 | – | Anywhere on the target: a 2px hard shadow, round. |
| Focus | `:focus-visible` | 1 | – | The hover look plus base.css's ring, which follows the circle. Arrows move focus and the choice together. |
| Chosen | `:checked` | – | – | The 10px ink dot. The ground stays paper. |
| Pressed | `.radio__label:active` on an enabled control | 0 | 1 | The circle inks over: a solid disc, which can't be mistaken for a dot on paper. A chosen dot turns paper. |
| Invalid | `.radio-group:has(> .field__error:not([hidden]))` | – | – | The whole group is wrong (nothing chosen): every circle's frame doubles inwards (`--shadow-invalid`), and Field's error sits under the legend. |
| Disabled | `:disabled` | 0 | 0 | Dashed `--ink-faint` frame, transparent ground, a faint dot if chosen, faint words; the help says why. The arrow keys skip it. |
| Forced colours | `(forced-colors: active)` | | | The circle opts out and paints system colours: `CanvasText` frame on `Canvas`, the dot in `Highlight`; hover and press turn the frame `Highlight`; the ring is `CanvasText`; invalid is a 4px frame; disabled is `GrayText`. |

`.is-hover`, `.is-focus` and `.is-active` on the input force a state for the page and for
tests. They are not API.

**Motion.** The circle transitions `--lift` and `--fill` over `--dur-hover` with `--ease-out`,
and a press lands over `--dur-press`, as Button's does: the press inks the circle, letting go
settles it. The dot appears the moment the choice is made and doesn't grow or travel between
options; the ring is instant. Under reduced motion the lift is instant and the fill fades over
`--dur-fade`.

## Accessibility

- One `name` per group makes it one tab stop: Tab lands on the chosen radio (or the first, if
  none is chosen), the arrow keys move the choice, and Space chooses the focused one. All
  native.
- The `<legend>` is read as you enter the group, so each option only needs its own words.
- A group that's wrong has its error in the fieldset's `aria-describedby`, error first. Radios
  carry no `aria-invalid` of their own (ARIA 1.2 doesn't support it on a radio); the summary in
  a form links to the first radio.
- Option help is outside the label, tied with `aria-describedby`, so the name stays short.
- A disabled option leaves the arrow-key path: its help says why, visibly.
- Targets are at least 44px tall, measured at 100% and 200% text.

## Platforms

- **Installed PWA:** the words are part of the target. Pressed inks the circle at once, so a
  tap answers where nothing hovers (with the shell's `touchstart` listener on iOS). iOS has no
  native radio; this is the same circle the web and the Mac use.
- **Mac:** Tab reaches the group once (with Keyboard navigation on; otherwise Safari Tabs past
  it, as with every non-text control), and the arrows choose. Radio groups in system chrome
  (a Settings window) stay the system's.
- **SwiftUI:**
  - Mac, system chrome: `Picker(selection:)` with `.pickerStyle(.radioGroup)`.
  - Content, on both: a `ForEach` of rows inside a container with
    `.accessibilityElement(children: .contain)` and the legend as its label. Each row is a
    `Button` setting the selection, with a 24pt `Circle().strokeBorder(.line, lineWidth: 2)`,
    a 10pt `Circle().fill(.ink)` when chosen, `.frame(minHeight: 44)`, `.contentShape(.rect)`,
    and `.accessibilityAddTraits(isChosen ? [.isSelected] : [])`.
  - Arrow keys on the Mac: `.onMoveCommand(perform:)` on the group moves the selection.

## Do and don't

- **Do** ask the question in the legend ("Card order") and keep each option to a few words.
- **Do** order options in a way that means something: the usual first, or least to most.
- **Do** choose a default when one is safe.
- **Don't** use radios for one yes-or-no: that's a checkbox.
- **Don't** go past six options: that's a select.
- **Don't** make choosing a radio do something at once. Radios answer; a button acts.

## Known limits

- The group's doubled frames come from `:has()`. Without it the circles stay single; the error
  text still shows, and the fieldset still describes it.
- A disabled option that is also chosen (a faint dot in a dashed circle) is rare and isn't
  shown on the page.
- Checked in Chromium only (with touch and forced-colours emulation), not on an iPhone, in
  Safari or in Firefox.
