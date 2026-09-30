# Web-platform baseline for a brand-agnostic, no-build CSS design system for PWAs (snapshot 2026-09-30)

Scope: what a reusable, vanilla HTML/CSS/JS design system for solo-developer PWAs and mobile web apps can rely on in late 2026. Read-only analysis; nothing under `/home/user/styleguide` was touched. All scratch artefacts live under `/tmp/claude-0/-home-user-styleguide/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/scratchpad/tools/`.

## 0. How the facts were obtained (read this first)

| Source | What I used it for | Version / date | Confidence |
|---|---|---|---|
| `web-features` npm package (the dataset behind web.dev Baseline, MDN badges, caniuse "Baseline" chips) | Baseline status (`high` = Widely, `low` = Newly, `false` = Limited), `baseline_low_date`, `baseline_high_date`, min engine versions | 3.40.0, published 2026-09-30T15:19Z | Machine-read, authoritative |
| `@mdn/browser-compat-data` npm package (the data behind MDN compat tables) | Per-property/value/API engine versions, partial-implementation notes | 8.1.3, published 2026-09-24 | Machine-read, authoritative |
| Apple Safari release notes (`developer.apple.com/documentation/safari-release-notes/*.md`, fetched raw with curl and grepped) | What Safari 26.x / 27 actually shipped | Safari 27.0 "Released September 14, 2026"; 26.2 "Released December 12, 2025" | Primary source |
| WebKit Bugzilla REST API (`bugs.webkit.org/rest/bug/<id>`) | iOS standalone-PWA regressions, theme-color behaviour, `color_scheme_dark` | bugs 301994, 301756, 311727, 260508, 300965 | Primary source, read directly |
| web.dev / developer.chrome.com / MDN pages via WebFetch (a small summarising model) | Install criteria, richer install UI limits, `display_override`, manifest `id`, WCAG 2.2 text | fetched 2026-09-30 | Medium: summariser once contradicted the raw data (see section 9) |
| Direct HTTP HEAD requests with curl | MIME types and caching headers of raw.githubusercontent.com, jsDelivr, GitHub Pages | 2026-09-30 | Measured |
| Playwright + Chromium 141.0.7390.37 (local) | Service-worker offline/update test, `light-dark()`/`@layer`/`data-theme` architecture test, font fallback metrics | local | Measured, but Chromium 141 only |
| fontTools 4.66.1 on the actual fontsource woff2 files | Sizes, axes, OpenType features, metrics, glyph coverage | `@fontsource-variable/*@5.3.0` | Measured |

Legend used below: **Widely** = Baseline Widely available (`high`, 30+ months in all four core engines). **Newly** = Baseline Newly available (`low`, in all four engines, <30 months). **Limited** = not in all of Chrome, Edge, Firefox, Safari. "Widely on" gives the date a Newly feature flips. Engine shorthand: C = Chrome, E = Edge, F = Firefox, S = Safari (iOS Safari has the same number unless stated).

Engine snapshot (partly inferred): Safari/iOS 27.0 shipped 2026-09-14 (Apple notes, measured). From the `support` fields in `web-features` I infer stable Chrome/Edge ~150-151 and Firefox ~154-155 today (inference, not measured).

## 1. Executive decisions

1. **Target rule.** Use "Widely" features directly. Use "Newly" features directly only when failure degrades to a still-correct UI (animation missing, slightly different wrap). Treat "Limited" as enhancement behind `@supports` or a media query, never load-bearing.
2. **Hard floor for load-bearing CSS** is set by `light-dark()` (Safari 17.5, Chrome 123, Firefox 120): Chrome/Edge 123, Firefox 120, Safari/iOS 17.5. For a solo developer on current devices this is conservative; everything "Newly" beyond it is optional polish.
3. **Theming architecture (verified in Chromium 141):** `:root{color-scheme:light dark}` plus `light-dark()` on each semantic token; manual override with `:root[data-theme=light|dark]{color-scheme:light|dark}`. No duplicated dark token block. `@layer` order declared first; unlayered consumer CSS beats every layer (tested: an unlayered `.btn.app-override` beat `@layer sg.components{:where(.btn)}`).
4. **Font:** self-host **Manrope Variable, latin subset, 24,836 bytes**, OFL-1.1, with a metric-matched Arial fallback face. System mono stack by default (0 bytes). Section 7.
5. **Packaging:** the consumer copies `dist/styleguide.css` (plus `dist/fonts/`), or links a **jsDelivr** tag URL. **Do not link `raw.githubusercontent.com`**: it serves `content-type: text/plain` with `x-content-type-options: nosniff`, so browsers refuse it as a stylesheet (measured). Section 8.
6. **PWA:** Safari now needs zero install requirements; Chrome/Edge no longer need a service worker; Firefox desktop still has no manifest install. Offline SW pattern tested end to end (offline reload, query-string navigation, versioned update with user-prompted reload, old cache deletion). Section 6.
7. **iOS standalone is the riskiest surface.** WebKit bug 301994 (iOS 26.1 regression, marked fixed in 26.2, reproduced again on 26.5.2 and iOS 27 beta, status REOPENED 2026-08-05) makes `env(safe-area-inset-top)` return 0 and draws an opaque system strip. The shell must tolerate safe-area values of 0 and must not assume viewport height equals screen height.

## 2. Feature table

Columns: Baseline status now (low date, then Widely date if Newly) | min engines | verdict | fallback or note. All statuses are from `web-features` 3.40.0 unless marked *(BCD)* or *(inferred)*.

### 2a. Cascade, selectors, architecture

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| CSS custom properties | Widely (2019-10-05) | C49 F31 S9.1 | use directly | Token layer. |
| `@property` (registered custom properties) | Newly (2024-07-09; Widely 2027-01-09) | C85 F128 S16.4 | use with fallback | Only for typed/animatable tokens (angles, progress). Unregistered property still works, just not typed/animatable. Never make a base token depend on it. |
| `@layer` | Widely (2024-09-14) | C99 F97 S15.4 | use directly | Backbone of override-ability. Declare order on the first line of `dist`. |
| `:where()` / `:is()` | Widely (2023-07-21) | C88 F82 S14 | use directly | Wrap library selectors in `:where()` so specificity is 0 and apps override without `!important`. |
| `:has()` | Widely (2026-06-19) | C105 F121 S15.4 | use directly | Field groups (`.field:has(:user-invalid)`), grouped focus rings. |
| CSS nesting | Widely (2026-06-11) | C120 F117 S17.2 | use directly | Chrome 112-119 and Safari 16.5 were partial (needed `&` before type selectors): always write `&`. |
| `@scope` | Newly (2026-03-24) | C143 F146 S26.4 (BCD: C118) | avoid | `@layer` + `:where()` + nesting already cover the need. |
| Container queries (size) | Widely (2025-08-14) | C105 F110 S16 | use directly | `container-type:inline-size` applies inline-size containment: element needs a width from its parent. Use for component internals; media queries only for the app shell. |
| Container style queries (custom properties) | Newly (2026-05-19; Widely 2028-11-19) | C111 F151 S18 | use with fallback | Only `style(--x: y)` custom-property queries are Baseline. Enhancement only. |
| Container name queries | Newly (2026-05-07) | C148 F149 S26.4 | avoid | Not needed. |
| Container scroll-state queries | Limited | C133 only | avoid | |

### 2b. Colour

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| `oklch()` / `oklab()` / `lab()` / `color()` | Widely (2025-11-09) | C111 F113 S15.4 | use directly | Author palettes in OKLCH. Use **hex** in `<meta theme-color>` and the manifest, not `oklch()`. |
| `color-mix()` (2 colours) | Widely (2025-11-09) | C111 F113 S16.2 | use directly | `color-mix(in oklab, ...)` for state derivations. |
| `color-mix()` with 3+ colours | Limited | F150 S27 (Chrome not yet) | avoid | |
| Relative colour syntax (`oklch(from var(--x) l c h)`) | Newly (2024-09-16; Widely 2027-03-16) | C125 F128 S18 | use with fallback | Ship precomputed hex state tokens first, upgrade inside `@supports (color: oklch(from red l c h))`. |
| `alpha()` relative function | Limited | S27 only | avoid | |
| `light-dark()` | Newly (2024-05-13; Widely 2026-11-13) | C123 F120 S17.5 | use directly | Needs `color-scheme` on the element or an ancestor. `light-dark(<image>)` is Newly only since 2026-09-14 (C150 F150 S27): avoid for now. |
| `color-scheme` (property and `<meta>`) | Widely (2024-08-03) | C81 (prop) F96 S13 | use directly | Also fixes native scrollbars and form controls. Add `<meta name="color-scheme" content="light dark">` to avoid a white flash. |
| `contrast-color()` | **Newly (2026-04-10; Widely 2028-10-10)** | **C147 E147 F146 S26 / iOS 26** | use with fallback | Shipped in all four engines; Baseline "Newly available" per web.dev April 2026 digest. Returns only black or white. For ANY background its best-of-two contrast is >= 4.58:1 (computed: minimum over luminance of max((1.05)/(L+0.05),(L+0.05)/0.05) at L=0.1791), so AA normal text always passes, AAA (7:1) never guaranteed on mid-tones. Use only for user-chosen or dynamic colours; design tokens keep explicit, validated `--on-*` pairs. Gate with `@supports (color: contrast-color(red))`. Not testable locally (Chromium 141 returned `CSS.supports = false`, consistent with C147). |
| `accent-color` | web-features `false`, although all four engines ship it *(inferred: Newly since 2025-12-12)* | C93 F92 S26.2 full (S15.4-26.1 partial) | use directly | Safari 26.2 notes: form controls "preserve legibility when using `accent-color` in both light and dark modes". Native checkbox/radio/range/progress only. |
| `forced-color-adjust` | Limited (no Safari; Safari has no forced-colors mode) | C89 F113 | use directly | Rarely needed; do not opt out of forced colours. |

### 2c. Typography and text

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| `text-wrap: balance` | Newly (2024-05-13; Widely 2026-11-13) | C114 F121 S17.5 | use directly | Headings, toasts, empty states. Engines cap how many lines they balance, so use it on short text only. |
| `text-wrap: pretty` | Limited | C117 S26; no Firefox | use directly as enhancement | No-op in Firefox; harmless. |
| `font-display` | Widely (2022-07-15) | C60 F58 S11.1 | use directly | `swap` for self-hosted precached fonts. |
| Variable fonts (weight range in `@font-face`) | Widely (`font-variation-settings` 2021-03-05) | C62 F62 S11 | use directly | Drive weight with `font-weight`, not `font-variation-settings`. `format("woff2")` is enough; verified Manrope renders wght 200/400/700 in Chromium. |
| `font-optical-sizing` | Widely (2022-09-24) | C79 F62 S13.1 | use directly | Manrope has no `opsz` axis; harmless. |
| `@font-face size-adjust` | bundled under `font-size-adjust` = Newly (2024-07-25); the descriptor itself: C92 F92 S17 (effectively Widely since 2026-03-18 *(inferred)*) | | use directly | Works in Safari 17+. |
| `ascent-override` / `descent-override` / `line-gap-override` | Limited (`font-metric-overrides`) | C87 F89; Safari none (BCD: "preview") | use directly | Safari ignores them and honours only `size-adjust`. |
| `font-variant-numeric: tabular-nums` | Widely (2022-07-15) | C52 F34 S9.1 | use directly | Requires the font to carry `tnum` (Manrope does; Urbanist and DM Sans do not, measured). |
| `text-size-adjust` | Limited | C54 E79; iOS Safari only with `-webkit-`; Firefox and desktop Safari none | use with fallback | `-webkit-text-size-adjust:100%; text-size-adjust:100%` on `html`. |
| `Intl.NumberFormat` / `DateTimeFormat` / `RelativeTimeFormat` / `ListFormat` | Widely (`intl` 2020-03-28; RelativeTimeFormat 2023-03-16) | C24 F29 S10 | use directly | Option-level (BCD): `currencySign:'accounting'`, `signDisplay`, `notation:'compact'` C77 F78 S14.1; `roundingMode`, `trailingZeroDisplay` C106 F116 S15.4; `formatRange` C106 F116 S15.4. `Intl.DurationFormat` Newly (2025-03-04). |
| `Temporal` | Limited | C144 F139; Safari preview | avoid | Use `Date` + `Intl`. |
| `Math.sumPrecise` | Newly (April 2026 per web.dev digest) | | optional | Still store money as integer minor units. |

### 2d. Viewport, layout, scrolling

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| `dvh` / `svh` / `lvh` | Widely (2025-06-05) | C108 F101 S15.4 | use directly | `min-height:100dvh` on the shell. On iOS/Chrome Android the on-screen keyboard does NOT change these units (Chrome docs, since Chrome 108). iOS standalone bug 301994 makes `dvh`/`svh` differ from `lvh`/`vh` by the strip height (62 px measured by a reporter: screen 874, `dvh` 812). Build the shell as a flex column; never hard-code 100vh. |
| `env(safe-area-inset-*)` | Widely (2022-07-15) | C69 F65 S11.1 | use directly | Needs `viewport-fit=cover` (BCD: iOS 11, Firefox Android 79, Samsung 29, Chrome Android 135). Always `max(var(--space), env(safe-area-inset-bottom, 0px))`. Must tolerate 0 (bug 301994). |
| `env(keyboard-inset-*)` + VirtualKeyboard API | Limited | C94 only | avoid | |
| `interactive-widget` viewport key | not in web-features; BCD: Chrome Android 108, Firefox Android 133; none on iOS Safari or desktop | | use as enhancement | `resizes-content` makes the layout viewport shrink above the keyboard so bottom-fixed composers stay visible on Android. iOS fallback: `visualViewport` (Widely, 2024-02-10) resize events. |
| `overscroll-behavior` | Limited (partial: no effect on containers without scrollable overflow until C144 F150; Safari 16+ still partial) | C63* F59* S16* | use directly on scroll containers | `contain` on sheets/drawers/modal bodies. Do not promise document-level bounce or pull-to-refresh control on iOS. |
| `scroll-snap` (+ `scroll-padding`) | Widely (2022-07-15) | C69 F68 S11 | use directly | Keep `scroll-padding-block` >= sticky bar height so focused elements are not obscured (WCAG 2.4.11). |
| `scrollbar-gutter` / `scrollbar-width` / `scrollbar-color` | Newly (2024-12-11 / 2024-12-11 / 2025-12-12) | C94-121 F64-97 S18.2-26.2 | use directly | Purely cosmetic. |
| `touch-action: manipulation` | Widely (2022-03-19) | C36 F52 S13 | use directly | Removes double-tap-zoom delay on controls. |
| `aspect-ratio` | Widely (2024-03-20) | C88 F89 S15 | use directly | |
| `gap` on flexbox | Widely (2023-10-26) | C84 F63 S14.1 | use directly | |
| Logical properties | Widely (2024-03-20) | C89 F66 S15 | use directly | `margin-inline`, `padding-block`, `inset-inline-start`; ban physical left/right except in transforms. |
| `content-visibility: auto` | Newly (2025-09-15) | C108 F130 S26 | use as enhancement | Pair with `contain-intrinsic-size`. |
| `interpolate-size` / `calc-size()` | Limited | C129 only | enhancement only | |

### 2e. Motion

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| `linear()` easing | Widely (2026-06-11) | C113 F112 S17.2 | use directly | Declare `ease-out` first, then the `linear()` value. |
| `@starting-style` | Newly (2024-08-06; Widely 2027-02-06) | C117 F129 S17.5 | use directly | Entry animation for dialog/popover/toast; degrades to instant. |
| `transition-behavior: allow-discrete` | Newly (2024-08-06; Widely 2027-02-06) | C117 F129 S17.4 | use directly | `display`/`overlay` transitions (`overlay` itself is Chrome only). Safari 27 fixed `display` transitions on popover/dialog close. |
| View Transitions, same-document | Newly (2025-10-14; Widely 2028-04-14) | C111 F144 S18 | use with fallback | `if (!document.startViewTransition) { update(); return }`; wrap in `prefers-reduced-motion: no-preference`. |
| View Transitions, cross-document (`@view-transition`) | Limited | C126 S18.2; no Firefox | enhancement only | Unsupported = normal navigation. |
| Element-scoped view transitions | Limited | C147 only | avoid | |
| Scroll-driven animations | Limited | C115 S26; Firefox behind flag | avoid for essential UI | Decorative only, inside `@supports (animation-timeline: scroll())`. |
| `prefers-reduced-motion` | Widely (2022-07-15) | C74 F63 S10.1 | use directly | Put all non-essential animation inside `@media (prefers-reduced-motion: no-preference)`: unsupported browsers then get no animation (safe default). |

### 2f. Interaction and components

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| `:focus-visible` | Widely (2024-09-14) | C86 F85 S15.4 | use directly | Never `outline:none` without a replacement. |
| `:user-invalid` / `:user-valid` | Widely (2026-05-02) | C119 F88 S16.5 | use directly | Style errors after interaction only; `:invalid` fires on load. |
| `<dialog>` + `showModal()` + `::backdrop` | Widely (2024-09-14) | C37 F98 S15.4 | use directly | Built-in focus trap and inert background. |
| `popover` attribute | Newly (2025-01-27; Widely 2027-07-27) | C116 F125 S17 (iOS 18.3 per web-features) | use directly | Light dismiss and top layer for menus/sheets. |
| Invoker commands (`command` / `commandfor`) | Newly (2025-12-12; Widely 2028-06-12) | C135 F144 S26.2 | use with fallback | Add a ~10-line click handler fallback for older engines. |
| `<dialog closedby>` | Limited | C134 F141; no Safari | use with fallback | JS backdrop-click + Esc handler. |
| `popover=hint` | Limited | C151 F153; no Safari | avoid | |
| CSS anchor positioning (core: `anchor-name`, `position-anchor`, `position-area`, `anchor()`, `position-try`) | **Newly (core, 2026-01-13; Widely 2028-07-13)** | C125 (`position-area` C129) F147 S26 | use with fallback | web-features shows the umbrella `anchor-positioning` as `false` only because the `position-visibility` keywords `anchor-valid`/`anchor-visible` are Safari 27 only; the core is Baseline Newly since Firefox 147 (2026-01-13). Fallback: `@supports not (anchor-name: --a)` static placement under the trigger. |
| `<details name>` exclusive accordion | Newly (2024-09-03; Widely 2027-03-03) | C120 F130 S17.2 | use directly | Non-exclusive behaviour is an acceptable degradation. |
| `::details-content` | Newly (2025-09-16) | C131 F143 S18.4 | enhancement | Height animation needs `interpolate-size` (Chrome only). |
| `inert` | Widely (2025-10-11) | C102 F112 S15.5 | use directly | |
| `field-sizing: content` | Newly (2026-06-16; Widely 2028-12-16) | C123 F152 S26.2 | use directly | Auto-growing textarea with `min-height`/`max-height`; fallback is the normal `rows` behaviour. |
| Customizable `<select>` (`appearance: base-select`) | Limited | C135 S27; no Firefox | avoid | Style the closed control (chevron via SVG) and keep the native picker: best touch and screen-reader behaviour. |
| `<input type=checkbox switch>` | Limited | S17.4 only | avoid | Build switches with `role="switch"` on a checkbox. |
| `<search>` element | Widely (2026-04-13) | C118 F118 S17 | use directly | |
| `ariaNotify()` | Newly (2026-09-14) | C141 F150 S27 | enhancement | Keep `aria-live`/`role=status` regions as the baseline. |
| Navigation API | Newly (2026-01-13) | C102 F147 S26.2 | optional | History API remains fine for SPA routing. |

### 2g. User-preference and capability media queries

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| `prefers-color-scheme` | Widely (2022-07-15) | C76 F67 S12.1 | use directly | Handled mostly by `color-scheme` + `light-dark()`. |
| `prefers-contrast` | Widely (2024-11-30) | C96 F101 S14.1 | use directly | `more` override: borders >= 3:1, text >= 7:1. |
| `forced-colors` | Widely (2025-03-12) | C89 F89 S16 | use directly | System colours (`Canvas`, `CanvasText`, `LinkText`, `ButtonText`, `Highlight`, `GrayText`); keep real `outline`/transparent borders (`box-shadow` is removed); SVG icons `currentColor`. |
| `prefers-reduced-transparency` | Limited | C118/119 E; Firefox flag; Safari none | enhancement | Do not rely on blur/translucency for legibility; surfaces are solid by default. |
| `prefers-reduced-data` | Limited (no engine ships it) | Chrome flag only | avoid | |
| `display-mode: standalone` | web-features `false` (only the `fullscreen` value lacks Firefox/Safari); `standalone` works | C42 E79 S13 (iOS 12.2) FA47 | use directly | Firefox desktop never matches (no install). iOS also exposes legacy `navigator.standalone`. |
| `hover: hover`, `pointer: coarse`, `any-hover`, `any-pointer` | Widely (2018-12-11) | C38/41 F64 S9 | use directly | Hover styles only inside `@media (hover:hover)`; larger targets under `(pointer:coarse)`. |
| `scripting` | Widely (2026-06-07) | | optional | |

### 2h. PWA and storage APIs

| Feature | Baseline now | Min engines | Verdict | Fallback / note |
|---|---|---|---|---|
| Web app manifest (`<link rel=manifest>`) | Limited (Firefox desktop cannot install) | C53 E79 S17 (iOS 15.4) FA79 | use directly | |
| Service workers | Widely (2020-10-30) | C45 F44 S11.1 | use directly | |
| `beforeinstallprompt` | Limited | Chromium only | use with fallback | Feature-detect; iOS gets instructions instead. |
| `navigator.storage.persist()` | Widely (2026-03-18) | C55 F57 S15.2 (WebKit: granted by heuristics, e.g. Home Screen web app) | use directly | Call after first real interaction; surface the result in Settings. |
| Origin Private File System | Widely (2025-09-27) | C108 F111 S16.4 | optional | Bigger local data than localStorage. |
| Badging API | Limited | C81 E81 S17 (iOS 16.4); no Firefox | optional | |
| Screen Wake Lock | Newly (2025-03-31) | C84 F126 S16.4 | optional | |
| Background Sync / Periodic Sync | Limited | Chromium only | avoid | IndexedDB outbox + retry on `online`/`visibilitychange`. |
| Manifest `display_override`, `launch_handler`, `scope_extensions` | Chromium only | C89 / C110 / C138 | optional | Not needed for a single-window app. |
| Manifest `shortcuts` | Limited | C96 S17.4 (macOS); none on iOS | optional | |

### 2i. Flip watch (Newly to Widely soon)

`light-dark()` and `text-wrap: balance` on 2026-11-13; `@property` 2027-01-09; `@starting-style` and `transition-behavior` 2027-02-06; `<details name>` 2027-03-03; relative colour 2027-03-16; `popover` 2027-07-27.

## 3. Accessibility platform notes (2026 and beyond)

- **Standard of record:** WCAG 2.2 (W3C Recommendation, dated 12 December 2024 on the TR page). WCAG 3.0 is still a Working Draft (update March 2026); candidate recommendation not expected before Q4 2027, final not before 2028 (search results, not primary). APCA is not normative: keep WCAG 2.x contrast math.
- **New in 2.2 that a CSS system can encode:** 2.5.8 Target Size (Minimum) AA = 24x24 CSS px; 2.4.11 Focus Not Obscured (Minimum) AA; 2.5.7 Dragging Movements AA (always provide a tap/button alternative to drag reorder); 3.3.8 Accessible Authentication AA; 2.4.13 Focus Appearance is AAA (>= 2 CSS px perimeter, >= 3:1 change of contrast): adopt it as the default focus ring because it is free.
- **Targets:** 44x44 px for primary touch controls (Apple HIG), 24x24 px absolute floor (AA) for dense inline controls.
- **Text scaling:** `html{font-size:100%}`, all type in `rem`, no px base. `<meta name="text-scale" content="scale">` (Chrome/Edge 146+ per web-features, CA146) makes Chrome Android honour the OS font size for `rem`/`em` text; early-2026 articles (matuzo.at, Adrian Roselli) described it as Canary-only, so treat as enhancement and verify on a stable device; warning from matuzo.at: adding it "may result in horizontal scrolling" on some sites, and only `rem`/`em` text scales. iOS Dynamic Type needs `font: -apple-system-body` under `@supports` and then re-setting `font-family` (Roselli); Firefox Android already scales. Not device-tested here.
- **Fluid type:** only for display headings; keep the `rem` term so browser zoom still enlarges text (1.4.4); app UI text uses a fixed rem scale.
- **iOS zoom-on-focus:** form controls need computed `font-size >= 16px` or Safari zooms the page on focus. Never use `user-scalable=no`/`maximum-scale`.
- **Motion:** opt-in animation inside `prefers-reduced-motion: no-preference`; View Transitions too.
- **Status messages:** `role="status"`/`aria-live="polite"` for toasts; `ariaNotify()` is an optional upgrade (Newly since 2026-09-14).
- **Measured colour-ramp fact for a one-knob hue system:** at OKLCH L = 0.55 and chroma = min(0.15, sRGB-gamut max), contrast of the resulting colour against white across 24 hues (0-345 degrees, step 15) is 4.54:1 (worst, h=150) to 5.27:1 (best, h=345); at L = 0.50 it is 5.63-6.53:1; at L = 0.60 it is 3.70-4.28:1 (fails AA for text). So a fixed-lightness accent ramp with "strong" step at L <= 0.55 keeps white-on-accent >= 4.5:1 for any hue, but only barely at L = 0.55; ship L = 0.50-0.52 for the text-bearing step and still run a validator for dark-mode pairs. (Script: `tools/oklch.py`.)

## 4. Recommended `<head>` (minimal, current)

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FAFAF9" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1115" media="(prefers-color-scheme: dark)">
<meta name="text-scale" content="scale"> <!-- enhancement: Chrome/Edge Android -->
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon-180.png"> <!-- opaque 180x180 PNG -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="App">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" href="fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styleguide.css">
```

Notes: `theme-color` with `media=` works on Chrome Android; Safari 26 uses `theme-color` only for installed web apps (BCD note: "From Safari 26, the theme color is only used for installed web apps"); in browser tabs Safari derives the top-bar tint from the page background or a fixed/sticky element at the edge (WebKit engineer, bug 301756). When the user overrides the theme in-app, rewrite both metas via JS so they match. Both `mobile-web-app-capable` and `apple-mobile-web-app-capable` are kept because Chromium warns about the Apple-only tag and iOS <= 25 still reads the Apple tag; the exact Chrome deprecation version was not verified.

## 5. Theming skeleton that was tested

```css
@layer sg.reset, sg.tokens, sg.base, sg.layout, sg.components, sg.utilities;
@layer sg.tokens {
  :root { color-scheme: light dark;
          --sg-surface: light-dark(#fafaf9, #0f1115);
          --sg-text:    light-dark(#14171f, #f2f4f8); }
  :root[data-theme="light"] { color-scheme: light; }
  :root[data-theme="dark"]  { color-scheme: dark; }
}
```
Test result (Chromium 141, OS scheme light and dark): body background was `rgb(250,250,249)` / `rgb(15,17,21)` by OS scheme, and flipped correctly when `data-theme` was set either way; `@container (min-width:150px)` applied; unlayered `.btn.app-override` beat the layered `:where(.btn)`.

## 6. PWA specifics

### 6.1 Installability today

| Browser | What is required | Source |
|---|---|---|
| Chrome / Edge (desktop + Android), Samsung Internet | HTTPS (or localhost); manifest with `name` or `short_name`, `icons` incl. **192x192 and 512x512**, `start_url`, `display` (and/or `display_override`) in standalone/fullscreen/minimal-ui/window-controls-overlay, `prefer_related_applications` absent or false. **No service worker / fetch handler required**: removed in Chrome 108 (Android) and 112 (desktop). web.dev's install-criteria page still lists a user-engagement heuristic (one click + 30 s) for the automatic prompt. Lighthouse's PWA category is deprecated; use DevTools > Application > Manifest. | web.dev install-criteria; MDN; developer.chrome.com "Revisiting Chrome's installability criteria" |
| Safari iOS/iPadOS 26 | **Zero requirements.** "Every website added to the Home Screen opens as a web app" by default, with an "Open as Web App" toggle; manifest and service worker are optional enhancements. Safari 26 release notes: "Added support for any website to become a web app on iOS or iPadOS". iOS 16.4+ can also install from other browsers' Share menus. | Safari 26 release notes (raw); WebKit blog; MDN |
| Safari macOS | "Add to Dock" (Sonoma / Safari 17+), manifest optional | MDN |
| Firefox desktop | **No manifest-based install.** Experimental "Taskbar Tabs" on Windows in Firefox Labs (142/143+, described by press as not stable; Linux/macOS not yet). Not a PWA install. | MDN; press (conflicting detail, see section 9) |
| Firefox Android | Adds browser-badged shortcuts, not WebAPKs | MDN |

`beforeinstallprompt` exists only on Chromium (BCD: C44 E79; none on Firefox/Safari). Pattern: stash the event, show an in-app "Install" button only when it fired, call `prompt()` from the click; on iOS show "Share, then Add to Home Screen"; hide both when `matchMedia('(display-mode: standalone)').matches || navigator.standalone === true`.

### 6.2 Minimal correct manifest

```json
{
  "id": "/my-app/",
  "name": "My App",
  "short_name": "MyApp",
  "description": "One sentence; shown in Chrome's richer install UI.",
  "start_url": "./?source=pwa",
  "scope": "./",
  "display": "standalone",
  "background_color": "#FAFAF9",
  "theme_color": "#FAFAF9",
  "color_scheme_dark": { "background_color": "#0F1115", "theme_color": "#0F1115" },
  "categories": ["productivity"],
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "screens/wide.png", "sizes": "1280x720", "type": "image/png", "form_factor": "wide" },
    { "src": "screens/narrow.png", "sizes": "720x1280", "type": "image/png", "form_factor": "narrow" }
  ],
  "shortcuts": [
    { "name": "Add entry", "url": "./?action=add", "icons": [{ "src": "icons/shortcut-add-96.png", "sizes": "96x96", "type": "image/png" }] }
  ]
}
```

- **`id`:** resolved against the origin of `start_url` (MDN: `/` resolves to `https://example.com/`); defaults to `start_url` when omitted. Use an explicit root-relative id that is unique per app. This matters when several apps share one origin such as `user.github.io/app-a/` and `user.github.io/app-b/`.
- **Shared-origin hazard:** `localStorage`, IndexedDB and Cache Storage are per ORIGIN, not per path, so apps under one `github.io` origin can read/overwrite each other's data. Prefix every storage key and cache name with the app id, or give each app its own (sub)domain.
- **`start_url` / `scope`** relative (`./`) so the same manifest works under any base path. `display_override` is Chromium-only (C89) and optional.
- **Icons:** 192 and 512 are the install minimum. Keep `any` and `maskable` as separate entries. MDN safe zone for maskable: "a circle whose diameter is 80% of the icon's minimum dimension". Provide an opaque 180x180 `apple-touch-icon`; BCD says Safari uses manifest icons only when no `apple-touch-icon` exists and only for `purpose:any`.
- **Screenshots** (Chrome richer install UI): at least one image, Chrome shows up to 8, each side 320-3840 px, longest side <= 2.3x the shortest, PNG/JPEG, identical aspect ratio within one `form_factor` (`wide` for desktop, `narrow` for mobile).
- **`theme_color`/`background_color`**: hex. **`color_scheme_dark`** (manifest spec PR w3c/manifest#1207): WebKit implemented it (bug 311727 RESOLVED FIXED, commit 314109@main landed 2026-05-29, so expected in iOS 27 / Safari 27; not confirmed in the Safari 27 notes), Chromium "intends to support" (crbug.com/383165202, status unknown). Unknown manifest members are ignored, so it is safe progressive enhancement. Browsers other than that ignore it and use `theme_color`.
- **`lang`/`dir`:** MDN says not implemented; omit.

### 6.3 iOS quirks (verified against primary sources where noted)

- Safari reads `apple-mobile-web-app-*` metadata and icon **when the app is added**; later changes are not reflected until the user removes and re-adds it (WebKit bug 260508, NEW since 2023).
- `apple-mobile-web-app-status-bar-style`: `default` = standard bar, content below; `black` = black bar; `black-translucent` = content under the bar (needs `viewport-fit=cover` + `env(safe-area-inset-top)`) and **forces white glyphs**, so it is wrong on light pages (community reports; not Apple-documented). Recommendation: `default` for light/dark-adaptive apps, `black-translucent` only for an always-dark header. **Not verified on a device.**
- **WebKit bug 301994** ("REGRESSION (iOS 26.1): Status bar remains visible in fullscreen mode in Home Screen Web apps"): created 2025-11-05, reporters said fixed in 26.2 (2025-12-13/14), reproduced on 26.5.2 (2026-07-21; `screen.height` 874, `innerHeight`/`dvh` 812, gap 62 px "drawn by the system above the web layer"), confirmed on iOS 27 beta and REOPENED by an Apple engineer 2026-08-05; last change 2026-08-28. Consequences for the library: `env(safe-area-inset-top)` may be 0 while a system strip exists; `svh/dvh` and `lvh/vh` disagree; the strip colour comes from the page background and (reporter) is cached until relaunch, not updated on live theme change. Mitigation: set `html{background:var(--sg-surface)}`, flex-column shell, no `position:fixed` full-height assumptions, test on a real device.
- In-browser Safari 26 tab UI: top/bottom bar tint derives from `html`/`body` background, or from a fixed/sticky element touching the edge (WebKit bug 301756 comment by a WebKit engineer). Avoid full-screen fixed overlays of a different colour behind the bars; bug 300965 (dialog backdrop not extending under the address bar) is RESOLVED FIXED.
- No `beforeinstallprompt`. iOS Safari ignores `interactive-widget`, `env(keyboard-inset-*)`, `overscroll-behavior` on the non-scrolling document, Background Sync, `display_override`, manifest `shortcuts`, `share_target`, `orientation`.
- Script-writable storage: Safari's 7-day no-interaction purge applies to browser tabs; a Home Screen web app has its own day counter and is effectively exempt (WebKit ITP post, read via a search-result summary, not fetched directly). Quota: browser app and Home Screen web app both "up to 60% of total disk space"; `persist()` is granted by heuristics such as being a Home Screen web app (WebKit "Updates to Storage Policy").

### 6.4 Minimal robust offline service worker (tested)

Test harness: Playwright + Chromium 141 over `http://localhost`, server sending `Cache-Control: max-age=600` (as GitHub Pages does, measured `max-age=600`). Results, in order: (1) first load registers, reload is controlled, cache `shell-v1` holds all 7 precached URLs; (2) offline reload renders `HTML_VERSION=v1`; (3) offline navigation to `/?utm=1` renders the shell (`ignoreSearch`); (4) offline font fetch returns `font/woff2`; (5) after editing `index.html` and `sw.js` to v2, `registration.update()` produces a waiting worker while the page still shows v1 and the toast is visible; the install re-fetched every precached file from the network despite the 600 s HTTP cache (`cache:'reload'`); (6) clicking Reload posts `SKIP_WAITING`, exactly one reload happens on `controllerchange`, page shows `HTML_VERSION=v2`; (7) `caches.keys()` is `["shell-v2"]` (old cache deleted). Files: `tools/sw-test/app/{sw.js,app.js,index.html}`, runner `tools/sw-test/run.js`.

```js
/* sw.js - offline app shell. Bump VERSION on every deploy that changes a precached file. */
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;      // immutable per version: precached, cache-first
const RUNTIME = 'runtime';             // long-lived: stale-while-revalidate for everything else
const RUNTIME_MAX = 60;                // entries kept in RUNTIME
const PRECACHE = [
  './', './index.html', './app.js', './styleguide.css', './manifest.webmanifest',
  './fonts/manrope-latin-wght-normal.woff2', './icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // cache:'reload' bypasses the HTTP cache (GitHub Pages sends max-age=600).
    await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })));
    // No skipWaiting() here: the page offers the update and sends SKIP_WAITING.
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('shell-') && key !== SHELL) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                       // never touch writes
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // never touch cross-origin / APIs

  if (req.mode === 'navigate') {                          // navigation fallback = app shell
    event.respondWith((async () => {
      const shell = await caches.open(SHELL);
      return (await shell.match(req, { ignoreSearch: true }))
          || (await shell.match('./index.html'))
          || fetch(req).catch(() => new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }));
    })());
    return;
  }

  event.respondWith((async () => {
    const hit = await (await caches.open(SHELL)).match(req);   // precached asset: cache-first
    if (hit) return hit;
    const runtime = await caches.open(RUNTIME);                // everything else: stale-while-revalidate
    const cached = await runtime.match(req);
    const network = fetch(req).then(async (res) => {
      if (res.ok && res.type === 'basic') {
        await runtime.put(req, res.clone());
        const keys = await runtime.keys();
        for (const k of keys.slice(0, Math.max(0, keys.length - RUNTIME_MAX))) await runtime.delete(k);
      }
      return res;
    });
    if (cached) { event.waitUntil(network.catch(() => {})); return cached; }
    return network;
  })());
});
```

Why navigations are cache-first from a versioned cache and NOT stale-while-revalidate: a background refresh of `index.html` into the old versioned cache would pair new HTML with old assets. The shell changes only through a new service-worker install, which swaps all files atomically; everything else (images, data files) uses stale-while-revalidate in a separate long-lived cache.

Registration and update UX (same test):

```js
navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((reg) => {
  const offer = (w) => showUpdateToast(() => w.postMessage({ type: 'SKIP_WAITING' })); // role="status", non-blocking
  if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
});
let reloading = false;
navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
```

Update UX rules: never auto-`skipWaiting` mid-session (mismatched assets, lost form state); show a dismissible "Update available - Reload" status toast; check for updates when the app becomes visible (installed iOS apps otherwise only check on cold launch); expose the app version in Settings; `updateViaCache:'none'`; bump `VERSION` in `sw.js` on every deploy (byte change triggers install).

Offline and data rules: show a connectivity indicator from `online`/`offline` events as a hint only; queue writes in IndexedDB and retry on `online` and on `visibilitychange`; call `navigator.storage.persist()` after the first meaningful action and show the result in Settings; provide **Export / Import JSON backup** (device storage is the only copy); store money as integer minor units.

## 7. Font strategy for offline PWAs

### 7.1 Candidates, measured

Files: `@fontsource-variable/<family>@5.3.0`, `*-latin-wght-normal.woff2` (sizes are bytes of the actual files; all licences are OFL-1.1, LICENSE text present in every package). Metrics from fontTools; `x/upm` and cap heights from `OS/2`. Arial-metric reference (Liberation Sans): x-height 0.528, cap 0.688.

| Family | latin wght woff2 | latin-ext | Weight axis | x-height | Cap | `tnum` (digit width) | `pnum` | Notes |
|---|---|---|---|---|---|---|---|---|
| **Manrope** | **24,836** | 15,120 | 200-800 | **0.540** | 0.720 | **yes (all digits 0.62 em)** | yes | geometric, friendly, neutral; calt, liga, frac. No italic face. |
| Plus Jakarta Sans | 27,348 (italic 29,600) | 21,728 | 200-800 | 0.536 | 0.745 | yes (0.60 em) | yes | slightly more personality; true italic available. Best swap-in. |
| Instrument Sans | 30,092 (wdth+wght 57,332; italic 31,828) | 11,144 | **400-700 only** | 0.510 | 0.720 | yes (0.60 em) | yes | narrow weight range. |
| Space Grotesk | 22,288 | 18,940 | 300-700 | 0.486 | 0.700 | yes (0.62 em) | yes | quirky terminals; techy, not "friendly minimal". |
| Outfit | 32,292 | 14,808 | 100-900 | **0.460** | 0.676 | yes (0.59 em) | yes | small x-height hurts 14-16 px legibility. |
| Urbanist | 27,752 (italic 29,632) | 16,604 | 100-900 | 0.500 | 0.700 | **NO** | **no** | cannot align financial digits. Rejected. |
| DM Sans | 36,932 (opsz+wght 62,724; italic 39,712) | 18,228 | 100-1000 | 0.504 | 0.700 | **NO** | **no** | cannot align financial digits. Rejected. |
| JetBrains Mono (mono) | 40,404 | 15,196 | 100-800 | 0.550 | 0.730 | n/a | n/a | ligatures via calt. |
| Geist Mono (mono) | **23,128** | 14,696 | 100-900 | 0.530 | 0.710 | n/a | n/a | smallest good mono. |
| Fira Code (mono) | 36,276 | 13,272 | 300-700 | 0.525 | 0.687 | n/a | n/a | |

Rendering check (PIL, `tools/fonts-probe/fonts-compare.png`): Manrope and Plus Jakarta Sans read as friendly geometric grotesks with open apertures; Space Grotesk's `y`/`g`/`1` are distinctive but technical; Outfit is visibly smaller at the same size.

Manrope in Chromium 141: `font-variant-numeric: tabular-nums` makes "1111111111" and "0000000000" both 100 px wide at 16 px (default: 70 px vs 100 px). Latin subset `unicode-range`: `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`. It includes `$ € £ ¥ ¢ % + − – — × ÷ ± • … ’ “ ” © ® ™ °` and U+2212 (true minus), and **lacks `→ ← ✓ ≈ ≤ ≥ ‰ №`** (measured against the cmap). **All UI arrows, checks and symbols must be inline SVG, not text glyphs.**

### 7.2 Recommendation

- **Primary: Manrope Variable**, latin file only (24,836 bytes; +15,120 for latin-ext is optional and costs 0 bytes unless a latin-ext character appears because of `unicode-range`). Declared weights 200-800; UI uses 400 body, 500 label, 600 heading, 700 display numerals.
- **Swap-in alternative:** Plus Jakarta Sans (27,348 bytes). Changing family = one token (`--sg-font-sans`) plus its `@font-face` and fallback face.
- **System stack vs self-hosted:** system gives 0 bytes and native feel but three different faces (SF / Roboto / Segoe UI), unpredictable numerals and metrics. Self-hosted variable font is 24.8 KB, precached once by the service worker, identical on every device. Keep a documented opt-out: override `--sg-font-sans: system-ui, ...`; an unused `@font-face` is never downloaded.
- **Mono:** default **system stack, 0 bytes**: `ui-monospace, "SF Mono", "Cascadia Mono", "Cascadia Code", Menlo, Consolas, "Liberation Mono", monospace` (`ui-monospace` exists only in Safari, BCD; other engines skip it). Optional self-host: Geist Mono latin 23,128 bytes. Do not ship JetBrains Mono (40,404) unless ligatures are wanted.
- **Loading:** `font-display: swap`, `<link rel=preload as=font type=font/woff2 crossorigin>`, precached in the service worker. With a precached font, swap is only visible on the very first launch.

```css
@font-face {
  font-family: "Manrope Variable";
  src: url("./fonts/manrope-latin-wght-normal.woff2") format("woff2");
  font-weight: 200 800; font-style: normal; font-display: swap;
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
/* Metric-matched fallbacks (Arial metrics). Regular and bold need separate faces. */
@font-face { font-family: "Manrope Fallback"; src: local("Arial"), local("Liberation Sans");
  font-weight: 200 500; size-adjust: 102.5%; ascent-override: 104%; descent-override: 29.3%; line-gap-override: 0%; }
@font-face { font-family: "Manrope Fallback"; src: local("Arial Bold"), local("Arial-BoldMT"), local("Liberation Sans Bold");
  font-weight: 600 800; size-adjust: 100%; ascent-override: 106.6%; descent-override: 30%; line-gap-override: 0%; }
:root { --sg-font-sans: "Manrope Variable", "Manrope Fallback", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
```

### 7.3 How the fallback numbers were derived and checked (and a trap)

- Manrope: upm 2000, hhea ascent 2132, descent 600, lineGap 0 (USE_TYPO_METRICS set, typo metrics identical). Ascent-override = ascent/upm / size-adjust; descent likewise (Capsize/Next.js formula).
- **size-adjust (width match vs Arial metrics, Liberation Sans Regular):** frequency-weighted advance model at wght 400 gave 103.6%. Measured in Chromium with real shaping and kerning at 200 px: 102.9% on a 990-character UI-copy corpus and about 102.0% on a different 420-character sample, so text-dependent by about +/-0.5 pt; chosen 102.5%. Bold (wght 700 vs Liberation Sans Bold): measured ratio 1.006, so 100%.
- **Height match verified:** with the descriptors above, fallback line-box height equals Manrope's (137 px vs 137 px at 100 px font size, ratio 1.0000) for both regular and bold.
- **Trap:** do not calibrate at 16 px on Linux. Headless Chromium there uses integer-hinted glyph advances; the same comparison at 16 px produced 3.4% instead of 2.9%. Measure at >= 200 px.
- **Limits:** Safari ignores the three override descriptors (only `size-adjust`); Android has no Arial, so `local("Arial")` may not resolve and the stack falls to `system-ui` (Roboto) unadjusted; Liberation Sans is the Arial-metric-compatible stand-in used for measurement, real Arial was not available.
- For the swap-in (frequency model only, not browser-verified): Plus Jakarta Sans size-adjust about 105%, ascent 98.8%, descent 21.1%; Instrument Sans about 102.6%, 94.6%, 24.4%.

Numerals: amounts, tables, timers, counters use `font-variant-numeric: tabular-nums` (add `lining-nums` if a swapped font defaults to oldstyle); keep proportional numerals in running text. Minus sign: format with `Intl.NumberFormat` (emits U+2212 in many locales) and ensure U+2212 stays in the subset (it does).

## 8. Packaging a shared CSS package (copy one file, or link it)

**Measured (2026-09-30):**

| URL type | `content-type` | Other headers | Usable in `<link rel=stylesheet>`? |
|---|---|---|---|
| `raw.githubusercontent.com/.../file.css` | `text/plain; charset=utf-8` | `x-content-type-options: nosniff`, CSP `default-src 'none'; style-src 'unsafe-inline'; sandbox`, `cache-control: max-age=300` | **No**: nosniff makes the browser reject it as a stylesheet. |
| `cdn.jsdelivr.net/gh/<user>/<repo>@<tag>/dist/styleguide.css` | `text/css; charset=utf-8` | `access-control-allow-origin: *`, `cache-control: public, max-age=31536000, immutable` for versioned tags, `x-jsd-version-type: version` | Yes. Pin a tag; never `@main`. |
| GitHub Pages | `text/css; charset=utf-8` | `access-control-allow-origin: *`, `cache-control: max-age=600` | Yes. |

**Layout:**
```
src/css/00-layers.css 01-tokens.primitive.css 02-tokens.semantic.css 03-reset.css 04-base.css
        05-layout.css components/*.css 90-utilities.css 95-preferences.css   (source, nested/layered)
dist/styleguide.css           flattened, NO @import (each @import is a serial request), @layer order first
dist/styleguide.min.css
dist/fonts/manrope-latin-wght-normal.woff2  + OFL.txt   (URLs in CSS relative to the CSS file)
dist/styleguide.standalone.css  optional: same CSS with the latin woff2 inlined as data: URI (+33,116 chars, from 24,836 bytes)
dist/tokens.json              source-of-truth tokens for docs/validators
pwa-template/                 index.html, manifest.webmanifest, sw.js, icon generator notes
scripts/build.mjs             zero-dependency concat (+ optional minify); CI fails if dist is stale
```
- Consumers never need a build: vendor-copy `dist/styleguide.css` and `dist/fonts/` into the app (recommended for offline-first; also precache them in the service worker), or link the jsDelivr tag URL for prototypes. A cross-origin stylesheet can only be precached in `cors` mode; jsDelivr sends `access-control-allow-origin: *`.
- Namespacing: custom properties and layers under one short prefix (`--sg-*`, `@layer sg.*`); classes under `:where()`; semantic tokens (`--sg-surface`, `--sg-text`, `--sg-accent`, `--sg-on-accent`, `--sg-border`, `--sg-focus`) are the public API, primitives are private.
- SemVer git tags, CHANGELOG, token rename or removal = major version. Because dist is committed, every tag is immediately linkable.
- Overriding: consumer CSS can be unlayered (wins over all `sg.*`) or in its own `@layer app` declared after the link (layer order is fixed by first appearance).

## 9. Discrepancies, weak spots and things not verified

1. **WebFetch summariser unreliability.** Its reading of web.dev "New to the web platform in January" gave anchor positioning as "Chrome 151, Safari 27", contradicting BCD and web-features (Chrome 125/129, Safari 26). The Baseline status and date (Newly, Firefox 147, 2026-01-13) agree everywhere; version numbers come from the datasets. Its reading of the Safari 27 release notes listed "theme-color support"; grepping the raw notes (`safari-27.md`, `safari-26*.md`) finds no theme-color entry, so that claim was discarded.
2. **`contrast-color()`**: consistent across BCD (C147 E147 F146 S26), web-features (Newly, 2026-04-10) and web.dev April 2026 ("Baseline Newly available", Chrome 147 being the last engine). Safari 26 shipped it (Safari 26 notes).
3. **`theme-color` in Safari 26**: BCD says used "only for installed web apps"; an article (benfrain.com) and a bug reporter say it was "dropped" for the tab UI, and a WebKit engineer describes the new tint logic. These are consistent. Apple's own release notes contain no entry.
4. **`overscroll-behavior` and `accent-color` and `display-mode`** show `false` in web-features for sub-feature reasons (partial implementations or the `fullscreen` value), although the everyday usage works; statuses above explain each case.
5. **`meta name=text-scale`**: web-features lists Chrome/Edge 146; articles from January-February 2026 say Canary only. Not verified on stable Android.
6. **Firefox desktop web apps**: MDN says no manifest install; press reports Taskbar Tabs on Windows (Firefox 142/143+, Labs, experimental, not the PWA spec). Treat Firefox desktop as not installable.
7. **iOS status bar style behaviour (`default` vs `black-translucent`)** rests on community posts and bug reports; not device-tested. Bug 301994 status is taken from Bugzilla (REOPENED, last change 2026-08-28).
8. **Current Chrome/Firefox stable versions** are inferred from the dataset, not read from release pages.
9. **Chrome's apple-mobile-web-app-capable deprecation**: searches confirm a console deprecation message exists but I could not retrieve the exact Chrome version or wording from the Chromium source (GitHub code search was blocked).
10. **Local verification limits**: Chromium 141 only (no Firefox, no WebKit, no real iOS/Android); fallback metrics used Liberation Sans as the Arial stand-in.
11. **Lighthouse PWA audits** are deprecated (developer.chrome.com); do not make a Lighthouse PWA score a release gate.

## 10. Sources

- web-features 3.40.0: https://www.npmjs.com/package/web-features (data read locally)
- MDN browser-compat-data 8.1.3: https://www.npmjs.com/package/@mdn/browser-compat-data (data read locally)
- web.dev Baseline digest April 2026: https://web.dev/blog/baseline-digest-apr-2026
- web.dev New to the web platform in April / January 2026: https://web.dev/blog/web-platform-04-2026 , https://web.dev/blog/web-platform-01-2026
- web.dev install criteria: https://web.dev/articles/install-criteria
- Chrome installability revisit: https://developer.chrome.com/blog/update-install-criteria
- Chrome viewport resize behaviour: https://developer.chrome.com/blog/viewport-resize-behavior
- Chrome richer install UI (limits quoted via web.dev pattern): https://web.dev/patterns/web-apps/richer-install-ui
- Chrome Lighthouse installable-manifest (PWA testing deprecated): https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest
- MDN making PWAs installable: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- MDN manifest `id`: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id ; `display_override`: .../Reference/display_override ; app icons: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons
- Apple Safari release notes: https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes , .../safari-26_2-release-notes , .../safari-26-release-notes
- Apple meta tags reference: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html
- WebKit storage policy: https://webkit.org/blog/14403/updates-to-storage-policy/
- WebKit Bugzilla: https://bugs.webkit.org/show_bug.cgi?id=301994 , 301756 , 311727 , 260508 , 300965
- Ben Frain on iOS 26 theme-color: https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/
- W3C manifest `color_scheme_dark`: https://github.com/w3c/manifest/pull/1207
- WCAG 2.2: https://www.w3.org/TR/WCAG22/ ; WCAG 3 draft news: https://www.w3.org/WAI/news/2026-03-03/wcag3
- Text scaling: https://matuzo.at/blog/2026/text-scaling-meta-tag , https://adrianroselli.com/2026/02/honoring-mobile-os-text-size.html
- Fonts: https://www.npmjs.com/package/@fontsource-variable/manrope (and plus-jakarta-sans, instrument-sans, space-grotesk, dm-sans, outfit, urbanist, jetbrains-mono, geist-mono, fira-code), all 5.3.0
- Header measurements: `curl -I` of raw.githubusercontent.com, cdn.jsdelivr.net, pages.github.com on 2026-09-30

Local artefacts: `tools/wf/` (dataset query scripts `q.js`, `bcd.js`), `tools/fonts-probe/` (`probe.py`, `tnum.py`, `render.py`, `fonts-compare.png`, extracted packages), `tools/sw-test/` (service-worker app, `run.js`, `css-test.js`, `font-test*.js`), `tools/oklch.py`.
