# Select

Element 11 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/select.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Select's own spec.

## Brief

*One choice from a long list.*

- **Markup:** a native `<select>`, in Field's frame with the `down` glyph. The phone shows its own
  picker and the Mac its own menu, so we style only the closed control.
- **Variants:** default; with help; invalid.
- **States:** rest, hover, focus, pressed, invalid, disabled.
- **Notes:** single choice only. `appearance: base-select` is newer and only progressive: allowed
  if it degrades to the plain styled select. Copy: Language (English, Français, Español…), Deck
  colour (named options: the palette is monochrome).

## House rules

- **It sits in Field's frame.** Field's `.field`, `.field__label`, `.field__help` and
  `.field__error`, in Field's order (label, help, error, then the control), so a form reads the
  same from top to bottom. Only the select and its glyph are new.
- **The frame is restated, not borrowed.** `.select__input` repeats `.field__input`'s values
  (44px, 2px square line, paper, 16px text, `appearance: none`) because a `<select>` matches
  `:read-only`, and Field draws `.field__input:read-only` as a value on a rule. Change one, change
  both.
- **It holds a value, so it is square** (rule 3), like a field. The glyph says it opens. A select
  is never a pill, and it never lifts.
- **Only the closed control is ours.** The open list is the platform's: a wheel or sheet on a
  phone, a menu on the Mac, each with its own type-ahead, scrolling and accessibility. No
  `appearance: base-select` (Known limits).
- **Invalid never leans on colour**: the frame doubles inwards and `.field__error` says how to fix
  it. Disabled is dashed and faint, never opacity.
- `:hover` only inside `@media (hover: hover)`.
- Motion (gate 4): the ground eases, as a field's does; the picker is the platform's.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Field | `.field` | Field's column, `gap: 8px`. |
| Label | `.field__label` | Field's `<label for>`, above, always visible. |
| Help | `.field__help` | Field's, optional, in the select's `aria-describedby`. |
| Error | `.field__error` | Field's: `.ic--warning` and the fix, first in `aria-describedby`; the select gets `aria-invalid="true"`. |
| Box | `.select` | `position: relative`, `min-inline-size: 0`: holds the glyph over the select. |
| Select | `.select__input` | A `<select>`. `display: block; inline-size: 100%`, `min-block-size: 44px` (`--hit`), padding 8px, 12px at the start and 40px at the end (12px, the 20px glyph, 8px), `--type-body` at `max(1rem, 16px)`, ink on `--paper`, `2px solid var(--line)`, `--radius-ctl`, `appearance: none`, `text-overflow: ellipsis`. |
| Glyph | `.select__icon` | `.ic--down`, 20px, `aria-hidden`, absolutely placed 12px inside the frame's end and centred, `pointer-events: none` so a click opens the select. |

```html
<div class="field">
  <label class="field__label" for="deck-language">Language</label>
  <p class="field__help" id="deck-language-help">Cards are read aloud in this language.</p>
  <div class="select">
    <select class="select__input" id="deck-language" name="language" autocomplete="off"
            aria-describedby="deck-language-help">
      <option value="en" lang="en">English</option>
      <option value="fr" lang="fr">Français</option>
      <option value="es" lang="es">Español</option>
    </select>
    <span class="ic ic--down select__icon" aria-hidden="true"></span>
  </div>
</div>
```

## Variants

Each is shown live, with its markup, in `elements/select.html` under Variants (2.1–2.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Default | `.field` + `.select` | A label and the list: Language. | Languages in their own words, each `<option>` with its `lang`, so a screen reader pronounces it. `autocomplete="off"`: the deck's language, not the person's. |
| With help | `.field__help` | When the choice needs a word: Deck colour, "Fills the deck's card in your decks." | Colours are named by strength (Plain, Faint, Soft, Strong, Ink), never by lightness or swatch: the palette is monochrome, the order holds in light and dark (where "White" would be a dark grey), and a name is what tells them apart. |
| Invalid | `.field__error`, `aria-invalid="true"` | Nothing chosen where something must be. | Only where there is no sensible default: an empty first option ("Choose a language", `value=""`) and `required`. Form checks on submit and adds the error. |

## States

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | – | – | 2px ink frame on paper, the glyph in ink. |
| Hover | `:hover:not(:disabled)`, only inside `@media (hover: hover)` | – | 1 | The ground turns to `--canvas`, as a field's does (`--fill` mixes paper to canvas). |
| Focus | `:focus-visible` (base.css) | – | – | `3px solid var(--focus)`, offset 3px. Keyboard only: a click opens the picker instead. |
| Pressed | `:active:not(:disabled)` | – | 1 | `--canvas`, as on hover, so a tap answers while the picker opens. (Field's clear button does the same.) |
| Invalid | `[aria-invalid]` but not `"false"` | – | – | `box-shadow: inset 0 0 0 2px var(--line)`: the frame doubles inwards. Plus `.field__error` above. |
| Disabled | `:disabled` | – | – | Dashed frame and text in `--ink-faint`, transparent ground, `opacity: 1` (Safari fades a disabled select on its own). The glyph and the label go faint; the help, which says why, stays readable. |
| Forced colours | `(forced-colors: active)` | | | Invalid becomes a 4px (`--bw-heavy`) frame; disabled is `GrayText`, glyph and label included. Hover has no equivalent. |
| Dark | the scheme | | | The closed control is ours and follows the roles. The open list is the platform's and follows `color-scheme` (`base.css`): Chromium draws it from the select's own paper and ink, the Mac and phones draw their dark picker. |

There is no filled state (a select always shows a value) and no read-only (`<select>` has no
`readonly`; show the value as text instead). `.is-hover`, `.is-focus` and `.is-active` force a
state for the page and for tests. They are not API.

**Motion.** The ground is `--fill` (paper at 0, canvas at 1) and eases over `--dur-hover` with
`--ease-out`; a press lands over `--dur-press`. The picker that opens is the platform's, and moves
as the platform does; the ring is instant. Under reduced motion the ground fades over
`--dur-fade`.

## Accessibility

- A native `<select>` is announced as a pop-up button or combo box with its label ("Language,
  English, pop-up button") and its help as the description. Checked in Chromium's accessibility
  tree.
- Keyboard: Tab reaches it; Space, Enter or Alt+Down open the picker; the arrows and type-ahead
  move through the options. All native.
- The empty first option of a required select is a prompt, not a label: the visible label stays
  above. Prefer a default to a prompt.
- Every option is words. A deck colour is never only a swatch, and never only a colour name that
  means nothing in grey.
- Disabled selects leave the tab order: say why in the help beside it, and prefer leaving it
  enabled or showing the value as text.

## Platforms

- **Installed PWA:** iOS opens a wheel at the bottom of the screen, Android a list in a dialog;
  both are better on a phone than anything drawn in the page. The 16px floor stops iOS zooming on
  focus; `appearance: none` takes away iOS's grey gradient and rounded frame, and our glyph
  replaces its arrows.
- **Mac:** the menu opens over the control, with the chosen option under the pointer and
  type-ahead, as every Mac pop-up button does. Return or Space opens it; Escape closes it.
- **SwiftUI:** `Picker(_:selection:)` with `.pickerStyle(.menu)`: a pop-up button on the Mac, a
  menu on iOS. Put our label above as a `Text`, keep the picker's own label for VoiceOver and
  hide it with `labelsHidden()`. To draw the closed control like ours, a `Menu` whose label is
  the value and a `chevron.down` (or our `down` path) in a 2pt square stroke, 44pt tall. Invalid:
  the error `Text` above and the doubled stroke; disabled: `.disabled(true)` with the reason
  beside it.

## Do and don't

- **Do** use it for a long list of known options: languages, colours.
- **Do** choose a sensible default, so it is never empty.
- **Do** name options in words, languages in their own language with `lang`.
- **Don't** use it for two to four options: show them, as a segmented control or radio group.
- **Don't** use it for several choices at once, or to navigate.
- **Don't** round the frame or lift it: it holds a value.
- **Don't** put the instructions in the first option; that's what help is for.

## Known limits

- **No `appearance: base-select`.** In Chromium it draws the open list in the page on every
  platform, which replaces the phone's own picker and the Mac's own menu, the two things the brief
  says to keep. If it is ever adopted, scope it to wide screens with a fine pointer, inside
  `@supports (appearance: base-select)`, so everything else keeps the plain styled select.
- The open list's font, colours and size are the platform's: Chromium on Linux and Windows draws
  its own list in the select's font; the Mac and phones use the system's.
- `text-overflow: ellipsis` on a select works in Firefox; Chromium and Safari cut the value off.
  Keep option text short.
- The disabled label's colour uses `:has()`; without it the label stays ink.
- Hover has no forced-colours equivalent, as on the card.
- Checked in Chromium only, with touch and forced-colours emulation. The native pickers were not
  opened in a test (headless Chromium has none to show); not checked on an iPhone, in Safari or
  in Firefox.
