# design/

The Flashcards design system, for installed mobile PWAs and Mac-first apps, built one
element at a time.

No build step, no dependencies, no framework. Open `index.html` and it works. Which skills we
load, and where we go against them: `STYLE.md` §6 "Skills we build with" and §7.

```
open design/index.html           the hub: rules, tokens, every element and its status
open design/elements/card.html   one page per element: specimens, states, markup
open design/screens.html         the test bed: the system on a phone and a Mac
design/STYLE.md                  the rules, foundations and platforms, in words
design/elements/README.md        how an element is built, and every element's brief
node design/tools/check.mjs      the gate (see below)
node design/tools/bundle.mjs     the CSS and JS (+ min files) and two self-contained pages → dist/
node design/tools/serve.mjs      the PWA starter at http://localhost:8000/pwa/
```

```
design/
  index.html            the hub: rules, tokens, the element index
  screens.html          the test bed: real screens, missing elements marked
  STYLE.md              the spec: rules, foundations, platforms
  README.md             you are here
  elements/
    README.md           the contract for building an element, and every brief
    card.html card.md   one page and one spec per element
    _template.*         start a new element from these
  css/
    flashcards.css      entry: layer order + imports (apps link the dist/ copy)
    fonts.css           Archivo, variable on weight and width
    tokens/
      foundation.css    type, space, line, shape, hit, motion
      color.css         the grey ramp, the roles as light-dark() pairs, more contrast
    base.css            reset, element defaults, .t-* styles, [data-tone]
    icons.css           26 masked glyphs
    components/
      card.css …        one file per element
    wire.css            wireframe placeholders, .wf-*  (disposable)
    screens.css         the test bed's app CSS, in @layer app (not shipped)
    sheet.css           the pages' own chrome, .sg-*   (not shipped)
  js/
    components/         element script, where HTML can't do it → dist/flashcards.js
    sheet.js            the pages' own script: markup, contrast (not shipped)
  fonts/                Archivo woff2 + OFL licence
  pwa/                  the starter app; copy it with dist/ and fonts/ (pwa/README.md)
  tools/
    check.mjs           the gate
    accent.mjs          an app's accent: checked in both schemes, the CSS to paste
    bundle.mjs          the build: dist/ (+ .min files), the starter's colours and worker version, the budget
    serve.mjs           static server for design/ on localhost
  dist/                 bundle output, what an app links (generated)
```

## The pipeline

One element at a time. A gate closes before the next opens, and each gate names what it is
**not** allowed to touch yet. That rule is the whole point: wireframe can't hide behind
colour, and colour can't quietly rearrange the layout.

| Gate | Decides | Not yet | Exit check |
| --- | --- | --- | --- |
| **0 Brief** | The job, the slots, the variants, real copy from the product. | | Slots and variants are listed in `STYLE.md`. |
| **1 Wireframe** | Structure, type, space, line, shape. Greys only. | Colour, motion. | Squint test. `check.mjs` clean. Holds from 320 to 1440px. |
| **2 States** | Rest, hover, focus, pressed, selected, disabled. Still grey. | Colour, motion. | Every state legible in grey. Keyboard-only pass. |
| **3 Colour** | Tones, accent, dark. | New structure. | Contrast passes (the sheet prints it live). Nothing in `components/` changes. |
| **4 Motion** | Transitions, the flip, reduced motion. | | Reduced-motion pass. Only transform and opacity move. |
| **5 Freeze** | Nothing new. | Everything. | The pages and the specs agree. Version bumped. |

### Status

Gates 0–2 go one element at a time, in waves of about five. Gates 3–5 then pass over every
element together, because colour, motion and the freeze are decisions about the whole system.

| Wave | Elements | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | **Card** | ✓ | ✓ | ✓ | ✓ | | |
| 1 | Button, Field, Tag and Badge, Meter and Spinner, Icons | ✓ | ✓ | ✓ | ✓ | | |
| 2 | Checkbox, Radio, Switch, Segmented control, Select, Stepper, Form | ✓ | ✓ | ✓ | ✓ | | |
| 3 | Frame, Top bar, Tab bar, Sidebar, List, Tabs, Disclosure, Menu | ✓ | ✓ | ✓ | ✓ | | |
| 4 | Dialog, Sheet, Toast, Banner, Empty, loading and error | ✓ | ✓ | ✓ | ✓ | | |
| 5 | PWA platform | ✓ | ✓ | ✓ | ✓ | | |
| 6 | Colour and dark mode, for everything | | | | ✓ | | |
| 7 | Motion, for everything | | | | | | |
| 8 | Freeze: v1.0 | | | | | | |

Gate 0 is ticked because every brief is written (`elements/README.md`). Order is deliberate:
Button goes first because the card's `.card__ctl` and `.card__action` are slots waiting for
it, and Tag and Meter replace placeholders the card uses today.

### Adding an element

The full contract is `elements/README.md`. In short:

1. **Brief.** The job in one sentence, the parts, the variants, the copy from the product.
   It lives in `elements/README.md` until the element's spec, `elements/<name>.md`, starts.
2. **Wireframe.** `css/components/<name>.css`, imported in `flashcards.css` under
   `layer(components)`. Greys only. Read roles, never a hex. A placeholder the element
   needs goes in `wire.css` as `.wf-*`.
3. **Page.** `elements/<name>.html`, from `_template.html`, with every variant. Mark each
   specimen root with `data-sg-code` and the page prints its markup. Link it from the
   element index in `index.html`.
4. **States.** Rest, hover, focus, pressed, selected, disabled. Use `--lift` and `--fill`
   if the element is pressable, so it matches the card.
5. **In context.** Swap the element's `.wf-slot` placeholders in `screens.html` for the real
   thing. Add what it learned to that page's findings, and delete what it fixed.
6. **Check.** `node design/tools/check.mjs`. Then look at both pages at 320px and 1440px, at
   200% text (`screens.html` has a switch), and with the keyboard.
7. Tick the gate in the status table above, and in `STYLE.md` §3.

## Colour (gate 3, done in wave 6)

`tokens/color.css` holds the palette: a neutral grey ramp, black to white, and every role as a
`light-dark()` pair, with more contrast and a forced scheme (`data-scheme` on `:root`). Nothing
in `components/` reads a colour value; if one ever has to, that is the bug.

- **An app's accent:** `node design/tools/accent.mjs "#c2410c"` checks it against paper and
  canvas in both schemes, picks its text colour, proposes a dark partner if needed, and prints
  the `@layer app` block to paste. It refuses an accent that can't pass.
- **Changing the greys:** edit the primitives in `color.css`, then run `check.mjs` (contrast in
  both schemes) and look at `index.html`'s two palettes, whose ratios are computed live.

## The gate: `tools/check.mjs`

Zero dependencies. Exits 1 on any of these, with the file and line:

1. a `var(--x)` with no definition and no fallback;
2. a colour literal (hex, `rgb()`, `hsl()`, `oklch()` and friends) outside `tokens/color*.css`;
3. the mechanical AI tells in the CSS: gradients, `backdrop-filter`, `blur()`, blurred
   shadows, `text-shadow`, and a default typeface (Inter, Roboto, Space Grotesk, system-ui...)
   as the first family;
4. a literal border width, or a radius outside the three roles (`--radius-card`, `-tile`,
   `-ctl`, plus `-pill`);
5. `transition`, `animation` or `@keyframes` in a component while gate 4 is closed
   (`GATES.motion` at the top of the file);
6. a component that reaches for `.wf-*`, or anything outside the colour file that reads a
   `--grey-N` primitive;
7. a token or class named in `STYLE.md`, this file or an element's spec that doesn't exist in
   the CSS;
8. a class used in any page (`index.html`, `screens.html`, `elements/*.html`) that no CSS
   defines, which is how typos get caught, and an id used on two pages, which would clash
   once the bundle joins them;
9. contrast: ink, soft ink, the accent and each tone's text against WCAG AA, in light, dark and
   both with more contrast, resolved from the colour file (`light-dark()`, hex, `rgb()` and
   `oklch()` are understood); the scrim is checked not to follow ink.

Checks 2 to 5 cover `sheet.css` and `screens.css` too: the pages that teach the rules keep
them. `wire.css`
may use gradients (the hatch, the X) but not colour literals.

## Fonts

Archivo, by the Archivo Project Authors, SIL Open Font License 1.1 (`fonts/OFL.txt`).
Self-hosted, variable on weight (100–900) and width (62–125%), latin subset: 90 KB, no
third-party request. To add a script, add its subset as a second `@font-face` in `fonts.css`.
