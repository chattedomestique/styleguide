# The PWA starter

A working app built only from the system's elements: three root screens (Today, Decks,
Settings) in Frame's root variant with the Tab bar, installable, working offline, and
updating only when the person presses Reload. The rules it follows are in
`../elements/pwa.md` and `../STYLE.md` §4; this file only says how to run it and copy it.

## Run it

A service worker needs a secure context, and `localhost` is one. From the repository root:

```sh
node design/tools/bundle.mjs     # builds dist/, stamps the manifest colours and the worker's version
node design/tools/serve.mjs      # http://localhost:8000/pwa/ (another port: serve.mjs 8080)
```

Opened from disk (`file://`) the pages render, but no worker registers, so nothing installs or
works offline, and the console shows one error per page: a browser won't preload the font across
`file://`. Served, the console is clean.

## Start an app from it

1. **Copy** `pwa/`, `dist/` and `fonts/` into one folder, side by side: the pages link
   `../dist/flashcards.min.css` and `../dist/flashcards.min.js` and preload `../fonts/…woff2`.
   From `dist/` the app needs only those two files; its `.html` pages are the docs (1.5 MB),
   so leave them out.
2. **Serve it** from that folder, because a worker needs `localhost` or HTTPS: run
   `python3 -m http.server 8000` (or any static server) in the folder that holds `pwa/`,
   `dist/` and `fonts/`, and open `http://localhost:8000/pwa/`. `serve.mjs` serves `design/`
   only.
3. **Name it.** In `manifest.webmanifest`, change `id`, `name`, `short_name` and `description`,
   and redraw the icons (below). Leave `theme_color` and `background_color`: they are the
   light `--canvas`, which the bundle stamps in `design/`. They hold the light canvas only,
   because a manifest has no dark colour yet (a `color_scheme_dark` member is proposed, not
   shipped), so a launch in dark mode starts on a light splash; the page's dark `theme-color`
   meta takes over once it loads.
4. **Replace `app.js`** with your app. It is the starter's own code: decks in `localStorage`, a
   New deck sheet, Export and Import. The platform is `pwa.js`, inside `dist/flashcards.js`
   (served as `flashcards.min.js`).
5. **Your accent:** in this repository, run `node design/tools/accent.mjs "#c2410c"` with your
   colour, and paste the block it prints at the end of the copy's `app.css`. The accent fills
   only the one "press this", so look for it on Make deck in the New deck sheet (Decks), on
   Turn on in the reminder card (Settings, until notifications are asked for) and in the "+"
   of "Make your first deck" while it is hovered or pressed (Today and Decks, with no decks).
   Nothing shows it at rest on Today.
6. **The shell:** add every file the app can't start without to `SHELL` in `sw.js`.
7. **Bump `VERSION` in `sw.js` by hand on every release** (any new string, such as the date):
   after the accent, after any change to a file in `SHELL`, and after copying a newer `dist/`.
   The new worker installs beside the old one and the update band offers Reload. In `design/`
   the bundle stamps `VERSION` with a hash of the shell files; a copy has no bundle.
8. **Every new page** gets the head these pages have: the viewport meta, the `color-scheme`
   meta (`light dark`), the two `theme-color` metas (light, then dark, each with its `media`;
   in `design/` the bundle rewrites both), the `flashcards-sw` meta, the manifest, the icons,
   the font preload, `flashcards.min.css`, `app.css` and the `touchstart` line. At the end of
   its `<body>` go the two scripts, `../dist/flashcards.min.js` and then `app.js`: the first
   registers the worker, so without it nothing installs or works offline.

**At the site root.** The pages sit one folder below `dist/` and `fonts/`. To serve the app at
the root of a site instead, move the files in `pwa/` up beside `dist/` and `fonts/`, and
change every `../dist/` and `../fonts/` to `dist/` and `fonts/`: in each page (the preload,
the CSS link and the script) and in `SHELL`. The manifest needs no change: its paths are
relative to it.

| File | What it is |
| --- | --- |
| `index.html`, `decks.html`, `settings.html` | The three root screens: one shell, the offline and update band at the top of each. |
| `offline.html` | What the worker serves for a page that isn't on the device when the network fails. |
| `app.js` | The starter's own code, to replace. |
| `sw.js` | The worker: shell cache first, the rest stale-while-revalidate, other origins untouched. |
| `manifest.webmanifest` | Name, scope, colours, icons, shortcuts, screenshots. |
| `app.css` | The starter's own CSS (`@layer app`): view transitions between the screens. |
| `icons/` | `icon.svg` (master), `icon-maskable.svg`, and the PNGs rendered from them. |

Reminders: the Settings card asks for notification permission and handles "no", but the
starter sends nothing. Daily reminders need Web Push and a server, which an app adds.

## Icons and screenshots

`icon.svg` is the master: the system's card on a 48 grid, ink on paper, 5:7, its bar, and
the hard shadow of a pressable card (at 48px the frame is 2px and the shadow 4px, as on
screen). `icon-maskable.svg` is the same mark on a 60 grid, so it sits inside the maskable
safe zone. Their colours are the light `--paper` and `--ink` (#ffffff and #141414), which gate
3 kept: the icon stays ink on paper in both schemes, so nothing needs redrawing.

The PNGs were rendered once with Playwright's Chromium and committed. Each SVG went into an
`<img>` at its exact size on a page of that size, at device scale 1, and was screenshot:

| PNG | From | Size |
| --- | --- | --- |
| `icon-192.png`, `icon-512.png` | `icon.svg` | 192, 512 |
| `icon-maskable-192.png`, `icon-maskable-512.png` | `icon-maskable.svg` | 192, 512 |
| `apple-touch-icon.png` | `icon.svg` | 180 |
| `today-96.png`, `decks-96.png` (shortcuts) | the `ic--today` and `ic--decks` paths from `css/icons.css`, ink on paper | 96 |

```js
// node, with NODE_PATH pointing at playwright
const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
await page.setContent(`<style>body{margin:0}img{display:block}</style>
  <img width="${px}" height="${px}" src="data:image/svg+xml,${encodeURIComponent(svg)}">`);
await page.screenshot({ path: out });
```

The screenshots are the Decks screen with three decks put in `localStorage` first, served by
`serve.mjs` with service workers blocked: `screenshot-narrow.png` at 390 by 844 and device
scale 2 (780 by 1688), `screenshot-wide.png` at 1280 by 800 and scale 1.

## Not verified

Checked in Chromium over `localhost` only. iOS (Add to Home Screen, the install sheet's steps,
standalone mode, notifications in an installed app), Safari and Firefox, and a real Chromium
install prompt (headless Chromium never sends `beforeinstallprompt`) need a device.
