# Switch

Element 09 · gates 0–3 done (wireframe, states, colour) · page: `elements/switch.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Switch's own spec.

## Brief

*A setting that takes effect at once.*

- **Markup:** `<input type="checkbox" role="switch">`.
- **Look:** a pill track at least 44 by 24, a circle knob, and On/Off in words beside it, not in
  the track.
- **Variants:** with a label on the leading side and the switch trailing (the settings row);
  with help text.
- **Shared with every wave 2 control:** a native input restyled with `appearance: none`; the
  `<label>` carries the 44px target; help uses Field's parts; on uses the fill and never colour
  alone, and keeps a mark in forced colours (the knob's position).
- **Notes:** never inside a form with a Save button; a switch that doesn't act at once is a
  checkbox. Copy: Shuffle cards, Daily reminder.

## House rules

- **It acts the moment it flips.** That is the whole difference from a checkbox. So it lives on
  settings screens, never in a form with Save or Cancel, and the effect shows straight away
  (or the app says where it will show).
- A pill and a circle (`--radius-pill`): it acts (rule 3).
- **On never leans on colour.** Three things change together: the knob moves to the end, the
  track fills with ink, and the word beside it reads "On". In forced colours the position and
  the word still carry it.
- **The state words are `aria-hidden`.** `role="switch"` already says "on" or "off", and the
  name ("Daily reminder") must not change with the state.
- `--fill` is the track's ground (ink when on, or while pressed); the knob takes the other
  colour. `--lift` is a 2px hard shadow: hover and focus.
- Reads roles only. States change instantly. `:hover` only inside `@media (hover: hover)`.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Switch | `.switch` | The setting: a flex column holding the row and its help. |
| Row | `.switch__label` | The `<label>` and the target: the whole row. Flex, wraps, `align-items: center`, `gap: 4px 12px`, `min-block-size: 44px`, `padding-block: 8px` (8 + the 28px track + 8 = 44). `--type-body`, ink, `cursor: default`, `touch-action: manipulation`. |
| Words | `.switch__text` | The setting's name, and the switch's accessible name. `flex: 1 1 0%`: it takes what's left and wraps between words before the switch gives up its place. |
| Control | `.switch__control` | Keeps the word and the track together at the end of the row (`margin-inline-start: auto`), `gap: 12px`, so the focus ring (6px off the track) clears the word. When the row is too narrow for both (a phone at large text sizes) it drops to its own line, still at the end. |
| Track | `.switch__input` | The input, `appearance: none`, `role="switch"`. 52×28px (3.25rem × 1.75rem), `2px solid var(--line)`, `--radius-pill`, 2px padding: a 44 by 20 lane for the knob. Ground: `color-mix()` of ink and paper by `--fill`, clipped to the padding box. `box-shadow: var(--shadow-lift)`. |
| Knob | `.switch__input::before` | A 20px circle in the other colour (ink on paper, paper on ink). `justify-items: start` puts it at the start; on, `end` (logical, so it follows the writing direction). It travels 24px, more than its own width. |
| State | `.switch__state` with `.switch__on`, `.switch__off` | "On" and "Off", both in the markup, sharing one grid cell so the track never shifts; the one that doesn't apply is `visibility: hidden`. `--type-meta`, `--ink-soft`. In the markup after the input, so `+` can read `:checked` without `:has()`; drawn before the track with `order: -1`. `aria-hidden="true"`. |
| Help | `.switch__help` | A `<p>` under the row: `--type-meta`, `--ink-soft`, at most `--measure`, 8px under it. Tied with `aria-describedby`. |

Markup, in order:

```html
<div class="switch">
  <label class="switch__label">
    <span class="switch__text">Daily reminder</span>
    <span class="switch__control">
      <input class="switch__input" type="checkbox" role="switch" name="reminder"
             aria-describedby="reminder-help">
      <span class="switch__state" aria-hidden="true">
        <span class="switch__on">On</span><span class="switch__off">Off</span>
      </span>
    </span>
  </label>
  <p class="switch__help" id="reminder-help">At 6pm, if you haven't studied today.</p>
</div>
```

## Variants

Two, both the settings row. Shown live, with markup, in `elements/switch.html` (2.1–2.2).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| Settings row | `.switch` + `.switch__label`, `.switch__text`, `.switch__control`, `.switch__input`, `.switch__state` | A deck setting that changes the next session at once: Shuffle cards, Daily reminder. | Rows stack with no gap: each is already 44px. |
| With help | `.switch__help` | When the name needs a line about what it does. | Under the row, outside the label; the row stays a full 44px target. |

## States

| State | Trigger | `--lift` | `--fill` | Also |
| --- | --- | --- | --- | --- |
| Off | none | 0 | 0 | Paper track, 2px ink frame, ink knob at the start, "Off". |
| Hover | `.switch__label:hover` on an enabled control, only inside `@media (hover: hover)` | 1 | – | Anywhere on the row: a 2px hard shadow under the track. |
| Focus | `:focus-visible` | 1 | – | The hover look plus base.css's ring, which follows the pill. |
| On | `:checked` | – | 1 | Ink track, paper knob at the end, "On". |
| Pressed | `.switch__label:active` on an enabled control | 0 | 1 | Down, inked, and the knob stretches to 26px towards where it's going, as a thumb squashes it. |
| Disabled | `:disabled` | 0 | – | Dashed `--ink-faint` frame; the knob goes faint (off) or the track does (on); the words and the state go faint; the help says why. |
| Invalid | – | | | None. A switch has no wrong answer; anything that can be wrong belongs in a form, with a checkbox. |
| Forced colours | `(forced-colors: active)` | | | The track opts out and paints system colours: off is a `CanvasText` frame and knob on `Canvas`; on is a `Highlight` track with a `HighlightText` knob at the end; hover and press on an off switch turn the frame `Highlight`; the ring is `CanvasText`; disabled is `GrayText` with the knob still at its end. |

`.is-hover`, `.is-focus` and `.is-active` on the input force a state for the page and for
tests. They are not API.

## Accessibility

- `role="switch"` on a checkbox: screen readers say "switch, on" or "off", not "checked". The
  native checkbox still gives Space, the label and the form value.
- The name is the words, and it never changes. The state words are `aria-hidden`, so the name
  isn't "Daily reminder On".
- The whole row is the target; a tap on the words flips it.
- A switch that needs a permission (notifications) asks in our words first; if the permission
  is refused, the switch is disabled and its help says how to allow it.
- Disabled switches leave the tab order: say why in visible help.
- The row is at least 44px tall, measured at 100% and 200% text. The track is 52 by 28, above
  the brief's 44 by 24.

## Platforms

- **Installed PWA:** the whole row is the target, as in iOS Settings. Pressed fills the track
  at once (with the shell's `touchstart` listener on iOS). Daily reminder needs notification
  permission: the PWA platform (wave 5) owns the pre-prompt.
- **Mac:** Space flips it. With Keyboard navigation off, Safari Tabs past it (as with every
  non-text control); settings are also reachable from the menu bar. Switches in system chrome
  (a Settings window) stay the system's.
- **SwiftUI:** a `Toggle(isOn:)` with a custom `ToggleStyle`: an `HStack` of
  `configuration.label`, a `Spacer()`, the state `Text` with `.accessibilityHidden(true)`, and
  a `Capsule()` 52×28 with `.strokeBorder(.line, lineWidth: 2)` holding a 20pt `Circle()`,
  aligned `Alignment.leading` or `Alignment.trailing` by `configuration.isOn`. The whole row is a `Button`
  calling `configuration.isOn.toggle()`, with `.frame(minHeight: 44)`, `.contentShape(.rect)`,
  `.accessibilityAddTraits(.isToggle)` (iOS 17) and the state as `.accessibilityValue(_:)`. In
  system chrome, `.toggleStyle(.switch)`.

## Do and don't

- **Do** name the setting, not the action: "Daily reminder", not "Turn on reminders".
- **Do** make it act at once, and show the effect.
- **Don't** put a switch in a form with Save or Cancel: use a checkbox.
- **Don't** write On or Off inside the track, or let the word be the only change.
- **Don't** use a switch for a choice between two named things ("Front" or "Back"): that's a
  segmented control.

## Known limits

- The knob is placed with `justify-items`, not a transform, so it follows the writing direction
  for free. Gate 4, which can only move things with `transform`, will need a `translate` and an
  RTL rule instead.
- The disabled row's faint words use `:has()`. Without it the words stay ink; the dashed track
  and the help still show it.
- Checked in Chromium only (with touch and forced-colours emulation), not on an iPhone, in
  Safari or in Firefox.
