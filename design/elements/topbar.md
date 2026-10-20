# Top bar

Element 15 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/topbar.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Top bar's own spec.

## Brief

*A screen's title, its way back, and one or two actions.*

- **Parts:** the back link (`ic--back` + the previous screen's name, falling back to "Back"; a
  link, since it goes somewhere); the title (an `h1` at `--type-title`, one line, truncating
  only with the full title available); up to two trailing actions (Button, quiet or icon-only).
- **Variants:** standard; root (no back, title leading); with a large heading below it in the
  content (`.t-heading`), not a collapsing large title (that's motion).
- **Notes:** 44px targets, edge to edge, owns the top safe area. Copy: ‹ Decks · Shapes · Edit.

## House rules

- **Edge to edge, and it owns the top safe area.** Its block padding starts at `--safe-top`, so
  its paper runs up behind the status bar and its controls sit under it. Inline padding is
  `max(8px, var(--safe-left))` and its mirror. A 2px rule (`--bw`, `--line`) closes it off from
  the content.
- **Its controls are Buttons.** The back link is `<a class="btn btn--quiet topbar__back">`, the
  actions are `.btn--quiet` or `.btn--icon btn--quiet`. Their states, rings and forced colours
  are Button's; this file places them. In a bar a text Button is padded 12px a side instead of
  24: a bar is short of room, and a quiet button has no frame at rest to need the air. Targets
  stay 44px.
- **The title is centred and comes first.** When room runs short, the back link's label goes,
  whole, before the title truncates. A label never shows as "D…".
- **It grows down, never sideways.** Under 16em of bar (a phone at about 150% text and up) the
  title takes its own row and wraps.
- One line, sentence case, the screen's `h1`. Bar text isn't uppercase: the title is read, not
  structure (rule 4).
- **Its one motion is the large heading's.** Where scroll-driven animations exist, the bar's copy
  of the title fades in as the large heading scrolls under the bar, and out as it comes back.
  Only opacity, moved by the scroll itself; nothing about the bar's size or place changes.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Bar | `.topbar` | Grid, four tracks: `minmax(44px, 1fr)` (back), `minmax(0, max-content)` (title), `minmax(max-content, 1fr)` (actions), `minmax(0, max-content)` (empty until narrow). The title's track takes its full width first; the two `1fr` sides then share what's left, so the title is centred until one side needs more. Padding `calc(var(--safe-top) + 8px) 8px 8px`. Paper; `border-block-end: 2px` in `--line`. A container (`topbar`), for its large-text layout. In a frame it also wears `.frame__top`. |
| Back link | `.topbar__back` | `.btn .btn--quiet`, `href` to the previous screen. `ic--back`, then the label: the previous screen's name ("Decks"), or "Back" when there's none (a screen opened from a link). Padding 12px / 8px, 4px between chevron and label. Whole or not at all (below). |
| Title | `.topbar__title` | The screen's `h1`. `--type-title` (24px, 500), `text-align: center`, one line, `text-overflow: ellipsis`. Padding 4px 8px: room for descenders inside the clip, and air between it and the sides. |
| Title copy | `.topbar__title` with `aria-hidden="true"`, in `.topbar--large` | The large-heading variant's copy of the screen's name, a `<p>`: hidden from screen readers (the heading in the content is the `h1`, said once). Drawn only where it can fade (below); otherwise `display: none`. |
| Actions | `.topbar__actions` | Flex, wrapping, 8px apart, `margin-inline-start: 8px`, at the trailing end. At most two Buttons: quiet text (`.btn--quiet`, padded 12px a side), text with a leading icon, or icon-only (`.btn--icon .btn--quiet`, with an `aria-label`). |

**Whole or not at all.** A label beside an icon (the back link's, or an action's like Undo) never
truncates. The Button is one 44px line that wraps, with `overflow: clip`: when its track is too
narrow for icon and label, the label moves to the hidden second line and the icon stays, still
named by the label. The icon's box is the line's full height (`calc(var(--hit) - 4px)`; the mask
keeps the glyph 20px and centred), so the first line looks the same either way. The back link's
track gives way first; an action's only when even the chevron alone leaves too little.

## Variants

Each is shown live, with its markup, in `elements/topbar.html` under Variants (1.1–1.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Standard | `.topbar` | Any screen past the root. | Back link, centred title, up to two actions. ‹ Decks · Shapes · Edit; or two icon-only actions, Search cards and Add a shape. |
| Root | `.topbar--root` | A place at the root with actions for the bar. | No back link. Two tracks: `minmax(0, 1fr) max-content`. The title leads, its start padding `var(--gutter) - 8px` so it lines up with the content. A root screen with nothing for a bar has no bar (Frame's root screen). |
| With a large heading | `.topbar--large` with a title copy (`aria-hidden`); the heading in the content is `.t-heading.topbar__heading` | A long title, or a screen that opens on its name. | The bar keeps the back link and actions; the screen's `h1` is the first thing in the content at `--type-heading`, where it wraps. As it scrolls under the bar the bar's copy fades in (below). It never shrinks into the bar. |

## States

The bar doesn't press. Its Buttons do, through `--lift` and `--fill`, exactly as in
`button.md`.

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | Quiet: no frame, no fill. |
| Hover | `:hover`, inside `@media (hover: hover)` | 1 | 1 | Filled ink pill, paper label, 4px hard shadow. |
| Focus | `:focus-visible` | 1 | 1 | The hover look and the ring, 3px out. The bar's 8px padding leaves the ring room inside the bar. |
| Pressed | `:active` | 0 | 1 | Down, filled, a 2px paper ring inside. |
| Long title | the title wider than its room | | | The back label wraps away first (chevron only), then the title truncates with an ellipsis. The `h1` holds the whole title. |
| Large text | the bar under 16em | | | Back link and actions on the first row (the back link takes every track but the actions', which can shrink: an action's label goes, then a second action wraps under the first), the title on its own row, start-aligned, wrapping (`text-wrap: balance`), `contain: inline-size` so its width doesn't move the tracks above it. |
| Forced colours | `(forced-colors: active)` | | | The rule is `CanvasText`; Buttons follow `button.md` (frames in `ButtonText`, `Highlight` for hover, focus and press). |

`.is-hover`, `.is-focus` and `.is-active` on the Buttons force a state for the page and for
tests. They are not API.

**The large heading's title, scrolled.** Where `animation-timeline: view()` and `timeline-scope`
both exist (`@supports`), and not under reduced motion:

- The heading (`.topbar__heading`) declares a view timeline on the block axis
  (`view-timeline-name: --topbar-heading`).
  Its scroller is the frame's scroll region (`.frame__scroll`), whose top edge is the bar's rule;
  `view-timeline-inset: 0`, so it's measured from that edge, not from the region's scroll padding.
  The frame (`.frame:has(> .topbar--large)`) declares `timeline-scope: --topbar-heading`, so the
  bar, a sibling of the region, can read it.
- The copy runs `topbar-title-in` (opacity 0 to 1, `--ease-out`) on that timeline over the
  heading's `exit` range: from its top edge reaching the bar's rule to its foot passing it. So it
  is hidden while the heading shows, in once the heading is under the bar, and goes back the same
  way. It moves exactly as far as the scroll does, never on its own, and nothing on load.
- In this variant the back link keeps its label and the actions theirs, and the copy takes the
  room between them, truncating (the heading has the whole title): the grid is
  `minmax(var(--hit), max-content) minmax(0, 1fr) max-content minmax(0, max-content)`, so the copy
  is centred in that room, not on the bar.
- Under 16em of bar (large text) the copy isn't drawn: it would need a row of its own.
- **Elsewhere** (no scroll-driven animations, no `timeline-scope`, reduced motion) the copy is
  `display: none`, and the bar is what it was before gate 4: the back link and the actions.
- Checked in Chromium 141 on the page's specimen: the copy at opacity 0 until the heading's top
  reached the rule, 0.33 three pixels later, 1 once its foot passed; under reduced motion not
  drawn; the bar never wider than itself at 320, 390 or 1440px and 100, 150 or 200% text.

**Why the title may truncate, and when it may not.** The brief says one line, truncating only
with the full title available. The `h1` always holds the whole title, so a screen reader hears
it all; on screen, a title that truncates on a 320-point phone at 100% text is too long for a
bar, and that screen uses the large heading, where the full title is in the content. At large
text, where nearly any title would truncate, the bar gives the title its own row instead.

## Accessibility

- The back link is an `<a href>`, not a button that calls `history.back()`: it goes to a place,
  so it can be opened, copied, and read as a link. Its name is the label ("Decks"); when the
  label is clipped away the name doesn't change.
- The title is the screen's only `h1`. On the sheet's pages it's an `h4`, because the page has
  its own headings.
- Icon-only actions have an `aria-label` naming the action ("Add a shape"); the icon is
  `aria-hidden`. A badge on an action puts its count in that name.
- Tab order: back, actions, then the content. Every control is at least 44 × 44px, at 100% and
  200% text.
- The bar is a `<header>`. Inside the frame's `<body>` it's the banner landmark; don't add a
  role.

**Right to left.** Back leads from the right and its chevron mirrors to point right (`.ic--back`);
the actions trail on the left, and the title stays centred. The bar pads `--safe-left` and
`--safe-right` physically, as edges of the screen. On the page: 1.4.

## Platforms

- **Installed PWA:** standalone has no browser back, so every screen past the root shows this bar
  with a back link (§4). It owns `--safe-top`. Its paper is the colour behind the status bar
  (the two `theme-color` metas, light and dark, stay `--canvas`; `tools/bundle.mjs` writes both,
  `elements/pwa.md`).
- **Mac:** not used. The window's toolbar is system chrome, with a system back button and the
  title in SF (§4).
- **SwiftUI:** `.navigationTitle("Shapes")` with `.navigationBarTitleDisplayMode(.inline)`, actions
  in `.toolbar { ToolbarItem(placement: .topBarTrailing) { … } }`. The back button is the
  system's and takes the previous screen's title. The large-heading recipe is
  `.navigationBarTitleDisplayMode(.large)`, which does collapse on scroll there: the system's
  motion, not ours, and the system's inline title is the counterpart of our fading copy.

## Do and don't

- **Do** name the place the back link goes to, in the words that place uses for itself.
- **Do** keep titles short enough for one line on a 320-point phone; use the large heading when
  they aren't.
- **Do** put the action people come back for in the bar, and the rest in a menu.
- **Don't** add a third action, a primary button, a search field or a segmented control to the
  bar.
- **Don't** make the bar translucent or float it over content.
- **Don't** shrink the bar, or slide or scale the title on scroll: the copy only fades, and only
  with a large heading.
- **Don't** give the copy a role or leave out `aria-hidden`: the screen's name is said once, by
  its `h1`.

## Known limits

- In Frame's wide variant a root bar's title can sit a few pixels off the content's edge: the bar
  is its own container, so its `--gutter` follows the bar's width, not the content column's.

- A Button whose label has gone is as wide as its track, not a 44px circle, so its hover pill is
  wider than its icon.
- A text-only action (Edit) can't drop its label. On a 320-point phone at 200% text, Edit and the
  chevron still fit; two text-only actions might not, so a bar with two actions gives them icons.
- A real title that truncates at 100% text has to be caught in design review; CSS can't switch a
  screen to the large heading by itself.
- The large heading's copy needs scroll-driven animations and `timeline-scope` (Chromium 116 and
  later; other engines as they ship both); elsewhere the bar has no title, as before. It works
  only in a frame, whose scroll region is the heading's scroller.
- The 16em switch is a guess at where three parts stop fitting with real copy. A bar with two
  text actions and a long back label could truncate a little before it.
