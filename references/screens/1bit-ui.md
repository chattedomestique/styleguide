# Analysis: jcontini/1bit-ui (Svelte 5, strict two-colour "1-bit" UI)

Analyst: read-only with respect to `/home/user/styleguide`. Nothing under that path was created or modified.
Repo read: `/tmp/claude-0/-home-user-styleguide/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/scratchpad/refs/1bit-ui` (HEAD `7243db0`, 2026-01-18, single commit visible, shallow clone).
Everything in `src/lib/theme.css`, all 15 components in `src/lib/components`, `src/routes/+page.svelte` (798 lines), `README.md`, `package.json`, `src/lib/index.ts`, `src/app.html` and the three bundled fonts was read.

Evidence labels used throughout:
- **[S]** read directly from source (file:line given).
- **[M]** measured by running the library in Chromium (playwright-core + /opt/pw-browsers chromium, axe-core 4.13, PIL/numpy/fontTools). Scratch copy with `npm ci` lives at `.../scratchpad/analysis/1bit-work` (I added two throw-away routes, `src/routes/harness` and `src/routes/dither`, only there; the clone in `refs/` is untouched). Scripts: `.../scratchpad/analysis/1bit-work-scripts/*.mjs|py`.
- **[E]** estimate, inference or guess. Flagged each time.

---

## 0. Verdict in ten lines

1. It is a charming, coherent **retro skin**, not a design system. Two colours, ~22 tokens, 15 components, no semantic layer (no surface/accent/danger/focus/muted roles).
2. Its **best transferable idea** is structural: *one foreground/background pair, dark mode = swap, every state = inversion + a non-colour cue*. That maps neatly onto an optional "mono" theme.
3. Its **accessibility is poor** (my honest score: **3/10**). Native elements are used underneath (good), but 4 of the 7 form controls (Checkbox, Radio, Input box variant, Slider) have **no visible keyboard focus at all** [M], Modal has **no focus management** [M], Tabs/List/ProgressBar carry **no ARIA semantics** [M], Slider/Input have **no accessible name API** [M/S].
4. The LCD palette `#888869` / `#000000` is **5.77:1** either way round [M]. That passes AA for text but leaves no headroom: every `opacity`-based muted/placeholder/disabled state falls under 4.5:1 (0.7 -> 4.03:1; 0.5 -> 2.72:1).
5. **Dither behind text is unsafe**: 49% of glyph pixels vanish on the "50%" checker, 97% on the "75%" pattern [M]. Use dither only as frame/decoration with text on a solid plate (the repo's own clock widget does exactly that, which is right).
6. Dither implementation is defective: labels are wrong (the "25%" is 6.25% ink, "75%" is 93.75%), `bayer` is pixel-identical to `50`, `diag`/`cross` are anti-aliased (5-10 colours), and every pattern hard-codes `#888869`/`#000000` inside a data-URI so **no theme other than LCD/black can recolour them** [M/S].
7. `--1bit-border-width` is a good idea that is only **about two-thirds wired** (8 of 12 control families) (Button/Input/Dropdown/Toggle/Tabs/Panel/Slider/Progress follow it; Checkbox/Radio/Toggle-divider/List-divider are hard-coded 1px) [M].
8. The **bitmap font is only crisp at integer device-pixel ratios**: 9 distinct colours at DPR 1/2/3, but 68 at DPR 1.5, 122 at DPR 2.625 (Pixel phones), 114 at 125% browser zoom [M]. That is a direct conflict with WCAG 1.4.4 (resize text) on mobile PWAs, so a bitmap font must be optional and gated.
9. **Do not copy the packaging**: fonts are referenced by absolute `/fonts/Tamzen.ttf` but are not in the npm tarball (35 files, 11.2 kB) [M]; there is no LICENSE file though MIT is claimed; two unused fonts (552 kB) with different licences ship in `static/`.
10. **Copy ideas, not code.** Our deliverable is vanilla HTML/CSS/JS with no build step; nothing here is reusable verbatim.

---

## 1. Token organisation (Q1)

### 1.1 Verbatim token list (`src/lib/theme.css`)

Light / default (`:root`, theme.css:13-67):

```css
--1bit-bg: #888869;              /* :15  "classic LCD green" */
--1bit-fg: #000000;              /* :16 */

--1bit-font: 'Tamzen', 'SF Mono', 'Monaco', monospace;   /* :19 */
--1bit-font-size: 16px;          /* :20 */
--1bit-line-height: 1.4;         /* :21 */

--1bit-spacing-xs: 2px;          /* :24 */
--1bit-spacing-sm: 4px;          /* :25 */
--1bit-spacing-md: 6px;          /* :26 */
--1bit-spacing-lg: 8px;          /* :27 */

--1bit-border-width: 1px;        /* :30  (README.md:83 says 2px - mismatch) */
--1bit-border-thick: 2px;        /* :31 */

--1bit-corner-cut-sm: 4px;       /* :34 */
--1bit-corner-cut-md: 8px;       /* :35 */
--1bit-corner-cut-lg: 12px;      /* :36 */

--1bit-dither-25:     url("data:image/svg+xml,...4x4, fill %23888869, 1 black px...");    /* :45 */
--1bit-dither-50:     url("data:image/svg+xml,...2x2 checkerboard...");                   /* :48 */
--1bit-dither-75:     url("data:image/svg+xml,...4x4, fill %23000000, 1 LCD px...");      /* :51 */
--1bit-dither-hlines: url("data:image/svg+xml,...1x2...");                                /* :54 */
--1bit-dither-vlines: url("data:image/svg+xml,...2x1...");                                /* :57 */
--1bit-dither-diag:   url("data:image/svg+xml,...4x4 <path> diagonal polygons...");       /* :60 */
--1bit-dither-bayer:  url("data:image/svg+xml,...4x4, 8 rects...");                       /* :63 */
--1bit-dither-cross:  url("data:image/svg+xml,...4x4 two <line> diagonals...");           /* :66 */
```

Dark (`.dark, [data-theme="dark"]`, theme.css:70-90):

```css
--1bit-bg: #000000;   --1bit-fg: #888869;     /* :71-72  pure swap */
/* + all 8 --1bit-dither-* re-declared with the two hexes swapped (:75-89) */
```

Utility classes (theme.css:115-122, 129-145): `.dither-25|50|75|hlines|vlines|diag|bayer|cross` (each sets only `background-image`), `.onebit` (font + colours + `image-rendering`), `.pixel-corners` + `-sm|-md|-lg` (chamfer via `clip-path: polygon`).

Tokens that components use but that are **not declared**: `--corner-cut` (local, set per component with literals 2-4px), `--inner-cut` (TabPanel:90), `--scale/--width/--height` (Screen:15). Count: **22 declared tokens** (2 colour, 3 type, 4 space, 2 border, 3 corner, 8 pattern).

### 1.2 How it is organised - assessment

| Aspect | What 1bit-ui does | Verdict |
|---|---|---|
| Layers | Flat. One tier of "primitive = semantic" (`bg`, `fg`). No surface / on-surface / accent / danger / success / warning / info / focus / disabled / muted / scrim roles. | Too thin for a general system. Everything that is not bg/fg is either `opacity` or a hard-coded literal. |
| Light/dark inversion | Dark = swap `bg` and `fg` (theme.css:71-72). Selector `.dark` or `[data-theme="dark"]`. **No** `prefers-color-scheme`, **no** `color-scheme` property. | The swap model is elegant and cheap; the activation is incomplete for a PWA (OS preference ignored; native form controls / scrollbars stay light). |
| Theme swapping | The demo proves any two colours work by writing `--1bit-bg/-fg` inline on `<html>` (+page.svelte:133-141) and ships 5 palettes (Classic LCD `#A8B858`, Amber CRT `#FFB000`/`#2A1A00`, Green CRT `#33FF33`/`#0A3309`, Indigo, Sharp Wizard `#739380`). | Good brand-agnostic proof. But the inline write **bypasses the `.dark` block**, so the dark dither tokens are never used in the demo, and dither data-URIs can never follow a custom palette (they hard-code `%23888869`/`%23000000`). |
| Border width | `--1bit-border-width` (1px default) + `--1bit-border-thick` (2px). | Wired into 24 `var()` uses; `--1bit-border-thick` is used **once** (Modal.svelte:53). See 1.3. |
| Spacing | 4 steps (2/4/6/8). `--1bit-spacing-lg` is used **0** times; xs/sm/md only in Dropdown, Modal, Panel, TitleBar. Every other component hard-codes `4px 8px`. | Token exists, is not the source of truth. |
| Type | One family, one size (16px), one line-height (1.4). Only consumed by the `.onebit` class (theme.css:93-98) - **no component reads `--1bit-font*`**. | No scale. Size is a bitmap-grid constraint (see 6e). |
| Shape | Chamfered corners via `clip-path: polygon(...)`; 3 cut sizes. `.pixel-corners` utility is used by **0** components; the same 8-point polygon is hand-copied **13 times** (Dropdown x2, Modal x2, TabPanel x2, +page x7) on top of the unused utility. | Nice look, terrible mechanism (see 4). |
| Patterns | 8 SVG data-URIs x 2 themes = 16 near-duplicate strings (theme.css:45-66, 75-89). | Not themable; see 1.4. |
| Z-index / motion / breakpoints / sizes | None tokenised. `z-index: 100` (Dropdown:180), `1000` (Modal:47), `1` (TabPanel:86); transitions 0.1s (Toggle:65) and 0.2s (+page:413) hard-coded and not gated by `prefers-reduced-motion`; **zero `@media` rules in the whole repo** (grep) [S]. | Missing layers a generic system needs. |
| Naming | `--1bit-` prefix. A custom-property name starting with a digit after `--` is legal and worked in Chromium, but is unusual and some tooling (older Sass/PostCSS plugins) mishandles it [E]. | Use a neutral prefix in ours. |

### 1.3 Border width as a token [M]

With `--1bit-border-width: 3px` forced on the root: Button, Input, Dropdown, Toggle, Tabs, Panel, Slider track, ProgressBar track all became 3px. **Checkbox box, Radio circle, Toggle divider and List dashed divider stayed 1px**, the slider thumb border squeezed its 12px thumb, and TabPanel's hard-coded `margin: 1px 1px 0 1px` (TabPanel:93) no longer matched. The demo declares a `borderWidth` state (+page:11) and a `.stepper` UI (+page:441-477) that would have driven it, but no markup uses them - the feature was dropped, leaving dead code and a README (`2px`, README.md:83) that disagrees with the CSS (`1px`, theme.css:30).

### 1.4 Dither patterns - measured [M]

Rendered each class on a 96x96 box at DPR 1/1.5/2/3 and counted pixels/colours.

| Class | Name implies | Actual ink (fg) share | Unique colours at DPR 1 / 1.5 / 2 / 3 | Finding |
|---|---|---|---|---|
| `dither-25` | 25% | **6.25%** (1 of 16 px) | 2 / 4 / 2 / 2 | mislabelled |
| `dither-50` | 50% | 50.0% (checker) | 2 / **4** / 2 / 2 | at DPR 1.5, 44% of pixels become a mid-grey `#444435` (resampling mush) |
| `dither-75` | 75% | **93.75%** (15 of 16) | 2 / 4 / 2 / 2 | mislabelled; nearly solid |
| `dither-hlines` | - | 50% | 2 / 3 / 2 / 2 | at 1.5: one third mid-grey `#66664f` |
| `dither-vlines` | - | 50% | 2 / 3 / 2 / 2 | same |
| `dither-diag` | - | n/a (anti-aliased: ~25% black + mid-greys at DPR 1) | **5** / 9 / 5 / 5 | anti-aliased greys (`#444435`, `#4a4a3a`, `#3e3e30`) - **not 1-bit** |
| `dither-bayer` | "Bayer 4x4" | 50% | 2 / 4 / 2 / 2 | **pixel-identical to `dither-50`** (rows alternate cols 0,2 / 1,3); it is a checkerboard, not a Bayer matrix |
| `dither-cross` | - | 50% at DPR 1 (2 colours), anti-aliased greys at other DPRs | 2 / 6 / **10** / 7 | anti-aliased `<line>` strokes; not 1-bit at DPR 2 |

Take-aways: (1) 1-CSS-px pixel patterns are only exact at integer DPR; (2) any SVG diagonal is anti-aliased; (3) colours baked into data-URIs mean the tokens are not really tokens.

---

## 2. Component-by-component accessibility audit (Q2)

Method: read source; `axe-core` 4.13 (tags wcag2a/2aa/21a/21aa/22aa + best-practice) on the shipped demo at 1280 and 390 wide and on my harness route; keyboard walk (40 Tab presses, focus/blur screenshot diff at DPR 2 restricted to the ring+border band so text antialiasing noise is excluded); `ariaSnapshot()` for role/name; bounding boxes for target size; forced-colors emulation; touch emulation.
Score = 0 (blocking barrier) .. 10 (exemplary). WCAG refs: 2.4.7 Focus Visible (AA), 2.4.13 Focus Appearance (AAA in final 2.2), 2.5.8 Target Size Minimum 24px (AA), 2.5.5 Enhanced 44px (AAA), 4.1.2 Name/Role/Value, 1.3.1, 3.3.2, 1.4.1, 1.4.3, 1.4.10, 1.4.11.

### 2.1 Summary table

| Component | Focus visibility | Keyboard | Role / name / state | Target size (CSS px) [M] | Disabled | Forced-colors / reduced motion | Score |
|---|---|---|---|---|---|---|---|
| **Button** | UA default ring only (Chrome: 1px `auto` `#101010`); not themed; diffs 1288-2344 device px | native | native button; `type` absent -> **submits forms** [M]; `icon` variant has no aria-label requirement | default 74x26 (ok 24, <44); small **50x18 (<24)**; icon 28x28 | `opacity:.5`, `cursor:not-allowed`, native `disabled` | hover==active (no pressed state); **sticky inverted `:hover` after touch tap** [M] | **5** |
| **Checkbox** | **None**: native input is 0x0/opacity 0 (Checkbox:51-56), no `:focus-visible` on the skin; focus/blur diff = **0 px** [M] | Space works (native) | label optional -> unlabeled checkbox has no name (axe `label`, critical) [M]; no indeterminate, no error/describedby | label 158x22.4 (<24); box 18x18 | opacity .5 | check drawn as two rotated 2px bars (anti-aliased, not 1-bit); **check invisible in forced-colors** [M] | **3** |
| **Radio** | **None** (same hidden-input pattern; 0 px) [M] | `name=''` default -> each radio is its own group: **3 Tab stops instead of 1** [M]; excluded from FormData [S] | no fieldset/radiogroup; `checked` prop dead (Radio:3,13) | label 78x22.4; circle 18x18 | opacity .5 | dot invisible in forced-colors [M] | **3** |
| **Toggle** | UA default ring | native button | `role="switch"` + `aria-checked` (best in the lib) but accessible name = **"Off On"** [M]; no label prop | **75x22 (<24)** | opacity .5 | both states identical in forced-colors [M]; 0.1s transition not gated | **6** |
| **Input** | **Box variant: `outline:none`, no replacement -> 0 px** [M] (Input:66-68). Underline: dashed -> solid 1px line only (390 px changed) | native | **no id/name/aria/label/required/autocomplete/inputmode; no prop spread** [S]; placeholder-only labelling; type union limited to text/password/number | box 178x26; underline 160x24 | opacity .5 | underline border vanishes in forced-colors [M] | **2** |
| **Dropdown** | `box-shadow: 0 0 0 1px fg` = border grows 1px->2px (960 px diff) - visible but weak | Enter/Space/ArrowDown open, Arrow wrap, Esc close. **No Home/End, no type-ahead, Tab leaves the list open** [M] | `aria-haspopup=listbox`, `aria-expanded`, `role=listbox/option`, `aria-selected`. **No `aria-controls`, no `aria-activedescendant`, no option ids, no label** [M]; name reads "Option 1 ▼" (glyph not in Tamzen) | trigger 92x26; options ~30 tall | opacity .5 | - | **5** |
| **Slider** | **None** (Slider:109-111 `outline:none`; 0 px) [M] | native range (arrow keys free) | label is a `<span>`, not associated -> `slider: "40"` with **no name** (axe critical) even when `label="Volume"` is passed [M]; no `aria-valuetext` | input 212x16 (<24); **thumb 12x16** [M] | opacity .5 | fill (a `div` background) disappears in forced-colors [M] | **3** |
| **Tabs** | UA default ring | Tab-stop per tab; **ArrowRight does nothing** [M] | no `tablist/tab/tabpanel`, no `aria-selected/controls` [M]; selected = inversion only | 49x24 (ok 24) | - | selected state lost in forced-colors [M]; `$effect` default-tab = blank until after mount/SSR (Tabs:16-20) | **3** |
| **TabPanel** | UA default ring | as Tabs | as Tabs; duplicates Tabs logic, no `onchange`; content not `role=tabpanel`; hover `opacity:.8` lowers contrast (TabPanel:82) | 50x25 | - | as Tabs | **3** |
| **List** | UA default ring | every item a Tab stop (no roving tabindex) | buttons with no `aria-selected/current/pressed` (all empty [M]); `selected` field in type is dead (List:5) | 198x24 (exactly 24; `line-height:1`) | - | selection lost in forced-colors [M] | **4** |
| **Modal** | n/a (nothing gets focus) | **Esc only works if focus is already inside; initial focus = `<body>`; 12 Tab presses never reached the dialog; background not inert; on close focus -> `<body>`** [M] | `role=dialog aria-modal aria-labelledby` ok, but id hard-coded `modal-title` (2 modals -> 2 ids [M]); backdrop is `role=presentation` with click+keydown (svelte-check warns a11y_interactive_supports_focus, a11y_click_events_have_key_events [M]); `showInfo` "ⓘ" is a non-interactive glyph not in the font; no close button | - | - | **982px-tall dialog in a 500px viewport: title at y=-241, OK button at y=709, backdrop `overflow:visible` -> unreachable, no scroll** [M]; real Modal is never rendered by the demo (`showModal` never set true, +page:4,391) | **2** |
| **Panel** | n/a | n/a | title is a `div` (no heading/region); `variant` raised/inset/flat all render identically (empty rulesets, Panel:30-40; svelte-check warns) | - | - | - | **4** |
| **TitleBar** | n/a | n/a | `div/span`, not a heading; `▼` (TitleBar:15) looks like a dropdown but is inert; `rightContent` string-only | - | - | - | **4** |
| **ProgressBar** | n/a | n/a | **no `role=progressbar`, no `aria-valuenow/min/max`, no name** (role null [M]) - invisible to AT; fixed 150x20 | - | - | fill is a `background-color`, so it would vanish in forced-colors (inferred from the same mechanism, not screenshotted) | **1** |
| **Screen** | n/a | n/a | decorative device bezel; "abc/123" labels 6px `#666` on `#1a1a1a` = **3.03:1**, not `aria-hidden` (Screen:26,30,98-99); hard-coded hexes, fixed px x `transform:scale` | - | - | not themeable | **n/a (demo chrome)** |

**Library-level score: 3/10.** Strengths: native `button`/`input[type=checkbox|radio|range]` underneath; Toggle switch semantics; Dropdown roles; state usually carried by *two* cues (inversion + text/shape) so colour-only (1.4.1) is mostly avoided; borders at 5.77:1 pass 1.4.11 in the default theme; essentially no animation; no hover-only information.

### 2.2 What axe found vs what it missed [M]

- Demo `/` @1280: `document-title` (serious), `label` (critical: the Brightness slider), `landmark-one-main`, `region` (18 nodes). Incomplete: dropdown arrow.
- Demo `/` @390: the above **plus** `color-contrast` 4 nodes at **1.83:1** (`#ffb000` on `#ffffff`): the page overflows to 660px wide (scrollWidth 660 vs 390) and the third column sits outside `.page`, whose background is the only themed surface, so raw white `<body>` shows through. Also the Light/Dark toggle is clipped to "D" [screenshot].
- Harness: `label` x3 (unlabeled checkbox + **both** sliders), `color-contrast` 2.58:1 (UA link colour `#0000ee` on `#888869`, the theme has no link style), `document-title`, `region`.
- axe reported **none** of: missing focus indicators (Checkbox, Radio, Input, Slider), Tabs/List/ProgressBar semantics, Modal focus management, Button `type`, radio grouping, Dropdown activedescendant, reflow overflow. The manual/behavioural tests above are what found them. **Lesson for our repo: axe alone is not a gate; add keyboard/focus-diff tests.**

### 2.3 Target size summary [M]

Passing 24x24 by themselves: Button default/icon, Input, Dropdown trigger, Tabs, TabPanel, List items. Failing 24 by themselves: Button small (18 tall), Checkbox/Radio labels (22.4 tall) and boxes (18x18), Toggle (22), Slider (16 tall; thumb 12 wide). Some may pass 2.5.8 through the *spacing exception* if the consumer leaves >= ~2-4px around them, which the component cannot guarantee. **Nothing reaches 44px** (WCAG 2.5.5 AAA / Apple HIG 44pt / Material 48dp). For a touch-first PWA the floor should be 44x44 hit area with a smaller visible glyph.

---

## 3. Colour maths: the LCD pair (Q2)

L = 0.2126R+0.7152G+0.0722B on linearised sRGB; ratio symmetric. Script: `1bit-work-scripts/contrast.py`.

| Pair | Ratio | Note |
|---|---|---|
| `#888869` vs `#000000` (L = 0.23862 vs 0) | **5.772:1** | light theme (black on LCD) **and** dark theme (LCD on black) are the same number, because dark is a pure swap. Passes AA text (4.5) and UI (3.0). Fails AAA (7.0). |
| `#888869` vs `#FFFFFF` | 3.638:1 | white text on LCD would fail AA |
| Screen bezel `#666666` on `#1a1a1a` | 3.03:1 | decorative, but below 4.5 |

Opacity-based "muted" states (sRGB alpha composite, as browsers do):

| alpha | light (black @a on LCD) | dark (LCD @a on black) | Where used |
|---|---|---|---|
| 1.0 | 5.77 | 5.77 | all text |
| 0.8 | 4.75 | **3.97** | +page:624, 663 (region, GMT), TabPanel hover |
| 0.7 | **4.03** | **3.22** | +page:438 (subtitle) |
| 0.5 | **2.72** | **2.12** | disabled (9 components), **placeholder** (Input:82) |

- Minimum alpha of black on LCD for 4.5:1 is unreachable (max is 5.77 at alpha 1); for 3.0:1 it is alpha >= 0.548. So **the placeholder (2.72 / 2.12) fails 1.4.3 in both themes**. Disabled text is exempt from 1.4.3, but the *only* cue left is contrast, which is weak for low-vision users.
- Demo palettes: Classic `#A8B858`/`#000` 9.66; Amber `#FFB000`/`#2A1A00` 9.20; Green `#33FF33`/`#0A3309` 10.40; Wizard `#739380`/`#000` 6.21; Indigo dark `#0A1A2A`/`#58AAE5` 6.95; **Indigo light `#FFFFFF`/`#58AAE5` = 2.53:1 (fails)**. There is no contrast guard in the picker.
- The **Brightness slider** (+page:133-141, min 20) mixes fg toward bg in sRGB: for the theme.css dark pair the ratio is 1.21 / 1.43 / 1.72 / 2.12 / 2.64 / 3.22 / 3.97 / 4.77 / 5.77 at 20..100%. Only >= 90% passes AA. A "dim" control that can take text to 1.21:1 is an anti-pattern; do not copy.
- **Headroom lesson:** with a 5.77 base pair, any secondary tier is impossible. A mono theme needs a base pair >= ~12:1 so one muted tier (70% mix) stays >= 4.5 (computed candidates in 6a).

### 3.1 Dither behind text [M]

| Background | Avg. luminance contrast of black text (linear-light mean) | Text pixels that land on a same-coloured dither pixel (Tamzen 16px "Settings 12:45 Save", 300 ink px) | Legibility (screenshot) |
|---|---|---|---|
| `dither-25` (6.25% ink) | 5.47:1 | 3% | readable, but the dots add noise |
| `dither-50` checker | 3.39:1 | **49%** | barely legible |
| `dither-hlines` | ~3.4:1 | 36% | poor |
| `dither-75` (93.75% ink) | 1.30:1 | **97%** | illegible |

Local (pixel) contrast wherever a text pixel meets a same-colour dither pixel is 1.00:1. WCAG 1.4.3 is judged against the actual local background, so **a 1-bit dither fill behind text cannot pass**. The repo's Sharp-Wizard clock (+page:317-375) is the safe usage: dither on the outer 12px frame (`.wizard-panel`), text on the solid inner plate (`.wizard-panel__inner`, background `--1bit-bg`). Keep that rule.

---

## 4. Component craft notes beyond a11y

- **Hidden-input skin pattern** (`position:absolute; opacity:0; width:0; height:0`) is the root cause of the missing focus rings. Better: style the real input (`appearance:none`, `::before` for the mark) so `:focus-visible` and the hit area come for free.
- **clip-path chamfers**: 13 hand-copied polygons plus the unused utility; `clip-path` also clips `outline` and `box-shadow` of the element it is on [S, standard CSS behaviour; not separately measured], so focus rings on chamfered controls would be cut at the corners. The utility `.pixel-corners` exists but is unused.
- **Fake 1-bit**: Radio uses `border-radius:50%` and Checkbox uses rotated bars - both anti-aliased. `image-rendering: pixelated` on `.onebit` (theme.css:100-101) has **no effect on text**, only on images/backgrounds.
- **No global reset**: no `box-sizing`, no `html/body` background, no link/`a` styles, no `:focus-visible`, no `color-scheme`, no `theme-color`. The page background lives on a `div.page`.
- **Hover-only inversion** with no `@media (hover:hover)` gate: on a touch device (`hover:none`, `pointer:coarse`) `:hover` stays matched after a tap and the Button remained black [M].
- **State by inversion**: Tabs/List/Toggle/Title bars all use `bg<->fg` swap. Elegant and unambiguous in colour, but it is `background-color`-only, so it is deleted by Windows forced-colors / High Contrast (screenshot confirmed: selected Tab, selected List row, Toggle On/Off, Radio dot, Checkbox tick, Slider fill all vanish while `aria-checked` and `checked` are true) [M].

---

## 5. Evaluation of the transferable ideas (Q3)

### (a) A "mono / 1-bit" theme as optional high-contrast, low-distraction theme - **ADAPT**

What transfers: a theme defined by **two primitives** (`--paper`, `--ink`), dark = swap, states = inversion + a second cue, elevation = border not shadow, radius 0, flat.

What must change:
1. **Pair choice**: LCD `#888869`/`#000` is only 5.77:1. Candidate pairs I computed (base ratio | 70%-muted text ratio | AAA 7:1):

   | Pair | Base | 70% muted | 60% muted |
   |---|---|---|---|
   | `#FFFFFF` / `#000000` | 21.00 | 8.45 | 5.74 |
   | paper `#F6F4EC` / ink `#14130F` | 16.88 | 6.58 | 4.71 |
   | inverse (ink bg `#14130F` / paper text `#F6F4EC`) | 16.88 | 8.57 | 6.61 |
   | LCD-soft `#C9D3A0` / `#10140A` (a friendlier LCD) | 11.81 | 5.56 | 4.16 |
   | LCD-soft dark `#10140A` / `#C9D3A0` | 11.81 | 6.30 | 4.93 |
   | Amber `#2A1A00` / `#FFB000` | 9.20 | 5.19 | 4.18 |
   | Green `#0A3309` / `#33FF33` | 10.40 | 5.93 | 4.75 |
   | Game Boy DMG `#9BBC0F` / `#0F380F` | 6.02 | 3.36 | 2.77 (fails) |
   | 1bit-ui LCD `#888869` / `#000` | 5.77 | 4.03 | 3.36 (fails) |

   Rule: mono pairs must be >= 10:1 (AAA comfortable) so a single muted tier still clears 4.5:1. Keep LCD/amber/green as *accent flavours* of the same two-token mechanism.
2. **Activation**: `[data-theme="mono"]`, and auto-map from `@media (prefers-contrast: more)` when the user has not chosen; add `color-scheme` and `<meta name="theme-color">`; put the background on `:root`.
3. **Forced-colors**: add `@media (forced-colors: active)` using system colours (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `ButtonBorder`) and give every state a non-background cue (border weight, a real glyph, underline, `outline`) so nothing depends on `background-color` alone.
4. **States without opacity**: disabled = dashed border + muted text + `aria-disabled`/`disabled`, not `opacity:.5`; muted text = a real token that is >= 4.5:1.
5. **Focus**: two-tone ring (`outline: 2px solid ink; outline-offset: 2px; box-shadow: 0 0 0 2px paper` and/or inverse) so it reads on both the page and inverted (selected/title-bar) surfaces; on the LCD pair both edges are 5.77:1.
6. Optional extras gated to this theme only: pixel font (see e), dither frames (see c), chamfer shape token.

### (b) TitleBar + Panel window pattern vs the hard-edged window-panel reference - **ADAPT**

Reference (from the earlier MEOWIOM analysis, `img3-meowiom-panels.md`): 2px ink border, zero radius, title bar 35px (source scale ~40) with an **uppercase bold title** and **one 26x26 (source ~30) square control** at the right with a 1px bevel, bar polarity **inverse** of the panel body, three bodies (colour field / ink / tint), hairline-separated link lists, no shadows; flagged weaknesses there: the ghost control has 1.3:1 edge contrast, no interaction states, desktop-only scale.

| Aspect | 1bit-ui | Window-panel reference | Recommendation for our generic `panel` / `window` |
|---|---|---|---|
| Bar | `TitleBar`: fg-filled bar, bold title, optional `▼` and right text (TitleBar:11-23) | fg-filled bar, uppercase bold title, square control | Keep: inverse bar. Make it `<header>` with a real heading (`<h2>`), title text in source case + CSS `text-transform` and `letter-spacing` (SR reads the real text). |
| Control | **None** (the `▼` is inert and misleading) | 26x26 square, often empty/ghost | Real `<button type="button">` with `aria-label`, `aria-expanded` when it collapses; visible square 28-30px with >= 44x44 hit area (padding or `::before`), edge contrast >= 3:1 against the bar, two-tone focus ring. |
| Body | bordered content box (`Panel`) with un-inverted title row + border-bottom; `variant` API is dead | colour field / ink / tint | Variants as *surface tokens* (`--paper`, `--ink` (inverse), `--tint`), never raw colours; never put body text on a mid-tone field. |
| Border | `var(--1bit-border-width)` (1px; Modal uses a double border plate) | 2px ink | Token-driven (default 2px in mono, 1px in neutral themes); `box-sizing:border-box` globally. |
| Semantics | `div` | `div` (mock) | `<section aria-labelledby>`; Modal = same component on `<dialog>` (native focus trap, inert background, Esc, top layer, `::backdrop`). |
| Responsiveness | fixed px, demo has no media queries | 4-col desktop grid | Container queries; single column < ~480px; bar height 44-48 on touch. |
| Shape | chamfer polygons | square | Radius token; chamfer only as a mono-theme option and not on elements that need a focus ring (clip-path clips it). |

Verdict: the two agree on the *visual grammar* (border-only elevation, inverse title bar). 1bit-ui has none of the *interactive* part (the control slot) and none of the semantics; both would need the real-button control, heading and mobile rules. The Modal's "outer plate + inset bordered content" (Modal:50-111) is a good cheap "double-border window" look to keep as an optional mono-theme flourish.

### (c) Dither / hatch as decorative fills - **ADAPT (restricted)**

Adopt as: frame/border ornament, progress-track texture, empty-state background, selected-row accent *beside* a solid text plate, disabled surface *with a solid label*. Rules (each backed by section 3.1 / 1.4):
1. **Never put text, icons or any information directly on a pattern** (49% of glyph pixels lost on a checker). Text always on a solid `--surface`; pattern lives in padding/frames.
2. **Pattern must never be the only carrier of meaning** (1.4.1): pair with a label, shape, or border change. A 50% pattern is 1.70:1 against its own solid neighbour, so it cannot satisfy 1.4.11 as a state cue.
3. **Decorative = `background`/`mask` only, never `<img>`**; no semantics; hidden from AT by nature.
4. **Theme via mask, not baked colours**: `mask-image: url("data:image/svg+xml,...")` + `background-color: var(--ink)` (or `currentColor`) so one pattern string serves every theme and dark mode; this removes the 16-string duplication and the hard-coded `#888869`. (I did not test `mask-image` here; it is widely supported but verify in Safari [E].)
5. **Pixel-snapped modules**: use cells that stay integral at common DPRs (multiples of 4 CSS px; 1px cells turned into mid-grey mush at DPR 1.5 [M]). Avoid SVG diagonals (anti-aliased); build hatch from `repeating-linear-gradient` with >= 2px lines or an explicit raster tile.
6. **Honest names**: name by ink % (6, 25, 50, 75) and verify with a script; drop the `bayer` duplicate or implement a real ordered matrix.
7. **Visual-stress safety** [E, not measured]: fine high-contrast stripes/checkers can cause discomfort (pattern glare). Keep them low-contrast or small-area, never animate, and replace with a solid in `@media (prefers-contrast: more)` and `(forced-colors: active)`.
8. Print/forced-colors: data-URI colours are not remapped by forced-colors; hide the pattern there.

### (d) Chunky borders as a token enabling an "outline" surface style - **ADOPT, extend**

Works as a design lever (section 1.3): 8 of 12 control families follow the token. Extend to a proper scale and finish the wiring:
- Tokens: `--border-width` (component edge; 1px neutral / 2px mono), `--border-width-strong` (window frame; 2-4px), `--focus-ring-width` (2-3px), `--divider-width`.
- **Outline surface style**: `surface: transparent; border: var(--border-width) solid currentColor;` for buttons/cards/inputs - low-distraction, prints well, and the heavier stroke helps 1.4.11 discernibility for low vision. Hit area must be `border-box` so thicker borders never shrink targets.
- Every part (checkbox, radio, dividers, slider thumb, inner window margins) must read the token; add a lint that fails on literal `1px` borders inside components.
- Borders stay `px` (optical); sizes/padding in `rem` so text zoom still works.

### (e) Bitmap-font considerations - **ADAPT as optional, gated, self-hosted**

Measured facts about the three bundled files [M, fontTools]:

| File | Size | Licence (from name table) | Notes |
|---|---|---|---|
| `Tamzen.ttf` | 26,228 B (woff2 **4,552 B**; Latin subset **3,768 B**) | Only `(c) 2015 Scott Fial` embedded. Upstream `LICENSE` (fetched): *"Tamzen font is free. You are hereby granted permission to use, copy, modify, and distribute it as you see fit."* - permissive but not an SPDX licence. | 190 glyphs, unitsPerEm 1600, advance 800 (8x16 cell at 16px), single "Medium" weight, outline-traced (no bitmap strikes). Basic Latin 95/95, Latin-1 79/96, **nothing beyond U+00FF**. Missing: ▼ ✓ ⓘ → … — • ▲ ■ box-drawing. Has × (U+00D7). |
| `Terminus.ttf` | 500,668 B (woff2 72,704 B) | SIL OFL 1.1 (name table) | 1,359 glyphs with EBDT/EBLC strikes. **Not referenced anywhere in src.** |
| `Px437_IBM_VGA_8x16.ttf` | 26,128 B (woff2 6,592 B) | **CC BY-SA 4.0** (name table 13/14), by VileR | ShareAlike: a subset/woff2 conversion is an adaptation of the font file and must carry BY-SA + attribution. **Not referenced anywhere in src.** |

Considerations and what to do:
1. **Licensing**: ship a `LICENSES/` folder with the exact texts; credit font authors; prefer Tamzen (permissive) or Terminus (OFL, check the Reserved Font Name clause before renaming/subsetting [E]); avoid Px437 unless BY-SA on the font file is acceptable. 1bit-ui has no LICENSE file at all while claiming MIT (package.json:17, README:128-130).
2. **Pixel-grid alignment** [M]: Tamzen is crisp only when 1 font pixel = an integer number of device pixels. Distinct colours in one line of 16px text: DPR 1 = 9; DPR 1.5 = **68**; DPR 2 = 6; DPR 2.625 = **122**; DPR 3 = 6; DPR 1 + 125% zoom (20px) = **114**; 150% (24px) = 69. By CSS size at DPR 1: 16px = 9, 17.6px (the demo's own `h2 1.1em`) = **247**, 14.4px = 237, 13.6px = 225, 20px = 111, 32px = 6. So: only 16/32/48px, only at integer DPR. The demo itself violates this (+page:480, 634, 660; Dropdown:171 10px; Screen:98 6px).
   - Mitigation that works [M]: gate the font behind an integer-resolution query: `@media (resolution: 1dppx), (resolution: 2dppx), (resolution: 3dppx) { :root[data-theme="mono"] { --font-ui: var(--font-pixel), ui-monospace, monospace; } }`. Verified in Chromium: matches at DPR 1/2/3, not at 1.25/1.5/2.625. Because browser zoom changes the effective DPR, it **falls back to system mono when the user zooms**, preserving WCAG 1.4.4.
   - Also: sizes in multiples of 16px, line-heights in integer px, avoid `translate(-50%)`/fractional `transform: scale` on text, keep containers on the 8px advance grid.
3. **Bold**: only one face is declared; `font-weight: bold` (TitleBar:32, Modal:89, Panel:45) is **synthesised** by the browser. Declare real bold or set `font-synthesis: none` and use inversion/size for emphasis.
4. **Coverage**: no non-Latin, no arrows/check/close. Icons must be SVG (24x24 pixel-grid icon set such as Pixelarticons - README says MIT, I did not verify its licence file [E]), never Unicode glyphs in this font.
5. **Offline PWA embedding**: Tamzen woff2 is 4.5 kB (base64 ~6.1 kB) - trivially precached. Use a *relative* `url(./fonts/tamzen.woff2) format("woff2")`, `font-display: swap`, `unicode-range`, `<link rel=preload as=font type="font/woff2" crossorigin>`, add to the service-worker precache list, and pick a fallback with the same 0.5em advance or accept reflow (system mono is ~0.6em, ~20% wider [E]). 1bit-ui uses an absolute `/fonts/...` path and ships no fonts in the npm package [M], so consumers get the fallback font silently.
6. **Legibility & scaling trade-offs**: 8x16 monospace has a small x-height (~7px) and poor long-form reading; treat it as a *UI-chrome/label font for the mono theme*, never required for body copy. Android font scale / iOS Dynamic Type also break the pixel grid.

---

## 6. What NOT to copy (Q4)

1. **Framework coupling.** Svelte 5 runes (`$state/$props/$bindable/$effect`), snippets, scoped `<style>`, SvelteKit/`svelte-package` are all load-bearing in every file. Ours is vanilla HTML/CSS/JS with no build step for consumers: deliver tokens as CSS custom properties, components as documented HTML + classes (+ tiny optional ES-module enhancers), not `.svelte`.
2. **Every a11y defect in section 2** - above all: `outline:none` without replacement (Input:67, Slider:110, and Dropdown's 1px shadow), hidden-input skins with no `:focus-visible`, Modal without focus management, Tabs/List/ProgressBar without roles, Slider/Input without labels, radio `name=''`, Button without `type`.
3. **Fixed pixel everything**: ProgressBar 150x20, slider thumb 12x16, 16px font baked into `.onebit`, `4px 8px` paddings, `Screen` 160x160 scaled by `transform`, `min-width: 200px` modal with no max-height. Use `rem`, container queries, logical properties, min 44px touch targets.
4. **No breakpoints / non-wrapping flex grid**: the demo is 660px wide minimum [M]; fails 1.4.10 Reflow at 320px.
5. **Opacity as the only muted/disabled/placeholder mechanism** (2.72:1 etc.). Use explicit tokens.
6. **Baked-colour data-URI patterns** (16 strings) and mislabelled/duplicate/anti-aliased patterns.
7. **Unicode glyphs as icons** (`▼ ✓ ⓘ`) in a font that lacks them; decorative glyphs announced by screen readers ("Option 1 ▼").
8. **clip-path chamfers copy-pasted** 13 times (and clipping focus rings).
9. **Colour-by-`background-color` state** with no forced-colors fallback.
10. **Theme mechanics**: JS writing inline CSS variables that bypass the stylesheet's own dark block; a brightness slider that can reach 1.21:1; a colour picker with no contrast check.
11. **Distribution habits**: absolute font URL, fonts outside the package, missing LICENSE, unused 500 kB Terminus and CC BY-SA Px437 shipped, an unused runtime dependency (`pixelarticons`, package.json:61), README/CSS disagreement (border width).
12. **Demo chrome as components**: `Screen` (PDA bezel with hard-coded greys and a 6px label) and the Sharp-Wizard clock are showcase art, not system parts. The clock's *structure* (dither frame + solid plate) is worth a doc example only.
13. **`user-select:none` on labels** (Checkbox:102, Radio:90) stops users copying label text; `image-rendering` on text containers does nothing.
14. **Dead API**: Panel `variant`, List `selected`, Radio `checked`, Modal `showInfo`, `.pixel-corners` utilities, unused exports (`TitleBar`, `Screen` imported but unused in the demo).

---

## 7. Adoption list for our generic system (condensed)

| Action | Idea |
|---|---|
| adopt | Two-primitive inversion model for the mono theme (dark = swap); state via inversion **plus** a second cue. |
| adopt | Border-only elevation + `--border-width` token (extend to a scale, wire into every part). |
| adopt | Native elements underneath custom skins (button, checkbox, radio, range) - but style the input itself so focus works. |
| adopt | Toggle shows both "Off \| On" labels (not colour-only); keep `role=switch`, add proper naming and 44px height. |
| adopt | Palette-swap demonstration (5 themes by changing 2 variables) as a docs feature, **with a live contrast readout and build-time guard**. |
| adopt | Dither only as frame around a solid text plate (the clock's structure). |
| adapt | Window = inverse title bar + bordered body, with a real control button, heading, `<dialog>`; radius/chamfer as token. |
| adapt | Dropdown: keep roles, add activedescendant/controls/ids/Home/End/type-ahead/Tab-close, or default to styled native `<select>` on touch. |
| adapt | Bitmap font: optional, gated by integer `resolution`, self-hosted woff2, real bold, SVG icons. |
| adapt | Patterns via `mask-image` + token colour; verified ink %; 4px modules. |
| adapt | Dashed divider / dashed underline input as a "minimal" look, but with a 2px solid focus state. |
| avoid | Everything in section 6. |

---

## 8. Reproduction and caveats

- Axe/keyboard/measurement scripts: `.../scratchpad/analysis/1bit-work-scripts/` (`contrast.py`, `axe.mjs`, `targets.mjs`, `focus2.mjs`, `behav.mjs`, `forced.mjs`, `dither.mjs`, `dprfont.mjs`, `bw.mjs`, `modal.mjs`, `mq.mjs`). Screenshots alongside (`demo-1280.png`, `demo-390.png`, `forced-colors.png`, `border3.png`, `dithertext-composite.png`).
- Only Chromium was tested. Firefox/Safari focus rings, `outline:auto` look and radio-without-name arrow-key behaviour differ; in Chromium an unnamed radio still responded to ArrowDown while showing 3 Tab stops, which is not spec-guaranteed in other engines [E].
- Sticky hover was reproduced with Chromium touch emulation (`hasTouch`, `isMobile`); real iOS/Android may differ slightly but the `(hover:none)` gating is the standard fix.
- Line numbers refer to the clone at `refs/1bit-ui`. Screenshots showed subpixel colour fringes on text in headless Linux; I ignored those as renderer noise.
- Not verified: Pixelarticons licence text, Terminus Reserved Font Name clause, `mask-image` data-URI behaviour across Safari versions, `appearance: base-select` availability for a styled native `<select>` in 2026 browsers.
