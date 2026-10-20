# Elements

How an element is built, and the brief for every element still to come. The rules every
element follows are in `../STYLE.md`; `card.md` and `card.html` are the worked example.

## The contract

For whoever builds an element, person or agent.

**You own three files:**

- `css/components/<name>.css`: the element. Its import is already in `css/flashcards.css`.
- `elements/<name>.html`: its page. Start from `_template.html`.
- `elements/<name>.md`: its spec. Start from `_template.md`. The brief below is its first section.

**You don't touch anything else:** the tokens, `base.css`, `icons.css` (unless you are building
Icons), `wire.css`, `sheet.css`, `js/sheet.js`, `flashcards.css`, `STYLE.md`, `README.md`,
`index.html`, `screens.html`, `tools/` and other elements. If you need something in one of
them (a token, a sheet style, a glyph), put the exact lines in your report and the integrator
adds them.

**Rules:**

1. Read `STYLE.md` "Start here", §1, §2 and §4, then `card.md`.
2. Roles and tokens only: no colour literals, no literal border widths, radii only from the
   roles, no gradients, blur, glass or translucency, and no `transition` or `animation` until
   gate 4. `node design/tools/check.mjs` enforces most of this.
3. Class names: `.<name>`, `.<name>__part`, `.<name>--variant`. States come from native
   state and ARIA first (`:checked`, `:disabled`, `[aria-pressed]`, `[aria-invalid]`,
   `[aria-current]`). `.is-*` classes only force a state on the page, as on the card.
4. Pressable things read `--lift` and `--fill`, as the card does. 44px targets. Hover only
   inside `@media (hover: hover)`, a pressed look on `:active`, and the focus ring from
   `STYLE.md` §2.
5. Native HTML first: a `<button>` is a button, an `<input>` is a field, `<dialog>`,
   `popover` and `<details>` before script. ARIA only where HTML has no element. Where an
   element really needs script, it goes in `js/components/<name>.js`: vanilla, no
   dependencies, progressive enhancement, under about 100 lines.
6. Every id on the page carries the element's name (`button-variants`, `h-button-variants`),
   because the bundle joins every page into one, and the page's `<main>` is
   `<main id="el-<name>">`.
7. Only the variants in the brief. Anything you think is missing goes in your report, not into
   the code.
8. Real copy from the product (decks, shapes, cards known, streaks). No lorem ipsum.
9. Every spec ends with the platforms: what changes in an installed PWA, on the Mac, and the
   SwiftUI mapping (the native control, or the custom style).

**Done means:**

- `node design/tools/check.mjs` passes.
- The page opens from disk with a clean console.
- No horizontal scroll at 320, 390 and 1440px, at 100% and 200% text.
- Every control can be reached and used with the keyboard, with a visible ring.
- Forced colours stay legible.
- Touch targets are at least 44px.

**Report** (60 lines at most): the files you made; the variants and states covered; the decisions
you made and why; the exact lines anything shared needs; what you couldn't verify.

## Page and spec layout

The page: hero (the kicker reads "Element NN · Wireframe · Gates 0 to 2 done", the title is
the element's name, the lede is its job), then **01 Variants**, **02 States**, **03 Usage**
(do and don't, platform notes), with **Anatomy** first when the element has more than three
parts. Each variant is an `.sg-entry` whose specimens carry `data-sg-code`, so the page prints
their markup.

The spec: name and status line, Brief, House rules, Anatomy, Variants, States, Accessibility,
Platforms (PWA, Mac, SwiftUI), Do and don't, Known limits.

## Roster

| # | Element | Wave | Status |
| --- | --- | --- | --- |
| 01 | Card | | Gates 0–2 |
| 02 | Button | 1 | Gates 0–2 |
| 03 | Field | 1 | Gates 0–2 |
| 04 | Tag and Badge | 1 | Gates 0–2 |
| 05 | Meter and Spinner | 1 | Gates 0–2 |
| 06 | Icons | 1 | Gates 0–2 |
| 07 | Checkbox | 2 | Gates 0–2 |
| 08 | Radio | 2 | Gates 0–2 |
| 09 | Switch | 2 | Gates 0–2 |
| 10 | Segmented control | 2 | Gates 0–2 |
| 11 | Select | 2 | Gates 0–2 |
| 12 | Stepper | 2 | Gates 0–2 |
| 13 | Form | 2 | Gates 0–2 |
| 14 | Frame | 3 | Brief |
| 15 | Top bar | 3 | Brief |
| 16 | Tab bar | 3 | Brief |
| 17 | Sidebar | 3 | Brief |
| 18 | List | 3 | Brief |
| 19 | Tabs | 3 | Brief |
| 20 | Disclosure | 3 | Brief |
| 21 | Menu | 3 | Brief |
| 22 | Dialog | 4 | Brief |
| 23 | Sheet | 4 | Brief |
| 24 | Toast | 4 | Brief |
| 25 | Banner | 4 | Brief |
| 26 | Empty, loading and error | 4 | Brief |
| 27 | PWA platform | 5 | Brief |

Then three passes over everything: colour and dark mode (wave 6, gate 3), motion (wave 7,
gate 4) and the freeze (wave 8, gate 5).

## Briefs

Gate 0. Each brief gives the job, the parts, the variants (the cap: no others), the states, the
copy and anything specific. Waves 1 and 2 are full; later waves get theirs filled in when the
wave starts.

### Wave 1: actions and status

**02 Button** (`button`). *Starts an action.*

- **Parts:** the label, an optional leading icon.
- **Variants:**
  - *primary*: filled with `--accent` and `--on-accent`. At most one per region.
  - *secondary*: a 2px ink frame on paper.
  - *quiet*: no frame until hover or focus. For bars and card feet.
  - *destructive*: never primary. The words carry it ("Delete deck"), it always confirms or
    offers Undo, and the palette is monochrome, so no red, ever.
  - *icon-only*: a 44px circle with an `aria-label`.
  - *toggle*: `aria-pressed`, for an on/off action such as Shuffle.
  - *block*: full width, for phone forms.
  - *busy*: `aria-busy`, a spinner and the label kept; there is no separate loading text.
  - A row of buttons.
- **States:** the six, through `--lift` and `--fill`.
  - Rest is flat: a shadow means pressable, and a pill already says so. Hover lifts.
  - Press takes the lift away and keeps the fill.
  - Disabled: prefer not disabling. When you must, use `aria-disabled` and say why nearby.
- **Copy:** Start, Turn over, Got it, Not yet, Add a shape, Delete deck, Shuffle.
- **Notes:**
  - One size. The target is always 44px; the label is `--text-sm` or larger.
  - The card's `.card__action` and `.card__ctl` stay the card's for now; the spec says how they
    line up with Button.
  - On the Mac, system chrome keeps system buttons and ours are for content. In SwiftUI, a
    custom `ButtonStyle`.

**03 Field** (`field`). *Lets someone type one value.*

- **Parts:** the label (always visible, above), the input, help text, the error message, an
  optional leading icon, an optional trailing clear button.
- **Variants:**
  - *text*;
  - *search*: `type="search"`, a leading search icon, a clear button;
  - *number*: `inputmode`, no spinner arrows;
  - *multi-line*: `textarea`, resizes vertically only.
- **States:** rest, hover, focus, filled, invalid, disabled, read-only.
  - Invalid: `aria-invalid`, plus a message tied with `aria-describedby` that says how to fix it.
- **Copy:** Deck name, Search decks, Cards per session, Notes. Errors such as "Give the deck a
  name".
- **Notes:**
  - A field holds text, so it is a square 2px frame.
  - Text is 16px or more (iOS zooms otherwise).
  - The label is never the placeholder; placeholders are only examples.
  - The spec lists `autocomplete`, `inputmode` and `enterkeyhint` for each variant.

**04 Tag and Badge** (`tag`). *A status word on a thing; a count on a control.*

- **Tag:** static, never pressable.
  - It doesn't act, so rule 3 makes it square, not a pill. Label type, one to two words.
  - Variants: default, ink (emphasis), tone 1–6.
  - Copy: Known, New, Due, Not yet.
  - It replaces the kit's pill stand-in.
- **Badge:** a count pinned to a control, such as a tab or an icon button.
  - At least 20px, ink fill, tabular figures, capped at "99+".
  - The count lives in the control's accessible name ("Decks, 7 due"); the badge itself is
    `aria-hidden`.
- **Out of scope:** filter chips. Those are toggle buttons or a segmented control.

**05 Meter and Spinner** (`meter`). *How far along; and "working on it" when nobody knows how
long.*

- **Variants:**
  - *meter*: `role="meter"` with `aria-valuetext`, for a value in a range ("5 of 12 known");
  - *progress*: `<progress>`, for a task ("Importing 40 of 120 cards");
  - *segments*: one segment per card, up to 20, for a short deck;
  - *spinner*: always paired with words ("Loading decks…").
- **Notes:**
  - Each has a visible label and value text; the bar never stands alone.
  - The spinner is static until gate 4 gives it motion, so design the still frame to read on
    its own.
  - Meter replaces the kit's meter stand-in.

**06 Icons** (`icons`). *The glyph set.*

- **The set:** grow it from 5 to about 26, each on the 24 grid with a 2px square-cap stroke, as
  masks in `icons.css`:
  - navigation: back, forward, down, up;
  - actions: more, search, edit, delete, share, undo, refresh, shuffle, flip, install, sidebar;
  - status: info, warning, offline;
  - places: settings, today, decks;
  - kept from v0: arrow, plus, minus, close, check.
- **The page:** every glyph with its name, at 20 and 24px, inline with text, inside a button,
  and in forced colours.
- **The spec:** every glyph's SVG path, so native apps can port it.
- **Rules:**
  - No filled glyphs, no duotone, no glyph that needs colour to read.
  - ↗ still means "leaves the app".

### Wave 2: choices and forms

All seven are form controls, so they share a few things:

- **Native first:** a real `<input>`, `<select>` or `<fieldset>`, restyled with
  `appearance: none` where the platform's look fights ours. Never a `div` with a role.
- **A 44px target:**
  - the control is the drawn box, and the `<label>` around it carries the target;
  - clicking the words toggles the control.
- **A label that's always visible.** Help and errors use Field's parts and order (label, help,
  error, then the control), so one form reads the same from top to bottom.
- **States:** rest, hover, focus (ring), checked or on, mixed (where it exists), invalid,
  disabled.
  - Checked or on uses the fill (`--fill`), never colour alone. In forced colours it keeps a
    mark: the check, the dot, or the knob's position.
- **Copy** comes from a deck's settings and the New deck form: Shuffle cards, Show hints, Card
  order, Cards per session, Deck colour (named, not swatches: the palette is monochrome).

**07 Checkbox** (`checkbox`). *Independent on/off choices.*

- **Variants:**
  - single: one checkbox and its label;
  - group: a `fieldset` with a `legend`;
  - mixed: `indeterminate`, for "Select all" over a group;
  - with help text.
- **Look:** a 24px square box inside a 44px target, with a 2px frame. Checked: ink fill and the
  check glyph in paper. Mixed: the minus glyph.
- **Notes:**
  - It stays square, against rule 3, because the platform convention wins. Record that in
    `STYLE.md` §7.
  - Copy: Show hints, Read the answer aloud, and a group headed "Decks to study".

**08 Radio** (`radio`). *One choice from a short list (two to six).*

- **Variants:**
  - a group (always a `fieldset` with a `legend`);
  - a group with help on each option.
- **Look:** a 24px circle, a 2px frame, and a 10px ink dot when chosen.
- **Notes:**
  - The native arrow keys move the choice; a group has one tab stop.
  - Copy: Card order (In order, Shuffled, Hardest first).

**09 Switch** (`switch`). *A setting that takes effect at once.*

- **Markup:** `<input type="checkbox" role="switch">`.
- **Look:** a pill track at least 44 by 24, a circle knob, and On/Off in words beside it, not in
  the track.
- **Variants:** with a label on the leading side and the switch trailing (the settings row);
  with help text.
- **Notes:**
  - Never inside a form with a Save button; a switch that doesn't act at once is a checkbox.
  - Copy: Shuffle cards, Daily reminder.

**10 Segmented control** (`segmented`). *One of two to four views or modes, side by side.*

- **Markup:** a radio group drawn as joined pills, `.sg-seg`'s pattern made real: a `fieldset`,
  a `legend` (which may be visually hidden), and native radios, so arrows work.
- **Variants:** text-only; with icons and text; full width (on a phone).
- **Notes:**
  - It never navigates. Tabs, wave 3, switch sections of a screen; this switches how one thing
    is shown.
  - Copy: Grid / List; Front / Back / Both.

**11 Select** (`select`). *One choice from a long list.*

- **Markup:** native `<select>`, in Field's frame with the `down` glyph. The phone shows its own
  picker and the Mac its own menu, so we style only the closed control.
- **Variants:** default; with help; invalid.
- **Notes:**
  - Single choice only.
  - `appearance: base-select` is newer and only progressive: allowed if it degrades to the
    plain styled select.
  - Copy: Language (English, Français, Español…), Deck colour.

**12 Stepper** (`stepper`). *A small whole number, one step at a time.*

- **Markup:** − and + icon-only buttons (Button's 44px circles) around a value that is an
  `<input inputmode="numeric">`, so it can also be typed.
- **Notes:**
  - It has a minimum and a maximum. At a limit, that button is `aria-disabled`, says why, and
    stays focusable.
  - Changes are announced through the input's value; the buttons say what they do ("Fewer
    cards", "More cards").
  - Copy: Cards per session (5–50, step 5).

**13 Form** (`form`). *Fields together, and what happens when they're wrong.*

- **Layout:** labels above controls, 24px between fields, groups in `fieldset`s, one column on a
  phone, two only where fields are short and related.
- **Required and optional:**
  - mark the optional fields "(optional)";
  - required fields carry no asterisk and use `required` without `aria-required` duplication.
- **Validation:**
  - only on submit or blur, never while typing;
  - each wrong field gets Field's error;
  - on submit, an error summary at the top (a card titled "Fix 2 things", with links to each
    field) takes focus.
- **The submit row:** the primary button last (right) on wide screens, full width first on a
  phone, with Cancel as a quiet button.
- **Variants:** the New deck form (name, description, card order, shuffle, cards per session,
  language), the same form with errors, and a one-field inline form (Rename deck).
- **Notes:** `autocomplete`, `inputmode` and `enterkeyhint` follow Field's spec; the on-screen
  keyboard must not cover the focused field (the scroll-padding finding).

### Wave 3: shell and navigation

**14 Frame:**
- The app shell that replaces `screens.css`'s `.app`:
  - rows for the top bar, the scroll region and the bottom bar;
  - safe areas, `dvh`, `overscroll-behavior` and scroll padding;
  - a root screen that keeps clear of the status bar.
- It publishes `--chrome`, so the study card stops guessing.
- Wide screens get a centred column or the sidebar layout.

**15 Top bar:**
- A back control (the previous screen's name, or "Back"), the title, up to two actions.
- Edge to edge, owning the top safe area.

**16 Tab bar:**
- Three to five places. Icon and label always.
- `aria-current="page"`, room for a badge, owns the bottom safe area.
- The spec decides what happens at 200% text (screens found that it wraps).

**17 Sidebar:**
- Places on wide screens, with the current one marked. It folds away when narrow.
- The two-pane split view.

**18 List:**
- Rows: a title, meta, and a trailing value, chevron or switch.
- Section headers. A row as a link.
- Any swipe action also has a visible "More" button.

**19 Tabs:**
- Sections of one screen, using ARIA tabs.
- Needs `js/components/tabs.js` for arrow keys with a roving tab stop.

**20 Disclosure:**
- `<details>` and `<summary>`: show more, in place.

**21 Menu:**
- A short list of actions behind a button, using the native `popover` and `popovertarget`.
- Buttons inside, no ARIA menu pattern unless a real need appears.

### Wave 4: feedback and overlays

**22 Dialog:**
- Native `<dialog>` with `showModal()`: stop and decide.
- Backdrop, decided by the owner: a flat ink layer at a fixed 60% opacity, through a new
  `--scrim` role. It is the one translucency the system allows, and rule 2 gains that
  exception in this wave. The page reads as "still there, but not now".

**23 Sheet:**
- A task on top of a screen: from the bottom on a phone, from the side on wide screens.
- Drag and detents wait for gate 4.

**24 Toast:**
- "It's done", with Undo. `role="status"`, one at a time, above the tab bar.
- Pauses on hover and focus, and stays long enough to reach Undo (WCAG 2.2.1).
- Uses `js/components/toast.js`.

**25 Banner:**
- News about the whole screen:
  - offline ("You're offline. Changes are saved on this device.");
  - update ready ("A new version is ready. Reload");
  - a failure, with "Try again".

**26 Empty, loading and error:**
- The patterns for a screen with nothing yet (a ghost card offering the first step), loading
  (spinner and words, no shimmer), failed (a plain card and "Try again") and offline.

### Wave 5: the platform

**27 PWA platform:**
- **Rules in `STYLE.md` §4, and a working starter in `design/pwa/`:**
  - the manifest, with maskable icons, and `theme_color` and `background_color` set to
    `--canvas`;
  - a service worker: an offline app shell, runtime caching, an update flow ("A new version is
    ready");
  - the install route: Chromium's prompt, and instructions for iOS's Add to Home Screen;
  - a pre-prompt before any permission;
  - notifications and badging;
  - the Web Share API;
  - the on-screen keyboard (`interactive-widget`, `visualViewport`);
  - storage persistence and export;
  - standalone back behaviour, deep links, orientation and tablets;
  - a performance budget.
- `screens.html` becomes installable and works offline, tested over localhost.
