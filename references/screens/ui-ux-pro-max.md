# Analysis: nextlevelbuilder/ui-ux-pro-max-skill (for a generic PWA / mobile style guide)

Analyst: read-only pass. Nothing under `/home/user/styleguide` was touched.
Repo: `.../scratchpad/refs/ui-ux-pro-max-skill` at commit `09170ee` (merge of PR #500), MIT license.
Reproducible artefacts (all under `.../scratchpad/analysis/`):
- `contrast_audit.py` + `contrast_fails.json` - WCAG contrast audit of `colors.csv` (192 palettes).
- `ds/*.md` - five generator outputs (4 requested queries + 1 with design dials).
- `persist/design-system/pwa-kit/MASTER.md` - the generator's persisted "Master" file.

Method notes: every contrast figure below was computed with the WCAG 2.x relative-luminance formula (sRGB linearised, `(L1+.05)/(L2+.05)`), not estimated. Items marked **[gap-fill]** are my own recommendations because the dataset has nothing on the topic. Items marked **[guess]** are judgement calls I could not measure.

Standards baseline confirmed by web search (2026-09): WCAG 2.2 is the current W3C Recommendation (5 Oct 2023) and is now ISO/IEC 40500:2025. WCAG 3.0 is still a Working Draft (updated March 2026, no final date), so WCAG 2.2 AA is the correct floor and WCAG 3 should not be designed to yet. Sources: https://www.w3.org/WAI/ , https://www.boia.org/blog/understanding-the-differences-between-wcag-2.2-and-wcag-3.0

---

## 1. Executive summary

1. The repo is **a retrieval tool, not a design system**. It is 13 CSV knowledge bases (119 UX rules, 32 native-app rules, 88 styles, 192 palettes, 74 font pairings, 25 chart types, 105 icons, 34 landing patterns, 17 GSAP motion presets, 22 stack files) plus a BM25 Python searcher/generator. Its `--design-system` output contains only colors, one font pair, four shadow tokens, seven spacing tokens, and four hard-coded component snippets. It has **no type scale, radius scale, z-index scale, motion tokens, breakpoints, touch-size tokens, focus-ring token, or dark/light pair**.
2. The **most valuable part is the prose rule set** in `templates/base/quick-reference.md` (about 170 named rules in 10 priority buckets) and the `ux-guidelines.csv` WCAG 2.2 rows (#100-#119). These were clearly curated recently and mostly agree with WCAG 2.2. They are the right raw material for a checklist.
3. The **generated artefacts are materially worse than the prose**. The persisted `MASTER.md` ships component CSS that violates the repo's own rules (invisible 12.5%-alpha focus ring with `outline:none`, 1.23:1 input border, `transition: all`, card using the page-background token, hard-coded `background: white` modal). Do not copy generated CSS.
4. **Palettes: text pairs are sound, everything else is not.** 0/192 palettes fail the `On-*` text pairs (good, the authors fixed them), but **0/173 parseable `Border` tokens reach 3:1** against the background (median 1.22:1), 49% of palettes cannot use `Primary` as link text on their own background, every palette is single-mode (149 light, 43 dark, no pairs), and only 77/173 palettes pass a basic "primary-as-text + ring + muted + destructive" gate.
5. **Dataset is marketing-page oriented and native-mobile oriented; it has zero PWA guidance** (no manifest, service worker, display-mode, theme-color, `env(safe-area-inset-*)`, `viewport-fit`, install, offline-shell). The "pattern" axis is 34 marketing landing pages and it routinely returns testimonial carousels for personal trackers. For a PWA style guide, use the rules, ignore the patterns.
6. **Numbers conflict across files** for touch target, animation duration, z-index, focus-ring width, radius, press scale and toast duration (reconciliation table in section 4). The checklist below picks one value per topic.
7. **Style recommendation:** combine **Minimalism & Swiss Style** (structure) + **Soft UI Evolution** (friendly surfaces, with a corrected palette) + **Accessible & Ethical** (hard constraints), with **Micro-interactions** as the feedback vocabulary. Keep "retro windowed/1-bit" as a swappable theme, because the dataset has no such style.

---

## 2. What is in the repo (relevant parts)

| Path | What | Use to us |
|---|---|---|
| `CLAUDE.md`, `README.md` | Tool usage, architecture, sync rules | Workflow idea only: Master + page-override files (`design-system/<slug>/MASTER.md` + `pages/<page>.md`, page wins). Worth copying as a *documentation convention*. |
| `src/ui-ux-pro-max/templates/base/quick-reference.md` | About 170 named rules in 10 priority buckets (Accessibility CRITICAL, Touch CRITICAL, Performance HIGH, Style HIGH, Layout HIGH, Type/Color MEDIUM, Animation MEDIUM, Forms MEDIUM, Nav HIGH, Charts LOW) | **Best source.** |
| `templates/base/skill-content.md` + `.claude/skills/ui-ux-pro-max/references/pro-rules.md` | Icons/Interaction/Dark-mode/Layout tables and "canonical" pre-delivery checklist | Good, but explicitly scoped "App UI (iOS/Android/React Native/Flutter), not desktop-web". |
| `data/ux-guidelines.csv` (119) | Do/Don't + code + severity. Rows #100-#119 are the WCAG 2.2 and text-resilience rows | Good. |
| `data/app-interface.csv` (32) | All 32 rows are `iOS/Android/React Native` | Only conceptually reusable. |
| `data/motion.csv` (17) | GSAP presets with duration/easing/Do/Don't | Numbers useful; GSAP itself unnecessary (we are vanilla CSS). |
| `data/colors.csv` (192), `typography.csv` (74), `styles.csv` (88), `charts.csv` (25), `icons.csv` (105), `landing.csv` (34), `products.csv` (192), `ui-reasoning.csv` (192) | Knowledge bases | See audit. |
| `cli/assets/skills/design-system/references/*.md` | **Three-layer token architecture** (primitive -> semantic -> component), naming `--{category}-{item}-{variant}-{state}`, state priority (disabled > loading > active > focus > hover > default) | **Adopt the architecture.** Its sample values have defects (see D-12). |
| `stack/scripts/design-audit.mjs` | Playwright multi-viewport heuristic audit: overflow, unsized media, missing focus styles, small tap targets, missing names, heading order, viewport/lang, approximate contrast. Viewports 360/390/768/1024/1440/1920 | Good model for our own CI check. Heuristic only. |
| `projects/*/index.html` | 3 example pages | Do not treat as exemplars: each has **0** `:focus`/`:focus-visible` rules, **0** skip links, and `aria-` counts of 2/6/0. |

---

## 3. Generator runs (design-system mode)

Command: `python3 search.py "<query>" --design-system -p "PWA Kit" -f markdown`. Full outputs are in `analysis/ds/`.

| # | Query | Pattern | Style | Palette (Primary / Bg / Accent) | Type pair | Anti-patterns emitted | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | personal finance mobile PWA calm friendly minimalist | Product Demo + Features (marketing) | Glassmorphism (dark) | `#1E40AF` / `#0F172A` / `#059669` (row 91) | **Caveat + Quicksand** (handwritten) | "Pure white backgrounds" | **Poor.** Ignores "calm/minimalist"; handwritten heading for money; Primary on Background is **2.05:1**; Card vs Background **1.11:1**, Muted vs Background **1.04:1**. |
| 2 | calendar productivity mobile app | Product Demo + Features | Flat Design | `#0D9488` / `#F0FDFA` / `#EA580C` | Plus Jakarta Sans | "Complex onboarding, Slow performance" | **Usable palette and type**; pattern irrelevant to an app. |
| 3 | retro windowed panels brutalist landing page | Hero + Testimonials + CTA | **Vibrant & Block-based** | `#2563EB` / `#FFFFFF` / `#EC4899` | Abril Fatface + Merriweather | "Muted colors, Low energy" | **Miss.** No brutalism, no retro, no windowed panels. `--domain style "retro windowed panels brutalist"` returns **0 results**; "brutalist" does not stem to "Brutalism". No style in `styles.csv` covers Win3.1/95 or 1-bit UI (nearest: Pixel Art #52, Neubrutalism #38, Brutalism #4). |
| 4 | generic design system pwa | Hero + Features + CTA | Minimalism & Swiss | `#4F46E5` / `#EEF2FF` / `#EA580C` | Inter + Inter | none | Reasonable style, but the "pattern" is a landing page. |
| 4b | generic design system pwa minimalist friendly accessible (`--persist`) | FAQ/Documentation Landing | Minimalism & Swiss | same indigo | **Roboto** (MD3) | "Poor documentation, No live preview" (meaningless) | Produces `MASTER.md`; see D-05..D-08. |
| 5 | calm minimalist friendly personal app (dials variance 2, motion 2, density 5) | **Enterprise Gateway** ("Contact Sales") | Minimalism & Swiss | **`#FF4D4D` red primary**, `#F5F5F7` bg | Caveat + Quicksand | none | **Poor.** Red primary for "calm"; Ring `#FF4D4D` is exactly 3.00:1 on bg (borderline); attaches a GSAP scroll-reveal for an app. |

Generator behaviours worth knowing:
- Output structure: Pattern, Style, Colors (16 roles with `--color-*` names), Typography (+ Google `@import`), Key Effects, Anti-patterns, Pre-delivery checklist. `--persist` adds spacing tokens, 4 shadows, 4 component snippets, a forbidden-patterns list.
- Colour roles are a good **minimum semantic set**: primary, on-primary, secondary, on-secondary, accent, on-accent, background, foreground, card, card-foreground, muted, muted-foreground, border, destructive, on-destructive, ring (shadcn-style). Missing: success/warning/info, surface-raised, scrim, text-link, border-control.
- Design dials (`--variance/--motion/--density`, 1-10) are just bucketed presets. The `density` tiers change spacing tokens: spacious 4/8/24/32/48/64/96, standard 4/8/16/24/32/48/64, dense 2/4/8/12/16/24/32. **The dense tier yields 4px gaps between targets** (below the 8px rule) and 2px xs, so a density mode must never shrink target size or target gaps (D-14).
- The README's sample checklist does not match the code's checklist (README shows "Interaction timing follows the platform..."; `design_system.py:803,933,1394` prints "Hover states with smooth transitions (150-300ms)"): docs are stale.

---

## 4. Conflict reconciliation (what each file says -> what to use)

| Topic | Values found (file) | Recommended for the style guide |
|---|---|---|
| Touch target | iOS 44pt / Android 48dp (`ux #22`, `app-interface #6`); WCAG web 24 CSS px (`ux #104`); 44x44px (`accessible-and-ethical`); Tailwind `min-h-11` = 44 (`html-tailwind #34`); 48px (`flat-design-mobile`). **`ux #22` lists `w-6 h-6` (24px) as BAD while `#104` lists `min-width:24px` as GOOD** | **44x44 CSS px minimum for every tap target; 48px for primary actions and tab-bar items.** 24px is the WCAG 2.5.8 AA floor only (spacing exception), never a design target on a phone. |
| Target gap | 8px / 8dp (`ux #23`, `app-interface #7`) | >= 8px, also in dense/compact modes. |
| Focus ring | 2-4px (`quick-ref`), 3-4px (`accessible`), 4px+ (`inclusive`), 2px + 2px offset (`states-and-variants`), 2-3px outline (`soft-ui`), 3px **12.5%-alpha** shadow (generator) | `outline: 3px solid var(--focus)` + `outline-offset: 2px`, min 2px thick (WCAG 2.4.13 AAA geometry), >= 3:1 vs adjacent colours, two-tone variant for unknown backgrounds. |
| Durations | hover 150-200 (`motion #1`), micro 50-100 (`micro-interactions`), minimalism 200-250, soft-ui 200-300, flat 150-200, `app-interface #23` 150-300, brutalism **0**, page-transition exit <=250, enter 200-300 (`motion #10`), `ux #8` "never present any range as universal" | Token set: `fast 120ms`, `base 200ms`, `slow 320ms`, cap 500ms; exit = 60-70% of enter; press feedback visible <=100ms. |
| Easing | `ease-out` enter / `ease-in` exit (`app #23`), "ease-in-out for every motion is BAD; linear OK for spinners" (`ux #14`), M3 emphasized `cubic-bezier(0.2,0,0,1)`, generator `ease` | enter `cubic-bezier(0,0,.2,1)`, exit `cubic-bezier(.4,0,1,1)`, standard `cubic-bezier(.2,0,0,1)`, linear only for spinner/progress. |
| z-index | `0/10/20/40/100/1000` (`quick-ref 5`), `10/20/30/50` (`ux #15`), `z-0..z-50` (`html-tailwind #5`), `z-[-1]` (`#7`) | Named tokens `0/10/20/30/40/50` (see checklist); modals/toasts/popovers use the **top layer** (`<dialog>.showModal()`, `[popover]`) so z-index is moot for them. |
| Line-height | 1.5-1.75 (`ux #72`), `leading-relaxed` 1.625, 1.4-1.5 (`typography #72`), M3 16/24 = 1.5 | Body 1.5; headings 1.2-1.3; UI labels 1.25-1.4. |
| Base/min font size | 16px body (`ux #67`); 14-16pt base and "not below 12pt" (`app #26`); caption 12px (M3); "12 14 16 18 24 32" (`quick-ref 6`) | 16px base; inputs >= 16px; 12px absolute floor for captions only. |
| Spacing | 4/8/16/24/32/48/64 (generator), 4/8/16/24/32/48 (`flat-mobile`), tiers 16/24/32/48 (`skill`), **no 12** in any | 4/8/12/16/24/32/48/64 (add 12 for compact paddings). |
| Radius | 0px (minimalism, brutalism), 2px (flat), 8-12 (soft-ui), 6/12/999 (`flat-mobile`), 16-24 (bento/clay/organic), 8/12/16 (generator), pill 999 (M3) | Scale `4/8/12/16/24/pill`; controls share one radius (8 or 12). |
| Press scale | 0.95-1.05 (`quick-ref`), 0.97 (`flat-mobile`), hover 1.02 (`bento`) | Press 0.97 max, no hover scale; never shift neighbours. |
| Toast | auto-dismiss 3-5s (`ux #82`, `quick-ref`) | >= 5s, scaled to message length, pause on hover/focus, errors persist (WCAG 2.2.1 Timing Adjustable / 4.1.3). |
| Loading threshold | spinner/skeleton for >300ms (`app #13`), "don't universalise" (`ux #78`), no elaborate loader for <300ms (`motion #16`), shimmer loop <1.5s | <100ms nothing; 100-300ms no spinner (keep prior content); >300ms skeleton or inline spinner; known-length >2s determinate progress. |
| Stagger | 30-50ms (`quick-ref`), 20-40ms (`motion #7`), max ~8 children (`motion #5`) | 30ms step, <= 8 items. |
| Breakpoints/test widths | 375/768/1024/1440 (`quick-ref`, generator), 320/375/414/768/1024/1440 (`ux #65`), 360/390/768/1024/1440/1920 (audit script) | Test 320, 360, 390, 768, 1024, 1440; CSS breakpoints 600, 768, 1024 (mobile-first, `min-width`). |
| Contrast | 4.5:1 (most), 7:1 (accessible/inclusive), 3:1 non-text | AA floor everywhere, 7:1 for body text/primary content (cheap), 3:1 for control borders, focus, meaningful icons, chart marks. |

---

## 5. Distilled checklist (88 items; same list is in the structured output)

### [a11y]
1. [a11y] WCAG 2.2 AA is the floor (W3C Rec Oct 2023, ISO/IEC 40500:2025); design to AAA where cheap (7:1 body text, 44px targets). WCAG 3.0 is still a draft: do not design to it.
2. [a11y] Text contrast >= 4.5:1 (>= 3:1 only for large text: >= 24px, or >= 18.66px bold); aim 7:1 for body and primary content.
3. [a11y] Non-text contrast >= 3:1 against adjacent colours for: input/checkbox/radio boundaries, focus indicators, meaningful icons, selected/on state indicators, chart marks.
4. [a11y] Never encode meaning by colour alone: pair status, errors, selection and chart series with an icon, text label, pattern or shape.
5. [a11y] Visible keyboard focus on every interactive element via `:focus-visible`: `outline: 3px solid var(--focus)` + `outline-offset: 2px` (min 2px thick, >= 3:1 vs neighbours); never `outline:none` without a replacement; use outline not box-shadow-only so it survives `forced-colors`.
6. [a11y] Focus must not be hidden by sticky UI (WCAG 2.4.11): set `scroll-padding-top/bottom` to fixed header/tab-bar heights.
7. [a11y] Tab order equals visual order; no keyboard traps; Esc closes overlays; focus returns to the trigger on close; on SPA route change move focus to the view's `<h1>` (`tabindex="-1"`).
8. [a11y] Every drag/swipe/gesture has a single-pointer + keyboard alternative (WCAG 2.5.7): reorder gets "Move up/down" buttons; swipe-to-delete gets a visible Delete.
9. [a11y] Semantics: skip link, landmarks (`header/nav/main/footer`), one `<h1>` per view, sequential headings, native `<button>/<a>/<input>/<dialog>` before ARIA.
10. [a11y] Icon-only controls have an accessible name; decorative icons `aria-hidden="true"`; toggles expose `aria-pressed/expanded/selected/current`.
11. [a11y] Text survives 320 CSS px reflow, 200% zoom and WCAG 1.4.12 spacing overrides (line-height 1.5, paragraph spacing 2x, letter 0.12em, word 0.16em) with no clipped or fixed-height text; never set `user-scalable=no` or `maximum-scale=1`.
12. [a11y] Honour user preferences: `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast: more` (raise border/text contrast), `forced-colors: active` (keep borders and outlines, use `currentColor`).
13. [a11y] Status messages (WCAG 4.1.3): `role="status"` / `aria-live="polite"` for toasts, counts, saves; `role="alert"` for errors; never move focus for them; announce a full phrase ("3 items in cart"), not a bare number.
14. [a11y] WCAG 2.2 A/AA additions: help/contact in the same place on every view (3.2.6); never ask for the same data twice in one flow (3.3.7); allow paste and password managers and offer a non-cognitive sign-in path (3.3.8).
15. [a11y] Auto-moving content (carousel, ticker) needs pause/stop, stops on focus/hover/reduced-motion; nothing flashes > 3 times per second.
16. [a11y] Verify with axe-core/Lighthouse plus a manual keyboard pass plus a screen-reader smoke test (VoiceOver iOS, TalkBack/NVDA); automation catches only part. [gap-fill]

### [touch]
17. [touch] Minimum tap target 44x44 CSS px; 48px for primary actions and tab-bar items; 24px is only the WCAG AA floor. Grow the hit area with padding or a pseudo-element when the glyph is smaller (20-24px icon in a 44px box).
18. [touch] >= 8px between adjacent targets, including in compact/dense modes; density changes padding, never target size.
19. [touch] Hover is never the only path; wrap hover styles in `@media (hover:hover) and (pointer:fine)`; give every control a `:active` pressed state.
20. [touch] Pressed feedback visible within 100ms: state-layer overlay 8-12% or `scale(.97)`; no layout shift.
21. [touch] `touch-action: manipulation` on controls (kills double-tap delay); `overscroll-behavior: contain` on scroll regions and sheets; do not hijack edge-swipe back or system gestures.
22. [touch] Put primary action and navigation in the lower half (thumb zone); keep destructive actions away from primary ones and behind confirmation or Undo.
23. [touch] Disabled = native `disabled` (or `aria-disabled` if it must stay focusable) + opacity 0.38-0.5 + `cursor:not-allowed`; say why when not obvious. Read-only is not disabled (stays focusable, full contrast).

### [type]
24. [type] Body 16px (1rem); inputs never below 16px (prevents iOS focus-zoom); 12px is the absolute floor and only for captions/meta; all sizes in `rem`.
25. [type] Type scale in rem: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 px (0.75 .875 1 1.125 1.25 1.5 1.875 2.25rem); use no more than 6 in app screens; named roles (caption, label, body, title, headline, display).
26. [type] Line-height unitless: body 1.5, headings 1.2-1.3, UI labels 1.25-1.4.
27. [type] Reading measure 45-75ch (`max-width: 65ch` for prose); mobile 35-60 characters per line.
28. [type] Weights: 400 body, 500 labels/buttons, 600-700 headings; max 3 weights; nothing below 400 for small text.
29. [type] Default to a system-font stack (offline-safe, zero network); if a brand font is used, self-host one variable `woff2` with `font-display: swap` and a metric-matched fallback. Never `@import` Google CSS. [gap-fill]
30. [type] `font-variant-numeric: tabular-nums` for money, timers, tables; `text-wrap: balance` on short headings; `overflow-wrap:anywhere` + `min-width:0` on flex text children; prefer wrapping to truncation; never clamp essential text.
31. [type] Left-aligned text, no justified body text; no negative tracking on body; uppercase only for tiny labels with +0.04-0.08em tracking.

### [color]
32. [color] Three-layer tokens: primitive -> semantic -> component; components reference only semantic tokens, never raw hex (`--color-blue-600` -> `--color-primary` -> `--button-bg`).
33. [color] Minimum semantic set: bg, surface, surface-raised, text, text-muted, border-subtle, **border-control (>= 3:1)**, primary, on-primary, **primary-text (>= 4.5:1 on bg)**, accent, on-accent, danger/success/warning/info each with `-text` (>= 4.5:1) and `-surface`, focus-ring, scrim.
34. [color] Split borders: decorative dividers may be low contrast; any border that defines an input/button/checkbox must be >= 3:1 against the surface.
35. [color] Every foreground/background token pair in both themes is asserted in a build/CI script (fail < 4.5 text, < 3 non-text); never hand-eyeball.
36. [color] One neutral ramp + one brand + at most one accent + four status hues; one primary CTA per screen.
37. [color] Status colours used as text need >= 4.5:1 on their surface (dataset `#22C55E` is 2.28:1, `#F59E0B` 2.15:1, `#EF4444` 3.76:1 on white); use the 700-level for text, 500-level as fill with dark text.
38. [color] Dark mode is a designed token set, not an inversion: lighter/desaturated accents, elevation = lighter surface (not shadow), base `#121212-#1C1C1E` range, body text about 87-92% white rather than pure `#FFF`, every pair re-verified, borders still visible.
39. [color] `color-scheme: light dark`; three-way setting (System default / Light / Dark) persisted; apply the theme before first paint (inline script) to avoid flash; one `<meta name="theme-color">` per scheme matching the surface token.
40. [color] Scrims and translucency: opaque modal surface; scrim 40-60% black measured on the composed result; blur/glass only on chrome over known backgrounds with an opaque fallback (`prefers-reduced-transparency`, `forced-colors`), never under body text.

### [layout]
41. [layout] Spacing scale 4px base: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (0.25 .5 .75 1 1.5 2 3 4 rem); only tokens, no magic numbers.
42. [layout] Mobile-first `min-width` breakpoints 600 / 768 / 1024 (content max-width about 1200px); verify at 320, 360, 390, 768, 1024, 1440; no horizontal page scroll at 320px.
43. [layout] Side gutters 16px (mobile), 24px (>= 768), 32px (>= 1024), plus `env(safe-area-inset-left/right)`.
44. [layout] Radius scale 4 / 8 / 12 / 16 / 24 / pill; all controls share one radius; nested radii = outer minus padding.
45. [layout] Elevation: max 3 tokenised levels (flat, raised card, overlay/sheet/modal); in dark mode express elevation with surface tint.
46. [layout] z-index tokens: base 0, sticky 10, dropdown 20, scrim 30, modal 40, toast 50; never > 100; modals/toasts/popovers in the top layer (`<dialog>`, `[popover]`).
47. [layout] `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; use `100dvh`/`svh`, never `100vh`, for the app shell.
48. [layout] Safe areas: fixed headers, tab bars, FABs and bottom sheets pad with `env(safe-area-inset-top/right/bottom/left)`; max 2 fixed bars; content reserves space so nothing hides behind them.
49. [layout] Reserve space for async content (skeleton, `aspect-ratio`, width/height) so CLS < 0.1.
50. [layout] Hierarchy from size, weight and space before colour or borders; group by proximity; one primary action per view.
51. [layout] Tables: scroll container with visible affordance or collapse to cards under 600px; chips/tags wrap instead of clipping.

### [motion]
52. [motion] Duration tokens: fast 120ms (press, toggle, hover), base 200ms (menus, transitions), slow 320ms (sheets, route); UI cap 500ms; exit about 60-70% of enter.
53. [motion] Easing tokens: enter `cubic-bezier(0,0,.2,1)`, exit `cubic-bezier(.4,0,1,1)`, standard `cubic-bezier(.2,0,0,1)`; `linear` only for spinners and determinate progress.
54. [motion] Animate only `transform`, `opacity` (and colour for state); never width/height/top/left/margin; never `transition: all`.
55. [motion] Distances: hover displacement < 2px, reveal offset 8-16px, press scale .97, stagger 30ms per item max 8 items.
56. [motion] Wrap `scroll-behavior: smooth` and all non-essential motion in `@media (prefers-reduced-motion: no-preference)`; under reduce, replace slides/scales with opacity or instant change.
57. [motion] Loops only for loaders: spinner, skeleton shimmer 1.2-1.6s cycle with one loop per skeleton group; pause when off-screen/hidden; no decorative infinite animation.
58. [motion] Motion must express cause and effect; animate at most 1-2 focal elements per view; animations are interruptible, never block input, and set the final state explicitly (do not rely on `transitionend`).

### [forms]
59. [forms] A visible `<label>` above every field (never placeholder-only); persistent helper text below; placeholder >= 4.5:1 and used only for format examples.
60. [forms] Input height >= 44px (48 primary), font-size >= 16px, padding 12x16; control border >= 3:1.
61. [forms] Correct `type`, `inputmode`, `autocomplete`, `enterkeyhint`; allow paste; password show/hide toggle with `aria-pressed`.
62. [forms] Mark required fields in text ("required") plus `required`; mark optional ones "(optional)".
63. [forms] Validate on blur and on submit, then live after the first error; never while the user is still typing the first time.
64. [forms] Errors sit under the field, use text + icon (not colour only), say cause and fix ("Enter a date like 14 Mar 2026"), link via `aria-describedby`, set `aria-invalid="true"`; error text >= 4.5:1.
65. [forms] On failed submit move focus to an error summary at the top (links to each field) and keep the inline errors; one error -> focus that field.
66. [forms] Submit: disable duplicates, `aria-busy`, label changes ("Saving..."), width stays stable; keep user input on error; autosave drafts on long forms; confirm success.
67. [forms] Prefer native controls (`checkbox`, `radio`, `select`, `date`, `<dialog>`, `<details>`) restyled with `accent-color`/`appearance`; checkbox/radio rows 44px including the label; group with `fieldset/legend`.
68. [forms] Destructive actions: prefer immediate action + Undo for >= 5-8s; otherwise a confirm dialog naming the object ("Delete 'Budget 2026'?") with verb buttons (Delete / Cancel); danger styling separated from primary.

### [feedback]
69. [feedback] Design six states for every data view: loading, empty, error, offline, partial, success. No blank screens.
70. [feedback] Loading: < 100ms show nothing; 100-300ms keep previous content; > 300ms skeleton mirroring the layout or an inline spinner; > 2s with known length use determinate progress; set `aria-busy`; keep layout stable.
71. [feedback] Empty state = one-line explanation + single primary action ("Add your first entry"); separate variants for first-use vs no-results (with "Clear filters").
72. [feedback] Error state = what happened + what to do + Retry; preserve user data; friendly non-blaming copy; distinct offline message.
73. [feedback] Toasts: one at a time, `role="status"` (errors `role="alert"`), never steal focus, >= 5s scaled to length and paused on hover/focus, errors persist until dismissed, never the only channel for critical info, Undo action allowed, positioned above the tab bar and safe area.
74. [feedback] Confirm success briefly (check/inline/toast) within 100ms of completion; do not celebrate routine actions.
75. [feedback] Multi-step flows show "Step x of y", allow Back, preserve state.
76. [feedback] Offline: a persistent, unobtrusive banner ("You're offline - changes will sync"), disable only network-bound actions, queue writes, show "last updated". [gap-fill]

### [nav]
77. [nav] Bottom tab bar: 3-5 top-level destinations, icon + visible text label, >= 48px tall plus safe-area, active state by indicator/weight and `aria-current="page"` (not colour alone); switch to a rail/sidebar at >= 1024px.
78. [nav] Every view has a URL (hash or History API) so it is deep-linkable; system/browser Back works; preserve scroll and filters on return; never silently reset the stack.
79. [nav] On route change: update `document.title`, move focus to the main heading, announce via a live region. [gap-fill for SPAs]
80. [nav] Modal/sheet = `<dialog>` `showModal()` (focus trap, Esc, inert background), visible Close >= 44px, title via `aria-labelledby`, focus returns to opener, confirm discard if dirty; never use modals for primary navigation.
81. [nav] Navigation and help placement is identical on every view; secondary destinations (settings) separate from primary; logout/delete separated from normal items.

### [icon]
82. [icon] SVG only (inline sprite `<symbol>` + `<use>` or inline), `currentColor`; never emoji as structural icons; one family and one style (outline 1.5-2px stroke, round caps); size tokens 16 / 20 / 24 (32 for empty states); meaningful icons >= 3:1; primary nav = icon + label.

### [chart]
83. [chart] Never colour alone: direct labels, markers/patterns, line styles (solid/dashed/dotted); data marks >= 3:1 vs background, labels >= 4.5:1; visible legend next to the chart; <= 6 series, pie/donut <= 5 slices else bar; single-measure bars use one hue sorted descending.
84. [chart] Every chart ships an equivalent: `<figure>` + `<figcaption>` key-insight summary and a data table (`<details>`); keyboard-focusable points with non-hover tooltips; >= 44px hit areas; animation honours reduced motion; explicit empty/loading/error chart states; locale-aware numbers and dates; gridlines subtle and decorative.

### [perf]
85. [perf] Budgets: LCP < 2.5s, INP < 200ms, CLS < 0.1, about 16ms per frame, input response < 100ms.
86. [perf] Images AVIF/WebP with width/height or `aspect-ratio`, `loading="lazy"` below the fold, `decoding="async"`; icons as SVG; <= 2 font families, <= 3 weights, preload only the critical one; virtualise lists > 50 items or use `content-visibility:auto`; debounce search 200-300ms; no blocking third-party scripts.

### [pwa]  (all [gap-fill]: the dataset has no PWA guidance)
87. [pwa] `manifest.webmanifest`: `name`, `short_name` (<= 12 chars), `id`, `start_url`, `scope`, `display: standalone`, `lang`, `theme_color`/`background_color` equal to the surface token; icons 192 + 512 (`any`) + 512 `maskable` with artwork inside the central 80% safe zone; `<link rel="apple-touch-icon">` 180x180.
88. [pwa] Service worker: precache shell + offline fallback, versioned caches, non-blocking "Update available - Reload" prompt; test in installed/standalone mode (`@media (display-mode: standalone)`), supply an in-app Back control, set `-webkit-text-size-adjust:100%`, and apply `user-select:none`/`-webkit-touch-callout:none` to chrome controls only, never content.

---

## 6. Audit of the dataset: defects (quantified)

Severity: critical = would break WCAG 2.2 AA if inherited; major = would produce wrong/unusable output; minor = noise.

| ID | Where | Defect | Evidence | Sev |
|---|---|---|---|---|
| D-01 | `colors.csv` `Border` | No palette has a usable control border. 173 parseable: min 1.06, **median 1.22**, max 2.39:1 vs Background; **0/173 >= 3:1**. 19 dark palettes use `rgba(255,255,255,0.08)` (not parseable by tools, about 1.1-1.3:1). If `--color-border` is used on inputs it fails WCAG 1.4.11. | `analysis/contrast_audit.py`, `contrast_fails.json` | critical |
| D-02 | `design_system.py:1275,1283-1284` (MASTER `.input`) | Input border hard-coded `#E2E8F0` = **1.23:1** on white; focus = `outline:none` + `box-shadow: 0 0 0 3px <primary>20` (hex alpha `0x20` = **12.5%**, ring about 1.25:1) with a border-colour change only. Invisible to most users, removed entirely under `forced-colors`. Uses none of the palette tokens. | generated `persist/.../MASTER.md` | critical |
| D-03 | `colors.csv` (structure) | Every palette is **single-mode** (149 light, 43 dark). No light/dark pairs, so the rule `dark-mode-pairing` cannot be fulfilled from data; dark values must be authored. | `Background` luminance split | major |
| D-04 | `colors.csv` `Primary` | `Primary` is a fill colour, not a text/UI colour: **94/192 (49%)** fail 4.5:1 vs their own Background, **30/192 (16%)** fail 3:1 (dark palettes: `#0F172A` on `#020617` = 1.13:1). No `primary-text`/link token exists. `Destructive` as text fails 4.5:1 on Background in 64/192 (33%). | contrast_audit | major |
| D-05 | `design_system.py:1254` | `.card { background: <Background> }` uses the **page background** token not `Card` (in the generic palette card = page = `#EEF2FF`, contrast 1.00). | MASTER.md `.card` | major |
| D-06 | `design_system.py:1226,1243,1258` | `transition: all 200ms ease` on every component, contradicting its own `transform-performance` rule (animate only transform/opacity) and easing rule (`ease` is not deceleration). `.card` has `cursor:pointer` though not interactive; hovers `translateY(-1/-2px)` without `@media (hover:hover)` while the forbidden list says "Avoid layout-shifting hovers". | MASTER.md | major |
| D-07 | `design_system.py:1299` | `.modal { background: white }` hard-coded (breaks every dark palette; contradicts "no raw hex in components"); no `role=dialog`/focus-trap/`max-height`/`overflow:auto` for small screens; `backdrop-filter: blur(4px)` under the overlay. | MASTER.md | major |
| D-08 | `design_system.py:803,933,1380,1394` | Universal rule "Instant state changes - Always use transitions (150-300ms)" is appended to **every** output, contradicting `ux #8` ("Don't present 150-300ms as universal"), styles that require 0ms (Brutalism `--transition-duration: 0s`, Pixel Art, E-Ink `transition:none`), `micro-interactions` (50-100ms), and reduced-motion. README sample shows a different (newer) checklist than the code prints. | generator vs README | minor |
| D-09 | `ux-guidelines.csv #22` vs `#104` | Touch-target rows contradict: `#22` marks `w-6 h-6` (24px) as BAD, `#104` marks `min-width:24px` GOOD. No CSS-px value is given for a **mobile web** tap target (44/48 exist only as "pt/dp"), inviting 24px targets on phones. | search "touch target size" | major |
| D-10 | multiple | Four different z-index scales (`0/10/20/40/100/1000`, `10/20/30/50`, `z-0..z-50`, `z-[-1]`) and eight different duration regimes (section 4). | quick-ref 5 vs ux #15 vs stacks | minor |
| D-11 | whole dataset | **No PWA coverage**: grep for `pwa|manifest|service worker|display-mode|theme-color|safe-area env|viewport-fit` finds only Angular/Uno/WPF stack rows. `app-interface.csv` is 32/32 `iOS/Android/React Native`; `pro-rules.md` states it is "not desktop-web". `haptic-feedback` assumes native (`navigator.vibrate` is not available in iOS Safari). | grep of `data/` | major |
| D-12 | `cli/assets/skills/design-system/references/*` | Token sample values fail: input border `--color-gray-300` `#D1D5DB` = **1.47:1**; card border gray-200 = 1.24:1; `muted-foreground` gray-500 `#6B7280` on gray-100 `#F3F4F6` = **4.39:1** (fails 4.5). Focus ring is `outline:none` + `box-shadow` (vanishes in forced-colors). Only a `.dark` class, no `prefers-color-scheme`. Keep the architecture, not the values. | contrast calc | major |
| D-13 | `landing.csv`, `products.csv`, `ui-reasoning.csv` | "Pattern" axis = 34 marketing landing pages. Personal/utility apps get testimonial carousels and sales patterns (Habit Tracker -> Social Proof-Focused + `constraint:add-testimonials`; Mood Tracker, Fasting Timer likewise; run 5 -> "Enterprise Gateway / Contact Sales"). `Severity` is HIGH for 171/192 rows and `Confidence` is blank for 161/192 so neither discriminates. Anti-pattern "Muted colors + Low energy" appears in 18 rows and "Pure white backgrounds" in 13, both hostile to calm/minimal UI. | counts from `ui-reasoning.csv` | major |
| D-14 | `design_system.py` dials | `density` high tier = spacing 2/4/8/12/16/24/32: 4px gaps violate the repo's own 8px target-gap rule. | DIAL_TIERS | minor |
| D-15 | `styles.csv` Accessibility column | Templated: **all 88 rows have the identical** `requires:contrast-text-4.5,keyboard,visible-focus,reduced-motion`. Risk labels are optimistic/inconsistent: Brutalism `risk:low` yet "Do Not Use For: critical accessibility"; Micro-interactions `risk:low` yet "Do Not Use For: accessibility-first"; Neubrutalism `risk:low` with primaries `#FFEB3B` (1.22:1 on white), `#FF5252` (3.19), `#2196F3` (3.12); Flat Design `risk:low` with "solid bright Red, Orange, Blue, Green". Distribution: 52 low / 25 conditional / 11 high. | styles.csv | major |
| D-16 | `styles.csv` colour hints | Soft UI Evolution ("Improved contrast pastels") lists `#87CEEB`, `#FFB6C1`, `#90EE90` = **1.74 / 1.65 / 1.42:1** on white (white text on them fails; only black text passes at 12:1). Organic Biophilic `#87CEEB` on `#F5F5DC` 1.57:1. Nature Distilled terracotta `#C67B5C` on `#F5F0E1` 2.89:1, sand 1.50:1. Claymorphism pastels 1.2-1.6:1. Flat-mobile: white on Emerald `#10B981` 2.54:1, white on Blue `#3B82F6` 3.68:1, Amber `#F59E0B` on white 2.15:1. Micro-interactions feedback `#22C55E` 2.28:1, `#EF4444` 3.76:1. Brutalism `#FFFF00` 1.07:1, `#00FF00` 1.37:1, `#FF0000` 4.00:1. | contrast calc | major |
| D-17 | `products.csv` | Recommends Neumorphism (`risk:high`, "Do Not Use For: critical accessibility, high-contrast required") as a secondary style for Timer & Pomodoro, Sleep Tracker, Fasting Timer; Glassmorphism + OLED as primary for Personal Finance; Claymorphism (Do Not Use: "data-critical... finance") for Parenting/Habit/Recipe. Neumorphism test: `#E8E8E8` on `#F5F5F5` = 1.12:1. | products.csv #91, #107, #142, #147 | major |
| D-18 | `styles.csv` Dark Mode (OLED) | Recommends `#000000` + `#FFFFFF` text (21:1), neon accents and `text-shadow: 0 0 10px` glow, contradicting `color-dark-mode` ("desaturated/lighter tonal variants, not inverted"). Pure black base is acceptable (iOS uses it) but glowing neon text and pure white body text cause halation and reduced legibility. | styles.csv #7 | minor |
| D-19 | `charts.csv` | `Accessibility Grade` column is `deprecated: use Accessibility Risk` in **25/25** rows (dead column). Recommended colours fail 3:1 on white: `#FF9500` 2.20, `#4CAF50` 2.78, `#90A4AE` 2.59, `#F59E0B` 2.15, `#10B981` 2.54, `#94A3B8` 2.56, `#26A69A` 3.00 (borderline); bullet bands `#FFCDD2/#FFF9C4/#C8E6C9` 1.25-1.31:1 between neighbours; light-theme pulse `#00FF00` 1.37:1. "Each bar: distinct colour" for single-measure bar charts wastes the categorical palette and adds noise; red->yellow->green gauge gradients are CVD-unsafe (text fallbacks mitigate). The text/table fallbacks and "never colour alone" notes are good. | charts.csv | major |
| D-20 | `typography.csv` | All 74 rows deliver fonts via `@import url(https://fonts.googleapis.com/...)` (render-blocking CSS, contradicts the repo's own `critical-css`/`font-preload` rules); 8/74 `Google Fonts URL` values lack `display=swap`; Google CDN is offline-hostile for a PWA and a privacy leak; many pairs load 5 weights incl. 300. Query 1 and 5 pick a **handwritten heading (Caveat)** for a finance/"calm" app. | typography.csv | minor |
| D-21 | `icons.csv` | 105/105 are React imports (`@phosphor-icons/react`, `size={20}`), 100% "Outline"; "Semantic Role" is fixed per icon while the repo's own rule says role depends on context (Allowed Contexts is identical for all rows); icon sizes disagree (20 in CSV vs 24 in `pro-rules`, 22/24 in style configs). Unusable as-is for a vanilla no-build PWA. | icons.csv | minor |
| D-22 | `ux-guidelines.csv` code samples | `#1` `html{scroll-behavior:smooth}` with no reduced-motion guard (contradicts #9/#99); `#28`/`html-tailwind #26` use `focus:ring-2` (`:focus`, box-shadow) while `html-tailwind #41` uses `focus-visible`; `#25` recommends "touch-action or fastclick" (fastclick is obsolete); `#82` marks a persistent toast BAD without WCAG 2.2.1 caveats. | csv | minor |
| D-23 | Retrieval | `--domain ux "bottom navigation tab bar"` returns Sticky Navigation/Keyboard Navigation/Breadcrumbs (the bottom-nav rules live only in `quick-reference.md`, not the CSV, so the two sources are out of sync: 119 CSV rows vs about 170 quick-ref rules); `--domain ux "z-index scale modal"` ranks Stacking Context above Z-Index Management; `--domain style "minimal friendly calm clean"` returns just 1 result (misses Soft UI Evolution); `"retro windowed panels brutalist"` -> 0. BM25 + no stemming. | search.py runs | minor |
| D-24 | `projects/*/index.html` | Repo's own demos have 0 `:focus`/`:focus-visible` rules, 0 skip links, `aria-` 2/6/0. | grep | minor |
| D-25 | `colors.csv` row 89 | "Spatial Computing OS": Primary = Accent = `#FFFFFF`, note says "system blue", `Muted Foreground` on Background 1.63:1, Destructive `#FF3B30` on Background 1.0:1. Only 1 row, but it is the only `Muted Foreground`/Background failure in the file. | contrast_audit | minor |
| D-26 | Counts/docs | Conflicting counts across docs (README "79 styles / 74 fonts / 119 UX"; `stack/README` "84 styles / 73 fonts / 99 UX rules"); README example output stale vs code. | README vs code | minor |

Palette usability gate (my own): of 173 parseable palettes, **77 pass** {On-Primary, On-Accent >= 4.5; Primary >= 4.5 on Background and Card; Destructive >= 4.5 on Background; Muted-Foreground >= 4.5 on Background and Card; Ring >= 3 on Background and Card} and **0 pass** Border >= 3. Card vs Background median contrast 1.07:1 (153/192 below 1.10), so surface separation relies on shadows/borders that are themselves faint, and in dark themes shadows vanish. A palette here is a *seed*, never a finished token set.

---

## 7. Which styles match "clean, minimalist, friendly, communicative"?

Candidates read in `styles.csv`:

| Style (ID) | Fit | Take | Leave |
|---|---|---|---|
| **Minimalism & Swiss Style** (#1, active) | Structure, hierarchy, restraint | Single accent only, grid/spacing discipline, "no unnecessary decorations", shadow-none default, `a11y risk:low`, light+dark supported | `--border-radius: 0px` (cold, not friendly), pure `#000`/`#FFF`, "Do Not Use For: playful brands", `max-width:1200px` desktop bias |
| **Soft UI Evolution** (#19, active) | Friendly surface | radius 8-12px (`--border-radius:10px`), multi-layer soft shadow `0 2px 4px`, 200-300ms, focus outline 2-3px, contrast target "4.5:1+", Best For wellness/modern business tools | Its pastel colour list (fails, D-16) and "project-defined WCAG target" vagueness |
| **Accessible & Ethical** (#8, active) | Constraint layer | focus ring 3-4px, 44x44px targets, 16px min, skip links, reduced-motion, 7:1 target | Nothing; treat as requirements, not a look |
| **Micro-interactions** (#16, active) | Communicative feedback | success/error state animations, pressed states, `@media (hover:hover)`, loading spinners | 50-100ms regime as universal; "Do Not Use For accessibility-first" caveat means every effect needs a non-motion equivalent |
| Flat Design Mobile (Touch-First) (#75, supplemental) | Numbers | 48px targets, spacing 4/8/16/24/32/48, radius 6/12/999, press scale .97, solid bottom tabs | 800 weights, uppercase labels, bright palette (D-16) |
| Material 3 Expressive (#76, active) | Mechanics | state layers 10-15%, tonal elevation, `cubic-bezier(0.2,0,0,1)`, outline `#79747E` = 4.44:1 on `#FFFBFE` (passes 3:1), pill chips | Purple default, Android-specific sizes |
| Bento Box Grid (#39, active) | Home/dashboard tile layout only | 16px gap, radius 16-24, 4->2->1 columns | "Do Not Use For: dense data tables, text-heavy"; hover scale 1.02; card `#FFF` on `#F5F5F7` is only 1.09:1 |
| Neubrutalism (#38), Pixel Art (#52), Brutalism (#4) | **Optional retro/windowed theme** (no dedicated style exists) | Thick 2-4px borders + hard offset shadow `4px 4px 0` give naturally >= 3:1 control boundaries (an a11y plus); radius 0; bold type | Saturated primaries as text (D-16), `transition:none`, `risk:low` ratings |
| Neumorphism (#2), Claymorphism (#9), Glassmorphism (#3), Liquid Glass (#14), Aurora, Skeuomorphism | **Avoid** as a base | - | Low-contrast edges (Neumorphism `risk:high`), blur legibility, dense reading surfaces |

**Recommendation:** build on **Minimalism & Swiss** (layout, hierarchy, one accent) + **Soft UI Evolution** (8-12px radius, soft low-blur shadows, warm neutral surfaces) + **Accessible & Ethical** (non-negotiable constraints), with **Micro-interactions** supplying the feedback vocabulary (pressed, success, error, loading) and **Flat-Design-Mobile / M3** supplying concrete touch and state-layer numbers. Default dials: variance 2 (centered/minimal), motion 2-3 (subtle), density 5 (standard) with a `data-density="compact"` token mode that never shrinks targets below 44px or gaps below 8px. Model the retro/windowed look as a **theme** (token overrides: `--radius:0`, `--border-width:3px`, `--shadow-offset:4px`, mono/pixel font) on the same components rather than as a second system. Friendly comes from radius, warm neutrals (off-white `#FAFAF8`-ish backgrounds, not pure white, **[guess]**), plain-language copy, and generous spacing - not from pastel fills.

---

## 8. Things to adopt, adapt, avoid

- **Adopt**: the three-layer token architecture and state-priority order; the shadcn-style 16 colour roles (extended, see item 33); the Master + per-page override convention; the WCAG 2.2 row set (#100-#119) as acceptance criteria; the compact-label/chip rules (wrap collections, `+n` disclosure must be operable, badge != chip); the "search the semantic outcome first" query discipline; the Playwright multi-viewport heuristic audit as a CI model; chart a11y fallbacks (table + summary per chart).
- **Adapt**: touch numbers (44/48 CSS px, not 24), durations (token set above), z-index (named tokens + top layer), dark mode (authored pair), palettes (use as seeds; add `border-control`, `primary-text`, status `-text`/`-surface`, verify in CI).
- **Avoid**: generated component CSS (D-02, D-05-D-07), `transition: all`, Google `@import` fonts, landing-page patterns for app screens, Neumorphism/Glassmorphism/Claymorphism as a base, "muted colors = anti-pattern" advice, the hover-lift-on-card idiom, GSAP (not needed; CSS transitions and `@starting-style`/View Transitions suffice), React-only icon imports.

---

## 9. Confidence and limits

- Contrast numbers: computed, high confidence. Palette gate thresholds are mine.
- "About 170 quick-reference rules" is a count of the named bullets in `quick-reference.md`, rounded; the CSV has exactly 119 UX rows.
- Spacing/type/radius/duration recommendations blend the dataset with Material 3 / Apple HIG / Tailwind conventions from my own knowledge; values are defensible defaults, not measured optima **[guess]** where flagged.
- PWA items (manifest, maskable safe zone, `display-mode`, `viewport-fit=cover`, `env()`, `dvh`, `inert`/`<dialog>`, `navigator.vibrate` absence on iOS Safari) are from my knowledge of current web platform behaviour, not from the dataset, and should be re-checked against MDN/web.dev when the guide is written.
- MIT licence: rules can be re-expressed freely; if any CSV text is copied verbatim, keep the copyright notice.
