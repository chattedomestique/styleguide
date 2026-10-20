# Checkbox

Element 07 · gates 0–2 done (wireframe, states) · page: `elements/checkbox.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Checkbox's own spec.

## Brief

*Independent on/off choices.*

- **Variants:** single (one checkbox and its label); group (a `fieldset` with a `legend`); mixed
  (`indeterminate`, for "Select all" over a group); with help text.
- **Look:** a 24px square box inside a 44px target, with a 2px frame. Checked: ink fill and the
  check glyph in paper. Mixed: the minus glyph.
- **Shared with every wave 2 control:** a native `<input>` restyled with `appearance: none`; the
  `<label>` around it carries the 44px target, so a tap on the words toggles it; help and errors
  use Field's parts and order; checked uses the fill and never colour alone, and keeps a mark in
  forced colours.
- **Notes:** it stays square, against rule 3, because the platform convention wins. Copy: Show
  hints, Read the answer aloud, and a group headed "Decks to study".

## House rules

- **Square, against rule 3.** Rule 3 says things you act on are round. A checkbox is square on
  iOS, macOS, Windows, Android and the web, and a round box reads as a radio: someone who sees a
  circle expects one choice, not many. Usability facts come first (`STYLE.md` §6), so the
  convention wins. `--radius-ctl` (0) draws it. Recorded in `STYLE.md` §7.
- **Native first.** A real `<input type="checkbox">` inside its `<label>`, so Space, the name,
  the checked state, form submission and `indeterminate` are all the browser's.
- **Two numbers draw every state**, as on the card and the button. `--fill` is the box's ground
  (paper to ink): checked, mixed and pressed. `--lift` is a 2px hard shadow: hover and focus.
  Checked and mixed also carry a glyph, so the state never rests on the fill alone.
- **The box sits in the label's padding,** absolutely placed on the first line. The words are
  plain inline text, so they wrap under themselves and a count or a `<b>` inside them needs no
  wrapper.
- Reads roles only. States change instantly. `:hover` only inside `@media (hover: hover)`.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Checkbox | `.checkbox` | The option: a flex column, `align-items: flex-start`, so the label is as wide as its words. Sets `--checkbox-size` (1.5rem, 24px) and `--checkbox-gap` (12px). |
| Target | `.checkbox__label` | A `<label>` around the input and the words. `display: block`, `position: relative`, `min-block-size: 44px` (`--hit`), `padding-block: 10px` (one 24px line of text plus 10 and 10 is 44), `padding-inline-start: 36px` (box and gap). `--type-body`, ink, `cursor: default`, `touch-action: manipulation`. |
| Box | `.checkbox__input` | The input, `appearance: none`. Absolute, 10px from the top, at the start. 24×24px, `2px solid var(--line)`, `--radius-ctl`. Ground: `color-mix()` of ink and paper by `--fill`, clipped to the padding box (so a dashed frame shows gaps, not fill). `box-shadow: var(--shadow-press), var(--shadow-invalid), var(--shadow-lift)`. |
| Glyph | `.checkbox__input::before` | Spans the whole box (`margin: -2px`), so the icon draws on its own 24 grid at a 2px stroke, the frame's weight. `mask: var(--icon-check)`, or `--icon-minus` when mixed, in `currentColor` (paper). Hidden unless checked or mixed. |
| Option help | `.checkbox__help` | A `<p>` after the label: `--type-meta` (14px), `--ink-soft`, at most `--measure`, indented 36px to line up with the words, 8px under it before the next option. Outside the label, so it isn't part of the name; tied with `aria-describedby`. |
| Group | `.checkbox-group` | A `<fieldset>`: border, padding and margin reset, a flex column with an 8px gap (`--space-2`). The `<legend>` floats, which makes it a flex item, so the gap applies to it too. |
| Legend, help, error | `.field__label`, `.field__help`, `.field__error` | Field's own parts on the group, in Field's order: legend, help, error, then the options. The fieldset's `aria-describedby` lists the error first, then the help. |

Markup, in order:

```html
<fieldset class="checkbox-group" aria-describedby="decks-help">
  <legend class="field__label">Decks to study</legend>
  <p class="field__help" id="decks-help">Cards from these decks come up today.</p>
  <div class="checkbox">
    <label class="checkbox__label">
      <input class="checkbox__input" type="checkbox" name="decks" value="shapes" checked>
      Shapes
    </label>
  </div>
  <div class="checkbox">
    <label class="checkbox__label">
      <input class="checkbox__input" type="checkbox" name="decks" value="colours"
             aria-describedby="colours-help">
      Colours
    </label>
    <p class="checkbox__help" id="colours-help">Two new cards since Sunday.</p>
  </div>
</fieldset>
```

## Variants

Four, all the same box. Each is shown live, with its markup, in `elements/checkbox.html` (2.1–2.4).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Single | `.checkbox` + `.checkbox__label` + `.checkbox__input` | One yes-or-no that counts when the form is sent: Show hints. | The words say what checked means, in the positive. The input is inside its label, so no `for`. |
| Group | `.checkbox-group` | Several choices answering one question: Decks to study. | One `name`; each box is its own tab stop. Options 8px apart, so 44px targets never touch. |
| Mixed | `:indeterminate`, `aria-controls` | "All decks", over a group where only some are checked. | `indeterminate` exists only in script. The box lists the boxes it controls in `aria-controls`. Checking it checks them all; pressing it while mixed checks all (native behaviour). Script: `js/components/checkbox.js`. |
| With help | `.checkbox__help` | When the words need one more line. | Under the words, outside the label. The 44px label above it is still the whole target. |

### Mixed: the script

`js/components/checkbox.js`, shipped in `dist/flashcards.js`, wires every checkbox whose
`aria-controls` lists other checkboxes: checking it checks them all, clearing it clears them, and
while only some are checked it shows mixed.

## States

`--fill` (0 paper, 1 ink) is the box's ground; `--lift` (0 flat, 1 raised) draws
`--shadow-lift`, a hard 2px shadow down and right in `--line`. A 24px box lifts 2px, the same
share of its size as a 44px button's 4px. Box-shadow order: `--shadow-press`,
`--shadow-invalid`, `--shadow-lift`.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | A 2px ink frame on paper. |
| Hover | `.checkbox__label:hover` on an enabled control, only inside `@media (hover: hover)` | 1 | – | Anywhere on the target, words included. Nothing moves. |
| Focus | `:focus-visible` | 1 | – | The hover look plus base.css's ring: `3px solid var(--focus)`, offset 3px, square like the box. |
| Checked | `:checked` | – | 1 | Ink ground, the check in paper. |
| Mixed | `:indeterminate` | – | 1 | Ink ground, the minus in paper. Wins over checked: a script can set both. |
| Pressed | `.checkbox__label:active` on an enabled control | 0 | 1 | Down, filled, and `--shadow-press`: a 2px paper ring inside the frame, so a tap answers before the finger lifts (as a pressed button). A checked box keeps its check under the ring. |
| Invalid | `[aria-invalid]` but not `"false"` on one box; in a group, `.checkbox-group:has(> .field__error:not([hidden]))` | – | – | `--shadow-invalid`: `inset 0 0 0 2px var(--line)`, the frame doubles inwards, as a field's. Plus Field's error above the box or under the legend. |
| Disabled | `:disabled` | 0 | – | Dashed `--ink-faint` frame, transparent ground, or an `--ink-faint` ground behind a paper check when checked; the words go faint (`:has()`); the help, which says why, stays readable. Never opacity. Last, so it wins. |
| Forced colours | `(forced-colors: active)` | | | The box opts out (`forced-color-adjust: none`) and paints system colours: `CanvasText` frame on `Canvas`; checked and mixed fill with `Highlight` and keep the glyph in `HighlightText`; hover and press turn the frame `Highlight`; the ring is `CanvasText`; invalid is a 4px (`--bw-heavy`) frame; disabled is `GrayText`, glyph included. |

`.is-hover`, `.is-focus` and `.is-active` on the input force a state for the page and for
tests. They are not API.

## Accessibility

- The input is inside its `<label>`, so the words are its name and a tap on them toggles it.
  Space toggles; Tab moves box to box (a checkbox group is not one tab stop, unlike radios).
- A group is a `<fieldset>` with a `<legend>`: screen readers read the question with the box.
  The fieldset's `aria-describedby` lists the group's error (first) and help.
- One box that must be checked: `aria-invalid="true"` and `aria-describedby` with its error
  first. A group that's wrong ("Pick at least one deck"): the error under the legend, in the
  fieldset's description; every box's frame doubles; no box gets `aria-invalid` on its own.
- Mixed: `input.indeterminate = true` makes the browser report "mixed" (`aria-checked`
  isn't needed, and shouldn't be set on a native checkbox). `aria-controls` names the boxes it
  sets.
- Option help is outside the label and tied with `aria-describedby`, so the name stays short.
- Disabled boxes leave the tab order: say why in visible help, and prefer leaving the option
  out.
- Every target is at least 44px tall: one line is exactly 44, measured at 100% and 200% text.
  The frame is ink on paper or canvas, far above 3:1.

## Platforms

- **Installed PWA:**
  - The whole label is the target, so a thumb on the words toggles it; `touch-action:
    manipulation` drops the double-tap wait.
  - Pressed fills the box at once, so a tap answers where nothing hovers. iOS Safari applies
    `:active` only with a `touchstart` listener, which the shell adds (`STYLE.md` §4).
  - The box is `rem`, so it grows with Dynamic Type along with the words.
- **Mac:**
  - Space toggles. With macOS's default keyboard setting, Safari and WKWebView Tab past
    checkboxes (text fields and lists only), so shortcuts and the menu bar stay the main route
    (`STYLE.md` §4); with Keyboard navigation on, every box is a tab stop.
  - Checkboxes in system chrome (a Settings window, a menu, an alert's suppression box) stay the
    system's. Ours are for content.
- **SwiftUI:** a `Toggle(isOn:)` with a custom `ToggleStyle`. Its body is a `Button` that calls
  `configuration.isOn.toggle()`, with an `HStack(alignment: .firstTextBaseline, spacing: 12)`
  of the box and `configuration.label`, `.frame(minHeight: 44)` and `.contentShape(.rect)` over
  the whole row.
  - The box: `Rectangle().fill(isOn ? .ink : .paper).frame(width: 24, height: 24)`,
    `.overlay(Rectangle().strokeBorder(.line, lineWidth: 2))`, and the check as a `Path` from
    `elements/icons.md`, stroked 2pt in paper.
  - Mixed: `Toggle(_:sources:isOn:)` (iOS 16, macOS 13) over the decks; the style reads
    `configuration.isMixed` and draws the minus.
  - Keep the toggle's traits: `.accessibilityAddTraits(.isToggle)` on the button (iOS 17).
  - In system chrome on the Mac, `.toggleStyle(.checkbox)`.

## Do and don't

- **Do** say what checked means, in the positive: "Show hints", not "Hide hints" or "Hints".
- **Do** put a group's question in its legend.
- **Do** use a checkbox when the choice counts on Save, and a switch when it acts at once.
- **Don't** use a checkbox to pick one thing from a list: that's a radio.
- **Don't** round it. It's the one square thing you act on.
- **Don't** put help inside the label: it would become part of the name.
- **Don't** disable a box without saying why beside it.

## Known limits

- Mixed needs script (`js/components/checkbox.js`): `indeterminate` has no HTML attribute.
  Without the script, "All decks" is an ordinary checkbox.
- The disabled label colour and the group's doubled frames use `:has()`. Without it the words
  stay ink and the boxes stay single; the error text still shows.
- The glyph is a mask on the input's `::before`, which `appearance: none` allows in Chromium,
  Safari and Firefox. Checked in Chromium only (with touch and forced-colours emulation), not
  on an iPhone, in Safari or in Firefox.
- The box reads page roles (`--ink`, `--paper`), not a card's, so inside an ink card it doesn't
  invert. No such screen exists yet.
- Help under an option isn't part of the target: a tap on it does nothing. The label above it
  is still a full 44px.
