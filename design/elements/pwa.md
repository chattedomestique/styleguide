# PWA platform

Element 27 · gates 0–4 done (wireframe, states, colour, motion) · page: `elements/pwa.html` · working starter:
`pwa/` (`../pwa/index.html` from here)

The rules, tokens and platforms every element follows are in `../STYLE.md`, whose §4 holds the
short form of this file. This file is the platform's own spec: what makes the elements an
installed app.

## Brief

*What makes the elements an installed app: install, offline, updates, permissions, sharing and the
keyboard.*

- **Where it lives:** the rules in `STYLE.md` §4; the patterns on `elements/pwa.html`; the page
  side in `js/components/pwa.js` (shipped in `dist/flashcards.min.js`) and `css/components/pwa.css`;
  a working starter app in `design/pwa/`, which is the proof: installable and working offline over
  `localhost`. `screens.html` stays a test bed of drawn devices.
- **Patterns:** permission pre-prompt; badging; share; keyboard; storage (persist, export and
  import, quota); standalone behaviour; orientation and tablets; the performance budget. Also the
  install route, the update flow, offline, the manifest and icons, and what the service worker
  caches.
- **Built from existing elements only:** Card, Button, List, Banner, Sheet, Switch, Field, Toast,
  Dialog, Meter, Frame, Top bar and Tab bar. No new classes.

## House rules

- **Never on load.** No install pop-up, no permission prompt, no surprise reload. Each thing is
  asked for after the person did something that needs it, from a control they can see.
- **Feature, not browser.** Everything is detected by what the browser has (`navigator.share`,
  `beforeinstallprompt`, `navigator.standalone === false`, `navigator.setAppBadge`), never by its
  user agent.
- **Hidden until it works.** What `pwa.js` drives ships `hidden` and appears once it can work. So
  without script, from disk, or where the browser can't, nothing is on screen that wouldn't work.
- **The app says it too.** A badge, a reminder, a share sheet or an install prompt is never the only
  place something is said or done: the count is on the Decks tab, the reminder is a setting, the
  link can be copied, and the app works in a tab.
- **The worker serves only its own.** Same-origin GET requests only; another origin's requests are
  never touched.

## Anatomy

### The starter, `design/pwa/`

Copy it with `dist/` and `fonts/` to start an app. It installs and works offline only when served:
`node design/tools/serve.mjs`, then `http://localhost:8000/pwa/` (localhost is a secure context).
Opened from disk it shows the screens with no worker.

| File | What it is |
| --- | --- |
| `index.html` | Today, the root screen: Frame with the Tab bar, one Banner waiting at the top of the scroll region (`data-pwa="offline update"`), the empty state. |
| `decks.html`, `settings.html` | Decks (the empty state and the New deck Sheet); Settings (the reminder card, This app with Install and Share, Your decks with Export, Import and the quota, the iOS install Sheet). |
| `manifest.webmanifest` | What the home screen knows (below). |
| `icons/` | One master SVG and a maskable SVG; the PNGs rendered once from them. |
| `sw.js` | The service worker (below). |
| `offline.html` | What a page never opened shows with no connection. |
| `app.js` | The starter's own code, the part an app replaces: a list of decks in `localStorage`, export and import. |
| `app.css` | The starter's own CSS, in `@layer app`, roles and tokens only (like `css/screens.css`): the moves between screens (below). |

Each page links `../dist/flashcards.min.css`, then `app.css`, `../dist/flashcards.min.js`, the
manifest, the icons, and preloads the font with `crossorigin`. `<meta name="color-scheme" content="light dark">` lets
the browser paint a dark ground in dark before the CSS arrives, instead of a white flash. Its
viewport meta is
`width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`, and
`<meta name="flashcards-sw" content="sw.js">` names the worker.

**Moving between screens.** Today, Decks and Settings are separate pages, so `app.css` opts them
into cross-document view transitions (`@view-transition { navigation: auto }`), which a page needs
on both sides of the link:

- the screen crossfades, old to new, within `--dur-hover` (`::view-transition-group(*)`, eased
  with `--ease-out`);
- the bars stay put: `view-transition-name: tabbar` on the Tab bar and `sidebar` on the Sidebar,
  so each is its own layer in the same place on both pages, and the new one shows at once (its
  old image hidden, its new one not animated): the current place changes as it does on a tap.
  Two names, because two drawn elements may not share one; Frame's wide variant draws only one of
  the two bars at a time, and an undrawn element is never captured, so there is never a clash;
- under `prefers-reduced-motion: reduce` it's off (`navigation: none`): the new page simply
  replaces the old;
- progressive: without cross-document view transitions (Chromium 126, Safari 18.2; not Firefox
  yet) a link loads the next page as it always did. The style sheet's pages don't link `app.css`,
  so they never animate between pages.

Checked in Chromium 141 over `localhost`: Today to Decks at 390px (the Tab bar) and 1280px (the
Sidebar), the transition paused and stepped to 0, 50 and 100% with screenshots: the bar already
showing Decks as current at 0, the content crossfading, one named bar captured each time, no
sideways scroll; with reduced motion, no view transition at all (`pagereveal` had none).

### The manifest

| Field | Value | What it's for |
| --- | --- | --- |
| `id` | `"flashcards"` | Which app this is, so moving `start_url` later doesn't make a second one. A plain name: Chromium resolves `id` against the origin, so `"./"` would make it the bare origin. |
| `name`, `short_name` | Flashcards | The install sheet and the splash use the name; the home screen puts the short name under the icon, so 12 letters at most. |
| `description` | "Short daily sessions with your own decks of cards. Works offline." | A line under the name in Chromium's install sheet. |
| `start_url`, `scope` | `"./"` | Where the home screen opens it (the root screen, never a deep page), and how far it reaches: a link inside stays in the app, one outside opens in the browser. |
| `lang`, `dir` | `"en"`, `"auto"` | The language and direction of the words above. |
| `display` | `"standalone"` | Its own window, with none of the browser's bars. So every screen past the root needs a back link. |
| `orientation` | `"any"` | Never locked. |
| `theme_color`, `background_color` | `--canvas`, light | The status or title bar, and the splash. `tools/bundle.mjs` writes the hex in from the colour file, so it lives in one place. A manifest has no dark colour, so it keeps the light canvas (Known limits). The pages carry two `theme-color` metas instead, light and then dark, each with its `prefers-color-scheme` media, and the bundle writes both from `--canvas`. |
| `icons` | an SVG, and 192 and 512 PNGs; each `any` and `maskable` | The home screen, the app switcher, the splash. |
| `shortcuts` | Today, Decks | A long press on the icon goes straight there. |
| `screenshots` | one narrow, one wide | Chromium's richer install sheet. |

**Icons.** The mark is the system's own card: an ink frame on paper, 5:7, with the hard shadow of
something you can press, drawn on a 48 grid with crisp edges (`icons/icon.svg`), monochrome until an
app sets its accent, and ink on paper in both schemes: the home screen isn't the page.
`icons/icon-maskable.svg` is the same mark on a 60 grid, so it sits at 80% and
inside the safe zone (the centre circle, 40% of the size in radius), with paper to every edge for
any mask. The PNGs (192 and 512, any and maskable; 180 for `apple-touch-icon`, which iOS reads
instead of the manifest; the 96px shortcut icons, which are the system's today and decks glyphs)
are rendered once and committed: in headless Chromium (Playwright), each SVG is drawn as an image at
the PNG's size, at a device scale of 1, and screenshotted. Render them again only when an SVG
changes.

### The service worker, `sw.js`

`pwa.js` registers the worker the meta names, over http(s) only, and only then: a page without the
meta, like the style sheet's, never gets one.

| Request | How | Why |
| --- | --- | --- |
| The shell: the starter's pages, `app.css`, `app.js`, the manifest, the icons, `flashcards.min.css`, `flashcards.min.js`, the font | Precached when the worker installs, in a cache named for its scope and version; cache first. | It opens at once, online or not. |
| Anything else on the same origin | Stale while revalidate: the cached copy now, a fresh one saved for next time. | Fast, and never more than a visit out of date. |
| A page never cached, offline | `offline.html`, served at the address asked for, with a `<base>` at the scope. | Never the browser's error page. |
| Another origin, or anything but GET | Not touched: no `respondWith`. | The worker never stands between the app and someone else's server. |

`VERSION` is a hash of the shell files, stamped by `tools/bundle.mjs`, so changing any of them makes
a new worker and changing none doesn't. Old caches for the same scope are deleted when a new worker
takes over.

### The hooks, `pwa.js`

| Hook | On | What `pwa.js` does |
| --- | --- | --- |
| `<meta name="flashcards-sw" content="sw.js">` | the page | Registers that worker. No meta, no worker. |
| `data-pwa="offline"` | an empty Banner | Fills it while the browser is offline, empties it after. |
| `data-pwa="update"` | an empty Banner | Fills it with "A new version is ready." and a Reload Button (`data-pwa="reload"`) when a new worker waits. One band may take both (`data-pwa="offline update"`): offline wins. |
| `data-pwa="install"` | a Button, and the row it sits in | Shows them when installing is possible: replays Chromium's stored `beforeinstallprompt`, or on iOS lets the Button open the Sheet its `commandfor` names. Never in `display-mode: standalone`. |
| `data-share` | a Button (and its row) | `navigator.share` with `data-share-title` and `data-share-url`; else copies the link and raises a Toast, "Link copied." |
| `data-pwa="notify-ask"` | a Card | Shows while `Notification.permission` is "default". Its `data-pwa="notify"` Button asks. |
| `data-pwa="notify-denied"` | words | Shows while it is "denied": how to allow it in the browser. |
| `data-pwa="quota"` | a line | Gets "Using 2.1 MB of 1.2 GB on this device." from `navigator.storage.estimate()`, and shows. |
| `Flashcards.badge(n)` | script | `navigator.setAppBadge(n)`, or clears it at 0. Resolves `true` if it took. |
| `Flashcards.persist()` | script | `navigator.storage.persist()`. Resolves `true` if the data now outlives cleanup. |
| `Flashcards.download(name, data)` | script | Saves `data` as a JSON file called `name`. |
| `Flashcards.readJSON(file)` | script | Reads a chosen file; rejects if it isn't JSON. |

`css/components/pwa.css` restates `display: none` for `[data-pwa][hidden]` and `[data-share][hidden]`,
because a Button, a Card or a list row sets its own `display`, which beats the attribute; and hides
Install under `@media (display-mode: standalone)` before any script runs.

## Variants

The patterns, each built from existing elements and shown in `elements/pwa.html` under Patterns
(2.1–2.11), with a live specimen where the browser allows and a still picture of each state.

| Pattern | Built from | What it does | Notes |
| --- | --- | --- | --- |
| Install | `.list--inset` row and a `.btn` with `ic--install`, both `data-pwa="install"`; `.sheet` | In Settings, This app: "Install Flashcards. It opens from your home screen, full screen." | Chromium: the browser's own install sheet. iOS: the Sheet's three steps (Tap Share, in Safari's toolbar or its ••• menu; Choose Add to Home Screen; Tap Add). Installed or unable: no row. **Device:** the iOS steps and wording. |
| Update | `.banner` (`data-pwa="update"`), `ic--refresh`, Reload | "A new version is ready." when a new worker waits. | Reload posts `SKIP_WAITING`; the page reloads once on `controllerchange`. Left alone it waits; the next cold start runs the new version. Never reloads by itself. |
| Offline | `.banner` (`data-pwa="offline"`), `ic--offline`; `offline.html` | "You're offline. Changes are saved on this device." while offline. | Offline isn't an error: the screen shows what's on the device. `offline.html` is a plain `.card`: "This page isn't on this device", a link to the decks, and Try again (`data-pwa="reload"`). |
| Permission pre-prompt | `.card` (`data-pwa="notify-ask"`) with Not now and Turn on; `.switch` in Settings | "Remind you tomorrow? A reminder at 8pm on days you haven't studied…" after a finished session. | Turn on calls `Notification.requestPermission()`. Not now hides it for the visit; the Daily reminder switch is the way back. Denied: the setting says where to allow it. **Device:** on iOS, web push needs the app on the Home Screen (iOS 16.4 or later), so in a Safari tab the card never shows. |
| Badging | `Flashcards.badge(n)`; Tab bar's `.badge` | The cards due today on the icon, and always on the Decks tab ("Decks, 7 due"). | Set when the count changes (a session ends, a day starts); 0 clears it. Only an installed app has an icon to badge. **Device:** iOS badges only with notification permission. |
| Share | `.btn--icon` with `ic--share` and `data-share`, in Top bar's actions | Share a deck: the system share sheet with its name and link. | No `navigator.share` (most desktop browsers): copy the link and Toast's done, "Link copied." A failed copy says "Couldn't copy the link." |
| Keyboard | Frame (`data-keyboard`), Field, Tab bar | The Tab bar hides while the keyboard is up; the field scrolls clear. | Below, and in `frame.md`. **Device:** all of it. |
| Storage | `.card` "Your decks" with Export, Import and `data-pwa="quota"`; Toast; Dialog's acknowledge | Keep the decks, move them as a file, say how much room they take. | `persist()` after real use (the first deck saved, an import), never on first launch. Import: "Added 2 decks from the file.", or "Every deck in that file is already here.", or the Dialog "Can't import that file". |
| Standalone | Top bar's `.topbar__back`; `.list__row` with `ic--arrow` | No browser around the app. | Every screen past the root has a back link. A link that leaves the app opens in the browser (`target="_blank" rel="noopener"`), marked ↗ with "opens in your browser" in its name. A deep link inside `scope` opens that screen; the home screen always opens `start_url`. Install hides. **Device:** Android's back gesture follows history; iOS has none in standalone. |
| Orientation and tablets | Frame, `.frame--wide`, the safe-area tokens | Any way up, any size. | Never locked. On its side a phone's notch is at one end: the bars and the scroll region pad by `--safe-left` and `--safe-right`; content never reads them. From 45rem of frame the wide variant swaps the Tab bar for the Sidebar (the brief's "about 48rem"). **Device:** landscape safe areas. |
| Performance budget | `tools/bundle.mjs`; Meter on the page | What a served app downloads first, and the most it may. | Below. |

### The keyboard

- **The meta.** Every page's viewport meta adds `interactive-widget=resizes-content`. Android Chrome
  then shrinks the page (the layout viewport) above the keyboard instead of laying the keyboard
  over it, so the frame, which is `100dvh`, ends at the keyboard.
- **Hiding the Tab bar.** `js/components/frame.js` puts `data-keyboard` on the frame that holds the
  focused field while the keyboard is up, and `frame.css` hides the bar under it
  (`.frame[data-keyboard] > .frame__bottom.tabbar { display: none }`). A focused task's action row
  stays. "Up" means: a field that brings up the keyboard has focus (an `input` of type text,
  search, email, url, tel, password or number, a `textarea`, or `contenteditable`; not read-only,
  disabled or `inputmode="none"`), and the viewport is more than 150px shorter than the tallest it
  has been at this width. The height is `visualViewport.height × scale` (a pinch zoom isn't lost
  height), or `innerHeight` without `visualViewport`. Keying on width means a rotation never counts.
  It comes back on blur, or when the height does.
- **Why not `navigator.virtualKeyboard`.** Its geometry events fire only with `overlaysContent` set,
  which lays the keyboard over the page again, the opposite of `resizes-content`. It's Chromium
  only, and `resizes-content` already gives Chromium the right layout, so lost height covers both.
- **The focused field.** Frame's scroll padding (16px top, 48px bottom) stays as it is: where the
  keyboard shrinks the page, the scroll region ends at the keyboard and a field scrolled into view
  stops 48px short of it. Measured in the emulation below: a field below the fold, focused with the
  keyboard up, landed fully in view above it.
- **Without script** nothing changes and the bar stays.
- **Emulated, in Chromium (Playwright):** a frame filling a 390×844 window, a field focused, the
  window 300px shorter: the bar hides and `--chrome` drops from 212px to 134px; back when the
  height returns, on blur, or when focus moves to a checkbox, a read-only field or a date field.
  Moving between two fields keeps it hidden. 100px less (a browser's own bar) keeps it. Rotating
  to 844×390 with nothing focused, or with a field focused, keeps it; a 200px drop in landscape
  hides it. With `visualViewport` alone shrinking (iOS's way, stubbed) by 336px it hides, and by
  55px (an iPad's shortcut bar over a hardware keyboard) it stays. A 2× pinch zoom keeps it.
- **Needs a device:** all of it. iOS lays the keyboard over the page and pans the page to show the
  field, so there the frame doesn't shrink: the bar hides under the keyboard and the field's
  visibility is Safari's panning, not our scroll padding. Android's `resizes-content` and the
  150px threshold need checking on a real keyboard, and so do iPad split view and floating
  keyboards.

### The performance budget

`tools/bundle.mjs` writes `dist/flashcards.min.css` and `dist/flashcards.min.js` (comments and
spare whitespace out, nothing else changed), which a served app links, prints the gzipped sizes,
and fails the build over budget.

| What | Budget | Now |
| --- | --- | --- |
| CSS: `dist/flashcards.min.css`, gzipped (what a served app links) | 30 KB | about 15 KB |
| JS: `dist/flashcards.min.js`, gzipped | 10 KB | about 7 KB with `pwa.js` |
| The font, `fonts/archivo-latin-var.woff2` (already compressed) | 90 KB | 88.0 KB |
| First load on a mid-range phone, largest contentful paint | 2.5 s | a target, measured on a device |

A KB is 1024 bytes; measured 2026-10-20. The commented `dist/flashcards.js` is 9.9 KB gzipped,
which is why the budget is the min file's. The served app preloads the font with `crossorigin`;
the worker makes every later load instant.

## States

| Moment | Shows | Heard | Focus |
| --- | --- | --- | --- |
| Offline | The offline band first in the scroll region; what's on the device under it. | "You're offline. Changes are saved on this device.", politely, once. | Where it was. |
| Online again | The band empties. | Nothing. | Where it was. |
| Update waiting | The update band, with Reload. | "A new version is ready.", politely, once. | Where it was; Reload is the first stop in the content. |
| Reloaded | The same screen on the new version, no band. | The page, as after any reload. | At the top. |
| Installable | The Install row in Settings, nowhere else. | Nothing until it's reached. | Where it was. |
| Installing | Chromium's install sheet; on iOS, the Sheet. | The browser's sheet, or the Sheet's title. | In it; back on Install after. If it installed, the row goes and focus moves to the heading above it, never to the page. |
| Not asked yet | After a session, the reminder card. | Nothing: it's there when you look. | Where it was; its buttons come next. |
| Asked | The browser's prompt; then the card goes, and if the answer was no, the setting says how to allow it. | The browser's prompt. | Back near where the card was. |
| Link copied | Toast's done, "Link copied.", 6 s. | "Link copied.", politely. | On Share. |
| Keyboard up, down | The Tab bar goes; it comes back. | Nothing: the bar is out of the way, not announced. | In the field. |
| Imported | A Toast: "Added 2 decks from the file." | The Toast, politely. | On Import. |

At 200% text each pattern wraps and grows taller, never wider. In forced colours the bands' rules,
the cards' and toasts' frames, the switch's knob and every glyph stay, in system colours.

## Accessibility

- **Nothing moves focus by itself.** Bands, the quota line and the Install row appear without
  taking focus; the band speaks because it's a live region filled in place (Banner's raising), the
  row doesn't speak because it isn't news.
- **Prompts are the browser's,** and only after a visible control was pressed, so a screen reader
  user hears what the card said before the browser asks.
- **↗ is said in words too:** an outbound link carries "opens in your browser" in its name; the
  glyph is `aria-hidden`.
- **No hidden-only routes.** The badge's count is on the Decks tab; the reminder is a setting with
  a label; share falls back to a copy with a Toast; Not now hides the card and leaves focus near it.
- **The keyboard** hides the Tab bar without announcing it. Focus is in the field; Frame's scroll
  padding keeps it and its ring in view where the page shrinks.
- Every control is a 44px target: Install, Reload, Turn on, Not now, Share, Export, Import.

**Right to left.** The starter takes its direction from `dir` on `<html>` (the manifest says `dir:
"auto"`). The bars pad the side safe areas physically, so a landscape notch is cleared on whichever
side it is, and ↗ (`ic--arrow`) mirrors to ↖ with the rest of the directional glyphs
(`elements/icons.md`).

## Platforms

- **Installed PWA:** this whole file. What needs a device, and isn't verified here:
  - **iOS install:** Add to Home Screen through Safari's Share menu (newer Safari keeps Share under its ••• menu);
    the Sheet's wording; `navigator.standalone` as the test.
  - **Web push on iOS:** only for an app on the Home Screen, iOS 16.4 or later; the card must not
    show in a tab (`Notification` is missing there). The badge on iOS needs notification
    permission.
  - **The keyboard:** iOS overlays and pans; Android resizes with `resizes-content`; both
    detections and the 150px threshold need a real keyboard.
  - **Landscape safe areas,** the notch side and the home indicator; Android's back gesture in
    standalone.
  - **Install in Chromium on Android,** the richer sheet with screenshots, and app shortcuts.
  Verified in Chromium over `localhost` (the starter, by its builder) and from disk (this page):
  see Known limits.
- **Mac:** Safari (File, Add to Dock) and Chrome install it as a window with a Dock icon; the badge
  is the Dock's. The update, offline, share and storage patterns are the same. There is no
  on-screen keyboard. In a native shell, these are the system's (below).
- **SwiftUI:** a native app has no install, worker or manifest: the App Store installs and updates
  it, and its data is on the device already. Notifications: `UNUserNotificationCenter`
  `requestAuthorization`, asked from the same card after a session; the badge is
  `UNUserNotificationCenter.setBadgeCount(_:)`. Share: `ShareLink(item: url)`. Export and import:
  `fileExporter(isPresented:document:contentType:defaultFilename:onCompletion:)` and `fileImporter(isPresented:allowedContentTypes:onCompletion:)` with a JSON `FileDocument`. The keyboard: the system moves
  content (`scrollDismissesKeyboard(_:)`, the keyboard safe area), and `TabView` keeps its bar; iOS hides it
  under the keyboard. Offline: the Banner, from `NWPathMonitor`.

## Do and don't

- **Do** ask after something the person did: notifications after a session, persistence after real
  use, install only from Settings.
- **Do** keep every count, setting and action inside the app as well.
- **Do** keep the update band until the person reloads.
- **Don't** prompt on load, reload without asking, or lock the orientation.
- **Don't** show Install in the installed app, or badge what the app doesn't also show.
- **Don't** let the worker answer for another origin.

## Known limits

- **Gate 4, over `localhost` in Chromium 141:** `app.css` is in the precache; an edited `app.css`
  made a new worker (the bundle restamped `VERSION`), the update band showed, and Reload swapped it
  in with one reload, serving the new file. Cross-document view transitions are checked in
  Chromium only; Safari 18.2 has them and wasn't tried, Firefox doesn't yet.
- **Checked here, in Chromium only:** this page from disk at 320, 390 and 1440px, 100% and 200%
  text, with and without script; the joined style sheet; the keyboard emulation above. Not checked
  in Safari, Firefox, or with a screen reader.
- **On this page some specimens can't come alive:** Install needs a served app with a manifest (or
  Safari on an iPhone), Update needs a worker, and from disk the browser usually says no to
  notifications, so the denied words show. The starter is where they work.
- **A band shown by `hidden` alone wouldn't speak:** a live region is announced when it changes,
  not when it appears. That's why the bands ship empty and `pwa.js` fills them.
- **The splash in dark:** a manifest has one `background_color` and one `theme_color`, so an
  installed app's splash and, where the system reads the manifest, its title bar stay the light
  canvas in dark until manifests get a dark colour. The pages' two `theme-color` metas follow the
  system; a page forced with `data-scheme` doesn't change them unless the app does from script.
- **The keyboard after a rotation:** the first height seen at a new width is taken as the full
  height, so rotating with the keyboard already up leaves the bar until the keyboard goes down and
  comes back.
- **iOS and the keyboard:** the frame doesn't shrink there, so a field at the foot of a long form
  relies on Safari's own panning. Sizing the frame to `visualViewport.height` while the keyboard is
  up would fix it, and needs a device to prove.
