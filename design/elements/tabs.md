# Tabs

Element 19 · gates 0–2 done (wireframe, states) · page: `elements/tabs.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Tabs' own spec.

## Brief

*Sections of one screen.*

- **Markup:** ARIA tabs (`tablist`, `tab`, `tabpanel`), with `js/components/tabs.js` for arrow
  keys and Home/End, a roving tab stop and automatic activation.
- **Without script,** the panels are just stacked sections with headings, and the tab list is
  links to them.
- **Variants:** two to five tabs; full width on a phone; with a count Badge.
- **Not the segmented control:** that switches how one thing is shown, tabs switch which section
  is shown.
- **Copy:** Cards · Stats · Settings, inside a deck.

## House rules

- **The markup is the no-script version.** A `<nav>` of in-page links over `<section>`s, each
  with its own heading. The script adds the roles and hides all but one panel. Nothing in the
  printed markup is ARIA tabs; that's what the script makes of it.
- **A tab acts, so its target is a pill** (rule 3): quiet at rest, framed on hover, filled while
  pressed, as a quiet button.
- **Which section is shown is structure, so it's a bar,** 2px, on the list's 1px rule under the
  tab. Never a fill: a fill is a press, and a fill on the chosen one is the segmented control's
  look. Focus is a round ring, selection a flat bar: they never look alike.
- **It wraps, it never scrolls sideways.** A hidden scrollbar hides tabs; a second row of tabs is
  ugly but honest, and only happens at very large text sizes.
- Reads roles only. `:hover` only inside `@media (hover: hover)`. States change instantly.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Tabs | `.tabs` | The block: a flex column. What the script looks for. |
| List | `.tabs__list` | A `<nav aria-label="…">` named for the screen ("Shapes"); the script sets `role="tablist"`. Flex, wraps, `gap: 5px 4px`, 4px padding under the pills, then a 1px `--line` rule. |
| Tab | `.tabs__tab` | An `<a href="#panel-id">`; the script sets `role="tab"`, `aria-selected`, `aria-controls`, a roving `tabindex`. Inline-flex, `min-block-size: 44px`, padding 8px 16px, `--type-body` at 600, line-height 1.3, `--ink-soft`. A 2px transparent frame, `--radius-pill`. `position: relative`. |
| Bar | `.tabs__tab::after` | 2px, the tab's whole width, placed on the list's rule (7px under the pill's padding box). Transparent until selected, then ink (`--tabs-bar`). |
| Count | `.badge` | Tag and Badge's badge, after the label (`position: static`, no cut). `aria-hidden`; the tab's `aria-label` carries the count ("Cards, 7 due"). |
| Panel | `.tabs__panel` | A `<section id>`; the script sets `role="tabpanel"`, `aria-labelledby` (its tab) and `tabindex="0"`, and `hidden` on all but one. 16px above its content. |
| Heading | `.tabs__heading` | The section's heading, `--type-title`, 12px under. With the script it stays for headings navigation but is visually hidden (`[role="tabpanel"] > .tabs__heading`). |

```html
<div class="tabs">
  <nav class="tabs__list" aria-label="Shapes">
    <a class="tabs__tab" href="#shapes-cards">Cards</a>
    <a class="tabs__tab" href="#shapes-stats">Stats</a>
    <a class="tabs__tab" href="#shapes-settings">Settings</a>
  </nav>
  <section class="tabs__panel" id="shapes-cards">
    <h2 class="tabs__heading">Cards</h2> …
  </section>
  <section class="tabs__panel" id="shapes-stats">
    <h2 class="tabs__heading">Stats</h2> …
  </section>
  <section class="tabs__panel" id="shapes-settings">
    <h2 class="tabs__heading">Settings</h2> …
  </section>
</div>
<script src="flashcards.js"></script> <!-- or js/components/tabs.js, after the markup -->
```

## Script: `js/components/tabs.js`

Vanilla, no dependencies, about 85 lines. For each `.tabs` whose links all point at a panel on
the page:

- sets `role="tablist"` on the list, `role="tab"` and `aria-controls` on each link (giving it an
  id, `<panel id>-tab`, if it has none), `role="tabpanel"`, `aria-labelledby` and `tabindex="0"`
  on each panel;
- selects the tab whose panel is in the address (`#shapes-stats`), or the first: that tab gets
  `aria-selected="true"` and `tabindex="0"`, the others `aria-selected="false"` and
  `tabindex="-1"`, and every other panel `hidden`;
- **keys** on a tab: Left and Right move to the previous and next tab and select it (automatic
  activation), wrapping at the ends and reversed in a right-to-left list; Home and End go to the
  first and last; Space selects (a link ignores it);
- **click or tap** selects without following the link, so the page doesn't jump and the address
  doesn't change;
- **hashchange** to a panel's id selects that panel, so a deep link or Back lands on it.

Without the script nothing is hidden: links, then sections, then headings. A `.tabs` carrying
`data-sg-static` is left alone; the style sheet uses it to show the no-script form.

## Variants

Shown live, with markup, in `elements/tabs.html` (2.1–2.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Two to five tabs | `.tabs` | Sections of one screen that aren't needed at once: a deck's Cards, Stats, Settings. | One tab is no tabs; six or more want their own screens. One word a label. |
| Full width | `.tabs--full` | On a phone: the tabs share the row. | Each tab `flex: 1 1 0%` with `min-inline-size: max-content`: equal shares while the labels fit, and a label never gives up its own width, so the row wraps before a word is squeezed. |
| With a count | `.badge` | A section with something waiting: the cards due today. | `aria-label` on the tab, starting with the visible label ("Cards, 7 due"), so voice control still finds it. "99+" past 99. |

## States

| State | Trigger | `--fill` | Also |
| --- | --- | --- | --- |
| Rest | none | 0 | `--ink-soft` words, no frame, no bar. Without script every tab is at rest. |
| Selected | `[aria-selected="true"]` | 0 | Ink words and the 2px ink bar. |
| Hover | `:hover`, only inside `@media (hover: hover)` | 0 | Ink words and the pill's 2px `--line` frame, as a quiet button. No lift: tabs sit in a row. |
| Focus | `:focus-visible` | 0 | The hover look and the 3px ring, 2px out (`--ring-offset-in`), round like the pill. With automatic activation the focused tab is the selected one. |
| Pressed | `:active` | 1 | Ink pill, paper words. Sets `--card-ink` and `--card-bg`, so a badge inverts with it. |
| Forced colours | `(forced-colors: active)` | | No frame at rest (`Canvas`); hover and focus frame in `Highlight`; press paints `Highlight`/`HighlightText`; the bar opts out and is 4px (`--bw-heavy`) of `CanvasText`, so the current tab stays plain on any theme. |

`.is-hover`, `.is-focus`, `.is-active` and `.is-selected` force a state for the page and for
tests. They are not API.

## Accessibility

- The APG tabs pattern with automatic activation: one tab stop for the list, arrows inside it,
  the selected panel next in the tab order (`tabindex="0"`, since a panel may hold no control).
- The tablist is named for the screen ("Shapes"); each panel is named by its tab.
- Without script it is a named navigation of in-page links, and every section has a visible
  heading: nothing is hidden and nothing is dead.
- The heading stays in each panel with script, out of sight, so headings navigation still works.
- The count is in the name ("Cards, 7 due"); the badge is `aria-hidden`.
- Targets are at least 44px tall; measured at 100% and 200% text.

## Platforms

- **Installed PWA:** full width on a phone. The selected section can live in the address, so a
  deep link, a shared link or Back opens the right one. Tabs never scroll sideways.
- **Mac:** Tab reaches the row once and the arrows move along it, as in a native tab view; in a
  WebKit shell turn on `tabFocusesLinks`. Each section is worth a menu bar command (View ›
  Cards ⌘1, Stats ⌘2…).
- **SwiftUI:** a custom strip: an `HStack` of `Button`s, each with `.accessibilityAddTraits(.isSelected)`
  when current and a 2pt `Rectangle()` under it, inside `.accessibilityElement(children: .contain)`,
  over a `switch` on a `@State` section enum. On the Mac a `TabView` in a window draws the
  system's own tabs: that's system chrome, and fine there.

## Do and don't

- **Do** give every section a heading, so the page reads without script.
- **Do** keep labels to one word, and two to five tabs.
- **Don't** use tabs to filter or re-show one thing (Grid or List, Front or Back): that's the
  segmented control.
- **Don't** use tabs to go to another screen: that's the tab bar or a link.
- **Don't** make the list scroll sideways.

## Known limits

- With script, the panels' headings are hidden visually; a section that needs a visible heading
  under the tabs needs a second one.
- Vertical tabs (Up and Down) are not built.
- Checked in Chromium only (keyboard, touch, forced colours, script off), not on an iPhone, in
  Safari or in Firefox.
