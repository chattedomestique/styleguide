# Style Guide

A reusable, accessible UI system for progressive web apps and mobile apps: the buttons, forms, cards, bars and screens of an app, written once for every app you build. Vanilla CSS plus a little JavaScript: **no framework, and no build step for the apps that use it**.

It is the owner's *Flashcards style sheet v0.1*, generalised: their type, space, line, shape, hit-target and focus tokens, their role names, the tone API, the `.card` element and their checker rules are the base. On top of that this repo adds real colour (dark mode, higher contrast, six palettes, all contrast-verified in a browser), an accessibility test gate, and more elements as example screens arrive.

> Open the living guide: `docs/index.html` (works straight from disk), or `npm run serve`. **Appearance** at the top right flips every page between light / dark, six palettes, square / soft corners, high contrast and reduced motion. The exact values and reasons are in [STYLE.md](STYLE.md); the working procedure is in [CLAUDE.md](CLAUDE.md).

## Use it in an app (2 minutes)

1. Copy these from `dist/` into your app: `styleguide.min.css`, `fonts/`, and optionally `styleguide.min.js` and `icons.css` (about 150 more icons than the five built in). That is everything: a little over 40 KB each of CSS and JavaScript, gzipped (`gzip -9c dist/styleguide.min.css | wc -c` measures it). To ship less, use `core.min.css` (about 7 KB gzipped: tokens, base, layout, utilities) plus only the files you need from `dist/elements/` and `dist/js/`; `dist/elements/manifest.json` says what each element builds on and which scripts it has.
2. Put this in your `<head>`:

   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
   <meta name="color-scheme" content="light dark">
   <link rel="stylesheet" href="styleguide.min.css">
   <script src="styleguide.min.js" defer></script>
   ```
3. Write HTML with the classes and pick a look with attributes on `<html>`:

   ```html
   <html lang="en" data-palette="mint" data-corners="soft">
   <button class="btn" data-variant="primary">Add funds</button>
   ```

The Install page of the docs has the whole setup, including the PWA parts.

| attribute | values | changes |
|---|---|---|
| `data-palette` | `default` · `mint` · `periwinkle` · `sand` · `cream` · `wire` | hue, canvas tint, accent, tone hues |
| `data-corners` | `square` (default) · `soft` | the three radius roles |
| `data-theme` | `light` · `dark` (absent = follow the device) | colours |
| `data-contrast` | `more` (absent = follow the device) | lightness gaps; text ≥ 7:1 everywhere |
| `data-motion` | `reduced` · `full` (absent = follow the device) | travel and durations |
| `data-tone` | `1`…`6` · `ink` · `ok` · `warn` · `bad` · `info` | a fill and its text, on that element only |

Any element can carry these to make a themed island. Components never know which is active.

## What makes it different

- **Accessible by construction.** Colour pairs are built from fixed lightness gaps (OKLCH), then *verified in a real browser* for every theme × contrast mode × palette × tone, and for palettes on islands (10,000+ checks). Text is ≥ 7:1, frames ≥ 3:1, targets ≥ 44 px, and nothing relies on colour alone.
- **Flat and legible.** Two line weights, hard shadows only on things you can press, circles and pills for everything you act on, one typeface with a width axis. No gradients, blur or glass; `npm run lint` fails on them.
- **Large text that still fits a phone.** Words grow with the reader's text size; the chrome around them (insets, icon-only controls, targets) stops at its 100% size, as iOS and Android do. A bar or a row of controls stays one row, or switches its whole layout, instead of wrapping raggedly.
- **Tones you cannot get wrong.** `data-tone="3"` gives an element a fill, text, soft text, a pill and its text that always pass.
- **Reduced motion means gentler, not instant.** Travel drops out; colour changes stay; spinners pulse.
- **Growable.** Adding an element is a gated routine with a scaffold, a lint, an accessibility gate and interaction specs. See [CLAUDE.md](CLAUDE.md).

## What is in it

Fifty-two elements, each with a docs page (live demo, every state, anatomy, API, keyboard and screen-reader behaviour, tokens) and an interaction spec:

- **Actions and forms:** Button, Field, Input, Select, Choice (checkbox, radio, cards, segmented), Switch, Slider, Stepper, Keypad
- **Selection and navigation:** Tabs, Chip, Segmented control, App bar, Dock, Breadcrumb, Pagination, Menu, Toolbar
- **Surfaces:** Card, Tag, Avatar, Divider, Accordion, Tile, List, Stat, Swatch
- **Overlays and feedback:** Dialog, Sheet, Popover, Tooltip, Alert, Toast, Progress, Spinner, Skeleton, Empty state, Marquee
- **Data:** Table, Bar chart, Sparkline, Donut chart, Legend, Calendar, Agenda, Timeline
- **Media and tools:** Media, Carousel, Filmstrip, Gallery, Player, Scrubber

Nine foundations pages (colour, tones, type, space, shape, interaction, motion, icons, layout), the Start pages (install, customize, upgrade, PWA), the Accessibility pages (checklist, testing, manual, patterns) and the Project pages (status, decisions, references, contributing, changelog, audit) are in the same site.

## Repo map

```
src/        source of truth: tokens, base, layout, components, wire, js, icons, fonts
dist/       GENERATED. What apps copy.
docs-src/   page fragments for the living guide
docs/       GENERATED site (opens from file://, GitHub Pages can serve it)
tests/      lint (the owner's gate, extended), contrast matrix, accessibility gate, component specs, screenshots
scripts/    build, serve, scaffold
```

## Commands

```
npm install              dev tooling only (axe-core, playwright-core); the guide has no dependencies
npm run build            generate dist/ and docs/
npm run serve            preview docs at http://127.0.0.1:4173
npm run lint             the gate: undefined tokens, colour literals, gradients / blur, line and radius roles, …
npm run test:contrast    every colour role pair, every theme / contrast / palette / tone
npm run test:components  keyboard, ARIA and --lift / --fill state specs (SG_JS=min runs them on the minified bundle)
npm run test:a11y        axe + focus walk + target sizes + reflow + forced colours on every docs page
node tests/design.mjs    design-integrity report: ovals, wrapped labels, broken words, ragged bars (not a gate)
npm run status           regenerate the Status page from the gates (about an hour; -- --quick for two appearances)
npm test                 all of it
npm run new:component -- name --order 45
```

## Status and honest limits

Version 0.2.0 plus the unreleased work listed in the [changelog](docs/project/changelog.html). Verified in **Chromium** only. **Not verified:** Safari / iOS (standalone safe areas, Dynamic Type), Firefox, real screen readers (VoiceOver, TalkBack, NVDA) and Android font scaling; the Manual page of the docs has the passes to run on real devices.

Each element has automated checks: its interaction spec, the lint, and the accessibility gate in five appearances (light, dark + mint + soft, wire, higher contrast + periwinkle + dark, forced colours). They prove what they measure (keys, states, names, contrast, target sizes, and no text cut off or sideways scrolling at 320px and at 200% text) and nothing about how an element looks. Whether it looks right, at 390px with 100% and with 200% text, is reviewed by people from screenshots. The Status page of the docs shows both for every element: the automated result from the last run, and the screenshot review, which is kept by hand in `docs-src/project/visual-review.json`. Gate 5 (sign-off) is the owner's. What was wrong with the original sheet, and what was done about each finding, is in [AUDIT.md](AUDIT.md); the evidence and the notes behind the design are in [references/](references/). Open decisions the owner can reverse are on the Decisions page.

## Credits and licences

- Font: [Archivo](https://github.com/Omnibus-Type/Archivo) Variable (latin, latin-ext, vietnamese; via Fontsource builds), SIL Open Font License 1.1 (`src/fonts/OFL-Archivo.txt`).
- Icons: five drawn by the owner; the rest from [Lucide](https://lucide.dev), ISC licence (`src/icons/LICENSE-lucide.txt`), re-stroked to the same 2px square-cap line.
- Design references: third-party mockups analysed for ideas only; none are included in this repo.
- This repository does not yet declare a licence for its own code; add a `LICENSE` file before sharing it publicly.
