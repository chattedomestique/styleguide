# Style Guide

A reusable, accessible UI system for progressive web apps and mobile apps: minimal, brutalist, friendly, and clear about what to do next. Vanilla CSS plus a little JavaScript: **no framework, and no build step for the apps that use it**.

It is the owner's *Flashcards style sheet v0.1*, generalised: their type, space, line, shape, hit-target and focus tokens, their role names, the tone API, the `.card` element and their checker rules are the base. On top of that this repo adds real colour (dark mode, higher contrast, six palettes, all contrast-verified in a browser), an accessibility test gate, and more elements as example screens arrive.

> Open the living guide: `docs/index.html` (works straight from disk), or `npm run serve`. **Appearance** at the top right flips every page between light / dark, six palettes, square / soft corners, high contrast and reduced motion. The exact values and reasons are in [STYLE.md](STYLE.md); the working procedure is in [CLAUDE.md](CLAUDE.md).

## Use it in an app (2 minutes)

1. Copy these from `dist/` into your app: `styleguide.css` (or `styleguide.min.css`), `fonts/`, and optionally `styleguide.js` and `icons.css` (about 140 more icons than the five built in).
2. Put this in your `<head>`:

   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
   <meta name="color-scheme" content="light dark">
   <link rel="stylesheet" href="styleguide.css">
   <script src="styleguide.js" defer></script>
   ```
3. Write HTML with the classes and pick a look with attributes on `<html>`:

   ```html
   <html lang="en" data-palette="mint" data-corners="soft">
   <button class="btn" data-variant="primary">Add funds</button>
   ```

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

- **Accessible by construction.** Colour pairs are built from fixed lightness gaps (OKLCH), then *verified in a real browser* for every theme × contrast mode × palette × tone (3,500+ checks). Text is ≥ 7:1, frames ≥ 3:1, targets ≥ 44 px, and nothing relies on colour alone.
- **Flat and legible.** Two line weights, hard shadows only on things you can press, circles and pills for everything you act on, one typeface with a width axis. No gradients, blur or glass; the checker fails the build on them.
- **Tones you cannot get wrong.** `data-tone="3"` gives an element a fill, text, soft text, a pill and its text that always pass.
- **Reduced motion means gentler, not instant.** Travel drops out; colour changes stay; spinners pulse.
- **Growable.** Adding an element is a gated routine with a scaffold, a lint, an accessibility gate and interaction specs. See [CLAUDE.md](CLAUDE.md).

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
npm run test:components  keyboard, ARIA and --lift / --fill state specs
npm run test:a11y        axe + focus walk + target sizes + reflow + forced colours on every docs page
npm test                 all of it
npm run new:component -- name --order 45
```

## Status and honest limits

Version 0.2.0. Verified in **Chromium** only. **Not verified:** Safari / iOS (standalone safe areas, Dynamic Type), Firefox, real screen readers (VoiceOver, TalkBack, NVDA) and Android font scaling. Elements so far: Card and Button; more arrive through the gated pipeline described in [STYLE.md](STYLE.md) §6.

## Credits and licences

- Font: [Archivo](https://github.com/Omnibus-Type/Archivo) Variable (latin, latin-ext, vietnamese; via Fontsource builds), SIL Open Font License 1.1 (`src/fonts/OFL-Archivo.txt`).
- Icons: five drawn by the owner; the rest from [Lucide](https://lucide.dev), ISC licence (`src/icons/LICENSE-lucide.txt`), re-stroked to the same 2px square-cap line.
- Design references: third-party mockups analysed for ideas only; none are included in this repo.
- This repository does not yet declare a licence for its own code; add a `LICENSE` file before sharing it publicly.
