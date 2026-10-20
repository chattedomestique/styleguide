# A2: Visual system, typography, anti-slop

## 1. Rules to adopt into the guidelines

**§1 What this is**

- Hover and press never move an element's hit box. Show lift with the hard shadow alone, offset `calc(var(--bw) * 2)` (4px, in px like the frame), not with `transform`. [ui-ux-pro-max]
- A glyph or index number that repeats on every item in a grid has to tell the items apart. In-app navigation uses a chevron; ↗ means "leaves the app". [ui-ux-pro-max]

**§2 Foundations › Type**

- Size floors in app UI: body 16px, meta 14px, label 13px. Nothing smaller, so the sheet's 12px specs and badges (`.sg-spec`, `.sg-n`) go up to 13px. [typography]
- `--type-label` (condensed caps) holds 1 to 4 words and is never used for a sentence or for text that wraps. Line-height 1.2, not 1. Tracking stays +0.08em. [typography]
- A heading has to fit its longest real word at 320px. At 900/125% that's about 0.9em per capital, so app screens use a heading style (600, `--text-2xl`, line-height 1.1), not the poster display. [ui-ux-pro-max]
- App type is fixed `rem` or container-relative (`cqi`). No `vw` in app UI: resizing a Mac window must not resize text. `vw`-fluid sizes stay in `sheet.css`. [typography]
- Archivo's default digits are already tabular and lining (the file has no `lnum`/`onum`/`case`/`zero`). Write `tabular-nums` only for aligned columns and ticking numbers, and `proportional-nums` for static big figures. [typography]
- Running text maxes out at `--measure` 62ch, applied on `.t-body`. Card text is 40ch. Balance titles and pretty-wrap paragraphs, as now. [typography]
- iOS PWA follows Dynamic Type: `@supports (-webkit-touch-callout: none) { html { font: -apple-system-body } }` (17px default). Every size is `rem`, so the whole scale follows. [typography]
- Dark (gate 3): body weight 400→370, title 500→470, label 700→650, set through `--fw-*` tokens that the `--type-*` shorthands read. Antialiasing applies on dark surfaces only. Re-check the 72% soft ink at 4.5:1 or better. [typography]
- A type style is `font` + `letter-spacing` (+ `text-transform` for label and display). Use the `.t-*` class or restate all of it. No ad-hoc `font:` shorthands, including in `sheet.css`. [typography]

**§2 Foundations › Files and layers**

- Apps link `dist/flashcards.css` (flat, no `@import` chain) and preload the font: `<link rel="preload" href=".../archivo-latin-var.woff2" as="font" type="font/woff2" crossorigin>`. Never do this in `index.html`: from disk it fails CORS (tested). [typography]
- Fallback faces need no metric overrides, because Archivo 400/100% matches Arial width (size-adjust 101%). Labels and display have no width-axis fallback, so they must survive a ±25% width change. [typography]
- App CSS goes in `@layer app`, appended after `components`. Unlayered CSS beats every layer, so it silently overrides card states. [retro-css-architecture]

**§2 Foundations › Shape**

- If soft wins: radii are concentric (inner = outer − padding − border), and any control within `--card-radius` of a corner is inset by `0.3 × radius` so its focus ring isn't clipped. [neobrutalist-web-designer]

## 2. Conflicts

1. **Shadows and borders.** The neobrutalist skill puts a 4–6px hard shadow on every card at rest and uses 3–4px borders that grow with the breakpoint. Its test fails any 1px border. We use 2px frames and 1px dividers, with a shadow only on hover. **Recommendation: keep ours.** A shadow at rest is a third line weight and the loudest template tell, and the 1px divider is what gives two weights a hierarchy. The owner calmed this down on purpose.
2. **Corners.** The neobrutalist skill says 0, or 4px at most: "16px+ is not neobrutalism". Our soft mode is 24/12/6. **Recommendation, not a decision: square for containers, with circles and pills for actions.**
   - Square needs no exceptions. Notch, tiled grid and stack are already square, while soft needs two exceptions plus concentric maths, and it clips focus rings (A2-03).
   - "Rectangles hold, circles act" only reads when the rectangles really are square.
   - A rounded 2px black frame with a hard shadow is the stock "neobrutalism" component-kit look.
   - On iOS and macOS the window and screen are already round, so square cards read as content, not chrome.
3. **Font smoothing.** The typography skill says don't apply `antialiased` globally on light backgrounds. We set it on `body` (`base.css:23`). **Recommendation: adopt the skill.** On macOS it removes stem darkening, which thins the 13px condensed labels and 14px soft meta. Scope it to `.card__bar`, `[data-tone="ink"]`, `.sg-top` and the future dark scheme, and add `-moz-osx-font-smoothing: grayscale` there.
4. **Fluid type.** The typography skill scales headings, and even body, with `clamp(… + vw)`. We do that for `--text-xl…4xl`, and cards use `cqi`. **Recommendation: keep `cqi` in cards and drop `vw` from app tokens.**
   - At 390px the `vw` term adds almost nothing: `--text-xl` is 24.3px against a 24px minimum, and `--text-3xl` sits on its 48px minimum.
   - On a Mac, `vw` only makes titles change size while the window is dragged.
5. **Pairing.** `typography.csv` pairs Archivo with Space Grotesk. The neobrutalist skill uses Archivo Black + Space Grotesk, and the typography skill says to pair by contrast (serif + sans). We use one family and the width axis. **Recommendation: keep ours.** It's one 90 KB file with one fallback chain, Space Grotesk is a `check.mjs`-banned default and was the old app's face, and the width axis supplies the contrast. Avoid Archivo Black's signature use, the 900 uppercase poster line (A2-02).

## 3. Findings against what exists

| id | sev | file:line | problem, with evidence | concrete fix | effort | source |
| --- | --- | --- | --- | --- | --- | --- |
| A2-01 | must | `components/card.css:362-365`, `:514-526` | **Link-card hover flickers.** Hover translates the card −2px −2px, which moves its hit box away from the pointer. With the pointer 1px inside the bottom or right edge, `:hover` reads `0101010101` on successive moves. A pointer sweep along the bottom band toggled it 54 times; 3px in, it stays `1111111111`. This is a Mac pointer defect. | Delete the `transform` on `.card--link`. Lift is the hard shadow only, offset `calc(var(--bw) * 2)` (px, not `--space-1` rem, `:45`). Update STYLE.md:311 "Card moves −2px". | S | [ui-ux-pro-max] stable hover |
| A2-02 | must | `tokens/foundation.css:23,37`; `base.css:95-99` | **`.t-display` overflows.** At 390px it is 74.5px, and widths are "Review" 373px, "Settings" 484px, "Statistics" 546px against 358px available. At 1440px (232px) "Settings" needs 1512px against 1360px. Only words of 5 letters or fewer fit a phone. The specimen box hides this with `overflow-wrap: anywhere` (`sheet.css:372`). The style is also the styles.csv "Exaggerated Minimalism" recipe (clamp to 12rem, 900, −0.05em; "do not use for dashboards, complex apps"). | Ship a heading style instead: `--type-heading: 600 var(--text-2xl) / 1.1`, which the sheet already uses as `.sg-sec__title`. Keep the poster line in `sheet.css` only, or delete `--text-4xl` and `--type-display`. | M | [ui-ux-pro-max] styles.csv; [typography] |
| A2-03 | should | `components/card.css:57-58`, `:76-79` | **Soft corners clip the bar control's focus ring.** The control sits 2px from the corner and its ring is inset −3px. With the 24px radius, the ring's top-right corner and right edge are cut off. Square mode shows the full ring. Evidence: `audit/a2-ctl-focus-soft.png` vs `a2-ctl-focus-square.png`. | Choose square (Conflict 2). If soft: inset `.card__ctl` in the bar by `calc(var(--card-radius) * 0.3)` on top and end. | S | [neobrutalist-web-designer] a11y: focus visible |
| A2-04 | should | `fonts.css:36`; `index.html:11`; STYLE.md:69 vs `tools/bundle.mjs:9` | **No preload, and a three-hop font discovery:** HTML → `flashcards.css` → `fonts.css` → woff2. With the font blocked, the display line is 252px instead of 332px at 390 (+32% on swap), the bar label is 100px instead of 80px, and the page is 148px taller. Body text barely moves (Archivo ≈ Arial). STYLE.md says to link `css/flashcards.css`, while bundle.mjs says to link `dist/`. | STYLE.md: apps link `dist/flashcards.css` and preload the woff2 with `crossorigin` in served shells, and the PWA precaches it. Leave `index.html` alone, since a preload from disk fails CORS and double-fetches (tested). | S | [typography] font-loading |
| A2-05 | should | `components/card.css:280-298`; `index.html:673,685,697` | **Decorative ↗ circle on every link card.** It's `aria-hidden` and "decoration" per `index.html:406`, a 44px ring repeated on every card in a grid. ↗ also means "external link" on the web and on Apple platforms. This is the busiest repeated element on the page. | Remove `.card__action` from link cards. The whole card is the target, and the title underline on hover and focus is the cue. Keep the circle only where it is a real button (notch, ghost). | S | STYLE.md rule 7; [ui-ux-pro-max] icons |
| A2-06 | should | `tokens/color.wire.css:32`; `components/card.css:34`; `base.css:118-121`; STYLE.md:99 | **Two soft inks.** The `--ink-soft` role is read 0 times by shipped CSS (8 times in `sheet.css`). Cards mix their own 72% (#565656 on paper vs #505050), so changing `--ink-soft` at gate 3 changes no app text. `.t-meta` is specified as "soft ink" but renders `rgb(20,20,20)`. | On `.card`: `--card-ink-soft: var(--ink-soft)`. Move the 72% mix to `.card[data-tone]`. Add `color: var(--ink-soft)` to `.t-meta`. | S | [retro-css-architecture] semantic roles |
| A2-07 | should | `components/card.css:514-520` vs `:534-536` | **Ghost hover doesn't match its documented state.** Real `:hover` gets a `4px 4px 0` shadow with no translate (measured, `audit/a2-desktop-ghost-hover.png`). The sheet's `.is-hover` shows no shadow. So the page documents a state the user never sees, and the ghost and link cards lift differently. | Pick one. Either drop `.card--ghost` from the hover `--lift` rule (ghost only firms up: solid, filled), or add `--lift: 1` to its `.is-hover`. After A2-01 both cards lift the same way. | S | [ui-ux-pro-max] hover feedback |
| A2-08 | should | `tokens/foundation.css:39` | **Label line-height is 1.** A wrapped bar label (15rem card, "12 — Numbers to twenty, part two") sets 2 lines in 26px with 4.1px between cap lines, and accented capitals touch the line above. | `--type-label: 700 condensed var(--text-xs) / 1.2 …`. Bars are 44px minimum and centred, so single-line labels don't move. | S | [typography] UI labels 1.2–1.4 |
| A2-09 | should | `sheet.css:179,218,274,310,380,462,503,509,626,697,872,906`; `components/card.css:501-508` | **Type styles are restated, not reused.** The label trio appears at 13 sites (base, card, wire, 10 in sheet). The sheet adds 12 ad-hoc `font:` shorthands, including three at 12px. So the page that teaches six styles renders about 16. `.card__answer` is an undocumented seventh style (700, 36–60px). | Sheet markup uses `.t-*` classes, and its off-scale styles map onto the six plus the heading from A2-02. Document `.card__answer` in the STYLE.md type table. | M | [typography] stick to the scale |
| A2-10 | should | `sheet.css:107-116`; `index.html:21-28,1120` | **The sheet's chrome reads as the stock "Swiss-brutalist" page.** Everything is numbered: nav "00…07", entries "3.1", rule and tell counters, badges, plus an uppercase kicker and a 232px wordmark. At 390 the nav scrolls with the scrollbar hidden: `scrollWidth` 742 vs 158 visible, with 6 of 8 links off-screen and no cue. The "Ours" caption says "one line weight" over a card that shows two. | On ≤52rem, wrap the nav to two rows or replace it with a "Contents" link. Drop the numbers from nav labels, and keep them only where STYLE.md cross-references them. Fix the caption to "two line weights". | S | [ui-ux-pro-max] horizontal-scroll; rule 7 |
| A2-11 | could | `components/card.css:430-476`, `:612-616` | **The notch variant costs the most and does the least.** It is four painted gradient layers with its own forced-colours branch, and it's exempt from the radius roles and from selected and lift states (STYLE.md:296). The cut-out corner with a round CTA is a current trend motif. A plain card with `.card__action` in the foot does the same job. | Park it: remove it from v0.1 CSS, specimens and STYLE.md until a real screen needs it. | M | STYLE.md rule 7; brief: prefer deleting |
| A2-12 | could | `tokens/foundation.css:21,45,54,56`; `base.css:24,126`; `components/card.css:17-27,198` | **Dead, no-op or misplaced rules.** <br>• `--space-0`, `--space-9` and `--measure` have no readers; `--text-2xl` is read only by the sheet. <br>• `lining-nums` is a no-op, since the font has no `lnum`/`onum`. <br>• `optimizeLegibility` duplicates default kerning and ligatures, and slows long mobile pages. <br>• `@property --lift/--fill` live in card.css, though README makes them every pressable element's contract. | Delete `--space-0` and `--space-9`. Apply `--measure` on `.t-body`. Drop `lining-nums` and `optimizeLegibility`. Move both `@property` rules to `foundation.css`. | S | [typography] opentype; [retro-css-architecture] |

## 4. Skill entries for "Skills we build with"

**typography**
- Load when: changing type tokens, font files or loading, measure, or dark-mode type.
- Take: floors (16/14px), line-height bands (body 1.5, headings 1.1–1.3, labels 1.2), caps tracking +0.05–0.1em, 45–75ch, preload with `crossorigin`, `font-variant-*` over `font-feature-settings`, dark-mode weight drop, smoothing on dark only.
- Ignore: its font picks (Inter, DM Sans and the like are our banned defaults), serif + sans pairing, `vw`-fluid body and app sizes, the Tailwind sections.

**neobrutalist-web-designer**
- Load when: designing a state that must stay hard-edged (hover, pressed, selected), or checking that nothing has crept back to soft or glassy.
- Take: zero-blur shadows, opaque flat fills, a physical pressed state, focus visible on every state, its "quick test" negatives (no blur, gradients or transparency).
- Ignore: 3–4px borders, shadows at rest, borders and shadows that grow with breakpoints, the primary-colour palette, Archivo Black/Space Grotesk/Lexend Mega, uppercase headings, `transition: all`.

**retro-css-architecture**
- Load when: rarely; only when reorganising the entry stylesheet or file layout.
- Take: one entry stylesheet every surface imports, semantic colour roles with a dark variant each, fixed px for line work.
- Ignore: everything 8-bit (Press Start 2P, pixelated images, pixel borders, `rounded-none` as a look), Tailwind-first, `@import` of Google Fonts.

**ui-ux-pro-max (visual side)**
- Load when: running the pre-delivery pass on a screen, or checking a choice against styles.csv to see whether it's a named template.
- Take: stable hover (no hit-box movement), consistent 24-grid icons, no emoji icons, 44px targets, muted text at 4.5:1 or better, no horizontal scroll at 375 and 1440, colour never the only indicator.
- Ignore: the `scripts/` workflow, Tailwind advice ("bg-primary not var()"), floating navbars, the Glass and Liquid Glass rows, typography.csv pairings, and its "150–300ms transitions" until gate 4.
