# Render audit: Flashcards style sheet v0.1 (Cards)

Auditor: read-only, adversarial. Scope: the live rendering of `design/index.html` (served over http, driven in Chromium via Playwright) and the card CSS as it ships to an app. Nothing under `userzip/design` was modified; a throwaway copy in `audit-work/copy` was used to rebuild `dist/` and run the gate.

Environment: Chromium 141.0.7390.37 (`/opt/pw-browsers/chromium`), axe-core from `/home/user/styleguide/node_modules`, Node 22. All scripts are in `audit-work/t*.mjs` (index at the end). Screenshots are in `audit-work/annotated/` (annotated, with the evidence in the caption) and `audit-work/{kb,zoom,forced,combos,stress}/` (raw).

## 0. Verdict in six lines

1. The system is visually coherent and several hard things genuinely hold: 400% zoom / 320px reflow (no horizontal scroll with the markup panels closed), WCAG 1.4.12 text-spacing override (zero clipped text in any card), every state is instant (no transition or animation computes anywhere, `reduce` turns smooth scroll off), the aspect-ratio cards grow instead of clipping, the stretched-link pattern gives one tab stop and one name per link card, the two switches at the top are real `fieldset`/`legend` radio groups that work without JS.
2. It is not AA-clean, let alone 7:1-clean, as shipped. There is one hard WCAG 2.4.7 failure in the shipped CSS (the ink panel's bar control has an invisible focus ring, a pure cascade-specificity bug), a selected state that cannot be seen on the inverted tone, `aria-selected` documented on roles that do not allow it, and 27 soft-ink text nodes below 7:1.
3. The gate (`check.mjs`) cannot see any of this because it never renders. Every defect below except the last class (process/claims) is one a render test would have caught.
4. Several "practise what you preach" failures on the specimen page itself: 5 fake live links in the States block, 4 dead "Collapse" buttons, a "Show boxes" switch that deletes focus rings, a Markup disclosure that breaks reflow at 768px and below, heading skips, and page chrome whose checked state disappears in forced colours.
5. The type and slots were tuned to one sample string each: the display style fits "Cards" but not "Settings" on a phone, and the study answer clips "Parallelogram" and "Quadrilateral" (words from the deck's own domain). `12,480` does not fit a 160px stat card. For a generic library this is the biggest structural gap: nothing degrades for real copy; it clips silently because the frame is `overflow: clip`.
6. Unzip artefacts (not defects): the gate's one failing check, the `favicon.ico` 404 on first load, and the README's references to `../styles.css` classes. See section 1.

## 1. Defects versus artefacts of unzipping outside the app repo

| Observation | Verdict |
| --- | --- |
| `node tools/check.mjs` exits 1: `README.md: class .card-inner is not in the CSS`, `.card-face is not in the CSS` | ARTEFACT. Those two classes live in the app's `../styles.css` (check.mjs:224-227 reads it with `try/catch`). Everything else in the gate passes (8 of 9). Reproduced in `audit-work/copy`. |
| `dist/flashcards.css` and `dist/style-sheet.html` | IN SYNC. Rebuilt in a copy with `tools/bundle.mjs`; `diff`/`cmp` identical to the shipped files. |
| Console: `Failed to load resource: 404` on first load | REAL but trivial: it is `/favicon.ico` (resource timing: `["/favicon.ico",345,348]`). The page declares no `<link rel="icon">`. Shown once per browser session (only at 320 in my four runs, because Chromium caches the miss). No JS errors, no CSS/font failures at 320/390/768/1280. |
| Font path in `dist/flashcards.css` is `../fonts/archivo-latin-var.woff2` | REAL packaging hazard, not an unzip artefact. See D24. |

## 2. Findings

Severity legend: critical = hard WCAG AA failure in shipped CSS; major = breaks a stated requirement or a documented variant; minor = real but bounded; note = design-rule or process.

### D01 critical: ink panel bar control has no visible focus ring
- Where: `css/components/card.css:76-83`.
- Evidence: keyboard-focusing the "Collapse" button in the `data-tone="ink"` panel (3.2, second card, tab stop 16) computes `outline: 3px solid rgb(255,255,255)` on a bar whose background is `rgb(255,255,255)`: contrast 1:1. Pixel diff between focused and blurred crops is 0 (`audit-work/kb/default-1280/rows.json`, row 16). Every other tab stop changes pixels, except the `.is-focus` decoy (stop 37), which already wears a ring. Screenshot: `annotated/01-ink-panel-ctl-focus-invisible.png`.
- Cause: `.card[data-tone="ink"] :focus-visible { outline-color: var(--card-ink) }` has specificity (0,3,0) and beats `.card__bar :focus-visible { outline-color: var(--card-bar-ink) }` (0,2,0). STYLE.md says the ring "follows the surface it lands on"; the two rules disagree about which surface.
- Fix: one rule, one role. `.card :focus-visible { outline-color: var(--card-focus) }`, with `--card-focus` set by whichever part owns the surface (`.card__bar { --card-focus: var(--card-bar-ink) }`, `.card[data-tone="ink"] { --card-focus: var(--card-ink) }` placed before it, or `:where()` the tone override to zero specificity).
- Genericise: ring colour must be a surface-aware role resolved through the surface stack, not a per-variant selector. Add a render test: for every focusable in every tone x surface, ring colour vs both adjacent colours >= 3:1.

### D02 major: soft-ink text misses the 7:1 target (27 nodes); the gate and the swatches cannot see it
- Where: `card.css:34` (`--card-ink-soft: color-mix(in srgb, var(--card-ink) 72%, var(--card-bg))`), `tools/check.mjs:312`, `STYLE.md` "worst case ... 4.8 : 1".
- Evidence: axe `color-contrast-enhanced` flags 27 nodes in every mode/width: eyebrow and meta text at 14px on tone-1 6.76:1, tone-3 6.01, tone-4 5.58, tone-5 5.15 (`#434343` on `#bbbbbb`); ghost title `#565656` on `#f4f4f4` 6.67. Computed for the unrendered tone-6: 4.80. `.sg-swatch` prints ink-on-fill only ("8.4:1 AAA"), so the failing pair is never displayed. The gate checks the mix at 4.5 (check.mjs:312) and duplicates the 72% constant instead of reading it from card.css.
- Note on passes: `axe color-contrast` (AA) reports zero violations; this fails only the owner's 7:1 brief.
- Fix: stop deriving text colour by mixing. Add explicit `--on-tone-N-soft` roles per tone (validated >= 7:1 by the gate) or drop soft ink and carry hierarchy with size/weight. Gate: resolve the real pairs (role x role) at 7:1, and print soft ink in the swatches.
- Genericise: "secondary text" becomes a role with a per-surface contract, never a runtime mix.

### D03 major: `aria-selected` is documented as a state trigger on roles that do not allow it; no selectable-card contract exists
- Where: `STYLE.md` States table (line 314), `card.css:551` and `:608`, `index.html:930`.
- Evidence: axe `aria-allowed-attr` on synthetic markup: `ARIA attribute is not allowed: aria-selected="true"` for both `<article class="card">` and `<a class="card card--ghost">` (`t12.mjs`). The specimen itself only uses `aria-current="true"`, which means "current item in a set" (page/step), not "selected". `aria-disabled` on `<article>` is accepted by axe but is not a supported attribute for the article role in ARIA 1.2.
- Fix: define selection per role: toggle card = `<button aria-pressed>`, radio card = `<input type=radio>` + label, listbox card = `role=option aria-selected`, navigation card = `aria-current="page"`. Key the CSS on those, drop `aria-selected` from `.card`.
- Genericise: selectable surfaces (chips, list rows, tabs, calendar days, media tiles) all need this same table; write it once in the foundation.

### D04 major: the Selected state is invisible on the inverted (ink) tone
- Where: `card.css:551-554` with `--card-line: var(--line)`.
- Evidence: computed on `.card--link[data-tone="ink"][aria-current="true"]`: `box-shadow: rgb(20,20,20) 0 0 0 2px` on `background rgb(20,20,20)`; ink-on-ink, 1:1. The card just looks 4px bigger. The same ring on a tone-3 card is clear. Screenshot: `annotated/04-selected-invisible-on-ink.png`. STYLE.md lists `data-tone="ink"` as a first-class tone.
- Fix: ring with a gap (`0 0 0 2px var(--canvas), 0 0 0 4px var(--card-line)`), or invert the fill on select.

### D05 major: opening any "Markup" disclosure breaks reflow at 768px and below
- Where: `sheet.css:478-483` (`.sg-entry` is a grid) and `:582` (`.sg-markup`, `grid-column: 1 / -1`).
- Evidence: `document.scrollWidth`: 390 -> 669 with only 3.1 open; 320 -> 1194 and 390 -> 1194 with all open; 768 -> 1201. At 1024 fine. The `<details>` is a grid item with `min-width: auto`; the `<pre>` max-content (651px) forces the track to 653px. Adding `.sg-entry > * { min-inline-size: 0 }` restores 390 (`t10b.mjs`). WCAG 1.4.10 failure on the page's headline feature (the markup that agents are told to copy). Screenshot: `annotated/01-markup-open-reflow-390.png`.
- Fix: `min-inline-size: 0` on grid children. Genericise: every docs grid template needs it; put it in the sheet reset.

### D06 major: "Show boxes" replaces every focus ring on the specimen
- Where: `sheet.css:35-38`.
- Evidence: `:root:has(#boxes-on:checked) .sg-stage * { outline: 1px dashed var(--ink-faint) }` lives in the last `@layer`, which wins over base/components outlines regardless of specificity. With it on, the focused "Start" link computes `dashed 1px rgb(138,138,138)` instead of `solid 3px rgb(20,20,20)`; pixel diff focus vs blur = 0 for Start x2, Collapse x2, list rows x4, the notch button and "Carry on" (`t3b.mjs boxes`). Screenshot: `annotated/02-show-boxes-kills-focus.png`. README gate 2 requires a keyboard pass in both corner modes; nobody can do it with boxes on.
- Fix: debug overlays must not use `outline`; use `box-shadow: inset` or `:not(:focus-visible)`. 
- Genericise: the `sheet` layer outranks everything, so any docs-chrome rule that touches `outline`, `color` or `background` silently overrides the system under test.

### D07 major: text at 200% clips content and the action on phones (and 150% scrolls the page sideways)
- Where: `card.css:58` (`overflow: clip`), `:210-220` (`.card__foot` no wrap), `:243-253` (`.card__list li` no wrap), `:398-408` (ghost), `--hit: 2.75rem`.
- Evidence (`t4c.mjs`, html font-size scaled): 360px @ 200%: 7 cards clip ("Start" cut 4px, list count "12" 7px, row meta 14px, ghost title 58px, "Carry on" 26px); 390px @ 200%: ghost title cut 28px; `document.scrollWidth` 633 at both. 150% at 360/390: no card clips, but `scrollWidth` is 474 (the display h1, see D09). Screenshot: `annotated/10-text-200pct-clipping.png`. At browser-zoom 200% (640 css px) and 400% (320 css px) nothing clips, so this is a text-only-zoom / OS font-size failure (WCAG 1.4.4), which is the normal Android case.
- Fix: rows that can overflow must wrap (`.card__foot`, `.card__list li`, ghost), slots get `min-inline-size: 0; overflow-wrap: anywhere`, and `--hit` should not grow the action circle to 88px inside a 158px card.
- Genericise: a silent `overflow: clip` frame means the contract must be "nothing reaches the edge", enforced by a render test at 200% text.

### D08 major: real copy is clipped in the study answer and the stat figure
- Where: `card.css:501-508` (`.card__answer`), `:194-199` (`.card__figure`); only `.card__title` has `overflow-wrap` (`:179`).
- Evidence (`t14b.mjs`, cards of 238 / 288 / 160px): "Parallelogram" cut by 38 / 43 / 92px; "Quadrilateral" by 22 / 23 / 77px; "Rectangle" by 30px at 160px; `12,480` cut by 25px at 160px (the `3rem` floor is wider than a two-column phone card). Both words are from the deck's own domain (shapes). Screenshot: `annotated/07-study-answer-clipped.png`. Also clipped with contrived long strings: email in eyebrow/meta/text at 160px, German compound in ghost/row/notch (`t14.mjs`).
- Fix: `overflow-wrap: anywhere; hyphens: auto` on all text slots; let `.card__answer` and `.card__figure` fit the container (smaller cqi ratio or `font-stretch` condensing, since the variable font already has a 62% axis).
- Genericise: the specimen should carry "stress copy" (longest real value per slot) and the gate should render it.

### D09 major: `.t-display` only fits one short word
- Where: `foundation.css:26` (`--text-4xl: clamp(4.25rem, 1rem + 15vw, 15rem)`), `foundation.css:48` (900, 125% wide), `base.css:85-89`.
- Evidence (`t5.mjs`): at 390px, 358px available: Cards 331, Settings 485, Statistics 546, Flashcards 649. At 1280px: Cards 925 of 1203, Flashcards 1811, Statistics 1525. `document.scrollWidth` with the h1 set to "Settings": 499 at a 390px viewport; 474 at 360/390 with text at 150% even for "Cards"; at 320 "Cards" is 302px in 288 available (14px into the gutter). With the WCAG 1.4.12 spacing override at 320/390, scroll width is 369/403. Screenshot: `annotated/08-display-type-overflow.png`. No `overflow-wrap`/`hyphens`.
- Fix: step the display size down by measured width, not a fixed vw ratio; use the variable width axis (`font-stretch` 62-125%) via a container query to condense longer words; add `overflow-wrap: anywhere`.
- Genericise: a display style for any screen title needs a stated max length or automatic fit.

### D10 major: the documented `<button class="card card--ghost">` collapses to a 36px sliver
- Where: `card.css:398-408` plus `container: card / inline-size` (`:53`). STYLE.md: "the card is the `<a>` or `<button>`".
- Evidence (`t9.mjs` E): in a 600px parent a `<button class="card card--ghost">` measures 36px wide in a block div, a flex div and an `<li>`; it only fills when its parent is a grid container (600px in a `display:grid` div, 287px as a direct child of `.card-grid`). A button is shrink-to-fit and an inline-size container has no intrinsic width. The specimen only shows the `<a>` form. Screenshot: `annotated/05-ghost-button-collapses.png`.
- Fix: `button.card { inline-size: 100% }` (or `display: block; width: 100%` for `.card--ghost`); show both forms in the sheet.
- Genericise: STYLE.md already says "a card needs a width from its parent"; for buttons that contract is unsatisfiable without a rule. Every `<button>`-based element in the library needs this check.

### D11 major: the study card has no accessibility contract
- Where: `index.html:801-824`, `card.css:482-508`.
- Evidence (CDP `Accessibility.getFullAXTree`, `audit-work/axtree.txt`): front face exposes `StaticText "03 / 12"` and a footer `StaticText "Tap to flip"`; the subject is an `aria-hidden` SVG with no alternative. Back face exposes `"Triangle"` as plain text (not a heading). No focusable element, no role, no control to flip, no live region. "Tap to flip" is a pointer-only instruction. The flip animation is gate 4, but the semantics (what is pressed, what is announced) are gate 0-2 concerns.
- Fix: define the reveal pattern: one `<button aria-expanded|aria-pressed>` labelled "Show answer", the answer inside a polite live region, the front subject as `role="img"` with a real name, Space/Enter, reduced-motion fallback.
- Genericise: flip/reveal/disclosure is a foundation pattern used by calendars, media controls and dialogs.

### D12 major: Gate 2 is ticked, but most interactive parts have no hover or pressed state
- Where: README status table (Card: 0,1,2 ticked), `card.css:296`, `:514-548`.
- Evidence (`t16.mjs`, computed style at rest / hover / mousedown): `.card__ctl`, `.card__list a`, `.card__foot a`: no property changes on hover or press. Notch `.card__action`: hover fills, press unchanged. Ghost: hover changes, press unchanged. Only `.card--link` has rest, hover, focus, pressed, selected. List rows also have no underline and no chevron, and only the text is the link (the `li` padding and the count are dead), so they read as static text. The States specimen demonstrates one variant only.
- Fix: a parts x states matrix in the sheet, gated by a render test; define `--lift/--fill` for controls too.
- Genericise: list rows, tabs, chips and nav items will all inherit this gap.

### D13 major: the States specimen makes fake states real tab stops; the Collapse buttons do nothing
- Where: `index.html:844-925` (states), `:295`, `:487`, `:499` (Collapse).
- Evidence: tab stops 35-39 are five `<a href="#">` all named "Shapes"; `.is-focus` paints a permanent full focus ring and `.is-hover` a lift on cards that are not hovered or focused, so up to three cards look focused at once. Screenshot: `annotated/06-states-fake-focus-and-tab-stops.png`. The four `button.card__ctl` ("Collapse", identical name x4) have no handler on the page, no `aria-expanded`, no `aria-controls`; pressing Enter does nothing.
- Fix: forced-state specimens should be `inert` with `aria-hidden`, or non-interactive clones; real controls get real behaviour or are omitted; names carry context ("Collapse Decks").
- Genericise: the spec page is the test bench for the keyboard pass; it cannot have decoys.

### D14 major: page chrome loses the checked state in forced colours (the switches at the top)
- Where: `sheet.css:226-237` (`input` opacity 0; checked = `background: var(--ink)`).
- Evidence: with `forcedColors: 'active'`, "Square" and "Off" (the checked radios) render identically to their unchecked siblings (`forced/forced-_sg_hero.png` vs `forced/normal-_sg_hero.png`). The focus ring survives (pixel diff > 0). Screenshot: `annotated/03-forced-colors-switch-lost.png`. The same pattern (selected = fill only) is the obvious template for segmented controls, tabs and chips.
- Fix: add a non-fill marker for checked (inner mark, `border-width` via `--bw-heavy`, or `::before` check using `CanvasText`), and test it.

### D15 minor: forced-colours card states
- Where: `card.css:598-616`.
- Evidence (`forced/forced-_states_sg_states.png`): hover and focus are the same 4px Highlight outline (a hovered card looks focused); pressed is identical to rest; selected swaps `border-width` 2px -> 4px, which moves the card's content 2px right and down, contradicting "nothing shifts" (compare the Selected and Rest crops); the notch silhouette disappears (plain rectangle). All legible, none distinguished.

### D16 minor: small targets on the page's own cards
- Where: `card.css:222-226` (`.card__foot :is(a,button) { min-block-size: 1.5rem }`), STYLE.md "at least 24px tall".
- Evidence (`t9.mjs` A): of 45 focusables, only "Start" (30x24) and "Carry on" (53x24) are under 44px. "Start" is the Plain card's only call to action. Meets WCAG 2.5.8 (24px), fails the 44px brief and the sheet's own `--hit` rule ("the target is not [smaller]").
- Fix: `min-block-size: var(--hit)` with a negative block margin so the foot height is unchanged.

### D17 minor: link cards flicker at their right and bottom edge
- Where: `card.css:362-365` (`transform: translate(calc(var(--lift) * 4px / -2) ...)`), `:514-520`.
- Evidence (`t11.mjs`): mouse parked 1px inside the bottom-right corner alternates `:hover` state H - H - H - on each mouse event (and for the whole 2px band on the right and bottom edges), because the card moves 2px up-left away from the pointer and no transition damps it. Interior 3px in is stable.
- Fix: do not translate the hit-tested box; lift the face only, or keep hover on a static wrapper.

### D18 minor: ungated `:hover` rules give sticky hover on touch
- Where: `card.css:296` (`.card__action:hover`), `:538-542` (ghost). The link-card lift is gated by `@media (hover: hover)` (`:514`).
- Evidence (`t9b.mjs`, `isMobile + hasTouch`, `matchMedia('(hover: hover)') === false`): hovering the ghost card flips border dashed -> solid and background transparent -> white; the notch action fills; the link card correctly does nothing.
- Fix: wrap every `:hover` rule in the media query.

### D19 minor: document structure
- Heading order: 57 headings, 3 skips h2 -> h4 (Anatomy, States, Not this; axe `heading-order`). STYLE.md says "A card title is not always an h3" but every specimen hard-codes `h4`. `.card__label` is an `h4` in panels and a `span` in the study card; the anatomy card has two `h4`s. The token boxes (Type, Space, Line, Shape, Hit and focus, Tone) are `span` labels, not headings.
- Landmarks: `main` x1, but the sticky bar (brand + nav) is in no landmark (axe `region` x2 at 1280, x1 at 390); the `banner` is the hero header, which also holds the switches; 8 `region` sections.
- Skip link: present, first tab stop, visible with a ring. Its target `#rules` is non-focusable (no `tabindex="-1"`): Chromium moves the sequential focus start (next Tab goes to the first control in the Anatomy section; `activeElement` is BODY), WebKit/VoiceOver commonly do not. It also skips the Corners/Show boxes switches.

### D20 minor: anatomy badge numbers leak into accessible names
- Where: `sheet.css:708-709` (`.sg-anat [data-n]::after { content: attr(data-n) }`).
- Evidence: AX tree shows `heading "Diamond 6"` and loose `StaticText "2","3","5","7","4","8"` inside the card. Fix: `content: attr(data-n) / ""` (alt text) or real `aria-hidden` spans.

### D21 minor: the copy-paste Markup panel teaches patterns the docs forbid
- Evidence: STYLE.md says decorative icons carry `aria-hidden="true"`; the specimens' `<span class="ic ic--minus">` inside `.card__ctl` and `<span class="ic ic--arrow">` inside the notch button have none (`index.html:296, 488, 500, 734, 1102`). Placeholders declare `role="img" aria-label="Drawing of a diamond"` on a wireframe box that contains text. The Collapse button with a constant name and no state is shown as the panel control. The page prints this verbatim for agents to copy.

### D22 minor: RTL breaks the notch and the stack; nothing mentions RTL
- Where: `card.css:445-476` (notch: physical `background-position`, logical `inset-inline-end`), `:419-428` (stack: physical right/bottom shadows, logical `margin-inline-end`). `grep -n "rtl\|dir="` over `css/`, STYLE.md, README, index.html returns nothing.
- Evidence (`t15.mjs`, `dir="rtl"`): the action jumps to the top-left while the cut stays top-right, and the Arabic eyebrow runs through the notch edge; the stack sheets spill to the right while the reserved margin is on the left. Screenshot: `annotated/09-rtl-notch-stack.png`.
- Fix: declare a direction policy (mirror via `--dir: 1 | -1`, or document LTR-only) and render-test `dir=rtl`.

### D23 minor: the focus ring is partly clipped by the card radius in Soft mode
- Evidence: Corners = Soft, bar control focused: the 3px inset ring's top-right corner runs out under the 24px card radius and tapers to nothing (3x zoom). Focus remains visible; it is a polish failure of the "ring inside a clipping frame" strategy. Screenshot: `annotated/11-soft-ring-corner-clipped.png`.

### D24 minor: no contrast, colour-scheme or forced-colour coverage beyond cards; packaging hazards
- `grep prefers-` over the shipped CSS: no `prefers-contrast`, no `prefers-color-scheme`, `color-scheme: light` fixed (base.css:14); `prefers-reduced-motion` only guards `scroll-behavior` in the sheet. Rendering with `prefers-contrast: more` is pixel-identical to normal: 16 sections, total pixel difference 0. `--ink-faint`, `--line-soft`, `--ink-soft` get no boost.
- `dist/flashcards.css` references `../fonts/archivo-latin-var.woff2`. The README says "the one file an app links"; copied alone into `/app/css/` it 404s the font and silently falls back (`t13b.mjs`: `HTTP 404 /app/fonts/archivo-latin-var.woff2`, `Archivo:error`). The README's Migration section points apps at `css/flashcards.css`, an `@import` chain: 8 CSS files for an app (9 on the sheet), two requests deep (`t1b.mjs`), before the font is discovered; the bundle exists but is not what the README tells apps to link.
- The `@layer` design means unlayered app CSS always outranks the library: with `.card{border-width:9px}` in a normal stylesheet the card computes 9px (`t13.mjs`). The `base` layer also ships global resets (`*` box-sizing, `ul,ol` list-style, heading/paragraph margins, `:focus-visible`, `body` min-height) that apply to the host app.
- The `latin` subset stops at Latin-1 plus a few marks; Latin Extended-A (Polish, Czech, Hungarian, Turkish) falls back to Helvetica/Arial with no width axis.

### D25 minor: the sheet breaks its own rules
- Rule 2 (shadow means pressable): `.card--stack` paints hard offset shadows on a card that is not pressable in the specimen.
- Rule 3 (rectangles hold, circles act): `.card__ctl` is a square (20px box, `--radius-ctl`) that acts; the `.card__action` on the link card is a circle that does nothing (`aria-hidden`), which is also rule 7 (no decoration).
- Rule 1 (two line weights): tokens ship 1px, 2px, `--ring` 3px and `--bw-heavy` 4px.
- Not severe alone; together they are the "Count" test failing on the sheet that defines it.

### D26 minor: disabled legibility and a dead declaration
- `--ink-faint` (`#8a8a8a`) on tone-1 is 2.90:1 (3.45 on paper, 2.31 on tone-3); the hatch lines (`--tone-4`) cross the text at 2.04:1 against it. Disabled text is exempt from 1.4.3, but the README requires "every state legible in grey". `cursor: not-allowed` (`card.css:562`) is dead: `pointer-events: none` sits on the same rule. A disabled card that is an `<a href>` (ghost) still takes keyboard activation; only the docs prevent it.

### D27 note: gate blind spots and tooling traps
- The gate never renders. It cannot see D01 (specificity), D03 (ARIA validity), D05-D10 (layout), D02 at 7:1, heading order, or state coverage.
- The notch is painted with four `linear-gradient(a, a)` layers; check.mjs:137 exempts identical-stop gradients as "flat". Automated contrast cannot evaluate text on them (axe `incomplete`: "background color could not be determined due to a background gradient" for the notch's eyebrow, figure and meta).
- The claim list in STYLE.md ("Holds from 320 up with no horizontal scroll") is true only with the Markup panels closed and at 100% text.

### D28 note: minor specimen-chrome items
- The sticky bar at 320 leaves 91px for eight nav links inside a hidden-scrollbar scroller: one link visible, no affordance.
- `.sg-scroll` (pipeline table) overflows at 390 with no `tabindex`, role or name: axe `scrollable-region-focusable`; Chromium makes it focusable anyway, Safari does not.
- Contrast and markup panels need JS (empty ratio spans without it); acceptable for a docs page.

## 3. What was checked and held (so you can trust the silence)

| Check | Result |
| --- | --- |
| Console and network at 320/390/768/1280 | No JS errors, no CSS or font failures. One favicon 404. Archivo loads (`document.fonts` = loaded). |
| axe (wcag2a/aa/21a/21aa/22aa + best-practice), Square/Soft x boxes off/on x 1280/390 | Identical in all 8 runs: `heading-order` x3, `region` x2 (x1 at 390), `scrollable-region-focusable` x1 (390 only). Zero AA color-contrast violations. Plus `color-contrast-enhanced` x27 (D02). |
| Tab order | Logical and equal to DOM and visual order; no traps; 43 stops; radios count as 1 stop per group; every stop except D01 (and the `.is-focus` decoy, which already wears a ring) shows a changed-pixel focus indicator (default mode). |
| Skip link | First stop, visible, works. |
| Switches at top | `fieldset` + `legend`, four native radios, arrow keys move within a group, 44px labels, no JS needed. |
| Sticky bar vs focus | No focused element is under the bar (scroll-padding 3.5rem > 2.75rem bar). |
| 400% / 320px, markup closed | `scrollWidth` 320/320; no element outside the viewport; zero clipped text. |
| 200% browser zoom (640 css px) | No horizontal scroll, no clipping. |
| WCAG 1.4.12 text-spacing override | 0 clipped text in any card at 320/390/1280; aspect-ratio cards grow. (Hero overflows, see D09.) |
| Motion | No element has a non-zero `transition-duration` or `animation-name`; `reduce` sets `scroll-behavior: auto`. The "all states instant" claim holds. |
| Forced colours | Every card variant stays legible; focus and selected survive on cards; icons, meter and X box handled. Gaps in D14/D15. |
| Stretched link | One tab stop, name = title, `::after` over the border (overflow-clip-margin works in Chromium). Safari's 2px dead band is documented by the owner. |
| AX tree | `role=list` on `ul` fine; meter has role and name; `aria-hidden` on decorative action circles and tiles; link card name = title; notch button = "Start review"; DOM order = visual order in every variant except the notch (next section). |
| `dist/` | Byte-identical to a fresh rebuild. |

## 4. Keyboard walk (default mode, 1280px)

Stops 0-8 skip link + 8 nav links (paper ring, -3px inset); 9-10 the two radio groups; 11 anatomy Collapse; 12-13 Start links (3.1); 14 Markup summary; 15-16 Collapse x2 (16 = D01); 17-20 list rows; 21-24 Markup; 25-27 link cards (card wears the ring, anchor outline 0); 28 Markup; 29 notch button; 30-31 Markup; 32 ghost; 33-34 Markup; 35-39 states (D13); 40-41 Markup; 42 "Carry on". Raw data: `audit-work/kb/default-1280/rows.json` (focus/blur crops per stop are alongside). Show-boxes run: `kb/boxes-1280`. Forced colours: `kb/forced-1280` (only the two `.is-*` decoys show no change, as expected).

## 5. Accessibility-tree notes per variant

- Link card: `article > heading "Shapes" > link "Shapes"` (+ generic `::after`); eyebrow and meta stay outside the name. Good.
- Ghost: `link "Add a shape"`; the plus circle is hidden. Good. Not wrapped in any list.
- Notch: `article` (no name, no heading) with text "Due today", "24", "cards are ready to review" and `button "Start review"`. Works; the card is unnamed. The button is last in the DOM but sits top-right visually, so reading/tab order does not match visual order; harmless with one control, wrong as a pattern for a card that later gains a second one.
- Stack: `article` > `heading "Shapes"`; not interactive (see D25).
- Study: see D11. Panel: `sectionheader > heading + button "Collapse"` (see D13). Stat: `meter "Shapes learned"` with valuemin/max/now, no valuetext; the visible "5/12" is separate text.
- Media: `image "Drawing of a diamond"` with the placeholder text hidden (children presentational); the `wf-tile` is `aria-hidden`.
- `article` cards without a heading (stat, notch, study, ghost-adjacent) are unnamed; consider `aria-labelledby` as a rule.

## 6. Screenshot and artefact index

`audit-work/annotated/`: `01-ink-panel-ctl-focus-invisible.png` (D01), `01-markup-open-reflow-390.png` (D05), `02-show-boxes-kills-focus.png` (D06), `03-forced-colors-switch-lost.png` (D14), `04-selected-invisible-on-ink.png` (D04), `05-ghost-button-collapses.png` (D10), `06-states-fake-focus-and-tab-stops.png` (D13), `07-study-answer-clipped.png` (D08), `08-display-type-overflow.png` (D09), `09-rtl-notch-stack.png` (D22), `10-text-200pct-clipping.png` (D07), `11-soft-ring-corner-clipped.png` (D23).
Raw: `forced/` (16 sections x normal / forced / prefers-contrast), `combos/combo-{square,soft}.png` (modifier matrix), `zoom/` (full-page at each zoom and spacing), `kb/` (per-stop focus/blur crops), `stress/` (long copy, RTL), `axe.json`, `axtree.txt`, `axtree.clean.txt`.
Scripts (re-runnable, `node audit-work/<file>`): `t1` console/network, `t2`/`t2b` axe, `t3`/`t3b` keyboard walk and focus pixel diff (`default|boxes|soft|forced|contrast`), `t4`/`t4b`/`t4c` zoom, reflow, text spacing, `t5` display widths, `t6` forced colours and contrast-more sections, `t7` AX tree, `t8` modifier matrix, `t9`/`t9b` targets, hover:none, reduced motion, ghost button, `t10*` markup reflow, `t11` edge flicker, `t12` ARIA validity, `t13*` bundle shipping, `t14*` long copy, `t15` RTL, `t16` state coverage, `t19` Soft ring, `t20` headings and skip link, `t21` ink selected.

## 7. Suggested order for the generic rebuild

1. Fix the cascade model first (D01, D04, D06): one surface-aware `--focus` and `--select` role, sheet chrome never touches `outline`.
2. Make slots survive real copy (D07-D10): text slots wrap by default, rows wrap, buttons size themselves; add a stress-copy specimen per element and render it at 160/238/288px, 200% text, and RTL.
3. Replace runtime colour mixing with explicit roles validated at 7:1 (D02); let the gate resolve real pairs.
4. Write the selection/disclosure ARIA table once (D03, D11, D13) before Button, Tabs, Chips, Lists are built on the same assumptions.
5. Add a render gate (Playwright + axe) next to `check.mjs`: focus visibility for every focusable x tone x corner mode, 320/200% reflow, forced colours, `dir=rtl`, hover:none. Most of the above would have been caught by that one script.
