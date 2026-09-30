# Tooling and process audit: Flashcards style sheet v0.1 (Cards)

Scope: README pipeline and status table, STYLE.md against the CSS against index.html, `tools/check.mjs`, `tools/bundle.mjs`, `dist/`.
Method: read-only on `userzip/design` (verified: no file newer than the unzip time). Every claim below was reproduced in a scratch copy under `audit-work/gate-fuzz/` or with a Playwright/axe script under `audit-work/tool-*.mjs`. Line numbers are from the unzipped files.

Sibling report with the render findings: `zip-audit-render.md`. Where both audits hit the same defect from different angles it is noted as "corroborated".

## 0. Verdict

1. The ideas are right: one element at a time, each gate names what it may not touch, colour as a swap of roles, a zero-dependency checker, docs that print their markup from the live DOM, a deterministic bundle. Keep all of that.
2. The gate is a useful lint and a poor gate. Of 146 deliberate violations I fed it, it caught 64 (44%). Of 19 accessibility-hygiene violations (px font sizes, `!important`, outline removal, 20px targets, px media queries, viewport zoom lock...) it caught 0. It wrongly flagged 11 of 36 legitimate snippets.
3. Its most dangerous behaviour is at the place the README says matters most: the colour handover. Following README steps 1 to 8 literally produces "All 9 checks pass" while 15 of 21 contrast pairs are skipped (or while the old grey file is still the one being checked), and dark mode cannot activate at all because `base.css` pins `color-scheme: light`.
4. The pipeline is per-element on paper but global in enforcement (`GATES.motion` is one boolean; colour is one file swapped for everyone). That is the main reason it will not scale to 40+ elements as written.
5. Only one gate result is red on the unzipped folder, and it is an unzip artefact (Section 1). `dist/` is byte-identical to a rebuild and works offline. Packaging has real hazards (font path, silent leftovers), none of them triggered by the current files.

### Defect index (ids used in the structured summary and in the text)

| Id | Sev | One line |
| --- | --- | --- |
| T01 | critical | Contrast gate skips what it cannot parse and still exits 0; README's own handover uses exactly those forms |
| T02 | critical | Colour file resolution: `color.wire.css` overrides a copied `color.css`; theme scopes flattened; unterminated last declaration ignored |
| T03 | major | `base.css` pins `color-scheme: light` over the colour file, so README step 5 (dark) cannot work; contradicts "tokens only" |
| T04 | major | Gate silently depends on `../styles.css` outside the package (the one red result) |
| T05 | major | Declaration regexes need a trailing `;` |
| T06 | major | Colour-literal and third-party-request holes (named colours, `url()` contents, HTML, remote imports) |
| T07 | major | "AI tell" holes (shadow via other tokens, drop-shadow, font shorthand, deny-list) |
| T08 | major | Line/shape holes (rem, keywords, non-border weights, radius scoped to components) |
| T09 | major | Motion and layering scoped to two file kinds; case-sensitive; sheet.css exempt from 6 |
| T10 | major | Token-definition holes: phantom tokens from selectors, `--_x` invisible, sheet-only definitions, fallback legalises bare use |
| T11 | major | Markup and doc-drift holes (only `index.html`, only double-quoted; numbers never checked; CSS to docs unchecked) |
| T12 | major | 0 of 19 accessibility-hygiene rules enforced |
| T13 | major | Contrast pair list and thresholds are Card-specific and below the 7:1 target; soft ink cannot reach 7:1 by mixing |
| T14 | major | Gate cannot see render defects: focus ring invisible on the inverted card's bar control |
| T15 | major | Per-element pipeline, global enforcement (`GATES.motion`, one colour file) |
| T16 | major | `dist/flashcards.css` is not self-contained (font path) |
| T17 | minor | `bundle.mjs` silent failures and crashes |
| T18 | minor | dist freshness unchecked, not minified, no version in banner, ships wire kit |
| T19 | major | README/STYLE/index disagreements with the CSS (Section 5, D1-D14) |
| T20 | minor | sheet.css blanket exemption for a 33-line block |
| T21 | minor | Disabled hatch lives in the wire layer, above components, and survives the handover cleanup |
| T22 | minor | False positives on legitimate CSS that the next elements will need |
| T23 | minor | Version and status hand-typed in several places; gate ticks carry no evidence |
| T24 | major | STYLE.md structure will not scale and has Card baked into the foundations |
| T25 | major | Element dependencies and freeze semantics are not modelled |
| T26 | major | No route for new tokens, status colours, or the class prefix decision |
| T27 | minor | oklch parser quirks (turn/rad units, alpha, `%` chroma) |
| T28 | note | Enforcement is voluntary; output format |

## 1. Gate run, every result explained

`node tools/check.mjs` on the untouched unzip: 8 ok, 1 FAIL, exit 1.

| # | Result | What it actually examined | Verdict |
| --- | --- | --- | --- |
| 1 | ok undefined tokens | 538 `var(--x)` references across 9 CSS files | true, with holes (T10) |
| 2 | ok colour literals | 8 shipped files (sheet.css exempt); only `color.wire.css` holds hex | true for hex/rgb/hsl/oklch; blind to named colours and `url()` contents (T06) |
| 3 | ok AI tells | gradients, `blur(`, `backdrop-filter`, `text-shadow`, shadow blur, first family of `--font-sans` | true; allows the 4 "flat" two-identical-stop gradients that paint the notch (card.css:445-449) and all gradients in wire.css |
| 4 | ok line/radii | `border*`/`outline` px literals in 8 files; `border-radius` roles in components+wire only | true, narrow (T08) |
| 5 | ok motion | `transition`/`animation`/`@keyframes` in components+wire only, `GATES.motion=false` | true; no motion exists anywhere in the shipped CSS |
| 6 | ok layering | `.wf-*` in components, `--grey-N` outside the colour file | true |
| 7 | **FAIL** `.card-inner`, `.card-face` in README.md:104 | 396 backtick spans in STYLE.md+README.md: 120 checked as tokens, 69 as classes, 207 not checkable | **unzip artefact**, see below |
| 8 | ok markup | 625 class names in index.html | true, narrow (T11) |
| 9 | ok contrast | 21 pairs evaluated, 0 skipped | true for the wire greys; see T01, T13 |

The FAIL: check.mjs:224-227 reads `../styles.css` (the flashcards app, absent in the unzip) inside `try { } catch {}` to build an allow-list of the app's class names. With a 3-line stub `styles.css` (`.card{} .card-inner{} .card-face{}`) placed one level up, all 9 pass (reproduced: `gate-fuzz/baseline-stub`). This is an artefact of unzipping, but the coupling behind it is a genuine defect (T04): the library's gate silently depends on a file outside the library, and swallows the error.

Tightest margins in the passing run (recomputed independently in Python, matches the gate): soft ink 72% mix on tone-6 = 4.80 (limit 4.5), ink-faint on paper 3.45 (limit 3), ink on tone-6 = 8.40.

## 2. Breaking the gate (fuzz)

Harness: `gate-fuzz/fuzz.mjs` copies the design folder, applies one mutation, runs `check.mjs`, records which checks fail. Three passes: `cases-main.json` (159 cases: 146 violations, 12 legit snippets, 1 parser sanity case), `cases-fp.json` (24 legit snippets), `cases-hyg.json` (19 hygiene rules). Raw output: `fuzz-out-main.txt`, `fuzz-out-fp.txt`, `fuzz-out-hyg.txt`, `fuzz-results-*.json`.

### 2.1 Tally (pass 1: 146 violations, 12 legit)

| Gate | Violations fed | Caught | Missed | Legit snippets wrongly flagged |
| --- | --- | --- | --- | --- |
| 1 undefined tokens | 9 | 4 | 5 | 0 of 2 |
| 2 colour literals | 25 | 12 | 13 | 2 of 3 |
| 3 AI tells | 28 | 18 | 10 | 1 of 2 |
| 4 line and shape | 16 | 8 | 8 | 2 of 4 |
| 5 motion order | 10 | 4 | 6 | 0 |
| 6 layering | 5 | 3 | 2 | 0 |
| 7 doc drift | 10 | 2 | 8 | 0 |
| 8 markup classes | 10 | 3 | 7 | 1 of 1 |
| 9 contrast | 24 | 7 | 17 | 0 |
| last declaration without `;` | 9 | 3 | 6 | 0 |
| **Total** | **146** | **64 (44%)** | **82** | **6 of 12** |

Some misses are by design or outside what the README claims. Counting only the 116 cases inside what the README says the gate catches (dropping numbers in prose, HTML inline styles, remote requests, non-border line weights, the `var(--x, fb)` fallback and sheet.css exemption that are by design), the catch rate is 55% (64 of 116). Pass 2: 5 of 24 legit snippets flagged. Pass 3: 0 of 19 hygiene violations caught.

### 2.2 The misses, by root cause

**R1. Declaration regexes require a trailing `;`.** check.mjs:143 (shadow), :151 (`--font-sans`), :156 (`font-family`), :172 (border/outline), :179 (radius), :282 (colour-file declarations) all end in `;`. The last declaration in a block with no semicolon is valid CSS and is what every minifier and many hand-written one-liners emit. Missed: `.x{box-shadow:0 8px 24px var(--ink)}`, `.x{border-radius:12px}`, `.x{border-width:3px}`, `.x{font-family:Inter}`, `.x{--font-sans:Inter,sans-serif}`, `.x{outline:2px solid}`. The same flaw applies to contrast: a colour-file value without a final `;` is never parsed (x22, x23). Hex, `transition`, `text-shadow` do not need `;` and are caught. My first fuzz run reported 88 misses, mostly because my test rules had no final `;`; I fixed the harness (it now adds the `;` for the main pass) and kept the no-semicolon variants as their own cases (n01-n09), because the defect is real.

**R2. Colour literals (gate 2).** Missed: named colours (`red`, `white`, `rebeccapurple`, `lightgray`, inside `color-mix`, `light-dark`, `accent-color`), anything inside `url()` (check.mjs:44 masks the whole `url(...)`, so a data-URI SVG with `fill='rgb(255,0,0)'` or `%23ff0000` is invisible; icons.css itself relies on `%23000`), hex in `index.html` inline `style=""` or `<svg fill="#f00">` (HTML is never colour-scanned), colour inside a custom property such as `--c: navy`. False positive: any id selector that looks like hex, `#add-btn`, `#face`, `#dead`, because `#[0-9a-f]{3,8}\b` matches them.

**R3. Third-party requests.** A remote `@import url(https://fonts.googleapis.com/...)` or a CDN `@font-face` passes all nine checks, although the README sells "no third-party request". Through `bundle.mjs` the remote import crashes with `ENOENT .../css/https:/fonts.googleapis.com/...`.

**R4. AI tells (gate 3).** Missed: blur behind a non-`--shadow-` token (`--elev: 0 4px 12px var(--ink); box-shadow: var(--elev)`), blur with no colour (`0 0 8px`), `filter: drop-shadow(...)`, `filter: url(#blur)`, font via shorthand (`font: 400 1rem/1.5 Inter`), other font tokens (`--font-display: "Space Grotesk"`), defaults not on the deny list (Figtree, `-apple-system`, Segoe UI), translucency via `opacity`, an accent stripe via `inset 4px 0 0` shadow. Caught correctly: `border-left/inline-start: 4px`, gradients in `mask-image` and `image-set()`, `-webkit-` prefixed gradients and backdrop filters.

**R5. Line and shape (gate 4).** Only `border*`, `outline`, `outline-width` are scanned and only in px. Missed: `border: 0.25rem solid`, `border: thick solid`, line weights via `box-shadow: 0 0 0 3px`, `text-decoration-thickness`, SVG `stroke-width` (wire.css:55 already ships `stroke-width: 3.5`, a fourth weight the gate never saw), weights via a custom property, `clip-path: inset(0 round 12px)`. Radius roles are enforced only in `components/` and `wire.css`: `a{border-radius:12px}` in base.css passes. `border-top-left-radius: 12px` is caught by the wrong rule (reported as a border width).

**R6. Motion and layering (gates 5, 6).** Scoped to `components/` and `wire.css` only (check.mjs:192). `transition` or `@keyframes` in `base.css`, `icons.css` or `tokens/` passes. Property names are case-sensitive (`TRANSITION:` passes). `scroll-behavior: smooth`, `view-transition-name` pass. sheet.css is exempt from 6 as well as 2-5 (README:134 and check.mjs:20 say 2-5). `--grey-N` is the only forbidden primitive; a component reading `--radius-2` inside `clip-path` passes.

**R7. Token definitions (gate 1)** (T10 below): phantom tokens from selector tails, `--_private` tokens invisible, tokens defined only in unshipped sheet.css count as defined, one fallback use legalises every bare use.

**R8. Markup (gate 8).** Scans `class="..."` with double quotes in `index.html` only. Missed: single quotes, unquoted, `el.className=`, `classList.add()`, backtick templates, a second HTML page (`components.html`), invalid `data-tone="9"`, a defined class used in the wrong context (`class="card__bar card__foot"` on a div). False positive: template placeholders like `class="{{cls}}"`.

**R9. Doc drift (gate 7).** Checks only backticked spans that are exactly `--token` or exactly `.class`; 207 of 396 spans are uncheckable by construction. Missed: compound selectors (`.card .ghost`), tokens with a capital (`--space-N` is silently skipped, so is `--Ghost-N`), fenced code, and every number (changing `--hit` from 44px to 48px, a hex in the grey table, the contrast table, "22 to 32px", "360 to 1440px" all pass). The other direction (CSS to docs) is unchecked: 41 of 120 shipped tokens never appear in STYLE.md/README.md (some are covered by range notation such as `--space-N`; about 25 are genuinely undocumented: `--card-bar-bg`, `--card-ink-soft`, `--icon-*`, `--ring-offset-in`, `--shadow-lift`, `--shadow-stack`, `--ratio-*`, `--lh-*`, `--ls-*`).

**R10. Contrast (gate 9)** (T01, T02, T13 below).

### 2.3 False positives (legit code the gate rejects)

| Snippet | Why it is legit | Flagged by |
| --- | --- | --- |
| `border-radius: calc(var(--radius-card) - var(--bw))` | the standard inner-radius formula | gate 4 roles regex (check.mjs:167) |
| `border-radius: 0 0 var(--radius-card) var(--radius-card)` | per-corner shorthand of a role | gate 4 |
| `linear-gradient(90deg, var(--ink) 0 50%, var(--paper) 0)` | flat hard-stop fill (the normal way to build a Meter or segmented bar) | gate 3 (only identical 2-stop gradients are "flat") |
| `font-family: inherit` | form-control reset | gate 3 (must start with `var(`) |
| `border-spacing: 0 8px` | table row spacing, not a border | gate 4 (`border*` prefix) |
| `box-shadow: 4px 4px 0rem var(--ink)` | zero blur | gate 3 (`^0(px)?$` only) |
| `transition: none`, `animation: none` | reset, not motion | gate 5 |
| `#add-btn{}` | id selector | gate 2 |
| `class="{{cls}}"` in a script template | placeholder | gate 8 |

The first three will be hit by the next elements (nested radii for any control inside a card, Meter, Field, Data table).

## 3. Contrast check correctness (question 2)

What works: hex (3 and 6 digit), `rgb()` comma and space syntax, `oklch()` with `%` lightness and `deg`. The oklch to sRGB conversion was tested against 180 Chromium-rendered samples (6 L x 5 C x 6 h, including out-of-gamut chroma 0.25): max channel difference 1. The relative-luminance and ratio formulas are correct. The 72% mix (`Math.round(v*pa + b*(1-pa))` in sRGB) is identical to `color-mix(in srgb, ...)`. Out-of-gamut values clip identically to Chromium's paint path (verified by screenshot pixels).

What does not work, all verified in `gate-fuzz`:

| Input in the colour file | Gate behaviour |
| --- | --- |
| `light-dark(a, b)` (README step 5) | pair skipped, exit 0. Simulated handover: "ok contrast (skipped 15 pair(s) ...)", "All 9 checks pass" |
| `color-mix(...)`, `hsl()`, named colours, `color(...)`, `oklab()`, `var(--x, fallback)`, 8-digit hex, `#rgba` | pair skipped, exit 0 |
| `rgb(0 0 0 / .25)`, `oklch(... / .25)` | alpha dropped, parsed as opaque: 18.4:1 "pass" on a 25% ink (no skip note either) |
| `oklch(0.5 0.1 0.5turn)`, `3.14rad` | unit ignored: gate computes `[144,73,96]`, browser paints `[0,117,101]` (silent mis-parse); `40%` chroma and `none` are skipped |
| a dark block (`@media (prefers-color-scheme: dark){:root{--ink-soft:...}}`, `[data-theme=dark]`) | check.mjs:282 flattens all declarations, last wins: dark values replace light ones, light is never checked (x17, x18, x22) |
| `color.css` copied next to `color.wire.css` (README step 1 says "copy") | both files are read, `walk()` returns them alphabetically, `color.wire.css` is last and wins: a white-on-white `color.css` passes all 9 (x12) |
| final declaration without `;` | not parsed; the pair silently uses the previous/undefined value (x23) |
| `--focus`, `--accent` | only `--focus` on canvas and `--on-accent` on `--accent` are tested; no other surface |

The end of `pair()` (check.mjs:293) does `skipped.push(label); return;` and check.mjs:314 turns that into a note next to an "ok". A skipped pair is treated as a pass.

### 3.1 Would it check the pairs a real component uses?

Of the 12 foreground/background cases card.css actually uses (rows below), the gate covers 2 fully, 3 partially and 7 not at all.

| Pair in card.css | Gate |
| --- | --- |
| `--card-ink` on paper / on tone-N / on ink (bar, inverted card) | checked; threshold 4.5 on tones (target 7) |
| `--card-ink-soft` (72% mix) on tone-N | checked at 4.5; result 4.80 to 6.76, **fails 7:1 on every tone** |
| `--card-ink-soft` on paper (the default card, 7.34) | **not checked** |
| `--card-ink-soft` on an inverted card (paper mix over ink, 9.81) | **not checked** |
| ghost text: mix computed against `--card-bg` (paper) but painted on the page canvas (6.67) | **not checked**; the mix is against the wrong background |
| `--accent` fill against `--card-bg` / tone / canvas (non-text 3:1) | **not checked**. `--accent:#c7c7c7; --on-accent:ink` passes: fill is 1.7:1 on paper (x16) |
| `--fill` between 0 and 1 (mid-transition colours once gate 4 animates it) | not checked, will matter at gate 4 |
| focus ring `--focus` vs canvas | checked (16.75) |
| in-card ring (`--focus` / `--card-bar-ink` / `--card-ink`) over paper, tone-N, bars | **not checked**. `--focus:#6e6e6e` passes (4.6 on canvas) and is 2.3:1 on tone-6 where the in-card ring lands (x14). Real instance: the inverted card's bar ring is white on white (T14) |
| `--ink-faint` disabled text on tone-N | checked only on paper (3.45). On tone-1 it is 2.90, on tone-6 1.57. Exempt from 1.4.3 but the brief wants legible states |
| `--ink-faint` as future placeholder text | gate comment says "disabled, 3:1"; a Field placeholder needs 4.5 and this is 3.45 |
| `--line-soft` decoration on tones | not checked (2.31 on tone-3), decorative |

Soft ink arithmetic, for the colour handover: to reach 7:1 on the darkest wire tone (`#afafaf`) the ink mix has to be 90% or more (7.08 at 90%), at which point "soft" ink is nearly indistinguishable from ink. A runtime mix cannot deliver a visible secondary tier at 7:1 on mid-tone fills; the tone ramp must be lighter or secondary text must be an explicit per-tone role (corroborates render audit D02).

Will it survive gate 3? Only if the palette is authored as plain `#hex`/`rgb()`/`oklch()` per role, light only, with no dark block, no alpha, `color.wire.css` deleted, and every value ending in `;`. The README's own step 5 breaks the first condition.

## 4. bundle.mjs and dist/ (question 3)

| Check | Result |
| --- | --- |
| Rebuild into a scratch copy and diff | `dist/flashcards.css` (32,996 B) and `dist/style-sheet.html` (233,645 B) **byte-identical** to the shipped ones; deterministic (no timestamp, no hash) |
| `@import ... layer()` inlined as `@layer x { ... }` | yes; order `@layer tokens, base, components, wire, sheet;` first, then unlayered `@font-face`, then layers in import order. `@property` inside a layer block is valid |
| Minified | **no**. 38% of the bytes are comments (12,386 of 32,996). Naive minify: 17.5 KB raw, 4.5 KB gzip vs 9.5 KB gzip as shipped |
| What is in it | tokens, base, icons, **card**, and the disposable **wire** kit; the `sheet` layer name is declared although nothing is in it. No per-element files, no version or date in the banner |
| Single-file HTML offline | yes. Loaded `file://` with the network disabled: 0 requests outside `file:`/`data:`, `Archivo` loaded from the data URI, width axis works (75%: 221 px, 100%: 281, 125%: 356), swatches print 16.7 to 8.4, 12 Markup panels built. `index.html` itself also works from disk |
| Font URL correct | only in place. `dist/flashcards.css` says `url("../fonts/archivo-latin-var.woff2")`. It resolves correctly because `dist/` and `css/` are both one level deep. Copy the single file to `public/assets/` (what "the one file an app links" invites) and the font 404s, `document.fonts` = `Archivo:error`, text silently falls back to Helvetica Neue (reproduced in `gate-fuzz/consumer`) |
| Robustness | see below |

Silent failure modes (each reproduced, `gate-fuzz/bundle-b1..b6`):

* `@import "components/button.css" layer(components);` (string form) is not matched by the regex (bundle.mjs:29) and stays in `dist/flashcards.css` as a live `@import` relative to `dist/`. Exit 0.
* `url()` is rebased only for `../fonts/*.woff2` (bundle.mjs:39). A component with `url("../img/pattern.png")` is resolved from `css/components/` in source and from `dist/` in the bundle.
* `<link href=".." rel="stylesheet">` (attribute order swapped) is not matched; the leftover check (bundle.mjs:61) uses the same pattern so it cannot notice. Exit 0, dist page references `css/sheet.css`.
* An external `<script src>` is left as is: the "single file you can email" quietly stops being self-contained.
* A remote `@import` crashes with a mangled ENOENT path.
* `check.mjs` does not verify dist freshness: after editing card.css, `check.mjs` still prints "All 9 checks pass" and `dist/` lacks the new rule. There is no `bundle.mjs --check`.

## 5. README / STYLE / index.html agreement (question 4)

Verified true (so the silence is trustworthy): grey ramp hexes (11), role table, all type sizes and clamps, space scale, line/shape/hit/ring values, the nine anatomy parts, five icon glyphs, font 90 KB and axis ranges (wght 100-900, wdth 62-125, read with fontTools), the contrast table (18.4/16.7/15.5/13.8/12.3/10.9/9.6/8.4 recomputed), soft ink worst case 4.8, stack/notch defaults, `--card-pad` formula, Row breakpoint 18rem, hover movement -2/-2 and 4px shadow (measured), ten variants and six states as listed in the index, no horizontal overflow at 320/360/390/768/1440.

Disagreements (each verified):

| # | Claim | Reality | Evidence |
| --- | --- | --- | --- |
| D1 | `.t-meta` "Soft ink" (STYLE.md:99, index.html:154) | `.t-meta` has no colour; computed `rgb(20,20,20)` = full ink. Only `.card__meta` is soft | base.css:118-121, measured |
| D2 | Hover "only where `(hover: hover)`" (STYLE.md:311) | `.card__action:is(:hover,...)` (card.css:296) and `.card--ghost:is(:hover,...)` (:538) are ungated. Under `hover:none` the ghost flips dashed to solid and the notch action fills | measured, `tool-hover.mjs` (corroborates render D18) |
| D3 | "Keyboard and pointer get the same lift" (index.html:837); Focus row says `--lift 1` for ghost (STYLE.md:312) | ghost keyboard focus sets only `--fill`; `--lift` stays 0, pointer hover gives 1 (4px hard shadow) | card.css:534-536, measured |
| D4 | "Every target is at least 44px: ... the foot" (STYLE.md:340) | the foot row is 44px but only the link inside is clickable: 30x24 and 53x24 px. Same section admits "at least 24px tall" (:341) | measured at 390px |
| D5 | Selected = `[aria-selected="true"]` (STYLE.md:314, card.css:551) | invalid on an `<article>`: axe `aria-allowed-attr` (corroborates render D03) | `tool-ghost-axe.mjs` |
| D6 | "Holds from 360 to 1440px" (README.md:47, index.html:1168) vs "from 320px up" (STYLE.md:335) | both cannot be the exit check. Measured page overflow: none at 320 | `tool-claims.mjs` |
| D7 | Gate 3: "The diff touches `tokens/` only" (README.md:49, index.html:1182) | README.md:99 lists `tokens/`, `flashcards.css`, `STYLE.md`, page prose; step 5 (:95) needs `color-scheme`, which lives in base.css:14 | see T03 |
| D8 | sheet.css "exempt from 2 to 5" (README.md:134, check.mjs:20) | code exempts it from 2 to 6 (`shipped` excludes it everywhere except 1, 7, 8, 9) | check.mjs:52 |
| D9 | "Each one replaces a placeholder the cards are using today" (index.html:1203); "Tag and Meter replace placeholders the card uses today" (README.md:66) | `.wf-pill` (Tag's placeholder, wire.css:92, STYLE.md:392) is used nowhere; Field, Nav bar, Frame replace nothing | grep |
| D10 | Focus ring on an inverted card is `--card-ink` (STYLE.md:343) | on the bar control of an inverted card that is paper on a paper bar: invisible (T14) | screenshot |
| D11 | "Never put `cqi` on `.card` itself" (STYLE.md:235, card.css:12) | `--card-pad: clamp(1rem, 5cqi, 1.5rem)` is declared on `.card` (card.css:38). Works only because unregistered custom properties substitute at the use site; register it like `--lift`/`--fill` and it resolves against the parent container | card.css:38 |
| D12 | Browser floor "Chrome/Edge 114+, Safari 16.4+, Firefox 128+" (STYLE.md:376) | README step 5 requires `light-dark()` (Chrome 123, Safari 17.5, Firefox 120, from knowledge, not tested here) | README.md:95 |
| D13 | "ten variants" (STYLE.md:403, index.html:421) | STYLE variants table has 11 rows (Square is a modifier); States table has 7 rows (Forced colours) | minor |
| D14 | `--measure` documented (STYLE.md:115); `.wf-pill`, `ic--close` defined | `--measure`, `--dur-*`, `--ease-*`, `--space-0/9` are declared and never read; `.wf-pill` and `ic--close` never used in the sheet | script |

Live swatches (the gate-3 exit check per README:49) show 9 swatches: canvas, paper, ink, tones 1-6. No accent, on-accent, ink-soft, ink-faint, focus or line swatch, and no soft-ink mix, dark mode, or status colour. "None may read FAIL" (README:97) therefore certifies about a third of what the gate itself lists.

## 6. The pipeline as a process (question 5)

### 6.1 What works

* Naming what each gate may not touch is the best idea in the repo; it is what keeps wireframe honest.
* "If the colour handover changes a component, colour leaked into the wireframe" is a testable rule and a good one.
* Specimens print their own markup from the live DOM (12 `data-sg-code` blocks), so usage examples cannot drift from the demo.
* `check.mjs` is 327 lines of zero-dependency Node that an agent can read and extend; errors carry file:line.
* Doc-drift check exists at all (it found the only red result, correctly, in the sense that a doc names something not in scope).

### 6.2 What will not scale to 40+ elements, with the concrete change for each

| # | Problem (evidence) | Change that keeps the spirit |
| --- | --- | --- |
| S1 | **Global flags on a per-element pipeline.** `GATES = { motion: false }` (check.mjs:31) is one boolean. The day Card opens gate 4, every other element at gate 1 may add `transition` unnoticed. Same for colour: the handover swaps one file for all, so "greys only" is impossible for element #2 once element #1 is coloured | Per-element declaration in the component file header, `/*! element: button | gate: 1 | needs: - */`. `check.mjs` enforces each file at its own gate. Keep `color.wire.css` alive as a lens (`[data-lens="wire"]` remaps roles to greys) so every later element can still be squint-tested greyscale after the handover |
| S2 | **Status table is prose, in three places** (README status table, index.html §7 table, STYLE.md changelog) and ticks have no evidence. Gate 1 "holds from 360 to 1440" and gate 2 "keyboard pass" are manual; nothing records that they happened. One row per element cannot say "Notch has no selected state, Ghost no pressed state" (STYLE.md:296 admits it in prose) | Generate the status table and index §7 from the element headers. Replace one tick with a variants x states matrix (Y / N / n-a with reason). Store evidence per gate under `evidence/<element>/gate-N/` (screenshots, axe JSON, tab-order log), produced by one command |
| S3 | **Gate order and shared tokens.** Colour (gate 3) and motion (gate 4) are global concerns performed "per element". After the handover, what does "Button gate 3" mean? There is no distinction between "sets the palette" (once) and "reviews this element in colour" (every element) | Define gate 3 twice: 3a palette (once, touches `tokens/`), 3b element colour review (per element, must not touch `tokens/` except through a proposal). Same for 4a motion tokens (once) and 4b element motion |
| S4 | **Element dependencies are invisible.** README:65 says Button first because `.card__ctl`/`.card__action` are "slots waiting for it". Card has bespoke circle/box styling for both today (card.css:106-131, 281-298) and uses `.wf-meter`; it cannot reach gate 5 (freeze) before Button, Tag and Meter land, yet the table suggests it is 3/6 done | `needs:` in the header; freeze requires every dependency at gate 2 or better and a slot contract test (Button renders inside `.card__ctl`). Replace bespoke slot styling by the real element before freezing Card |
| S5 | **Token proposals have no route.** STYLE.md says "don't invent new ones... say so" but there is no place to say it, no tiering, and gate 1 accepts any definition anywhere (`--card-*` component props sit in the same namespace as roles). Button will need press scale and pressed shadow, Field needs invalid and placeholder, Toast needs status colours | Three tiers enforced by the gate: primitives (colour file only), roles (`tokens/`, documented, with contrast pairs), component-private (`--_name` or `--<element>-*`, never documented, never read from another file). New role = entry in `tokens/REGISTRY` (name, tier, owner element, pairs), reviewed separately from the element |
| S6 | **Colour handover versus later elements.** The gate's pair list is hard-coded in check.mjs:298-313 for Card (6 tones, one accent). Status colours (success/warn/danger) for Tag, Meter, Toast, Field errors have no slot; "tone = rhythm, never meaning" (STYLE.md "Do and don't") leaves no sanctioned way to show meaning, and the Never-colour-only rule needs an icon+text contract | Put pairs next to the tokens, in the colour file: `/* @pair --on-accent on --accent 7 */`. The gate reads them, so an element adds its pair with its role. Add semantic roles (`--status-ok/warn/danger/info` + on-) at the handover with a mandatory icon. Verify in a browser per scheme (see 6.4), not by regex |
| S7 | **STYLE.md is one 21.7 KB file with Card baked into the foundations.** §2 says "inside a card the ring's offset drops to 2px", "inside a card title and figure sizes come from cqi", "soft ink inside a card is color-mix"; foundation.css carries `--ring-offset-in` ("inside a card, which clips"). The radius roles are named `card`, `tile`, `ctl` and the gate hard-codes them (check.mjs:167). Numbered sections (`## 3. Card`, `## 4. Wireframe kit`, `## 5. Changelog`) renumber every time an element is added, and index.html cross-refs "§3", "§7". "Read this before touching UI" at 40 elements at Card density would be roughly 500 KB | `STYLE.md` = rules + foundations only (under 10 KB, no element names). `elements/<name>.md` from a template with mandatory headings (Job, Slots, Variants x States, Anatomy, API, A11y, Known limits, Tokens used). "Tokens used" generated from the CSS. Unnumbered anchors. Radius roles derived from the `--radius-*` declared in `foundation.css`, not hard-coded. Foundation edits only in a foundation change |
| S8 | **Versioning and freeze.** "v0.1" is typed by hand in STYLE.md:3, STYLE.md:403, index.html:31 and the footer; nothing compares them; dist banner has no version. "Freeze: nothing new" has no answer to "a bug after freeze" or "a breaking rename" | One `VERSION` file read by check, bundle (banner) and index. Freeze = content hash of the element's CSS + section stored in its header; check fails if the hash changes without a version bump and changelog line. Define patch / minor / major for CSS (class rename = major) |
| S9 | **Naming collision is a blocker for element #2.** `.card`, `.ic`, `.sr-only`, `.is-*` are unprefixed globals; README.md:111 leaves "the prefix" open while `check.mjs` uses the app's class list as an allow-list (inverse of a collision check) | Decide the prefix now. Gate: every class in shipped CSS must match the prefix (or a short documented exemption list); the foreign-CSS check must fail on collision, not exempt |
| S10 | **One page, one element.** index.html is 59.8 KB for Card (the `<h1>` says Cards, gate 8 scans only this file); sheet.css is 20.7 KB of chrome, larger than card.css | One page per element from a shared template (`sg` chrome separate from element specimens); gate 8 and the browser pass run over all pages |
| S11 | **Shipping weight.** `dist/flashcards.css` is the entire library, unminified, wire kit included. Card alone is 9.5 KB gzip | Per-element outputs plus `all.min.css`; strip comments; size budget in check; `wire` layer only in the docs bundle |
| S12 | **Enforcement is voluntary.** No hook, CI, or `npm test` equivalent. The README says "Run check.mjs"; it does not say the bundle must be rebuilt. | `tools/ci.mjs` runs check, `bundle --check`, and (optional) the browser pass; a 5-line pre-commit hook; exit codes distinguish FAIL from SKIPPED |

### 6.3 Which rules have a gate behind them

Owner's seven rules: 1 (two weights) partial (R5); 2 (flat) partial (R4); 3 (rectangles/circles) partial (radius roles only); 4 (uppercase is structure) none; 5 (real copy) none, and it is one regex away (`lorem`, `John Doe`, `seamless`; h17 was missed); 6 (colour is a swap) partial (R2); 7 (no decoration) none. Publish this map in the README so "the gate is clean" is not read as "the sheet complies".

### 6.4 Improvements that keep zero-dependency as the default

1. **Keep `check.mjs` static and zero-dep, but fix R1 to R9** (parse declarations with a small tokenizer instead of `[^;]+;` regexes, scan values for named colours, scan all file types including HTML, scope rules by token tier not by file name, make SKIP a failure unless `--allow-skip`, read the colour file that `flashcards.css` actually imports, evaluate each theme scope separately).
2. **Add an optional browser pass** (`tools/check-browser.mjs`, Playwright, same as the repo's existing tests) for what a static pass cannot see: computed-style contrast for every text node on every tone x scheme (kills T01/T13 at the source and needs no colour parser), focus ring contrast and visibility per focusable, target size (44), overflow at 320/360/1440, 200% text, forced colours, hover-none behaviour, axe. The ink-bar ring (T14), soft ink 7:1, 24px foot links, and sticky hover would each have failed it on day one. Gates 1, 2 and 4 exits should be "this command is clean and its evidence folder exists".
3. **Keep the owner's gate order**, but make each gate's "not yet" list executable (per-element header, S1).

## 7. What is Flashcards-specific in the tooling (to genericise)

| Where | Hard-coded |
| --- | --- |
| check.mjs:31 | one global `GATES.motion` |
| :48 | colour file named `tokens/color*.css` |
| :55, :245 | only `index.html`, and only `class="..."` |
| :129 | font deny-list; only `--font-sans` checked (:151) |
| :167, :172-183 | radius roles `card|tile|ctl|pill|--card-radius`; only px borders |
| :209, :212 | `.wf-*` and `--grey-N` |
| :224-227 | `../styles.css` (the flashcards app) |
| :230 | `STYLE.md`, `README.md` by name |
| :298-313 | 21 pairs for Card, `n <= 6` tones, the 72% constant duplicated from card.css:34 |
| :324 | 12-problem truncation, no JSON output |
| bundle.mjs:29, :39, :56, :61 | string-form `@import` unsupported; fonts only at `../fonts/*.woff2`; `<link rel="stylesheet" href>` exact attribute order |
| naming | `flashcards.css`, `style-sheet.html`, "Cards" in `<title>`, hero and `<h1>` |

## 8. Defect versus unzip artefact

| Item | Class |
| --- | --- |
| `check.mjs` exit 1 for `.card-inner`, `.card-face` | artefact (missing `../styles.css`); the silent `catch {}` and allow-list direction are genuine (T04) |
| Commands written as `node design/tools/check.mjs` (STYLE.md:12, README.md:8) and footer "Spec: design/STYLE.md" | artefact of the folder name; fine inside the app repo |
| `README.md` migration section about `../styles.css`, `.card` collision | describes the app; not a defect of the sheet |
| Everything else in this report | defects of the sheet, reproduced inside the unzip or a copy of it |

## 9. Reproduction index (`scratchpad/audit-work/`)

* `gate-fuzz/gen-cases.mjs`, `gen-cases2.mjs`, `gen-cases3.mjs` (case definitions), `fuzz.mjs` (runner), `cases-*.json`, `fuzz-results-*.json`, `fuzz-out-*.txt`, `cases/<id>/` (each mutated copy).
* `gate-fuzz/baseline-stub`, `baseline-nostub` (gate with and without `../styles.css`), `check-instrumented.mjs` (counts per check).
* `gate-fuzz/handover` (README steps 1 to 8 applied with `light-dark()`), `tool-dark.mjs`.
* `gate-fuzz/bundle-rebuild`, `bundle-b1..b6`, `consumer`, `sheet-scope`, `selbug`.
* `tool-offline.mjs`, `tool-consumer.mjs`, `tool-oklch.mjs`, `tool-oklch2.mjs`, `tool-turn.mjs`, `tool-claims.mjs`, `tool-hover.mjs`, `tool-ghost-axe.mjs`, `tool-inkfocus.mjs`, `tool-inkshot.mjs`, `tool-axe-page.mjs`.
* Screenshot: `gate-fuzz/shots/bar-focus-compare.png` (top: plain card, white ring on ink bar is visible; bottom: inverted card, ring not visible on the paper bar).

Limits: Chromium only. No Safari/Firefox/VoiceOver. Browser-support numbers in D12 are from memory. The fuzz counts measure this gate's regexes, not the quality of the CSS.
