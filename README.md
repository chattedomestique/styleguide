# Style Guide

A reusable, accessible, brand-agnostic UI system for progressive web apps and mobile apps. Clean, friendly, and clear about what to do next. Vanilla CSS plus a little JavaScript: **no framework, and no build step for the apps that use it**.

> Open the living guide: `docs/index.html` (works straight from disk), or serve it with `npm run serve`. Use **Appearance** at the top right to flip every page between light/dark, six palettes, three surface styles, high contrast and reduced motion.

## Use it in an app (2 minutes)

1. Copy these from `dist/` into your app: `styleguide.css` (or `.min.css`), `fonts/`, and optionally `styleguide.js` and `icons.svg`.
2. Put this in your `<head>` (the [install page](docs/start/install.html) has the complete, tested version):

   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
   <meta name="color-scheme" content="light dark">
   <link rel="stylesheet" href="styleguide.css">
   <script src="styleguide.js" defer></script>
   ```
3. Write HTML with the component classes and pick a look with attributes on `<html>`:

   ```html
   <html lang="en" data-palette="mint" data-surface="soft">
   <button class="btn">Add funds</button>
   ```

| attribute | values | changes |
|---|---|---|
| `data-palette` | `ink` (default) · `periwinkle` · `mint` · `sand` · `cream` · `mono` | hue, canvas tint, accent |
| `data-surface` | `soft` (default) · `pop` · `hard` | radius, borders, shadows, label case |
| `data-theme` | `light` · `dark` (absent = follow the device) | colours |
| `data-contrast` | `more` (absent = follow the device) | lightness gaps, border weight |
| `data-motion` | `reduced` · `full` (absent = follow the device) | travel, scale, springs |

Any element can carry these to make a themed island. Components never know which is active.

## What makes it different

- **Accessible by construction.** Colour pairs are built from fixed lightness gaps (OKLCH), then *verified in a real browser* for every theme × contrast mode × palette (5,000+ checks). Text is ≥ 7:1, controls ≥ 3:1, targets ≥ 44 px, and nothing relies on colour alone.
- **Tonal cards you cannot get wrong.** `data-tone="amber"` gives a card a surface, ink, secondary ink, pill and border that always pass.
- **One component set, three personalities.** Soft (rounded, calm), pop (thick border, hard shadow) and hard (windowed panels, editorial) differ only in tokens.
- **Reduced motion means gentler, not instant.** Travel becomes a fade; nothing turns into jump cuts.
- **Growable.** Adding a component is a checklisted routine with a scaffold, a lint, an accessibility gate and keyboard specs. See [CLAUDE.md](CLAUDE.md).

## Repo map

```
src/        source of truth: tokens, base, layout, components, js, icons, fonts
dist/       GENERATED. What apps copy. Committed so it is linkable by tag.
docs-src/   page fragments for the living guide
docs/       GENERATED site (GitHub Pages can serve it; also opens from file://)
tests/      lint, contrast matrix, accessibility gate, component specs, screenshots
pwa-starter/  minimal installable app shell that uses the guide
references/ distilled design notes from the reference screens
scripts/    build, serve, scaffold
```

## Commands

```
npm install            dev tooling only (axe-core, playwright-core); the guide itself has no dependencies
npm run build          generate dist/ and docs/
npm run serve          preview docs at http://127.0.0.1:4173
npm run lint           static rules (no literal colours, no px font sizes, no outline:none, …)
npm run test:contrast  every colour role pair, every theme/contrast/palette
npm run test:components  keyboard + ARIA behaviour of each component
npm run test:a11y      axe + focus walk + target sizes + reflow + forced colours on every docs page
npm test               all of it
npm run new:component -- name --order 45
```

## Adding the next screens

When you have new example screens, hand them to an agent with the prompt in [docs/project/contributing.html](docs/project/contributing.html). It analyses the screens (see [references/](references/)), decides what is generic, adds tokens before components, and follows the checklist in [CLAUDE.md](CLAUDE.md).

## Status and honest limits

Version 0.1.0. Verified in **Chromium** only. **Not yet verified:** Safari/iOS (standalone safe areas, Dynamic Type), Firefox, real screen readers (VoiceOver, TalkBack, NVDA) and Android font scaling. The manual checklist is in the docs under *Accessibility → Manual testing*. See [AUDIT.md](AUDIT.md) for what was audited, what was found, and what could not be read.

## Credits and licences

- Font: [Manrope](https://github.com/sharanda/manrope) Variable, SIL Open Font License 1.1 (`src/fonts/OFL-Manrope.txt`).
- Icons: [Lucide](https://lucide.dev), ISC licence (`src/icons/LICENSE-lucide.txt`).
- Design references: third-party mockups analysed for ideas only; none are included in this repo (credits in `references/`).
- This repository does not yet declare a licence for its own code; add a `LICENSE` file before sharing it publicly.
