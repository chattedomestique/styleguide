# V2: docs and guidelines (STYLE.md, README.md)

Scope: `design/STYLE.md` (580 lines) and `design/README.md` (131 lines) at HEAD, checked
against `PLAN.md` (F2 items 1–10, 5b, README items), the CSS and `index.html` as they are now,
and the skill files. `node design/tools/check.mjs` passes 9/9. Read-only for `design/`. The only
probe is `scratchpad/v2probe/focus.cjs`, which is outside `ds/`.

## 1. Plan items

| # | Item | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Header v0.2; "Start here" ≤ 12 lines with 6 roles, 5 classes, 2 house rules, the check | PASS | STYLE:3; box STYLE:11–21 (11 lines). Content problem: P1 |
| 2 | Delete the file tree, hex table and static contrast table; keep the floors and the live swatches as source | PASS | STYLE:84–86 points to README; no hex in STYLE; floors and swatches STYLE:225–227 |
| 3 | Square decided ("one shape gesture" gone); rule 2 hit box; heading replaces display; fixed rem; floors 16/14/13; label 1–4 words at 1.2; `.card__answer`; font loading; smoothing; dark weight drop | PASS | STYLE:73, 161; 46–47; 107; 115–122; 123; 111, 124; 113; 84, 138–142; 131–133; 134–136 |
| 4 | Hit targets by input; focus by platform; ring takes surface ink; motion guidance (crossfade ≤150ms, SwiftUI curve, no `.bouncy`); layer `app`; safe-area tokens | PASS | STYLE:178–186; 188–198; 195–197; 244–250; 88–91; 150–152 |
| 5 | Card: 8 variants; states (shadow lift, hover-capable only, `:active`, Selected/Disabled per contract); collections; a11y additions; 320px at 200%; known limits trimmed | PASS | STYLE:318–327; 345–364; 369–385; 406–428; 403–404; 441–451. The Safari bullet (443–445) stays because the clip still needs `overflow-clip-margin` (card.css:369–373), which is what the plan's condition asked for |
| 5b | No backticked cut names; the changelog names them in plain words | PASS | grep is clean; STYLE:571–573; check 7 ok |
| 6 | Platforms, about 60 lines: the PWA rules, the macOS rules, a SwiftUI map of about 12 rows | PASS | STYLE:455–513 (59 lines); PWA 459–472 has all 9 rules; macOS 476–494 has all 7; 12 map rows 502–513 |
| 7 | Skills we build with: 7 skills with load/take/ignore; precedence | PASS | STYLE:535–550; precedence 537–539. Content problem: P2 |
| 8 | Where we differ: ≤ 8 rows covering the listed conflicts | PASS | STYLE:556–565 (8 rows, all 8 conflicts). Attribution: P11 |
| 9 | De-flashcard: "product", own-words motion, no "the app's", README or `styles.css`; open decisions | PASS | STYLE:52–53, 240–250, 70–73; grep is clean |
| 10 | Changelog 0.2.0 · 2026-10-19 | PASS | STYLE:571–577 |
| R1 | README: delete "Migrating the app" | PASS | The section is gone (diff) |
| R2 | README gate: no `sheet.css` exemption, no "app's own classes", nine checks | PASS | README:119, 124, 108–122. Wording: P12 |
| R3 | README holds the only file tree, up to date | PASS | README:17–38; every listed file exists; no other copy |
| R4 | Pipeline: six gates unchanged; Cards at 0–2 | PASS | README:46–53, 59 |
| R5 | One line pointing to "Skills we build with" | PASS | README:6–7 |
| D | Done-when: ≤ 600 lines; check 7; nothing contradicts the contract | PASS | 580 lines; 9/9; every contract row matches (heading token, selectors, lift, layers, soft ink, the 8 variants) |

**17 PASS, 0 FAIL.** All of the plan was carried out. What's wrong is in the content, listed under Problems.

## 2. Claims checked against the code (63)

✓ = matches. ✗ = see the problem named.

| # | Claim (STYLE line unless noted) | Code | Result |
| --- | --- | --- | --- |
| C1 | v0.2 (3) | index.html:29, 1064 | ✓ |
| C2 | the six roles (13–15) | color.wire.css:176–185 | ✓ |
| C3 | the five classes build a screen (16–17) | card.css:395–399, 487–491 | ✗ P1 |
| C4 | `--bw` 2 / `-thin` 1 / `-heavy` 4, heavy only in forced colours (43–44) | foundation.css:84–86; card.css:591–604 | ✓ |
| C5 | no `transform` on cards (46–47, 277–278) | card.css has only `text-transform` | ✓ |
| C6 | layer order with `app` (88) | flashcards.css:19 | ✓ |
| C7 | apps link the flat `dist/flashcards.css`; font stays a file (84, 138) | dist/flashcards.css: no `@import`, `../fonts/…woff2` at :33 | ✓ |
| C8 | fallback stack (97) | foundation.css:41 | ✓ |
| C9 | semi-expanded = 112.5%, condensed = 75% (103) | foundation.css:65, 68 | ✓ |
| C10 | `--type-heading` 600 · 32 · 1.1 · −0.015em, `.t-heading` (107) | foundation.css:63; base.css:113–117 | ✓ |
| C11 | title, body, meta, label, figure rows, incl. label `/ 1.2` and meta in `--ink-soft` (108–112) | foundation.css:64–68; base.css:119–147 | ✓ |
| C12 | answer 700, 36–60px, centred (113) | card.css:446–454 | ✓ |
| C13 | the size scale in fixed rem, no `vw` (115–119) | foundation.css:44–50 | ✓ |
| C14 | floors, "the sheet included" (123) | smallest sheet text is 0.8125rem (sheet.css:48, 385, 630, 701) | ✓ |
| C15 | Dynamic Type inside `@supports (-webkit-touch-callout: none)` (128–130) | base.css:20–24 | ✓ |
| C16 | smoothing only on `.card__bar` and `[data-tone="ink"]` (131–133) | card.css:95–96; base.css:188–189; none on `body` | ✓ |
| C17 | `index.html` doesn't preload (142) | index.html:11–12 | ✓ |
| C18 | space 1–8, `--gutter`, `--measure` (146–148) | foundation.css:71–80 | ✓ |
| C19 | safe-area tokens (150–152) | foundation.css:105–108 | ✓ |
| C20 | radius roles all 0, pill 999px (161–169) | foundation.css:92–96 | ✓ |
| C21 | `--radius-tile` used by "icon tiles, media inset" (168) | only card.css:318 reads it | ✗ P5 |
| C22 | `--hit` 2.75rem; a 20px box in a 44px control (180–181) | foundation.css:99; card.css:115–139 | ✓ |
| C23 | ring 3/3, inside offset 2, negative on bar and list rows (190–192) | foundation.css:100–102; card.css:66–79, 280–282 | ✓ |
| C24 | a ring takes its surface's ink (195–197) | card.css:70–79 | ✓ |
| C25 | ink ≥ 8.4:1, soft ink ≥ 4.5:1 on any tone (225) | computed: ink on tone-6 8.399 (prints 8.4); minimum soft mix 4.80; `--ink-soft` on paper 8.06 | ✓ (rounded) |
| C26 | `--card-ink-soft` = `--ink-soft`; 72% mix on a toned card (227–228) | card.css:23, 52–54 | ✓ |
| C27 | prefers-contrast (230–231, 413–414) | color.wire.css:206–211; card.css:544–549 | ✓ |
| C28 | motion token values (237–238) | foundation.css:115–119 | ✓ |
| C29 | `--lift`/`--fill` are registered (241) | foundation.css:125–135 | ✓ |
| C30 | 5 glyphs, `--ic-size` 1.25rem (254–263) | icons.css:205–239 | ✓ |
| C31 | Frame spec (293) | card.css:37–48 | ✓ |
| C32 | Bar 44px; wraps; control at the end; flips on ink (294) | card.css:85–101, 57–60 | ✓ |
| C33 | Control 44/20, glyph 12px, box fills on press (296) | card.css:115–143, 510–512 | ✓ |
| C34 | Media ratio, 2px rule, cover, tone fallback (297) | card.css:146–157 | ✓ |
| C35 | Body padding clamp, gap 8px (298) | card.css:27–28, 170–175 | ✓ |
| C36 | Title 22–32px (301) | card.css:182–187, but 341–343 and 417–419 set 20px | ✗ P7 |
| C37 | Figure clamp; `<small>` 0.42em, 500, soft (304) | card.css:201–214 | ✓ |
| C38 | Foot 44px, 8px padding, foot links 44px tall (305) | card.css:217–240 | ✓ |
| C39 | Action 44px circle, accent at `--fill` 1 (306) | card.css:294–306 | ✓ |
| C40 | helpers; list-row markup (308–311) | card.css:243–282; index.html:487–490 | ✓ |
| C41 | 8 variants = 3.1–3.8 (315–327) | index.html:418–748 | ✓ |
| C42 | Ghost "firms up on hover, focus and press" (326) | card.css:501–504 (press sets `--fill` only) | ✗ P9 |
| C43 | Study `max-inline-size` formula (327) | card.css:431 | ✓ |
| C44 | stretched `::after` `inset: -2px`; `:has` fallback (331–334) | card.css:388–399 | ✓ |
| C45 | lift shadow formula, behind `--shadow-select` (342–343) | card.css:34, 48 | ✓ |
| C46 | Hover only in `@media (hover: hover)`, z-index 1 (348, 355–357) | card.css:461–477; sheet.css:134–135 | ✓ |
| C47 | Focus selectors, 3px ring at offset 3 (349) | card.css:480–491; base.css:88–91 | ✓ |
| C48 | Pressed: lift 0, fill 1 (350) | card.css:501–504 | ✓ |
| C49 | Selected selector, exact (351, 362) | card.css:523–527 | ✓ |
| C50 | Disabled: modifier, dashed, faint, hatch, no pointer events (352) | card.css:532–541; wire.css:104–110 | ✓ |
| C51 | Forced colours: Highlight, 4px, GrayText (353) | card.css:585–616 | ✓ |
| C52 | tap highlight off (360–361) | base.css:81–86 | ✓ |
| C53 | no `cursor` on buttons, ctl, action or cards (363–364) | none in base.css or card.css (sheet's radios keep theirs, as the plan allows) | ✓ |
| C54 | `.is-hover/-focus/-active/-selected` exist (366) | card.css:308, 480–501, 523 | ✓ |
| C55 | collection markup; `li` is a grid cell (372–373) | card.css:566–568; index.html:860, 913 | ✓ |
| C56 | `.card-grid` literal (391) | card.css:558–563 | ✗ P8 |
| C57 | tiled margins on `> :is(.card, li)` (392) | card.css:570–579 | ✓ |
| C58 | row trail moves at 18rem; wraps (401–402) | card.css:351–361, 87, 219, 245, 407 | ✓ |
| C59 | meters carry `aria-valuetext` (418–419) | index.html:559–567 has none | ✗ P3 |
| C60 | inputs `max(1rem, 1em)` (464–465) | base.css:71–73 | ✓ |
| C61 | wire-kit classes (522–528) | wire.css:16–110 | ✓ |
| C62 | README tree; fonts 90 KB, wght 100–900, wdth 62–125% (README:17–38, 130) | files exist; woff2 is 90,104 B; fonts.css:260–261 | ✓ |
| C63 | README: nine checks, Space Grotesk banned, `GATES.motion`; "checks 2 to 5 cover `sheet.css`" (README:106–124) | check.mjs:31, 120, 9/9; radius test only on components and wire (check.mjs:163–167) | ✓ / ✗ P12 |

## 3. Claims checked against the skills (19)

| # | Claim | Skill source | Result |
| --- | --- | --- | --- |
| K1 | ui-ux-pro-max: targets, hover vs tap, viewport meta, sideways scroll at 375/1440, stable hover | SKILL.md:46, 59, 61, 322, 379 | ✓ |
| K2 | ui-ux-pro-max: safe areas, `dvh`, 8px between targets, overscroll | ux-guidelines.csv rows 17, 20, 23, 26 | ✓ |
| K3 | ui-ux-pro-max ignores: floating navbar, 150–300ms | SKILL.md:347; 72, 367 | ✓ |
| K4 | neobrutalist: zero-blur, opaque, pressed, focus; ignore 3–4px borders, shadows at rest, breakpoint-grown borders, fonts, uppercase, `transition: all` | SKILL.md:69–79, 96–98, 107–111, 193–205, 277–300, 128–138, 149, 327, 638–644 | ✓ |
| K5 | retro-css: one entry sheet, dark variants, fixed px; ignore Press Start 2P, Tailwind first, `@import` of Google Fonts | SKILL.md:11–15, 54–60, 118, 83, 121 | ✓ |
| K6 | typography: floors 16/14, line heights (body 1.5, headings 1.1–1.3, labels 1.2), caps tracking, 45–75ch, smoothing on dark, weight drop | SKILL.md:80–81, 149–154, 161, 268–288 | ✓ |
| K7 | typography: preload with `crossorigin` | references/font-loading.md:124 | ✓ |
| K8 | web-design-guidelines: skip link, touch-action, tap highlight, hover parity, 0.01ms kill switch, soft-shadow hover, "44px = WCAG 2.5.8" | SKILL.md:130, 1031, 1058, 1062, 797–801, 1068–1070, 362 | ✓ (the skill cites 2.5.8 wrongly, and we say so) |
| K9 | interaction-design: roving tabindex, ⌘/⇧ selection, keyboard first, disabled = opacity, "explain why", 2px blue ring, shadow+scale lift | accessibility-patterns:259, 186, 221; component-patterns:309–310, 54, 219, 248 | ✓ |
| K10 | swiftui-expert: `foregroundStyle`, `Button` over `onTapGesture`, `containerRelativeFrame` | SKILL.md:58, 61, 70, 154 | ✓ |
| K11 | swiftui-expert: take `ViewThatFits` | not in this skill, nor in any synced skill | ✗ P2 |
| K12 | swiftui-expert: ignore "44pt everywhere" | no such rule; a single 44×44 frame in liquid-glass.md:230 | ✗ P2 (overstated) |
| K13 | §7 glass cards and buttons (swiftui-expert) | liquid-glass.md:124–128, 237 | ✓ |
| K14 | §7 `.spring` for interaction, `.bouncy` for play | animation-basics.md:124–126 | ✓ |
| K15 | §7 reduced motion 0.01ms (both skills) | web-design SKILL.md:797–801; accessibility-patterns:473–474 | ✓ |
| K16 | §7 "System type and colour everywhere (macOS guidance)" | macos-app-design references/macos-design-guide.md §4.1–4.2; the skill isn't named | ✗ P11 |
| K17 | §7 "Archivo with Space Grotesk … (typography, neobrutalist)" | typography names neither font; the Archivo + Space Grotesk pairing is ui-ux-pro-max typography.csv:45; neobrutalist uses Archivo **Black** (:128–129) | ✗ P11 |
| K18 | §4 macOS: menu bar + `CommandMenu`, standard shortcuts, live resize, glass only as chrome | macos-design-guide §3.1–3.3, §2 | ✓ |
| K19 | Mac floor 28pt native | macos-design-guidelines SKILL.md:943 ("22–28pt height"): our floor sits at the top of that range. A house choice, and it's fine | ✓ |

**SwiftUI names.** Every API name used exists: `Font.custom(_:size:relativeTo:)`,
`.fontWeight`, `.fontWidth(.condensed/.expanded)`, `.tracking`, `.textCase`, `.monospacedDigit()`,
`.lineSpacing`, `strokeBorder(_:lineWidth:)`, `Divider`, `Rectangle/Capsule/Circle`,
`.clipShape`, `.contentShape(.rect)`, `ButtonStyle`/`isPressed`, `.onHover(perform:)`,
`@Environment(\.isFocused)`, `@FocusState`, `.controlSize(.regular)`,
`LazyVGrid`/`GridItem(.adaptive(minimum:), spacing:)`, `ViewThatFits(in:)`,
`List(selection:)`, `Table`, `CommandMenu`, `.keyboardShortcut`,
`.contextMenu(forSelectionType:)`, `.windowResizability(.contentMinSize)` (a Scene modifier),
`.glassEffect()`, `.animation(_:value:)`, `.timingCurve(…, duration:)`,
`.spring(duration:bounce:)`, `Animation.bouncy`, `AccentColor`. `tabFocusesLinks` is a real
`WKPreferences` property. The tracking values are right: 32×−0.015 = −0.48, 24×−0.015 = −0.36,
13×0.08 = 1.04.

## 4. Consistency

- **Leftovers: none.** No Notch, Stack, ↗-circle, soft-corner option, app-screen display style or
  sections 06/07. No `styles.css`, `decks.js`, "the app's" or root-README references, in STYLE,
  README or index.html. The only matches are the changelog's plain words (STYLE:571–576), the
  ↗ glyph itself (STYLE:262–265, which still ships) and the sheet's unrelated `.sg-stack`.
- **STYLE ↔ README:** they agree on dist linking, the gates, the checks, 320–1440 and the role
  names. README contradicts itself on gate 3 (P6).
- **STYLE ↔ index.html prose:** the rules list, captions and notes agree, with three
  exceptions: rule 3 against the square control (P4, index.html:84), the meter (P3), and the
  title size (index.html:362, the same as P7).

## 5. Problems (12)

**P1 · must · STYLE:16–17.** The "Start here" list of five classes gives `.card__link` without
`.card--link`. A link card built that way has **no focus indicator**: `.card__link:focus-visible
{ outline: 0 }` (card.css:395–399) applies to every `.card__link`, and only `.card--link` gets the
ring back (card.css:487–491). Probe (`scratchpad/v2probe/focus.cjs`): link outline `none 0px`,
card outline `none 0px`. With `.card--link` the card gets `solid 3px`. The list also contradicts
the Link row (STYLE:325). Fix: "**Six classes build a screen:** `.card-grid`, `.card`,
`.card__body`, `.card__title`, and `.card--link` with `.card__link` in the title."

**P2 · must · STYLE:550.** The swiftui-expert-skill row's "Take" lists `ViewThatFits`. No
synced skill mentions it. The skill teaches `containerRelativeFrame` over `GeometryReader`. In the
same cell, "Ignore: … 44pt everywhere" overstates the skill: it has no target-size rule and no
Mac content at all. Fix: "…`@Observable` and private `@State`, `containerRelativeFrame` over
`GeometryReader`, …" and "Ignore: Liquid Glass on content, `Animation.bouncy`, its iOS-only scope
(nothing on menus, windows or Mac control sizes)."

**P3 · must · STYLE:418–419 vs index.html:559–567.** STYLE says meters carry `aria-valuetext`
("5 of 12 learned"). The only meter specimen has none, and that is the markup people copy.
Fix, in F1's file: add `aria-valuetext="5 of 12 learned"` to the `.wf-meter` at index.html:559.

**P4 · must · STYLE:48–49, 161–163, 169, 296; index.html:84.** Rule 3 says "Buttons, handles and
action slots are circles or pills", and Shape says pills and circles are "for things you act on"
while everything else is 0. Yet the bar control, a `<button>`, is "the square bar control"
(`--radius-ctl: 0`). Fix (docs only; the owner may prefer to round it): rule 3 →
"…are circles or pills. One exception: the bar's control is a small square box, because it is
part of the frame."

**P5 · must · STYLE:168.** "`--radius-tile` … icon tiles, media inset." Nothing insets the media,
and only `.card__tile` reads the token (card.css:318). This is stale from soft mode. Fix: delete
", media inset".

**P6 · must · README:51 vs README:97–102 (and base.css:14).** Gate 3's exit check says "The diff
touches `tokens/` only". The handover then edits `flashcards.css` (step 6) and expects
`flashcards.css`, `STYLE.md` and prose in the diff (step 8). Step 5 (`color-scheme: light dark`
in the roles) also does nothing unless base.css changes: `html { color-scheme: light }` sits in
the later `base` layer and beats `:root` in `tokens`. This predates v0.2. Fix: README:51 →
"Nothing in `components/` changes." Step 5: add "and remove `color-scheme: light` from
`base.css`."

**P7 · should · STYLE:301 (and index.html:362).** Title "22–32px" leaves out row and ghost cards,
whose titles are `--text-lg` 20px (card.css:341–343, 417–419). Nothing documents this. Fix:
append "; 20px (`--text-lg`) in a row or ghost."

**P8 · should · STYLE:391.** The doc gives `minmax(min(100%, var(--card-min, 16rem)), 1fr)`.
The CSS declares `--card-min: 16rem` on `.card-grid` itself (card.css:559), so setting it on an
ancestor does nothing, which the fallback form suggests would work. Fix: "`--card-min: 16rem`
(set it on the grid); `grid-template-columns: repeat(auto-fill, minmax(min(100%,
var(--card-min)), 1fr))`".

**P9 · should · STYLE:326.** Ghost "firms up on hover, focus and press". A press only sets
`--fill: 1` (card.css:501–504), which fills the circle. On touch the frame stays dashed. Fix:
"Dashed; firms up on hover and focus; its circle fills on press." This matches index.html:691–692
and STYLE:358.

**P10 · should (judgement) · STYLE:240–241, README:52.** "Only `transform` and `opacity` move
things. States animate through `--lift` and `--fill`…" Since v0.2 the lift is a `box-shadow` and
the fill is a colour, so gate 4 will transition neither transform nor opacity. That reads as a
contradiction. Fix: "Only `transform` and `opacity` move things. Card states don't move: `--lift`
draws a shadow and `--fill` a colour, both registered numbers, so one `transition` covers
hover, focus and press."

**P11 · should · STYLE:563, 565.** Two attributions are loose. Row 6 cites "(macOS guidance)",
which is really the macos-app-design skill, not one of the seven in §6, although §4's macOS rules
and row 5's reason rest on it. Row 8's "Archivo with Space Grotesk" comes from ui-ux-pro-max
`typography.csv` (neobrutalist pairs Archivo **Black** with Space Grotesk), and the typography
skill names neither font. Fix: row 6 → "(macos-app-design)". Row 8 → "(ui-ux-pro-max
`typography.csv`, neobrutalist-web-designer; 'pair by contrast': typography)".

**P12 · should · README:124.** "Checks 2 to 5 cover `sheet.css` too." Check 4's radius test runs
only on `components/` and `wire.css` (check.mjs:163–167); the sheet gets only the border-width
half. Fix: "Checks 2 to 5 cover `sheet.css` too (for check 4, its border widths)". Or F1 widens
the radius test.

## 6. Usability of the doc

- **Ten minutes: yes, once P1 is fixed.** The "Start here" box (11 lines) plus §3 Anatomy,
  Variants and States (STYLE:287–367, about 80 lines) is enough to build a grid of link cards,
  and §1 gives the reasons. The file is 580 lines (limit 600) and about 6,200 words with
  README. It's long, but each section has one job.
- **Judgement calls on the box (not counted).** "Six roles carry every colour" (13) undersells
  the 11 role rows in §2 Tone (206–218): "do most of the work" is truer. "House rule 1/2" (18–19)
  collides with §3's "House rules" (274), which holds five different bullets; renaming one of
  them avoids the clash. The box doesn't say where to copy markup from. "Copy markup from
  `index.html`: every specimen prints its own" would fit in the remaining line.
- **Repetition (judgement).** "The lift is a shadow, the card never moves" appears four times
  (46–47, 277–278, 342–343, 348). The contrast floors and prefers-contrast appear in §2 Tone
  (225–231) and again in §3 Accessibility (413–414). The Accessibility bullet could be
  "Contrast: see §2 Tone", which saves 2 lines. Nothing else is padded.

**Also seen, not counted** (judgement calls, or files outside F2):
- STYLE:544 lists ui-ux-pro-max's "emoji … rules" under Ignore, although we follow its
  no-emoji-icons rule.
- A navigable link-card grid (STYLE:377) has no arrow path, while §4 (481–483) says not to depend
  on Tab on a Mac. This is a design question for the owner.
- Code comments (F1's files): foundation.css:61–62 says "`expanded` … 125%", but the figure uses
  `semi-expanded`. flashcards.css:2 says "the one file an app links to" (apps link the `dist/`
  copy).
- Ink on tone-6 is 8.399:1, so "at least 8.4" holds only after rounding.
