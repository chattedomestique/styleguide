# Field

Element 03 · v1.0 · gates 0–5 done (brief, wireframe, states, colour, motion, freeze) · page: `elements/field.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Field's own spec.

## Brief

*Lets someone type one value.*

- **Parts:** the label (always visible, above), the input, help text, the error message, an
  optional leading icon, an optional trailing clear button.
- **Variants:** text; search (`type="search"`, a leading search icon, a clear button); number
  (`inputmode`, no spinner arrows); multi-line (`textarea`, resizes vertically only).
- **States:** rest, hover, focus, filled, invalid, disabled, read-only. Invalid:
  `aria-invalid`, plus a message tied with `aria-describedby` that says how to fix it.
- **Copy:** Deck name, Search decks, Cards per session, Notes. Errors such as "Give the deck a
  name".
- **Notes:** a field holds text, so it is a square 2px frame. Text is 16px or more. The label is
  never the placeholder; placeholders are only examples.

## House rules

- Reads roles only. A field isn't pressed, so it never reads `--lift` and never gets a shadow;
  the clear button is pressable and reads `--lift` and `--fill`, as Button does (hover and focus
  lift and fill it, a press keeps only the fill).
- **The frame is on the input itself.** Every state is then native (`:hover`,
  `:focus-visible`, `[aria-invalid]`, `:disabled`, `:read-only`) and needs no wrapper or
  `:has()`. `.field__box` is only a positioning wrapper, for the icon and the clear button.
- **Help and error go above the input**, between it and the label. On a phone the focused field
  scrolls to just above the on-screen keyboard, so anything under it is hidden while you type the
  fix. Above, the label, the rule and the error stay in view, and a screen magnifier reads them
  in one path. (GOV.UK's order, for the same reason.)
- **Invalid never leans on colour**: the frame doubles (inwards, so nothing shifts), and the
  message says how to fix it behind a warning glyph. The palette is monochrome, so there is no
  red to lean on anyway.
- `:hover` only inside `@media (hover: hover)`.
- Motion (gate 4): the input's hover ground and the clear button's fill and lift ease; the ring, the
  invalid frame and the error never wait (Motion, below).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Field | `.field` | Flex column, `gap: 8px` (`--space-2`), `min-inline-size: 0`. Width comes from its container. |
| Label | `.field__label` | A `<label for>`. `--type-body` at weight 600, ink, sentence case (a label is read, so not the uppercase label style). |
| Help | `.field__help` | `--type-meta` (14px), `--ink-soft`, at most `--measure`. A `<p>` with an id, in the input's `aria-describedby`. |
| Error | `.field__error` | `--type-body` at weight 600, ink, with `.ic--warning` (20px, nudged 2px to centre on the first line) and 8px gap. A `<p>` with an id, first in `aria-describedby`. Only there while the value is invalid. |
| Box | `.field__box` | `position: relative`. Only when the input has a leading icon or a clear button. |
| Input | `.field__input` | `<input>` or `<textarea>`. `min-block-size: 44px` (`--hit`); padding 8px 12px; `--type-body` at `max(1rem, 16px)`; ink on `--paper`; `2px solid var(--line)`; `--radius-ctl` (square); `appearance: none`. Placeholder in `--ink-soft`. |
| Leading icon | `.field__icon` | A 20px `.ic`, `aria-hidden`, absolutely placed 12px inside the frame and centred; `pointer-events: none`. The input's start padding grows to 40px. |
| Clear button | `.field__clear` | A `<button type="button" aria-label="Clear search">`. 44×44 target over the frame's inline end; inside it a 28px circle (`::before`, `2px` ink, `--radius-pill`) and a 20px `.ic--close`. While it shows, the input's end padding is 44px. |

Markup, in order:

```html
<div class="field">
  <label class="field__label" for="deck-name">Deck name</label>
  <p class="field__help" id="deck-name-help">Shown on the deck's card.</p>
  <p class="field__error" id="deck-name-error">
    <span class="ic ic--warning" aria-hidden="true"></span>Give the deck a name
  </p>
  <input class="field__input" id="deck-name" type="text" autocomplete="off"
         aria-invalid="true" aria-describedby="deck-name-error deck-name-help">
</div>
```

## Variants

Four. They share the frame, label, help and error; only the input changes.

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Text | `.field` + `input.field__input` | One short line: Deck name. | `type="text"`. |
| Search | `.field__box` + `.field__icon` + `.field__clear`, `type="search"` | Narrowing a list as you type: Search decks. | Inside a `<search>` element. Our clear button replaces the browser's (under 44px and not keyboard-reachable). Escape clears natively. |
| Number | `.field--number` | A count: Cards per session. | `type="text" inputmode="numeric" pattern="[0-9]*"`: the number pad, no spinners, no scroll wheel nudging the value. The range goes in the help ("From 5 to 50"); the check runs on submit. Width `6ch` plus padding, tabular figures. If a `type="number"` is ever used, the spinners are hidden too. |
| Multi-line | `textarea.field__input` | A few sentences: Notes. | `rows="4"`, `resize: vertical`, `min-block-size: 88px`, `overscroll-behavior: contain`. |

### Keyboard hints, per variant

| Variant | `autocomplete` | `inputmode` | `enterkeyhint` | Also |
| --- | --- | --- | --- | --- |
| Text (Deck name) | `off`: deck names aren't personal data, so no browser history suggestions | (default text) | `done`, or `next` when another field follows | `autocapitalize="sentences"` |
| Search (Search decks) | `off` | `search`, implied by `type="search"` | `search` | `autocapitalize="none"`, `spellcheck="false"` |
| Number (Cards per session) | `off` | `numeric` | `done` | `pattern="[0-9]*"` for older iOS |
| Multi-line (Notes) | `off` | (default text) | `enter`: Return makes a new line | `autocapitalize="sentences"` |

Fields that hold personal data (a name, an email for sync) take their real `autocomplete`
token instead, such as `name` or `email`; none are in this product yet.

## States

Two parts have states: the input, which is never pressed, and the clear button, which is.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | – | – | 2px ink frame on paper. |
| Hover | `:read-write:hover:not(:focus)`, only inside `@media (hover: hover)` | – | 1 | The ground turns to `--canvas` (`--fill` mixes paper to canvas). Never on a read-only or disabled field. |
| Focus | `:focus-visible` (base.css) | – | – | `3px solid var(--focus)` ring, offset 3px (2px inside a card). Text fields match `:focus-visible` on a click too, so the caret is always ringed. |
| Filled | a value | – | – | Ink text. The label doesn't move. |
| Invalid | `[aria-invalid]` but not `"false"` | – | – | `box-shadow: inset 0 0 0 2px var(--line)`: the frame doubles inwards, so the focus ring keeps its gap. Plus `.field__error` above the input. |
| Disabled | `:disabled` | – | – | Dashed frame and text in `--ink-faint`, transparent ground, `opacity: 1` (never faded). The label goes faint; the help, which says why, stays readable. The clear button is removed. |
| Read-only | `:read-only:not(:disabled)` | – | – | No box: no ground, no side or top frame, a `1px` (`--bw-thin`) rule under the value, start padding 0 so the value lines up with the label. Focusable and selectable. |
| Clear: rest | none | 0 | 0 | 28px circle, 2px ink outline, ink glyph. |
| Clear: hover | `:hover` inside `@media (hover: hover)` | 1 | 1 | Button's hover: the circle fills with ink, the glyph turns paper, and a hard ink shadow lifts it. 2px (`calc(var(--lift) * var(--bw))`), not Button's 4px: the circle is 28px, like Checkbox's 24px box. |
| Clear: focus | `:focus-visible` | 1 | 1 | The hover look, so keyboard and pointer match, and the ring moves to the circle: `3px` at `--ring-offset-in` (2px), 38px across, inside the 40px frame. The button's own outline is off. |
| Clear: pressed | `:active` | 0 | 1 | Back onto the field: the lift goes, the fill stays, and a 2px paper ring shows inside the frame, as on a pressed Button. |
| Forced colours | `(forced-colors: active)` | | | The doubled frame is a shadow and vanishes, so invalid becomes a 4px (`--bw-heavy`) border. Disabled is `GrayText`. The clear button's fill and lift vanish, so hover, focus and press turn its circle `Highlight`. Hover on the input has no equivalent (as on the card). |

`.is-hover`, `.is-focus` (input and clear) and `.is-active` (clear) force a state for the page
and for tests. They are not API.

**Motion.** The input's ground is `--fill` (paper at 0, canvas at 1), so its hover eases over
`--dur-hover` with `--ease-out`, as every hover does. The clear button's `--fill` eases the same
way, and so does its `--lift`; its press lands over `--dur-press`. The focus ring, the invalid frame and the error
message are instant: feedback about the value never waits for an ease. Under reduced motion both
fills fade over `--dur-fade`, and the clear button's lift appears without sliding out.

### The clear button's behaviour

It needs script: `js/components/field.js`, shipped in `dist/flashcards.js`:

- It shows only while the field has text: the app toggles `hidden`. Its room in the input is
  reserved only while it shows; text starts at the other end, so nothing under the caret moves.
- Pressed, it puts focus back in the input, then empties it and fires `input`, so a filtered list
  updates and the button can hide without dropping focus on the page.

```js
for (const box of document.querySelectorAll(".field__box")) {
  const input = box.querySelector(".field__input");
  const clear = box.querySelector(".field__clear");
  if (!input || !clear) continue;
  const sync = () => { clear.hidden = input.value === ""; };
  input.addEventListener("input", sync);
  clear.addEventListener("click", () => {
    input.focus();
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  sync();
}
```

## Accessibility

- Every input has a visible `<label for>`. The placeholder is never the label: it disappears on
  the first letter and is often too faint.
- `aria-describedby` lists the error first, then the help, so a screen reader hears the fix
  before the rule. `aria-invalid="true"` makes it say "invalid" too.
- The error says how to fix it, in words, behind a glyph: it never relies on colour or on the
  doubled frame alone.
- When errors appear on submit, the Form element (wave 2) moves focus to a summary that links to
  each field. Field shows the error; Form decides when.
- The clear button is a real button with `aria-label="Clear search"`, a 44×44 target and its own
  visible ring. It is in the tab order only while it shows.
- Disabled fields leave the tab order, so a screen reader may never reach them: say why in
  visible help next to the field, and prefer read-only or leaving the field out.
- Text is 16px or more at every Dynamic Type size, and the frame contrasts with paper and canvas
  at more than 3:1.
- Dark: the browser's own parts follow `color-scheme` (`base.css`), so the textarea's grip and a
  scrolling field's scrollbar are drawn dark too; hover's `--canvas` is a step below paper, as in
  light.

**Right to left.** The search glyph leads from the right and the clear button sits at the left end:
both are placed with `inset-inline-*`, and the padding that keeps text clear of them is logical
too. What's typed follows its own script.

## Platforms

- **Installed PWA:**
  - iOS zooms the page when a field under 16px takes focus. `base.css` floors inputs at
    `max(1rem, 1em)`; the field restates its `font` shorthand, so it sets
    `font-size: max(1rem, 16px)`, which also holds at the smaller Dynamic Type sizes, where 1rem
    is under 16px.
  - The on-screen keyboard: `inputmode` picks the layout, `enterkeyhint` the Return key's label,
    and help and error sit above the input where the keyboard can't cover them. Resizing the
    viewport for the keyboard (`interactive-widget`, `visualViewport`) is the PWA platform's job
    (element 27).
  - `appearance: none` strips iOS's rounded search field and inner shadow.
- **Mac:** native text fields belong to system chrome: the toolbar's search is the system's
  (SwiftUI `searchable(text:)`, AppKit `NSSearchField`) and keeps its look. Ours are for content:
  forms in a sheet, a deck's details. macOS tabs to text fields even with Tab focusing limited to
  them, so fields are always on the keyboard path. Return submits the form; Escape clears search.
- **SwiftUI:** a `TextField` with a custom `TextFieldStyle`: 8pt by 12pt padding, a 44pt minimum
  height, `Rectangle().strokeBorder(Color.line, lineWidth: 2)` as an overlay, and the label as a
  `Text` above it (keep the field's own title for VoiceOver, hidden with `labelsHidden()`). The
  system focus ring stays on (on the Mac it follows the shape).
  - Text: `.submitLabel(.done)`, `.textInputAutocapitalization(.sentences)`.
  - Search: `.submitLabel(.search)`, `.autocorrectionDisabled()`, our glyph as a leading
    `Path`, and a `Button` with `.accessibilityLabel("Clear search")`.
  - Number: `.keyboardType(.numberPad)` (iOS), `.monospacedDigit()`.
  - Multi-line: `TextField(_:text:axis: .vertical)` with `.lineLimit(4...)`, or `TextEditor`.
  - Invalid: the error as a `Text` above the field, the doubled stroke, and the error in the
    field's `.accessibilityHint(_:)` (SwiftUI has no `aria-invalid`).
  - Read-only: a `Text` with `.textSelection(.enabled)` on a 1pt rule; disabled: `.disabled(true)`
    with the reason beside it.

## Do and don't

- **Do** name the thing in the label: "Deck name", not "Name".
- **Do** write the error as the fix: "Give the deck a name", "Pick a number from 5 to 50". Not
  "Required", not "Invalid input".
- **Do** put the range or rule in the help before anyone gets it wrong.
- **Do** size a field to its answer: a number field is a few digits wide.
- **Don't** use the placeholder as the label, or put instructions in it.
- **Don't** disable a field without saying why beside it.
- **Don't** mark invalid with colour alone, or with a shadow at rest.
- **Don't** round the frame: a field holds text, so it's square. Only the clear button is round.

## Known limits

- The clear button needs script (`js/components/field.js`: show while there's text, clear,
  refocus). It ships with `hidden`, so without the script it simply isn't there, and Escape
  still clears a search field natively.
- The clear button's reserved padding and the disabled label's colour use `:has()`. Without it
  (pre-2023 browsers) long text can run under the clear button.
- Hover has no forced-colours equivalent, as on the card.
- Help and error above the input is GOV.UK's order, not the iOS Settings habit of footers below;
  chosen for the on-screen keyboard (House rules).

- No auto-growing textarea (`field-sizing: content`): it isn't in Safari yet, and the brief asks
  for a vertical resize.
- Checked in Chromium only, with touch emulation and forced-colours emulation. Not checked on an
  iPhone (zoom floor, `enterkeyhint`, `appearance: none` on search), in Safari or in Firefox
  (spinner hiding).
