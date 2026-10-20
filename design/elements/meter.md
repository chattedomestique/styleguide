# Meter and Spinner

Element 05 · gates 0–2 done (wireframe, states) · page: `elements/meter.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Meter and Spinner's own spec.

## Brief

*How far along; and "working on it" when nobody knows how long.*

- **Variants:** meter (`role="meter"` with `aria-valuetext`, for a value in a range: "5 of 12
  known"); progress (`<progress>`, for a task: "Importing 40 of 120 cards"); segments (one
  segment per card, up to 20, for a short deck); spinner (always paired with words: "Loading
  decks…").
- **Notes:** each has a visible label and value text; the bar never stands alone. The spinner
  is static until gate 4 gives it motion, so the still frame must read on its own. Meter
  replaced the wireframe kit's meter stand-in.

## House rules

- **Three blocks for four variants.** `.meter` (meter, and segments as `.meter--segments`),
  `.progress` and `.spinner`. Each class says what the thing *is*, because the choice between
  them is about meaning (a level, a task, an unknown wait), and the markup underneath differs:
  a `div` with `role="meter"`, a native `<progress>`, a `role="status"` line.
- Ink is `currentColor` and the track is the surface itself, so every variant reads on paper,
  on a tone and on an ink card with no class.
- Square: a bar holds, it doesn't act (rule 3). Frames 2px, `--radius-tile`.
- No motion. The spinner is a designed still frame; an indeterminate `<progress>` is not used.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Block | `.meter`, `.progress` | `flex`, wraps, `space-between`, `gap: 8px 12px`. Label and value share the first line; the bar takes the next. At large text the value drops under the label. |
| Label | `.meter__label`, `.progress__label` | `--type-meta`, the surface's ink. For progress, a real `<label for>`. |
| Value | `.meter__value`, `.progress__value` | `--type-meta`, `tabular-nums`, soft ink (`--card-ink-soft`, falling back to `--ink-soft`). `aria-hidden`: the bar's `aria-valuetext` says the same words, so it's heard once. |
| Bar | `.meter__bar` | `block-size: 16px` (`--space-4`), `border: 2px solid currentColor`, clips. `::before` is the fill: `inline-size: var(--value)` from the start edge, `currentColor`. Carries `role="meter"` and the `aria-value*` attributes. |
| Segment | `.meter__seg` | One empty `<i>` per card inside a segments bar. 2px frame; filled when its position ≤ `aria-valuenow`. |
| Progress bar | `.progress__bar` | `<progress>` with `appearance: none`, the same 16px frame; the value pseudo-elements (`::-webkit-progress-value`, `::-moz-progress-bar`) are `currentColor`. |
| Spinner | `.spinner` | `inline-grid`, implicit columns `auto minmax(0, 1fr)`, `gap: 8px`. `::before` is the glyph: 20px (`--ic-size`), a mask of an open ring on the 24 grid (r 9, 2px, square caps, the top-right quarter missing), `currentColor`, centred on the first line of the words. |

## Variants

Shown live, with markup, in `elements/meter.html` (1.1–1.4).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Meter | `.meter` + `.meter__bar` | A level in a range: cards known in a deck. | `role="meter"`, `aria-labelledby` the label, `aria-valuemin`/`max`/`now`, `aria-valuetext` in the product's words. `--value` (a percentage) sets the fill; keep it equal to now / max. |
| Progress | `.progress` + `.progress__bar` | A task that will finish: an import. | Native `<progress max value>`, labelled by `<label for>`, `aria-valuetext` for the words. Always with a value. A task of unknown length gets the spinner. Done: the label turns past tense ("Imported"). |
| Segments | `.meter--segments` | A deck of up to 20 cards. | The same `role="meter"` bar holding one `.meter__seg` per card. The fill reads `aria-valuenow` (20 attribute selectors), so what's heard is what's seen and there's no per-segment class. A grid of equal boxes, at least 8px each (4px inside the frame), 4px apart; when 20 won't fit on one line they wrap into even rows instead of thinning out. Past 20, use the meter. |
| Spinner | `.spinner` | An unknown wait. | The words go inside: `<p class="spinner" role="status">Loading decks…</p>`, so glyph and words can't come apart. Empty and `aria-hidden`, it is the glyph alone, for a busy button whose label is the words (Button, busy). |

**The still frame.** An open ring reads as "busy" without moving, on every platform, and gate
4 only has to turn it. It is line work on the icon grid, so it sits next to icons and takes
the leading-icon slot in a button at the same size. Rejected: spokes in graded lengths (read
as broken at 20px), uniform spokes (read as brightness), three dots (read as "more").

**In a card's stat.** The eyebrow and the figure already are the label and the value, so the
bar goes in on its own: `<div class="meter__bar" role="meter" aria-label="Cards known" …>`.
It still never stands alone; the words are just the card's.

**The full meter.** Label, value and bar together, as on the Carry on card:

```html
<div class="meter">
  <span class="meter__label" id="…">Shapes</span>
  <span class="meter__value" aria-hidden="true">5 of 12 known</span>
  <div class="meter__bar" role="meter" aria-labelledby="…" aria-valuemin="0"
    aria-valuemax="12" aria-valuenow="5" aria-valuetext="5 of 12 known"
    style="--value: 41.67%"></div>
</div>
```

## States

Nothing acts, so there is no hover, focus or press.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Empty | `aria-valuenow="0"`, `--value: 0%` | | | The frame alone, and words that say so ("None known yet"). |
| Part of the way | `aria-valuenow` between | | | Filled from the start edge (right to left in a right-to-left page). |
| Done | `aria-valuenow` = max | | | Solid; the words change ("All 12 known", "Imported"). |
| Spinner | always | | | One state until gate 4. |
| Forced colours | `(forced-colors: active)` | | | The bars opt out and set `color: CanvasText`, so frames, fills and segments all follow it on `Canvas`. The spinner glyph paints `CanvasText`. |

## Accessibility

- Every bar has a visible label and a visible value in words. The bar is named by the label
  (`aria-labelledby`, or `<label for>`), and speaks `aria-valuetext`.
- The visible value is `aria-hidden` because `aria-valuetext` repeats it word for word; if a
  screen-reader pass finds `aria-valuetext` unsupported somewhere, drop the `aria-hidden`.
- Say amounts the way a person would: "5 of 12 known", never "42%".
- The spinner line is `role="status"` (polite), so "Loading decks…" is announced once, not
  repeated. When loading ends, replace the line with the result or remove it.
- Contrast: fills and frames are the text colour, so they inherit its contrast on every
  surface.

## Platforms

- **Installed PWA:** offline, don't spin on the network: say what's on the device. A long
  import keeps its progress on screen, so a person can leave and come back to it. The spinner
  is for short waits; anything you can count gets progress.
- **Mac:** system chrome (toolbar, sheets) keeps the system spinner and progress bar; ours are
  for content. The value text is selectable like any text.
- **SwiftUI:** progress is `ProgressView(value:total:)` with a custom `ProgressViewStyle`
  drawing a `Rectangle()` frame and fill; a meter is `Gauge(value:in:)` with a custom
  `GaugeStyle`, `.accessibilityValue(Text("5 of 12 known"))`. Segments: an `HStack` of
  `Rectangle()`s, wrapping with a `Layout` past one line. The spinner is `Circle().trim(from: 0,
  to: 0.75)` stroked with `StrokeStyle(lineWidth: 2, lineCap: .square)`, static until gate 4,
  always beside a `Text`.

## Do and don't

- **Do** name what's measured and give the amount in words.
- **Do** use progress whenever the work can be counted.
- **Don't** show a bar, or a spinner, without its words.
- **Don't** use segments past 20, or a meter where a number alone would do.
- **Don't** use `<progress>` without a value (it animates, and it says nothing).

## Known limits

- `--value` duplicates `aria-valuenow / aria-valuemax`: CSS can't divide attributes yet
  (typed `attr()` isn't in every engine). Keep them in step.
- Segments cap at 20 because the fill is 20 attribute selectors.
- At 320px with 200% text, 20 segments wrap into an uneven pair of rows (18 and 2).
- Firefox draws `<progress>` from its own pseudo-element; checked only in Chromium so far.
