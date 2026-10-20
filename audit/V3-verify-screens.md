# V3: screens test bed (v0.2.1, 736a165 + 6d7a9eb)

**Verdict: PASS WITH FIXES.** The gate and the bundle pass, there's no page overflow anywhere, the
switches work by keyboard, and 7 of the 8 findings reproduce. Two layout bugs hide content inside
the frames (the Mac window doesn't scroll; the study card's top can't be reached at 200%). Three
claims are wrong or overstated. Every fix below is one or two lines, and the CSS ones were tested
in the browser by injecting them.

## Must fix

1. **The Mac window doesn't scroll, so its lower half can't be reached.** `sheet.css:974`
   `.sg-mac__body` has an implicit `auto` row, so `.app` grows to its content (1111px in a 664px
   body at 1440/100%) and `.sg-mac`'s `overflow: clip` cuts it off. `.app__scroll` never
   scrolls (scrollHeight = clientHeight). Effects: the whole **Recent** section is invisible,
   and those are the Tag stand-ins the inventory points to (`screens.html:92`). "Make a deck"
   is half cut off, and keyboard focus lands on clipped cards: its ring is 84px outside the
   window at 1440/100%, and at 200% all five Mac links sit 1302–2121px below the window.
   **Fix:** add `grid-template-rows: minmax(0, 1fr);` to `.sg-mac__body`. Tested: it scrolls at
   every size, and every Mac focus ring is whole.
2. **At 200% the top of the study card is cut off and can't be scrolled to.** `screens.css:122`
   uses `align-content: center`. When the card is taller than the scroll box, the overflow
   splits both ways, and the top half can't be scrolled to. At scrollTop 0 the card's top is
   −24px from the box at 1440/200% (the true 390×844 frame), −44px at the 390 viewport and
   −70px in a 375×667 frame. The top border and part of the "06 / 12" row sit under the nav
   bar (`qa/v3/shots/d1440-200-phone.png`). **Fix:** `align-content: safe center;`. Tested: the
   card top is now +48px at every size, and 100%/150% look the same as before.
3. **The answer's "floor" does nothing, so the fix is described wrongly.** In
   `clamp(min(2.25rem, 13cqi), 17cqi, 3.75rem)` the minimum is always ≤ 13cqi < 17cqi, so
   it never applies. The rule is exactly `min(17cqi, 3.75rem)`: across 30 configurations
   (both pages × 320/390/1440 × 100–300%) the computed size was identical. The fix itself is
   real (at 1440/200% the old rule gives "Hexagon" at 72px on 2 lines, the new one 53px on
   1 line), but it comes from dropping the 2.25rem floor, not from 13cqi. The wrong
   description is in `card.css:457–459` ("floor gives way to the card's width"),
   `STYLE.md:405–407` and finding 7 (`screens.html:537–539`). **Fix:** write
   `font-size: min(17cqi, 3.75rem);` and describe it as "no floor: 17% of the card's width, at
   most 60px". The word still breaks in cards narrower than about 220px at 200% (217px at
   the 390 viewport; 160px in a real 320×568 frame). Only hyphenation helps there, which this
   Chromium can't show.
4. **Finding 1 overstates what scroll padding does.** `screens.html:505–506` and the comment
   at `screens.css:48–50` say scroll padding keeps a tabbed card's focus ring. It doesn't for
   the deck tiles. Tabbing to "Shapes" or "Colours" on Today still cuts the bottom of the card
   by 31px at 1440/100% and 15px at 390/100%: the ring's bottom edge and the "5 known" line
   (`qa/v3/shots/tab10-1440.png`). Without any padding the cut is 37px. The cause: Tab scrolls
   the focused element, the title link, into view, not the card that draws the ring. On the
   Mac, after fix 1, the same thing cuts "Farm animals" at the top (116px at 150%).
   **Fix:** reword the finding: scroll padding helps, but Tab brings the title link into view,
   not the card, so a tall tile can still lose an edge; Card and Frame's briefs have to cover
   it. Optionally `scroll-padding-block: var(--space-4) var(--space-7)`, which clears the
   Today phone at 100% (0 cuts at 1440 and 390) but still leaves 11px at 390/200%.
5. **"Every black frame on this page is a card" (`screens.html:84`) is false.** The phone and
   Mac frames (`.sg-device`, 2px ink), the switches, the key swatch and the meter outlines are
   all black frames. **Fix:** "Inside the screens, every black box is a card."

## Should fix

6. **The study scroll region's focus ring is cut at the sides.** At 150% and 200%, Chromium
   makes the study `.app__scroll` a tab stop (it overflows and holds nothing focusable). Its
   ring is offset +3px, so the phone's `overflow: clip` cuts it on both sides, leaving two
   horizontal lines that read as bar borders (`qa/v3/shots/tab15-1440-200.png`).
   **Fix (screens.css):** `.app__scroll:focus-visible { outline-offset: calc(var(--ring) * -1); }`.
   Tested: whole ring.
7. **Forced colours: you can't see which option a switch has selected.** The selected label's
   ink background is forced to Canvas, the same as the unselected ones. This comes from
   `sheet.css:253` and already affected index.html's "Show boxes"; this change adds two more
   switches with the same problem. **Fix**, in the sheet's forced-colours block:
   `.sg-seg label:has(input:checked) { forced-color-adjust: none; color: HighlightText; background-color: Highlight; }`.
   Tested: the selected option shows as Highlight.
8. **The frames are smaller than their stated size on narrow screens.** "390 by 844 points"
   (`:127`) gives a 317px-wide frame at a 390 viewport (285px at 200%) and 254px at 320
   (222px at 200%). "1080 by 720" (`:484`) gives about 300px. These frames show breaks a real
   phone wouldn't: "Toda/y", "Sha/pes" and "Hexag/on" at 320/200%, and on the Mac, row cards
   with one letter per line. **Fix:** add to both notes that the frames are narrower when the
   page itself is on a phone, so judge the screens at desktop width.
9. **The Mac caption's "arrow keys are still an open decision" (`:484`) isn't written down
   anywhere.** STYLE.md:381–382 already decides that navigable link cards get one Tab stop
   each, and Open decisions (STYLE.md:73–76) lists only the prefix and the name. **Fix:** drop
   the clause, or add it to Open decisions.

## Noted, no action

- `hyphens: auto` can't be seen here (no dictionaries). Chromium falls back to
  `overflow-wrap: anywhere`, as the card.css comment says.
- Findings checked by undoing each fix in the browser. Status bar: without the padding, the
  Today scroll box starts at 2px, under the 47px status bar; with it, 49px. Grid: 16rem gives
  one column on both phone grids; 8rem gives two. Tab bar: 1 row at 100% and 150%, 2 rows at
  200%. h5: margins are 36.7px without the reset, 0 with it. Gutter: 16px on the phone and
  26.8px on the Mac, from cqi. Findings 2 and 5 are judgement calls and read fairly.
- index.html, old answer rule vs new (`qa/v3/answer-index.log`): no regression. New is equal
  or better everywhere. 320/200%: old 2 lines (card 463px tall), new 1 line (345px).
  390/250%: old 2 lines, new 1. 1440: unchanged at every size. 320/250–300%: still 2 lines
  (old 4–5). index.html has no h5/h6, so the reset changes nothing there.
- Rules: no colour literals, gradients, blur or motion in screens.css, sheet.css or the
  wire.css additions. Only `--bw`/`--bw-thin`. Radii are 0 or `--radius-pill` (pills and
  circles only). Roles only (check 6 also scans screens.css). screens.css is all inside
  `@layer app`. `components/` doesn't reference `.wf-*`. No new component: `.app*` is labelled
  as the future Frame, and the device frames are sheet-only. The px device sizes are
  deliberate and commented.
- At 1440/200% the Study figure wraps to the left under a centred Today, because its long
  caption sets the figure's width. Cosmetic.
- Slot names (`::before` content) are read by screen readers ("Nav bar, Today…"). Probably
  helpful in a test bed.
- The key's "Grey text, no frame" doesn't quite fit the Mac chrome (the search field and the
  selected sidebar row have thin grey outlines). `screens.css:107` says one column "at 200%",
  but it already happens at 150%. The page labels say v0.2 (`:29`, `:552`); the changelog says
  0.2.1.

## What I ran (scripts in `qa/v3/`, NODE_PATH=/opt/node22/lib/node_modules, Chromium)

- `node design/tools/check.mjs`: 9/9 pass. `node design/tools/bundle.mjs`: OK. dist was
  byte-identical before and after re-bundling (`diff -r`). `git status design` is clean (no
  design files touched).
- `overflow.cjs`: 4 pages (both screens pages and both style sheets) × 320/390 (mobile, touch)
  and 1440 (desktop) × 100/150/200%. No page overflow, console clean in all 36 runs. Also checks
  for elements outside each device frame.
- `links.cjs`: all four cross-links (source and dist) load the right page, styled, with the
  Archivo font and a clean console.
- `study.cjs`, `smallphone.cjs`, `answer.cjs`, `inert.cjs`: study card reach, answer size and
  line count, old vs new rule.
- `keys.cjs`, `tabshot.cjs`, `switches.cjs`: Tab order (skip link, top nav, 2 switch groups,
  phone, Mac) is sensible. Every ring checked against every clipping ancestor. Arrows change
  both radio groups (root 16→24→32px, slot names toggle). The label ring shows on both the
  white and the black state.
- `fcseg.cjs` and `shots.cjs … light|dark`: forced colours. Text and lines are legible. Slots
  (1px, named) and cards (2px) can be told apart, and the meter stays visible.
  `findings.cjs`, `mac.cjs`, `macrows.cjs`: reproductions and fix checks.
