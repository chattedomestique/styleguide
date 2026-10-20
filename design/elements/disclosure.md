# Disclosure

Element 20 · gates 0–2 done (wireframe, states) · page: `elements/disclosure.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Disclosure's own spec.

## Brief

*Show more, in place.*

- **Markup:** `<details>` and `<summary>`, styled. `ic--down` turns to `ic--up` with the open
  state (static glyphs, no rotation until gate 4).
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
- **Open swaps the glyph**, down for up, by re-pointing the icon's mask (`--ic`). Static: no
  rotation until gate 4. In forced colours the glyph still says which way it went.
- **What a list row does:** hover underlines the words, press fills the row with ink. No lift:
  rows touch.
- **It takes the surface's ink.** Rules, press and ring read `--card-ink` and `--card-bg`
  (falling back to `--ink` and `--paper`), so a disclosure in a card works on every tone,
  `ink` included.
- The rules and the press reach 8px past the words on each side (a negative inline margin, paid
  back as padding), so the words line up with the paragraphs around it.
- Reads roles only. `:hover` only inside `@media (hover: hover)`. States change instantly.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Disclosure | `.disclosure` | The `<details>`. `margin-inline: -8px`; `border-block: 1px solid` the surface's ink (`--disclosure-ink`). |
| Summary | `.disclosure__summary` | The `<summary>`: flex, `justify-content: space-between`, `gap: 12px`, `min-block-size: 44px`, padding 8px. `--type-body` at 600, line-height 1.3; wraps. No marker (`list-style: none`, and `::-webkit-details-marker` hidden). `cursor: default`: the hand is for links only. |
| Glyph | `.disclosure__icon` | An `.ic.ic--down`, 20px, `aria-hidden`, last in the summary. `[open]` sets its `--ic` to `--icon-up`. |
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
| Open | `[open]` | 0 | `ic--up`; the body shows under the summary, inside the rules. |
| Forced colours | `(forced-colors: active)` | | Rules in `CanvasText`; press paints `Highlight`/`HighlightText`, glyph included; the glyph is `CanvasText` (icons.css), so open still reads as up. |

`.is-hover`, `.is-focus` and `.is-active` on the summary force a state for the page and for
tests. They are not API.

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
  `touchstart` listener. Nothing moves until gate 4, which may animate the body's height and
  swap the glyph with a crossfade.
- **Mac:** Return or Space toggles it (Tab reaches it with Keyboard navigation on). In system
  chrome (an inspector, a Settings window) the system's disclosure triangle stays.
- **SwiftUI:** `DisclosureGroup(isExpanded:)` with a custom `DisclosureGroupStyle`: a `Button`
  row (`.frame(minHeight: 44)`, `.contentShape(.rect)`) holding the label, a `Spacer()` and
  `Image` down or up by `configuration.isExpanded`, 1pt rules above and below; the content under
  it when expanded. An exclusive group is one `@State` optional id shared by the group.

## Do and don't

- **Do** write the summary as what you'll see: a question, or "Show the answer's notes".
- **Do** keep what's inside short; a long read deserves its own screen.
- **Don't** hide what everyone needs, an error, or a required field.
- **Don't** put controls in the summary.
- **Don't** turn the glyph with a transform before gate 4.

## Known limits

- `name` (exclusive groups) is newer; older browsers let several open.
- Whether find in page opens a closed `<details>` depends on the browser; not checked here.
- Checked in Chromium only (keyboard, touch, forced colours), not on an iPhone, in Safari or in
  Firefox.
