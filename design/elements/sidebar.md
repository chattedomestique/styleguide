# Sidebar

Element 17 · gates 0–2 done (wireframe, states) · page: `elements/sidebar.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Sidebar's own spec.

## Brief

*The places, on a wide screen.*

- **Parts:** a list of links with icons, the current one marked (the card's selected ring
  language, not a fill alone), optional section headings, and a footer slot.
- **Variants:** standard; with sections; the two-pane split (sidebar + content) inside Frame's
  wide variant.
- **Behaviour:** below a width it folds away and the phone layout's Tab bar takes over (CSS
  only, same links). The toggle uses `ic--sidebar` (Button, icon-only, `aria-expanded`).
- **Mac:** system chrome natively; this is the web shell's version, drawn plainly so it doesn't
  pretend to be AppKit.

## House rules

- **A link is a quiet Button that goes somewhere:** `<a class="btn btn--quiet sidebar__link">`.
  Hover, press, focus and forced colours are Button's; this file lines it up (full width, from
  the start, regular weight).
- **Here is a doubled frame,** as on a selected card: the frame shows (2px) and a 2px ring
  doubles it, and the label goes bold. Never a fill alone, which reads as pressed. In forced
  colours, a 4px frame.
- **The same places as the Tab bar,** in the same order. Below 45rem of frame it folds away and
  the Tab bar shows them (Frame's wide variant does the folding, in CSS).
- **The toggle's `aria-expanded` drives the CSS.** The app flips it (one line, as Button's
  toggle leaves `aria-pressed` to the app); folded, the sidebar is a rail with only the toggle,
  so it can always come back.
- **Plain.** Paper, a 2px rule on its inner edge, Archivo and our roles. On a Mac the system
  draws the sidebar; this one doesn't imitate it.
- It owns the safe areas it touches: top, bottom, and the start edge.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Sidebar | `.sidebar` | A `<nav aria-label="Places">`. Flex column, 12px between parts, `inline-size: 15rem`. Padding `calc(var(--safe-top) + 8px)` top, `max(12px, var(--safe-bottom))` bottom, `max(12px, var(--safe-left))` and its mirror inline. Paper; `border-inline-end: 2px` in `--line`. Scrolls on its own (`overflow-y: auto; overscroll-behavior: contain`). In a frame it wears `.frame__side`. |
| Head | `.sidebar__head` | 44px tall, so the toggle lines up with the top bar's buttons beside it. |
| Toggle | `.sidebar__toggle` | `.btn .btn--icon .btn--quiet`, `ic--sidebar`, `aria-label="Sidebar"`, `aria-expanded`, `aria-controls` naming the body. |
| Body | `.sidebar__body` | Flex column, 4px apart. Holds lists and headings. |
| List | `.sidebar__list` | `<ul role="list">`, grid, 4px between links. |
| Link | `.sidebar__link` | `.btn .btn--quiet`, full width, `justify-content: flex-start`, padding 16px inline, `--type-body` at 400. A leading icon (a place) is pulled 8px towards the curve, as in any Button. With no icon (a deck), the start padding adds the icon's width, so every label lines up. |
| Section heading | `.sidebar__heading` | `--type-label`, uppercase, `--ink-soft`, 16px above, padded to line up with the labels. It names its list (`aria-labelledby`). A heading element at the app's level below the screen's `h1`. |
| Foot | `.sidebar__foot` | Pushed to the bottom (`margin-block-start: auto`) after a 1px rule (it divides). What the app puts there: a Button ("Make a deck"), a line of `.t-meta`. |

## Variants

Each is shown live, with its markup, in `elements/sidebar.html` under Variants (1.1–1.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Standard | `.sidebar` | The app's places. | Head and toggle, then Today, Decks, Settings. |
| With sections | `.sidebar__heading`, `.sidebar__foot` | Places, then the things in them. | "Your decks", with each deck as a link and no icon (the same glyph on every row would be decoration, rule 7). The foot holds Make a deck and "55 cards, saved on this device". |
| Two-pane split | `.frame--wide` with `.frame__side` | A tablet or desktop browser. | Sidebar in Frame's first column, top bar and content in the second, a Tab bar with the same links in the bottom slot. Under 45rem of frame the sidebar is `display: none` and the tab bar shows. |

## States

A link's states are a quiet Button's (`button.md`).

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Rest | none | 0 | 0 | No frame. |
| Hover | `:hover`, inside `@media (hover: hover)` | 1 | 1 | Ink pill, paper label, 4px hard shadow. |
| Focus | `:focus-visible` | 1 | 1 | The hover look and the ring, 3px out. The sidebar's 12px padding keeps it inside. |
| Pressed | `:active` | 0 | 1 | Down, filled, the inner ring. |
| Here | `aria-current="page"` | | | `--btn-rest-line` becomes the line, so the 2px frame shows at rest, and `--shadow-select: 0 0 0 2px` doubles it. Weight 700. |
| Here, hovered | both | 1 | 1 | Filled and lifted inside the doubled frame. |
| Folded | the toggle's `aria-expanded="false"` | | | `inline-size: fit-content`, body and foot `display: none`: a rail 70px wide with the toggle alone. |
| Folded away | Frame wide, under 45rem | | | `display: none`; the Tab bar has the places. |
| Forced colours | `(forced-colors: active)` | | | Every link is framed in `ButtonText` (Button's rule); here is a 4px frame, its padding 2px less so nothing moves, and bold. The inner rule is `CanvasText`. |

`.is-hover`, `.is-focus` and `.is-active` force a state for the page and for tests. They are not
API.

## Accessibility

- A `<nav aria-label="Places">`. When the wide frame also holds a Tab bar with the same label,
  only one is ever displayed, so only one is in the accessibility tree.
- Links are links: `aria-current="page"` on the one for this screen, announced as "current page".
- The toggle is a real `<button>` with `aria-expanded` and `aria-controls`. Its name, "Sidebar",
  doesn't change; the state does. Folded, the body is `display: none`, so its links leave the
  tab order.
- Section headings name their lists (`aria-labelledby`), so a screen reader hears "Your decks,
  list, 4 items".
- Tab order: toggle, links top to bottom, foot, then the top bar and content.
- Every link and the toggle are at least 44px tall; links are the sidebar's full width.

## Platforms

- **Installed PWA:** on a tablet in landscape it owns `--safe-top`, `--safe-bottom` and
  `--safe-left`, and the content beside it doesn't pad that edge again. On a phone the frame is
  under 45rem, so it never shows. The folded state is the app's to keep between visits.
- **Mac:** system chrome. A web shell on a Mac uses the native sidebar
  (`NSSplitViewController` with a source list), and View › Hide Sidebar (⌃⌘S) does what the toggle
  does. `screens.html` draws it in system type and colours to show it isn't ours.
- **SwiftUI:** `NavigationSplitView { List(selection: $place) { Section("Your decks") { … } } }
  detail: { … }`. The selection is the system's highlight; `columnVisibility` is the toggle. The
  system draws it and folds it into a stack in compact width, as this one folds into a Tab bar.

## Do and don't

- **Do** give it the same places as the Tab bar, in the same order.
- **Do** mark here on the deepest link that matches the screen: Shapes, not Decks, on a deck.
- **Don't** mark here with a fill alone, a colour, or bold alone.
- **Don't** put actions in the list; one Button can go in the foot.
- **Don't** slide it in or out, or overlay it on the content: it appears in place until gate 4.

## Known limits

- The toggle needs the app to flip `aria-expanded` (one line). Without script it stays open.
- It doesn't remember being folded; the app stores that.
- Only one level of sections; nested groups would be a Disclosure inside the body, untested.
- In a right-to-left frame the sidebar moves to the right, but the safe-area tokens it reads are
  physical (`frame.md`, Known limits).
