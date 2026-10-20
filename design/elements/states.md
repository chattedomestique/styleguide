# Empty, loading and error

Element 26 · gates 0–2 done (wireframe, states) · page: `elements/states.html`

The rules, tokens and platforms every element follows are in `../STYLE.md`. This file is the
spec for the patterns a screen uses before there's anything, and when something fails.

## Brief

*What a screen shows before there's anything, and when something fails.*

- **Patterns, not new parts,** built from Card, Button, Spinner and Banner:
  - *empty*: a ghost card that offers the first step ("No decks yet. Make your first deck.");
  - *empty search*: "No decks match 'hexa'." with Clear search;
  - *loading*: the spinner and words, shown only after about 300ms (a pattern note; the delay
    is gate 4), with no shimmer or skeleton boxes;
  - *failed*: a plain card that says what happened, with Try again;
  - *offline*: cached content plus the offline banner;
  - *first run*: one screen that explains in one line and offers one action.
- **The page:** each as a phone-sized frame, using the sheet's device frames.
- **Notes:** never blank; every state has a way forward.

## House rules

- **Never blank** (`STYLE.md` §4). Every state says what's going on, in the place the content
  would be, and offers a way forward.
- **No new look.** A ghost card means "nothing here yet", a plain card holds a failure, the
  spinner means "working on it", the banner is news about the whole screen. Each keeps its own
  element's states.
- **Keep the bars.** A state is the content of a screen. The top bar's way back and the tab bar
  stay, so nothing is a dead end (first run is the one screen with neither, on purpose).
- **Say it once.** One failure, one message: a failed card when there's nothing to show, a
  banner when there is.
- **No motion.** Each appears in place. The loading delay is timing, so it waits for gate 4.

## Anatomy

One new class. Everything else is another element's, used as its spec says.

| Part | Class | Spec |
| --- | --- | --- |
| State | `.state` | A one-column grid, `12px` between its children, at most `--measure` wide. It keeps a state's words next to its way forward, closer than the scroll region's 32px between things. Draws nothing. |
| Words | `.t-body` (or `.t-heading` on first run) | One short line: what's going on. |
| Way forward | `.card--ghost`, `.btn` in a `.btn-row`, `.card__foot` | The next step. |

```html
<div class="state">
  <p class="t-body">No decks yet.</p>
  <a class="card card--ghost" href="…">
    <span class="card__action" aria-hidden="true"><span class="ic ic--plus"></span></span>
    <span class="card__title">Make your first deck</span>
  </a>
</div>
```

## Variants

The six patterns, each on the Decks screen of a phone (Frame, a root Top bar, the Tab bar), with
markup, in `elements/states.html` under Patterns (1.1–1.6).

| Pattern | Built from | Use | Notes |
| --- | --- | --- | --- |
| Empty | `.state`: "No decks yet." (`.t-body`) and a `.card--ghost` link, "Make your first deck" | Nothing here yet. | The ghost card stands where the first deck will go: dashed means empty, and the whole card is the link. Its name is the step, not the state. |
| Empty search | Field's search under the top bar; `.state`: "No decks match “hexa”." (`.t-body`, `role="status"`) and Clear search (`.btn` in a `.btn-row`) | A search found nothing. | Quote what was searched for. Clear search does what the field's clear button does: empties the field, puts focus back in it, brings the decks back. The line is a status, kept in the markup, so its words are heard as they change without leaving the field. |
| Loading | `.spinner` with `role="status"`: "Loading decks…" | Working on it, long enough to notice. | Where the content will be. Only after about 300ms (gate 4 sets it), so a quick load never flashes. No shimmer, no skeleton boxes: they move, and they promise a layout that may not come. |
| Failed | a plain `.card` with `role="alert"`: `.card__title` "Couldn't load your decks", `.card__text` "If trying again doesn't work, close the app and open it again.", a `.card__foot` holding a `.btn` "Try again" | It didn't load and there's nothing to show instead. | An alert, because nothing on the screen works until it does. Try again goes busy (Button's `aria-busy`) and the card stays until something replaces it. Never "Something went wrong" on its own. |
| Offline | Banner's offline band first in the scroll region, then the decks on this device (`.list`) | No connection. | Offline is not an error: show what's on the device. The band stays while it's true, with no close, and scrolls away with the decks. |
| First run | `.frame--task` with no top bar; `.state`: a `.t-heading` and one `.t-body` line; a `.btn--primary.btn--block` link in the bottom slot | The very first screen. | One line, one action, nowhere to wander off to. Never shown again once a deck exists. |

## States

How one screen moves between the patterns. Nothing moves on screen until gate 4.

| Moment | What shows | What's heard | Focus |
| --- | --- | --- | --- |
| Opening, the first 300ms | Nothing new: the bars are already there. | Nothing. | Where it was. |
| Still loading | The spinner and "Loading decks…". | "Loading decks…", politely, once. | Where it was. |
| Loaded | The decks, in place of the spinner. | Nothing: they're there when you look. | Where it was. |
| Loaded, nothing there | "No decks yet." and the ghost card. | Nothing. | Where it was; the ghost card is the next stop. |
| Didn't load | The plain card, Try again in its foot. | At once (`role="alert"`). | Where it was; Try again is the next stop. |
| Trying again | The card stays; Try again goes busy, its label kept. | Nothing. | On Try again. When the decks come, on the scroll region (the screen's `<main>`, `tabindex="-1"`), so it isn't lost. |
| Searching, no match | The no-match line and Clear search, under the field. | The line, politely, each time the list changes. | In the field. |
| Search cleared | The field empties; the decks come back. | Nothing. | Back in the field. |
| Offline | The offline band first, the decks on this device under it. | "You're offline. Changes are saved on this device.", politely, once. | Where it was. |
| Online again | The band goes. | Nothing. | Where it was. |
| First run | One line, one action, no bars. | The heading and the line, in order. | The action is the first stop. |

At 200% text each pattern wraps and grows taller, never wider. In forced colours the cards' and
the banner's frames and rules, the ghost card's dashes and every glyph stay, in system colours.

## Accessibility

- Live regions only where something changes while you're there: the spinner's line (status), the
  search's line (status, kept in the markup so it can speak), the offline band (status) and the
  failed card (alert, announced on insertion). Arriving content is not announced.
- Focus never jumps to a state. The one exception keeps focus from being lost: when Try again's
  card is replaced, focus goes to the scroll region.
- The ghost card is one link whose name is the step ("Make your first deck"); "No decks yet." is
  the line before it, read first.
- Every way forward is a 44px target: the ghost card, the buttons, the field's clear button.
- Words say it all. The spinner never stands alone; the failed card says what happened and what
  else to try; nothing leans on colour.

## Platforms

- **Installed PWA:** never blank (`STYLE.md` §4): empty is a ghost card offering the first step;
  an error is a plain card with Try again in its foot. Offline, read from the device and show it
  under the offline band: don't spin on the network. First run is the screen the installed app
  opens to before there's a deck.
- **Mac:** the same patterns in the window's content. The menu bar keeps every command (File ›
  New Deck, ⌘N), so the ghost card is never the only way to the first deck.
- **SwiftUI:** `ContentUnavailableView` is the native empty state; we draw ours from the cards
  instead, because it centres a large symbol, which is decoration here (rule 7). Loading is
  `ProgressView("Loading decks…")` shown after the delay; empty search is the same `.state` stack
  under `.searchable(text:)`; offline is Banner's first row.

## Do and don't

- **Do** say what's going on where the content would be, and offer the way forward.
- **Do** keep the bars, so every state has its way back.
- **Do** wait about 300ms before showing the spinner (gate 4 sets the timing).
- **Don't** leave a screen blank, or shimmer, or draw skeleton boxes.
- **Don't** say "Something went wrong" on its own, or "Oops".
- **Don't** say one failure twice: a banner and a failed card.

## Known limits

- The 300ms delay before the spinner is the app's, and not shown on the page: it is timing, which
  waits for gate 4.
- Clear search and Try again need the app's script; on the page they are specimens.
- The search's status line must be in the markup before the search runs, or its first words may
  not be heard; the page shows it filled.
- Checked in Chromium only, not with a screen reader, in Safari or in Firefox.
