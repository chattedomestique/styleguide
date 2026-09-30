# CSS and tokens audit: Flashcards style sheet v0.1

Reviewer output, unedited except for layout. Method: line-by-line read of every shipped CSS file, ~26 Chromium probes, mutation tests of `check.mjs` in a scratch copy.

## Summary

ADVERSARIAL CSS AUDIT, Flashcards style sheet v0.1 (read-only; /design verified byte-identical to the uploaded zip afterwards). Method: line-by-line read of every shipped CSS file plus skim of wire/sheet, then ~26 Chromium probes (Playwright, axe-core 4.x, forced-colors emulation, DPR 1-3.5, 320-1280px, 100-300% text, RTL), mutation tests of tools/check.mjs in a scratch copy (audit-work/css/copy), and a fresh bundle diff. Only Chromium exists here, so every Safari/Firefox statement is flagged 'by spec/compat data, not reproduced'.

HEADLINE: the visual system is coherent and the CSS is cleaner than most (0 colour literals outside the colour file, 0 !important, one z-index value, logical properties throughout, STYLE.md numbers match the CSS almost everywhere). But four things would bite the generic guide immediately: (1) the study card, the app's core element, clips or overlaps any answer longer than ~12 characters or ~8 lines; (2) the keyboard focus ring is invisible on the collapse control of an ink-toned panel; (3) gate 3's documented colour/dark-mode handover does not work (base.css pins color-scheme: light above the tokens layer) and the gate that is supposed to protect it reports 'ok contrast' on a 1.28:1 palette; (4) fluid type tokens do not scale under browser zoom (display text grows 1.08x at 200%). The component root also has structural traps for a 40-component library (container-type on the root collapses cards to 4px in flex rows; descendant-wide focus rules will out-rank future components; --lift/--fill inherit into future buttons).

COUNTS: 4 critical, 16 major, 18 minor, 3 notes.

CONTRAST MATRIX (real greys, WCAG relative luminance; script audit-work/contrast.py). Ink #141414 on: paper 18.42, canvas 16.75, tone-1 15.45, tone-2 13.82, tone-3 12.31, tone-4 10.90, tone-5 9.60, tone-6 8.40. Paper on ink 18.42. ROLE --ink-soft #505050 on: paper 8.06, canvas 7.33, tone-1 6.76, tone-2 6.05, tone-3 5.39, tone-4 4.77, tone-5 4.20, tone-6 3.68 (role is bypassed by components). WHAT COMPONENTS ACTUALLY RENDER, card-ink-soft = color-mix(ink 72%, bg): paper 7.34, canvas 6.99, tone-1 6.76, tone-2 6.34, tone-3 6.01, tone-4 5.58, tone-5 5.15, tone-6 4.80; inverted (ink card) 9.81; ghost card text on canvas 6.67. axe color-contrast-enhanced (7:1) reports 27 node failures, all .card__eyebrow/.card__meta on tones 1,3,4,5 plus the ghost title on canvas. --ink-faint / --line-soft #8a8a8a on: paper 3.45, canvas 3.14, tone-1 2.90, tone-2 2.59, tone-3 2.31, tone-4 2.04, tone-5 1.80, tone-6 1.57. Hatch line tone-4 on paper 1.69; disabled ink-faint text on tone-1 2.90 (disabled is WCAG-exempt). Focus ring: ink on canvas 16.75, ink on tone-6 8.40, paper ring on ink bar 18.42, but paper ring on the PAPER bar of an ink panel 1.00 (invisible, C2). All STYLE.md contrast numbers (18.4 ... 8.4, 4.8) are accurate to 0.05. Pairs the gate never tests: ink-soft on tones, ink-faint on canvas/tones, line-soft anywhere, card-ink-soft on canvas (ghost), every focus ring except 'focus on canvas', accent vs card-bg (action circle fill, non-text 3:1), ring on bar, selection, hatch.

FILE SIZES (bytes, raw): card.css 16,586; sheet.css 20,669 (not shipped); foundation.css 4,069; base.css 2,954; wire.css 2,873; icons.css 2,621; color.wire.css 2,099; flashcards.css 1,185; fonts.css 733; shipped CSS total 33,120 (19,249 comment-stripped); dist/flashcards.css 32,971 (9,523 gzip; about 4,700 gzip if comments stripped); dist/style-sheet.html 233,645; Archivo woff2 90,104. dist is byte-identical to a fresh bundle (not stale). 120 custom properties declared in shipped CSS; 20 never read by shipped CSS (see m8).

FONT CLAIMS VERIFIED in Chromium: the keywords in the font shorthand compute exactly to condensed 75%, semi-expanded 112.5%, expanded 125% (document.fonts + getComputedStyle), the width axis really applies (same 40px string: 316.8px at 75%, 408.4 at 100%, 465.1 at 112.5%, 521.7 at 125%; clamps at 62-125% so extra-expanded/ultra-expanded render identically to expanded), file fvar is wght 100-900 / wdth 62-125, GSUB has tnum and pnum but no lnum (lining-nums is a no-op, harmless). Firefox and Safari honour font-stretch keywords in the shorthand by spec but were not testable here.

DOC-vs-CSS CONTRADICTIONS (CSS wins): (a) 'Below 18rem the trail drops' is actually 316px border-box because container queries measure the content box (m1); (b) ghost focus 'same lift as hover' is false: focus gives --lift 0, --fill 1 (m3); (c) 'Pressed' row claims all cards, CSS defines it only for .card--link; (d) rule 2 'Nothing else gets a shadow' vs --shadow-stack and --shadow-select (m7); (e) rule 3 'circles act' vs whole-card link, ghost and square .card__ctl (m7); (f) 'Don't pad .card itself' vs .card--row/.card--ghost (m2); (g) .t-meta documented 'soft ink' renders full ink; (h) icons '2px stroke, the frame's weight' is 1.67px at the default 20px and 1px at 12px (m4); (i) 'Every target is at least 44px ... the foot' vs 30x24 and 53x24 foot links (M6); (j) README gate 3 'the diff touches tokens/ only' vs the base.css color-scheme pin and the flashcards.css import edit (C3); (k) browser floor 'Chrome 114+' vs unprefixed mask needing Chrome 120 (m4); (l) README 'Holds from 360' vs STYLE 'from 320'; changelog says ten variants, variants table lists eleven rows.

GATE (tools/check.mjs) MUTATION RESULTS in scratch copy. CAUGHT: font-family literal, literal blurred box-shadow, literal radius, literal border width, transition in component, hex inside @media, undefined var(), real gradient, text-shadow, backdrop-filter. MISSED: default family inside the font shorthand (font: 16px Inter), named colours (white, blue), colour inside a url() data URI, blur hidden in a non --shadow-* custom property, filter: drop-shadow(0 4px 12px), outline: none, z-index 9999 !important, opacity/mix-blend-mode, physical properties and px magic numbers (out of scope by design), and a bogus var(--link)/var(--ghost) (because the definition regex also matches selector fragments like '.card--link:is(' at check.mjs:69). Baseline run FAILs 1 of 9 (doc drift, see N1).

ARTEFACTS OF UNZIPPING (not sheet defects): check.mjs check 7 FAILs on README mentions of .card-inner and .card-face because ../styles.css (the app) is absent; README 'Migrating the app' and the STYLE known-limit about the .card collision reference ../styles.css. Everything else in this report reproduces on the unzipped files alone (index.html also loads fine from file://, fonts included).

GENERICISATION MAP (Flashcards-specific coupling): entry file name flashcards.css; --ratio-study 5/7 in foundation tokens; .card--study/.card__stage/.card__answer; .wf-shape ('decks.js paths'); check.mjs reading ../styles.css and the GATES object hard-coded in the script; README migration section; rule 5 'copy comes from the app'; sample copy (Shapes, Colours, Deck). Numbered tone slots with no semantic roles, unprefixed global token and layer names, and the single 'components' layer are the things a 40-component guide will trip over first.

REPORT FILE: not written to disk. The session's system rules forbid writing report .md files and state the script reads only this structured output, so all detail is in the defects array (each with file:line, measured evidence, fix). Scratch probes and screenshots are in /tmp/claude-0/-home-user-styleguide/ddd7a47b-025b-5fad-834a-3ed80ecd2a05/scratchpad/audit-work/css/ (p1-fonts.mjs ... p26, PNGs: ink-bar-focus.png, fc-forced-*.png, notch-rtl.png, notch-disabled.png, study-*.png, longword.png, ts-*.png).

## Defects

### C1 (critical): css/components/card.css:482-508 (.card--study, .card__stage, .card__answer)

**Problem.** The study card (the app's core element) has no overflow policy. The grid has an implicit auto column and a minmax(0,1fr) row inside a fixed 5/7 box with overflow: clip, and .card__answer has text-wrap: balance but no overflow-wrap and a size that ignores text length. Any answer with a long word is cut off at the card edge (the whole grid also grows wider than the card), and any answer over ~8 lines runs down through the foot and out of the bottom of the card.

**Evidence.** p8-study.mjs at 390px, 100% text: 'Quadrilateral' (13 chars) overshoots the card right edge by 24px (renders 'Quadrilatera'); 'Constantinople!!!!' by 155px; a 17-word sentence renders 9 lines at 59px and overshoots the stage bottom by 205px, overlapping the foot text. At 200% text, 'The capital city of Australia is Canberra, not Sydney' overshoots the stage by 345px. Also at 320px. Screenshots: study-100-390-word13.png, study-100-390-phrase-long.png, ts-390-100.png (grid children +41px wider than the 352px card).

**Fix.** grid-template-columns: minmax(0,1fr); .card__answer { overflow-wrap: anywhere; hyphens: auto; min-inline-size: 0 }; size the answer by content (fit-text via container query steps on length class, or clamp with smaller cqi plus a max-block-size and a scroll/expand affordance); let .card--study grow (min-block-size: auto, aspect-ratio as preference) instead of clipping; never rely on overflow: clip to hide user content.

**Generic guide.** Move to a generic 'fixed-ratio content card' with a documented overflow contract (wrap, shrink, or scroll) and a stress-test specimen (longest word, 200 chars, 200% text) that the gate renders.

### C2 (critical): css/components/card.css:72-83 (.card :focus-visible, .card__bar :focus-visible, .card[data-tone="ink"] :focus-visible)

**Problem.** Keyboard focus is invisible on the collapse control of an ink-toned panel (WCAG 2.4.7, 2.4.11/2.4.13). In an ink card the bar flips to paper (--card-bar-bg: paper), the bar rule sets the ring to --card-bar-ink (ink), but the later-specific rule .card[data-tone="ink"] :focus-visible (0,3,0) beats .card__bar :focus-visible (0,2,0) and forces outline-color: --card-ink (paper). Result: a paper ring on a paper bar. Gate 2 (keyboard-only pass) was ticked with this state broken.

**Evidence.** p3-focus.mjs: focused .card__ctl in the ink Decks panel computes outline rgb(255,255,255) 3px offset -3px on bar background rgb(255,255,255) (contrast 1.00:1). Screenshot ink-bar-focus.png shows no ring; plain-bar-focus.png (non-ink) shows it. Ink-card list links (paper ring on ink) are fine.

**Fix.** Stop solving ring colour with descendant specificity. Give the surface a token (--ring-color) that each surface sets (card: var(--card-ink); bar: var(--card-bar-ink)) and have the single global rule read it: :focus-visible { outline-color: var(--ring-color, var(--focus)) }. Add a gate check that renders every focusable in every tone and asserts ring/background >= 3:1.

**Generic guide.** Every inverted surface in a 40-component system (bars, nav, toasts, dialogs on scrim) will hit this; make the focus colour a context role, or draw a two-tone ring (outline + contrasting box-shadow) so it works on any surface.

### C3 (critical): css/base.css:14 vs README.md 'Colour handover' step 5; css/flashcards.css:17-25

**Problem.** Dark mode, which gate 3 promises via 'color-scheme: light dark and light-dark() in the roles', silently cannot work. base.css pins html { color-scheme: light } in the base layer, which sits above the tokens layer where the README tells you to put color-scheme: light dark. Layer order beats specificity, so the pin always wins and every light-dark() resolves to its light value. It also contradicts the README promise that the colour gate 'touches tokens/ only' (it needs base.css and flashcards.css edits).

**Evidence.** p2-cascade.mjs: context colorScheme 'dark', @layer tokens { :root { color-scheme: light dark; --probe: light-dark(rgb(1,2,3), rgb(9,8,7)) } } -> computed :root color-scheme 'light', probe color rgb(1,2,3) (expected rgb(9,8,7)); matchMedia('(prefers-color-scheme: dark)').matches was true.

**Fix.** Remove color-scheme from base.css (or move it to tokens/color*.css where the palette owns it) and have color.css declare color-scheme: light dark on :root. Add a gate test that emulates dark and asserts a light-dark() probe flips.

**Generic guide.** Themes (light, dark, high-contrast, brand) should be selected by one attribute/media switch that only the colour layer owns; nothing in base may pin a scheme.

### C4 (critical): tools/check.mjs:281-282 (decl merge), 254-272 (parseColour), 290-296 (pair), 298-314 (thresholds)

**Problem.** The contrast gate can report 'ok' on a failing palette, three ways. (1) It merges every tokens/color*.css file alphabetically with last-wins; after the documented handover (color.css added, color.wire.css still present because the README never says delete it) color.wire.css sorts last and wins, so the gate keeps validating the old greys. (2) parseColour only understands hex, rgb() and oklch(); light-dark(), hsl(), color-mix(), oklch with alpha and display-p3 are skipped, and a skipped pair is a note, not a failure (exit code unchanged). (3) Tone text is tested at 4.5:1 and soft text at 4.5:1 while the project's own stated targets are 7:1 (ink) and AAA in the new brief.

**Evidence.** Copy in audit-work/css/copy: real palette with on-tone-6 at 1.28:1 + color.wire.css present -> 'ok contrast'; delete color.wire.css -> 'FAIL on-tone-6 on tone-6: 1.28:1'. With ink=light-dark(#141414,#777777), paper=light-dark(#fff,#787878): 'ok contrast (skipped 14 pair(s))' though dark contrast is ~1.0:1. With ink=hsl(0 0% 99%) on white paper: 'ok contrast (skipped 12 pair(s))'.

**Fix.** Resolve colours in a real engine instead of regex: load the page in a headless browser (or use culori) and read computed colours for every role pair in every theme; make unparseable/skipped pairs a hard failure; read only the file flashcards.css actually imports; raise thresholds to the declared targets (7:1 text, 3:1 non-text) and list pairs explicitly per component.

**Generic guide.** A generic guide needs the contrast matrix generated from a declared pair list (role x surface x theme x state) that every component registers, rather than a hard-coded set of greys.

### M1 (major): css/tokens/foundation.css:20-23 (--text-xl..--text-4xl clamp with vw) and card.css:176,196,503 (cqi clamps)

**Problem.** Fluid sizes built on viewport/container units do not scale with browser zoom (F94-style failure of WCAG 1.4.4 Resize Text). --text-4xl has a max/min ratio of 3.5 (the usual safe bound is 2.5) so display text barely grows when the user zooms; titles and figures grow well under 2x.

**Evidence.** p12-zoom.mjs, device px of the same element: 1280px@1x vs 640px@2x (200% zoom): display 208 -> 224 (1.08x), card title 25.5 -> 44 (1.73x), card figure 86 -> 141 (1.64x), study answer 54 -> 89 (1.64x), hero lede 32 -> 53 (1.66x). At 400% (320@4x): display 1.31x, title 3.45x. rem-based body/meta text scales 2x.

**Fix.** Bound every fluid clamp so max <= 2.5 x min and express the middle term with rem + vw (calc(1rem + 1vw)) so the user's font size participates; for cqi sizes add a rem term. Publish UI sizes (chrome text) as fixed rem tokens and reserve fluid sizes for a small named display ramp; add a zoom-growth check (>= 2x at 200%) to the gate.

**Generic guide.** Split the scale: --text-xs..lg fixed for UI, --display-1..3 fluid with documented bounds.

### M2 (major): css/components/card.css:34 (--card-ink-soft), tokens/color.wire.css:32 (--ink-soft), check.mjs:300-301,311-312

**Problem.** Secondary text fails the 7:1 target on most surfaces and there are two different soft inks. Components ignore the --ink-soft role (#505050, never read by shipped CSS) and mix ink 72% into the card background instead, so contrast depends on the tone and bottoms out at 4.80:1 on tone-6. The gate checks 4.5:1, so it never notices. 14px eyebrow/meta text is not large text.

**Evidence.** axe color-contrast-enhanced: 27 failing nodes, e.g. .card__eyebrow #434343 on #bbbbbb 5.15; #464646 on #c7c7c7 5.58; #494949 on #d3d3d3 6.01; #505050 on #ebebeb 6.76; ghost title #565656 on canvas 6.67. Role ink-soft (#505050) itself only reaches 7:1 on paper (8.06) and canvas (7.33); below 7 on all six tones (6.76 ... 3.68). Mix needs ~90% ink on tone-6 to reach 7.08.

**Fix.** Define soft ink per surface as a paired token (--on-tone-N-soft, --ink-soft) chosen to pass 7:1 and verified by the gate, delete the color-mix, or make tones 4-6 lighter so the pairs can pass. Enforce 7:1 for all body-size text, 4.5:1 only for >=24px/19px bold.

**Generic guide.** Replace 'soft' percentages with explicit text-role tokens (primary, secondary, tertiary) each registered against a named surface set.

### M3 (major): css/components/card.css:88-118, 243-265, 169-192 (.card__bar/.card__label/.card__ctl, .card__list, .card__eyebrow/.card__text/.card__meta)

**Problem.** No slot except .card__title has any long-content policy, and the card clips (overflow: clip). A long unbreakable label pushes the collapse control out of the card where it is clipped and unreachable by pointer; a long list link pushes the trailing count out; eyebrow/text/meta have no overflow-wrap. Flashcards and most PWAs render user-generated names.

**Evidence.** p24-longword.mjs at 288px card, label 'Donaudampfschifffahrtsgesellschaft' (34 chars, 13px condensed caps): bar control overshoots the card by 58px (fully clipped); list count span overshoots by 16px; a 68-char eyebrow runs off the right edge. Screenshot longword.png. At 320px with 300% text the bar control also leaves the card (p7b-textscale.mjs: card__ctl +105px). Title and row title wrap correctly (break-word).

**Fix.** Give every text slot min-inline-size: 0 and overflow-wrap: anywhere (or a shared .t-* rule); make .card__label flex: 1 1 auto with overflow-wrap; make .card__list a min-inline-size: 0 and keep counts flex: none; never let a flex:none control sit after an unshrinkable sibling.

**Generic guide.** Put the wrap/shrink contract in base (:where(h1..h6,p,li,a,span,label){overflow-wrap:anywhere}) and require every component specimen to include a long-word case.

### M4 (major): css/components/card.css:53,58,361-365 (container: card / inline-size on the root, overflow: clip, permanent transform on .card--link)

**Problem.** Putting container-type: inline-size on the component root makes the card have no intrinsic width, so it collapses to its two borders in any shrink-wrapping parent: flex rows and carousels (the most common PWA card layout), inline-block, absolute/toast/popover wrappers, table cells. Documented, but it is an adoption trap for a generic library. Separately overflow: clip clips any absolutely positioned child (menus, tooltips), and .card--link always carries a transform (translate(0,0)) which makes it the containing block for position: fixed descendants.

**Evidence.** p18-collapse.mjs: card widths with shrink-wrapping parents: flex row [4,4], inline-block [4], absolute [4], table cell [4]; only a stretching grid cell works ([250,250]). p22-contain.mjs: a 200x200 absolutely positioned menu inside a card is clipped (elementFromPoint below the card is not the menu); a position: fixed child inside .card--link sits at offset (7,7) from the card instead of the viewport.

**Fix.** Do not make the component root the container. Use a wrapper/slot (.card-slot, or container-type on .card-grid > *), or drop cqi and use @container from the grid item; give .card a default inline-size: min(100%, var(--card-w)); use translate: only while lifted (not permanently) and overflow: clip only on the media part; use popover/top-layer for overlays.

**Generic guide.** State in the contract which parts may establish containers/stacking contexts; every component in a 40-piece library must survive flex, grid, inline and absolute parents.

### M5 (major): tools/check.mjs:69,93,129,143-149,172-176 (rules 1-4)

**Problem.** The gate's claims are wider than its checks. Mechanical tells and tokens can be bypassed with trivial variations, and the undefined-token rule can be satisfied by selector text.

**Evidence.** Mutation runs in audit-work/css/copy (p-series shell, each appended to card.css): MISSED: 'font: 16px Inter, sans-serif', 'color:white; border-color:blue', colour in a url() data URI, '--glow: 0 0 20px ink; box-shadow: var(--glow)', 'filter: drop-shadow(0 4px 12px)', 'outline: none', 'z-index: 9999 !important', 'opacity/mix-blend-mode'. var(--link) and var(--ghost) pass as 'defined' because /(--[a-z0-9-]+)\s*:/ matches '.card--link:is(' and '.card--ghost:is('. Caught: font-family literal, blur box-shadow, literal radius/border width, transition, hex in @media, gradient, text-shadow.

**Fix.** Parse CSS with a real parser (postcss/lightningcss) and check declarations by property and computed value; ban named colours via a property-aware allowlist (system colours, currentColor, transparent, inherit); resolve custom properties to catch blur in any token; scan filter/outline/!important/z-index scale; anchor the definitions regex to declaration context (inside {} and starting --name:).

**Generic guide.** Ship the rules as a config (rules.json) so a second app can add its own banned list without editing the script.

### M6 (major): css/components/card.css:222-226 (.card__foot :is(a, button) { min-block-size: 1.5rem })

**Problem.** Inline links in the foot are 24px tall, below the 44px target the brief and STYLE.md's own 'Every target is at least 44px ... the foot' claim. Passes WCAG 2.5.8 (24px) but not 2.5.5 and not the owner's target; the foot is 44px but the link is not the foot.

**Evidence.** p10-targets.mjs at 390px: a 'Start' 30x24, a 'Carry on' 53x24. All other controls measured: .card__ctl 44x44, .card__action 44x44, list links 242-251x44, stretched link = whole card, ghost 308x80.

**Fix.** Make foot links min-block-size: var(--hit) with padding-block (or extend the hit area with ::after inset: -10px) and add a gate step that measures every focusable's box in a rendered page.

**Generic guide.** Publish a --target-min (44) and --target-aa (24) pair and require each component to declare which it meets.

### M7 (major): css/components/card.css:598-617 (forced-colors block), icons.css:56-61, wire.css

**Problem.** Forced-colours coverage is partial, so several meanings vanish: the stack variant loses both sheets (box-shadow is stripped); the notch is reduced to an ordinary rectangle (background-image: none) with the button now inside the card; the bar loses its fill and has no border, so in a plain panel the bar and body merge; selected swaps box-shadow for a 4px border, which enlarges the card by 2px per side (contradicting 'nothing shifts'); hover and focus are the same 4px Highlight outline and pressed equals rest; disabled loses its muted text (only the dashed border remains).

**Evidence.** p4-forced.mjs with forcedColors: 'active' (fc-forced-stack.png, fc-forced-notch.png, fc-forced-panel.png, fc-forced-states.png): stack renders as a plain card; notch computed background-image 'none'; selected card visibly larger than its siblings in fc-forced-states.png; .card--link hover/is-focus outline identical.

**Fix.** Add forced-colors rules: stack -> real borders/pseudo-element sheets instead of box-shadow; bar -> border-block-end: var(--bw) solid CanvasText; selected -> outline (not border-width) so nothing reflows; distinguish focus (Highlight, 4px) from hover (2px dashed or underline); disabled -> GrayText. Add a forced-colors screenshot pass to the gate.

**Generic guide.** Require a forced-colors specimen for every component state; never encode a meaning only in box-shadow, background or opacity.

### M8 (major): css/wire.css:104-110 (disabled hatch in the wire layer), card.css:557-565

**Problem.** The disabled look lives in a later cascade layer than the components, so it overrides them: on a disabled notch card the hatch replaces the four-layer silhouette and the card loses its frame entirely. aria-disabled on the .card does nothing to descendants: the real button/links inside stay focusable and operable by keyboard, and the notch button still looks enabled. The only rule for hover cursor is dead: pointer-events: none prevents cursor: not-allowed from ever showing. The hatch also depends on the 'disposable' wireframe layer.

**Evidence.** p6-misc.mjs: .card--notch with aria-disabled: computed background-image becomes repeating-linear-gradient(135deg...) and the screenshot notch-disabled.png shows a frameless hatched square with an unchanged, fully contrasted circular button beside it.

**Fix.** Move the disabled visual into card.css (border + pattern token), exclude .card--notch or restyle its four layers with --card-line, set inert (or disabled/tabindex=-1 on descendants) in the documented markup, and delete cursor: not-allowed or drop pointer-events.

**Generic guide.** State visuals and state semantics (inert, aria-disabled, disabled) should be one documented pair per component; disposable scaffolding layers must never contain rules that target real components.

### M9 (major): css/components/card.css:437-476 (.card--notch)

**Problem.** The notch mixes logical and physical geometry. The silhouette is painted with physical background-position/size (cut at top-right), but the head padding and the action position use logical properties, so in RTL they flip to the left while the cut stays at the right: the text runs into the cut and the button leaves it.

**Evidence.** p6-misc.mjs with dir=rtl: head padding-left 80px / padding-right 16px; button rect x 402-446 inside a card spanning 388-688 (left side) while the cut is at the right; screenshot notch-rtl.png shows 'Due today' overlapping the notch edge and the circle stranded at the top-left. (Normal LTR and all fractional-DPR line thickness are correct: 20 width x DPR combinations matched plain borders exactly.)

**Fix.** Use logical painting (background-position-x with calc(100% - ...)) plus a [dir=rtl] mirror via a single --notch-flip variable, or build the silhouette with clip-path/mask in logical order; add an RTL specimen and a DPR sweep to the gate.

**Generic guide.** Any component with a directional gesture (notch, tail, badge corner) needs a mirrored RTL contract; the guide should list directional components explicitly.

### M10 (major): css/components/card.css:357-366,514-526 (.card--link transform on :hover)

**Problem.** Hover moves the card 2px up-left, which pulls it out from under a pointer resting in the last 2px of the right/bottom edge, ending hover, which drops the card back under the pointer: a flicker loop for any pointer in that band. The shadow does not take part in hit testing so it cannot help.

**Evidence.** p5b-hover.mjs: pointer placed 1px inside the bottom-right of the rest box and nudged 0.3px per move: --lift per mousemove = 0101010101010101 (card alternates lifted/rest); card rest right/bottom (811.5, 568.0) vs lifted (809.5, 566.0) with pointer at (810.5, 567.0).

**Fix.** Do not translate the hit-testable box on hover: move the content inside (translate the ::before face) or keep the element still and draw the lift as shadow only; or add a pointer-stable wrapper with padding equal to the lift.

**Generic guide.** A 'pressable' contract for all components: hover/press feedback must not change the element's hit area.

### M11 (major): css/fonts.css:13-16, dist/flashcards.css:31, tools/bundle.mjs:38-43

**Problem.** Font delivery is Latin-only and brittle. The subset lacks Latin Extended-A/B and Vietnamese, so a language-learning or multilingual PWA falls back glyph-by-glyph to a different face (mixed widths mid-word); ↗ → ✓ ₹ are absent (icons are masks so fine). There is no size-adjust/metric override fallback, and the width axis (expanded display, condensed labels) does nothing in the fallback stack. dist/flashcards.css references ../fonts/archivo-latin-var.woff2, which breaks when the bundle is copied anywhere but next to a fonts/ dir.

**Evidence.** fontTools on the shipped woff2: cmap has ó, Ă but lacks ą ć ę ł ń ś ź ż ă đ ơ ư ₹ → ✓. p20-fallback.mjs with the woff2 blocked: display text width -24%, label +21%, figure -14%, height +2-7% (layout shift). dist line 31: src: url("../fonts/archivo-latin-var.woff2").

**Fix.** Ship latin-ext and vietnamese as further @font-face blocks with unicode-range; add a metric-matched fallback @font-face (size-adjust/ascent-override) for each stretch used; build the font URL from a --font-path variable or an @import url with a base and let the bundle emit an absolute/relative option; preload the woff2.

**Generic guide.** Make the font pipeline a parameter of the system (family, axes, subsets, path) rather than hard-coded Archivo paths.

### M12 (major): css/tokens/foundation.css (--text-*, --font-sans, --radius-*, --ease-out, --ring, --space-*), color.wire.css (--accent, --focus), flashcards.css:17 (layers base/components)

**Problem.** Unprefixed global names collide with widely used systems a second app may already load. Tailwind v4 theme variables include --text-xs, --font-sans, --font-mono, --radius-*, --ease-out and cascade layers named base and components; shadcn-style CSS uses --ring (a colour there, a width here) and --accent (a subtle hover colour there, the 'press this' colour here). Also registered properties (--lift, --fill, --tone-bg, --tone-ink) are global singletons: a second registration with a different syntax is ignored.

**Evidence.** By published names (not executed here). Internally: --ink-soft vs --card-ink-soft are different values with the same stem; --ring (width) vs --focus (colour) use different nouns for the same concept.

**Fix.** Choose a namespace prefix (for example --fc-*, --ds-*) for every token and registered property and namespace the layers (@layer fc.tokens, fc.base, fc.components) so the library can be positioned as one unit; publish an 'integrating' note that app CSS goes in a layer declared after the library.

**Generic guide.** Decide the prefix now, before 40 components depend on the short names; generate the un-prefixed aliases from the prefixed ones, not the reverse.

### M13 (major): css/components/card.css:72-83 and 243-269 (descendant selectors in one 'components' layer)

**Problem.** Focus is solved with descendant-wide rules in the shared components layer: .card :focus-visible sets outline-offset for every focusable descendant, and .card[data-tone="ink"] :focus-visible (0,3,0) recolours every one. Any future Button, Field, Tag, Chip or Tab placed inside a card will tie or be out-ranked by these rules (a single-class component rule is 0,2,0 at best), and a button with its own fill inside an ink card will get a paper ring on paper (same bug class as C2). Likewise .card--row .card__title and .card--ghost .card__title override by specificity.

**Evidence.** Specificities read from card.css: .card :focus-visible (0,2,0), .card__bar :focus-visible (0,2,0), .card[data-tone="ink"] :focus-visible (0,3,0), .card__list a:focus-visible (0,2,1). The C2 failure is a live instance.

**Fix.** Use :where() for context rules (zero specificity), sub-layers per component (fc.components.card, fc.components.button), and context tokens (--ring-color, --ring-offset) instead of selector overrides; ban descendant element selectors in components through the gate.

**Generic guide.** Write the rule: a component styles only itself and its own parts; context arrives through custom properties.

### M14 (major): css/components/card.css:17-27 (@property --lift/--fill inherits: true), 34 (--card-ink-soft), 288-289 (.card__action)

**Problem.** Three state-plumbing hazards. (1) --lift and --fill inherit, so any descendant control added later (the Button the card slots are waiting for) receives the card's hover/press state: it will fill and lift whenever the card is hovered, even when the pointer is elsewhere. (2) Derived component tokens are resolved once at .card (--card-ink-soft from --card-ink/--card-bg), so a descendant that redefines --card-bg (the notch action already does) keeps a stale soft ink. (3) The plan for gate 4 is to transition --lift/--fill, which animates box-shadow and colour (paint, main thread), contradicting the stated rule 'only transform and opacity move'.

**Evidence.** p2-cascade.mjs: a child of an element with --lift:1 / --fill:1 reads 1 / 1 (registered inherits: true); --tone-bg / --tone-ink read '' in the child (inherits: false, as designed). card.css:470-476 re-declares --card-bg/--card-ink on the notch action but nothing recomputes --card-ink-soft.

**Fix.** Register --lift/--fill with inherits: false and set them explicitly on the parts that react; register the derived tokens (or compute them with @property-registered colours on the part), or re-declare derived tokens at every scope that changes their inputs; decide motion policy before gate 4 (drive transform/opacity only, colour swaps by cross-fading layers).

**Generic guide.** Document which tokens are scope tokens (non-inheriting) and which are theme tokens (inheriting); keep state vocabulary (--pressed, --hovered) component-prefixed.

### M15 (major): css/base.css:134-167 ([data-tone]), tokens/foundation.css:97-105 (@property --tone-bg/--tone-ink), tokens/color.wire.css

**Problem.** The colour contract is too thin and too local for 40+ components. data-tone exposes only a fill and a text colour and, because --tone-bg/--tone-ink are non-inheriting, it cannot theme a region (a toned wrapper does not reach the card inside). There is no semantic set (danger/success/warning/info) with on-* pairs, no border/outline tone, hover/pressed shades, scrim/overlay, selection, link, placeholder, field, chart or elevation roles; tones are numbered 1-6 with no semantic. Tags, buttons, toasts, charts and dialogs each need these.

**Evidence.** p2-cascade.mjs: <div data-tone="ink"><article class="card"> -> card background rgb(255,255,255), colour ink (tone on the wrapper is ignored). Roles in color.wire.css: canvas, paper, ink, ink-soft, ink-faint, line, line-soft, focus, accent, on-accent, tone-1..6, on-tone-1..6 only (20 roles).

**Fix.** Split 'surface' (inheriting, region scoped: --surface-bg, --surface-ink, --surface-line, --surface-ring) from 'tone' (per element); add semantic status roles with AAA pairs, --scrim, --selection, --link, --field-*; give tones a third variable (--tone-line) and state tokens; keep six decorative slots but name them for purpose.

**Generic guide.** Model colour as surfaces x emphasis x state with each cell a role; the wireframe greys are a valid first implementation of the same role table.

### M16 (major): css/base.css:14,71-74; whole shipped CSS (no @media prefers-*)

**Problem.** No platform-preference foundations. Shipped CSS contains no prefers-reduced-motion, prefers-contrast, prefers-color-scheme, prefers-reduced-transparency, hover-none or safe-area handling (grep: zero hits outside sheet.css's single scroll-behavior guard). The motion tokens (--dur-press/hover/move, --ease-*) are declared but nothing zeroes them for reduced motion, so every future transition has to remember; gate 4 says 'reduced motion means gentler', but no mechanism exists. --focus is one colour with no high-contrast variant.

**Evidence.** grep -rn 'prefers-\|safe-area\|touch-action\|tap-highlight' css (excluding sheet.css) -> only base.css:14 color-scheme: light. Tokens declared but unused: --dur-press, --dur-hover, --dur-move, --ease-out, --ease-flip.

**Fix.** Add a global reduced-motion layer that redefines --dur-* to ~0 and disables smooth scrolling/animation, a prefers-contrast: more token set (thicker --bw, stronger --ink-soft), color-scheme ownership in the colour file, and have the gate fail when a component animates without using --dur-*.

**Generic guide.** Treat these as tokens-layer features (motion, contrast, scheme, density) so components never write @media for them.

### m1 (minor): css/components/card.css:339-349 (@container card (max-width: 18rem)) and STYLE.md 'Row'

**Problem.** Container queries and cqi measure the container's content box, not its border box, so the documented 18rem is not what happens. For .card--row (2px border + 12px padding) the trail drops at 316px border-box (19.75rem), a 28px (about 10%) discrepancy. The same applies to the cqi sizes (8cqi of the content box).

**Evidence.** p15-container.mjs: sweeping card width 400 -> 200px, .card__trail grid-column flips to 2 at border-box 316px; title font-size 27.68px at 350px wide equals 8% of 346px content width (not 350px).

**Fix.** Document thresholds as content-box, or move padding off the container (see m2) so border box and content box differ only by the border; consider container-type on an unpadded wrapper.

**Generic guide.** State query semantics once in the guide (content box) and give container widths as tokens.

### m2 (minor): css/components/card.css:316-323 (.card--row padding), 398-408 (.card--ghost padding)

**Problem.** Two variants pad the .card itself, contradicting STYLE.md 'Don't pad .card itself; padding goes on the parts' and the 'never cqi on .card' family of rules. Anything later that uses var(--card-pad) on the card root would resolve 5cqi against the parent container, silently wrong.

**Evidence.** card.css:322 padding: var(--space-3); card.css:403 padding: var(--space-4). --card-pad (card.css:38) contains 5cqi and is only consumed by descendants today.

**Fix.** Move padding into .card__main / .card__tile wrappers or a .card__inner part; or document the exception and never export --card-pad outside the card.

**Generic guide.** Export padding as a container-relative token only from a part that is guaranteed not to be the container.

### m3 (minor): css/components/card.css:296-298, 514-542 (action/ghost states)

**Problem.** State definitions drift from STYLE.md: ghost keyboard focus sets --fill: 1 but not --lift (doc: 'same lift as hover'); the ghost hover restyle (solid border, paper fill) and .card__action:hover are not inside (hover: hover), so on touch they stick after a tap; :active/pressed exists only for .card--link; the notch's real button has no pressed, focus fill or disabled styling.

**Evidence.** p16-ghost.mjs: keyboard focus on ghost -> --lift 0, --fill 1, boxShadow unchanged; rest -> dashed, transparent. Lines 534-542 are outside @media (hover: hover); line 296 too.

**Fix.** Wrap all :hover visuals in @media (hover: hover), give the ghost and action the same state block as .card--link, and let the future Button own .card__action's states.

**Generic guide.** One state template (rest, hover, focus-visible, active, selected, disabled) shared by all pressable components; the gate diffs each component against it.

### m4 (minor): css/icons.css:15-19,28-29, base.css:48-53

**Problem.** Icons do not match the documented weight and will not scale to a full set: the stroke is 2 in a 24 viewBox, so it renders 1.67px at the default 20px and 1px at the 12px size used inside .card__ctl (there are more than two line weights in practice); masks use unprefixed mask, which Chrome only supports from 120 (the docs claim Chrome 114+) and when unsupported the .ic shows as a solid currentColor square; all icons live as data-URI custom properties on :root (2.6KB for five; ~40KB for 100); base.css makes every svg display: block with max-inline-size: 100%, which will break inline SVG icons used in text.

**Evidence.** Geometry: 2/24 x 20px = 1.67px; 2/24 x 12px = 1.0px. base.css:48-53 img, svg, video { display: block }. icons.css:28 mask: var(--ic) ... with no -webkit-mask. Browser floor from compat data, not reproduced here.

**Fix.** Use vector-effect: non-scaling-stroke in inline SVG or per-size masks with stroke-width set to the --bw design value; add -webkit-mask and raise the floor, or use an SVG sprite/inline <svg> with currentColor; scope the reset to :where(img, video, canvas) and leave svg inline.

**Generic guide.** Define the icon contract (grid, stroke in px at 16/20/24, sprite delivery) before adding more than five.

### m5 (minor): css/components/card.css:482-487 (.card--study) and tokens/foundation.css:85 (--ratio-study)

**Problem.** A 5/7 card at max-inline-size 22rem is 493px tall with no bound by viewport height, so on a landscape phone (about 340-390px of usable height) the whole flashcard cannot be seen; it is also left-aligned in a wide column rather than centred. --ratio-study is app-specific.

**Evidence.** p7b-textscale.mjs: card 352x493 (ratio 0.714) at a 390px viewport; 288x403 at 320px.

**Fix.** inline-size: min(100%, 22rem, (100dvh - var(--chrome)) * 5 / 7); margin-inline: auto; expose the ratio as a component-level --ratio.

**Generic guide.** Rename to a generic portrait ratio token or keep it inside the component; add a height-aware sizing recipe for any fixed-ratio card.

### m6 (minor): css/components/card.css:359-365 (overflow-clip-margin: border-box), 381-385

**Problem.** Safari: overflow-clip-margin is not implemented (per the sheet's own note and compat data; not reproducible here), so the 2px border band of every link card is dead to clicks/taps. Behaviour reproduced by overriding the property in Chromium. The fix does not need the property at all.

**Evidence.** p23-safari-band.mjs: as shipped, elementFromPoint 1px inside each of the four borders returns .card__link; with overflow-clip-margin: 0 it returns the .card (no link) on all four sides, while 4px inside still returns the link.

**Fix.** Draw the frame with an inset box-shadow or outline and make the border 0 so the padding box is the whole card and ::after can be inset: 0; or keep the border and put the stretched ::before on the card itself.

**Generic guide.** Avoid component behaviour that depends on a single-engine feature; list it under compatibility with a tested fallback.

### m7 (minor): STYLE.md section 1 rules 2,3; card.css:45-47,106-118; color.wire.css:33-35

**Problem.** The rules are not consistent with the CSS, which matters because the guide is meant to be enforced. Rule 2: a shadow means 'you can press this' and 'nothing else gets one', yet --shadow-stack (stack sheets) and --shadow-select (selected ring) are box-shadows on cards that are not pressable. Rule 3: 'rectangles hold, circles act' is broken by the whole-card link, the ghost card and the square .card__ctl control. --ink-faint and --line-soft are the same value (#8a8a8a) under two names while --ink-soft and --card-ink-soft differ under one stem.

**Evidence.** card.css: --shadow-stack (l.421-425), --shadow-select (l.552); .card__ctl is a 20px square with --radius-ctl; color.wire.css: --ink-faint: var(--grey-8); --line-soft: var(--grey-8).

**Fix.** Either narrow rule 2 to 'lift shadow' and add a separate 'layer/selection' vocabulary, or re-implement stack and selection with lines; reword rule 3 as 'circles are the named action, rectangles may be pressable when they are the whole target'; collapse duplicate roles.

**Generic guide.** Write the rules so they are checkable across 40 components, with the exceptions listed in the rule itself.

### m8 (minor): css/tokens/foundation.css, color.wire.css, components/card.css, wire.css

**Problem.** Dead or unused material. Tokens not read by any shipped CSS: --space-0, --space-9, --measure, --ink-soft (sheet only), --text-2xl (sheet only), --font-mono (sheet only), --radius-1/2/3 (sheet only), --space-5..8 (sheet only), --dur-press/hover/move, --ease-out/flip (by design, gate 4). Classes defined but never used in index.html: .is-selected, .ic--close, .wf-pill. cursor: not-allowed on a pointer-events: none element is dead. Rule 'lining-nums' has no effect (the font has no lnum feature).

**Evidence.** p14-unused.mjs output: 120 custom properties declared in shipped CSS; 20 with zero shipped consumers; classes never used: is-selected ic--close wf-pill. fontTools GSUB features: ccmp dnom frac liga locl numr pnum rvrn tnum.

**Fix.** Prune or mark experimental; keep the contract tokens (space scale, motion) but add a gate report that lists 'declared, never read' separately from documented-future.

**Generic guide.** A 40-component guide needs a token lifecycle (proposed, stable, deprecated) so unused ones are intentional.

### m9 (minor): base.css:118-121 (.t-meta), card.css:198, STYLE.md type table

**Problem.** Small doc/CSS drift: .t-meta is documented as soft ink but sets no colour; .t-figure and .card__figure declare lining-nums that the font cannot honour; the changelog says 'ten variants' (variants table lists eleven); README says 'Holds from 360' while STYLE says 320; README gate 3 says 'Contrast passes' and index.html says 'Gates 0 to 2 done' while gate 2's keyboard pass fails (C2).

**Evidence.** base.css:118-121 has only font and font-variant-numeric; GSUB feature list above; STYLE.md section 5 vs section 3 table.

**Fix.** Generate the spec tables from the CSS/tokens (and the states list from the rendered page) instead of hand-maintaining them.

**Generic guide.** Single source of truth: tokens in JSON or CSS, docs generated, gate compares.

### m10 (minor): css/tokens/foundation.css:16-23,25-28

**Problem.** Type scale oddities for a scale that has to grow. --text-xs (13px) and --text-sm (14px) differ by 1px and are separated only by weight/width/case; the 13px label is condensed 75% bold caps, small for its x-height; --lh-none is 0.85 (a value below 1 under a name that suggests 1); the numeric --text-* names mix fixed UI sizes with fluid display sizes (xl..4xl clamp with vw, xl = 24-32px), so a component reaching for --text-xl gets a viewport-dependent size.

**Evidence.** Computed in Chromium: .t-label 13px/13px line-height, width 75%; .card__title 22-32px cqi clamp; hero lede uses --text-xl and scales 24.3px at 390 -> 32px at 1280.

**Fix.** Drop the 13px/14px pair to one step (or separate 12/14 UI ramp), rename --lh-none to --lh-display, separate fixed and fluid ramps, add a minimum of 12px/700 for condensed caps and a line-height floor for multiline UI.

**Generic guide.** Publish the ramp as a role table (caption, label, body, title, display) rather than T-shirt sizes, with fixed and fluid variants named apart.

### m11 (minor): css/components/card.css:127-128,134,176,183,196,203,225,370,420,438-439,486,503; wire.css:63

**Problem.** Component dimensions are magic numbers with no token and the gate does not look at them: 1.25rem ctl box, 0.75rem glyph, 11rem link body, 40ch text, 22rem study width, 4.5rem notch, 0.42em, and three separate cqi clamps (8cqi, 27cqi, 17cqi). Only border widths and radii are enforced (gate rule 4), so spacing/size drift will accumulate across 40 components.

**Evidence.** grep of card.css for rem/px/ch/em literals outside tokens (p14 shell output): 21 literals.

**Fix.** Introduce component-scoped tokens (--card-min-h, --card-measure, --ctl-box) and a gate rule that flags unexplained rem/px/ch/cqi literals in components/ (allowlist via comment).

**Generic guide.** Tokenise sizes at component level (not only global scale) so a second app can retune density without editing selectors.

### m12 (minor): css/base.css (body, a, button), whole shipped CSS

**Problem.** PWA/mobile foundations are absent: no -webkit-tap-highlight-color reset (a translucent flash appears on tap, against 'flat, no translucency'), no touch-action: manipulation, no env(safe-area-inset-*) tokens, no scroll-padding token (2.4.11 Focus Not Obscured needs one when a sticky bar exists; only sheet.css defines scroll-padding-block-start), no overscroll-behavior, -webkit-font-smoothing: antialiased thins light-weight text on macOS/iOS (relevant to the 7:1 target), no viewport-fit note.

**Evidence.** grep over shipped css for tap-highlight, touch-action, safe-area, env(, overscroll: no matches; sheet.css:12 scroll-padding-block-start: 3.5rem is the only one.

**Fix.** Add a platform block in base: tap highlight transparent with visible pressed states, touch-action on controls, --safe-* tokens, --scroll-pad token consumed by :root, drop font-smoothing or scope it to inverted surfaces.

**Generic guide.** A PWA shell section of tokens (safe areas, dynamic viewport, scroll padding, bottom-bar height) belongs in foundation, not in each app.

### m13 (minor): css/base.css:76-79 (::selection)

**Problem.** Selected text is invisible on inverted surfaces: ::selection is ink background with paper text, which equals the ink card and the ink bar.

**Evidence.** p6-misc.mjs: ::selection on the ink-toned card title computes background rgb(20,20,20) and colour rgb(255,255,255) on a card background rgb(20,20,20); screenshot selection-ink.png shows no highlight.

**Fix.** Set ::selection from the surface (e.g., background: var(--selection-bg) with a surface-specific override) or use a contrasting outline colour; make --selection a role.

**Generic guide.** Include selection, caret, and placeholder in the role table.

### m14 (minor): card.css:551 ([aria-selected="true"]), STYLE.md States table, index.html panel specimens

**Problem.** The documented selected trigger aria-selected is only valid on option/tab/gridcell/row/treeitem roles, not on the article/section/div cards the sheet uses; and the 'Collapse' control has no documented disclosure contract (aria-expanded/aria-controls, label swap, icon swap), so the panel 'folds away' is undefined.

**Evidence.** p25-aria.mjs axe: <article class="card" aria-selected="true"> -> aria-allowed-attr violation; <div role="option" aria-selected> is valid only inside a listbox (aria-required-parent). aria-current and aria-disabled on article/section pass.

**Fix.** Document aria-current (or role=option inside listbox) for selection; specify panel markup as <details>/<summary> or a button with aria-expanded and aria-controls.

**Generic guide.** Each component entry needs a pattern reference (APG) for role, keys, and states.

### m15 (minor): tools/bundle.mjs, dist/flashcards.css

**Problem.** The 'what an app links' bundle ships more than an app should: the wire layer (.wf-* placeholders, the disabled hatch) and a 'sheet' layer name in the order statement; it is unminified (32,971 bytes, 9,523 gzip; comment-stripped about 4,700 gzip) and keeps the relative ../fonts path (M11). It is, however, byte-identical to a fresh build (not stale).

**Evidence.** diff of dist/flashcards.css against a bundle produced in audit-work/css/copy: identical; grep -c wf- dist/flashcards.css = 11.

**Fix.** Offer flashcards.css (production: no wire/sheet) and flashcards.wire.css (wireframe), minify, and expose the font path as a build option; have the gate verify dist freshness.

**Generic guide.** Build outputs as a matrix (core, wire, docs) with a manifest.

### m16 (minor): css/components/card.css:45,528-532 (link focus ring + lift shadow)

**Problem.** On a focused link card the 3px ring (offset 3px) and the 4px hard lift shadow overlap on the bottom and right, so the ring merges into a solid 6px band there and is a distinct ring only on the top and left. It remains visible and distinct from hover, but the 'ring' reads as a thick frame on two sides.

**Evidence.** linkcard-focus.png: white gap and ring on top/left, continuous black band on bottom/right (shadow 0-4px, ring 3-6px).

**Fix.** Offset the ring past the shadow (offset >= lift + 1) or drop the shadow on :focus-visible and use the ring only.

**Generic guide.** Decide the stacking of ring vs elevation vs selection rings once, in the tokens.

### m17 (minor): index.html, css/sheet.css (docs page, not shipped)

**Problem.** The living sheet itself has a few axe failures: heading-order (3 nodes: h4 card labels/titles and .sg-bad h4 after an h2/h3 gap), 'region' (the sticky top bar brand/status are outside landmarks), and at 360px scrollable-region-focusable on the pipeline table wrapper (.sg-scroll has no focusable content).

**Evidence.** p9-axe.mjs: light-1200: heading-order 3, region 2 (plus 27 color-contrast-enhanced); mobile-360: heading-order 3, region 1, scrollable-region-focusable 1.

**Fix.** Make the top bar a <header>, set a tabindex=0 and label on the scroll wrapper, and fix heading levels in specimens (the guide already says a card title is not always an h3).

**Generic guide.** The docs shell should itself pass the gate with the same axe run.

### m18 (minor): css/components/card.css:339 (@container card (max-width: 18rem))

**Problem.** Container query uses the physical width feature; in vertical writing modes an inline-size container does not contain the width axis, so the query never matches. Also the 'card' container name is generic enough to collide with another Card in a larger system.

**Evidence.** By spec (container-type: inline-size contains the inline axis; max-width is physical). Not executed.

**Fix.** Use (max-inline-size: 18rem) and a prefixed container name.

**Generic guide.** Use logical container features everywhere and namespace container names with the component prefix.

### N1 (note): tools/check.mjs:226 (reads ../styles.css in try/catch), README.md, STYLE.md section 3 'Known limits'

**Problem.** Artefact of unzipping, plus a design smell: the gate's doc-drift check allows class names that exist only in the app's ../styles.css and swallows the error when it is absent, so the gate fails 1 of 9 checks here for the README mentions of .card-inner and .card-face and would pass or fail depending on the repo around it. README 'Migrating the app' and the .card collision note also depend on that external file.

**Evidence.** node tools/check.mjs in the unzipped tree: 8 ok, 1 FAIL (README.md: class .card-inner / .card-face is not in the CSS). No other check fails.

**Fix.** Move app-specific allowances to a config file next to the script, and do not read outside the package.

**Generic guide.** A generic guide's gate must be hermetic; host-app integration notes belong in a separate 'adopting' document.

### N2 (note): n/a (scope of verification)

**Problem.** Not verifiable in this environment (only Chromium present): Safari/WebKit and Firefox rendering; overflow-clip-margin Safari gap (simulated instead); :has() ring fallback; unprefixed mask support floor; font-stretch keyword handling outside Chromium; real-device DPR and touch behaviour; screen-reader output; Tailwind/shadcn name collisions (by published names).

**Evidence.** ls /opt/pw-browsers shows chromium only.

**Fix.** Add WebKit and Firefox to the gate (Playwright) before v1.0.

**Generic guide.** Publish a browser support table generated from the gate's actual runs.

### N3 (note): css/components/card.css:437-462 (notch), card.css:17-27, base.css:134-167

**Problem.** Things checked and found sound, recorded so they are not re-litigated: the four-layer notch silhouette draws lines exactly as thick as ordinary borders at 20 width x DPR combinations (DPR 1.5, 2.25, 2.625, 2.75, 3.5; widths 273.4-342.9px) with no seams; @property with syntax * and inherits: false works and non-inheriting tone vars behave as documented for element-level tones; @import ... layer() order works (tokens, base, components, wire, sheet); cqi is never used on .card itself; calc() with registered numbers resolves (shadow 4px, translate -2px); :has() focus ring has a working fallback; text spacing override (line-height 1.5, letter-spacing .12em, word-spacing .16em, paragraph 2em) causes no clipping in the sheet specimens; no horizontal scroll at 320px and 360px in the sheet; all 20 focus stops inside cards have a visible ring and none is geometrically clipped (p13-focusclip.mjs).

**Evidence.** p19b-notch.mjs (notch vs plain border runs equal in 20 of 20), p2-cascade.mjs, p13-focusclip.mjs, p11-spacing.mjs, p7-reflow.mjs.

**Fix.** none

**Generic guide.** Keep these as regression tests in the gate.

## What held up

- Font and stretch claims hold: the font shorthand keywords resolve to exactly 125% / 75% / 112.5% in Chromium, the wdth axis (62-125) and wght axis (100-900) in the shipped woff2 match the docs, and the 90KB file loads even from file://.
- Discipline that mechanically holds: zero colour literals outside tokens/color*.css (gate verified by mutation), zero !important, a single z-index value (1), logical properties used throughout (only translate, shadow offsets, notch painting and the container query feature are physical).
- Role-only components: card.css reads roles and component-local --card-* tokens; the six-line tone API with non-inheriting registered properties works as designed at element level and keeps toned cards from painting children.
- STYLE.md contrast figures (18.4 ... 8.4 and the 4.8 soft-ink worst case) are accurate to 0.05, and ink/paper/canvas/tone pairs all clear AAA for normal ink; paper on the ink bar is 18.4.
- The notch painted silhouette is robust: identical line thickness to ordinary borders across 20 DPR x fractional-width combinations, no seams, no wrapper.
- Cascade-layer architecture works as intended (@import layer order, later layer wins, @property inside layers); the stretched-link pattern gives one tab stop and whole-card hit area in Chromium, including the border band via overflow-clip-margin.
- Keyboard pass inside the sheet is otherwise sound: all 20 card focus stops show a ring, none is geometrically clipped, rings follow the surface colour except the ink-panel bar bug; text-spacing overrides and 320/360px reflow cause no clipping or horizontal scroll in the specimens.
- Forced-colours thought was put in for the hard cases (icons as masks, meter fill, hover/selected/notch rules) and the link/selected/meter states render legibly; the .ic override is correct and explained.
- The gate itself is well-shaped (nine named checks, zero dependencies, exits non-zero, good error text) and dist/ is byte-identical to a fresh build, so the bundle pipeline is reliable.
- Good content hygiene in the sheet: real copy, one family, two line weights, visible structure, a built-in 'not this' specimen and a live contrast printout that recomputes from tokens.
