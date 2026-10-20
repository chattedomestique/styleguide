# styleguide

The design system for our installed mobile PWAs and Mac-first apps: minimal, brutalist, friendly,
and not AI-looking, with usability first. Built one element at a time.

**Status:** v0.8, wireframe stage (greys, no motion). All 27 elements have passed gates 0–2:
Card, actions and status (wave 1), choices and forms (wave 2), the app shell and navigation
(wave 3), feedback and overlays (wave 4) and the PWA platform (wave 5), with a starter app in
`design/pwa/` that installs and works offline. Next: colour and dark mode for everything (wave 6).

| Path | What it is |
| --- | --- |
| `design/README.md` | Start here: the pipeline, the gates, the status of every element |
| `design/STYLE.md` | The spec: rules, tokens, elements, platforms (PWA, macOS, SwiftUI) |
| `design/index.html` | The hub: rules, tokens and the index of every element. Opens straight from disk |
| `design/elements/` | One page and one spec per element, the build contract, and every brief |
| `design/screens.html` | The test bed: phone and Mac screens built from the system, missing elements marked |
| `design/pwa/` | The starter app: installs, works offline, updates on Reload. Serve it to try it |
| `design/dist/` | What an app links: the CSS and JS (and their min files), plus single-file copies of the sheet and the screens |
| `audit/` | How v0.2 was audited, fixed and verified: the brief, the plan and every report |

```
node design/tools/check.mjs     the gate: must pass before anything merges
node design/tools/bundle.mjs    rebuilds design/dist/ and checks the size budget
node design/tools/serve.mjs     serves design/ at http://localhost:8000/ (the starter is /pwa/)
```

No build step, no dependencies. Node is only needed for the tools.
