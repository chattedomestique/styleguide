# Flashcards style sheet

v0.2 · wireframe stage · first element: **Cards** · 2026-10-19

The same sheet, two ways. **`index.html`** is the one to look at: live specimens, every
state, the markup read straight off the page. **This file** is the one to build from: exact
values, class names, and the reasons. If the two ever disagree, the CSS in `css/` wins and
the disagreement is a bug in whichever one is wrong. `node design/tools/check.mjs` catches
the mechanical kind. **`screens.html`** is the test bed: the system on a phone and a Mac, with
every element that isn't built yet marked where it would go.

> **Start here.**
>
> - **Six roles carry every colour:** `--canvas` (the page), `--paper` (a card), `--ink`
>   (text), `--ink-soft` (secondary text), `--line` (frames), `--accent` (the one "press
>   this"). Fills come from `data-tone="1"` … `"6"` or `"ink"`.
> - **Six classes build a screen:** `.card-grid`, `.card`, `.card__body`, `.card__title`,
>   and `.card--link` with `.card__link` in the title. Copy markup from `index.html`: every
>   specimen prints its own.
> - **Always:** read roles, never a hex.
> - **Never improvise:** use only the tokens and classes named here. If you need one that
>   isn't, its element hasn't been through the pipeline yet: say so instead.
> - **Before you finish,** run `node design/tools/check.mjs`. It must pass.

---

## 1. What this is

A design system for two kinds of app: installed mobile PWAs (touch first, offline) and
Mac-first desktop apps, in a web shell or in SwiftUI (keyboard and pointer). §4 has the
platform rules. When usability and looks disagree, usability wins.

Minimal, brutalist, friendly, and not AI-looking. Each word is a constraint you can check,
not a mood:

| Word | What it means here | How it's enforced |
| --- | --- | --- |
| Minimal | One type family. Two line weights. Nothing decorative. | Rules 1, 4, 7 |
| Brutalist | Visible structure. Hard 2px frames, hard shadows, big flat type, no softening effects. | Rules 1, 2 |
| Friendly | Circles and pills for everything you can act on. Large, relaxed type. Copy that talks like a person. | Rules 3, 5 |
| Not AI-looking | No gradients, blur, glass, tinted-circle icons, accent stripes, one-radius-for-everything, or copy that fits any product. | `check.mjs` bans the mechanical ones; rule 5 covers the rest |

### The seven rules

1. **Two line weights.** `--bw` 2px frames what you press or what contains. `--bw-thin` 1px
   only divides. `--bw-heavy` 4px exists for forced-colours mode and nothing else.
2. **Flat.** No gradients, no blur, no translucency. A shadow is hard-edged (zero blur) and
   means "you can press this". Nothing else gets one. Hover and press never move the hit
   box: the lift is the shadow alone, never a `transform`.
3. **Rectangles hold, circles act.** Containers are square. Buttons, handles and action
   slots are circles or pills; the one exception is the bar's small square control, which
   belongs to the frame.
4. **Uppercase is structure.** Bar labels and index numbers. Everything you read is sentence
   case.
5. **Say something real.** No lorem ipsum, no "John Doe", no "seamless". Copy comes from the
   product. In these specimens that means shapes, decks, cards known, streaks.
6. **Colour is a swap.** Components read roles. Only `tokens/color.*.css` contains a hex.
7. **No decoration.** If it carries no information and offers no action, it goes. No dotted
   backgrounds, no icons in tinted circles, no glyph repeated on every card in a grid.

### The test

Run it on any screen before calling it done.

- **Squint.** Blur your eyes or the screenshot. Does the structure survive with colour
  removed? If it only works in colour, colour is hiding a layout problem.
- **Cover the logo.** Could this be any product's card? Then the copy or the shape isn't
  doing its job.
- **Count.** Line weights: two. Type families: one. Gradients: zero. Blurred shadows: zero.
  Shadows on things you can't press: zero.
- **Read it out loud.** If it sounds like a landing page, rewrite it.

### Open decisions

The class prefix and the system's name (which includes the `flashcards.css` filename) are
still the owner's call. Until then the names stay as they are. Corners are decided: square.
Also open: arrow keys in a grid of link cards on the Mac, where Tab skips links by default.

---

## 2. Foundations

Everything is a custom property. Sizes are `rem` so they follow the reader's text size; line
weights are `px` so a 2px rule stays 2px.

### Files and layers

Apps link `dist/flashcards.css`: one flat file built by `node design/tools/bundle.mjs`, with
no `@import` chain to wait on. `css/flashcards.css` is its source. The file tree is in
`README.md`.

Layer order: `@layer tokens, base, components, wire, app, sheet;`. Later wins, so nothing
needs a specificity fight to override something beneath it. **App CSS goes in `@layer app`.**
Unlayered CSS beats every layer, so it would silently override card states. `sheet` is the
style-sheet page's own chrome and is not shipped. `css/screens.css` is a worked example of app
CSS: layout only, read from tokens, in `@layer app`.

### Type

One family, three widths. Archivo's width axis does the job a second typeface normally
does: wider for big figures, normal for reading, condensed for labels. Fallback stack:
`"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif`. Self-hosted, latin subset,
SIL OFL 1.1 (`fonts/OFL.txt`).

A style is a whole `font` shorthand plus its `letter-spacing` (and `text-transform` for
labels), so weight, width, size, line-height and family travel together. Use the `.t-*`
class or restate all of it; no ad-hoc `font:` shorthands. `semi-expanded` and `condensed`
are the keyword forms of `font-stretch` (112.5% and 75%).

| Token | Weight · width | Size | Line | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `--type-heading` | 600 · 100% | `--text-2xl` 32px | 1.1 | −0.015em | `.t-heading`. Screen and section headings. |
| `--type-title` | 500 · 100% | `--text-xl` 24px | 1.1 | −0.015em | `.t-title`. Card and group titles. Balanced. |
| `--type-body` | 400 · 100% | `--text-md` 16px | 1.5 | 0 | `.t-body`. Pretty-wrapped, at most `--measure`. |
| `--type-meta` | 400 · 100% | `--text-sm` 14px | 1.3 | 0 | `.t-meta`. Tabular figures. `--ink-soft`. |
| `--type-label` | 700 · 75% | `--text-xs` 13px | 1.2 | +0.08em | `.t-label`. Uppercase. 1–4 words. |
| `--type-figure` | 600 · 112.5% | `--text-3xl` 48px | 0.85 | −0.03em | `.t-figure`. Tabular. |
| (answer) | 700 · 100% | up to 3.75rem (60px), by card width | 1.1 | −0.015em | `.card__answer` only: the study card's answer. Centred. |

Size scale, all fixed `rem`: `--text-xs` 0.8125rem (13px) · `--text-sm` 0.875rem (14) ·
`--text-md` 1rem (16) · `--text-lg` 1.25rem (20) · `--text-xl` 1.5rem (24) · `--text-2xl`
2rem (32) · `--text-3xl` 3rem (48).

- **No `vw` in type.** Resizing a Mac window must not resize text. Inside a card, title,
  figure and answer sizes come from the card's own width (`cqi`), not the viewport (§3). The
  sheet's fluid sizes, its cover's poster line included, live in `sheet.css` and are not
  part of the system.
- **Floors:** body 16px, meta 14px, label 13px. Nothing smaller, the sheet included.
- **A label is 1–4 words** at line-height 1.2: never a sentence, never text meant to wrap.
- **A heading fits its longest real word at 320px.** That's why app screens get the 32px
  heading and not a poster style.
- **Running text** stops at `--measure` (62ch), set on `.t-body`. Card text stops at 40ch.
- **iOS follows Dynamic Type.** `base.css` sets `html { font: -apple-system-body }` inside
  `@supports (-webkit-touch-callout: none)`. The root becomes 17px at the default size and
  every `rem` follows. The guard keeps it to iOS: on a Mac that keyword is 13px.
- **Smoothing on dark surfaces only.** `-webkit-font-smoothing: antialiased` and
  `-moz-osx-font-smoothing: grayscale` sit on `.card__bar` and `[data-tone="ink"]`, never on
  `body`. On a light ground macOS would thin the 13px labels and 14px meta.
- **Gate 3 guidance (not shipped): dark mode drops weights a step**, because light text on
  dark blooms. Body 400→370, title 500→470, label 700→650, through weight tokens that the
  `--type-*` shorthands read. Smoothing then applies to the whole dark scheme.

**Loading the font.** The bundle keeps the font as a file, `fonts/archivo-latin-var.woff2`.
In a served shell, preload it:
`<link rel="preload" href="…/archivo-latin-var.woff2" as="font" type="font/woff2" crossorigin>`.
Without `crossorigin` the preload is wasted. A PWA precaches it in its service worker.
`index.html` doesn't preload: from disk the preload fails CORS and the font loads twice.

### Space

A 4px grid. `--space-N`: 1 = 4px · 2 = 8 · 3 = 12 · 4 = 16 · 5 = 24 · 6 = 32 · 7 = 48 ·
8 = 64. `--gutter` `clamp(1rem, 0.6rem + 1.6vw, 1.75rem)` is the gap between cards.
`--measure` 62ch is the widest a paragraph gets.

**Safe areas.** `--safe-top`, `--safe-right`, `--safe-bottom` and `--safe-left` are
`env(safe-area-inset-*, 0px)`. Future bars and the app frame read them, as in
`max(var(--gutter), var(--safe-left))`. Cards never do.

### Line

`--bw-thin` 1px (divides: foot rules, list rows) · `--bw` 2px (frames: cards, controls, tiles) ·
`--bw-heavy` 4px (forced-colours only).

### Shape

**Square, decided in v0.2.** Circles and pills are always `--radius-pill` (999px), for things
you act on. Everything else reads one of three roles, all `0`, so the decision lives in one
place:

| Role | Value | Used by |
| --- | --- | --- |
| `--radius-card` | 0 | the card frame |
| `--radius-tile` | 0 | icon tiles |
| `--radius-ctl` | 0 | the square bar control |

Why square: "rectangles hold, circles act" only reads when the rectangles really are square.
A rounded 2px black frame with a hard shadow is the stock component-kit look. On iOS and
macOS the screen and the window are already round, so square cards read as content, not
chrome. And square needs no exceptions and never clips a focus ring.

### Hit targets and focus

**Targets, by input.**

- **Touch:** every control is at least `--hit` (2.75rem, 44px) in both axes, foot links
  included. The drawn thing may be smaller: a 20px box sits inside a 44px control. Only links
  inside a sentence are exempt. 44 is the platform number (Apple's 44pt); WCAG 2.5.8 sets
  24px, so don't cite it for 44.
- **Mac pointer:** the floor is 24px on the web and 28pt native. It arrives later as one
  density switch at the root, for fine pointers only, when a real Mac screen needs it. Not
  now: 44 is the default everywhere.

**Focus, by platform.**

- **Web:** `--ring` 3px, `--ring-offset` 3px, colour `--focus`. Inside a card the offset drops
  to `--ring-offset-in` (2px), or goes negative on a bar or a list row, because the card
  clips its contents.
- **Native:** the system focus ring (accent colour, follows the shape). Users rely on it, and
  it adapts to Increase Contrast.
- **A ring takes the ink of the surface it lands on.** An inset ring uses that surface's ink
  role (`--card-bar-ink` in a bar, `--card-ink` on an ink card); an outside ring uses
  `--focus`. Test every tone, `ink` included.
- **Focus never looks like selection.**

### Tone (colour, at the wireframe stage)

Colour is deliberately absent. `tokens/color.wire.css` holds greys only. Its top half is the
grey primitives, the only hex values in the system. Its bottom half, the roles, is the
contract: components read roles, never a primitive.

| Role | Means |
| --- | --- |
| `--canvas` | the page behind everything |
| `--paper` | a card's default fill |
| `--ink` | text and frames |
| `--ink-soft` | secondary text on canvas, paper and untoned cards |
| `--ink-faint` | disabled, quiet decoration |
| `--line` | frames (ink in the wireframe) |
| `--line-soft` | decoration that must stay quiet |
| `--focus` | the focus ring (ink in the wireframe) |
| `--accent` / `--on-accent` | the one "press this" colour; ink until gate 3 |
| `--tone-1` … `--tone-6` | six fill slots: the future palette |
| `--on-tone-1` … `--on-tone-6` | text that sits on each slot |

**Tones.** Put `data-tone="1"` … `"6"` or `"ink"` on any element. `base.css` turns that into
`--tone-bg` and `--tone-ink` *for that element only* (both are registered with
`inherits: false`, so a toned card never paints its toned-less children). A component decides
what to do with them. `ink` is the inverted tone: ink fill, paper text.

**Contrast floors.** Ink is at least 8.4 : 1 on any tone, and soft ink at least 4.5 : 1. The
swatches in `index.html` compute the live ratios from the tokens; they are the source, and
check 9 fails anything below AA. A card's soft ink, `--card-ink-soft`, is `--ink-soft`; on a
toned card it is `color-mix(in srgb, var(--card-ink) 72%, var(--card-bg))`.

**More contrast.** Under `prefers-contrast: more`, `--ink-soft` and `--line-soft` become ink,
and so does a card's soft ink. Reduced transparency needs no rule while rule 2 holds.

### Motion (gate 4: guidance, not shipped)

Declared, not used. Every state changes instantly until gate 4, which is also the honest
brutalist default. The tokens are there so gate 4 doesn't have to invent them:
`--dur-press` 130ms · `--dur-hover` 200ms · `--dur-move` 520ms ·
`--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)` · `--ease-flip` `cubic-bezier(0.83, 0, 0.17, 1)`.

- **Only `transform` and `opacity` move things.** Card states don't move: `--lift` draws a
  shadow and `--fill` a colour, both registered numbers, so one `transition` covers hover,
  focus and press.
- **The flip:** `perspective` on the flip's direct parent, both faces hidden from behind
  (`backface-visibility: hidden`), eased with `--ease-flip`.
- **Reduced motion is gentler, not instant.** The flip becomes a crossfade of 150ms or less.
  The lift keeps its shadow. Focus rings are always instant. No global kill switch: it would
  delete the crossfade too.
- **SwiftUI:** scoped `.animation(_:value:)` with
  `.timingCurve(0.22, 1, 0.36, 1, duration: 0.2)` (our `--ease-out`), or
  `.spring(duration: 0.2, bounce: 0)`. Transforms and opacity only. Never `Animation.bouncy`.
  Reduce Motion turns the flip into a crossfade.

### Icons, v0

Five glyphs in `icons.css`, drawn on a 24 grid with a 2px square-cap stroke (the frame's
weight, so an icon reads as line work and not as a sticker). They are CSS masks, so they take
`currentColor`:

```html
<span class="ic ic--arrow" aria-hidden="true"></span>
```

`ic--arrow` (↗) · `ic--plus` · `ic--minus` · `ic--close` · `ic--check`. Size with
`--ic-size` (default 1.25rem). Decorative by default: when an icon is a control's only
content, the *control* gets the `aria-label`. ↗ means "leaves the app", on the web and on
Apple platforms, so it never marks an in-app link.

---

## 3. Card

A card holds one idea. It is a frame with slots; what goes in a slot is another element's
business. The slots `.card__ctl` and `.card__action` are where the Button element will land.

### House rules

- Reads roles only. No colour literals.
- A hard shadow means "you can press this". The lift is that shadow alone: the card never
  moves.
- **Never put `cqi` on `.card` itself.** A card is a container, but a container's own
  `cqi` resolves against *its parent*. Sizes that use `cqi` live on the parts, where the
  container is the card.
- **A card needs a width from its parent** (a grid cell, a block). `container-type:
  inline-size` means it has no intrinsic width, so it will collapse inside a shrink-wrapping
  flex row.
- States change instantly (gate 4 owns transitions).

### Anatomy

Nine parts, all optional except the frame. A card is whichever of them it needs.

| # | Part | Class | Spec |
| --- | --- | --- | --- |
| 1 | Frame | `.card` | `display: flex; flex-direction: column`; `border: 2px solid var(--card-line)`; `border-radius: var(--card-radius)`; `overflow: clip`; `container: card / inline-size`. |
| 2 | Bar | `.card__bar` | The frame made thicker. `min-block-size: 44px`; ink fill, paper text; label left, control right. Wraps when the text grows; the control stays at the end. Flips to paper-on-ink for `data-tone="ink"`. |
| | Label | `.card__label` | `--type-label`, uppercase, 1–4 words. A `<p>` or `<span>`, not a heading, when the card has a title. |
| | Control | `.card__ctl` | 44×44 hit area around a 20×20 box (`2px currentColor`, `--radius-ctl`); glyph 12px. The box fills while pressed. |
| 3 | Media | `.card__media` | `aspect-ratio: var(--ratio, 4 / 3)`; edge to edge; closed by a 2px rule; `img`/`video` are `object-fit: cover`; fill is the element's tone or `--tone-1`. |
| 4 | Body | `.card__body` | `padding: clamp(1rem, 5cqi, 1.5rem)`; flex column, `gap: 8px`; grows to fill. |
| | Head | `.card__head` | Same padding as the body. The study card's top strip. |
| 5 | Eyebrow | `.card__eyebrow` | `--type-meta`, soft ink. What kind of thing this is. |
| 6 | Title | `.card__title` | `--type-title` at `clamp(1.375rem, 8cqi, 2rem)` (22–32px); 20px (`--text-lg`) in a row or ghost card; balanced; breaks long words. |
| 7 | Text | `.card__text` | `--type-body`, 40ch max, pretty-wrapped. |
| | Meta | `.card__meta` | `--type-meta`, tabular, soft ink. |
| | Figure | `.card__figure` | `--type-figure` at `clamp(3rem, 27cqi, 6.5rem)`; tabular. A `<small>` inside is 0.42em, weight 500, soft ink. |
| 8 | Foot | `.card__foot` | `min-block-size: 44px`; `padding: 8px var(--card-pad)`; 1px rule above; `margin-block-start: auto`, so cards in a row end on one line. Its links and buttons are 44px tall; negative margins keep the foot at 44px. |
| 9 | Action | `.card__action` | 44px circle, `2px var(--card-ink)`. A `<button>` with an `aria-label`, except in a ghost, where the whole card is the control and the circle is `aria-hidden`. Fills with `--accent` when `--fill` is 1. |

Helpers: `.card__row` (flex, space-between, top-aligned, wraps), `.card__group` (flex column,
4px gap), `.card__list` (ruled rows, 44px each, 1px rules). In a list the whole row is the
link, with the padding on the link, not the `li`:
`<li><a href="…"><span>Shapes</span><span>12</span></a></li>`.

### Variants

Eight. Class names are the API. Each is shown live, with its markup, in `index.html`
under Variants (3.1–3.8).

| Variant | Modifier / recipe | Use | Notes |
| --- | --- | --- | --- |
| Plain | `.card` + `.card__body` (+ `.card__foot`) | The default. | |
| Panel | `.card__bar` (+ `.card__list`) | A titled card that folds away: lists, settings. | `data-tone="ink"` flips the bar to paper. |
| Media | `.card__media` | Picture first. | `--ratio` overrides 4 / 3. |
| Stat | recipe: eyebrow, `.card__figure`, optional meter, meta; `.card--square` in a grid | One number. | `.card--square` works on any card: `aspect-ratio: 1 / 1`, and the body spaces its first and last children apart. |
| Row | `.card--row` + `.card__tile`, `.card__main`, `.card__trail` | A thing in a list. | Below 18rem the trail drops under the title (children move between grid cells; the card can't re-template itself). |
| Link | `.card--link` + `.card__link` in the title | The whole card goes somewhere. | Eyebrow at the top, title group at the bottom. See below. |
| Ghost | `.card--ghost` (the card is the `<a>` or `<button>`) | An empty slot that asks to be filled. | Dashed; firms up on hover and focus; its circle fills on press. |
| Study | `.card--study` + `.card__head`, `.card__stage`, `.card__answer` | The flashcard. 5 / 7. | Static faces; the flip is gate 4. Fits a phone: `max-inline-size: min(22rem, (100svh - var(--chrome, 0px)) * 5 / 7)`. |

**Link card.** One anchor, inside the title; its `::after` is stretched over the whole card
(`inset: -2px`, so it covers the border too), so there is exactly one tab stop, one
accessible name, and the whole card is the target. No glyph or circle says "go": the card is
the target, and the title's underline on hover and focus is the cue. The card wears the focus
ring, not the anchor (`:has(.card__link:focus-visible)`; the anchor keeps its own ring where
`:has` is unsupported). Anything else clickable inside the card must sit above the link
(`position: relative; z-index: 1`).

### States

Two registered numbers drive the interaction: `--lift` (0 flat, 1 raised) and `--fill`
(0 outline, 1 filled). Every state just sets them, so hover, focus and pressed share one
definition, and gate 4 can animate both with a single `transition`. Lift is drawn by
`--shadow-lift`, a hard shadow of `calc(var(--lift) * var(--bw) * 2)` (4px) down and right in
`--card-line`, behind `--shadow-select`.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | Flat. No shadow. |
| Hover | `:hover`, only inside `@media (hover: hover)` | 1 | 1 | `4px 4px 0` hard shadow; the card does not move. `z-index: 1`; title underlines; a ghost goes solid. |
| Focus | `.card--link:has(.card__link:focus-visible)`, or `:focus-visible` on a ghost | 1 | 1 | `3px solid var(--focus)`, offset 3px, plus the hover look, so keyboard and pointer match. |
| Pressed | `:active` | 0 | 1 | A lifted card (link or ghost) goes back onto the surface; the fill stays. |
| Selected | `aria-selected="true"` on an option card, or `aria-current` on its `.card__link` | | | `--shadow-select: 0 0 0 2px var(--card-line)`: a ring that doubles the frame, so nothing shifts. |
| Disabled | `.card--disabled` (+ `aria-disabled="true"` on an option card) | | | Dashed frame, `--ink-faint`, hatch (from `wire.css`), `pointer-events: none`. No `href`. Says why in `.card__meta`. |
| Forced colours | `(forced-colors: active)` | | | Shadows and fills vanish there, so hover and focus get a 4px `Highlight` outline, selected a 4px border, and disabled is drawn in `GrayText`. |

- **Hover only where hover exists.** Every `:hover` rule sits inside `@media (hover: hover)`,
  so a tap never leaves a control stuck in its hover look. `.is-hover` and `:focus-visible`
  stay outside it.
- **Every control has a pressed look.** The action and the ghost fill; the bar control's box
  fills; list rows and foot links swap ink and paper. That replaces the browser's tap flash,
  which is translucent and off-palette, so `base.css` turns it off
  (`-webkit-tap-highlight-color: transparent`).
- **Selected, in full:** `.card:is([aria-selected="true"], .is-selected), .card:has(.card__link[aria-current]:not([aria-current="false"]))`.
- **The hand cursor is for links only**, as on the Mac. Buttons, the bar control and the
  action keep the arrow. No `not-allowed` cursor: a disabled card takes no pointer events.

The `.is-hover`, `.is-focus`, `.is-active` and `.is-selected` classes force a state for
documentation and tests. They are not API.

### Collections

A grid of cards is a list, so it announces "list, 4 items":
`<ul class="card-grid" role="list"><li><article class="card">…</article></li>…</ul>`.
Each `li` is a grid cell that stretches its card.

A collection is **navigable or selectable, never both.**

- **Navigable:** link cards, one tab stop each. The current one carries `aria-current` on
  its `<a class="card__link">`, never on the `<article>`.
- **Selectable:** a `role="listbox"` whose cards are `role="option"` with `aria-selected`.
  One tab stop for the whole list (roving `tabindex`): arrows and Home/End move, Space
  selects, ⌘-click and ⇧-click extend. An option's children are presentational, so an option
  card holds no link. Native: `List(selection:)`.
- **Drag only where it means something.** If cards don't reorder, set `draggable="false"` on
  `.card__link`, or a click-drag picks up a URL. If they do, drag gets a keyboard path and
  Undo.

### Layout

| Class | Does |
| --- | --- |
| `.card-grid` | `--card-min: 16rem`, set on the grid itself; `grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--card-min)), 1fr))`; `gap: var(--gutter)`. Places cards; never styles them. |
| `.card-grid--tiled` | `gap: 0`. Negative start margins on each item (`> :is(.card, li)`) overlap each frame onto its neighbour's, so two frames read as one 2px line, and a short last row still closes. |

### Responsive behaviour

Cards answer to their own width, not the window:

- Padding: `clamp(1rem, 5cqi, 1.5rem)`.
- Title: `clamp(1.375rem, 8cqi, 2rem)`. Figure: `clamp(3rem, 27cqi, 6.5rem)`. Answer:
  `min(17cqi, 3.75rem)`, with no rem floor: it follows the card's width, not the text size, so
  at large text sizes a long word stays whole where it can. Where it can't, `hyphens: auto`
  breaks it at a syllable ("Hexa-gon"), so the page needs its `lang`.
- Row: `@container card (max-width: 18rem)` moves the trail to row 2, column 2.
- The bar, `.card__row`, the foot and the ghost wrap (`flex-wrap: wrap`) when text grows.
- Holds from 320px up with no horizontal scroll. At 320px with 200% text, no card clips a
  control or a title.

### Accessibility

- One tab stop per link card. Its accessible name is the title text.
- Every touch target is at least 44px: the action circle, the bar control, list rows, and the
  links and buttons in the foot.
- The focus ring is always visible: outside the frame on the card itself; inset on the bar
  and on list rows, in the ink of the surface it lands on.
- Contrast is at least 8.4 : 1 for ink on any tone and at least 4.5 : 1 for soft ink. Under
  `prefers-contrast: more`, soft ink becomes ink.
- A card title sits one heading level below its section's heading: an `h2` section takes
  `h3` titles. One heading per card; the bar label is the heading only when there is no
  `.card__title`.
- Meters use `role="meter"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and an
  `aria-valuetext` in the card's own words ("5 of 12 learned").
- Decorative icons are `aria-hidden="true"`. A control whose only content is an icon gets an
  `aria-label`.
- Reset lists keep `role="list"` so Safari keeps the semantics that `list-style: none`
  would drop.
- A disabled card is not a link (no `href`) and says why in visible text: "Unlocks after
  Colours".
- Every gesture (swipe, long-press) also has a visible button. Hints name the action, not the
  input: "Turn over", not "Tap to flip".
- Forced-colours mode is handled (see States).

### Do and don't

- **Do** give each card one idea and one place to go.
- **Do** use tones for rhythm across a grid, never to carry meaning. Colour is not state.
- **Do** let the grid place cards and the card style itself.
- **Don't** nest cards, or put two competing actions in one link card.
- **Don't** add a shadow at rest, a stripe down one edge, or a gradient.
- **Don't** fake "disabled" with opacity. Use the state.
- **Don't** centre-align body text. Titles and answers may centre; paragraphs don't.
- **Don't** pad `.card` itself. Padding goes on the parts.

### Known limits

- The stretched link reaches over the border only through `overflow-clip-margin`, because
  the card clips at its padding box. Safari ignores it, leaving a 2px band at the very edge
  of a link card where a click does nothing.
- Text inside a link card can't be selected by dragging, because the stretched link sits on top.
- The study card has static faces only. The flip is gate 4.
- No dark mode yet. It arrives with colour, at gate 3.
- Needs a 2024-era browser: container queries, `:has()`, `@property`, `color-mix()`, cascade
  layers. Chrome/Edge 114+, Safari 16.4+, Firefox 128+. `text-wrap: balance | pretty` and
  `overflow-clip-margin` degrade gracefully.

---

## 4. Platforms

### PWA: installed, touch first

- **Edge to edge.** The viewport meta adds `viewport-fit=cover`. Bars and the app frame pad
  by the safe-area tokens (§2 Space); cards never read them.
- **One canvas.** `theme-color` and the manifest's `background_color` are `--canvas`.
- **Viewport units.** `dvh` for the app frame only, so it tracks the browser bars. Anything
  sized once uses `svh`, so it doesn't jump when the bars move (the study card).
- **Inputs are 16px or more,** or iOS zooms on focus: `base.css` sets
  `:is(input, select, textarea) { font-size: max(1rem, 1em) }`.
- **Scrolling stays put.** Inner scrollers get `overscroll-behavior: contain`. Refresh is a
  button, not pull-to-refresh.
- **No browser chrome.** Standalone has no back or refresh button, so every screen past the
  root shows a back control.
- **Never blank.** Empty is a ghost card that offers the first step. Offline or error is a
  plain card that says what happened, with "Try again" in its foot.
- **Text size follows the reader:** Dynamic Type is on (§2 Type). Test at the largest size.
- **Pressed states need a listener on iOS.** Safari only applies `:active` when a `touchstart`
  listener exists, so the shell adds `document.addEventListener("touchstart", () => {}, { passive: true })`.
  Not yet checked on a device.

### macOS: Mac-first, web shell or SwiftUI

- **Every command is in the menu bar, with a shortcut.** Standard ⌘ shortcuts behave as
  usual. SwiftUI: `CommandMenu` and `.keyboardShortcut(_:)`. Web shell: the shell's native
  menu, not only a keydown handler.
- **Keys.** Tab moves between groups; arrows and Home/End move within a list or grid. Return
  opens. Space selects or presses. Escape cancels, closes, then clears the selection.
- **Don't depend on Tab.** By default macOS tabs only to text fields and lists, and Safari
  and WKWebView skip links. Shortcuts and arrows are the main route; in a WebKit shell, turn
  on `tabFocusesLinks`.
- **Context menus are shortcuts, not the only route.** Every item is also in the menu bar or
  a visible control. Right-click acts on the selection, selecting first. SwiftUI:
  `.contextMenu(forSelectionType:)`.
- **Windows resize live.** Set a minimum window size and test at it and at full screen.
  Cards follow their container and type ignores the window. SwiftUI:
  `.windowResizability(.contentMinSize)`.
- **Glass is the system's, never ours.** Native window chrome keeps its glass. We never call
  `.glassEffect()` and never put glass on cards or content.
- **System font and colours for native chrome only.** Menus, toolbar, sidebar, alerts and
  standard controls use SF and system colours. Archivo and our roles are for what we draw:
  chrome set in Archivo reads as a web page in a window.

### SwiftUI mapping

1 CSS px = 1 pt. `tracking` is in points (em × size).

| Token (CSS) | SwiftUI | Note |
| --- | --- | --- |
| `--type-heading` 600 · 32 · −0.015em | `.font(.custom("Archivo", size: 32, relativeTo: .title)).fontWeight(.semibold).tracking(-0.48)` | One fixed size per window class. |
| `--type-title` 500 · 24 · −0.015em | `.custom(…, size: 24, relativeTo: .title2).fontWeight(.medium).tracking(-0.36)` | The card's `cqi` title becomes 22 or 28, picked with `ViewThatFits` or a size class. |
| `--type-body` / `--type-meta` 400 · 16 / 14 | `.custom(…, size: 16, relativeTo: .body)`; meta `size: 14, relativeTo: .callout` with `.monospacedDigit()` | `.lineSpacing(_:)` only adds space, so tune it towards 1.5 by eye. |
| `--type-label` 700 · 75% · +0.08em · upper | `.fontWeight(.bold).fontWidth(.condensed).tracking(1.04).textCase(.uppercase)` | Check on a device that `.fontWidth(_:)` drives Archivo's `wdth` axis; if not, use a `wdth` font variation. |
| `--type-figure` 600 · 112.5% · tabular | `.fontWeight(.semibold).fontWidth(.expanded).monospacedDigit()` | No named 112.5% width: `.fontWidth(.expanded)` or a `wdth` variation. |
| `--space-1` … `--space-8`, `--gutter` | `enum Space { static let s1: CGFloat = 4 … s8 = 64 }`; `.padding(Space.s4)` | `--card-pad` is 16 compact, 24 regular. |
| `--bw` 2 / `--bw-thin` 1 | `.overlay(shape.strokeBorder(.line, lineWidth: 2))`; rule: `Rectangle().fill(.ink).frame(height: 1)` | `strokeBorder` draws inside, like CSS `border`. `Divider()` takes the system tint, not ink. |
| `--radius-card`, `--radius-tile`, `--radius-ctl` (0); `--radius-pill` | `Rectangle()`; `Capsule()`, `Circle()` | Use one shape for fill, stroke, `.clipShape(_:)` and `.contentShape(_:)`. |
| `--lift` / `--fill`, hard shadow | a custom `ButtonStyle` (`configuration.isPressed`), `.onHover(perform:)`, `@Environment(\.isFocused)`; shadow: `shape.fill(.line).offset(x: 4, y: 4)` behind | Never `.shadow(radius:)` above 0. Never glass. |
| Colour roles, `data-tone` | asset colour sets `canvas`, `paper`, `ink`, `inkSoft`, `inkFaint`, `line`, `focus`, `tone1…6`, `onTone1…6`, each with Any, Dark and High Contrast; `--accent` → `AccentColor` | A tone is a `Tone` enum parameter, not inherited (as with `inherits: false`). |
| `--hit`, `--ring` | iOS `.frame(minWidth: 44, minHeight: 44).contentShape(.rect)`; macOS at least 28×28, `.controlSize(.regular)`; system focus ring, `@FocusState` | See Hit targets and focus. |
| `.card-grid`, `@container` | `LazyVGrid(columns: [GridItem(.adaptive(minimum: 256), spacing: 24)])`; `ViewThatFits(in: .horizontal) { HStack …; VStack … }` | A selectable collection on a Mac is a `List` or `Table`: ⌘ and ⇧ selection for free. |

---

## 5. Wireframe kit

`wire.css` holds placeholders for things that don't exist yet. Each `.wf-*` class is deleted
the day its real element ships, and nothing in `components/` may depend on it.

| Class | Stands in for | Replaced by |
| --- | --- | --- |
| `.wf-media` (+ `.wf-tag`) | an image or illustration: a box with an X | real media |
| `.wf-shape` | one of the product's own illustrations | the real drawing |
| `.wf-meter` | progress | the Meter element |
| `.wf-pill` | a status tag | the Tag element |
| `.wf-slot` (+ `.wf-slot--pill`) | a whole element that isn't built yet; `data-wf` names it and the name sits on its top edge. It holds the real copy, in grey. Set `--wf-under` to the colour behind it. | that element |
| disabled hatch | the disabled look | gate 3 |

How to read a wireframe: a box with an X is an image; flat grey is a tone slot; black is the
inverted tone; dashed is empty or unavailable; hatch is disabled; a grey line with a name on
it is an element that isn't built yet.

---

## 6. Skills we build with

Seven skills inform this system. They advise; they don't decide. When sources disagree:
first usability and accessibility facts (WCAG 2.2 AA, platform conventions), then this file,
then the skills. §7 lists where we went against one. Never run a skill's own
generate-a-design-system workflow or its scripts.

| Skill | Load it | Take | Ignore |
| --- | --- | --- | --- |
| ui-ux-pro-max | For a final checklist pass on a finished screen, or to see if a choice is a named template in its `styles.csv`. | Touch targets, hover vs tap, viewport meta, readable sizes, no sideways scroll at 375 and 1440, stable hover, safe areas, `dvh`, overscroll, 8px between targets. | Its styles, palettes and pairings; floating navbars; glass; Tailwind-only rules; its icon-set picks; 150–300ms transitions before gate 4. |
| neobrutalist-web-designer | When a state must stay hard-edged (hover, pressed, selected), or to check nothing has gone soft or glassy. | Zero-blur shadows, opaque flat fills, a physical pressed state, focus visible in every state, its negatives (no blur, gradients or transparency). | 3–4px borders, shadows at rest, borders that grow with the breakpoint, the primary palette, its fonts, uppercase headings, `transition: all`. |
| retro-css-architecture | Rarely: only when reorganising the entry stylesheet or the file layout. | One entry stylesheet every surface imports, semantic roles with a dark variant each, fixed px for line work. | Everything 8-bit (pixel fonts, pixelated images, pixel borders), Tailwind-first, `@import` of Google Fonts. |
| typography | When changing type tokens, font files or loading, measure, or dark-mode type. | Size floors, line-height bands (body 1.5, headings 1.1–1.3, labels 1.2), caps tracking, 45–75ch, preload with `crossorigin`, smoothing on dark only, the dark weight drop. | Its font picks, serif + sans pairing, `vw`-fluid app sizes, the Tailwind sections. |
| web-design-guidelines | When writing or reviewing an element's HTML and CSS, and for each gate's keyboard and touch pass. | Focus, heading order, skip link, semantics; targets, viewport and reflow; hover parity, tap highlight, `touch-action`. | Its sample colours and soft-shadow hover, the global reduced-motion kill switch, "44px = WCAG 2.5.8" (2.5.8 is 24px), the React and performance sections. |
| interaction-design | When specifying states, gestures, lists and grids, keyboard paths, drag, menus, empty and error states; and at gate 4. | A state table per element, the keyboard as the foundation, roving tabindex, ⌘ and ⇧ selection, a visible alternative to every gesture, "explain why" for disabled, its timings. | Opacity for disabled, the 2px blue ring, springs and overshoot, a "shadow + scale" lift, haptics, VR, the theory chapters. |
| swiftui-expert-skill | When writing or reviewing a native SwiftUI screen, or porting a token or component. | Modern APIs (`foregroundStyle`, `Button` over `onTapGesture`), `@Observable` and private `@State`, `containerRelativeFrame` over `GeometryReader`, scoped animation at gate 4. | Liquid Glass on content, `Animation.bouncy`, its iOS-only scope (nothing on menus, windows or Mac control sizes). |

---

## 7. Where we differ from the skills

| Skill says | We do | Why |
| --- | --- | --- |
| A hard shadow on every card at rest; 3–4px borders (neobrutalist-web-designer) | A shadow only on hover; 2px frames, 1px dividers | A shadow at rest is a third line weight and the loudest template tell. |
| Reduced motion sets every animation to 0.01ms (web-design-guidelines, interaction-design) | Gentler, not instant: the flip becomes a crossfade of 150ms or less | A kill switch deletes the crossfade too. |
| Disabled is reduced opacity (interaction-design) | Dashed frame, faint ink, hatch, and the reason in words | Opacity is translucency (rule 2) and vanishes in forced colours. |
| Float the navbar (ui-ux-pro-max) | Bars run edge to edge and own the safe-area inset | Content scrolling behind a floating bar needs blur or a shadow to separate it, and the gap costs about 32px on a small phone. |
| Glass cards and buttons (swiftui-expert-skill) | Glass only as the system's own chrome | Glass is the navigation layer; cards are content. |
| System type and colour everywhere (macos-app-design) | SF and system colours in native chrome only; Archivo and our roles in content | Platform convention wins for chrome; content keeps its voice. |
| `.spring(…)` for interaction, `Animation.bouncy` for play (swiftui-expert-skill) | `--ease-out` as a timing curve, or a spring with no bounce | Bounce is decoration (rule 7). |
| Archivo with Space Grotesk (ui-ux-pro-max `typography.csv`; neobrutalist-web-designer pairs Archivo Black with it); pair by contrast (typography) | One family; the width axis supplies the contrast | One 90 KB file, one fallback chain. Space Grotesk is a banned default. |

---

## 8. Changelog

- **0.2.1** · 2026-10-19 · `screens.html`: a phone (Today, Study) and a Mac window built from
  the system, with `.wf-slot` marking every missing element, and a findings list. Fixes it
  found: the study answer no longer breaks mid-word at large text sizes (no rem floor, plus
  `hyphens: auto`), and `base.css` resets `h5` and `h6`. The gate
  and the bundle cover the new page.

- **0.2.0** · 2026-10-19 · Corners decided: square; the soft mode is gone. Cut the Notch and
  Stack variants, the decorative ↗ circle on link cards, and the sheet's "Not this" and
  "Pipeline" sections. Eight variants. Lift is a shadow only; hover is touch-safe; every
  control has a pressed look; 44px foot links; rows wrap at 200% text; focus rings follow
  their surface. Selection and collections modelled; disabled says why. A heading style
  replaces the poster display; type sizes are fixed `rem`. Prefers-contrast, Dynamic Type
  and safe-area tokens. New: Platforms, Skills we build with, Where we differ.
- **0.1.0** · 2026-09-30 · Foundations (type, space, line, shape, hit, motion). Wireframe
  colour layer with six tone slots. Card: ten variants, six states, two grids. Gates 0–2
  closed for Cards.
