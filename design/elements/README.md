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
   dependencies, progressive enhancement, under about 100 lines. The page loads it after
   `../js/sheet.js`, so the printed markup is the source, not what the script changed.
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
| 14 | Frame | 3 | Gates 0–2 |
| 15 | Top bar | 3 | Gates 0–2 |
| 16 | Tab bar | 3 | Gates 0–2 |
| 17 | Sidebar | 3 | Gates 0–2 |
| 18 | List | 3 | Gates 0–2 |
| 19 | Tabs | 3 | Gates 0–2 |
| 20 | Disclosure | 3 | Gates 0–2 |
| 21 | Menu | 3 | Gates 0–2 |
| 22 | Dialog | 4 | Gates 0–2 |
| 23 | Sheet | 4 | Gates 0–2 |
| 24 | Toast | 4 | Gates 0–2 |
| 25 | Banner | 4 | Gates 0–2 |
| 26 | Empty, loading and error | 4 | Gates 0–2 |
| 27 | PWA platform | 5 | Gates 0–2 |

Then three passes over everything: colour and dark mode (wave 6, gate 3), motion (wave 7,
gate 4) and the freeze (wave 8, gate 5).

## Briefs

Gate 0. Each brief gives the job, the parts, the variants (the cap: no others), the states, the
copy and anything specific. Waves 1 to 4 are full; wave 5 gets its own when it starts.

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

These eight make a screen out of elements. `screens.html` is rebuilt on them at the end of the
wave: Frame replaces `screens.css`'s `.app`, and Top bar and Tab bar replace the two Nav bar
slots. Shared notes:

- **Bars run edge to edge and own their safe-area inset.** Content never reads the safe-area
  tokens.
- **Navigation is links:**
  - a place you go is an `<a>` with `aria-current="page"` when it's here;
  - a control that changes something is a `<button>`.
- **Mac:** the toolbar, sidebar and menus are system chrome (`STYLE.md` §4), so Top bar, Tab bar
  and Menu are phone and web elements. Sidebar is ours on the web and `NavigationSplitView` in
  SwiftUI.
- **No motion:** a drawer, sheet or menu appears in place until gate 4.

**14 Frame** (`frame`). *The app shell: bars, the scroll region, safe areas.*

- **Parts:** `.frame`, `.frame__top`, `.frame__scroll`, `.frame__bottom`, from what
  `screens.css`'s `.app` learned:
  - grid rows;
  - `block-size: 100dvh`;
  - with no top bar the frame still keeps clear of the status bar;
  - `overscroll-behavior: contain`;
  - scroll padding for focus rings and the on-screen keyboard;
  - `safe center` for a centred stage.
- **Publishes `--chrome`,** the bars' real height, so the study card stops guessing:
  - measured, not estimated;
  - CSS-only if possible, a tiny `frame.js` with a `ResizeObserver` if not.
- **Variants:** phone (top bar + scroll + tab bar), root screen (scroll + tab bar), focused task
  (top bar + scroll + action row), wide (sidebar + content column, at most `--measure`-ish wide
  for reading screens).
- **Also:** re-points `--gutter` to the frame's own width, so a pane gets the right gutter.

**15 Top bar** (`topbar`). *A screen's title, its way back, and one or two actions.*

- **Parts:**
  - the back link (`ic--back` + the previous screen's name, falling back to "Back"; a link,
    since it goes somewhere);
  - the title (an `h1` at `--type-title`, one line, truncating only with the full title
    available);
  - up to two trailing actions (Button, quiet or icon-only).
- **Variants:** standard; root (no back, title leading); with a large heading below it in the
  content (`.t-heading`), not a collapsing large title (that's motion).
- **Notes:** 44px targets, edge to edge, owns the top safe area. Copy: ‹ Decks · Shapes · Edit.

**16 Tab bar** (`tabbar`). *The three to five places at the root of a phone app.*

- **Parts:** items with an icon and a label always, never icon-only; `aria-current="page"` on
  the current one; room for a Badge.
- **At 200% text,** which screens found wraps, the labels may go to two lines but the bar grows
  in height, never sideways. Write down why we don't copy iOS's fixed bar with a long-press
  preview: the web has no large-content viewer.
- **Notes:**
  - owns the bottom safe area;
  - hidden when the on-screen keyboard is up, if that can be done without script, otherwise
    noted for wave 5;
  - copy: Today, Decks, Settings (`ic--today`, `ic--decks`, `ic--settings`).

**17 Sidebar** (`sidebar`). *The places, on a wide screen.*

- **Parts:** a list of links with icons, the current one marked (the card's selected ring
  language, not a fill alone), optional section headings, and a footer slot.
- **Variants:** standard; with sections; the two-pane split (sidebar + content) inside Frame's
  wide variant.
- **Behaviour:** below a width it folds away and the phone layout's Tab bar takes over (CSS
  only, same links). The toggle uses `ic--sidebar` (Button, icon-only, `aria-expanded`).
- **Mac:** system chrome natively; this is the web shell's version, drawn plainly so it doesn't
  pretend to be AppKit.

**18 List** (`list`). *Rows of things.*

- **Parts:** a row with a leading icon or tile (optional), a title, meta, and a trailing slot
  (a value, a chevron `ic--forward`, a Switch, a Tag).
- **Variants:**
  - plain (rules between rows, edge to edge);
  - inset (in a card-like frame, Panel-style);
  - with section headers;
  - a row as a link (the whole row is the target, like the card's list rows);
  - a row with a switch (the settings row);
  - a row with actions.
- **Swipe** to reveal actions is allowed only if a visible "More" (`ic--more`) button offers the
  same actions. Without script, the More button is all there is; the swipe is gate 4 or an
  app's own.
- **Relation to Card:** `.card__list` stays the card's; List is the full-width, screen-level
  version.

**19 Tabs** (`tabs`). *Sections of one screen.*

- **Markup:** ARIA tabs (`tablist`, `tab`, `tabpanel`), with `js/components/tabs.js` for arrow
  keys and Home/End, a roving tab stop and automatic activation.
- **Without script,** the panels are just stacked sections with headings, and the tab list is
  links to them.
- **Variants:** two to five tabs; full width on a phone; with a count Badge.
- **Not the segmented control:** that switches how one thing is shown, tabs switch which section
  is shown.
- **Copy:** Cards · Stats · Settings, inside a deck.

**20 Disclosure** (`disclosure`). *Show more, in place.*

- **Markup:** `<details>` and `<summary>`, styled. `ic--down` turns to `ic--up` with the open
  state (static glyphs, no rotation until gate 4).
- **Variants:** single; a group (an FAQ-like list, each independent); exclusive groups with
  `name` (one open at a time) only as a progressive extra.
- **Notes:** the summary is the 44px target. Copy: "How spaced repetition works", "Show the
  answer's notes".

**21 Menu** (`menu`). *A short list of actions behind one control.*

- **Markup:** the native `popover` attribute with `popovertarget` on a Button (icon-only `ic--more`
  or "Sort"). Inside, a list of Buttons, quiet and full width. A destructive item is last,
  separated by a rule, and says what it does ("Delete deck…").
- **Behaviour:** Escape and light dismiss come native.
  - No ARIA menu pattern (arrow keys) unless the page proves it's needed; the spec says why
    (Tab through buttons is the honest pattern without script).
  - Anchor it with CSS anchor positioning where supported, and fall back to a fixed sheet at the
    bottom of a phone.
- **Copy:** Rename, Duplicate, Export, Delete deck….

### Wave 4: feedback and overlays

What the app says back, and what sits on top of a screen. Shared notes:

- **Overlays are native:** `<dialog>` with `showModal()` for modal, `popover` for non-modal.
  - Focus moves in when they open and goes back to the control that opened them when they close.
  - Escape closes. The page behind is inert.
- **The backdrop** is the owner's decision: a flat ink layer at a fixed 60%, through a new
  `--scrim` role.
  - It's the one translucency the system allows. Rule 2 in `STYLE.md` gains the exception, with
    the reason: the page reads as "still there, but not now".
  - Under forced colours the scrim is invisible, so the overlay keeps its frame.
- **Words before chrome:** every message says what happened and what to do, in the product's
  voice. No "Oops", no "Something went wrong" on its own.
- **Live regions** follow status (polite) versus alert (assertive). Only a real failure that
  blocks you is assertive.
- **No motion:** things appear and disappear until gate 4 gives them an entrance.

**22 Dialog** (`dialog`). *Stop and decide.*

- **Variants:**
  - *confirm*: a destructive choice ("Delete Shapes? Its 12 cards go too." with Delete deck /
    Keep it). The safe choice is focused first, and the destructive one is never primary.
  - *acknowledge*: one button ("Can't import that file. It isn't a deck export. OK").
  - *with a field*: Rename deck, which reuses Form's inline form.
- **Notes:**
  - Square, a 2px frame on paper, at most about 28rem wide, centred, `--scrim` behind.
  - The title is the question; the buttons say the action ("Delete deck"), never "Yes" or "No".
  - A small `dialog.js` only if returning focus needs it; `showModal` handles the rest.
  - Mac: alerts are system chrome natively; this is the web shell's.

**23 Sheet** (`sheet`). *A task on top of a screen.*

- **Variants:**
  - *bottom sheet* on a phone: full width, up to about 90dvh, a visible close button (never
    drag-only), the top bar's layout inside;
  - *side sheet* on a wide screen;
  - *action sheet*: the phone's version of Menu.
- **Notes:**
  - Modal (`showModal`, `--scrim`). The bottom safe area is the sheet's.
  - Drag to dismiss and detents wait for gate 4; until then the close button is the way out.
  - Copy: Add a card (a form), Deck options (an action sheet).

**24 Toast** (`toast`). *It's done, with Undo.*

- **Variants:** done ("Deck deleted. Undo"); done with no action ("Saved on this device");
  failed with a retry ("Couldn't sync. Try again").
- **Notes:**
  - `role="status"` (polite), one at a time, above the tab bar and clear of the bottom safe area.
  - Stays at least 6 seconds, pauses while hovered or focused, and is never the only way to undo
    or retry (WCAG 2.2.1).
  - A keyboard shortcut reaches its action on the Mac.
  - Needs `js/components/toast.js`: queue, timer, pause.

**25 Banner** (`banner`). *News about the whole screen.*

- **Variants:**
  - *offline*: "You're offline. Changes are saved on this device." Status, no close while it's
    true;
  - *update ready*: "A new version is ready." with Reload;
  - *failure*: "Couldn't load your decks." with Try again. Alert only when it blocks.
- **Notes:**
  - Inline, at the top of the scroll region under the top bar, full width, square, a 2px rule
    below. Never floating.
  - Icon (`ic--offline`, `ic--refresh`, `ic--warning`) plus words, never colour alone.
  - It pairs with wave 5's service worker, which raises "update ready" and "offline" for real.

**26 Empty, loading and error** (`states`). *What a screen shows before there's anything, and
when something fails.*

- **Patterns, not new parts** (built from Card, Button, Spinner, Banner):
  - *empty*: a ghost card that offers the first step ("No decks yet. Make your first deck.");
  - *empty search*: "No decks match 'hexa'." with Clear search;
  - *loading*: the spinner and words, shown only after about 300ms (a pattern note; the delay is
    gate 4), with no shimmer or skeleton boxes;
  - *failed*: a plain card that says what happened, with Try again;
  - *offline*: cached content plus the offline banner;
  - *first run*: one screen that explains in one line and offers one action.
- **The page:** shows each as a phone-sized frame, using `screens.html`'s device frame classes.
- **Notes:** never blank; every state has a way forward.

### Wave 5: the platform

**27 PWA platform** (`pwa`). *What makes the elements an installed app: install, offline,
updates, permissions, sharing and the keyboard.*

The rules go in `STYLE.md` §4, the patterns page in `elements/pwa.html`, the page-side script in
`js/components/pwa.js` (so it ships in `flashcards.js`), and a working starter app in
`design/pwa/`. The starter is the proof: installable, and working offline, tested over
`localhost` (a secure context) with Playwright. `screens.html` stays a test bed of drawn devices
and links to it; a page of mock phones isn't an app worth installing.

**The starter, `design/pwa/`** (copy it, with `dist/` and `fonts/`, to start an app):

- **`index.html`:** one root screen built only from existing elements:
  - Frame (root: scroll + tab bar), the offline and update Banners at the top of the scroll
    region, an empty state that offers the first step;
  - a Settings list with the Install row and the storage line;
  - the iOS install Sheet.
  It links `../dist/flashcards.css` and `../dist/flashcards.js`, plus `manifest.webmanifest`.
- **`manifest.webmanifest`:**
  - `id`, `name`, `short_name`, `start_url`, `scope`, `lang`, `dir`;
  - `display: standalone`, `orientation: any`;
  - `theme_color` and `background_color` equal to `--canvas`. `tools/bundle.mjs` writes them
    from the colour file, so the hex lives in one place;
  - `icons`: any and maskable at 192 and 512 PNG, plus an SVG;
  - `shortcuts` (Today, Decks) and `screenshots` (narrow and wide), which Chromium's richer
    install sheet uses.
- **Icons:**
  - a master SVG drawn on the icon grid in ink on paper (monochrome until an app sets its
    accent), with the maskable safe zone (the centre 80% circle) respected;
  - PNGs rendered once from it, at 192, 512 (any and maskable) and 180 for
    `apple-touch-icon`. How they're rendered goes in the spec.
- **`sw.js`**, the service worker:
  - a versioned app-shell precache (the starter's HTML, `flashcards.css`, `flashcards.js`, the
    font, the icons). `tools/bundle.mjs` stamps the version from the files' hash, so changing
    any of them makes a new worker;
  - cache-first for the shell, stale-while-revalidate for everything else on the same origin;
  - no `respondWith` at all for anything cross-origin (network only);
  - `offline.html` for a navigation that fails with nothing cached;
  - an update flow: a new worker waits, the page shows the update Banner ("A new version is
    ready." with Reload), Reload posts `SKIP_WAITING`, and the page reloads once on
    `controllerchange`;
  - never an automatic surprise reload.
- **`offline.html`:** the fallback, built from the system: a plain card, the words, and Try
  again.

**`js/components/pwa.js`**, the page side. Everything is feature-detected and opt-in by
markup; anything it drives ships `hidden`:

- registers the worker named by `<meta name="flashcards-sw" content="sw.js">`, and only then;
- `[data-pwa="offline"]` (a Banner) shows while offline; `[data-pwa="update"]` (a Banner with
  a `[data-pwa="reload"]` Button) shows when a new worker waits;
- `[data-pwa="install"]` (a Button) shows when installing is possible: Chromium's stored
  `beforeinstallprompt`; on iOS, where no prompt exists, it opens the Sheet its `commandfor`
  names, detected by feature (`navigator.standalone === false`), not by user agent. Never in
  `display-mode: standalone`, never on load as a pop-up;
- `[data-share]` Buttons: `navigator.share`, else copy the link and a Toast, "Link copied";
- `[data-pwa="notify-ask"]`, the permission pre-prompt card, shows only while permission is
  still "default"; its `[data-pwa="notify"]` Button asks. `[data-pwa="notify-denied"]` shows
  how to turn it on in the browser;
- `[data-pwa="quota"]` gets "Using 2.1 MB of 1.2 GB on this device.";
- `Flashcards.badge(n)`, `Flashcards.persist()`, `Flashcards.download(name, data)` and
  `Flashcards.readJSON(file)` for the patterns below.

**Patterns** (the page, with live specimens where the browser allows):

- **Permission pre-prompt:**
  - Ask for notifications only after something the person did, from a card that says what
    they'll get ("A reminder at 8pm on days you haven't studied", with Not now and Turn on).
  - Never on load. If it's denied, the setting says how to turn it on in the browser.
  - Web push on iOS needs an installed app, and the pattern says so.
- **Badging:** `navigator.setAppBadge(dueCount)` and its clear, feature-detected. The count also
  shows inside the app.
- **Share:** `navigator.share` with a "Copy link" fallback and a Toast, "Link copied".
- **Keyboard:**
  - every page's viewport meta gains `interactive-widget=resizes-content`;
  - a focused field scrolls clear of the keyboard, using Frame's scroll padding;
  - the Tab bar hides while the keyboard is up where the browser exposes it (`visualViewport`,
    in `frame.js`), and otherwise stays.
- **Storage:**
  - `navigator.storage.persist()` asked after real use, never on first launch;
  - an Export and Import pattern (a JSON file) so data can leave the device;
  - the quota shown in Settings.
- **Standalone behaviour:**
  - every screen past the root has Top bar's back;
  - links that leave the app open in the browser, marked ↗ (`ic--arrow`);
  - deep links honour `start_url` and `scope`;
  - `@media (display-mode: standalone)` hides "Install".
- **Orientation and tablets:** any orientation; Frame's wide variant above about 48rem; safe areas
  in landscape.
- **Performance budget:** `tools/bundle.mjs` also writes `flashcards.min.css` (comments and
  spare whitespace out, nothing else changed), prints gzip sizes, and fails the build over
  budget:
  - CSS at most 30 KB gzipped (the min file, which is what a served app links);
  - JS at most 10 KB gzipped;
  - the font at most 90 KB, preloaded in a served app;
  - first load on a mid-range phone under 2.5s LCP (a target, measured on a device);
  - the service worker makes repeat loads instant.

**Verified:** in Chromium over `localhost` (`node design/tools/serve.mjs`):
- the worker installs and controls the starter;
- a reload offline still works, and an uncached page gets `offline.html`;
- a changed shell file makes a new worker, the update banner shows, and Reload swaps it in,
  reloading once;
- the manifest parses, with the installability criteria met as far as Chromium reports;
- the console is clean.

iOS behaviour is described, and marked as needing a device.

### Wave 6: colour and dark mode (gate 3, every element)

A pass over everything, not new elements. The owner's decisions:

- the palette is black, grey and white, shared by every app;
- each app sets one accent;
- dark mode and high contrast are part of the system, not an app's job.

**The colour file.** `tokens/color.css` replaces `color.wire.css`: the one `@import` line in
`flashcards.css` that gate 3 was built to swap. Role names stay the same, so no component changes
unless it proves it assumed a light page.

- **Primitives:**
  - a neutral grey ramp from white to near-black (no tint, no hue), with steps chosen for
    contrast, not by eye alone;
  - still the only colour values in the system.
- **Roles:**
  - each role is `light-dark(<light>, <dark>)`, and `base.css` sets `color-scheme: light dark`;
  - an app, or the sheet's switch, forces one with `color-scheme: light` or `dark` on `:root`.
- **Dark:**
  - canvas is near-black, paper one step lighter, and ink near-white (at least 7:1 on both, short
    of pure white so text doesn't glow);
  - frames are ink, as in light.
  - The hard shadow stays `--line`, so in dark it's a light slab. Decide by looking at both that
    and a mid-grey, and record why.
- **Tones:** six greys in each scheme, in the same order of strength (1 the quietest), each with
  its `--on-tone-n`.
- **`--scrim`:** near-black at 60% in both schemes. "Not now" is dark either way, and ink would
  lighten the page in dark.
- **`--focus`:** ink in both schemes, never the accent, so the ring always shows.
- **`--accent` / `--on-accent`:** ink and paper by default (monochrome).
  - An app overrides both in `@layer app`, usually as `light-dark()` pairs.
  - The accent fills only what already reads `--accent`: the primary Button and the card's action.
    Nothing means something by colour alone.

**The accent guard.** `tools/accent.mjs <light> [<dark>]` takes an app's accent and:
- checks it against paper and canvas in each scheme (3:1 as a fill edge) and against its text
  (4.5:1);
- picks `--on-accent` (paper or ink);
- where only a light accent is given, proposes a dark one by moving its OKLCH lightness until it
  passes;
- prints the `@layer app { :root { … } }` block to paste.

No dependencies. It refuses an accent that can't pass, and says why.

**High contrast:**
- `prefers-contrast: more` in either scheme: soft ink and soft lines become ink, and in dark the
  canvas goes to black and ink to white;
- forced colours: every element's existing rules, re-checked under a light and a dark system
  theme.

**The PWA:**
- two `theme-color` metas, the second with `media="(prefers-color-scheme: dark)"`, both written
  by `tools/bundle.mjs` from `--canvas`;
- the manifest keeps the light canvas (a manifest has no dark colour yet: a Known limit);
- the app icon stays ink on paper in both schemes.

**The gate:** check 9 (contrast) parses `light-dark()` and runs every pair in each scheme. It also
runs the default accent's pairs. The colour-literal rule doesn't change.

**The pages:**
- The sheet's own chrome (`sheet.css`) follows the scheme.
- The hub gets a scheme switch (Auto, Light, Dark) in `sheet.js`, remembered for the viewer, with
  storage wrapped so it never throws. The bundle carries it into both single-file pages.
- The swatches in `index.html` show both schemes, with their live ratios.

**Verified:**
- every element page, `screens.html` and the starter, in light, dark and more contrast, and under
  forced colours in light and dark;
- screenshots at 390 and 1440 for each;
- no element assumes a light page (a white glyph on paper, a shadow that disappears, a mix that
  turns muddy);
- `STYLE.md` §2 Tone becomes Colour, and the changelog says what changed.

**Not in this wave:** a second hue, tinted greys, gradients, or per-deck colours. The palette is
the owner's black, grey and white plus one accent.
