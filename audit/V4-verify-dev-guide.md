# V4: review of the rewritten App Development Guide

Reviewed: `scratchpad/claude-AppDevelopmentGuide.md` (line numbers below), against `ds/design/STYLE.md`, `README.md` and `color.wire.css`, and against the original upload.
Tools: Swift 6.0.3 (Linux) for language-level compile tests, Apple's developer-docs JSON for API declarations and availability, a grep fixture for the gates. Scratch files are in `scratchpad/v4swift/` and `scratchpad/v4docs/`.

## Verdict: PASS WITH FIXES

The design content is faithful. Every value I checked matches STYLE.md, and none of the original's contradictions (serif pairing, palettes, radii, soft shadows, the default spring, dark mode from day one, captions at reduced opacity) survived. The build fixes are real. Five items need fixing: three snippets that won't compile or run, one wrong claim, and one gate that misses most of what it says it bans.

## Must fix

1. **`Space` enum won't compile in use** (l.399). In `static let s1: CGFloat = 4, s2 = 8, …` the annotation applies only to `s1`, so `s2`–`s8` are `Int`. Compiled: `.padding(Space.s4)`-style call → `error: cannot convert value of type 'Int' to expected argument type 'CGFloat'`. STYLE's row abbreviates with "…", so the bug came in when the row was expanded. Fix: `s2: CGFloat = 8`, and so on, or one `static let` per line.
2. **`SMAppService.mainApp.register()` won't compile** (l.194). Apple's declaration is `func register() throws`. This came from the original and survived the rewrite. Fix: `do { try SMAppService.mainApp.register() } catch { logger.error(…) }`.
3. **The Python snippet crashes, and build.sh never bundles the scripts** (l.264, l.270; also in the original). `Bundle.main.path(forResource:"script", ofType:"py")!` never finds `Resources/Python/script.py`. Apple's docs say it "does not recurse through other subfolders", so the force-unwrap crashes. Fix: `path(forResource: "script", ofType: "py", inDirectory: "Python")`, and add `if [ -d Python ]; then cp -R Python "${CONTENTS}/Resources/Python"; fi` to build.sh.
4. **Wrong icon claim** (l.529): "macOS adds its own shape and lighting". macOS 14–15 draw an `.icns` as-is, with no mask. macOS 26 puts any icon that isn't a squircle inside a grey squircle ("squircle jail": Wikipedia *macOS Tahoe*, 9to5Mac 2025-08-08, heise). System lighting applies only to Icon Composer `.icon` files, which need Xcode's `actool`. Fix: "macOS doesn't shape an `.icns`: draw the rounded-square plate on the 1024 canvas yourself (Apple's macOS icon grid), or macOS 26 puts it in a grey plate." STYLE's square-corners rule covers content; the icon plate is the platform's.
5. **Design gate 1 misses most colour literals** (l.568), yet passing it is taken as "prints nothing". On a fixture it missed `.foregroundStyle(.red)` and every other named colour except black, white and gray. It also missed `Color(.sRGB, red:…)`, `NSColor(srgbRed:…)` (the guide's own constructor, so a copied `rgb()` helper passes) and `Color.black` at end of line (`[^A-Za-z]` needs a following character). Tested replacement, which also had no false positives on `.redacted`, `.whitespacesAndNewlines`, `inkSoft` and `greenhouse`:
   `grep -rnE 'Color\((red|white|hue|hex|\.sRGB|\.displayP3)|NSColor\((srgbRed|calibratedRed|deviceRed)|\.(black|white|gray|red|orange|yellow|green|mint|teal|cyan|blue|indigo|purple|pink|brown)([^A-Za-z]|$)' Sources --include='*.swift' | grep -v 'Theme/Color+Roles.swift'`

## Should fix

Design conformance (guide vs STYLE.md):
- **Rule 3 / §5.5 drop STYLE's one exception** (l.286, l.395). The bar's small square control (`--radius-ctl` 0, a 20×20 box in a 44 target) "belongs to the frame". As written, a port of the Panel card would round it. Add "except the bar's small square control".
- **The shadow hard-codes `Rectangle()`** (l.398). STYLE's mapping says `shape.fill(.line).offset(x: 4, y: 4)`: the control's own shape, which the same section's one-shape rule also requires. Say "the control's own shape".
- **Targets** (l.401). STYLE §2 says the 28pt Mac floor "arrives later … Not now: 44 is the default everywhere", and every pressable part of the card (action, bar control, list rows, foot) is 44. Say "our elements keep their 44pt parts; 28pt is the floor for anything else". Also, `.controlSize(.regular)` doesn't by itself guarantee a 28pt target, so add `.frame(minWidth: 28, minHeight: 28).contentShape(…)`. That last point is inherited from STYLE's own mapping row.
- **SF Symbols as content icons** (l.415) is not in STYLE, which says content uses our set: a 2px square-cap stroke on a 24 grid. The five glyphs are one-line SVG paths in `icons.css` (for example `M7 17L17 7M8 7h9v9`). Porting them as `Path` with `StrokeStyle(lineWidth: 2, lineCap: .square)` reuses the same glyphs and doesn't invent a look. Otherwise, keep SF as a stand-in that the handoff lists as a gap.
- **`.tint(Color.accent)`** (l.389) and "system colours, tinted by our accent" (l.297). STYLE maps `--accent` to `AccentColor`, which macOS applies only when the user's accent setting is Multicolor. `.tint` overrides the user's choice, and until gate 3 it turns system controls ink. Either name it as a deliberate override or leave chrome untinted until gate 3.
- **"Per-app colour is a gate 3 decision"** (l.390) is invented. STYLE's gate 3 decides "tones, accent, dark" for the whole system. Reword to "colour arrives at gate 3".
- **States** (l.405). The list of state sources has nothing for *disabled*. Add `@Environment(\.isEnabled)`: a custom `ButtonStyle` has to read it to draw the dashed frame.
- **No mechanical gate for web UI.** `check.mjs` covers only `design/`, so `WebContent/*.css` is never checked. Add one grep for colour literals, `gradient`, `blur(`, `transition|animation|@keyframes`, `border-radius`. Add `\.opacity\(|phaseAnimator|keyframeAnimator` to the motion line (l.570) until gate 4: opacity is translucency (rule 2, "never opacity"), and both animators bypass `withAnimation`. Tested: both caught on the fixture.

Technical:
- **§3.4 LaunchAgent is incomplete, and its bugs came from the original.** The plist needs `Label` and `BundleProgram` (a path inside the bundle, per Apple forum samples), and build.sh has no step copying it to `Contents/Library/LaunchAgents/`. `KeepAlive` set to `true` "unconditionally keep[s] the job alive" (launchd.plist(5)), so the menu's Quit relaunches the app. For crash recovery use `<dict><key>SuccessfulExit</key><false/></dict>`. Registering both `mainApp` (§3.3) and an agent for the same binary starts two copies, so pick one.
- **§6.3 "Elsewhere under ~, non-sandboxed tools read freely"** overstates it. Apple also lists prompts for removable volumes, network volumes and file providers such as iCloud Drive (`NSRemovableVolumesUsageDescription`, `NSNetworkVolumesUsageDescription`, `NSFileProviderDomainUsageDescription`). Mail, Messages and Safari data still need Full Disk Access.
- **"Update the two cp lines"** (l.116). Only one `cp` names `flashcards.css`; the other place to update is the `<link>` at l.241.
- **`dist/` is generated** (`node design/tools/bundle.mjs`). If it's missing, build.sh aborts at l.103, so say so.
- **build.sh edge cases.** `cp Resources/Fonts/*` aborts when `Fonts/` exists but is empty (tested). `$(find …)` splits filenames that contain spaces.
- **`containerRelativeFrame` is attributed to the "SwiftUI mapping"** (l.28). It is in STYLE §6's skills table, not the mapping.

Scope (changes that weren't needed):
- Two changes go beyond design rules and real bugs and are missing from the v2 changelog: the default entry point moved from `main.swift`+AppDelegate to an `@main` SwiftUI App (§2, §3.1), and the LaunchAgent install moved to `SMAppService.agent`. Both are defensible.
- §0 changed "powerful, beautiful, and delightful" to "clear, pleasant". The checklist dropped "Typography hierarchy is clear at a glance". Neither conflicted with STYLE.
- `DESIGN=~/ClaudeCode-Tools/design` (l.14, l.72) appears nowhere in the design system or the uploads. Confirm the path with the owner.
- "The status item's menu is its menu bar … key equivalent shown" (l.185) isn't in STYLE. Key equivalents in a status menu fire only while that menu is open.

## Checked and fine

- Type.swift: every style matches the STYLE table: 32/600/−0.48, 24/500/−0.36, 16, 14 tabular `inkSoft`, 13/700/condensed/+1.04/upper, and 48/600/expanded/tabular/−1.44 (= −0.03em × 48). Floors 16/14/13, 62ch and 40ch also match.
- Modifier availability, from Apple's docs JSON: `fontWeight`, `fontWidth` and `tracking` as View modifiers macOS 13; `monospacedDigit()` macOS 12; `textCase` macOS 11; `Font.custom(_:size:relativeTo:)` macOS 11. All are fine on a macOS 14 floor; `containerRelativeFrame` is macOS 14.
- Color+Roles values match `color.wire.css` one for one: F4F4F4, FFFFFF, 141414, 505050, 8A8A8A, the six tones EBEBEB through AFAFAF, line/focus/accent = ink, onAccent = paper, onTones = ink. The Increase Contrast branch mirrors `prefers-contrast: more`.
- Color+Roles syntax: type-checked against stubs built from Apple's declarations (Swift 5 and 6 modes, no errors). Covered: multi-binding `static let a = x, b = y`, `static let line = ink`, `v >> 16 & 0xFF` = `(v>>16)&0xFF` (run: 244 227 210), the trailing closure for `NSColor(name:dynamicProvider:)` (10.15), and the comparison of `bestMatch(from:)`'s optional result (10.14) with `.accessibilityHighContrastAqua` (10.14). `Color(nsColor:)` is macOS 12.
- Space 4–64, lines 2 and 1, shadow offset 4,4 with no blur, grid 256/24, card padding 16/24, both motion curves, 150ms reduced-motion crossfade, no `bouncy`: all match STYLE §2/§4. The role names match README's gate-3 list. The seven rules, chrome vs content, glass, light only until gate 3, motion held until gate 4, and §5.8 Mac behaviour all match STYLE §1/§4.
- `WKPreferences.tabFocusesLinks` exists (macOS 10.12.4+): "whether pressing the tab key changes the focus to links and form controls".
- Accessibility has no usage key: none of Apple's 59 `*UsageDescription` keys covers it, and `AXIsProcessTrustedWithOptions` (10.9) is the route.
- The Desktop, Documents and Downloads keys exist (10.15). Apple says macOS prompts on first access without implied consent, and the key is optional but recommended.
- Ad-hoc signing and TCC: an ad-hoc designated requirement is the cdhash, which changes on every build; a certificate gives a stable one. A community report confirms the behaviour; I found no Apple page that states it.
- `actool` ships with Xcode, not the Command Line Tools (forum reports of `unable to find utility "actool"`). This matches STYLE.
- `ATSApplicationFontsPath` is "relative to the bundle's Resources folder" (Apple), so `Fonts` is correct.
- `SMAppService.agent(plistName:)` is macOS 13+. Apple: the plist "must correspond to a property list in the calling app's Contents/Library/LaunchAgents directory."
- `-parse-as-library`, tested: a single `@main` file without it fails with "'main' attribute cannot be used in a module that contains top-level code" and builds with it; multi-file builds work either way. swiftc accepts the `<arch>-apple-macos14.0` triple.
- build.sh: `${SIGN_ID:--}` and `${DESIGN:-…}` are safe under `set -u` (tested). The `sed` fill gives correct output. Dropping `--deep` is right. `if` blocks replace the fragile `&& cp`. `find` is needed for the `Theme/` subfolder. Only bash 3.2 features are used. The `design/dist` + `design/fonts` layout matches `dist/flashcards.css`'s `url("../fonts/archivo-latin-var.woff2")`.
- The Info.plist template fixes a real bug: `$(APP_NAME)` was never expanded, which broke `CFBundleExecutable`. It also adds `CFBundlePackageType`, `LSMinimumSystemVersion` and the real DTD.
- The gate greps are valid POSIX ERE, and BSD grep has `-r -n -E --include`. In `grep -v 'Theme/Color+Roles.swift'` the `+` is literal in BRE. `.whitespaces` doesn't match. The only false positive is `.fontWeight(.black)`, which is acceptable because 900 isn't a type style. Gates 2 and 3 catch what they list.
