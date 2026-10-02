# Style guide

v0.2 · colour and motion open · elements: **Card**, **Button** (more on the way) · 2026-09-30

The same guide, two ways. **`docs/index.html`** (built from `docs-src/`) is the one to look at: live specimens, every state, the markup read straight off the page. **This file** is the one to build from: exact values, class names, and the reasons. If the two ever disagree, the CSS in `src/` wins and the disagreement is a bug in whichever one is wrong. `npm run lint` catches the mechanical kind.

> **For a coding agent.** Read this before touching UI. Use the classes and tokens named here; don't invent new ones. Components read *roles* (`--paper`, `--ink`, `--tone-bg`), never a colour literal. Run `npm run lint` before you finish. If something you need isn't here, it belongs to an element that hasn't been through the pipeline yet: say so instead of improvising it. `CLAUDE.md` is the working procedure; this file is the spec.

**Provenance.** This guide is the owner's *Flashcards style sheet v0.1*, generalised. Their type, space, line, shape, hit-target and focus tokens, the role names, the tone API, the `.card` element and the checker rules are kept as they wrote them. Added on top: dark mode, higher contrast, six palettes and a verified colour engine (gate 3); motion (gate 4) for the two elements that have it; the `.btn` element; an accessibility test gate; and everything below marked *added*.

---

## 1. What this is

Minimal, brutalist, friendly, and not AI-looking. Each word is a constraint you can check, not a mood:

| Word | What it means here | How it's enforced |
| --- | --- | --- |
| Minimal | One type family. Two line weights. Nothing decorative. | Rules 1, 4, 7 |
| Brutalist | Visible structure. Hard 2px frames, hard shadows, big flat type, no softening effects. | Rules 1, 2 |
| Friendly | Circles and pills for everything you can act on. Large, relaxed type. Copy that talks like a person. | Rules 3, 5 |
| Not AI-looking | No gradients, blur, glass, tinted-circle icons, accent stripes, one-radius-for-everything, or copy that fits any product. | `npm run lint` bans the mechanical ones; rule 5 covers the rest |

### The seven rules

1. **Two line weights.** `--bw` 2px frames what you press or what contains. `--bw-thin` 1px only divides. `--bw-heavy` 4px exists for forced-colours mode and nothing else.
2. **Flat.** No gradients, no blur, no translucency. A shadow is hard-edged (zero blur) and means "you can press this". Nothing else gets one. One exception: the `--scrim` behind a modal or under text on a photo.
3. **Rectangles hold, circles act.** Containers are rectangles, square or soft. Buttons, handles and action slots are circles or pills.
4. **Uppercase is structure.** Bar labels, index numbers, the display line. Everything you read is sentence case.
5. **Say something real.** No lorem ipsum, no "John Doe", no "seamless". Copy comes from the app: shapes, decks, wallets, streaks.
6. **Colour is a swap.** Components read roles. Only `src/tokens/` contains a colour literal.
7. **No decoration.** If it carries no information and offers no action, it goes. No dotted backgrounds, no icons in tinted circles.

### The test

Run it on any screen before calling it done.

- **Squint.** Blur your eyes or the screenshot. Does the structure survive with colour removed (`data-palette="wire"`)? If it only works in colour, colour is hiding a layout problem.
- **Cover the logo.** Could this be any product's card? Then the copy or the shape isn't doing its job.
- **Count.** Line weights: two. Type families: one. Gradients: zero. Blurred shadows: zero. Shadows on things you can't press: zero.
- **Read it out loud.** If it sounds like a landing page, rewrite it.

---

## 2. Foundations

Everything is a custom property. Words and the space between blocks are `rem` so they follow the reader's text size; the chrome around the words (insets, icon-only controls and their targets) stops at its 100% size (see *Chrome caps* below); line weights are `px` so a 2px rule stays 2px.

### Files and layers

```
dist/styleguide.css       the one file an app links. Declares the layer order.
  src/tokens/00-foundation.css   type, space, line, shape, hit, focus, @property   (layer: sg.tokens)
  src/tokens/10-color.css        knobs → colour roles, dark, higher contrast       (layer: sg.tokens)
  src/tokens/20-tones.css        six tone slots, ink, four status tones, bold       (layer: sg.tokens)
  src/tokens/30-corners.css      square | soft                                      (layer: sg.tokens)
  src/tokens/40-palettes.css     mint, periwinkle, sand, cream, wire                (layer: sg.tokens)
  src/tokens/50-fonts.css        @font-face for Archivo (variable: wght 100–900, wdth 62–125%)
  src/tokens/60-motion.css       durations, easings, --move, reduced motion         (layer: sg.tokens)
  src/base/                      reset, element defaults, .t-* styles, icons        (layer: sg.reset, sg.base)
  src/layout/layout.css          app shell and layout primitives                    (layer: sg.layout)
  src/components/*.css           the elements                                       (layer: sg.components)
dist/icons.css            about 150 more masked icons (optional)
dist/wire.css             wireframe placeholders, .wf-* (development only)            (layer: sg.wire)
```

Layer order is `sg.reset, sg.tokens, sg.base, sg.layout, sg.wire, sg.components, sg.utilities`: the wireframe kit sits below components (a placeholder must never override a real element; in the original it sat above and erased a disabled notch's silhouette), and utilities sit last so `.sr-only` and `.num` win over a component's `position` and `font:`. Later wins, so nothing needs a specificity fight. An app's unlayered CSS wins over all of it.

### Type

One family, three widths. Archivo's width axis does the job a second typeface normally does: expanded for posters, normal for reading, condensed for labels. Fallback stack: `"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif`. Self-hosted, SIL OFL 1.1 (`src/fonts/OFL-Archivo.txt`), in three subsets that a browser downloads only when a page uses their characters: latin (the owner's file, 90 KB), latin-ext (Polish, Czech, Turkish, Romanian … and the currency signs ₹ ₩ ₺ ₽ ₴), vietnamese. Cyrillic, Greek, Arabic, Hebrew, Indic and CJK are not in the font: they fall back glyph by glyph to the next family, which has no width axis, so condensed labels look wider there. Each style is a whole `font` shorthand, so weight, width, size, line-height and family travel together.

| Token | Weight · width | Size | Line | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `--type-display` | 900 · 125% | `--text-4xl` 68–240px | 0.85 | −0.035em | `.t-display`. Uppercase. One per page. |
| `--type-title` | 500 · 100% | `--text-xl` 24–32px | 1.1 | −0.015em | `.t-title`. Card and section titles. Balanced. |
| `--type-body` | 400 · 100% | `--text-md` 16px | 1.5 | 0 | `.t-body`. Pretty-wrapped. |
| `--type-meta` | 400 · 100% | `--text-sm` 14px | 1.3 | 0 | `.t-meta`. Tabular figures. Soft ink. |
| `--type-label` | 700 · 75% | `--text-xs` 13px | 1 | +0.08em | `.t-label`. Uppercase. Structure only. |
| `--type-figure` | 600 · 112.5% | `--text-3xl` 48–104px | 0.85 | −0.03em | `.t-figure`. Tabular, lining. |
| `--type-ctl` | 600 · 100% | `--text-md` 16px | 1 | 0 | What you read on a button or control. *added* |

Size scale: `--text-xs` 0.8125rem · `--text-sm` 0.875rem · `--text-md` 1rem · `--text-lg` 1.25rem · `--text-xl` `clamp(1.5rem, 1.3rem + 0.9vw, 2rem)` · `--text-2xl` `clamp(2rem, 1.5rem + 2.2vw, 3.25rem)` · `--text-3xl` `clamp(3rem, 1.6rem + 5.6vw, 6.5rem)` · `--text-4xl` `clamp(4.25rem, 1rem + 15vw, 15rem)`. `.t-mono` and `.num` exist for code and tabular numbers. Line heights: `--lh-none` 0.85, `--lh-tight` 1.1, `--lh-snug` 1.3, `--lh-body` 1.5.

Inside a card, title and figure sizes come from the card's own width (`cqi`), not the viewport. See §3.

**Wrapping.** Words wrap between words: headings, paragraphs and list items have `overflow-wrap: break-word`, so a word breaks inside itself only when it alone is wider than the line. Never `overflow-wrap: anywhere` on text in a layout: it makes an element's min-content one letter, so a flex or grid item shrinks below its longest word and the word shatters ("Shopp / ing"); the lint fails it (§5). `.break` is `min-inline-size: 0` + `break-word` + `hyphens: auto`, for a flex or grid item that may hold a word longer than the line. Running text (`p`, `li`, `dd`, `figcaption`, `blockquote`) has `text-wrap: pretty`; titles `text-wrap: balance`, and the display line and the card's text slots `hyphens: auto` (Chromium on Linux, where the tests run, has no hyphenation dictionaries, so screenshots show a plain break where a phone shows a hyphen). A number never breaks mid-number: give it `white-space: nowrap`, and let a display figure shrink to fit its box (a size bounded by `cqi`) instead of wrapping.

### Space

A 4px grid. `--space-N`: 1 = 4px · 2 = 8 · 3 = 12 · 4 = 16 · 5 = 24 · 6 = 32 · 7 = 48 · 8 = 64 · 9 = 96 (`--space-0` is 0). They are the space *between* blocks and grow with the text. `--gutter` `clamp(min(1rem, 16px), 0.6rem + 1.6vw, min(1.75rem, 28px))` is the gap between cards and the app column's side inset, chrome at both ends. `--measure` 62ch is the widest a paragraph gets.

### Chrome caps *(added)*

Words grow with the reader's text size; the chrome around them stops at its 100% size, as iOS and Android do (Dynamic Type grows the words, not the icons or the insets). At 200% text rem chrome ate a phone: two 88px circles beside a title left it a few letters a line, and a button's 48px of side padding pushed its own label onto two lines. Each cap is the smaller of a rem size and its px size, so at 100% text nothing changes. Browser zoom still scales everything, because zoom scales px.

| Token | Value | Use |
| --- | --- | --- |
| `--chrome-1` … `--chrome-6` | `min(var(--space-N), <its px>)`: 4 · 8 · 12 · 16 · 24 · 32px | insets of controls and containers: padding, the gaps inside a control |
| `--chrome-ic` | `min(1.5rem, 24px)` | an icon that stands alone in a bar (the dock) |
| `--chrome-ic-sm` | `min(1.25rem, 20px)` | the icon of an icon-only control |
| `--chrome-ic-xs` | `min(0.75rem, 12px)` | a glyph inside a drawn box (the card's bar control) |
| `--chrome-box` | `min(1.25rem, 20px)` | a box drawn inside a 44px target |
| `--chrome-ctl-sm` · `--chrome-ctl` · `--chrome-ctl-lg` | `min(var(--ctl-sm), 36px)` · `min(var(--ctl), 44px)` · `min(var(--ctl-lg), 56px)` | icon-only circles; a cell in a bar of icons |
| `--chrome-hit` | `min(var(--hit), 44px)` | the target of an icon-only control |

Grows (rem): words, a control's height, the space between blocks, and an icon inside a line of words (in `em`, for example `--ic-size: 1.15em`, so it tracks its label; only the padding, the gaps and the target around it stop). Stops (`--chrome-*`): insets, icon-only controls and their targets, the slots that hold them (a row's chevron, a bar control, a leading picture, avatar or tile), badges on icons, the frames of pictures.

### Line

`--bw-thin` 1px (divides: foot rules, list rows) · `--bw` 2px (frames: cards, controls, tiles) · `--bw-heavy` 4px (forced-colours only).

### Shape

Circles and pills are always `--radius-pill` (999px). Everything else reads exactly three roles, which are the only radii a component may use:

| Role | `data-corners="square"` (default) | `"soft"` | Used by |
| --- | --- | --- | --- |
| `--radius-card` | 0 | `--radius-3` 24px | the card frame |
| `--radius-tile` | 0 | `--radius-2` 12px | icon tiles, media inset |
| `--radius-ctl` | 0 | `--radius-1` 6px | the square bar control |

**Open decision: square or soft.** Both are implemented and the appearance panel flips them. The default is square, because that is what the owner's committed CSS does. To commit to soft, change the default block in `src/tokens/30-corners.css`; nothing in `src/components/` changes. One shape gesture per card: round it **or** notch it, never both.

### Hit targets and focus

`--hit` 2.75rem (44px). The drawn thing may be smaller; the target is not. A 20px box is fine inside a 44px control. Control heights *(added)*: `--ctl-sm` 36px (hit area still 44), `--ctl` 44px, `--ctl-lg` 56px; a control with a label grows past them with its text. An icon-only control is chrome: `--chrome-ctl-sm` / `--chrome-ctl` / `--chrome-ctl-lg` with a `--chrome-hit` target at every text size. `--ring` 3px, `--ring-offset` 3px, colour `--focus`, plus a paper halo so it shows on any background. Inside a card the offset drops to `--ring-offset-in` (2px) because the card clips its contents; set `--ring-gap` to pick one.

### Colour

Colour is built in three steps, and only the first contains numbers:

1. **Knobs** (`--k-*`) are plain numbers: OKLCH lightness, chroma, hue. A palette, the theme and the contrast mode change knobs and nothing else.
2. **Roles** are derived from knobs with `light-dark(oklch(...))`. They are what components read.
3. **Components** read roles. They never know which palette, theme or corner style is active.

Contrast is **by construction**: lightness decides contrast, so each pair keeps a fixed lightness gap and hue and chroma add personality only. `npm run test:contrast` checks every pair in every theme × contrast × palette combination with colours resolved by a real browser.

| Role | Means | Contrast floor |
| --- | --- | --- |
| `--canvas` | the page behind everything | |
| `--paper` | a card's default fill | |
| `--paper-2`, `--paper-3` | a recessed fill (track, input, well) and its pressed shade *(added)* | |
| `--ink` | text and frames | 7 : 1 on canvas, paper, paper-2, paper-3 |
| `--ink-soft` | secondary text | 7 : 1 (4.5 : 1 on paper-3) |
| `--ink-mute` | placeholder, tertiary text *(added)* | 4.5 : 1 |
| `--ink-faint` | disabled, quiet decoration | 3 : 1; never text that matters |
| `--line`, `--line-soft` | frames (= `--ink`); decoration that must stay quiet (= `--ink-faint`) | 3 : 1 |
| `--focus` | focus ring (= `--ink`) | 3 : 1 |
| `--accent`, `--on-accent` | the one "press this" colour and the text on it | 4.5 : 1 |
| `--accent-ink` | the accent used *as* text or an icon *(added)* | 4.5 : 1 |
| `--accent-soft`, `--on-accent-soft` | a soft accent wash (selected row) and its text *(added)* | 4.5 : 1 |
| `--ok-ink`, `--warn-ink`, `--bad-ink`, `--info-ink` | status text; always with an icon or words *(added)* | 4.5 : 1 |
| `--scrim`, `--scrim-strong`, `--on-media` | the modal backdrop and the plate that keeps white text ≥ 4.5 : 1 over any photo *(added)* | 4.5 : 1 |

In higher contrast (`prefers-contrast: more` or `data-contrast="more"`) text goes to ≥ 7 : 1 everywhere and the accent collapses to ink. The media-query block and the attribute block are identical and the lint asserts it. Never draw text with `opacity`. Colour never carries meaning alone (WCAG 1.4.1).

**Palettes.** `default` is neutral greys with an ink accent (black on light, white on dark). `mint`, `periwinkle`, `sand` and `cream` tint the canvas and move the accent and tone hues. `wire` is greys only, with six climbing greys for the tone slots: the squint test.

### Tones

Put `data-tone="1"` … `"6"` or `"ink"` on any element. That exposes `--tone-bg` and `--tone-ink` *for that element only* (both are registered with `inherits: false`, so a toned card never paints its toned-less children). A component decides what to do with them. `ink` is the inverted tone: ink fill, paper text. Direct tokens `--tone-1` … `--tone-6` and `--on-tone-1` … `--on-tone-6` are also available.

Added on the same machinery: `--tone-ink-soft` (secondary text on a tone, ≥ 4.5 : 1), `--tone-fill` and `--tone-on-fill` (a solid pill or bar that sits on the tone), `data-tone="ok" | "warn" | "bad" | "info"` for status, and `data-emphasis="bold"` (a saturated mid-dark fill with near-white text instead of a pastel; put it on the same element as `data-tone`). Pastel fills are at OKLCH L ≥ 0.92 with ink at L ≤ 0.39, which is ≥ 7 : 1 for every hue. **Tones carry rhythm, never meaning**: a tone alone must not say "error".

### Motion

Gate 4 is open. Two registered numbers drive interaction: `--lift` (0 flat, 1 raised: a 2px move and a 4px hard shadow) and `--fill` (0 outline, 1 filled). Every state only sets them, so hover, focus and pressed share one definition and a single `transition` animates both. Tokens: `--dur-press` 130ms · `--dur-hover` 200ms · `--dur-move` 520ms · `--dur-enter` 320ms *(added)* · `--ease-out` `cubic-bezier(0.22, 1, 0.36, 1)` · `--ease-flip` `cubic-bezier(0.83, 0, 0.17, 1)` · `--ease-in` *(added)*.

Only `transform`, `opacity` and the two numbers animate. **Reduced motion means gentler, not instant**: `--move` goes to 0 (every component multiplies its travel by it), durations shorten, a spinner becomes a pulse, and colour changes stay. `perspective` belongs on the flip's direct parent. `prefers-reduced-motion` and `data-motion="reduced"` set identical blocks.

### States

Two families set the two numbers differently. An **action** does something when pressed (a `.btn` without `aria-pressed`, a link card): the owner's states. A **selection control** is selected, on or current (chip, tab, segmented option, toggle button, dock item, tile, swatch, calendar day, timeline clip, chosen chart bar, sheet handle, pressable avatar): the solid fill means selected and nothing else, so a hovered chip never looks selected. *(added)*

| State | Comes from | Action: `--lift` / `--fill` | Selection: `--lift` / `--fill` |
| --- | --- | --- | --- |
| rest | nothing | 0 / 0 (primary starts filled) | 0 / 0 |
| hover | `:hover` inside `@media (hover: hover)` | 1 / 1 | 1 / 0 |
| focus | `:focus-visible` (+ the ring) | 1 / 1 | 1 / 0 |
| pressed | `:active` (`--dur-press`) | 0 / 1 | 0 / 0.15, a tint visible within 100ms |
| selected, on, current | `aria-pressed` / `-selected` / `-checked="true"`, `aria-current` | n/a | – / 1, plus a structural cue: doubled frame, check, underline or weight |
| selected + hover or focus | both | n/a | 1 / 1 |
| busy · unavailable | `aria-busy` · `:disabled`, `aria-disabled` | 0 / – · 0 / 0 | the same |

A list row lives inside a frame and does not lift: hover is a light tint, pressed a deeper one, current is the ink fill with a check and a bold title.

### Icons

Five glyphs ship in the main bundle, the owner's own drawings on a 24 grid with a 2px square-cap stroke (the frame's weight, so an icon reads as line work and not as a sticker). About 150 more, re-stroked to the same weight from Lucide (ISC), are in `dist/icons.css`. They are CSS masks, so they take `currentColor`:

```html
<span class="ic ic--arrow" aria-hidden="true"></span>
```

`ic--arrow` (↗) · `ic--plus` · `ic--minus` · `ic--close` · `ic--check`. Size with `--ic-size` (default 1.25rem): an icon beside words grows with them (in `em` beside a label that is not body size); an icon that is the whole control is chrome (`--chrome-ic-sm`, `--chrome-ic`, `--chrome-ic-xs`). Decorative by default: when an icon is a control's only content, the *control* gets the `aria-label`.

### Layout primitives *(added)*

Intrinsic, no media queries: `.app` (shell), `.stack`, `.cluster`, `.split`, `.grid` (`--grid-min`), `.center`, `.bleed`, `.scroller`, `.cq` (make a container), `.sticky-top`, `.safe-top`, `.safe-bottom`, `.safe-x`, `.break`, `.truncate`. Safe-area insets need `viewport-fit=cover` and cover all four sides (landscape phones have side insets). Sticky chrome sets `--appbar-h` / `--dock-h` so focus is never hidden behind it.

**A bar or a row of controls never wraps raggedly** *(added)*: it is one row at every size, and when it cannot fit it switches as a whole (icons only, the short form, one item per line, or a scroller with a clear cue). Where CSS cannot know whether the row fits, `SG.fit` (`src/js/05-fit.js`, in the core script) measures it: `SG.fit.register(selector, { steps, measure, parts, start, attrs })` tries the steps richest first and writes the first that fits to `data-fit`; the element's CSS keeps the row on one line while `data-fit` is set, and has its own fallback without script. The dock, the segmented control and the pager use it.

### Appearance switches

| Attribute | Values | Changes |
| --- | --- | --- |
| `data-theme` | light · dark (absent = OS) | colours |
| `data-contrast` | more (absent = OS) | lightness gaps |
| `data-palette` | default · mint · periwinkle · sand · cream · wire | hue, tint, accent, tone hues |
| `data-corners` | square · soft | the three radius roles |
| `data-motion` | reduced · full (absent = OS) | `--move`, durations |

All work on `<html>` or on any element (an island). `window.SG.prefs` persists the choices and applies them before first paint.

---

## 3. Elements

Each element has a page in the docs with live specimens, every state, anatomy, an API table, a keyboard and screen-reader table, and the tokens it reads. Card and Button below are the owner's and frozen enough to build on. Fifty more arrived through the pipeline in §6, in the owner's vocabulary (forms, selection and navigation, surfaces, overlays and feedback, data, media and tools); the docs overview lists them all, and the Status page says how far each has got.

### Card

The owner's original element, ported without changes to its class names, anatomy or states. A card holds one idea. It is a frame with slots; what goes in a slot is another element's business. Variants: plain, panel, media, stat, row, link, notch, stack, ghost, portrait (`.card--study` kept as an alias), and the `.card--square` modifier. Layouts: `.card-grid` and `.card-grid--tiled`. Full spec: `docs/components/card.html`. House rules that matter most: never put `cqi` on `.card` itself (a container's own `cqi` resolves against its parent), a card needs a width from its parent, and do not pad `.card` itself.

### Button

A pill or circle you press. One primary per screen or card. Secondary is an outline that fills on hover; primary is filled with the accent; tone borrows the colours of the tone it sits in (`data-tone="bad"` is a danger button). Sizes `sm` / md / `lg` all keep a 44px hit area; an icon-only circle is chrome (44, or 36 / 56) at every text size, and the radius is half the nominal height, so a label that must wrap keeps the pill's end curve. Toggles use `aria-pressed` and follow the selection states (§2): off rises on hover without filling, on is filled *and* the frame doubles; busy uses `aria-busy` (a spinner, or a pulse under reduced motion); unavailable uses `aria-disabled` plus a reason in `aria-describedby`. Full spec: `docs/components/button.html`. `src/components/button.css` is the **reference component**: every other element copies its structure.

---

## 4. Wireframe kit

`src/wire/wire.css` holds placeholders for things that don't exist yet. Each `.wf-*` class is deleted the day its real element ships, and nothing in `src/components/` may depend on it.

| Class | Stands in for | Replaced by |
| --- | --- | --- |
| `.wf-media` (+ `.wf-tag`) | an image or illustration: a box with an X | real media |
| `.wf-shape` | a drawing | the app's SVG |
| `.wf-meter` | progress | the Meter element |
| `.wf-pill` | a status tag | the Tag element |

How to read a wireframe: a box with an X is an image; flat grey is a tone slot; black is the inverted tone; dashed is empty or unavailable; hatch is disabled.

---

## 5. The gate

`npm run lint` is the owner's `check.mjs`, rebuilt on a real CSS tokenizer and extended. It fails on what a machine can catch; the rest is the squint test in §1.

The tooling audit of the original checker fed it 146 deliberate violations: it caught 44%, missed every accessibility-hygiene rule, and wrongly flagged legitimate CSS (a nested radius formula, a hard-stop gradient for a meter). The causes were regexes that needed a trailing `;`, ignored named colours and anything inside `url()`, and only looked at some file kinds. `tests/lint.selftest.mjs` replays those same cases (`tests/lint-cases.json`) on every run: every violation is flagged (82%; the rest are colour-contrast cases, which `npm run test:contrast` judges in a real browser) and every legitimate snippet passes.

| # | Check | Fails on |
| --- | --- | --- |
| 1 | undefined tokens | `var(--x)` with no definition and no fallback; a component-private `--_x` read outside its file |
| 2 | colour literals | hex, `rgb()`, `hsl()`, `oklch()`, `color()`, `light-dark()`, **named colours**, and colours inside a `data:` URI (a black mask is fine), outside `src/tokens/`; also in custom properties |
| 3 | the AI tells | gradients that blend (a hard-stop gradient for a meter or hatch is fine), `backdrop-filter`, `blur()`, `text-shadow`, `drop-shadow()`, any shadow with blur (also through a token), a default font as the first family of any `--font-*`, a `font-family` or `font` that isn't a token |
| 4 | line and shape | a literal border, outline, `text-decoration-thickness`, `stroke-width` or shadow spread; a line-weight token that isn't `--bw`, `--bw-thin`, `--bw-heavy` or `--ring`; any radius that isn't a role (`--radius-card`, `-tile`, `-ctl`, `-pill`), including `50%`, per-corner radii and `clip-path: inset(… round …)`; the `--radius-1/2/3` primitives read directly |
| 5 | the gate order | motion before gate 4 opens (open now; `checkCss({ gates: { motion: false } })` closes it, and the self-test proves it) |
| 6 | layering | a component using `.wf-*`; anything using a `--grey-*` primitive |
| 7 | markup | a class used in a docs page or in JS (`class=`, `classList.add`, `className =`) that no CSS defines; `data-tone` with a value that isn't a tone |
| 8 | doc drift | `CLAUDE.md`, `STYLE.md`, `README.md` naming a custom property or class that does not exist; `STYLE.md` and `package.json` disagreeing on the version |
| 9 | accessibility hygiene | `outline: none` with no replacement in the same rule, `transition: all`, px font sizes, an `html` font-size other than 100%, a viewport that blocks zoom, unlabeled icon buttons, icons without `aria-hidden`, positive `tabindex`, `role=button` on a div, `<img>` without `alt`, text dimmed with `opacity`, a control drawn under 44px. (`overflow: hidden` is not linted: whether it clips a ring or text is measured by `npm run test:a11y`.) |
| 10 | hygiene | `:hover` not gated by `(hover: hover)`, physical properties (RTL), fixed px sizes, px media queries, `!important`, `prefers-contrast` blocks that drifted apart, `import`/`export` in a script |
| 11 | copy | lorem ipsum, "John Doe", "seamless", "leverage" in a docs page (rule 5) |
| 12 | wrapping (`wrap`) | `overflow-wrap: anywhere` in `src/` outside the tokens: it makes min-content one letter, so flex and grid items shatter their words. A code token or URL may waive it on its line with `/* lint-allow wrap: why */`. Two self-test cases cover it |

Which of the seven rules have a gate behind them: **2 flat** and **6 colour is a swap** fully; **1 two line weights** and **3 rectangles hold, circles act** for the values the CSS can express; **5 say something real** in the docs; **4 uppercase is structure** and **7 no decoration** only as warnings (an uppercase style outside a label selector, an inset one-edge shadow). "The gate is clean" therefore does not mean "the sheet complies": the squint test is still the last word.

What lint cannot see, because it never renders, is covered by the browser tests: `npm run test:contrast` resolves every colour pair (text, frames, the focus ring, soft ink, the scrim) in every theme × contrast mode × palette × tone; `npm run test:a11y` runs axe, walks the keyboard, measures every focus ring against what it is drawn on, finds text cut off by a clipping frame at 320px and at 200% text with every disclosure open, checks target sizes and forced colours; `npm run test:components` drives each element with real keys and checks its `--lift` / `--fill` states. These three are the render gate the original did not have.

---

## 6. Status

This table is the owner's record for Card and Button. The other fifty elements are on the Status page of the docs, which `npm run status` generates: its *Automated checks* field from the gates (the spec, the lint and the accessibility gate), and its *Screenshots* field from `docs-src/project/visual-review.json`, which the person who reviews the screenshots keeps by hand. Passing checks alone never read as "done". When Card or Button moves, edit the row here.

| Element | 0 Brief | 1 Wireframe | 2 States | 3 Colour | 4 Motion | 5 Freeze |
| --- | --- | --- | --- | --- | --- | --- |
| Card | done | done | done | done | done | awaiting sign-off |
| Button | done | done | done | done | done | awaiting sign-off |

---

## 7. Known limits

- Tests run in Chromium only. Safari / WebKit, Firefox and screen readers (VoiceOver, TalkBack, NVDA) are **not** verified; the docs list the manual pass for a real iPhone.
- iOS Dynamic Type via `-apple-system-body` is included behind `@supports` but unverified on a device.
- The card notch is square only. The stretched link's 2px border band needs `overflow-clip-margin`, which Safari ignores. Text inside a link card can't be selected by dragging.
- `light-dark()` is Baseline Newly available (Widely in late 2026); a 2024-era browser is needed: container queries, `:has()`, `@property`, `color-mix()`, cascade layers, `light-dark()`.
- Contrast numbers come from 8-bit sRGB renderings and ignore display profiles.

---

## 8. Changelog

- **Unreleased** · Fifty elements, nine foundations pages, Start, Accessibility and Project pages, per-element builds, CI. Palettes are self-contained and higher contrast reaches islands; `SG.prefs` keeps an app's authored look and takes a storage key per app. Docs tables stack on phones; the Status page is generated. A visual pass at 390px with 100% and 200% text added the system rules: chrome caps, selection states, one-row bars measured with `SG.fit`, `overflow-wrap: break-word` with a lint rule against `anywhere`, and pills that keep their ends when a label wraps. The Status page now separates the automated checks from the screenshot review. The full list is in `docs/project/changelog.html`.
- **0.2.0** · 2026-09-30 · Re-founded on the Flashcards style sheet v0.1. Colour engine (dark, higher contrast, six palettes, status tones, bold), motion on, Button, accessibility gate, extended checker. Card: `study` renamed `portrait` (alias kept); hover rules gated for touch; long words no longer clip at large text.
- **0.1.0** · 2026-09-30 · The owner's sheet: foundations (type, space, line, shape, hit, motion). Wireframe colour layer with six tone slots. Card: ten variants, six states, two grids. Gates 0–2 closed for Cards.
