# styleguide

The design system for our installed mobile PWAs and Mac-first apps: minimal, brutalist, friendly,
and not AI-looking, with usability first. Built one element at a time.

**Status:** v0.7, wireframe stage (greys, no motion). Twenty-six of 27 elements have passed gates
0–2: Card, actions and status (wave 1), choices and forms (wave 2), the app shell and
navigation (wave 3), and feedback and overlays (wave 4). Wave 5 (the PWA platform) is next.

| Path | What it is |
| --- | --- |
| `design/README.md` | Start here: the pipeline, the gates, the status of every element |
| `design/STYLE.md` | The spec: rules, tokens, elements, platforms (PWA, macOS, SwiftUI) |
| `design/index.html` | The hub: rules, tokens and the index of every element. Opens straight from disk |
| `design/elements/` | One page and one spec per element, the build contract, and every brief |
| `design/screens.html` | The test bed: phone and Mac screens built from the system, missing elements marked |
| `design/dist/` | What an app links: one CSS file, plus single-file copies of the sheet and the screens |
| `audit/` | How v0.2 was audited, fixed and verified: the brief, the plan and every report |

```
node design/tools/check.mjs     the gate: must pass before anything merges
node design/tools/bundle.mjs    rebuilds design/dist/
```

No build step, no dependencies. Node is only needed for the two tools.
