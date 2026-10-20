# Segmented control

Element 10 · gates 0–2 done (wireframe, states) · page: `elements/segmented.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Segmented control's own spec.

## Brief

*One of two to four views or modes, side by side.*

- **Markup:** a radio group drawn as joined pills, `.sg-seg`'s pattern made real: a `fieldset`,
  a `legend` (which may be visually hidden), and native radios, so the arrows work.
- **Variants:** text only; with icons and text; full width (on a phone).
- **States:** rest, hover, focus (ring), chosen, disabled. No mixed, and no invalid: one option
  is always chosen.
- **Notes:** it never navigates. Tabs (wave 3) switch sections of a screen; this switches how one
  thing is shown. Copy: Grid / List; Front / Back / Both.

## House rules

- **Native radios, drawn as nothing.** Each `type="radio"` is stretched over its option with
  `appearance: none`, on top and transparent, so a click lands on it and the arrows move it. The
  span after it is what you see, so every state is a sibling selector
  (`input:checked + .segmented__label`): chosen, hover, pressed and disabled need no `:has()`.
- **It acts, so its ends are round** (rule 3, `--radius-pill`). The frame is on the segments, not
  round the track, so each option's 44px includes its frame and the whole of it is the target.
  Neighbours share one 2px divider: each segment draws its start edge and the last closes the row.
- **Chosen is `--fill`**: ink ground, paper words, as Button fills. Never a colour alone; in forced
  colours it is the system's `Highlight`.
- **A segment never lifts.** Joined, a hard shadow would fall across its neighbours, so hover is
  Field's quiet change of ground and press is the fill with Button's inner ring.
- **Joined pills don't wrap; they come apart.** A pill split over two rows reads as broken, so
  when the options can't sit side by side they become separate pills, one per row (Layout).
- States change instantly. `:hover` only inside `@media (hover: hover)`.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Group | `.segmented` | A `<fieldset>`, reset: no frame, margin or padding, `min-inline-size: 0`. A size container (`container: segmented / inline-size`), so the options can come apart by its width. |
| Legend | `.segmented__legend` | Field's label as a `<legend>`: `--type-body` at weight 600, ink, sentence case, 8px below. Always present; add `.sr-only` where the options name themselves (Grid, List above a grid of decks). |
| Help | `.field__help` | Field's help, optional, between the legend and the track, 8px below. In the fieldset's `aria-describedby`. Says why when an option or the group is disabled. |
| Track | `.segmented__track` | `inline-grid`, `grid-auto-flow: column`, equal columns (`minmax(0, 1fr)`), so every segment is as wide as the widest. `max-inline-size: 100%`. `--radius-pill`, so the focus ring follows the pill. Draws nothing else. |
| Option | `.segmented__option` | The `<label>`: `position: relative`, the target. `cursor: pointer`. |
| Radio | `.segmented__input` | `type="radio"`, one shared `name` per group, one `checked`. Absolutely placed over the option (`inset: 0`), `appearance: none`, no ground or frame. Its own outline is off; the ring is drawn on the track. |
| Segment | `.segmented__label` | A `<span>` after the radio: flex, centred, `gap: 8px`, `min-block-size: 44px` (`--hit`) including its 2px frame, padding 4px 16px. `--type-body` at weight 600, line-height 1.3. Its start edge and top and bottom are drawn; the last segment draws its end too. The first segment's start corners and the last one's end corners are `--radius-pill`. |
| Icon | `.ic` (optional) | Before the words, 20px, `aria-hidden`, pulled 4px towards the curve. Never instead of the words. |

```html
<fieldset class="segmented">
  <legend class="segmented__legend">Side to show</legend>
  <div class="segmented__track">
    <label class="segmented__option">
      <input class="segmented__input" type="radio" name="side" value="front" checked>
      <span class="segmented__label">Front</span>
    </label>
    <label class="segmented__option">
      <input class="segmented__input" type="radio" name="side" value="back">
      <span class="segmented__label">Back</span>
    </label>
    <label class="segmented__option">
      <input class="segmented__input" type="radio" name="side" value="both">
      <span class="segmented__label">Both</span>
    </label>
  </div>
</fieldset>
```

## Variants

Each is shown live, with its markup, in `elements/segmented.html` under Variants (2.1–2.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Text only | `.segmented` | The default: Grid / List, Front / Back / Both. | Two to four options, one short word each. Shrinks to its widest option times the count. |
| Icons and text | `.ic` in `.segmented__label` | When a glyph helps you find the option: Due / All (`.ic--today`, `.ic--decks`). | The icon leads and never replaces the word. Costs about 1.75em an option, so it comes apart sooner. |
| Full width | `.segmented--full` | On a phone: the options share the whole row. | The track becomes a block `grid`; columns stay equal. |

## Layout: coming apart

The options sit side by side while the fieldset has room for them, and come apart below that:
one pill per row, the whole width, 8px between them (a target gap), every segment fully framed
and fully round. The threshold is a container query on `.segmented`, counted by option, in `em`
so it follows the text size:

| Options | Comes apart below | With icons |
| --- | --- | --- |
| 2 | 11em | 16.5em |
| 3 | 16.5em | 22em |
| 4 | 22em | 29em |

That is 5.5em an option (7.25em with an icon): "Known", the widest word in the specimens, is
3.2em at weight 600, plus 2em of padding and the divider. Measured joined widths: Grid / List
8.25em, Due / All with icons 11em, Front / Back / Both 13.9em, All / New / Due / Known 21.75em.
So at 100% text four options stay joined on a 390px phone (22.4em of room) and come apart on a
320px one; at 200% text, on any phone, everything but a two-option control comes apart.

Coming apart sets `--segmented-apart: 1` on the track, which moves the focus ring from the track
to the chosen pill.

## States

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | – | 0 | Ink words on paper (`--segmented-ground`), 2px ink frame. |
| Chosen | `:checked` | – | 1 | Ink ground, paper words. One always is. |
| Hover | `.segmented__option:hover`, only inside `@media (hover: hover)`, not on the chosen or a disabled one | – | 0 | The ground turns to `--canvas`, as a field's does. |
| Focus | `:focus-visible` on the radio | – | – | Joined: one ring round the whole track, `3px solid var(--focus)`, 3px out; the fill already shows which option is chosen, and the group is one tab stop. Apart: the same ring round the chosen pill. Without `:has()`, an inset ring in the segment's own ink. |
| Pressed | `:active` on the radio | – | 1 | Filled, with Button's "down" ring: `inset 0 0 0 2px var(--paper)`. The ring keeps it apart from a chosen neighbour and shows a press on the chosen one. |
| Disabled option | `disabled` on one radio | – | 0 | Dashed frame and words in `--ink-faint`; the arrows skip it; the help says why. |
| Disabled group | `disabled` on the fieldset | – | – | Every segment dashed and faint; the chosen one keeps a faint fill (`--ink-faint` ground, paper words), so the setting still shows. The legend goes faint; the help stays readable. |
| Forced colours | `(forced-colors: active)` | | | Frames `ButtonText`. Chosen and pressed: `Highlight` ground, `HighlightText` words and icon. Disabled: `GrayText`; chosen and disabled: a `GrayText` fill with `Canvas` words. The ring is an outline and survives. Hover has no equivalent, as on the card. |

`.is-hover`, `.is-active` (on the option) and `.is-focus` (on the track) force a state for the
page and for tests. They are not API.

## Accessibility

- A `<fieldset>` and `<legend>`: the group is announced with its name ("Side to show, group"),
  and each option as a radio with its words ("Front, radio button, selected, 1 of 3"). Checked in
  Chromium's accessibility tree, the visually hidden legend included.
- One tab stop. Left/Right (and Up/Down) move the choice and wrap at the ends; disabled options
  are skipped. All native: no script, no roving tabindex.
- Clicking anywhere on an option, its 2px frame included, chooses it: the radio covers the
  option and the label covers the frame. Targets are 44px tall at 100% and 88px at 200% text;
  the narrowest measured on the page is 66px.
- The change happens at once. A segmented control in a form with a Save button is still fine
  (it's a radio group), but never put one where choosing would navigate.
- Help describes the whole group (`aria-describedby` on the fieldset). Say why something is
  disabled there, or better, leave it enabled.
- Chosen never relies on colour: ink fill against paper in the wireframe, the system's selection
  colours in forced colours. Focus is a ring outside the pill, never a fill, so it never looks
  like the choice.

## Platforms

- **Installed PWA:** touch has no hover, so the press fills the segment at once and the shell's
  `touchstart` listener turns `:active` on in iOS Safari. Full width on a phone; at large Dynamic
  Type sizes the pills come apart rather than squeeze or scroll.
- **Mac:** in the toolbar, a view switcher is the system's segmented control and keeps its look;
  ours is for content. A native `NSSegmentedControl` takes one Tab stop and the arrows move a
  focus between segments that Space then selects; ours selects as the arrows move, as native
  radios do on the web. In a WebKit shell, turn on `tabFocusesLinks` so Tab reaches it.
- **SwiftUI:** `Picker(selection:)` with `.pickerStyle(.segmented)`: the native control, with
  our legend as a `Text` above it and the picker's own label hidden (`labelsHidden()`). Use it in
  toolbars and settings. Where content needs our look, an `HStack` of buttons in one
  `Capsule()` stroke with dividers, the chosen one filled (`.accessibilityAddTraits(.isSelected)`,
  grouped with `.accessibilityElement(children: .contain)`), and a `ViewThatFits` that falls back
  to a `VStack` of capsules when it doesn't fit.

## Do and don't

- **Do** use it for how one thing is shown: Grid or List, which side of the card, which cards.
- **Do** keep to two to four options of one short word each, with one always chosen.
- **Do** let it come apart on a narrow screen; it's still the same control.
- **Don't** use it to go somewhere. Sections of a screen are Tabs; places are the tab bar.
- **Don't** use it for five or more options, or long labels: that's a Select or a Radio group.
- **Don't** use an icon without its word.
- **Don't** lift a segment or move it: the fill is the state.

## Known limits

- The come-apart thresholds count options, not letters. A label wider than about 3.5em ("Hardest
  first") is squeezed inside its segment, wrapping at spaces and then inside the word, before the
  control comes apart. Keep labels to one short word.
- `.segmented` is an inline-size container, so it takes the width of its parent. Inside a flex
  row, give it a width (or `flex: 1`), or it collapses.
- The group's focus ring uses `:has()`. Without it the ring falls back inside the segment.
- Icons and text uses Due / All with `.ic--today` and `.ic--decks`, not the brief's Grid / List:
  there are no grid or list glyphs in the set yet. Grid / List is shown as text only.
- Hover has no forced-colours equivalent, as on the card.
- Checked in Chromium only, with touch and forced-colours emulation. Not on an iPhone (the
  `appearance: none` radio, `:active`), in Safari or in Firefox.
