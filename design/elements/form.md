# Form

Element 13 · v1.0 · gates 0–5 done (brief, wireframe, states, colour, motion, freeze) · page: `elements/form.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
Form's own spec.

## Brief

*Fields together, and what happens when they're wrong.*

- **Layout:** labels above controls, 24px between fields, groups in `fieldset`s, one column on a
  phone, two only where fields are short and related.
- **Required and optional:** mark the optional fields "(optional)"; required fields carry no
  asterisk and use `required` without `aria-required` duplication.
- **Validation:** only on submit or blur, never while typing; each wrong field gets Field's
  error; on submit, an error summary at the top (a card titled "Fix 2 things", with links to
  each field) takes focus.
- **The submit row:** the primary button last (at the end) on wide screens, full width first on a
  phone, with Cancel as a quiet button.
- **Variants:** the New deck form (name, description, card order, shuffle, cards per session,
  language), the same form with errors, and a one-field inline form (Rename deck).
- **Notes:** `autocomplete`, `inputmode` and `enterkeyhint` follow Field's spec; the on-screen
  keyboard must not cover the focused field (the scroll-padding finding).

## House rules

- **Form owns the space between things, not the things.** The layout, the optional mark, the
  summary and the submit row are Form's. Every field in it is still its own element (Field,
  Checkbox, Radio, Select, Stepper) with its own states. Form never restyles them.
- **One column.** Labels above, 24px (`--space-5`) between fields, at most 40rem wide: wider and
  the eye loses its place between a label and its field on a Mac. No form in the product has two
  short, related fields yet, so there is no two-column row.
- **The form is a container** (`container: form / inline-size`). The submit row stacks by the
  form's own width, not the window's, so a form in a narrow sheet on a Mac behaves like one on a
  phone.
- **Errors wait.** Nothing is checked while someone types. The browser decides what's wrong
  (`required`, `type`, `pattern`); `js/components/form.js` decides how it's shown. Without the
  script the browser's own validation still runs.
- **A switch never goes in a form.** Anything that waits for the submit button is a checkbox.
- **Shuffle is a card order, not a second control.** The brief lists both; "Shuffled" is one of
  Card order's options, and a separate Shuffle box would contradict it. The New deck form's
  checkbox is Show hints instead.

## Anatomy

| Part | Class | Spec |
| --- | --- | --- |
| Form | `.form` | `<form>`. Flex column, `gap: 24px`, `max-inline-size: 40rem`, `container: form / inline-size`. Every `input`, `select` and `textarea` in it gets `scroll-margin-block: 6rem 32px` (below). |
| Error summary | `.card` + `.form__summary` | A `<section tabindex="-1" aria-labelledby="…">` first in the form: a card with a `.card__body` holding the `.card__title` ("Fix 2 things") and a `.card__list` of links, one per problem, each a 44px row, underlined, with a 1px rule above the first. `hidden` until a submit finds something wrong. It rings on `:focus` (not only `:focus-visible`), because it takes focus from script after a click as often as after a key. |
| Field | `.field`, `.radio-group`, `.checkbox-group`, … | Each in Field's order: label, help, error, control. The error is in the markup with `hidden` (Form unhides it), so its words live in the HTML, not in script. |
| Optional mark | `.form__optional` | `<span>` inside the label: "(optional)", weight 400, `--ink-soft`. Inside the label, so a screen reader hears "Description (optional)". |
| Submit row | `.form__actions` | Flex, `gap: 12px`, 8px more above it than between fields. Markup order: Cancel (`.btn btn--quiet`, `type="button"`), then the primary (`.btn btn--primary`, `type="submit"`). Under 30rem of form width: `flex-direction: column-reverse`, so the buttons stretch to full width with the primary on top. From 30rem: a row, wrapping, at the end (`justify-content: flex-end`), primary last. |
| Inline | `.form--inline` | One field and its button on one line: a wrapping flex row, `align-items: flex-end` (the button lines up with the input, below the label and any error), `gap: 12px`. The field is `flex: 1 1 14rem`; the button keeps its width and drops under the field when they can't share a line. |

Markup, in order (the New deck form, shortened):

```html
<form class="form" action="…">
  <section class="card form__summary" id="new-summary" tabindex="-1"
           aria-labelledby="new-summary-title" hidden>
    <div class="card__body"><h2 class="card__title" id="new-summary-title">Fix 2 things</h2></div>
    <ul class="card__list" role="list"></ul>
  </section>

  <div class="field">
    <label class="field__label" for="new-name">Deck name</label>
    <p class="field__help" id="new-name-help">Shown on the deck's card.</p>
    <p class="field__error" id="new-name-error" hidden>
      <span class="ic ic--warning" aria-hidden="true"></span>Give the deck a name
    </p>
    <input class="field__input" id="new-name" name="name" type="text" required
           autocomplete="off" autocapitalize="sentences" enterkeyhint="next"
           aria-describedby="new-name-help">
  </div>

  <div class="field">
    <label class="field__label" for="new-about">
      Description <span class="form__optional">(optional)</span>
    </label>
    <textarea class="field__input" id="new-about" name="about" rows="3"></textarea>
  </div>

  <fieldset class="radio-group" aria-describedby="new-order-help">
    <legend class="field__label">Card order</legend>
    <p class="field__help" id="new-order-help">You can change it any time.</p>
    <p class="field__error" id="new-order-error" hidden>…Pick a card order</p>
    <!-- .radio options, each input required, the first with an id the summary links to -->
  </fieldset>

  <div class="form__actions">
    <button class="btn btn--quiet" type="button">Cancel</button>
    <button class="btn btn--primary" type="submit">Make deck</button>
  </div>
</form>
```

## Variants

Three. Shown live, with markup, in `elements/form.html` (2.1–2.3).

| Variant | Class | Use | Notes |
| --- | --- | --- | --- |
| New deck | `.form` + `.form__summary`, `.form__optional`, `.form__actions` | A screen of fields, sent with one button. | Deck name (required), Description (optional), Card order (radios, required, no default: a new deck has no right answer yet), Show hints (checkbox), Cards per session (Stepper) and Language (Select), then Cancel and Make deck. Live on the page. Cards per session's `pattern` checks 5–50 in fives. |
| With errors | the same, with the summary shown | What a submit with two things missing looks like (or what a server renders). | "Fix 2 things", linking to Deck name and to Card order's first radio. Deck name has `aria-invalid="true"` and the error first in its `aria-describedby`; the fieldset's `aria-describedby` starts with the group's error. A server-rendered page focuses the summary on load. |
| Inline | `.form--inline` | One field and its button: Rename deck. | No summary: one field's error is already in view. A click on the button sends focus back to the field, which reads the error; Return in the field can't move focus, so there the error takes `role="alert"` and is read as it appears, on every failed try (`form.js` hides it for a frame first). A secondary button, "Rename": it's rarely the main thing on its screen. Return sends it (`enterkeyhint="done"`). |

### Keyboard hints

As Field's spec (`elements/field.md`): Deck name is `autocomplete="off"`,
`autocapitalize="sentences"`, `enterkeyhint="next"` (another field follows; in the inline form,
`"done"`); Description is a multi-line field, `enterkeyhint="enter"`. Return in a text field
submits the form (the primary is its only submit button; Cancel is `type="button"`).

## States

A form's states are about time. The fields inside keep their own states (Field, Checkbox,
Radio).

| State | Trigger | Also |
| --- | --- | --- |
| Typing | input | Nothing is checked. No error appears, and none clears, while someone types. |
| Sent, wrong | a submit the browser finds invalid | `form.js` cancels the browser's bubble (`invalid` events, `preventDefault`), shows each wrong field's error (`hidden` off, `aria-invalid="true"` on a field's input, the error first in `aria-describedby` of the input or of a group's fieldset), fills the summary (title "Fix 1 thing" or "Fix N things", one link per problem with the error's own words), unhides it and focuses it. |
| Following a link | a click or Return on a summary link | The field's label (or a group's legend) scrolls to the top of the view and the caret goes into the field (or onto the group's first radio), so the question and the error are both in view. |
| Fixed | typing that makes a field showing an error right; or blur, or change on a radio or checkbox | The field is checked again; if it's right now, its error, `aria-invalid` and the error's id in `aria-describedby` go. Typing only ever clears an error, never raises one; clearing then rather than on blur keeps the submit button from moving 32px under the click that blurs the field. The summary stays as it was until the next submit, so nothing jumps under the reader. |
| Sent, right | a submit with nothing wrong | The browser submits. While the app saves, the primary takes Button's busy state (`aria-busy="true"`, a spinner, the label kept). |
| Forced colours | `(forced-colors: active)` | Nothing of Form's own: the summary is a card (its frame stays), errors are Field's (glyph and words), and buttons are Button's. |

`.is-focus` on the summary forces its focus ring for the page. It is not API.

### The script (`js/components/form.js`, shipped in `dist/flashcards.js`)

- It runs on every `form.form`. It never adds `novalidate`: it listens for the browser's own
  `invalid` events and cancels them, so without the script nothing changes and the browser's
  bubbles still work.
- A control's box is its `.field` or its group's `<fieldset>`, which holds one `.field__error`.
  A control with no such box (Show hints) is never marked.
- Radios are checked once per group; the summary links to the first radio of the group.
- The strings "Fix 1 thing" and "Fix N things" are in the script; the errors' words are in the
  markup.

## Accessibility

- The summary is a `<section>` named by its title. Focus moves to it, so a screen reader reads
  "Fix 2 things, region" and the links follow in the tab order. Each link's words are the error
  itself, so the list makes sense on its own.
- Each error is in its control's `aria-describedby`, first, so the fix is heard before the help.
  A group's error is in the fieldset's description, so it's heard on entering the group.
- A form with no summary (one field) has nowhere to send focus when Return is pressed in its
  field, so the error is `role="alert"` there and is read as it appears, again on each failed try.
- Required fields use `required` only: the browser exposes it, so `aria-required` would repeat
  it. Optional fields say "(optional)" in their label, so it's part of the name.
- No disabled submit button: people send the form and hear what's missing. A disabled button
  can't be focused and doesn't say why.
- Return submits from a text field; Cancel is a `type="button"`, so it's never the default.
- Every control scrolls into view with 6rem of room above it (`scroll-margin-block-start`), so
  its label and error are not hidden under a bar, and 32px below it.

**Right to left.** The submit row runs to the end of the line, so on a wide form the primary is
last and leftmost; under 30rem it is still on top. Field's, Checkbox's and Radio's parts follow the
line on their own.

## Platforms

- **Installed PWA:**
  - The submit row is full width with the primary on top, in reach of a thumb, whenever the form
    is under 30rem wide.
  - The on-screen keyboard: help and errors sit above each control (Field's order) and every
    control keeps 6rem of room above it when it scrolls into view. The app frame's
    `scroll-padding` (Frame, wave 3) and the keyboard inset (`interactive-widget`,
    `visualViewport`: PWA platform, wave 5) finish the job; Form doesn't size the viewport.
  - `enterkeyhint="next"` on every text field but the last.
- **Mac:**
  - Return submits (the primary is the form's only submit button); Escape should run Cancel,
    which is the app's job (a keydown on the form, or the sheet's own cancel action).
  - In a sheet or a narrow window the form is under 30rem, so its buttons stack, as on a phone.
    A Mac sheet's own buttons, if it uses system chrome, stay the system's.
  - With Keyboard navigation off, Tab reaches only the text fields; the summary's links and the
    buttons are reached with it on, or by clicking.
- **SwiftUI:**
  - A `ScrollView` with a `VStack(alignment: .leading, spacing: 24)` of our fields (label
    above), capped with `.frame(maxWidth: 640)`, rather than `Form`, whose grouped and column
    styles put labels beside fields.
  - Focus: `@FocusState` with an enum of fields; `.submitLabel(.next)` and `.onSubmit(of:_:)` move to
    the next field.
  - On Make deck, validate; if anything's wrong, show each field's error `Text` above it, show
    the summary at the top, and move VoiceOver there with `@AccessibilityFocusState`. Each
    summary row is a `Button` that sets the `@FocusState` field and calls
    `ScrollViewReader`'s `scrollTo(_:anchor: .top)`.
  - In a sheet: Cancel with `.keyboardShortcut(.cancelAction)` and Make deck with
    `.keyboardShortcut(.defaultAction)`; on the Mac, when the sheet uses system chrome, as
    toolbar items placed at `ToolbarItemPlacement.cancellationAction` and
    `ToolbarItemPlacement.confirmationAction`.

## Do and don't

- **Do** ask only what you need, in the order people think of it.
- **Do** mark the optional fields, not the required ones.
- **Do** write each error as the fix ("Give the deck a name") and use the same words in the
  summary.
- **Do** name the primary for what it does: "Make deck", not "Submit".
- **Don't** check while someone types, or show errors before the first submit.
- **Don't** disable the submit button until the form is valid.
- **Don't** put a switch in a form with Save, or two controls for one setting.

## Known limits

- The summary and the errors need `js/components/form.js`. Without it the browser's bubbles
  show one problem at a time, in the browser's words.
- On a phone the buttons are drawn in the reverse of their markup order (primary on top,
  Cancel under it), so a screen reader or a keyboard meets Cancel first there. The markup
  follows the wide layout, where a keyboard is likelier.
- "Fix N things" is English in the script; a translated app passes its own strings.
- The scroll margins are a floor, not a guarantee. Chromium centres a control it scrolls to on
  focus, so there the label was in view with or without them (measured at 390 by 700); they
  matter where focus scrolls to the nearest edge. Not checked in Safari or Firefox, or with a
  real on-screen keyboard.
- `.form__summary[hidden]` needs a `display: none` here, because Card's own `display` would beat
  the attribute (`field.css` does the same for `.field__error[hidden]`).
- Checked in Chromium only (with touch and forced-colours emulation), not on an iPhone, in
  Safari or in Firefox.
