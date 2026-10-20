# Flashcards style sheet

v0.8 · wireframe stage · 27 of 27 elements built · 2026-10-20

The same system, two ways. **`index.html`** and the element pages in `elements/` are the ones
to look at: live specimens, every state, the markup read straight off the page. **This file**
and the element specs are the ones to build from: exact values, class names, and the reasons. If the two ever disagree, the CSS in `css/` wins and
the disagreement is a bug in whichever one is wrong. `node design/tools/check.mjs` catches
the mechanical kind. **`screens.html`** is the test bed: the system on a phone and a Mac, with
every element that isn't built yet marked where it would go.

> **Start here.**
>
> - **Six roles carry every colour:** `--canvas` (the page), `--paper` (a card), `--ink`
>   (text), `--ink-soft` (secondary text), `--line` (frames), `--accent` (the one "press
>   this"). Fills come from `data-tone="1"` … `"6"` or `"ink"`.
> - **Elements build a screen.** Copy markup from the element pages in `elements/`: every
>   specimen prints its own. Card's are `.card-grid`, `.card`, `.card__body`, `.card__title`,
>   and `.card--link` with `.card__link` in the title.
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
2. **Flat.** No gradients, no blur, no translucency, with one exception: the `--scrim` behind a
   modal dialog or sheet, a flat ink layer at 60%, so the page reads as "still there, but not
   now". A shadow is hard-edged (zero blur) and means "you can press this". Nothing else gets
   one. Hover and press never move the hit
   box: the lift is the shadow alone, never a `transform`.
3. **Rectangles hold, circles act.** Containers are square. Buttons, handles and action
   slots are circles or pills. Two exceptions: the card bar's small square control, which
   belongs to the frame, and the checkbox, which every platform draws square (§7).
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
no `@import` chain to wait on. `css/flashcards.css` is its source. A served app links
`dist/flashcards.min.css` and `dist/flashcards.min.js`: the same code with comments and spare
whitespace out, inside the budget in `elements/pwa.md`. Elements that need script
(Field's clear button, Checkbox's "select all", Stepper's − and +, Form's error summary,
Frame's measured `--chrome` and keyboard, Tabs' arrow keys, Dialog's opener and focus return,
Toast's queue and timer, and the PWA platform's worker, bands, install, share and storage in
`pwa.js`) ship
it in `dist/flashcards.js`, built from `js/components/`: vanilla, no dependencies, and
everything still works without it. The file tree is in
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
  figure and answer sizes come from the card's own width (`cqi`), not the viewport (`elements/card.md`). The
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
The sheet's pages don't preload: from disk the preload fails CORS and the font loads twice.

### Space

A 4px grid. `--space-N`: 1 = 4px · 2 = 8 · 3 = 12 · 4 = 16 · 5 = 24 · 6 = 32 · 7 = 48 ·
8 = 64. `--gutter` `clamp(1rem, 0.6rem + 1.6vw, 1.75rem)` is the gap between cards; inside a Frame it
follows the frame's own width (`cqi`), so a pane gets a pane's gutter.
`--measure` 62ch is the widest a paragraph gets.

**Safe areas.** `--safe-top`, `--safe-right`, `--safe-bottom` and `--safe-left` are
`env(safe-area-inset-*, 0px)`. The bars and Frame read them, as in
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
| `--radius-tile` | 0 | icon tiles, tags, badges, meter bars |
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
| `--scrim` | behind a modal dialog or sheet: ink at 60%, the one translucency (rule 2) |
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

### Icons

Twenty-six glyphs in `icons.css`, drawn on a 24 grid with a 2px square-cap stroke (the frame's
weight, so an icon reads as line work and not as a sticker). They are CSS masks, so they take
`currentColor`:

```html
<span class="ic ic--search" aria-hidden="true"></span>
```

Navigation (back, forward, down, up), actions (more, search, edit, delete, share, undo,
refresh, shuffle, flip, install, sidebar), status (info, warning, offline), places (settings,
today, decks), and `ic--arrow` (↗), `ic--plus`, `ic--minus`, `ic--close`, `ic--check`. Size
with `--ic-size` (1.25rem; 1.5rem standing alone). Decorative by default: when an icon is a
control's only content, the *control* gets the `aria-label`. ↗ means "leaves the app", on the
web and on Apple platforms, so it never marks an in-app link. Every glyph's path, for native
ports: `elements/icons.md`.

---

## 3. Elements

Each element has a page and a spec in `elements/`: `elements/<name>.html` shows every variant
and state live, with its markup, and `elements/<name>.md` gives the exact values and the
reasons. The hub, `index.html`, lists them all with their status. How an element is built,
and the brief for each one, is in `elements/README.md`.

| Element | Spec | Status |
| --- | --- | --- |
| Card | `elements/card.md` | Gates 0–2 |
| Button | `elements/button.md` | Gates 0–2 |
| Field | `elements/field.md` | Gates 0–2 |
| Tag and Badge | `elements/tag.md` | Gates 0–2 |
| Meter and Spinner | `elements/meter.md` | Gates 0–2 |
| Icons | `elements/icons.md` | Gates 0–2 |
| Checkbox | `elements/checkbox.md` | Gates 0–2 |
| Radio | `elements/radio.md` | Gates 0–2 |
| Switch | `elements/switch.md` | Gates 0–2 |
| Segmented control | `elements/segmented.md` | Gates 0–2 |
| Select | `elements/select.md` | Gates 0–2 |
| Stepper | `elements/stepper.md` | Gates 0–2 |
| Form | `elements/form.md` | Gates 0–2 |
| Frame | `elements/frame.md` | Gates 0–2 |
| Top bar | `elements/topbar.md` | Gates 0–2 |
| Tab bar | `elements/tabbar.md` | Gates 0–2 |
| Sidebar | `elements/sidebar.md` | Gates 0–2 |
| List | `elements/list.md` | Gates 0–2 |
| Tabs | `elements/tabs.md` | Gates 0–2 |
| Disclosure | `elements/disclosure.md` | Gates 0–2 |
| Menu | `elements/menu.md` | Gates 0–2 |
| Dialog | `elements/dialog.md` | Gates 0–2 |
| Sheet | `elements/sheet.md` | Gates 0–2 |
| Toast | `elements/toast.md` | Gates 0–2 |
| Banner | `elements/banner.md` | Gates 0–2 |
| Empty, loading and error | `elements/states.md` | Gates 0–2 |
| PWA platform | `elements/pwa.md` | Gates 0–2 |

Every other element is listed, with its wave, in `elements/README.md`. This table grows as they
pass gate 2.

---

## 4. Platforms

### PWA: installed, touch first

The patterns are on `elements/pwa.html`, the spec is `elements/pwa.md`, and `design/pwa/` is a
starter app that installs and works offline (serve it with `node design/tools/serve.mjs`).

- **Edge to edge, and room for the keyboard.** The viewport meta is
  `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`.
  Bars and the app frame pad by the safe-area tokens (§2 Space); cards never read them.
  `resizes-content` makes Android end the page at the keyboard instead of covering it.
- **One canvas.** `theme-color` and the manifest's `theme_color` and `background_color` are
  `--canvas`. `tools/bundle.mjs` writes the hex in from the colour file, so it lives in one place.
- **Viewport units.** `dvh` for the app frame only (`.frame`), so it tracks the browser bars.
  Anything sized once uses `svh`, so it doesn't jump when the bars move (the study card).
- **Inputs are 16px or more,** or iOS zooms on focus: `base.css` sets
  `:is(input, select, textarea) { font-size: max(1rem, 1em) }`.
- **The keyboard takes the Tab bar's room.** While the on-screen keyboard is up the Tab bar hides,
  and the focused field scrolls clear with Frame's scroll padding. `frame.js` sees the keyboard as
  lost viewport height (`visualViewport`) and sets `data-keyboard` on the frame; without script,
  or where the browser shows nothing, the bar stays. Not yet checked on a device.
- **Scrolling stays put.** One scroller per screen (`.frame__scroll`), with
  `overscroll-behavior: contain`. Refresh is a button, not pull-to-refresh.
- **No browser chrome.** Standalone has no back, address or refresh. Every screen past the root
  shows Top bar's back. A link that leaves the app opens in the browser and is marked ↗
  (`ic--arrow`), with "opens in your browser" in its name. A deep link inside `scope` opens that
  screen; the home screen always opens `start_url`.
- **Installed from Settings, never by a pop-up.** The manifest says `display: standalone` and
  `orientation: any`, with `start_url` and `scope` at the app's root and icons any and maskable.
  Install is a row in Settings that appears only when the browser can: Chromium's own prompt, kept
  from `beforeinstallprompt`; on iOS a Sheet with the Add to Home Screen steps. Never on load,
  never inside the installed app.
- **Offline is not an error.** The service worker precaches the app shell (cache first), serves
  the rest of its origin stale-while-revalidate, and never touches another origin's requests.
  Offline, the offline Banner sits over what's on the device; a page never opened gets
  `offline.html`, a plain card with Try again.
- **Updates wait for the person.** A new worker waits; the update Banner says "A new version is
  ready." with Reload, which hands over and reloads once. Never an automatic reload.
- **Ask after, never on load.** Notifications are asked for from a card after something the person
  did ("A reminder at 8pm on days you haven't studied", Not now, Turn on), and storage persistence
  after real use. If notifications are blocked, the setting says how to allow them. On iOS, web
  push needs the app on the Home Screen.
- **Badge, share and export.** The due count goes on the icon's badge and on the Decks
  tab. Share opens the system sheet, or copies the link and a Toast says "Link copied." Export and
  Import a JSON file in Settings, with the room the decks take in words.
- **Any orientation.** Never locked. On its side a phone's notch moves to one end, and the bars
  and the scroll region pad by the side safe areas; from 45rem of frame the wide variant takes over.
- **Overlays are native.** Dialogs and sheets are `<dialog>` with `showModal()`, opened by
  `commandfor` and `command="show-modal"`; `dialog.js` covers browsers without them and gives
  focus back where a click doesn't focus. A bottom sheet owns the bottom safe area, as a bar
  does. Drag to dismiss waits for gate 4, so a sheet always shows Close.
- **Never blank.** Empty is a ghost card that offers the first step. Offline or error is a plain
  card that says what happened, with "Try again" in its foot.
- **Text size follows the reader:** Dynamic Type is on (§2 Type). Test at the largest size.
- **Pressed states need a listener on iOS.** Safari only applies `:active` when a `touchstart`
  listener exists, so the shell adds `document.addEventListener("touchstart", () => {}, { passive: true })`.
  Not yet checked on a device.
- **A budget, enforced.** `tools/bundle.mjs` writes `dist/flashcards.min.css` and
  `dist/flashcards.min.js`, which a served app links, prints gzipped sizes and fails over budget:
  CSS at most 30 KB (about 13 now), JS at most 10 KB (about 6), the font at most 90 KB (88),
  preloaded with `crossorigin`. First load on a mid-range phone under 2.5 s to the largest paint,
  measured on a device; the worker makes later loads instant.

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
| Colour roles, `data-tone` | asset colour sets `canvas`, `paper`, `ink`, `inkSoft`, `inkFaint`, `line`, `focus`, `tone1…6`, `onTone1…6`, each with Any, Dark and High Contrast; `--accent` → `AccentColor` | A tone is a `Tone` enum parameter, not inherited (as with `inherits: false`). Built without Xcode (no `actool`, so no asset catalog), the same names are `Color` statics in one `Color+Roles.swift`, with Increase Contrast through `NSColor(name:dynamicProvider:)`. |
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
| Rule 3: circles and pills for everything you act on (§1) | The checkbox is a 24px square | Platform convention wins: every platform draws a checkbox square, and a round box reads as a radio (usability facts come first, §6). |
| Menus get arrow keys and a roving focus (interaction-design) | A popover of plain buttons; Tab moves through them | No script needed, and `role="menu"` without its full keyboard model is worse than none. Our menus are four or five items. |

---

## 8. Changelog

- **0.8.0** · 2026-10-20 · Wave 5: the PWA platform passes gates 0–2, so all 27 elements have.
  `design/pwa/` is a starter app that installs and works offline: a manifest whose colours the
  bundle writes from `--canvas`, icons drawn on the card's grid, a service worker (shell cache
  first, the rest stale-while-revalidate, `offline.html`, updates that wait for Reload) and
  `pwa.js` (the bands, install from Settings, share, the permission pre-prompt, badge, storage,
  export and import). Frame hides the Tab bar while the on-screen keyboard is up, replacing the
  focus-only guess; every page's viewport gains `interactive-widget=resizes-content`. The bundle
  writes `flashcards.min.css` and `flashcards.min.js`, prints gzip sizes and fails over budget.
  `tools/serve.mjs` serves `design/` on localhost. Form errors now clear as soon as the value is
  right, so the submit button no longer moves under the click that blurs a field.
- **0.7.0** · 2026-10-20 · Wave 4: Dialog, Sheet, Toast, Banner, and Empty, loading and error
  pass gates 0–2. Overlays are native `<dialog>`s over the new `--scrim` role, the one
  translucency rule 2 allows. Toasts queue one at a time, pause while hovered or focused and
  never are the only way to undo. Every screen state has words and a way forward.

- **0.6.0** · 2026-10-20 · Wave 3: Frame, Top bar, Tab bar, Sidebar, List, Tabs, Disclosure and
  Menu pass gates 0–2. Frame is the app shell (bars that own their safe areas, one scroller,
  a measured `--chrome`, a gutter that follows the pane); `screens.html` now runs on Frame, Top
  bar and Tab bar instead of its own layout and grey slots. Menus are native popovers;
  tabs get arrow keys from `tabs.js`. The study card gains an 8rem floor.

- **0.5.0** · 2026-10-20 · Wave 2: Checkbox, Radio, Switch, Segmented control, Select, Stepper
  and Form pass gates 0–2. The New deck form uses all of them, with validation on submit or
  blur and an error summary that takes focus. The checkbox stays square (§7). Script for
  "select all", the stepper and the error summary joins `dist/flashcards.js`.

- **0.4.0** · 2026-10-20 · Wave 1: Button, Field, Tag and Badge, Meter and Spinner, and Icons
  (26 glyphs) pass gates 0–2. Real buttons, tags and meters replace the stand-ins in the card
  page and the screens, and the kit's meter and pill stand-ins are gone. A card's foot no longer
  restyles a `.btn`. `dist/flashcards.js` ships element script, starting with Field's clear
  button.

- **0.3.0** · 2026-10-20 · Restructured for the whole system: a hub page (`index.html`) with
  the rules, the tokens and an index of all 27 elements, and one page and one spec per element
  in `elements/` (Card moved to `elements/card.html` and `elements/card.md`). The build
  contract, a brief for every element and page and spec templates are in
  `elements/README.md`. The bundle joins every page into `dist/style-sheet.html`; the gate
  checks every page and spec, and that no id clashes between pages.

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
