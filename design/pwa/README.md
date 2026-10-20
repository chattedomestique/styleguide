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
works offline.

## Start an app from it

1. Copy `pwa/`, `dist/` and `fonts/` together, keeping them side by side: the pages link
   `../dist/flashcards.min.css`, `../dist/flashcards.min.js` and preload `../fonts/…woff2`.
2. In `manifest.webmanifest`, change `id`, `name`, `short_name` and `description`, and redraw
   the icons (below). Leave `theme_color` and `background_color`: the bundle writes them.
3. Replace `app.js` with your app. It is the starter's own code: decks in `localStorage`, a
   New deck sheet, Export and Import. The platform is `pwa.js`, inside `dist/flashcards.js` (served as `flashcards.min.js`).
4. Add every file the app can't start without to `SHELL` in `sw.js`, then run the bundle: it
   hashes those files into `VERSION`, so any change to them ships as a new worker. Without the
   bundle, change `VERSION` by hand on every release.
5. Every new page gets the head these pages have: the viewport meta, `theme-color`, the
   `flashcards-sw` meta, the manifest, the icons, the font preload and the `touchstart` line.

| File | What it is |
| --- | --- |
| `index.html`, `decks.html`, `settings.html` | The three root screens: one shell, the offline and update band at the top of each. |
| `offline.html` | What the worker serves for a page that isn't on the device when the network fails. |
| `app.js` | The starter's own code, to replace. |
| `sw.js` | The worker: shell cache first, the rest stale-while-revalidate, other origins untouched. |
| `manifest.webmanifest` | Name, scope, colours, icons, shortcuts, screenshots. |
| `icons/` | `icon.svg` (master), `icon-maskable.svg`, and the PNGs rendered from them. |

Reminders: the Settings card asks for notification permission and handles "no", but the
starter sends nothing. Daily reminders need Web Push and a server, which an app adds.

## Icons and screenshots

`icon.svg` is the master: the system's card on a 48 grid, ink on paper, 5:7, its bar, and
the hard shadow of a pressable card (at 48px the frame is 2px and the shadow 4px, as on
screen). `icon-maskable.svg` is the same mark on a 60 grid, so it sits inside the maskable
safe zone. Their colours are the `--paper` and `--ink` values of the wireframe palette:
redraw them when gate 3 brings colour.

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
