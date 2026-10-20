# Disclosure

Element 20 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/disclosure.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Disclosure's own spec.

## Brief

*Show more, in place.*

- **Markup:** `<details>` and `<summary>`, styled. `ic--down` turns to `ic--up` with the open
  state (static glyphs, no rotation until gate 4). *Gate 4 (wave 7) replaced the swap: the
  `ic--down` glyph turns half a turn (Motion).*
- **Variants:** single; a group (an FAQ-like list, each independent); exclusive groups with
  `name` (one open at a time) only as a progressive extra.
- **Notes:** the summary is the 44px target. Copy: "How spaced repetition works", "Show the
  answer's notes".

## House rules

- **Native, no script.** `<details>` gives Enter and Space, the open state and the
  "expanded"/"collapsed" announcement for free.
- **A disclosure is a ruled row,** like a list row: a rectangle that holds, 1px rules above and
  below. Stacked, neighbours share one rule (`.disclosure + .disclosure` pulls up 1px), so a
  group needs no wrapper and no extra class.
- **The summary is the whole row** and the target: at least 44px, words first, the glyph at the
  end.
- **Open turns the glyph:** `ic--down` rotates half a turn, so it points up. A transform, so in
  forced colours the glyph still says which way it went.
- **What a list row does:** hover underlines the words, press fills the row with ink. No lift:
  rows touch.
- **It takes the surface's ink.** Rules, press and ring read `--card-ink` and `--card-bg`
  (falling back to `--ink` and `--paper`), so a disclosure in a card works on every tone,
  `ink` included.
- The rules and the press reach 8px past the words on each side (a negative inline margin, paid
  back as padding), so the words line up with the paragraphs around it.
- Reads roles only. `:hover` only inside `@media (hover: hover)`.
- Motion (gate 4): the glyph turns, the body opens where the browser can, and the press fill
  eases (Motion, below).

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Disclosure | `.disclosure` | The `<details>`. `margin-inline: -8px`; `border-block: 1px solid` the surface's ink (`--disclosure-ink`). |
| Summary | `.disclosure__summary` | The `<summary>`: flex, `justify-content: space-between`, `gap: 12px`, `min-block-size: 44px`, padding 8px. `--type-body` at 600, line-height 1.3; wraps. No marker (`list-style: none`, and `::-webkit-details-marker` hidden). `cursor: default`: the hand is for links only. |
| Glyph | `.disclosure__icon` | An `.ic.ic--down`, 20px, `aria-hidden`, last in the summary. `[open]` turns it: `rotate: 0.5turn`. |
| Body | `.disclosure__body` | A flex column, 12px between paragraphs, padding 4px 8px 16px, at most `--measure` of text. `--type-body`, pretty-wrapped. |

```html
<details class="disclosure">
  <summary class="disclosure__summary">
    How spaced repetition works
    <span class="ic ic--down disclosure__icon" aria-hidden="true"></span>
  </summary>
  <div class="disclosure__body">
    <p>Cards you know come back less often: tomorrow, then in three days, then in a week.</p>
  </div>
</details>
```

## Variants

Shown live, with markup, in `elements/disclosure.html` (1.1–1.3).

| Variant | Markup | Use | Notes |
| --- | --- | --- | --- |
| Single | `.disclosure` | One thing most people won't need: how spaced repetition works; a card's notes. | In a card it takes the card's ink and sits in the card's padding. |
| Group | `.disclosure` after `.disclosure` | A list of questions answered in place: Help. | Each opens on its own. Put a heading over the group; the summaries are not headings. |
| Exclusive group | `details[name]`, one `name` for the group | Steps read one at a time. | Opening one closes the others (Chrome 120, Safari 17.2, Firefox 130). Elsewhere each opens on its own, which is fine: it's a progressive extra. Never for things the reader must compare. |

## States

| State | Trigger | `--fill` | Also |
| --- | --- | --- | --- |
| Closed | none | 0 | Words, `ic--down`, a rule above and below. |
| Hover | `:hover` on the summary, only inside `@media (hover: hover)` | 0 | A 2px underline under the words. |
| Focus | `:focus-visible` | 0 | The underline and the 3px ring inside the row (`outline-offset: -3px`), in the card's ink on a card. |
| Pressed | `:active` | 1 | The row fills with the surface's ink; words and glyph turn to its ground. |
| Open | `[open]` | 0 | The glyph turned to point up; the body shows under the summary, inside the rules. |
| Forced colours | `(forced-colors: active)` | | Rules in `CanvasText`; press paints `Highlight`/`HighlightText`, glyph included; the glyph is `CanvasText` (icons.css) and its turn is a transform, which forced colours keep, so open still reads as up. |

`.is-hover`, `.is-focus` and `.is-active` on the summary force a state for the page and for
tests. They are not API.

## Motion

Gate 4 (`STYLE.md` §2 Motion).

- **The glyph turns.** `ic--down` rotates half a turn when the disclosure opens and back when it
  closes (`transition: rotate var(--dur-move) var(--ease-out)`), replacing the old swap to
  `ic--up`. One glyph, so it can't disagree with itself, and a transform, so forced colours keep
  it pointing the right way.
- **The body opens, where the browser can.** Inside
  `@supports (interpolate-size: allow-keywords) and selector(::details-content)`, `.disclosure`
  sets `interpolate-size: allow-keywords`, and `::details-content` (the box the browser hides) is
  `block-size: 0` closed and `auto` open, clipped, with
  `transition: block-size var(--dur-move) var(--ease-out), content-visibility var(--dur-move) allow-discrete`.
  `content-visibility` is the discrete half that keeps the body drawn while it closes. Height is
  layout, which check 5 never allows, so this is its one named exception: `block-size`,
  `height` and `content-visibility`, in `disclosure.css`, on `::details-content` only. Elsewhere
  (Safari and Firefox today) the body opens in place, which is the design without motion.
- **The press fill eases** as a list row's does: in over `--dur-press`, out over `--dur-hover`.
  The underline and the ring are instant.
- **Reduced motion:** the glyph turns and the body opens at once (nothing moves); the press fill
  fades over `--dur-fade`.
- An `open` set in the markup is simply open on load: nothing turns or grows.

## Accessibility

- The summary is exposed as a disclosure button with expanded or collapsed; Enter and Space
  toggle it. Nothing to add: no `aria-expanded`, no role.
- The summary's name is its words; the glyph is `aria-hidden`.
- Don't put links, buttons or headings inside the summary: it's already one control. A heading
  goes above the group.
- Find in page may open a closed disclosure when the match is inside it (Chromium does); not every
  browser does yet, so don't hide the answer to what people search for most.
- The target is the whole row, at least 44px; measured at 100% and 200% text.

## Platforms

- **Installed PWA:** a tap anywhere on the row opens it; the press shows on iOS with the shell's
  `touchstart` listener. The glyph turns; the body grows in Chromium, and opens in place in
  Safari (Motion).
- **Mac:** Return or Space toggles it (Tab reaches it with Keyboard navigation on). In system
  chrome (an inspector, a Settings window) the system's disclosure triangle stays.
- **SwiftUI:** `DisclosureGroup(isExpanded:)` with a custom `DisclosureGroupStyle`: a `Button`
  row (`.frame(minHeight: 44)`, `.contentShape(.rect)`) holding the label, a `Spacer()` and
  the down `Image` with `.rotationEffect(.degrees(configuration.isExpanded ? 180 : 0))`, 1pt
  rules above and below; the content under it when expanded, inside
  `withAnimation(.timingCurve(0.22, 1, 0.36, 1, duration: 0.52))`, or none under Reduce Motion. An exclusive group is one `@State` optional id shared by the group.

## Do and don't

- **Do** write the summary as what you'll see: a question, or "Show the answer's notes".
- **Do** keep what's inside short; a long read deserves its own screen.
- **Don't** hide what everyone needs, an error, or a required field.
- **Don't** put controls in the summary.
- **Don't** swap the glyph for `ic--up` as well as turning it: it would point down again.

## Known limits

- `name` (exclusive groups) is newer; older browsers let several open.
- The body's height eases only where `interpolate-size` and `::details-content` both exist
  (Chromium 131 and later). Chromium doesn't list that transition in `document.getAnimations()`,
  so it was checked by timing, not by pausing it.
- Whether find in page opens a closed `<details>` depends on the browser; not checked here.
- Checked in Chromium only (keyboard, touch, forced colours), not on an iPhone, in Safari or in
  Firefox.
